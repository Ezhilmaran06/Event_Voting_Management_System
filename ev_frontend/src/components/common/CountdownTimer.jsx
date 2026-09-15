import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ targetDate, label = 'Voting Ends In', onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (!targetDate || timeLeft.expired) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
        <Clock className="w-3.5 h-3.5" />
        <span>Concluded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/60 dark:border-indigo-800/60 px-3.5 py-2 rounded-xl text-xs">
      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
      <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1 hidden sm:inline">
        {label}:
      </span>
      <div className="flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400">
        <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-sm">
          {String(timeLeft.days).padStart(2, '0')}d
        </span>
        :
        <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-sm">
          {String(timeLeft.hours).padStart(2, '0')}h
        </span>
        :
        <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-sm">
          {String(timeLeft.minutes).padStart(2, '0')}m
        </span>
        :
        <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-sm">
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
};

export default CountdownTimer;
