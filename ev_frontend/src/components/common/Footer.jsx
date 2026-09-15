import React from 'react';
import { Link } from 'react-router-dom';
import { Vote, Shield, CheckCircle, Github, Heart, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/home" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                EventVote
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Empowering organizations, universities, and communities with real-time, transparent, and cryptographically verified event management and democratic audience voting.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>All Systems Operational • Real-time DB Sync</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/home" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link to="/candidates" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Candidates & Teams
                </Link>
              </li>
              <li>
                <Link to="/results" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Live Voting Results
                </Link>
              </li>
              <li>
                <Link to="/register-login" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Participate or Vote
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Governance */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Governance
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/admin" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" /> Admin Portal
                </Link>
              </li>
              <li className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Audit Logged
              </li>
              <li className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Duplicate Ballot Guard
              </li>
              <li className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Digital Receipts
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Event Organization & Voting Management System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for modern symposiums
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
