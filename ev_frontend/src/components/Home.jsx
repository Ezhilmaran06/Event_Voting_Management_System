import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { Calendar, MapPin, Building, Users, Trophy, Plus, LogIn } from 'lucide-react';

const Home = () => {
  const { events, addEvent, setEvents } = useEvent();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: '',
    startDateTime: '',
    endDateTime: '',
    institutionName: '',
    location: '',
    managerName: '',
    phoneNumber: '',
    email: ''
  });

  const navigate = useNavigate();

  const eventTypes = [
    'Cultural Competition',
    'Technical Competition',
    'Sports Tournament',
    'Academic Contest',
    'Art Exhibition',
    'Music Competition',
    'Dance Competition',
    'Drama Festival'
  ];

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/events');
        const data = await response.json();

        if (response.ok) {
          const transformedEvents = data.map((event) => ({
            id: event.id,
            eventName: event.eventName,
            eventType: event.eventType,
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime,
            institutionName: event.institutionName,
            location: event.location,
            managerName: event.managerName,
            phoneNumber: event.phoneNumber.toString(),
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
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.eventName.trim()) return 'Event name is required';
    if (!formData.eventType) return 'Event type is required';
    if (!formData.startDateTime) return 'Start date and time is required';
    if (!formData.endDateTime) return 'End date and time is required';
    if (!formData.institutionName.trim()) return 'Institution name is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.managerName.trim()) return 'Manager name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address';

    if (new Date(formData.startDateTime) >= new Date(formData.endDateTime)) {
      return 'End date must be after start date';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setMessage(error);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.eventName,
          type: formData.eventType,
          start_date_time: formData.startDateTime,
          end_date_time: formData.endDateTime,
          institute_name: formData.institutionName,
          location: formData.location,
          manager_name: formData.managerName,
          ph_no: formData.phoneNumber,
          user_email: formData.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to register event');
        return;
      }

      addEvent({
        eventName: formData.eventName,
        eventType: formData.eventType,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        institutionName: formData.institutionName,
        location: formData.location,
        managerName: formData.managerName,
        phoneNumber: formData.phoneNumber,
        email: formData.email
      });

      setMessage('Event registered successfully!');
      setFormData({
        eventName: '',
        eventType: '',
        startDateTime: '',
        endDateTime: '',
        institutionName: '',
        location: '',
        managerName: '',
        phoneNumber: '',
        email: ''
      });
      setShowForm(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('An error occurred while registering the event');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Event Organisation and Voting System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage events, register participants, and conduct voting seamlessly
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={20} />
            Register New Event
          </button>

          <Link 
            to="/register-login" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Users size={20} />
            Join Event
          </Link>

          {/* Logout Button */}
          <button
            onClick={() => {
              localStorage.removeItem('currentUser'); // Clear session
              window.location.href = '/';
            }}
            className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <LogIn size={20} />
            Logout
          </button>
        </div>

        {message && (
          <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg font-semibold ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="max-w-4xl mx-auto mb-12 animate-in slide-in-from-top duration-300">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New Event</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name *</label>
                    <input
                      type="text"
                      name="eventName"
                      value={formData.eventName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Enter event name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type *</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="">Select event type</option>
                      {eventTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="startDateTime"
                      value={formData.startDateTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="endDateTime"
                      value={formData.endDateTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Name *</label>
                    <input
                      type="text"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Enter institution name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Enter location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Name *</label>
                    <input
                      type="text"
                      name="managerName"
                      value={formData.managerName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Enter manager name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter email"
                  />
                </div>

                <div className="flex flex-wrap gap-4 justify-end pt-4">
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Register Event
                  </button>
                  <button 
                    type="button" 
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-colors"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Registered Events</h2>
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 text-lg mt-4">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No events registered yet. Register your first event above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <div key={event.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">{event.eventName}</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {event.eventType}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span className="text-sm">{formatDate(event.startDateTime)} - {formatDate(event.endDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building size={16} />
                      <span className="text-sm">{event.institutionName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link 
                      to={`/results/${event.id}`} 
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors"
                    >
                      <Trophy size={16} />
                      View Results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
