import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import "./Login.css";
import { fetchUsers, sendOtp, verifyOtp } from "../services/authservice";

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // for inline messages
  const [messageType, setMessageType] = useState("error"); // for styling

  // Handle OTP request
  const handleGetOtp = async () => {
    setMessage("");
    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      // Check if user exists
      const users = await fetchUsers();
      const user = users.find((u) => u.email === email);

      if (!user) {
        setMessage("Email not registered. Please sign up first.");
        setMessageType("error");
        return;
      }

      // Send OTP via backend
      const res = await sendOtp(email);
      setOtpSent(true);
      if (res && res.devOtp) {
        setOtpInput(res.devOtp);
        setMessage(`✅ OTP sent! (Code: ${res.devOtp})`);
      } else {
        setMessage(`✅ OTP sent to ${email}`);
      }
      setMessageType("success");
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP login
  const handleLogin = async () => {
    setMessage("");
    if (!otpSent) {
      setMessage("Please click 'Get OTP' first.");
      setMessageType("error");
      return;
    }

    if (!otpInput.trim()) {
      setMessage("Please enter the OTP.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      await verifyOtp(email, otpInput);

      // Fetch user data for session
      const users = await fetchUsers();
      const user = users.find((u) => u.email === email);

      if (user) {
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          collegeName: user.collegeName,
          role: user.role,
          phoneNumber: user.phoneNumber,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem("currentUser", JSON.stringify(userData));

        setMessage("✅ Login Successful!");
        setMessageType("success");

        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } else {
        setMessage("User not found. Please try again.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="title">Email OTP Login</h2>
        <p className="description">
          Enter your email to receive a one-time password.
        </p>

        <label className="label">Email</label>
        <div className="inline-row">
          <div className="input-icon-wrapper">
            <Mail className="input-icon" />
            <input
              className="input input-with-icon"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent || loading}
            />
          </div>
          <button
            className="btn-otp"
            onClick={handleGetOtp}
            disabled={otpSent || loading}
          >
            {loading ? "Loading..." : "Get OTP"}
          </button>
        </div>

        {otpSent && (
          <>
            <label className="label">Enter OTP</label>
            <div className="input-icon-wrapper">
              <KeyRound className="input-icon" />
              <input
                className="input input-with-icon"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                disabled={loading}
              />
            </div>
            <button
              className="btn-login"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        )}

        {message && (
          <p className={`message ${messageType === "error" ? "error" : "success"}`}>
            {message}
          </p>
        )}

        <p className="signup-text">
          New User? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
