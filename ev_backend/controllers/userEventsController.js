const mongoose = require('mongoose');
const UserEvent = require('../models/UserEvent');
const Event = require('../models/Event');
const User = require('../models/User');
const Vote = require('../models/Vote');
const { logAudit } = require('../utils/auditLogger');
const { createNotification } = require('../utils/notificationHelper');

// 1. Register a user/team to an event
exports.registerUserToEvent = async (req, res) => {
  const {
    user_id,
    userId,
    event_id,
    eventId,
    team_name,
    teamName,
    team_leader,
    teamLeader,
    team_details,
    teamDetails,
    performance_category,
    performanceCategory,
    institution,
    team_picture,
    teamPictureUrl
  } = req.body;

  const rawUserId = user_id || userId || req.user?.id;
  const rawEventId = event_id || eventId;
  const finalTeamName = team_name || teamName || 'Participant Team';
  const finalLeader = team_leader || teamLeader || null;
  const finalDetails = team_details || teamDetails || '';
  const finalCategory = performance_category || performanceCategory || 'General';
  const finalInstitution = institution || null;
  const finalPicture = team_picture || teamPictureUrl || null;

  if (!rawUserId || !rawEventId) {
    return res.status(400).json({ error: 'user_id and event_id are required' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(rawUserId) || !mongoose.Types.ObjectId.isValid(rawEventId)) {
      return res.status(400).json({ error: 'Invalid user or event ID format' });
    }

    const event = await Event.findById(rawEventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const registration = await UserEvent.create({
      user_id: rawUserId,
      event_id: rawEventId,
      team_name: finalTeamName,
      team_leader: finalLeader,
      team_details: finalDetails,
      performance_category: finalCategory,
      institution: finalInstitution,
      team_picture: finalPicture,
      status: 'approved'
    });

    await createNotification(
      rawUserId,
      'Registration Confirmed!',
      `You have successfully registered ${finalTeamName} for "${event.name}".`,
      'success'
    );

    await logAudit(
      rawUserId,
      req.user?.email,
      'CANDIDATE_REGISTER',
      `Registered for event ${rawEventId} as ${finalTeamName}`,
      req.ip
    );

    res.status(201).json({
      id: registration.id,
      message: 'Participant registered to event successfully'
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'You are already registered for this event' });
    } else {
      console.error('registerUserToEvent error:', err);
      res.status(500).json({ error: 'Failed to register participant to event' });
    }
  }
};

// 2. Get all events a specific user is registered for
exports.getUserEvents = async (req, res) => {
  const userId = req.params.id || req.user?.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json([]);
    }

    const records = await UserEvent.find({ user_id: userId })
      .populate('event_id')
      .sort({ registered_at: -1 });

    const formatted = records.map(r => {
      const ev = r.event_id || {};
      return {
        eventId: ev._id ? ev._id.toString() : null,
        eventName: ev.name,
        eventType: ev.type,
        startDateTime: ev.start_date_time,
        endDateTime: ev.end_date_time,
        votingStart: ev.voting_start,
        votingEnd: ev.voting_end,
        location: ev.location,
        userEventId: r.id,
        teamName: r.team_name,
        teamLeader: r.team_leader,
        teamDetails: r.team_details,
        performanceCategory: r.performance_category,
        teamPictureUrl: r.team_picture,
        registeredAt: r.registered_at,
        registrationStatus: r.status
      };
    });

    res.status(200).json(formatted);
  } catch (err) {
    console.error('getUserEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
};

// 3. Get all candidates/participants for a specific event
exports.getEventUsers = async (req, res) => {
  const eventId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(200).json([]);
    }

    const records = await UserEvent.find({ event_id: eventId }).populate('user_id');

    // Aggregate vote count per candidate in this event
    const voteCounts = await Vote.aggregate([
      { $match: { event_id: new mongoose.Types.ObjectId(eventId) } },
      { $group: { _id: '$participant_id', count: { $sum: 1 } } }
    ]);
    const voteMap = new Map();
    voteCounts.forEach(vc => voteMap.set(vc._id.toString(), vc.count));

    const rows = records.map(ue => {
      const u = ue.user_id || {};
      const uId = u._id ? u._id.toString() : (ue.user_id ? ue.user_id.toString() : null);
      const voteCount = voteMap.get(uId) || 0;

      return {
        userEventId: ue.id,
        id: ue.id,
        userId: uId,
        participant_id: uId,
        teamName: ue.team_name || u.Username || 'Participant',
        teamLeader: ue.team_leader || u.Username,
        performanceCategory: ue.performance_category || 'General',
        teamDetails: ue.team_details || '',
        institution: ue.institution || u.clg_name || '',
        teamPictureUrl: ue.team_picture || u.avatar || null,
        registeredAt: ue.registered_at,
        status: ue.status,
        username: u.Username,
        email: u.email,
        collegeName: u.clg_name,
        voteCount
      };
    });

    // Sort by votes desc, then registeredAt asc
    rows.sort((a, b) => b.voteCount - a.voteCount);

    res.status(200).json(rows);
  } catch (err) {
    console.error('getEventUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch event participants' });
  }
};

