const db = require('../db'); // your db connection

// Register a user to an event
exports.registerUserToEvent = async (req, res) => {
  const { user_id, event_id, team_name, team_picture } = req.body;  // Add new params

  if (!user_id || !event_id) {
    return res.status(400).json({ error: 'user_id and event_id are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO user_events (user_id, event_id, team_name, team_picture) VALUES (?, ?, ?, ?)`,
      [user_id, event_id, team_name, team_picture]  // Pass params here
    );
    // Return the inserted id so frontend can refer to this user_event row
    res.status(201).json({ id: result.insertId, message: 'User registered to event successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'User already registered for this event' });
    } else {
      res.status(500).json({ error: 'Failed to register user to event' });
    }
  }
};


// Get all events a user is registered for
exports.getUserEvents = async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT e.id AS eventId, e.name AS eventName, e.start_date_time AS startDateTime, e.end_date_time AS endDateTime
       FROM events e
       JOIN user_events ue ON e.id = ue.event_id
       WHERE ue.user_id = ?`,
      [userId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
};

// Get all users registered for an event
exports.getEventUsers = async (req, res) => {
    const eventId = req.params.id;
    
    try {
        const [rows] = await db.query(
            `SELECT u.id AS userId, u.Username AS username, u.email, u.clg_name AS collegeName
            FROM users u
            JOIN user_events ue ON u.id = ue.user_id
            WHERE ue.event_id = ?`,
            [eventId]
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch event users' });
    }
};

exports.getAllUserEvents = async (req, res) => {
    try {
    const [rows] = await db.query(
      `SELECT ue.id, ue.user_id, ue.event_id, ue.registered_at,
          u.email AS user_email,
          e.name AS event_name
       FROM user_events ue
       LEFT JOIN users u ON ue.user_id = u.id
       LEFT JOIN events e ON ue.event_id = e.id`
    );
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user events' });
    } 
};

// Update an existing user_event entry (e.g., add team_name and picture)
exports.updateUserEvent = async (req, res) => {
  const id = req.params.id;
  const { team_name, team_picture } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  try {
    const [result] = await db.query(
      `UPDATE user_events SET team_name = ?, team_picture = ? WHERE id = ?`,
      [team_name || null, team_picture || null, id]
    );

    // result.affectedRows can be used to verify update
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User event not found' });
    }

    res.status(200).json({ message: 'User event updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user event' });
  }
};