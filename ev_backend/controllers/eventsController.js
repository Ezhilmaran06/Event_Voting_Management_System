const db = require('../db');
const { logAudit } = require('../utils/auditLogger');
const { notifyAllUsers } = require('../utils/notificationHelper');

// Helper to compute event dynamic status
const computeEventStatus = (event) => {
  if (event.status === 'Cancelled' || event.status === 'Draft') {
    return event.status;
  }

  const now = new Date();
  const start = event.start_date_time ? new Date(event.start_date_time) : null;
  const end = event.end_date_time ? new Date(event.end_date_time) : null;
  const vStart = event.voting_start ? new Date(event.voting_start) : start;
  const vEnd = event.voting_end ? new Date(event.voting_end) : end;

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

  const sDate = start_date_time || startDateTime || new Date().toISOString();
  const eDate = end_date_time || endDateTime || new Date(Date.now() + 3 * 86400000).toISOString();
  const vStart = voting_start || votingStart || sDate;
  const vEnd = voting_end || votingEnd || eDate;

  try {
    const [result] = await db.query(
      `INSERT INTO events (
        name, description, banner_url, type, category,
        start_date_time, end_date_time, voting_start, voting_end,
        institute_name, location, manager_name, ph_no, user_email,
        max_participants, rules, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventName,
        description || 'Exciting competitive event featuring talent, skills, and audience voting.',
        banner_url || bannerUrl || null,
        type || 'Competition',
        category || type || 'General',
        sDate,
        eDate,
        vStart,
        vEnd,
        institute_name || institutionName || 'Campus Venue',
        location || 'Main Auditorium',
        manager_name || managerName || 'Event Coordinator',
        ph_no || phoneNumber || '9876543210',
        eventEmail,
        max_participants || maxParticipants || 50,
        rules || '1. One vote per participant\n2. Maintain event decorum\n3. Voting decisions are final',
        'Upcoming'
      ]
    );

    const newEventId = result.insertId;

    await logAudit(req.user?.id, eventEmail, 'EVENT_CREATE', `Created event: ${eventName} (ID: ${newEventId})`, req.ip);
    await notifyAllUsers('New Event Created!', `Registration is now open for ${eventName}. Check it out!`, 'info');

    res.status(201).json({
      message: "Event created successfully",
      eventId: newEventId
    });
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ error: "Database error creating event", details: err.message });
  }
};

// 2. Get all events (with dynamic counts and computed status)
exports.getEvents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         e.id,
         e.name AS eventName,
         e.description,
         e.banner_url AS bannerUrl,
         e.type AS eventType,
         e.category,
         e.start_date_time AS startDateTime,
         e.end_date_time AS endDateTime,
         e.voting_start AS votingStart,
         e.voting_end AS votingEnd,
         e.institute_name AS institutionName,
         e.location,
         e.manager_name AS managerName,
         e.ph_no AS phoneNumber,
         e.user_email AS email,
         e.max_participants AS maxParticipants,
         e.rules,
         e.status,
         COUNT(DISTINCT ue.id) AS participantCount,
         COUNT(DISTINCT v.id) AS totalVotes
       FROM events e
       LEFT JOIN user_events ue ON ue.event_id = e.id
       LEFT JOIN votes v ON v.event_id = e.id
       GROUP BY e.id
       ORDER BY e.start_date_time DESC`
    );

    const enriched = rows.map(event => {
      const computed = computeEventStatus({
        start_date_time: event.startDateTime,
        end_date_time: event.endDateTime,
        voting_start: event.votingStart,
        voting_end: event.votingEnd,
        status: event.status
      });

      return {
        ...event,
        computedStatus: computed,
        isVotingOpen: computed === 'Voting Open',
        phoneNumber: event.phoneNumber ? event.phoneNumber.toString() : ''
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
    const [rows] = await db.query(
      `SELECT 
         e.id,
         e.name AS eventName,
         e.description,
         e.banner_url AS bannerUrl,
         e.type AS eventType,
         e.category,
         e.start_date_time AS startDateTime,
         e.end_date_time AS endDateTime,
         e.voting_start AS votingStart,
         e.voting_end AS votingEnd,
         e.institute_name AS institutionName,
         e.location,
         e.manager_name AS managerName,
         e.ph_no AS phoneNumber,
         e.user_email AS email,
         e.max_participants AS maxParticipants,
         e.rules,
         e.status,
         COUNT(DISTINCT ue.id) AS participantCount,
         COUNT(DISTINCT v.id) AS totalVotes
       FROM events e
       LEFT JOIN user_events ue ON ue.event_id = e.id
       LEFT JOIN votes v ON v.event_id = e.id
       WHERE e.id = ?
       GROUP BY e.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = rows[0];
    const computed = computeEventStatus({
      start_date_time: event.startDateTime,
      end_date_time: event.endDateTime,
      voting_start: event.votingStart,
      voting_end: event.votingEnd,
      status: event.status
    });

    res.status(200).json({
      ...event,
      computedStatus: computed,
      isVotingOpen: computed === 'Voting Open',
      phoneNumber: event.phoneNumber ? event.phoneNumber.toString() : ''
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
    const [existing] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    await db.query(
      `UPDATE events SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         banner_url = COALESCE(?, banner_url),
         type = COALESCE(?, type),
         category = COALESCE(?, category),
         start_date_time = COALESCE(?, start_date_time),
         end_date_time = COALESCE(?, end_date_time),
         voting_start = COALESCE(?, voting_start),
         voting_end = COALESCE(?, voting_end),
         institute_name = COALESCE(?, institute_name),
         location = COALESCE(?, location),
         manager_name = COALESCE(?, manager_name),
         ph_no = COALESCE(?, ph_no),
         rules = COALESCE(?, rules),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name, description, banner_url || bannerUrl, type, category,
        start_date_time || startDateTime, end_date_time || endDateTime,
        voting_start || votingStart, voting_end || votingEnd,
        institute_name || institutionName, location,
        manager_name || managerName, ph_no || phoneNumber,
        rules, status,
        id
      ]
    );

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
    const [existing] = await db.query('SELECT name FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Cascade delete votes and registrations
    await db.query('DELETE FROM votes WHERE event_id = ?', [id]);
    await db.query('DELETE FROM user_events WHERE event_id = ?', [id]);
    await db.query('DELETE FROM events WHERE id = ?', [id]);

    await logAudit(req.user?.id, req.user?.email, 'EVENT_DELETE', `Deleted event: ${existing[0].name} (ID: ${id})`, req.ip);

    res.status(200).json({ message: "Event deleted successfully along with associated records" });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
