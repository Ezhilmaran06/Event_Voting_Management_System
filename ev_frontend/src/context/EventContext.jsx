import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const EventContext = createContext(null);

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch events from backend API
  const refreshEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const data = await api.events.getAll();
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const data = await api.notifications.getAll(currentUser.id);
      setUnreadNotifications(data?.unreadCount || 0);
    } catch (err) {
      // ignore
    }
  }, [currentUser?.id]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  useEffect(() => {
    if (currentUser?.id) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 30000); // poll every 30s
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, refreshNotifications]);

  // Auth helper methods
  const loginUser = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    sessionStorage.removeItem('audienceData');
    sessionStorage.removeItem('selectedEventId');
    sessionStorage.removeItem('userEventId');
  };

  // Safe event status check
  const isEventOngoing = (event) => {
    if (!event) return false;
    if (event.computedStatus === 'Voting Open') return true;
    if (event.computedStatus === 'Ongoing') return true;
    
    // Fallback date check
    const now = new Date();
    const start = new Date(event.startDateTime || event.start_date_time);
    const end = new Date(event.endDateTime || event.end_date_time);
    return now >= start && now <= end;
  };

  const value = {
    events,
    setEvents,
    loadingEvents,
    refreshEvents,
    currentUser,
    setCurrentUser,
    loginUser,
    logoutUser,
    unreadNotifications,
    refreshNotifications,
    isEventOngoing,
    isAdmin: currentUser?.role === 'Admin',
    isOrganizer: currentUser?.role === 'Organizer' || currentUser?.role === 'Admin'
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};

export default EventContext;