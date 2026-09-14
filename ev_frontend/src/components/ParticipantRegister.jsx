import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEvent } from "../context/EventContext";
import { ArrowLeft, Upload, X, Camera } from "lucide-react";

const ParticipantRegister = () => {
  const navigate = useNavigate();
  const { events = [], registerParticipant } = useEvent();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    eventId: sessionStorage.getItem("selectedEventId") || "",
    teamName: "",
    teamLeaderName: "",
    institution: "",
    performanceCategory: "",
    teamDetails: "",
    teamPicture: null,
    teamPicturePreview: null,
  });

  const [message, setMessage] = useState("");

  const performanceCategories = [
    "Solo Performance",
    "Group Performance",
    "Technical Presentation",
    "Creative Arts",
    "Sports Team",
    "Academic Project",
    "Innovation Challenge",
    "Cultural Showcase",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return setMessage("Image size should be less than 5MB");
    if (!file.type.startsWith("image/"))
      return setMessage("Please upload only image files");

    const reader = new FileReader();
    reader.onload = (ev) =>
      setFormData((prev) => ({
        ...prev,
        teamPicture: file,
        teamPicturePreview: ev.target?.result,
      }));
    reader.readAsDataURL(file);
    setMessage("");
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      teamPicture: null,
      teamPicturePreview: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    if (!formData.eventId) return "Please select an event";
    if (!formData.teamName.trim()) return "Team name is required";
    if (!formData.teamLeaderName.trim())
      return "Team leader name is required";
    if (!formData.institution.trim()) return "Institution is required";
    if (!formData.performanceCategory)
      return "Performance category is required";
    if (!formData.teamDetails.trim()) return "Team details are required";
    if (!formData.teamPicture) return "Team picture is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) return setMessage(err);

    const participantData = {
      eventId: formData.eventId,
      teamName: formData.teamName,
      teamLeaderName: formData.teamLeaderName,
      institution: formData.institution,
      performanceCategory: formData.performanceCategory,
      teamDetails: formData.teamDetails,
      teamPictureUrl: formData.teamPicturePreview || undefined,
    };

    try {
      if (registerParticipant) await registerParticipant(participantData);
      setMessage("✅ Registration successful! Redirecting to home...");
      setTimeout(() => {
        sessionStorage.removeItem("selectedEventId");
        navigate("/home");
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage("An error occurred during registration");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const selectedEvent = Array.isArray(events)
    ? events.find(
        (ev) =>
          ev.id?.toString() === formData.eventId?.toString()
      )
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12 relative">
          <button
            onClick={() => navigate("/register-login")}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Participant Registration
          </h1>
          <p className="text-lg text-gray-600">
            Register your team for the competition
          </p>
        </header>

        {message && (
          <div
            className={`max-w-4xl mx-auto mb-8 p-4 rounded-lg font-semibold ${
              message.includes("successful")
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          {selectedEvent && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl mb-8 text-center border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Registering for: {selectedEvent.eventName}
              </h3>
              <p className="text-blue-700 font-medium">
                {selectedEvent.eventType} • {selectedEvent.institutionName}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Event *
                </label>
                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                >
                  <option value="">Choose an event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.eventName} - {ev.eventType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                  placeholder="Enter your team name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team Leader Name *
                </label>
                <input
                  type="text"
                  name="teamLeaderName"
                  value={formData.teamLeaderName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                  placeholder="Enter team leader name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Institution *
                </label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                  placeholder="Enter institution name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Performance Category *
              </label>
              <select
                name="performanceCategory"
                value={formData.performanceCategory}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
              >
                <option value="">Select performance category</option>
                {performanceCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Team Details *
              </label>
              <textarea
                name="teamDetails"
                value={formData.teamDetails}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg resize-vertical min-h-[100px]"
                placeholder="Describe your team..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Team Picture *
              </label>
              <div className="relative">
                {!formData.teamPicturePreview ? (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera
                      size={48}
                      className="mx-auto text-gray-400 mb-3"
                    />
                    <p className="font-semibold text-gray-700 mb-1">
                      Click to upload team picture
                    </p>
                    <span className="text-sm text-gray-500">
                      PNG, JPG up to 5MB
                    </span>
                  </div>
                ) : (
                  <div className="relative inline-block rounded-xl overflow-hidden">
                    <img
                      src={formData.teamPicturePreview}
                      alt="Team preview"
                      className="max-w-full max-h-80 rounded-xl shadow-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-black bg-opacity-70 text-white rounded-full w-8 h-8"
                      onClick={removeImage}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-end pt-6">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-2"
              >
                <Upload size={20} /> Register Team
              </button>
              <Link
                to="/register-login"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-bold text-lg"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParticipantRegister;
