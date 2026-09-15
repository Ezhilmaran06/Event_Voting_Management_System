import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
    error: 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
    warning: 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    info: 'border-indigo-500/30 bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-down ${
              borderColors[toast.type] || borderColors.info
            }`}
          >
            {icons[toast.type] || icons.info}
            <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
