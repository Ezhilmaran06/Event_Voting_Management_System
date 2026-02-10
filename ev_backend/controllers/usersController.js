const db = require('../db');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const otpStore = {};
const verifiedEmails = {};

// Create a new user
exports.createUser = async (req, res) => {
  const { Username, clg_name, role, email, ph_no } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const [result] = await db.query(
      'INSERT INTO users (Username, clg_name, role, email, ph_no) VALUES (?, ?, ?, ?, ?)',
      [Username, clg_name, role, email, ph_no]
    );

    res.status(201).json({ message: "User created", userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: "Email already exists" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         id,
         Username AS username,
         clg_name AS collegeName,
         role,
         email,
         ph_no AS phoneNumber
       FROM users
       ORDER BY id ASC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};


exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  otpStore[email] = otp;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  console.log("user details ", process.env.EMAIL_USER, process.env.EMAIL_PASS)
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Event organization and voting system',
    text: `Your OTP is: ${otp}`
  };

  try {
    console.log("   Sending OTP to:", email);
    await transporter.sendMail(mailOptions);
    console.log(" OTP sent successfully to:", email);
    res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    console.error("    Error sending OTP:", err);
    res.status(500).json({ error: 'OTP sending failed', details: err.message });
  }

};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  console.log(email, otp);
  console.log(otpStore[email]);
  if (otpStore[email] == otp) {
    delete otpStore[email];
    verifiedEmails[email] = true;
    res.status(200).json({ message: 'Email verified' });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
};