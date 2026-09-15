import React from 'react';
import { CheckCircle, Printer, X, ShieldCheck, Download, Share2 } from 'lucide-react';

const VoteReceiptModal = ({ isOpen, onClose, receiptData }) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-down print:border-none print:shadow-none print:w-full">
        
        {/* Receipt Header Banner */}
        <div className="gradient-primary p-6 text-center text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Vote Successfully Recorded</h2>
          <p className="text-xs text-indigo-100 mt-1">Official Cryptographic Digital Receipt</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 font-mono text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Receipt Identifier
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 select-all">
              {receiptData.receiptId || `VOTE-REC-${receiptData.voteId || '001'}`}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Event</span>
              <span className="font-bold text-slate-900 dark:text-white text-right max-w-[240px] truncate">
                {receiptData.eventName || 'Official Event'}
              </span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Ballot Cast For</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
                {receiptData.candidateName || 'Selected Candidate'}
              </span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Timestamp</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {new Date(receiptData.voteTime || Date.now()).toLocaleString()}
              </span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Verification Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Immutable & Audited
              </span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed text-center">
            🔒 Your vote is confidential and protected against duplicates. Keep this receipt ID for verification or audit inquiries.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl gradient-primary text-xs font-bold shadow-md shadow-indigo-500/20 hover:scale-105 transition-all duration-200"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default VoteReceiptModal;
