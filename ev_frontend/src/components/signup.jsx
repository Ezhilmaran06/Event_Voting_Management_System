import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import {
  GraduationCap, User, Mail, Lock, Phone, Building,
  KeyRound, CheckCircle2, ShieldCheck, ArrowRight
} from 'lucide-react';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const SignUp = () => {
  const navigate = useNavigate();
  const { loginUser } = useEvent();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    collegeName: '',
    role: 'Student',
    mobileNumber: '',
    otp: ''
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Compute password strength score
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(form.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500'];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1: Send OTP
  const handleGetOtp = async () => {
    if (!isValidEmail(form.email)) {
      return showToast('Please enter a valid email address.', 'error');
    }

    try {
      setLoading(true);
      const res = await api.auth.sendOtp(form.email);
      setOtpSent(true);
      if (res?.devOtp) {
        setForm((prev) => ({ ...prev, otp: res.devOtp }));
        showToast(`✅ OTP sent! Dev code: ${res.devOtp}`, 'success');
      } else {
        showToast(`Verification code sent to ${form.email}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to send OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!form.otp.trim()) {
      return showToast('Please enter the 6-digit OTP.', 'error');
    }

    try {
      setLoading(true);
      await api.auth.verifyOtp(form.email, form.otp);
      setOtpVerified(true);
      showToast('✅ Email verified successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'OTP verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Register Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim()) return showToast('Username is required.', 'error');
    if (!form.email.trim()) return showToast('Email is required.', 'error');
    if (form.password && form.password.length < 6) {
      return showToast('Password must be at least 6 characters long.', 'error');
    }
    if (!otpVerified) {
      return showToast('Please verify your email with OTP before signing up.', 'warning');
    }

    try {
      setLoading(true);
      const res = await api.auth.register({
        Username: form.username,
        clg_name: form.collegeName,
        role: form.role,
        ph_no: form.mobileNumber,
        email: form.email,
        password: form.password
      });

      loginUser(res.user, res.token);
      showToast('🎉 Account registered successfully! Welcome aboard.', 'success');
      navigate('/home');
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full animate-slide-down">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Create Voter Account
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Participate in symposiums, register teams, and cast verified ballots
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Username *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="e.g. Alex Morgan"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role Classification *
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Student">Student</option>
                  <option value="Staff">Faculty / Staff</option>
                  <option value="Organizer">Event Organizer</option>
                  <option value="Participant">Participant / Candidate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  College / Institution
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="collegeName"
                    value={form.collegeName}
                    onChange={handleChange}
                    placeholder="e.g. State Tech Institute"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={form.mobileNumber}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="10-digit number"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Email + OTP Verification Block */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (with OTP Verification) *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={otpVerified}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-60"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGetOtp}
                  disabled={otpVerified || loading}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-300 transition-colors shrink-0 disabled:opacity-50"
                >
                  {otpSent ? 'Resend' : 'Send Code'}
                </button>
              </div>
            </div>

            {/* OTP Entry */}
            {otpSent && !otpVerified && (
              <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
                <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                  Enter Received OTP
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="otp"
                    value={form.otp}
                    onChange={handleChange}
                    maxLength={6}
                    placeholder="123456"
                    className="flex-1 px-3 py-1.5 text-center font-mono font-bold tracking-widest text-sm rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-4 py-1.5 rounded-xl gradient-primary text-xs font-bold text-white shadow-sm"
                  >
                    Verify Code
                  </button>
                </div>
              </div>
            )}

            {otpVerified && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Email address verified successfully.
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password (min 6 chars)"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Password strength meter */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Password Strength</span>
                    <span>{strengthLabels[Math.min(strengthScore, 4)]}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full ${i < strengthScore ? strengthColors[Math.min(strengthScore - 1, 4)] : ''}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !otpVerified}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all mt-2"
            >
              {loading ? 'Registering Account...' : 'Complete Sign Up'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SignUp;
