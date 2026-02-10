import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { Users, Vote, ArrowLeft } from 'lucide-react';

const RegisterLogin: React.FC = () => {
  const navigate = useNavigate();
  const { events, setEvents } = useEvent();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [audienceData, setAudienceData] = useState({
    email: '',
    eventId: ''
  });
  const [participantEventId, setParticipantEventId] = useState('');
  const [message, setMessage] = useState('');

  // Get current logged-in user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Prefill audienceData email with currentUser email when ready
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setAudienceData(prev => ({
        ...prev,
        email: currentUser.email
      }));
    }
  }, [currentUser]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/events');
        const data = await response.json();

        if (response.ok) {
          const transformedEvents = data.map((event: any) => ({
            id: event.id,
            eventName: event.eventName,
            eventType: event.eventType,
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime,
            institutionName: event.institutionName,
            location: event.location,
            managerName: event.managerName,
            phoneNumber: event.phoneNumber?.toString(),
            email: event.email
          }));
          setEvents(transformedEvents);
        } else {
          setMessage('Failed to load events');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setMessage('Error loading events from server');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [setEvents]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/users');
        const data = await response.json();

        if (response.ok) {
          setUsers(data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  const handleAudienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAudienceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAudienceLogin = (): string | null => {
    if (!currentUser || !currentUser.email) return 'No user logged in';
    const userExists = users.find(user => user.email === currentUser.email);
    if (!userExists) return 'Logged-in user’s email not registered. Please contact administrator.';
    if (!audienceData.eventId) return 'Please select an event';
    return null;
  };

  const handleAudienceLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) {
      setMessage('Loading user data. Please wait...');
      return;
    }

    const error = validateAudienceLogin();
    if (error) {
      setMessage(error);
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    const user = users.find(u => u.email === currentUser.email);

    const audienceLoginData = {
      ...audienceData,
      email: currentUser.email,
      userId: user.id,
      username: user.username,
      collegeName: user.collegeName,
      phoneNumber: user.phoneNumber,
      role: user.role
    };

    sessionStorage.setItem('audienceData', JSON.stringify(audienceLoginData));
    navigate('/audience-voting');
  };

  const handleParticipantRegister = async () => {
    if (!participantEventId) {
      setMessage('Please select an event to register for');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    if (!currentUser) {
      setMessage('Please login first to register as a participant');
      setTimeout(() => {
        setMessage('');
        navigate('/login');
      }, 2000);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/user_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          event_id: parseInt(participantEventId)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Successfully registered for the event! Redirecting...');

        sessionStorage.setItem('selectedEventId', participantEventId);
        sessionStorage.setItem('userEventId', data.id);

        setTimeout(() => {
          navigate('/participant-register');
        }, 1500);
      } else {
        setMessage(data.error || 'Failed to register for event. You may already be registered.');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error registering for event:', err);
      setMessage('An error occurred while registering for the event');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12 relative">
          {/* ✅ Back to Home Button */}
          <button
            onClick={() => navigate("/home")}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">Join Event</h1>
          <p className="text-lg text-gray-600">Choose your participation type</p>

          {currentUser && (
            <div className="mt-4 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-800">
                <strong>Logged in as:</strong> {currentUser.username} ({currentUser.email})
              </p>
            </div>
          )}
        </header>

        {message && (
          <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg font-semibold ${
            message.includes('Success') || message.includes('successfully')
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Participant Registration Card */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-8 border border-gray-100 min-h-[500px] flex flex-col">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Users size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Participant Registration</h2>
            <p className="text-gray-600 text-center mb-8 flex-1">
              Register your team to participate in the competition and showcase your talents
            </p>
            
            {!currentUser && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  Please <Link to="/login" className="font-semibold underline">login</Link> to register as a participant
                </p>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Event</label>
              <select
                value={participantEventId}
                onChange={(e) => setParticipantEventId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                disabled={!currentUser}
              >
                <option value="">Choose an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.eventName} - {event.eventType}
                  </option>
                ))}
              </select>
            </div>

            <button 
              className={`w-full px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                currentUser 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleParticipantRegister}
              disabled={!currentUser}
            >
              <Users size={20} />
              Register as Participant
            </button>
          </div>

          {/* Audience Login Card */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-8 border border-gray-100 min-h-[500px] flex flex-col">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Vote size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Audience Login</h2>
            <p className="text-gray-600 text-center mb-8">
              Join as audience member to vote for your favorite participants
            </p>
            
            <form onSubmit={handleAudienceLogin} className="flex flex-col flex-1">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Event</label>
                  <select
                    name="eventId"
                    value={audienceData.eventId}
                    onChange={handleAudienceChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    disabled={loading}
                  >
                    <option value="">Choose an event</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.eventName} - {event.eventType}
                      </option>
                    ))}
                  </select>
                </div>
                {/* ---- Email field removed ---- */}
                {currentUser && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-700">{currentUser.email}</div>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 mt-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <Vote size={20} />
                {loading ? 'Loading...' : 'Login to Vote'}
              </button>
            </form>
          </div>
        </div>

        {events.length === 0 && !loading && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Events Available</h3>
              <p className="text-gray-600 mb-6">There are currently no events available for registration. Please check back later or contact the event organizer.</p>
              <button
                onClick={() => navigate("/home")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
              >
                Go Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterLogin;
