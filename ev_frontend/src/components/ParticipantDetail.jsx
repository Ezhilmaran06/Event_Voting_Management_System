import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import api from '../services/api';
import { ArrowLeft, ShieldCheck, CheckCircle2, User, Clock } from 'lucide-react';

const ParticipantDetail = () => {
  const { eventId, participantId } = useParams();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId || !participantId) return;
    setLoading(true);
    api.votes.getParticipantVotes(eventId, participantId)
      .then((data) => {
        setVotes(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load candidate ballot details');
        setLoading(false);
      });
  }, [eventId, participantId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          to={`/results/${eventId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Live Results
        </Link>

        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                Audited Ballot Records
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                Candidate Vote Verification
              </h1>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Votes: {votes.length}
            </span>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading audit records...</div>
          ) : votes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No votes recorded for this candidate yet.
            </div>
          ) : (
            <div className="space-y-3">
              {votes.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        Voter: {v.voter}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Receipt: <span className="font-mono text-indigo-500">{v.receiptId || `VOTE-${v.id}`}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(v.votedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ParticipantDetail;
