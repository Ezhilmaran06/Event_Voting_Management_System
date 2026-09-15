import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-6 shadow-md">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-2">404</h1>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Page Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            The page you are looking for might have been moved, deleted, or does not exist.
          </p>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl gradient-primary text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
