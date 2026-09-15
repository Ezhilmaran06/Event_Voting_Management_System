import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
      <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
      <div className="space-y-2">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-4/5" />
      </div>
      <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-28" />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full" />
      ))}
    </div>
  );
};

export default CardSkeleton;
