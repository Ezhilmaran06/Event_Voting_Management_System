import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Event {
  id: string;
  eventName: string;
  eventType: string;
  startDateTime: string;
  endDateTime: string;
  institutionName: string;
  location: string;
  managerName: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
}

interface Participant {
  id: string;
  eventId: string;
  teamName: string;
  teamLeaderName: string;
  institution: string;
  performanceCategory: string;
  teamDetails: string;
  teamPictureUrl?: string;
  registeredAt: string;
}

interface Vote {
  id: string;
  eventId: string;
  participantId: string;
  voterInfo: {
    name: string;
    email: string;
    institution: string;
    mobileNumber: string;
    age: string;
  };
  audienceEmail: string;
  audiencePhone: string;
  votedAt: string;
}

interface EventContextType {
  events: Event[];
  setEvents: (events: Event[]) => void;
  participants: Participant[];
  votes: Vote[];
  addEvent: (eventData: Omit<Event, 'id' | 'createdAt'>) => Event;
  registerParticipant: (participantData: Omit<Participant, 'id' | 'registeredAt'>) => Promise<Participant>;
  castVote: (voteData: Omit<Vote, 'id' | 'votedAt'>) => Vote;
  getParticipantsByEvent: (eventId: string) => Participant[];
  getVotesByEvent: (eventId: string) => Vote[];
  getResults: (eventId: string) => (Participant & { votes: number })[];
  isEventOngoing: (event: Event) => boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);

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

  const addEvent = (eventData: Omit<Event, 'id' | 'createdAt'>): Event => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const registerParticipant = async (participantData: Omit<Participant, 'id' | 'registeredAt'>): Promise<Participant> => {
    // Try to post to backend to persist in SQL
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
        // update existing record
        await fetch(`http://localhost:3000/user_events/${storedUserEventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_name: payload.team_name, team_picture: payload.team_picture })
        });
      } else {
        // create new registration row
        await fetch('http://localhost:3000/user_events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // Keep local state in sync (optimistic)
      const newParticipant: Participant = {
        ...participantData,
        id: Date.now().toString(),
        registeredAt: new Date().toISOString()
      };
      setParticipants(prev => [...prev, newParticipant]);
      return newParticipant;
    } catch (err) {
      console.error('Failed to register participant to backend', err);
      throw err;
    }
  };

  const castVote = (voteData: Omit<Vote, 'id' | 'votedAt'>): Vote => {
    const newVote: Vote = {
      ...voteData,
      id: Date.now().toString(),
      votedAt: new Date().toISOString()
    };
    setVotes(prev => [...prev, newVote]);
    return newVote;
  };

  const getParticipantsByEvent = (eventId: string): Participant[] => {
    return participants.filter(participant => participant.eventId === eventId);
  };

  const getVotesByEvent = (eventId: string): Vote[] => {
    return votes.filter(vote => vote.eventId === eventId);
  };

  const getResults = (eventId: string): (Participant & { votes: number })[] => {
    const eventVotes = getVotesByEvent(eventId);
    const eventParticipants = getParticipantsByEvent(eventId);
    
    const voteCounts = eventVotes.reduce((acc, vote) => {
      acc[vote.participantId] = (acc[vote.participantId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const results = eventParticipants.map(participant => ({
      ...participant,
      votes: voteCounts[participant.id] || 0
    }));

    return results.sort((a, b) => b.votes - a.votes);
  };

  const isEventOngoing = (event: Event): boolean => {
    const now = new Date();
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);
    return now >= startDate && now <= endDate;
  };

  const value: EventContextType = {
    events,
    setEvents,
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

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};