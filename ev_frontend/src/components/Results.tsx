import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ArrowLeft, Trophy, Medal, Award, RefreshCw } from 'lucide-react';

const Results: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { events = [], getResults } = useEvent();
  const [event, setEvent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadResults = async () => {
    // Load event data as before
    let eventData = null;
    if (eventId && events.length > 0) {
      eventData = events.find(e => e.id === eventId || e.id.toString() === eventId);
    }

    if (!eventData) {
      eventData = {
        id: eventId || '0',
        eventName: 'Unknown Event',
        eventType: 'N/A',
        institutionName: 'No Institution',
      };
    }
    setEvent(eventData);

    // Load results from backend
    let resultsData: any[] = [];
    try {
      const resp = await fetch(`http://localhost:3000/votes/${eventId}`);
      const respData = await resp.json();
      // Normalize backend rows to a consistent shape used by the UI
      resultsData = (respData || []).map((r: any) => ({
        id: r.participant_id ?? r.user_id ?? r.id,
        teamName: r.teamName ?? r.team_name ?? null,
        participantName: r.participantName ?? r.username ?? r.name ?? null,
        participantEmail: r.participantEmail ?? r.email ?? null,
        teamPictureUrl: r.teamPictureUrl ?? r.team_picture ?? null,
        votes: Number(r.votes || 0),
        performanceCategory: r.performanceCategory ?? r.performance_category ?? null,
        institution: r.institution ?? r.institutionName ?? null
      }));
    } catch (e) {
      resultsData = [];
    }
    if (!resultsData || resultsData.length === 0) {
      resultsData = [
        {
          id: '0',
          teamName: 'No Participants Yet',
          institution: 'N/A',
          performanceCategory: 'N/A',
          teamPictureUrl: '',
          votes: 0,
        },
      ];
    }

  setResults(resultsData);
  setFilteredResults(resultsData);

    // Set up unique categories, if you have performanceCategory
    const uniqueCategories = Array.from(new Set(resultsData.map(r => r.performanceCategory).filter(Boolean)));
    setCategories(uniqueCategories);
    setSelectedCategory('');
  };


  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    if (!selectedCategory) setFilteredResults(results);
    else setFilteredResults(results.filter(r => r.performanceCategory === selectedCategory));
  }, [selectedCategory, results]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadResults();
      setRefreshing(false);
    }, 1000);
  };

  // compute totals and percentages for UI
  const totalVotes = filteredResults.reduce((s, r) => s + (Number(r.votes) || 0), 0);
  const enrichedResults = filteredResults.map(r => ({
    ...r,
    percent: totalVotes > 0 ? Math.round(((Number(r.votes) || 0) / totalVotes) * 100) : 0,
  }));

  const chartData = enrichedResults.map(result => {
    const display = result.teamName || result.participantName || `Participant ${result.id}`;
    return {
      name: display.length > 15 ? display.substring(0, 15) + '...' : display,
      votes: result.votes || 0,
    };
  });

  const winners = enrichedResults.slice(0, 3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0: return <Trophy size={32} className="text-yellow-500" />;
      case 1: return <Medal size={32} className="text-gray-500" />;
      case 2: return <Award size={32} className="text-orange-500" />;
      default: return null;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 0: return 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100';
      case 1: return 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100';
      case 2: return 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between mb-8 gap-6">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>

          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Results</h1>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              {event?.eventName || 'Event Not Available'}
            </h2>
            <p className="text-gray-600">
              {event?.eventType || 'N/A'} • {event?.institutionName || 'N/A'}
            </p>
          </div>

          <button
            className={`flex items-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-all ${refreshing ? 'animate-pulse' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>

        {/* Category Filter Form */}
        <div className="mb-10 max-w-3xl mx-auto">
          <label className="block mb-2 text-lg font-semibold text-gray-700">Filter by Category:</label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Top 3 Winners */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Top 3 Winners</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {winners.map((winner, index) => (
              <div
                key={winner.id || index}
                className={`bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-8 text-center border-4 ${getRankClass(index)}`}
              >
                <div className="flex items-center justify-center gap-2 mb-6">
                  {getRankIcon(index)}
                  <span className="text-2xl font-bold text-gray-900">#{index + 1}</span>
                </div>

                <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gray-200">
                  {winner.teamPictureUrl ? (
                    <img src={winner.teamPictureUrl} alt={winner.teamName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Trophy size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{winner.teamName || winner.participantName}</h3>
                {winner.participantEmail ? (
                  <p className="text-gray-600 mb-3"><a href={`mailto:${winner.participantEmail}`} className="underline text-blue-600">{winner.participantEmail}</a></p>
                ) : (
                  <p className="text-gray-600 mb-3">{winner.institution}</p>
                )}
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  {winner.performanceCategory}
                </span>
                <div className="flex items-center flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900">{winner.votes}</span>
                    <span className="text-sm text-gray-600 font-medium">votes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-2">
                    <div className="h-3 bg-blue-600" style={{ width: `${winner.percent}%` }} />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{winner.percent}% of total votes</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Voting Results Chart</h2>
            <div className="bg-gray-50 p-6 rounded-xl">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Complete Leaderboard</h2>
          <div className="space-y-4">
            {filteredResults.map((participant, index) => (
              <div
                key={participant.id || index}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-x-2 p-6 flex items-center gap-6 border-2 ${index < 3 ? getRankClass(index) : 'border-transparent'}`}
              >
                <div className="flex items-center gap-3 min-w-[80px]">
                  <span className="text-xl font-bold text-gray-900">#{index + 1}</span>
                  {index < 3 && getRankIcon(index)}
                </div>

                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {participant.teamPictureUrl ? (
                    <img src={participant.teamPictureUrl} alt={participant.teamName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{participant.teamName || participant.participantName}</h3>
                  {participant.participantEmail ? (
                    <p className="text-gray-600 truncate"><a href={`mailto:${participant.participantEmail}`} className="underline text-blue-600">{participant.participantEmail}</a></p>
                  ) : (
                    <p className="text-gray-600 truncate">{participant.institution}</p>
                  )}
                  <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium mt-1">
                    {participant.performanceCategory}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-2">
                    <div className="h-2 bg-blue-500" style={{ width: `${participant.percent || 0}%` }} />
                  </div>
                </div>

                <div className="text-center min-w-[80px]">
                  <span className="text-2xl font-bold text-gray-900">{participant.votes}</span>
                  <p className="text-sm text-gray-600">votes</p>
                  <p className="text-xs text-gray-500">{participant.percent || 0}%</p>
                </div>
                <div className="ml-4">
                  <a
                    href={`/results/${event?.id}/participant/${participant.id}`}
                    className="text-sm text-blue-600 underline"
                  >
                    View vote details
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Results;
