import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import EmptyState from './common/EmptyState';
import VoteReceiptModal from './common/VoteReceiptModal';
import {
  LayoutDashboard, Vote, Calendar, Award, Bell, CheckCircle2,
  Clock, ArrowRight, Trophy, ShieldCheck, FileText, User
} from 'lucide-react';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, isEventOngoing } = useEvent();
  const { showToast } = useToast();

  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [votingHistory, setVotingHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // View receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) {
      navigate('/');
      return;
    }

    const loadUserData = async () => {
      try {
        setLoading(true);
        const [regEvents, history, notifs] = await Promise.all([
          api.candidates.getUserRegistrations(currentUser.id),
          api.votes.getUserHistory(currentUser.id),
          api.notifications.getAll(currentUser.id)
        ]);
        setRegisteredEvents(regEvents || []);
        setVotingHistory(history || []);
        setNotifications(notifs?.notifications || []);
      } catch (err) {
        console.error('loadUserData error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Welcome Greeting Banner */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-500/20">
              {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  Welcome, {currentUser?.username || 'User'}!
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {currentUser?.role || 'Participant'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentUser?.email} • {currentUser?.collegeName || 'Community Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="px-4 py-2 rounded-xl gradient-primary text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform"
            >
              Browse Events
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Area: Registered Events & Voting History */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section A: Registered Competitions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" /> My Competing Teams
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  {registeredEvents.length} registered
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Loading registrations...</div>
              ) : registeredEvents.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
                  <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    You haven't registered any team yet.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Find an open competition and submit your project.
                  </p>
                  <Link
                    to="/register-login"
                    className="mt-4 inline-block px-4 py-2 rounded-xl gradient-primary text-xs font-bold text-white shadow-sm"
                  >
                    Register Team
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {registeredEvents.map((r) => (
                    <div
                      key={r.userEventId}
                      className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">
                          {r.eventType}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                          {r.eventName}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-2">
                          Team: {r.teamName}
                        </p>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 mb-3">
                          {r.performanceCategory || 'General'}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {new Date(r.registeredAt).toLocaleDateString()}
                        </span>
                        <Link
                          to={`/results/${r.eventId}`}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          Results <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Voting History & Digital Receipts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Vote className="w-5 h-5 text-purple-500" /> Voting History & Official Receipts
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  {votingHistory.length} ballots cast
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Loading ballots...</div>
              ) : votingHistory.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
                  <Vote className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No votes cast yet.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Explore ongoing events and cast your ballot.
                  </p>
                </div>
              ) : (
                <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold">
                          <th className="py-3 px-4">Event</th>
                          <th className="py-3 px-4">Candidate Voted</th>
                          <th className="py-3 px-4">Receipt ID</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {votingHistory.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {v.eventName}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                              {v.candidateName}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                              {v.receiptId || `VOTE-${v.id}`}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {new Date(v.votedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedReceipt({
                                  receiptId: v.receiptId,
                                  voteId: v.id,
                                  eventName: v.eventName,
                                  candidateName: v.candidateName,
                                  voteTime: v.votedAt
                                })}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                              >
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Notifications Feed */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500" /> Notifications Feed
              </h3>

              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <p className="font-bold text-slate-900 dark:text-white mb-1">
                        {n.title}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Vote Receipt Modal */}
      <VoteReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receiptData={selectedReceipt}
      />

      <Footer />
    </div>
  );
};

export default UserDashboard;
