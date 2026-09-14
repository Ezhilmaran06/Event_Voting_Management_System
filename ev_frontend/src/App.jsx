import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { EventProvider } from './context/EventContext';
import Login from './components/Login';
import Home from './components/Home';
import RegisterLogin from './components/RegisterLogin';
import ParticipantRegister from './components/ParticipantRegister';
import AudienceVoting from './components/AudienceVoting';
import Results from './components/Results';
import ParticipantDetail from './components/ParticipantDetail';
import './App.css';
import SignUp from './components/signup';

function App() {
  return (
    <EventProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Default route shows Login page */}
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/results" element={<Results />} />

            {/* After login redirect to Home */}
            <Route path="/home" element={<Home />} />

            {/* Other routes remain same */}
            <Route path="/register-login" element={<RegisterLogin />} />
            <Route path="/participant-register" element={<ParticipantRegister />} />
            <Route path="/audience-voting" element={<AudienceVoting />} />
            <Route path="/results/:eventId" element={<Results />} />
            <Route path="/results/:eventId/participant/:participantId" element={<ParticipantDetail />} />
          </Routes>
        </div>
      </Router>
    </EventProvider>
  );
}

export default App;
