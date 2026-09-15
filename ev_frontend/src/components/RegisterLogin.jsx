import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import { Users, Vote, ArrowLeft, ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';

const RegisterLogin = () => {
  const navigate = useNavigate();
  const { events, currentUser } = useEvent();
  const { showToast } = useToast();

  const [selectedEventId, setSelectedEventId] = useState('');

  const handleAudienceJoin = () => {
    if (!selectedEventId) {
      return showToast('Please select an event to vote in', 'warning');
    }
    sessionStorage.setItem('audienceData', JSON.stringify({
      eventId: selectedEventId,
      email: currentUser?.email || '',
      userId: currentUser?.id || null,
      username: currentUser?.username || 'Guest Voter',
      role: currentUser?.role || 'Participant'
    }));
    navigate('/audience-voting');
  };

  const handleParticipantJoin = () => {
    if (!selectedEventId) {
      return showToast('Please select an event to register for', 'warning');
    }
    if (!currentUser) {
      showToast('Please sign in first to register your candidate team', 'info');
      navigate('/');
      return;
    }
    sessionStorage.setItem('selectedEventId', selectedEventId);
    navigate('/participant-register');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link
          to="/home"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Participation Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How would you like to participate?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose whether to compete as a team or vote as an audience member
          </p>

          {/* Event Picker */}
          <div className="mt-6 max-w-md mx-auto">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
              Select Competition Event *
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="">-- Choose an Event --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.eventName} ({ev.computedStatus})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dual Participation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Card 1: Candidate Registration */}
          <div className="glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover-lift">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 shadow-sm">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Participant / Candidate Team
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Register your team to participate in the competition, present your project/manifesto, and compete for audience votes.
              </p>
            </div>

            <button
              onClick={handleParticipantJoin}
              disabled={!selectedEventId}
              className="w-full py-3.5 rounded-xl gradient-primary text-white text-xs font-bold shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Register as Candidate
            </button>
          </div>

          {/* Card 2: Audience Voter */}
          <div className="glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover-lift">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-sm">
                <Vote className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Audience / Voter
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Browse candidate presentations, compare entries, and cast your verified digital ballot for your favorite team.
              </p>
            </div>

            <button
              onClick={handleAudienceJoin}
              disabled={!selectedEventId}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Vote className="w-4 h-4" /> Enter Voting Portal
            </button>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
};

export default RegisterLogin;
