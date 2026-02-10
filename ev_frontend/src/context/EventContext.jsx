import React, { createContext, useContext, useState, useEffect } from 'react';

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [votes, setVotes] = useState([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('events');
    const savedParticipants = localStorage.getItem('participants');
    const savedVotes = localStorage.getItem('votes');

    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
    if (savedParticipants) {
      setParticipants(JSON.parse(savedParticipants));
    }
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('votes', JSON.stringify(votes));
  }, [votes]);

  const addEvent = (eventData) => {
    const newEvent = {
      ...eventData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const registerParticipant = (participantData) => {
    // Try to persist to backend
    try {
      const rawCurrentUser = localStorage.getItem('currentUser');
      const currentUser = rawCurrentUser ? JSON.parse(rawCurrentUser) : null;

      const payload = {
        user_id: currentUser?.id ?? null,
        event_id: participantData.eventId,
        team_name: participantData.teamName,
        team_picture: participantData.teamPictureUrl || null
      };

      const storedUserEventId = sessionStorage.getItem('userEventId');
      if (storedUserEventId) {
        fetch(`http://localhost:3000/user_events/${storedUserEventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_name: payload.team_name, team_picture: payload.team_picture })
        }).catch(err => console.error('Failed to update participant', err));
      } else {
        fetch('http://localhost:3000/user_events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Failed to persist participant', err));
      }

      const newParticipant = {
        ...participantData,
        id: Date.now().toString(),
        registeredAt: new Date().toISOString()
      };
      setParticipants(prev => [...prev, newParticipant]);
      return newParticipant;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const castVote = (voteData) => {
    const newVote = {
      ...voteData,
      id: Date.now().toString(),
      votedAt: new Date().toISOString()
    };
    setVotes(prev => [...prev, newVote]);
    return newVote;
  };

  const getParticipantsByEvent = (eventId) => {
    return participants.filter(participant => participant.eventId === eventId);
  };

  const getVotesByEvent = (eventId) => {
    return votes.filter(vote => vote.eventId === eventId);
  };

  const getResults = (eventId) => {
    const eventVotes = getVotesByEvent(eventId);
    const eventParticipants = getParticipantsByEvent(eventId);
    
    const voteCounts = eventVotes.reduce((acc, vote) => {
      acc[vote.participantId] = (acc[vote.participantId] || 0) + 1;
      return acc;
    }, {});

    const results = eventParticipants.map(participant => ({
      ...participant,
      votes: voteCounts[participant.id] || 0
    }));

    return results.sort((a, b) => b.votes - a.votes);
  };

  const isEventOngoing = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);
    return now >= startDate && now <= endDate;
  };

  const value = {
    events,
    participants,
    votes,
    addEvent,
    registerParticipant,
    castVote,
    getParticipantsByEvent,
    getVotesByEvent,
    getResults,
    isEventOngoing
  };
  // include setEvents in provider value
  const providerValue = {
    events,
    participants,
    votes,
    addEvent,
    registerParticipant,
    castVote,
    getParticipantsByEvent,
    getVotesByEvent,
    getResults,
    isEventOngoing,
    setEvents
  };

  return (
    <EventContext.Provider value={providerValue}>
      {children}
    </EventContext.Provider>
  );
};