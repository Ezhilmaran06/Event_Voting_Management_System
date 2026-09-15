import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import { ArrowLeft, Upload, X, Users, Award, Building, FileText, CheckCircle2 } from 'lucide-react';

const ParticipantRegister = () => {
  const navigate = useNavigate();
  const { events, currentUser } = useEvent();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    eventId: sessionStorage.getItem('selectedEventId') || (events[0]?.id ? String(events[0].id) : ''),
    teamName: '',
    teamLeaderName: currentUser?.username || '',
    institution: currentUser?.collegeName || '',
    performanceCategory: 'Technical Presentation',
    teamDetails: '',
    teamPicturePreview: null
  });

  const [loading, setLoading] = useState(false);

  const performanceCategories = [
    'Technical Presentation',
    'AI Project',
    'Web Innovation',
    'Solo Performance',
    'Group Performance',
    'Sports Tournament',
    'Creative Arts',
    'Academic Research'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return showToast('Image size should be less than 5MB', 'error');
    }
    if (!file.type.startsWith('image/')) {
      return showToast('Please upload an image file (PNG/JPG)', 'error');
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({
        ...prev,
        teamPicturePreview: ev.target?.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, teamPicturePreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.eventId) return showToast('Please select a competition event', 'error');
    if (!formData.teamName.trim()) return showToast('Team name is required', 'error');
    if (!formData.teamLeaderName.trim()) return showToast('Team leader name is required', 'error');
    if (!currentUser?.id) {
      showToast('Please login first to register', 'info');
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      await api.candidates.register({
        user_id: currentUser.id || currentUser._id,
        event_id: formData.eventId,
        team_name: formData.teamName,
        team_leader: formData.teamLeaderName,
        institution: formData.institution,
        performance_category: formData.performanceCategory,
        team_details: formData.teamDetails,
        team_picture: formData.teamPicturePreview || null
      });

      showToast('🎉 Candidate team registered successfully!', 'success');
      sessionStorage.removeItem('selectedEventId');
      navigate(`/events/${formData.eventId}`);
    } catch (err) {
      console.error('Participant register error:', err);
      showToast(err.message || 'Failed to register team', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedEvent = events.find((e) => String(e.id) === String(formData.eventId));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          to="/register-login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Participation Mode
        </Link>

        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Register Candidate Team
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedEvent ? `Competing in: ${selectedEvent.eventName}` : 'Submit team credentials and project summary'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Competition Event *
              </label>
              <select
                name="eventId"
                value={formData.eventId}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose an Event --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.eventName} ({ev.computedStatus})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Team Name / Project Title *
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  placeholder="e.g. CyberDynasties"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Team Leader / Primary Presenter *
                </label>
                <input
                  type="text"
                  name="teamLeaderName"
                  value={formData.teamLeaderName}
                  onChange={handleInputChange}
                  placeholder="e.g. Jordan Lee"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Institution / Affiliated College
                </label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  placeholder="e.g. Tech University"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Performance Category *
                </label>
                <select
                  name="performanceCategory"
                  value={formData.performanceCategory}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {performanceCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team Manifesto / Summary */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Project Summary / Team Manifesto *
              </label>
              <textarea
                name="teamDetails"
                rows={3}
                value={formData.teamDetails}
                onChange={handleInputChange}
                required
                placeholder="Describe your project, objectives, technologies used, or presentation goals..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Team Picture / Project Poster (Optional)
              </label>
              {formData.teamPicturePreview ? (
                <div className="relative w-48 h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={formData.teamPicturePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click to upload team photo or poster
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl gradient-primary text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all"
              >
                {loading ? 'Submitting Registration...' : 'Complete Team Registration'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ParticipantRegister;
