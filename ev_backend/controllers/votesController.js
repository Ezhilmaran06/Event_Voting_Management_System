const db = require('../db');
const { logAudit } = require('../utils/auditLogger');
const { createNotification } = require('../utils/notificationHelper');

// 1. Cast a Vote (with strict validation, duplicate prevention, and receipt generation)
exports.castVote = async (req, res) => {
  try {
    const { eventId, participantId, voterId } = req.body;

    if (eventId == null || participantId == null || voterId == null) {
      return res.status(400).json({ error: 'Missing fields: eventId, participantId and voterId are required' });
    }

    const eId = Number(eventId);
    const pId = Number(participantId);
    const vId = Number(voterId);

    if (!Number.isFinite(eId) || !Number.isFinite(pId) || !Number.isFinite(vId)) {
      return res.status(400).json({ error: 'Invalid fields: eventId, participantId and voterId must be numbers' });
    }

    // Check if event exists and get event details
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [eId]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event does not exist' });
    }
    const event = events[0];

    // Check voting window if specified
    const now = new Date();
    if (event.voting_start && now < new Date(event.voting_start)) {
      return res.status(400).json({ error: 'Voting has not opened yet for this event.' });
    }
    if (event.voting_end && now > new Date(event.voting_end)) {
      return res.status(400).json({ error: 'Voting has concluded for this event.' });
    }

    // Verify candidate is registered in this event
    const [candidateRows] = await db.query(
      `SELECT ue.id, COALESCE(ue.team_name, u.Username, 'Candidate') AS candidateName
       FROM user_events ue
       JOIN users u ON u.id = ue.user_id
       WHERE ue.event_id = ? AND ue.user_id = ?`,
      [eId, pId]
    );
    if (candidateRows.length === 0) {
      return res.status(400).json({ error: 'Selected participant is not registered in this event.' });
    }
    const candidateName = candidateRows[0].candidateName;

    // Check if voter has already voted in this event
    const [existingRows] = await db.query(
      'SELECT id, receipt_id, vote_time FROM votes WHERE event_id = ? AND voter_id = ?',
      [eId, vId]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({
        error: 'You have already voted in this event.',
        receiptId: existingRows[0].receipt_id,
        votedAt: existingRows[0].vote_time
      });
    }

    // Generate cryptographic-style Receipt ID
    const receiptId = `VOTE-${eId}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Insert vote
    const [result] = await db.query(
      'INSERT INTO votes (event_id, participant_id, voter_id, receipt_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [eId, pId, vId, receiptId, req.ip]
    );

    const voteId = result.insertId;
    const voteTime = new Date().toISOString();

    // Log audit & send notification
    await logAudit(vId, req.user?.email, 'VOTE_CAST', `Voted in event ${eId} (${event.name}) for candidate ${pId} (${candidateName}). Receipt: ${receiptId}`, req.ip);
    await createNotification(
      vId,
      'Vote Recorded Successfully!',
      `Your ballot for "${candidateName}" in "${event.name}" was recorded. Receipt ID: ${receiptId}`,
      'success'
    );

    res.status(201).json({
      success: true,
      voteId,
      receiptId,
      eventId: eId,
      eventName: event.name,
      candidateId: pId,
      candidateName,
      voteTime
    });
  } catch (err) {
    console.error('Error in castVote:', err);
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(400).json({ error: 'You have already voted in this event.' });
    }
    res.status(500).json({ error: 'Could not record vote. Please try again.', details: err.message });
  }
};

// 2. Get live voting results for an event
exports.getVotesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event info
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    const event = events.length > 0 ? events[0] : null;

    // Fetch participant rows with vote counts
    const [rows] = await db.query(`
      SELECT
        ue.user_id AS participant_id,
        ue.user_id AS id,
        COALESCE(ue.team_name, u.Username, 'Participant') AS teamName,
        COALESCE(ue.team_leader, u.Username) AS participantName,
        u.email AS participantEmail,
        COALESCE(ue.team_picture, u.avatar) AS teamPictureUrl,
        COALESCE(ue.performance_category, 'General') AS performanceCategory,
        COALESCE(ue.institution, u.clg_name) AS institution,
        COUNT(v.id) AS votes
      FROM user_events ue
      LEFT JOIN users u ON u.id = ue.user_id
      LEFT JOIN votes v ON v.participant_id = ue.user_id AND v.event_id = ?
      WHERE ue.event_id = ?
      GROUP BY ue.user_id, ue.team_name, ue.team_leader, ue.team_picture,
               ue.performance_category, ue.institution, u.Username, u.email, u.clg_name, u.avatar
      ORDER BY votes DESC, teamName ASC
    `, [eventId, eventId]);

    // Calculate total votes and vote percentages
    const totalVotes = rows.reduce((acc, curr) => acc + Number(curr.votes || 0), 0);

    const enrichedResults = rows.map((r, index) => {
      const voteCount = Number(r.votes || 0);
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      return {
        ...r,
        votes: voteCount,
        percent: percentage,
        rank: index + 1,
        isWinner: index === 0 && voteCount > 0
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

// 3. Get detailed votes for a specific candidate (Fixed bug: v.vote_time instead of v.created_at)
exports.getVotesForParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;

    const [rows] = await db.query(`
      SELECT 
        v.id, 
        v.vote_time AS votedAt, 
        v.receipt_id AS receiptId,
        v.voter_id, 
        COALESCE(u.Username, 'Voter') AS username, 
        u.email
      FROM votes v
      LEFT JOIN users u ON u.id = v.voter_id
      WHERE v.event_id = ? AND v.participant_id = ?
      ORDER BY v.id DESC
    `, [eventId, participantId]);

    const maskEmail = (email) => {
      if (!email) return null;
      const parts = String(email).split('@');
      if (parts.length !== 2) return '***';
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 1 ? name[0] + '***' : name[0] + '***';
      return `${maskedName}@${domain}`;
    };

    const result = rows.map(r => ({
      id: r.id,
      receiptId: r.receiptId || `VOTE-${r.id}`,
      votedAt: r.votedAt,
      voter: r.username ? (r.username[0] + '***') : maskEmail(r.email) || 'Anonymous'
    }));

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
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const [rows] = await db.query(`
      SELECT 
        v.id,
        v.receipt_id AS receiptId,
        v.vote_time AS votedAt,
        e.id AS eventId,
        e.name AS eventName,
        e.type AS eventType,
        COALESCE(ue.team_name, cu.Username, 'Candidate') AS candidateName,
        ue.performance_category AS performanceCategory,
        COALESCE(ue.team_picture, cu.avatar) AS candidatePicture
      FROM votes v
      JOIN events e ON e.id = v.event_id
      LEFT JOIN user_events ue ON ue.event_id = v.event_id AND ue.user_id = v.participant_id
      LEFT JOIN users cu ON cu.id = v.participant_id
      WHERE v.voter_id = ?
      ORDER BY v.vote_time DESC
    `, [userId]);

    res.status(200).json(rows);
  } catch (err) {
    console.error('getUserVoteHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch user vote history' });
  }
};
