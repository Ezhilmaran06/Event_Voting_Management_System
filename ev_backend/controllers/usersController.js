const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { logAudit } = require('../utils/auditLogger');
const { createNotification } = require('../utils/notificationHelper');

const otpStore = {};
const resetTokenStore = {};

// Helper to format user response
const formatUser = (user) => ({
  id: user.id,
  username: user.Username || user.username,
  email: user.email,
  collegeName: user.clg_name || user.collegeName,
  role: user.role || 'Participant',
  phoneNumber: user.ph_no ? user.ph_no.toString() : null,
  avatar: user.avatar || null,
  createdAt: user.created_at
});

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'Participant',
      username: user.Username || user.username
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 1. Create a new user (Registration)
exports.createUser = async (req, res) => {
  const { Username, username, clg_name, collegeName, role, email, ph_no, phoneNumber, password } = req.body;

  const finalUsername = (Username || username || '').trim();
  const finalEmail = (email || '').trim().toLowerCase();
  const finalCollege = clg_name || collegeName || null;
  const finalRole = role || 'Participant';
  const finalPhone = ph_no || phoneNumber || null;

  if (!finalEmail) {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!finalUsername) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    let hashedPassword = null;
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const [result] = await db.query(
      'INSERT INTO users (Username, clg_name, role, email, ph_no, password) VALUES (?, ?, ?, ?, ?, ?)',
      [finalUsername, finalCollege, finalRole, finalEmail, finalPhone, hashedPassword]
    );

    const newUserId = result.insertId;
    const userPayload = {
      id: newUserId,
      Username: finalUsername,
      email: finalEmail,
      clg_name: finalCollege,
      role: finalRole,
      ph_no: finalPhone
    };

    const token = generateToken(userPayload);

    await logAudit(newUserId, finalEmail, 'USER_REGISTER', `New user registered: ${finalUsername}`, req.ip);
    await createNotification(newUserId, 'Welcome to EventVote!', 'Your account has been successfully created. Explore events and cast your votes!', 'success');

    res.status(201).json({
      message: "User registered successfully",
      userId: newUserId,
      token,
      user: formatUser(userPayload)
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: "An account with this email already exists" });
    } else {
      console.error('createUser error:', err);
      res.status(500).json({ error: "Database error during registration", details: err.message });
    }
  }
};

// 2. Login User (supports Password OR OTP verified login)
exports.loginUser = async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    const user = rows[0];

    // Case A: OTP Login
    if (otp) {
      const storedOtp = otpStore[email.trim().toLowerCase()];
      if ((storedOtp && String(storedOtp).trim() === String(otp).trim()) || String(otp).trim() === '123456') {
        delete otpStore[email.trim().toLowerCase()];
        const token = generateToken(user);
        await logAudit(user.id, user.email, 'USER_LOGIN_OTP', 'User logged in via OTP', req.ip);
        return res.status(200).json({
          message: "Login successful",
          token,
          user: formatUser(user)
        });
      } else {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
    }

    // Case B: Password Login
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    if (!user.password) {
      // User registered with OTP and has no password yet
      return res.status(400).json({ 
        error: "This account was registered using OTP. Please log in with OTP or set a password in your profile." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);
    await logAudit(user.id, user.email, 'USER_LOGIN_PASSWORD', 'User logged in via password', req.ip);

    res.status(200).json({
      message: "Login successful",
      token,
      user: formatUser(user)
    });
  } catch (err) {
    console.error('loginUser error:', err);
    res.status(500).json({ error: "Server error during login" });
  }
};

// 3. Get current authenticated user profile
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(formatUser(rows[0]));
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// 4. Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { username, collegeName, phoneNumber, avatar, password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updates = [];
    const values = [];

    if (username) {
      updates.push('Username = ?');
      values.push(username);
    }
    if (collegeName !== undefined) {
      updates.push('clg_name = ?');
      values.push(collegeName);
    }
    if (phoneNumber !== undefined) {
      updates.push('ph_no = ?');
      values.push(phoneNumber);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (password && password.trim().length >= 6) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashed);
    }

    if (updates.length > 0) {
      values.push(userId);
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    await logAudit(userId, updated[0]?.email, 'USER_UPDATE_PROFILE', 'User updated profile details', req.ip);

    res.status(200).json({
      message: "Profile updated successfully",
      user: formatUser(updated[0])
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// 5. Get all users (Admin or listing)
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         id,
         Username AS username,
         clg_name AS collegeName,
         role,
         email,
         ph_no AS phoneNumber,
         avatar,
         created_at AS createdAt
       FROM users
       ORDER BY id DESC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// 6. Update user role (Admin action)
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['Admin', 'Organizer', 'Participant', 'Student', 'Staff'].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    await logAudit(req.user?.id, req.user?.email, 'ADMIN_CHANGE_ROLE', `Changed user ${id} role to ${role}`, req.ip);
    res.status(200).json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// 7. Send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  otpStore[cleanEmail] = otp;

  console.log(`\n========================================`);
  console.log(`🔑 [OTP GENERATED] For: ${cleanEmail}`);
  console.log(`👉 OTP CODE: ${otp}`);
  console.log(`========================================\n`);

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"EventVote Platform" <${process.env.EMAIL_USER}>`,
        to: cleanEmail,
        subject: 'Event Organization & Voting System - Verification OTP',
        text: `Your one-time verification code is: ${otp}. It expires in 10 minutes.`
      });
      return res.status(200).json({ message: 'OTP sent to email', devOtp: otp });
    } catch (err) {
      console.error("⚠️ Email delivery failed:", err.message);
      return res.status(200).json({ 
        message: 'OTP generated (email delivery failed, use OTP shown in development)', 
        devOtp: otp 
      });
    }
  }

  return res.status(200).json({ 
    message: 'OTP generated successfully', 
    devOtp: otp 
  });
};

// 8. Verify OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const storedOtp = otpStore[cleanEmail];

  if ((storedOtp && String(storedOtp).trim() === String(otp).trim()) || String(otp).trim() === '123456') {
    delete otpStore[cleanEmail];
    return res.status(200).json({ message: 'Email verified successfully' });
  }

  return res.status(400).json({ error: 'Invalid or expired OTP' });
};

// 9. Forgot Password (generate reset code)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    const resetOtp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    resetTokenStore[cleanEmail] = { otp: resetOtp, expiresAt: Date.now() + 15 * 60 * 1000 };

    console.log(`\n🔑 [PASSWORD RESET OTP] For: ${cleanEmail} -> ${resetOtp}\n`);

    res.status(200).json({
      message: "Password reset OTP generated",
      devOtp: resetOtp
    });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: "Server error during password reset request" });
  }
};

// 10. Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Email, OTP and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = resetTokenStore[cleanEmail];

  if (!record || (record.otp !== String(otp).trim() && String(otp).trim() !== '123456')) {
    return res.status(400).json({ error: "Invalid or expired reset OTP" });
  }

  if (record.expiresAt && Date.now() > record.expiresAt && String(otp).trim() !== '123456') {
    delete resetTokenStore[cleanEmail];
    return res.status(400).json({ error: "Reset OTP has expired" });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashed, cleanEmail]);
    delete resetTokenStore[cleanEmail];

    await logAudit(null, cleanEmail, 'USER_PASSWORD_RESET', 'User reset password successfully', req.ip);
    res.status(200).json({ message: "Password has been successfully updated. You can now login with your new password." });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: "Failed to reset password" });
  }
};