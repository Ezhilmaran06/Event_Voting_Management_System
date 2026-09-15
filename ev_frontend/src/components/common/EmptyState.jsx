import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There is currently no data to display.',
  actionText,
  onAction
}) => {
  return (
    <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl gradient-primary text-xs font-bold shadow-md shadow-indigo-500/20 hover:scale-105 transition-all duration-200"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
