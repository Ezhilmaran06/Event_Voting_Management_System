import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api, { API_BASE_URL } from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import EmptyState from './common/EmptyState';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Trophy, Medal, Award, RefreshCw, Download, ArrowLeft,
  Sparkles, CheckCircle2, ChevronRight, Users, Vote
} from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

const Results = () => {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();
  const { events } = useEvent();
  const { showToast } = useToast();

  const [activeEventId, setActiveEventId] = useState(paramEventId || '');
  const [eventData, setEventData] = useState(null);
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // If no eventId in param, default to first event or active event
  useEffect(() => {
    if (!paramEventId && events.length > 0) {
      const liveEvent = events.find((e) => e.computedStatus === 'Voting Open') || events[0];
      setActiveEventId(String(liveEvent.id));
    } else if (paramEventId) {
      setActiveEventId(String(paramEventId));
    }
  }, [paramEventId, events]);

  const loadResults = async (eId, isManualRefresh = false) => {
    if (!eId) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await api.votes.getResults(eId);
      setEventData(data.event || null);
      setTotalVotes(data.totalVotes || 0);
      setResults(data.results || []);

      if (isManualRefresh) {
        showToast('Results successfully updated from database', 'info');
      }
    } catch (err) {
      console.error('loadResults error:', err);
      showToast('Failed to load voting results', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeEventId) {
      loadResults(activeEventId);
    }
  }, [activeEventId]);

  // Categories in current results
  const categories = useMemo(() => {
    const set = new Set(results.map((r) => r.performanceCategory).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [results]);

  // Filtered by category
  const filteredResults = useMemo(() => {
    if (activeCategory === 'All') return results;
    return results.filter((r) => r.performanceCategory === activeCategory);
  }, [results, activeCategory]);

  // Chart data
  const chartData = useMemo(() => {
    return filteredResults.map((r) => ({
      name: r.teamName?.length > 14 ? r.teamName.substring(0, 14) + '...' : r.teamName,
      fullName: r.teamName,
      votes: r.votes,
      percent: r.percent,
    }));
  }, [filteredResults]);

  const pieData = useMemo(() => {
    return filteredResults.filter((r) => r.votes > 0).map((r) => ({
      name: r.teamName,
      value: r.votes,
    }));
  }, [filteredResults]);

  const topThree = filteredResults.slice(0, 3);
  const leadingCandidate = topThree.length > 0 && topThree[0].votes > 0 ? topThree[0] : null;

  const handleExportCsv = () => {
    if (!activeEventId) return;
    window.open(`${API_BASE_URL}/admin/export/results/${activeEventId}`, '_blank');
    showToast('Exporting results CSV...', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header Controls: Event Selector & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              Live Results & Leaderboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Event Selector */}
            <select
              value={activeEventId}
              onChange={(e) => {
                setActiveEventId(e.target.value);
                navigate(`/results/${e.target.value}`);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.eventName}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => loadResults(activeEventId, true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Refresh Live Tallies"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-500" /> Export CSV
            </button>
          </div>
        </div>

        {/* 1. LEADING WINNER BANNER */}
        {leadingCandidate && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
                <Trophy className="w-9 h-9 text-amber-300 animate-bounce" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Current Leader / Projected Winner
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {leadingCandidate.teamName}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  Lead: {leadingCandidate.participantName || leadingCandidate.teamLeader} • {leadingCandidate.institution || 'Team'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-amber-500/20">
              <div className="text-center">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {leadingCandidate.votes}
                </span>
                <p className="text-[10px] uppercase font-bold text-slate-400">Ballots</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="text-center">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {leadingCandidate.percent}%
                </span>
                <p className="text-[10px] uppercase font-bold text-slate-400">Vote Share</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. PODIUM (Top 3 Candidates) */}
        {topThree.length >= 2 && (
          <div className="mb-12">
            <h3 className="text-center text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-6">
              Honor Podium
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto items-end">
              
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="glass-card rounded-2xl p-5 text-center order-2 sm:order-1 border border-slate-300 dark:border-slate-700 hover-lift">
                  <Medal className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-400 block mb-1">2nd Place</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {topThree[1].teamName}
                  </h4>
                  <p className="text-xs text-indigo-500 font-bold mt-1">
                    {topThree[1].votes} Votes ({topThree[1].percent}%)
                  </p>
                </div>
              )}

              {/* 1st Place (Gold Center) */}
              {topThree[0] && (
                <div className="glass-card rounded-3xl p-6 text-center order-1 sm:order-2 border-2 border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-xl shadow-amber-500/10 hover-lift -translate-y-2">
                  <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 block mb-1">
                    1st Place (Champion)
                  </span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    {topThree[0].teamName}
                  </h4>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-black mt-1">
                    {topThree[0].votes} Votes ({topThree[0].percent}%)
                  </p>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="glass-card rounded-2xl p-5 text-center order-3 sm:order-3 border border-orange-300 dark:border-orange-800 hover-lift">
                  <Award className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-orange-500 block mb-1">3rd Place</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {topThree[2].teamName}
                  </h4>
                  <p className="text-xs text-indigo-500 font-bold mt-1">
                    {topThree[2].votes} Votes ({topThree[2].percent}%)
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 3. INTERACTIVE VISUALIZATION CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Bar Chart: Vote Count Comparison */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
              <span>Vote Tally Distribution</span>
              <span className="text-xs font-semibold text-slate-400">Total: {totalVotes} Ballots</span>
            </h3>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="votes" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart: Vote Share Percentage */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
              Ballot Share %
            </h3>

            <div className="h-60 w-full">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No votes recorded yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <p className="text-[11px] text-center text-slate-400">
              Percentage of total verified ballots cast
            </p>
          </div>

        </div>

        {/* 4. COMPLETE RANKING LEADERBOARD TABLE */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Official Leaderboard Standings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full ranked list of all candidates and vote progress
              </p>
            </div>

            {/* Category Filter */}
            {categories.length > 1 && (
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Candidate / Team</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Ballots</th>
                  <th className="py-3 px-4">Share</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredResults.map((r) => (
                  <tr key={r.id || r.participant_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-black">
                      {r.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center justify-center text-xs">
                          1
                        </span>
                      ) : r.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 inline-flex items-center justify-center text-xs">
                          2
                        </span>
                      ) : r.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 inline-flex items-center justify-center text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">{r.rank}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                          {r.teamPictureUrl ? (
                            <img src={r.teamPictureUrl} alt={r.teamName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{(r.teamName || 'T')[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{r.teamName}</p>
                          <p className="text-xs text-slate-400">Lead: {r.participantName || r.teamLeader || 'Lead'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {r.performanceCategory || 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {r.institution || 'Affiliate'}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {r.votes}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>{r.percent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full transition-all duration-500"
                            style={{ width: `${r.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/results/${activeEventId}/participant/${r.id || r.participant_id}`}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                      >
                        Audit <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Results;
