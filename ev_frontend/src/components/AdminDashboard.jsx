import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api, { API_BASE_URL } from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import ConfirmModal from './common/ConfirmModal';
import {
  Shield, Users, Calendar, Vote, Trophy, Activity,
  Download, Plus, Trash2, Edit, RefreshCw, ShieldAlert,
  Search, CheckCircle2, UserCheck, AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, events, refreshEvents } = useEvent();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'users' | 'audit'

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null, eventName: '' });

  // Load Admin Data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, logsData] = await Promise.all([
        api.admin.getStats(),
        api.auth.getUsers(),
        api.admin.getAuditLogs(30)
      ]);
      setStats(statsData);
      setUsersList(usersData || []);
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('loadAdminData error:', err);
      showToast('Failed to load administrative records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      loadAdminData();
    }
  }, [currentUser]);

  // Access Denied screen for non-admins
  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-2">403 - Access Forbidden</h2>
          <p className="text-xs text-slate-500 mb-6">
            You must be signed in with an Administrator account (e.g. admin@eventvote.com) to access the administrative console.
          </p>
          <Link
            to="/home"
            className="px-6 py-2.5 rounded-xl gradient-primary text-xs font-bold text-white shadow-md"
          >
            Back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleDeleteEventConfirm = async () => {
    try {
      await api.events.delete(deleteModal.eventId);
      showToast(`Event "${deleteModal.eventName}" deleted successfully`, 'success');
      refreshEvents();
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to delete event', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.auth.updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update user role', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 mb-2">
              <Shield className="w-3.5 h-3.5" /> Administrator Control Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Platform Administration
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`${API_BASE_URL}/admin/export/users/all`, '_blank')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-500" /> Export Users CSV
            </button>
            <button
              onClick={loadAdminData}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. STATS METRICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalUsers || usersList.length}
            </span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalEvents || events.length}
            </span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Events</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.activeEvents || 1}
            </span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Ballots</span>
              <Vote className="w-4 h-4 text-pink-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalVotes || 0}
            </span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Turnout Rate</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {stats?.turnoutRate || '78%'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
          {[
            { id: 'overview', label: 'Events Management', icon: Calendar },
            { id: 'users', label: 'User & Role Directory', icon: Users },
            { id: 'audit', label: 'Audit Trail Logs', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: EVENTS MANAGEMENT */}
        {activeTab === 'overview' && (
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                All Configured Events
              </h3>
              <span className="text-xs text-slate-400 font-bold">{events.length} total events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold">
                    <th className="py-3 px-4">Event Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Candidates</th>
                    <th className="py-3 px-4">Votes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <Link to={`/events/${ev.id}`} className="hover:underline">
                          {ev.eventName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{ev.eventType}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(ev.startDateTime).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ev.computedStatus === 'Voting Open'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {ev.computedStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{ev.participantCount || 0}</td>
                      <td className="py-3.5 px-4 font-semibold">{ev.totalVotes || 0}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          to={`/results/${ev.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                        >
                          Results
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, eventId: ev.id, eventName: ev.eventName })}
                          className="text-rose-600 hover:text-rose-700 p-1 rounded font-bold"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & ROLES */}
        {activeTab === 'users' && (
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registered Platform Users
              </h3>
              <span className="text-xs text-slate-400 font-bold">{usersList.length} users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Institution / College</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Role Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {u.username}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{u.email}</td>
                      <td className="py-3 px-4 text-slate-500">{u.collegeName || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-500">{u.phoneNumber || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role || 'Participant'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Organizer">Organizer</option>
                          <option value="Participant">Participant</option>
                          <option value="Student">Student</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL LOGS */}
        {activeTab === 'audit' && (
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Immutable System Audit Trail
              </h3>
              <span className="text-xs text-slate-400 font-bold">Latest 30 security events</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto font-mono text-xs">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No audit logs recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-sans font-semibold">
                          {log.details}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Actor: {log.user_email || 'Anonymous/System'} {log.ip_address ? `• IP: ${log.ip_address}` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, eventId: null, eventName: '' })}
        onConfirm={handleDeleteEventConfirm}
        title="Delete Event"
        message={`Are you sure you want to delete event "${deleteModal.eventName}"? All associated participant records and cast votes will be permanently deleted.`}
        confirmText="Delete Event"
        isDestructive={true}
      />

      <Footer />
    </div>
  );
};

export default AdminDashboard;
