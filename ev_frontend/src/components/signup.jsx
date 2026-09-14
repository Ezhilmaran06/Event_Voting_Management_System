import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import "./signup.css";
import { fetchUsers, sendOtp, verifyOtp, createUser } from "../services/authservice";

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const SignUp = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    collegeName: "",
    role: "",
    mobileNumber: "",
    email: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState({}); // field-specific messages
  const [generalMessage, setGeneralMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessages({ ...messages, [e.target.name]: "" }); // clear message on change
    setGeneralMessage(null);
  };

  // Step 1: Send OTP
  const handleGetOtp = async () => {
    setMessages({});
    setGeneralMessage(null);

    if (!isValidEmail(form.email)) {
      setMessages({ ...messages, email: "Please enter a valid email." });
      return;
    }

    try {
      setLoading(true);
      const users = await fetchUsers();
      const existingUser = users.find((u) => u.email === form.email);
      if (existingUser) {
        setMessages({ ...messages, email: "Email already registered. Please login." });
        return;
      }

      await sendOtp(form.email);
      setOtpSent(true);
      setGeneralMessage({ text: `✅ OTP sent to ${form.email}`, type: "success" });
    } catch (err) {
      setGeneralMessage({ text: err.message || "Failed to send OTP.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setMessages({});
    setGeneralMessage(null);

    if (!otpSent) {
      setGeneralMessage({ text: "Please request OTP first.", type: "error" });
      return;
    }
    if (!form.otp.trim()) {
      setMessages({ ...messages, otp: "Please enter the OTP." });
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(form.email, form.otp);
      setOtpVerified(true);
      setGeneralMessage({ text: "✅ OTP verified successfully!", type: "success" });
    } catch (err) {
      setGeneralMessage({ text: err.message || "OTP verification failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessages({});
    setGeneralMessage(null);

    // Basic validation
    const newMessages = {};
    if (!form.username) newMessages.username = "Username is required.";
    if (!form.collegeName) newMessages.collegeName = "College name is required.";
    if (!form.role) newMessages.role = "Please select your role.";
    if (!form.mobileNumber) newMessages.mobileNumber = "Mobile number is required.";
    if (!form.email) newMessages.email = "Email is required.";
    if (!otpVerified) newMessages.otp = "Please verify OTP before signing up.";

    if (Object.keys(newMessages).length > 0) {
      setMessages(newMessages);
      return;
    }

    try {
      setLoading(true);
      await createUser({
        Username: form.username,
        clg_name: form.collegeName,
        role: form.role,
        ph_no: form.mobileNumber,
        email: form.email,
      });

      setGeneralMessage({ text: "✅ Registration successful! Redirecting to login...", type: "success" });
      setTimeout(() => navigate("/", { state: { username: form.username } }), 1000);
    } catch (err) {
      setGeneralMessage({ text: err.message || "Registration failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/");
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <GraduationCap className="signup-icon" />
          <h2 className="signup-title">User Registration</h2>
          <p className="signup-description">
            Create your account to connect and learn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Username */}
          <div className="form-group">
            <label>Username</label>
            <input name="username" placeholder="johndoe99" value={form.username} onChange={handleChange} />
            {messages.username && <p className="error">{messages.username}</p>}
          </div>

          {/* College Name */}
          <div className="form-group">
            <label>College Name</label>
            <input name="collegeName" placeholder="State University" value={form.collegeName} onChange={handleChange} />
            {messages.collegeName && <p className="error">{messages.collegeName}</p>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label>I am a...</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="">Select your role</option>
              <option value="Student">Student</option>
              <option value="Staff">Staff</option>
            </select>
            {messages.role && <p className="error">{messages.role}</p>}
          </div>

          {/* Mobile */}
          <div className="form-group">
            <label>Mobile Number</label>
            <input name="mobileNumber" type="tel" placeholder="9876543210" value={form.mobileNumber} onChange={handleChange} maxLength={10} />
            {messages.mobileNumber && <p className="error">{messages.mobileNumber}</p>}
          </div>

          {/* Email + OTP */}
          <div className="form-group otp-row">
            <div className="otp-input">
              <label>Email</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} disabled={otpSent || loading} />
              {messages.email && <p className="error">{messages.email}</p>}
            </div>
            <button type="button" className="btn-outline" onClick={handleGetOtp} disabled={otpSent || loading}>
              {loading ? "Sending..." : "Get OTP"}
            </button>
          </div>

          {otpSent && (
            <div className="form-group otp-row">
              <div className="otp-input">
                <label>Enter OTP</label>
                <input name="otp" placeholder="123456" value={form.otp} onChange={handleChange} maxLength={6} disabled={otpVerified} />
                {messages.otp && <p className="error">{messages.otp}</p>}
              </div>
              <button type="button" className="btn-outline" onClick={handleVerifyOtp} disabled={otpVerified}>
                {otpVerified ? "Verified ✅" : "Verify OTP"}
              </button>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={!otpVerified || loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          {generalMessage && (
            <p className={generalMessage.type === "error" ? "error" : "success"}>
              {generalMessage.text}
            </p>
          )}

          <div className="login-redirect">
            <p>Already a user?</p>
            <button type="button" className="btn-outline" onClick={handleGoToLogin}>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
