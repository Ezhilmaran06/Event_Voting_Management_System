const mongoose = require('mongoose');
const Event = require('../models/Event');
const UserEvent = require('../models/UserEvent');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');
const { notifyAllUsers } = require('../utils/notificationHelper');

// Helper to compute event dynamic status
const computeEventStatus = (event) => {
  if (event.status === 'Cancelled' || event.status === 'Draft') {
    return event.status;
  }

  const now = new Date();
  const start = event.start_date_time || event.startDateTime ? new Date(event.start_date_time || event.startDateTime) : null;
  const end = event.end_date_time || event.endDateTime ? new Date(event.end_date_time || event.endDateTime) : null;
  const vStart = event.voting_start || event.votingStart ? new Date(event.voting_start || event.votingStart) : start;
  const vEnd = event.voting_end || event.votingEnd ? new Date(event.voting_end || event.votingEnd) : end;

  if (vStart && vEnd && now >= vStart && now <= vEnd) {
    return 'Voting Open';
  }
  if (start && now < start) {
    return 'Upcoming';
  }
  if (start && end && now >= start && now <= end) {
    return 'Ongoing';
  }
  if (end && now > end) {
    return 'Completed';
  }
  return event.status || 'Upcoming';
};

// 1. Create a new event
exports.createEvent = async (req, res) => {
  const {
    name,
    description,
    banner_url,
    bannerUrl,
    type,
    category,
    start_date_time,
    startDateTime,
    end_date_time,
    endDateTime,
    voting_start,
    votingStart,
    voting_end,
    votingEnd,
    institute_name,
    institutionName,
    location,
    manager_name,
    managerName,
    ph_no,
    phoneNumber,
    user_email,
    email,
    max_participants,
    maxParticipants,
    rules
  } = req.body;

  const eventName = name || req.body.eventName;
  const eventEmail = user_email || email || req.user?.email;

  if (!eventName || !eventEmail) {
    return res.status(400).json({ error: "Event name and organizer email are required" });
  }

  const sDate = start_date_time || startDateTime || new Date();
  const eDate = end_date_time || endDateTime || new Date(Date.now() + 3 * 86400000);
  const vStart = voting_start || votingStart || sDate;
  const vEnd = voting_end || votingEnd || eDate;

  try {
    let organizerId = req.user?.id || null;
    if (!organizerId) {
      const org = await User.findOne({ email: eventEmail.toLowerCase().trim() });
      if (org) organizerId = org._id;
    }

    const newEvent = await Event.create({
      name: eventName,
      description: description || 'Exciting competitive event featuring talent, skills, and audience voting.',
      banner_url: banner_url || bannerUrl || null,
      type: type || 'Competition',
      category: category || type || 'General',
      start_date_time: sDate,
      end_date_time: eDate,
      voting_start: vStart,
      voting_end: vEnd,
      institute_name: institute_name || institutionName || 'Campus Venue',
      location: location || 'Main Auditorium',
      manager_name: manager_name || managerName || 'Event Coordinator',
      ph_no: ph_no || phoneNumber || '9876543210',
      user_email: eventEmail.toLowerCase().trim(),
      organizer: organizerId,
      max_participants: max_participants || maxParticipants || 50,
      rules: rules || '1. One vote per participant\n2. Maintain event decorum\n3. Voting decisions are final',
      status: 'Upcoming'
    });

    await logAudit(req.user?.id, eventEmail, 'EVENT_CREATE', `Created event: ${eventName} (ID: ${newEvent.id})`, req.ip);
    await notifyAllUsers('New Event Created!', `Registration is now open for ${eventName}. Check it out!`, 'info');

    res.status(201).json({
      message: "Event created successfully",
      eventId: newEvent.id
    });
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ error: "Database error creating event", details: err.message });
  }
};

