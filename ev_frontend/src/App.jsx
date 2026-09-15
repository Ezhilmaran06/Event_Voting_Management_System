import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { EventProvider } from './context/EventContext';

import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/signup';
import EventDetail from './components/EventDetail';
import CandidatesPage from './components/CandidatesPage';
import RegisterLogin from './components/RegisterLogin';
import ParticipantRegister from './components/ParticipantRegister';
import AudienceVoting from './components/AudienceVoting';
import Results from './components/Results';
import ParticipantDetail from './components/ParticipantDetail';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import NotFound from './components/NotFound';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <EventProvider>
          <Router>
            <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
              <Routes>
                {/* Authentication */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Main Landing & Event Hub */}
                <Route path="/home" element={<Home />} />
                <Route path="/events/:id" element={<EventDetail />} />

                {/* Candidates Directory & Comparison */}
                <Route path="/candidates" element={<CandidatesPage />} />

                {/* Participation & Voting */}
                <Route path="/register-login" element={<RegisterLogin />} />
                <Route path="/participant-register" element={<ParticipantRegister />} />
                <Route path="/audience-voting" element={<AudienceVoting />} />
                <Route path="/vote/:eventId" element={<AudienceVoting />} />

                {/* Results & Auditing */}
                <Route path="/results" element={<Results />} />
                <Route path="/results/:eventId" element={<Results />} />
                <Route path="/results/:eventId/participant/:participantId" element={<ParticipantDetail />} />

                {/* Dashboards & Profile */}
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/profile" element={<Profile />} />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </EventProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
