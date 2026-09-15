import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import { User, Mail, Building, Phone, Key, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, loginUser } = useEvent();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    username: '',
    collegeName: '',
    phoneNumber: '',
    avatar: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    setForm({
      username: currentUser.username || '',
      collegeName: currentUser.collegeName || '',
      phoneNumber: currentUser.phoneNumber || '',
      avatar: currentUser.avatar || '',
      newPassword: '',
      confirmPassword: ''
    });
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword) {
      if (form.newPassword.length < 6) {
        return showToast('New password must be at least 6 characters long', 'error');
      }
      if (form.newPassword !== form.confirmPassword) {
        return showToast('Password confirmation does not match', 'error');
      }
    }

    try {
      setLoading(true);
      const res = await api.auth.updateProfile({
        username: form.username,
        collegeName: form.collegeName,
        phoneNumber: form.phoneNumber,
        avatar: form.avatar,
        password: form.newPassword || undefined
      });

      loginUser(res.user, localStorage.getItem('token'));
      showToast('Profile updated successfully!', 'success');
      setForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20">
              {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Profile & Account Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your credentials, institution details, and password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address (Verified)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-500 text-sm font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  College / Institution
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="collegeName"
                    value={form.collegeName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Password change section */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" /> Change Password
              </h3>
              <p className="text-xs text-slate-500 mb-4">Leave blank if you do not want to change your password.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Role: <strong className="text-indigo-600 dark:text-indigo-400">{currentUser?.role || 'Participant'}</strong>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl gradient-primary text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:scale-105 transition-transform"
              >
                {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
