import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import CountdownTimer from './common/CountdownTimer';
import ConfirmModal from './common/ConfirmModal';
import VoteReceiptModal from './common/VoteReceiptModal';
import CandidateComparisonModal from './common/CandidateComparisonModal';
import {
  ArrowLeft, Vote, Clock, AlertCircle, CheckCircle, ShieldCheck,
  Award, Building, Sparkles, HelpCircle, Check, Users
} from 'lucide-react';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const AudienceVoting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { events, currentUser } = useEvent();
  const { showToast } = useToast();

  const [audienceData, setAudienceData] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP State (for unauthenticated or OTP-verified sessions)
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Confirmation & Receipt Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Comparison modal
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Initialize Session
  useEffect(() => {
    let stored = null;
    try {
      stored = JSON.parse(sessionStorage.getItem('audienceData'));
    } catch (e) {
      stored = null;
    }

    if (!stored) {
      // Default to first active event or first event in list
      const defaultEvent = events.find((e) => e.computedStatus === 'Voting Open') || events[0];
      if (defaultEvent) {
        stored = {
          eventId: defaultEvent.id,
          email: currentUser?.email || '',
          userId: currentUser?.id || null,
          username: currentUser?.username || 'Guest Voter',
          role: currentUser?.role || 'Participant'
        };
        sessionStorage.setItem('audienceData', JSON.stringify(stored));
      }
    }

    if (stored) {
      setAudienceData(stored);
      if (stored.selectedParticipantId) {
        setSelectedParticipantId(String(stored.selectedParticipantId));
      }
      if (currentUser?.id) {
        setOtpVerified(true);
      }
    }
  }, [events, currentUser]);

  // Load selected event and participants
  useEffect(() => {
    if (!audienceData?.eventId || events.length === 0) return;

    const event = events.find((e) => String(e.id) === String(audienceData.eventId)) || events[0];
    setSelectedEvent(event);

    if (event) {
      setLoading(true);
      api.candidates.getByEvent(event.id)
        .then((data) => {
          setParticipants(data || []);
        })
        .catch((err) => {
          console.error('Error fetching candidates:', err);
          showToast('Failed to load candidate list', 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [audienceData?.eventId, events, showToast]);

  const handleSelectEvent = (eventId) => {
    const updated = { ...audienceData, eventId };
    sessionStorage.setItem('audienceData', JSON.stringify(updated));
    setAudienceData(updated);
    setSelectedParticipantId('');
  };

  const handleGetOtp = async () => {
    if (!isValidEmail(audienceData?.email)) {
      showToast('Please enter a valid email address first.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.sendOtp(audienceData.email);
      setOtpSent(true);
      if (res?.devOtp) {
        setOtp(res.devOtp);
        showToast(`✅ OTP sent! Dev code: ${res.devOtp}`, 'success');
      } else {
        showToast(`Verification code sent to ${audienceData.email}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error sending OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showToast('Please enter the 6-digit OTP', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.auth.verifyOtp(audienceData.email, otp);
      setOtpVerified(true);
      showToast('✅ Identity verified! You can now cast your ballot.', 'success');
    } catch (err) {
      showToast(err.message || 'Invalid or expired OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validatePreSubmission = () => {
    if (!selectedParticipantId) {
      showToast('Please select a candidate or team to vote for.', 'warning');
      return false;
    }
    if (!currentUser?.id && !otpVerified) {
      showToast('Please complete email verification before voting.', 'warning');
      return false;
    }
    return true;
  };

  const handleTriggerVote = () => {
    if (validatePreSubmission()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmVoteSubmission = async () => {
    const chosenCandidate = participants.find(
      (p) => String(p.participant_id || p.userId || p.id) === String(selectedParticipantId)
    );

    const voterId = currentUser?.id || audienceData?.userId || 8; // fallback voter ID

    try {
      setIsSubmitting(true);
      const res = await api.votes.castVote({
        eventId: Number(selectedEvent.id),
        participantId: Number(selectedParticipantId),
        voterId: Number(voterId),
      });

      const receiptPayload = {
        receiptId: res.receiptId,
        voteId: res.voteId,
        eventId: selectedEvent.id,
        eventName: selectedEvent.eventName,
        candidateName: chosenCandidate?.teamName || chosenCandidate?.username || 'Selected Candidate',
        voteTime: res.voteTime || new Date().toISOString(),
      };

      setReceiptData(receiptPayload);
      setShowReceiptModal(true);
      showToast('🎉 Your vote has been officially recorded!', 'success');
    } catch (err) {
      console.error('Vote submission error:', err);
      showToast(err.message || 'Failed to submit vote', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCandidateObj = participants.find(
    (p) => String(p.participant_id || p.userId || p.id) === String(selectedParticipantId)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>

          {/* Event Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Voting Event:</span>
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => handleSelectEvent(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.eventName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Voting Portal Banner */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Voting Portal
              </span>
              {selectedEvent?.computedStatus && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {selectedEvent.computedStatus}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {selectedEvent?.eventName || 'Select an Event to Vote'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select one participating team or candidate below, confirm your ballot, and receive an instant digital receipt.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedEvent?.votingEnd && (
              <CountdownTimer targetDate={selectedEvent.votingEnd} label="Voting Closes In" />
            )}
            {participants.length >= 2 && (
              <button
                type="button"
                onClick={() => setShowCompareModal(true)}
                className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-500" /> Compare Candidates
              </button>
            )}
          </div>
        </div>

        {/* Voting Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Candidates List (Col Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Choose Candidate / Team
              </h2>
              <span className="text-xs text-slate-400 font-semibold">
                {participants.length} available
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">
                Loading candidate ballots...
              </div>
            ) : participants.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800">
                <Vote className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No candidates registered for this event yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Be the first to register as a participant!
                </p>
                <Link
                  to="/participant-register"
                  className="mt-4 inline-block px-5 py-2 rounded-xl gradient-primary text-xs font-bold text-white shadow-md"
                >
                  Register Team
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((p) => {
                  const candidateId = String(p.participant_id || p.userId || p.id);
                  const isSelected = selectedParticipantId === candidateId;

                  return (
                    <div
                      key={candidateId}
                      onClick={() => setSelectedParticipantId(candidateId)}
                      className={`glass-card rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 hover-lift ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-lg'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Radio Check Circle */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>

                        {/* Candidate Avatar */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                          {p.teamPictureUrl ? (
                            <img
                              src={p.teamPictureUrl}
                              alt={p.teamName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{(p.teamName || 'C')[0]}</span>
                          )}
                        </div>

                        {/* Candidate Metadata */}
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {p.teamName || p.username}
                          </h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                            Lead: {p.teamLeader || p.username}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              {p.performanceCategory || 'General'}
                            </span>
                            <span className="truncate">{p.institution || 'Institutional Team'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:block text-right shrink-0">
                        <span className="text-xs font-bold text-slate-400 block">
                          Recorded Votes
                        </span>
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {p.voteCount || 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Ballot Summary & Verification */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 sticky top-24">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Vote className="w-4 h-4 text-indigo-500" /> Ballot Confirmation
              </h3>

              {/* Voter Identity Badge */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Voter Identity
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.username || audienceData?.username || 'Guest Voter'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser?.email || audienceData?.email || 'Email not linked'}
                </p>
              </div>

              {/* Selected Candidate Preview */}
              <div className="mb-6">
                <span className="text-xs font-bold text-slate-500 block mb-2">
                  Your Selected Ballot:
                </span>
                {selectedCandidateObj ? (
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {selectedCandidateObj.teamName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        Lead: {selectedCandidateObj.teamLeader || selectedCandidateObj.username}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                    No candidate selected yet. Click any team on the left.
                  </div>
                )}
              </div>

              {/* OTP Verification (only if user is not logged in) */}
              {!currentUser?.id && (
                <div className="space-y-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Verification
                    </span>
                    {otpVerified && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Verified ✅
                      </span>
                    )}
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleGetOtp}
                      disabled={loading}
                      className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-300 transition-colors"
                    >
                      {loading ? 'Sending code...' : 'Get One-Time Code'}
                    </button>
                  ) : !otpVerified ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        className="w-full px-3 py-2 text-center font-mono font-bold tracking-widest text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="w-full py-2 rounded-xl gradient-primary text-xs font-bold text-white shadow-sm"
                      >
                        Verify Code
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Submit Ballot Button */}
              <button
                type="button"
                onClick={handleTriggerVote}
                disabled={!selectedParticipantId || isSubmitting}
                className="w-full py-3.5 rounded-2xl gradient-primary text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Vote className="w-5 h-5" />
                {isSubmitting ? 'Recording Ballot...' : 'Confirm & Cast Ballot'}
              </button>

              <p className="text-[11px] text-center text-slate-400 mt-3">
                🔒 Cryptographically signed. One vote per participant.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmVoteSubmission}
        title="Confirm Your Vote"
        message={`Are you sure you want to cast your ballot for "${selectedCandidateObj?.teamName || 'Selected Candidate'}" in "${selectedEvent?.eventName}"? Once recorded, ballots are final and cannot be modified.`}
        confirmText="Yes, Cast Ballot"
      />

      {/* Official Vote Receipt Modal */}
      <VoteReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          navigate(`/results/${selectedEvent?.id}`);
        }}
        receiptData={receiptData}
      />

      {/* Candidate Comparison Modal */}
      <CandidateComparisonModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        candidates={participants}
        onSelectCandidate={(candidate) => {
          setSelectedParticipantId(String(candidate.participant_id || candidate.userId || candidate.id));
          showToast(`Selected ${candidate.teamName}`, 'info');
        }}
      />

      <Footer />
    </div>
  );
};

export default AudienceVoting;
