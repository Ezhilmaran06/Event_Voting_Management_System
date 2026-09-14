import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { 
  ArrowLeft, Vote, Clock, AlertCircle, CheckCircle 
} from 'lucide-react';
import './AudienceVoting.css';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const AudienceVoting = () => {
  const navigate = useNavigate();
  const { events, isEventOngoing } = useEvent();

  const [audienceData, setAudienceData] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('audienceData');
    if (!stored) {
      navigate('/register-login');
      return;
    }
    const data = JSON.parse(stored);
    setAudienceData(data);

    const event = events.find(e => e.id.toString() === data.eventId.toString()) || null;
    setSelectedEvent(event);

    if (event) {
      fetch(`http://localhost:3000/user_events/event/${event.id}`)
        .then(res => res.json())
        .then((data) => {
          const normalized = data.map(d => ({
            id: d.userId ?? d.participant_id ?? d.id ?? d.user_id,
            username: d.username ?? d.participantName ?? d.teamName ?? d.name,
            email: d.email ?? d.participantEmail ?? d.participant_email
          }));
          setParticipants(normalized);
          setFilteredParticipants(normalized);
        })
        .catch(err => {
          console.error('Error fetching participants:', err);
          setParticipants([]);
          setFilteredParticipants([]);
        });
    }
  }, [events, navigate]);

  // Safe event ongoing check
  const eventStatus = selectedEvent && isEventOngoing
    ? isEventOngoing(selectedEvent)
    : false;

  const handleGetOtp = async () => {
    if (!isValidEmail(audienceData?.email)) {
      setMessage({ text: 'Invalid email address.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/users/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: audienceData.email })
      });

      if (!response.ok) throw new Error('Failed to send OTP');

      setOtpSent(true);
      setMessage({ text: `OTP sent to ${audienceData.email}`, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: err.message || 'Error sending OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpSent) {
      setMessage({ text: 'Please get OTP first.', type: 'error' });
      return;
    }
    if (!otp.trim()) {
      setMessage({ text: 'Please enter OTP.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: audienceData.email, otp })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'OTP verification failed');

      setOtpVerified(true);
      setMessage({ text: '✅ OTP Verified Successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: err.message || 'Invalid OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validateVote = () => {
    if (!selectedParticipant) return 'Please select a participant to vote for';
    if (!otpSent) return 'Please get OTP before voting';
    if (!otpVerified) return 'Please verify OTP before voting';
    return null;
  };

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    const error = validateVote();
    if (error) {
      setMessage({ text: error, type: 'error' });
      return;
    }

    const voteData = {
      eventId: Number(selectedEvent.id),
      participantId: Number(selectedParticipant),
      voterId: audienceData.userId,
      audienceEmail: audienceData.email,
    };

    try {
      setIsSubmitting(true);
      const resp = await fetch('http://localhost:3000/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData)
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Vote failed');

      setMessage({ text: 'Vote submitted successfully! Redirecting...', type: 'success' });
      setTimeout(() => {
        sessionStorage.removeItem('audienceData');
        navigate('/home');
      }, 2000);
    } catch (err) {
      setMessage({ text: err.message || 'An error occurred while voting', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Event Selected</h2>
            <p className="text-gray-600 mb-6">Please go back and select an event to vote in.</p>
            <Link to="/register-login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block">
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8 relative">
          <Link to="/register-login" className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Audience Voting</h1>
          <p className="text-lg text-gray-600">{selectedEvent?.eventName || selectedEvent?.name}</p>
          {audienceData && (
            <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-6 py-3 shadow-sm">
              <CheckCircle size={20} className="text-green-600" />
              <div className="text-left">
                <p className="text-sm font-semibold text-green-900">{audienceData.username}</p>
                <p className="text-xs text-green-700">{audienceData.email} • {audienceData.role}</p>
              </div>
            </div>
          )}
        </header>

        {!eventStatus && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-lg font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-2">
            <Clock size={20} />
            Voting is currently not available. This event is not ongoing.
          </div>
        )}

        {message && (
          <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' && <CheckCircle size={20} />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Participants List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Participant</h2>

              <div className="max-h-[500px] overflow-y-auto space-y-4">
                {filteredParticipants.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <Vote size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No registered participants available for this event</p>
                  </div>
                ) : (
                  filteredParticipants.map(participant => {
                    const participantId = String(participant.id);
                    const isSelected = selectedParticipant === participantId;
                    return (
                      <div
                        key={participantId}
                        className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-blue-25 hover:border-blue-200'
                        }`}
                        onClick={() => eventStatus && setSelectedParticipant(participantId)}
                      >
                        <input
                          type="radio"
                          name="participant"
                          value={participantId}
                          checked={isSelected}
                          onChange={() => setSelectedParticipant(participantId)}
                          disabled={!eventStatus}
                          className="w-5 h-5 text-blue-600 accent-blue-600"
                        />
                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                          <Vote size={20} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {participant.username || participant.name || `Participant ${participantId}`}
                          </h3>
                          {participant.email && (
                            <p className="text-sm text-gray-500">{participant.email}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Voter Info Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-10 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Details</h2>
              <form onSubmit={handleVoteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={audienceData?.username || ''}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-colors bg-gray-50"
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <div className="otp-row">
                    <input
                      type="email"
                      name="email"
                      value={audienceData?.email || ''}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg transition-colors bg-gray-50"
                      disabled
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn-otp"
                      onClick={handleGetOtp}
                      disabled={otpSent || loading || !eventStatus}
                    >
                      {loading ? 'Sending...' : otpSent ? 'Sent' : 'Get OTP'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP *</label>
                  <input
                    type="text"
                    name="otp"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter the OTP sent to your email"
                    required
                    autoComplete="off"
                    disabled={!eventStatus || !otpSent}
                    onBlur={handleVerifyOtp}
                  />
                </div>
                {message && (message.type === 'error') && (
                  <p className="text-red-600 font-medium text-sm">{message.text}</p>
                )}
                <button
                  type="submit"
                  className={`w-full px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                    eventStatus && !isSubmitting
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:scale-[1.02] shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!eventStatus || isSubmitting || !otpVerified}
                >
                  <Vote size={20} />
                  {isSubmitting ? 'Submitting...' : (eventStatus ? 'Submit Vote' : 'Voting Closed')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceVoting;