// 2. Get all events (with dynamic counts and computed status)
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ start_date_time: -1 });

    // Aggregate participant counts per event
    const participantCounts = await UserEvent.aggregate([
      { $group: { _id: '$event_id', count: { $sum: 1 } } }
    ]);
    const participantCountMap = new Map();
    participantCounts.forEach(pc => participantCountMap.set(pc._id.toString(), pc.count));

    // Aggregate vote counts per event
    const voteCounts = await Vote.aggregate([
      { $group: { _id: '$event_id', count: { $sum: 1 } } }
    ]);
    const voteCountMap = new Map();
    voteCounts.forEach(vc => voteCountMap.set(vc._id.toString(), vc.count));

    const enriched = events.map(event => {
      const eObj = event.toJSON();
      const computed = computeEventStatus(eObj);
      const eId = event._id.toString();

      return {
        ...eObj,
        participantCount: participantCountMap.get(eId) || 0,
        totalVotes: voteCountMap.get(eId) || 0,
        computedStatus: computed,
        isVotingOpen: computed === 'Voting Open',
        phoneNumber: eObj.phoneNumber ? eObj.phoneNumber.toString() : ''
      };
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// 3. Get single event by ID
exports.getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const participantCount = await UserEvent.countDocuments({ event_id: event._id });
    const totalVotes = await Vote.countDocuments({ event_id: event._id });

    const eObj = event.toJSON();
    const computed = computeEventStatus(eObj);

    res.status(200).json({
      ...eObj,
      participantCount,
      totalVotes,
      computedStatus: computed,
      isVotingOpen: computed === 'Voting Open',
      phoneNumber: eObj.phoneNumber ? eObj.phoneNumber.toString() : ''
    });
  } catch (err) {
    console.error('getEventById error:', err);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
};

// 4. Update Event
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const {
    name, description, banner_url, bannerUrl, type, category,
    start_date_time, startDateTime, end_date_time, endDateTime,
    voting_start, votingStart, voting_end, votingEnd,
    institute_name, institutionName, location,
    manager_name, managerName, ph_no, phoneNumber, rules, status
  } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (banner_url !== undefined || bannerUrl !== undefined) updateFields.banner_url = banner_url || bannerUrl;
    if (type !== undefined) updateFields.type = type;
    if (category !== undefined) updateFields.category = category;
    if (start_date_time !== undefined || startDateTime !== undefined) updateFields.start_date_time = start_date_time || startDateTime;
    if (end_date_time !== undefined || endDateTime !== undefined) updateFields.end_date_time = end_date_time || endDateTime;
    if (voting_start !== undefined || votingStart !== undefined) updateFields.voting_start = voting_start || votingStart;
    if (voting_end !== undefined || votingEnd !== undefined) updateFields.voting_end = voting_end || votingEnd;
    if (institute_name !== undefined || institutionName !== undefined) updateFields.institute_name = institute_name || institutionName;
    if (location !== undefined) updateFields.location = location;
    if (manager_name !== undefined || managerName !== undefined) updateFields.manager_name = manager_name || managerName;
    if (ph_no !== undefined || phoneNumber !== undefined) updateFields.ph_no = ph_no || phoneNumber;
    if (rules !== undefined) updateFields.rules = rules;
    if (status !== undefined) updateFields.status = status;

    const updated = await Event.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ error: "Event not found" });
    }

    await logAudit(req.user?.id, req.user?.email, 'EVENT_UPDATE', `Updated event ID ${id}`, req.ip);
    res.status(200).json({ message: "Event updated successfully" });
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// 5. Delete Event
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Cascade delete votes and registrations
    await Vote.deleteMany({ event_id: id });
    await UserEvent.deleteMany({ event_id: id });
    await Event.findByIdAndDelete(id);

    await logAudit(req.user?.id, req.user?.email, 'EVENT_DELETE', `Deleted event: ${event.name} (ID: ${id})`, req.ip);

    res.status(200).json({ message: "Event deleted successfully along with associated records" });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
