const db = require('../db');
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

  const finalUserId = user_id || userId || req.user?.id;
  const finalEventId = event_id || eventId;
  const finalTeamName = team_name || teamName || 'Participant Team';
  const finalLeader = team_leader || teamLeader || null;
  const finalDetails = team_details || teamDetails || '';
  const finalCategory = performance_category || performanceCategory || 'General';
  const finalInstitution = institution || null;
  const finalPicture = team_picture || teamPictureUrl || null;

  if (!finalUserId || !finalEventId) {
    return res.status(400).json({ error: 'user_id and event_id are required' });
  }

  try {
    // Check if event exists
    const [events] = await db.query('SELECT name FROM events WHERE id = ?', [finalEventId]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const [result] = await db.query(
      `INSERT INTO user_events (
         user_id, event_id, team_name, team_leader, team_details,
         performance_category, institution, team_picture, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [
        finalUserId,
        finalEventId,
        finalTeamName,
        finalLeader,
        finalDetails,
        finalCategory,
        finalInstitution,
        finalPicture
      ]
    );

    const registrationId = result.insertId;

    await createNotification(
      finalUserId,
      'Registration Confirmed!',
      `You have successfully registered ${finalTeamName} for "${events[0].name}".`,
      'success'
    );

    await logAudit(
      finalUserId,
      req.user?.email,
      'CANDIDATE_REGISTER',
      `Registered for event ${finalEventId} as ${finalTeamName}`,
      req.ip
    );

    res.status(201).json({
      id: registrationId,
      message: 'Participant registered to event successfully'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
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
    const [rows] = await db.query(
      `SELECT 
         e.id AS eventId,
         e.name AS eventName,
         e.type AS eventType,
         e.start_date_time AS startDateTime,
         e.end_date_time AS endDateTime,
         e.voting_start AS votingStart,
         e.voting_end AS votingEnd,
         e.location,
         ue.id AS userEventId,
         ue.team_name AS teamName,
         ue.team_leader AS teamLeader,
         ue.team_details AS teamDetails,
         ue.performance_category AS performanceCategory,
         ue.team_picture AS teamPictureUrl,
         ue.registered_at AS registeredAt,
         ue.status AS registrationStatus
       FROM events e
       JOIN user_events ue ON e.id = ue.event_id
       WHERE ue.user_id = ?
       ORDER BY ue.registered_at DESC`,
      [userId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('getUserEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
};

// 3. Get all candidates/participants for a specific event
exports.getEventUsers = async (req, res) => {
  const eventId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT 
         ue.id AS userEventId,
         ue.id AS id,
         ue.user_id AS userId,
         ue.user_id AS participant_id,
         COALESCE(ue.team_name, u.Username, 'Participant') AS teamName,
         COALESCE(ue.team_leader, u.Username) AS teamLeader,
         ue.performance_category AS performanceCategory,
         ue.team_details AS teamDetails,
         COALESCE(ue.institution, u.clg_name) AS institution,
         COALESCE(ue.team_picture, u.avatar) AS teamPictureUrl,
         ue.registered_at AS registeredAt,
         ue.status,
         u.Username AS username,
         u.email,
         u.clg_name AS collegeName,
         COUNT(v.id) AS voteCount
       FROM user_events ue
       JOIN users u ON u.id = ue.user_id
       LEFT JOIN votes v ON v.participant_id = ue.user_id AND v.event_id = ue.event_id
       WHERE ue.event_id = ?
       GROUP BY ue.id, ue.user_id, ue.team_name, ue.team_leader, ue.performance_category,
                ue.team_details, ue.institution, ue.team_picture, ue.registered_at, ue.status,
                u.Username, u.email, u.clg_name
       ORDER BY voteCount DESC, ue.registered_at ASC`,
      [eventId]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('getEventUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch event participants' });
  }
};

// 4. Get all candidates across all events (for Candidate Explorer & Comparison)
exports.getAllUserEvents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         ue.id,
         ue.id AS userEventId,
         ue.user_id,
         ue.event_id,
         ue.team_name AS teamName,
         ue.team_leader AS teamLeader,
         ue.performance_category AS performanceCategory,
         ue.team_details AS teamDetails,
         ue.institution,
         ue.team_picture AS teamPictureUrl,
         ue.registered_at,
         ue.status,
         u.email AS user_email,
         u.Username AS username,
         e.name AS event_name,
         e.type AS event_type,
         COUNT(v.id) AS voteCount
       FROM user_events ue
       LEFT JOIN users u ON ue.user_id = u.id
       LEFT JOIN events e ON ue.event_id = e.id
       LEFT JOIN votes v ON v.participant_id = ue.user_id AND v.event_id = ue.event_id
       GROUP BY ue.id, ue.user_id, ue.event_id, ue.team_name, ue.team_leader,
                ue.performance_category, ue.team_details, ue.institution,
                ue.team_picture, ue.registered_at, ue.status, u.email, u.Username,
                e.name, e.type
       ORDER BY ue.registered_at DESC`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('getAllUserEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch all user events' });
  }
};

// 5. Update an existing user_event entry
exports.updateUserEvent = async (req, res) => {
  const id = req.params.id;
  const {
    team_name, teamName,
    team_leader, teamLeader,
    team_details, teamDetails,
    performance_category, performanceCategory,
    institution,
    team_picture, teamPictureUrl
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE user_events SET 
         team_name = COALESCE(?, team_name),
         team_leader = COALESCE(?, team_leader),
         team_details = COALESCE(?, team_details),
         performance_category = COALESCE(?, performance_category),
         institution = COALESCE(?, institution),
         team_picture = COALESCE(?, team_picture)
       WHERE id = ?`,
      [
        team_name || teamName || null,
        team_leader || teamLeader || null,
        team_details || teamDetails || null,
        performance_category || performanceCategory || null,
        institution || null,
        team_picture || teamPictureUrl || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
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
  const id = req.params.id;

  try {
    const [existing] = await db.query('SELECT user_id, event_id FROM user_events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Participant record not found' });
    }

    // Delete related votes
    await db.query('DELETE FROM votes WHERE event_id = ? AND participant_id = ?', [existing[0].event_id, existing[0].user_id]);
    await db.query('DELETE FROM user_events WHERE id = ?', [id]);

    await logAudit(req.user?.id, req.user?.email, 'CANDIDATE_REMOVE', `Removed candidate record ID ${id}`, req.ip);

    res.status(200).json({ message: 'Candidate removed successfully' });
  } catch (err) {
    console.error('deleteUserEvent error:', err);
    res.status(500).json({ error: 'Failed to delete participant record' });
  }
};