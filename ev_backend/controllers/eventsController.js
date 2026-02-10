const db = require('../db');

// Create a new event
exports.createEvent = async (req, res) => {
    const {
        name,
        type,
        start_date_time,
        end_date_time,
        institute_name,
        location,
        manager_name,
        ph_no,
        user_email
    } = req.body;

    if (!name || !user_email) {
        return res.status(400).json({ error: "Event name and user_email are required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO events
            (name, type, start_date_time, end_date_time, institute_name, location, manager_name, ph_no, user_email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, start_date_time, end_date_time, institute_name, location, manager_name, ph_no, user_email]
        );

        res.status(201).json({ message: "Event created", eventId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            res.status(400).json({ error: "User email does not exist" });
        } else {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    }
};

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name AS eventName, type AS eventType, start_date_time AS startDateTime, 
              end_date_time AS endDateTime, institute_name AS institutionName, 
              location, manager_name AS managerName, ph_no AS phoneNumber, user_email AS email
       FROM events
       ORDER BY start_date_time DESC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};
