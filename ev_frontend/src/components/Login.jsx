import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import {
  Mail, Lock, KeyRound, Eye, EyeOff, LogIn, Sparkles,
  ShieldCheck, ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useEvent();
  const { showToast } = useToast();

  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp + new password

  // Handle password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      return showToast('Please enter a valid email address.', 'error');
    }
    if (!password) {
      return showToast('Please enter your password.', 'error');
    }

    try {
      setLoading(true);
      const res = await api.auth.login({ email, password });
      loginUser(res.user, res.token);
      showToast(`Welcome back, ${res.user.username}!`, 'success');
      navigate('/home');
    } catch (err) {
      showToast(err.message || 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP request
  const handleSendOtp = async () => {
    if (!isValidEmail(email)) {
      return showToast('Please enter a valid email to receive OTP.', 'error');
    }

    try {
      setLoading(true);
      const res = await api.auth.sendOtp(email);
      setOtpSent(true);
      if (res?.devOtp) {
        setOtp(res.devOtp);
        showToast(`✅ OTP sent! Dev code: ${res.devOtp}`, 'success');
      } else {
        showToast(`OTP sent to ${email}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP login
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      return showToast('Please enter the 6-digit OTP.', 'error');
    }

    try {
      setLoading(true);
      const res = await api.auth.login({ email, otp });
      loginUser(res.user, res.token);
      showToast(`Welcome back, ${res.user.username}!`, 'success');
      navigate('/home');
    } catch (err) {
      showToast(err.message || 'Invalid or expired OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Demo Account fill
  const handleDemoFill = (type) => {
    if (type === 'admin') {
      setEmail('admin@eventvote.com');
      setPassword('admin123');
      setLoginMethod('password');
      showToast('Filled Admin demo credentials', 'info');
    } else if (type === 'student') {
      setEmail('jetliking02@gmail.com');
      setLoginMethod('otp');
      showToast('Filled Student email for OTP login', 'info');
    }
  };

  // Forgot password flow
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      return showToast('Please enter a valid registered email', 'error');
    }

    try {
      setLoading(true);
      const res = await api.auth.forgotPassword(forgotEmail);
      if (res?.devOtp) {
        setForgotOtp(res.devOtp);
        showToast(`Reset code: ${res.devOtp}`, 'info');
      }
      setForgotStep(2);
      showToast('Reset OTP sent to email', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to request reset OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp || !newPassword) {
      return showToast('OTP and new password are required', 'error');
    }
    if (newPassword.length < 6) {
      return showToast('Password must be at least 6 characters', 'error');
    }

    try {
      setLoading(true);
      await api.auth.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword
      });
      showToast('Password updated! You can now log in.', 'success');
      setShowForgotModal(false);
      setEmail(forgotEmail);
      setPassword(newPassword);
      setLoginMethod('password');
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full animate-slide-down">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-indigo-500/20">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Sign in to EventVote
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Secure democratic event management & voting
            </p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                loginMethod === 'password'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('otp')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                loginMethod === 'otp'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              One-Time OTP
            </button>
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-[10px] uppercase font-bold text-slate-400">Quick Demo:</span>
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="text-[11px] font-bold px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-100 transition-colors"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('student')}
              className="text-[11px] font-bold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-100 transition-colors"
            >
              Student Demo
            </button>
          </div>

          {/* Form: Password Login */}
          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                      setForgotStep(1);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all mt-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Form: OTP Login */
            <form onSubmit={handleOtpLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-300 transition-colors shrink-0"
                  >
                    {otpSent ? 'Resend' : 'Get OTP'}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!otpSent || loading}
                className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all mt-2"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Login'}
              </button>
            </form>
          )}

          {/* Footer link to Sign Up */}
          <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-slide-down">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Reset Your Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {forgotStep === 1
                ? 'Enter your email address to receive a password reset verification code.'
                : 'Enter the verification OTP and choose a new password.'}
            </p>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetOtp} className="space-y-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Registered email"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl gradient-primary text-xs font-bold text-white"
                  >
                    Send Reset OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <input
                  type="text"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="6-digit OTP code"
                  required
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tracking-widest text-center"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min. 6 chars)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl gradient-primary text-xs font-bold text-white"
                  >
                    Reset & Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Login;
