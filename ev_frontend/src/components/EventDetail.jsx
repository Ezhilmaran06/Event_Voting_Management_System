import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import CountdownTimer from './common/CountdownTimer';
import EmptyState from './common/EmptyState';
import {
  Calendar, MapPin, Building, Users, Vote, ArrowLeft,
  Shield, Award, Clock, FileText, CheckCircle2, Trophy
} from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isEventOngoing } = useEvent();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const [eventData, candidatesData] = await Promise.all([
          api.events.getById(id),
          api.candidates.getByEvent(id)
        ]);
        setEvent(eventData);
        setCandidates(candidatesData || []);
      } catch (err) {
        console.error('fetchEventData error:', err);
        showToast('Failed to load event details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, showToast]);

  const handleStartVoting = () => {
    sessionStorage.setItem('audienceData', JSON.stringify({
      eventId: event.id,
      email: currentUser?.email || '',
      userId: currentUser?.id || null,
      username: currentUser?.username || 'Guest Voter',
      role: currentUser?.role || 'Participant'
    }));
    navigate('/audience-voting');
  };

  const handleJoinParticipant = () => {
    if (!currentUser) {
      showToast('Please log in first to register your team', 'info');
      navigate('/');
      return;
    }
    sessionStorage.setItem('selectedEventId', event.id);
    navigate('/participant-register');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16]">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20">
          <EmptyState
            icon={Calendar}
            title="Event Not Found"
            description="The requested event does not exist or has been removed."
            actionText="Back to Events"
            onAction={() => navigate('/home')}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const isLive = event.computedStatus === 'Voting Open';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Back navigation */}
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events Catalog
        </Link>

        {/* Hero Banner Card */}
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 mb-10">
          <div className="gradient-primary p-8 sm:p-12 text-white relative">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                isLive ? 'bg-emerald-500 text-white shadow-md' : 'bg-white/20 backdrop-blur-md'
              }`}>
                {event.computedStatus}
              </span>
              <span className="text-xs font-bold bg-white/15 px-3 py-1 rounded-full backdrop-blur-md">
                {event.eventType}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              {event.eventName}
            </h1>

            <p className="text-sm sm:text-base text-indigo-100 max-w-3xl leading-relaxed">
              {event.description || 'Welcome to this premier institutional competition. Discover all participating teams below and cast your ballot.'}
            </p>
          </div>

          {/* Quick bar with timer & action buttons */}
          <div className="p-6 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              {isLive && event.votingEnd ? (
                <CountdownTimer targetDate={event.votingEnd} label="Voting Closes In" />
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Scheduled: {new Date(event.startDateTime).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={`/results/${event.id}`}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-colors flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-500" /> View Live Results
              </Link>

              <button
                onClick={handleJoinParticipant}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Register Team
              </button>

              <button
                onClick={handleStartVoting}
                className="px-5 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Vote className="w-4 h-4" /> Cast Vote
              </button>
            </div>
          </div>
        </div>

        {/* Content Columns: Event Specs & Candidates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Event Specs & Rules */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-500" /> Event Details
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Institution</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{event.institutionName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Venue Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{event.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Event Coordinator</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {event.managerName} ({event.email})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Timeline</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(event.startDateTime).toLocaleString()} - {new Date(event.endDateTime).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Rules Card */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" /> Rules & Guidelines
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                {event.rules || '1. Each attendee can vote once.\n2. Respect competing teams.\n3. Ballots are cryptographically logged.'}
              </p>
            </div>
          </div>

          {/* Right Column: Candidates Showcase */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Competing Candidates & Teams
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {candidates.length}
                </span>
              </h3>
            </div>

            {candidates.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Candidates Registered Yet"
                description="Be the first team to register and showcase your talent in this competition."
                actionText="Register as First Candidate"
                onAction={handleJoinParticipant}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover-lift"
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                          {candidate.teamPictureUrl ? (
                            <img
                              src={candidate.teamPictureUrl}
                              alt={candidate.teamName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{(candidate.teamName || 'T')[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {candidate.teamName}
                          </h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                            Lead: {candidate.teamLeader || candidate.username}
                          </p>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-1">
                            {candidate.performanceCategory || 'General'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 italic">
                        "{candidate.teamDetails || 'Pioneering innovative project demonstration.'}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        {candidate.voteCount || 0} Votes
                      </span>
                      <button
                        onClick={handleStartVoting}
                        className="px-3.5 py-1.5 rounded-xl gradient-primary text-xs font-bold shadow-sm hover:scale-105 transition-transform"
                      >
                        Vote for Team
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;
