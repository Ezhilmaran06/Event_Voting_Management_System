const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Event = require('../models/Event');
const User = require('../models/User');
const UserEvent = require('../models/UserEvent');
const { logAudit } = require('../utils/auditLogger');
const { createNotification } = require('../utils/notificationHelper');

// 1. Cast a Vote (with strict validation, duplicate prevention, and receipt generation)
exports.castVote = async (req, res) => {
  try {
    const { eventId, participantId, voterId } = req.body;

    if (!eventId || !participantId || !voterId) {
      return res.status(400).json({ error: 'Missing fields: eventId, participantId and voterId are required' });
    }

    const sEventId = String(eventId).trim();
    const sParticipantId = String(participantId).trim();
    const sVoterId = String(voterId).trim();

    if (!mongoose.Types.ObjectId.isValid(sEventId) ||
        !mongoose.Types.ObjectId.isValid(sParticipantId) ||
        !mongoose.Types.ObjectId.isValid(sVoterId)) {
      return res.status(400).json({ error: 'Invalid ID format: eventId, participantId and voterId must be valid ObjectIds' });
    }

    // Check if event exists and get event details
    const event = await Event.findById(sEventId);
    if (!event) {
      return res.status(404).json({ error: 'Event does not exist' });
    }

    // Check voting window if specified
    const now = new Date();
    if (event.voting_start && now < new Date(event.voting_start)) {
      return res.status(400).json({ error: 'Voting has not opened yet for this event.' });
    }
    if (event.voting_end && now > new Date(event.voting_end)) {
      return res.status(400).json({ error: 'Voting has concluded for this event.' });
    }

    // Verify candidate is registered in this event
    const candidateRegistration = await UserEvent.findOne({
      event_id: sEventId,
      user_id: sParticipantId
    }).populate('user_id');

    if (!candidateRegistration) {
      return res.status(400).json({ error: 'Selected participant is not registered in this event.' });
    }

    const candidateName = candidateRegistration.team_name ||
                          (candidateRegistration.user_id && candidateRegistration.user_id.Username) ||
                          'Candidate';

    // Check if voter has already voted in this event
    const existingVote = await Vote.findOne({
      event_id: sEventId,
      voter_id: sVoterId
    });

    if (existingVote) {
      return res.status(400).json({
        error: 'You have already voted in this event.',
        receiptId: existingVote.receipt_id,
        votedAt: existingVote.vote_time
      });
    }

    // Generate cryptographic-style Receipt ID
    const receiptId = `VOTE-${sEventId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Insert vote with database-level duplicate protection
    const vote = await Vote.create({
      event_id: sEventId,
      participant_id: sParticipantId,
      voter_id: sVoterId,
      receipt_id: receiptId,
      ip_address: req.ip,
      vote_time: now
    });

    // Log audit & send notification
    await logAudit(
      sVoterId,
      req.user?.email,
      'VOTE_CAST',
      `Voted in event ${sEventId} (${event.name}) for candidate ${sParticipantId} (${candidateName}). Receipt: ${receiptId}`,
      req.ip
    );

    await createNotification(
      sVoterId,
      'Vote Recorded Successfully!',
      `Your ballot for "${candidateName}" in "${event.name}" was recorded. Receipt ID: ${receiptId}`,
      'success'
    );

    res.status(201).json({
      success: true,
      voteId: vote.id,
      receiptId,
      eventId: sEventId,
      eventName: event.name,
      candidateId: sParticipantId,
      candidateName,
      voteTime: now.toISOString()
    });
  } catch (err) {
    console.error('Error in castVote:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already voted in this event.' });
    }
    res.status(500).json({ error: 'Could not record vote. Please try again.', details: err.message });
  }
};

// 2. Get live voting results for an event
exports.getVotesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ error: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);

    // Fetch all candidates registered for this event
    const candidates = await UserEvent.find({ event_id: eventId }).populate('user_id');

    // Aggregate vote counts grouped by participant_id
    const voteCounts = await Vote.aggregate([
      { $match: { event_id: new mongoose.Types.ObjectId(eventId) } },
      { $group: { _id: '$participant_id', count: { $sum: 1 } } }
    ]);

    const voteCountMap = new Map();
    voteCounts.forEach(vc => voteCountMap.set(vc._id.toString(), vc.count));

    // Calculate total votes across all candidates in event
    const totalVotes = voteCounts.reduce((acc, curr) => acc + curr.count, 0);

    const results = candidates.map(c => {
      const u = c.user_id || {};
      const participantId = u._id ? u._id.toString() : (c.user_id ? c.user_id.toString() : c.id);
      const voteCount = voteCountMap.get(participantId) || 0;

      return {
        participant_id: participantId,
        id: participantId,
        teamName: c.team_name || u.Username || 'Participant',
        participantName: c.team_leader || u.Username || 'Candidate',
        participantEmail: u.email || null,
        teamPictureUrl: c.team_picture || u.avatar || null,
        performanceCategory: c.performance_category || 'General',
        institution: c.institution || u.clg_name || null,
        votes: voteCount
      };
    });

    // Sort by votes DESC, then teamName ASC
    results.sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return (a.teamName || '').localeCompare(b.teamName || '');
    });

    // Enrich with rank, percent, and isWinner
    const enrichedResults = results.map((r, index) => {
      const percentage = totalVotes > 0 ? Math.round((r.votes / totalVotes) * 100) : 0;
      return {
        ...r,
        percent: percentage,
        rank: index + 1,
        isWinner: index === 0 && r.votes > 0
      };
    });

    res.json({
      event: event ? {
        id: event.id,
        eventName: event.name,
        eventType: event.type,
        institutionName: event.institute_name,
        location: event.location,
        startDateTime: event.start_date_time,
        endDateTime: event.end_date_time
      } : null,
      totalVotes,
      results: enrichedResults
    });
  } catch (err) {
    console.error('Error in getVotesByEvent:', err);
    res.status(500).json({ error: 'Could not fetch votes', details: err.message });
  }
};

// 3. Get detailed votes for a specific candidate
exports.getVotesForParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.json([]);
    }

    const votes = await Vote.find({
      event_id: eventId,
      participant_id: participantId
    })
      .populate('voter_id', 'Username email')
      .sort({ vote_time: -1 });

    const maskEmail = (email) => {
      if (!email) return null;
      const parts = String(email).split('@');
      if (parts.length !== 2) return '***';
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 1 ? name[0] + '***' : name[0] + '***';
      return `${maskedName}@${domain}`;
    };

    const result = votes.map(v => {
      const voter = v.voter_id || {};
      const voterName = voter.Username ? (voter.Username[0] + '***') : maskEmail(voter.email) || 'Anonymous';
      return {
        id: v.id,
        receiptId: v.receipt_id || `VOTE-${v.id}`,
        votedAt: v.vote_time,
        voter: voterName
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error in getVotesForParticipant:', err);
    res.status(500).json({ error: 'Could not fetch vote details', details: err.message });
  }
};

// 4. Get voting history for the currently logged-in user
exports.getUserVoteHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Valid User ID required' });
    }

    const votes = await Vote.find({ voter_id: userId })
      .populate('event_id')
      .populate('participant_id')
      .sort({ vote_time: -1 });

    const formatted = await Promise.all(votes.map(async (v) => {
      const e = v.event_id || {};
      const cu = v.participant_id || {};

      // Get candidate registration details if available
      let ue = null;
      if (e._id && cu._id) {
        ue = await UserEvent.findOne({ event_id: e._id, user_id: cu._id });
      }

      return {
        id: v.id,
        receiptId: v.receipt_id,
        votedAt: v.vote_time,
        eventId: e._id ? e._id.toString() : null,
        eventName: e.name,
        eventType: e.type,
        candidateName: ue?.team_name || cu.Username || 'Candidate',
        performanceCategory: ue?.performance_category || 'General',
        candidatePicture: ue?.team_picture || cu.avatar || null
      };
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('getUserVoteHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch user vote history' });
  }
};
