import React from 'react';
import { X, Users, Award, Building, Sparkles } from 'lucide-react';

const CandidateComparisonModal = ({ isOpen, onClose, candidates = [], onSelectCandidate }) => {
  if (!isOpen || candidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden animate-slide-down max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Compare Candidates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review qualifications, manifestos, and categories side-by-side
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(candidates.length, 3)} gap-6`}>
            {candidates.map((c) => (
              <div
                key={c.id || c.participant_id}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-400 transition-colors"
              >
                <div>
                  {/* Photo / Avatar */}
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-4 overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                    {c.teamPictureUrl ? (
                      <img
                        src={c.teamPictureUrl}
                        alt={c.teamName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-white">
                        {(c.teamName || c.username || 'C')[0]}
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-1">
                    {c.teamName || c.username}
                  </h4>
                  <p className="text-xs text-center text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
                    Lead: {c.teamLeader || c.username || 'Candidate Lead'}
                  </p>

                  <div className="space-y-3 text-xs mb-6">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-400 font-bold block mb-0.5">Category</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {c.performanceCategory || 'General'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-400 font-bold block mb-0.5">Institution</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-500" />
                        {c.institution || c.collegeName || 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-400 font-bold block mb-0.5">Manifesto / Project Summary</span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{c.teamDetails || 'Dedicated to innovative excellence and community impact.'}"
                      </p>
                    </div>
                  </div>
                </div>

                {onSelectCandidate && (
                  <button
                    onClick={() => {
                      onSelectCandidate(c);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl gradient-primary text-xs font-bold shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
                  >
                    Select to Vote
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default CandidateComparisonModal;