// 4. Get all candidates across all events (for Candidate Explorer & Comparison)
exports.getAllUserEvents = async (req, res) => {
  try {
    const records = await UserEvent.find()
      .populate('user_id')
      .populate('event_id')
      .sort({ registered_at: -1 });

    const voteCounts = await Vote.aggregate([
      {
        $group: {
          _id: { event_id: '$event_id', participant_id: '$participant_id' },
          count: { $sum: 1 }
        }
      }
    ]);
    const voteMap = new Map();
    voteCounts.forEach(vc => {
      const key = `${vc._id.event_id}_${vc._id.participant_id}`;
      voteMap.set(key, vc.count);
    });

    const rows = records.map(ue => {
      const u = ue.user_id || {};
      const e = ue.event_id || {};
      const uId = u._id ? u._id.toString() : null;
      const eId = e._id ? e._id.toString() : null;
      const voteCount = voteMap.get(`${eId}_${uId}`) || 0;

      return {
        id: ue.id,
        userEventId: ue.id,
        user_id: uId,
        event_id: eId,
        teamName: ue.team_name || u.Username || 'Candidate',
        teamLeader: ue.team_leader || u.Username,
        performanceCategory: ue.performance_category || 'General',
        teamDetails: ue.team_details || '',
        institution: ue.institution || u.clg_name || '',
        teamPictureUrl: ue.team_picture || u.avatar || null,
        registered_at: ue.registered_at,
        status: ue.status,
        user_email: u.email,
        username: u.Username,
        event_name: e.name,
        event_type: e.type,
        voteCount
      };
    });

    res.status(200).json(rows);
  } catch (err) {
    console.error('getAllUserEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch all user events' });
  }
};

// 5. Update an existing user_event entry
exports.updateUserEvent = async (req, res) => {
  const { id } = req.params;
  const {
    team_name, teamName,
    team_leader, teamLeader,
    team_details, teamDetails,
    performance_category, performanceCategory,
    institution,
    team_picture, teamPictureUrl
  } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Participant record not found' });
    }

    const updateFields = {};
    if (team_name !== undefined || teamName !== undefined) updateFields.team_name = team_name || teamName;
    if (team_leader !== undefined || teamLeader !== undefined) updateFields.team_leader = team_leader || teamLeader;
    if (team_details !== undefined || teamDetails !== undefined) updateFields.team_details = team_details || teamDetails;
    if (performance_category !== undefined || performanceCategory !== undefined) updateFields.performance_category = performance_category || performanceCategory;
    if (institution !== undefined) updateFields.institution = institution;
    if (team_picture !== undefined || teamPictureUrl !== undefined) updateFields.team_picture = team_picture || teamPictureUrl;

    const updated = await UserEvent.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Participant record not found' });
    }

    res.status(200).json({ message: 'Participant record updated successfully' });
  } catch (err) {
    console.error('updateUserEvent error:', err);
    res.status(500).json({ error: 'Failed to update participant record' });
  }
};

// 6. Delete a candidate/user_event entry
exports.deleteUserEvent = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Participant record not found' });
    }

    const existing = await UserEvent.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Participant record not found' });
    }

    // Delete related votes
    await Vote.deleteMany({ event_id: existing.event_id, participant_id: existing.user_id });
    await UserEvent.findByIdAndDelete(id);

    await logAudit(req.user?.id, req.user?.email, 'CANDIDATE_REMOVE', `Removed candidate record ID ${id}`, req.ip);
    res.status(200).json({ message: 'Candidate removed successfully' });
  } catch (err) {
    console.error('deleteUserEvent error:', err);
    res.status(500).json({ error: 'Failed to delete participant record' });
  }
};