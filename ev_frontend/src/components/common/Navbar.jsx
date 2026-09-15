import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEvent } from '../../context/EventContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { 
  Vote, Calendar, Users, Trophy, LayoutDashboard, Shield, 
  Bell, Sun, Moon, LogIn, LogOut, User, Menu, X, Check, ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { currentUser, logoutUser, unreadNotifications, refreshNotifications } = useEvent();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await api.notifications.getAll(currentUser.id);
      setNotificationsList(res.notifications || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotifications = () => {
    if (!notificationsOpen) {
      fetchNotifications();
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser?.id) return;
    try {
      await api.notifications.markAllAsRead(currentUser.id);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      refreshNotifications();
      showToast('All notifications marked as read', 'success');
    } catch (e) {
      showToast('Failed to update notifications', 'error');
    }
  };

  const handleLogout = () => {
    logoutUser();
    showToast('Logged out successfully', 'info');
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/home', icon: Vote },
    { name: 'Events', path: '/home#events-section', icon: Calendar },
    { name: 'Candidates', path: '/candidates', icon: Users },
    { name: 'Results', path: '/results', icon: Trophy },
  ];

  if (currentUser) {
    navLinks.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });
  }

  if (currentUser?.role === 'Admin') {
    navLinks.push({ name: 'Admin', path: '/admin', icon: Shield, badge: 'PRO' });
  }

  return (
    <nav className="glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                EventVote
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                  {link.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Icons: Theme, Notifications, Profile */}
          <div className="flex items-center gap-2">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Notification Bell (if logged in) */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleToggleNotifications}
                  aria-label="Notifications"
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-slide-down">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                        <span>Notifications</span>
                        {unreadNotifications > 0 && (
                          <span className="bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 text-xs px-2 py-0.5 rounded-full font-bold">
                            {unreadNotifications} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {notificationsList.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notificationsList.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left ${
                              !n.is_read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Dropdown or Auth Button */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline-block text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                    {currentUser.username}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:inline-block" />
                </button>

                {/* Dropdown menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-slide-down">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        Role: {currentUser.role || 'Participant'}
                      </span>
                    </div>

                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                      My Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-purple-500" />
                      Profile & Settings
                    </Link>

                    {currentUser.role === 'Admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Console
                      </Link>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-xs font-bold rounded-xl gradient-primary shadow-sm hover:shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-2 animate-slide-down">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 text-indigo-500" />
                {link.name}
              </Link>
            );
          })}

          {!currentUser ? (
            <div className="pt-4 flex flex-col gap-2">
              <Link
                to="/"
                className="w-full text-center py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="w-full text-center py-2.5 rounded-xl gradient-primary text-sm font-bold shadow-md shadow-indigo-500/20"
              >
                Create Free Account
              </Link>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
