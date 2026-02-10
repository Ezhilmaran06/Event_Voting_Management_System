import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ParticipantDetail: React.FC = () => {
  const { eventId, participantId } = useParams<{ eventId: string; participantId: string }>();
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !participantId) return;
    setLoading(true);
    fetch(`http://localhost:3000/votes/${eventId}/participant/${participantId}`)
      .then(res => res.json())
      .then(data => {
        setVotes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load vote details');
        setLoading(false);
      });
  }, [eventId, participantId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center gap-4">
          <Link to={`/results/${eventId}`} className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Results
          </Link>
          <h1 className="text-2xl font-bold">Participant Vote Details</h1>
        </header>

        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

        {loading ? (
          <div className="p-6 bg-white rounded shadow text-center">Loading...</div>
        ) : (
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Votes</h2>
            {votes.length === 0 ? (
              <div className="text-sm text-gray-600">No votes yet for this participant.</div>
            ) : (
              <ul className="space-y-3">
                {votes.map(v => (
                  <li key={v.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="text-sm font-medium">{v.voter}</div>
                      <div className="text-xs text-gray-500">{new Date(v.votedAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-gray-500">Vote ID: {v.id}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantDetail;
