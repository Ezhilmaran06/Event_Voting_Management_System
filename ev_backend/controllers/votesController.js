const db = require('../db');

// Add a vote
exports.castVote = async (req, res) => {
  try {
    console.log('castVote payload:', req.body);
    const { eventId, participantId, voterId } = req.body;
    // Basic validation
    if (eventId == null || participantId == null || voterId == null) {
      return res.status(400).json({ error: 'Missing fields: eventId, participantId and voterId are required' });
    }

    // Ensure numeric IDs (accept numeric strings too)
    const eId = Number(eventId);
    const pId = Number(participantId);
    const vId = Number(voterId);
    if (!Number.isFinite(eId) || !Number.isFinite(pId) || !Number.isFinite(vId)) {
      return res.status(400).json({ error: 'Invalid fields: eventId, participantId and voterId must be numbers' });
    }
      // Prevent the same voter from voting multiple times in the same event
      const [existingRows] = await db.query(
        'SELECT COUNT(*) AS cnt FROM votes WHERE event_id = ? AND voter_id = ?',
        [eId, vId]
      );
      const already = existingRows && existingRows[0] && existingRows[0].cnt > 0;
      if (already) {
        return res.status(400).json({ error: 'You have already voted in this event' });
      }
      const [result] = await db.query(
        'INSERT INTO votes (event_id, participant_id, voter_id) VALUES (?, ?, ?)',
        [eId, pId, vId]
      );
      res.status(201).json({ success: true, voteId: result.insertId });
  } catch (err) {
      // Log full error server-side for debugging
      console.error('Error in castVote:', err);
    // Handle duplicate key error (race condition)
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(400).json({ error: 'You have already voted in this event' });
    }
    res.status(500).json({ error: 'Could not save vote', details: err.message });
  }
};

// Assuming you want: participant_id, username, profile image, and votes count

    exports.getVotesByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
    // Return participant info (name and email) along with team_name, picture and vote count
    // NOTE: some user tables in this project use `Username` or `username` column names.
    // Avoid referencing non-existent `u.name` which caused a server error.
    const [rows] = await db.query(`
      SELECT
        ue.user_id AS participant_id,
        COALESCE(ue.team_name, u.Username, u.username, u.email) AS teamName,
        COALESCE(u.Username, u.username) AS participantName,
        u.email AS participantEmail,
        ue.team_picture AS teamPictureUrl,
        COUNT(v.id) AS votes
      FROM user_events ue
      LEFT JOIN users u ON u.id = ue.user_id
      LEFT JOIN votes v ON v.participant_id = ue.user_id AND v.event_id = ?
      WHERE ue.event_id = ?
      GROUP BY ue.user_id, ue.team_name, ue.team_picture, u.Username, u.username, u.email
      ORDER BY votes DESC
    `, [eventId, eventId]);
    res.json(rows);
    } catch (err) {
    res.status(500).json({ error: 'Could not fetch votes', details: err.message });
  }
};

// Get detailed votes for a specific participant in an event (anonymized voter info)
exports.getVotesForParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const [rows] = await db.query(`
      SELECT v.id, v.created_at AS votedAt, v.voter_id, u.username, u.email
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
      votedAt: r.votedAt,
      voter: r.username ? (r.username[0] + '***') : maskEmail(r.email) || 'Anonymous'
    }));

    res.json(result);
  } catch (err) {
    console.error('Error in getVotesForParticipant:', err);
    res.status(500).json({ error: 'Could not fetch vote details', details: err.message });
  }
};

