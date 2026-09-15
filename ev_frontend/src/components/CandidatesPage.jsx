import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import CandidateComparisonModal from './common/CandidateComparisonModal';
import EmptyState from './common/EmptyState';
import { Users, Search, Award, Building, Sparkles, Vote, CheckSquare, Square } from 'lucide-react';

const CandidatesPage = () => {
  const navigate = useNavigate();
  const { currentUser, events } = useEvent();
  const { showToast } = useToast();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected candidates for comparison modal
  const [comparisonSelection, setComparisonSelection] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const data = await api.candidates.getAll();
        setCandidates(data || []);
      } catch (err) {
        console.error('fetchCandidates error:', err);
        showToast('Failed to load candidates', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [showToast]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(candidates.map((c) => c.performanceCategory).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [candidates]);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        (c.teamName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.teamLeader || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.institution || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchEvent = selectedEventId === 'All' || String(c.event_id) === String(selectedEventId);
      const matchCat = selectedCategory === 'All' || c.performanceCategory === selectedCategory;
      return matchSearch && matchEvent && matchCat;
    });
  }, [candidates, searchQuery, selectedEventId, selectedCategory]);

  const toggleSelectForComparison = (candidate) => {
    const exists = comparisonSelection.some((c) => c.id === candidate.id);
    if (exists) {
      setComparisonSelection((prev) => prev.filter((c) => c.id !== candidate.id));
    } else {
      if (comparisonSelection.length >= 3) {
        showToast('You can compare a maximum of 3 candidates at once', 'info');
        return;
      }
      setComparisonSelection((prev) => [...prev, candidate]);
    }
  };

  const handleVoteCandidate = (candidate) => {
    sessionStorage.setItem(
      'audienceData',
      JSON.stringify({
        eventId: candidate.event_id,
        selectedParticipantId: candidate.user_id,
        email: currentUser?.email || '',
        userId: currentUser?.id || null,
        username: currentUser?.username || 'Guest Voter',
        role: currentUser?.role || 'Participant'
      })
    );
    navigate('/audience-voting');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Direct Competitor Showcase
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Candidate Teams & Manifestos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse candidate credentials, compare submissions side-by-side, and vote.
            </p>
          </div>

          {/* Comparison floating button */}
          {comparisonSelection.length > 0 && (
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 p-3 rounded-2xl shadow-lg animate-slide-down">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                {comparisonSelection.length} selected
              </span>
              <button
                onClick={() => setIsCompareOpen(true)}
                className="px-4 py-2 rounded-xl gradient-primary text-xs font-bold shadow-md hover:scale-105 transition-transform"
              >
                Compare Side-by-Side
              </button>
              <button
                onClick={() => setComparisonSelection([])}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline font-semibold"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-card rounded-2xl p-4 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by team, lead, college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Event Filter */}
          <div>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.eventName}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidates Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-500">Loading candidate teams...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Candidates Found"
            description="No candidate matches your search criteria or filter options."
            actionText="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedEventId('All');
              setSelectedCategory('All');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => {
              const isSelected = comparisonSelection.some((c) => c.id === candidate.id);
              return (
                <div
                  key={candidate.id}
                  className={`glass-card rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between hover-lift ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    {/* Top Row: Event name + Compare checkbox */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[180px]">
                        {candidate.event_name || 'Event Participant'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSelectForComparison(candidate)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        Compare
                      </button>
                    </div>

                    {/* Candidate Photo & Team */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0">
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
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                          {candidate.teamName}
                        </h3>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                          Lead: {candidate.teamLeader || candidate.username}
                        </p>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-1">
                          {candidate.performanceCategory || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Institution */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{candidate.institution || 'University Affiliate'}</span>
                    </div>

                    {/* Manifesto / Summary */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-6 leading-relaxed italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      "{candidate.teamDetails || 'Dedicated to innovative excellence and high performance in this event.'}"
                    </p>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {candidate.voteCount || 0} Votes Recorded
                    </span>
                    <button
                      onClick={() => handleVoteCandidate(candidate)}
                      className="px-4 py-2 rounded-xl gradient-primary text-xs font-bold shadow-md shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
                    >
                      <Vote className="w-3.5 h-3.5" /> Vote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Candidate Comparison Modal */}
      <CandidateComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        candidates={comparisonSelection}
        onSelectCandidate={handleVoteCandidate}
      />

      <Footer />
    </div>
  );
};

export default CandidatesPage;
