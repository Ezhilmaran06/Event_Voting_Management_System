const db = require('../db');

// 1. Get system-wide platform statistics
exports.getStats = async (req, res) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) AS count FROM users');
    const [eventCount] = await db.query('SELECT COUNT(*) AS count FROM events');
    const [candidateCount] = await db.query('SELECT COUNT(*) AS count FROM user_events');
    const [voteCount] = await db.query('SELECT COUNT(*) AS count FROM votes');
    
    // Active events
    const [activeEvents] = await db.query(
      `SELECT COUNT(*) AS count FROM events WHERE end_date_time >= NOW() AND (status IS NULL OR status != 'Cancelled')`
    );

    // Votes per category
    const [categoryStats] = await db.query(`
      SELECT e.type AS category, COUNT(v.id) AS votes, COUNT(DISTINCT e.id) AS events
      FROM events e
      LEFT JOIN votes v ON v.event_id = e.id
      GROUP BY e.type
      ORDER BY votes DESC
    `);

    // Turnout rate
    const totalUsers = userCount[0].count || 1;
    const [distinctVoters] = await db.query('SELECT COUNT(DISTINCT voter_id) AS count FROM votes');
    const turnoutRate = Math.round(((distinctVoters[0].count || 0) / totalUsers) * 100);

    // Recent activity (audit logs)
    const [recentActivity] = await db.query(
      `SELECT id, user_email, action, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 8`
    );

    res.status(200).json({
      totalUsers: userCount[0].count || 0,
      totalEvents: eventCount[0].count || 0,
      totalCandidates: candidateCount[0].count || 0,
      totalVotes: voteCount[0].count || 0,
      activeEvents: activeEvents[0].count || 0,
      distinctVoters: distinctVoters[0].count || 0,
      turnoutRate: `${turnoutRate}%`,
      categoryStats,
      recentActivity
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
};

// 2. Get Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const [logs] = await db.query(
      `SELECT id, user_id, user_email, action, details, ip_address, created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.status(200).json(logs);
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// 3. Export CSV Report
exports.exportReport = async (req, res) => {
  const { type, id } = req.params;

  try {
    if (type === 'results') {
      // Export results for event :id
      const [events] = await db.query('SELECT name FROM events WHERE id = ?', [id]);
      const eventName = events[0]?.name || `Event_${id}`;

      const [rows] = await db.query(`
        SELECT 
          ue.user_id AS candidate_id,
          COALESCE(ue.team_name, u.Username, 'Candidate') AS team_name,
          COALESCE(ue.team_leader, u.Username) AS leader_name,
          u.email,
          COALESCE(ue.institution, u.clg_name) AS institution,
          COALESCE(ue.performance_category, 'General') AS category,
          COUNT(v.id) AS total_votes
        FROM user_events ue
        JOIN users u ON u.id = ue.user_id
        LEFT JOIN votes v ON v.participant_id = ue.user_id AND v.event_id = ue.event_id
        WHERE ue.event_id = ?
        GROUP BY ue.user_id, ue.team_name, ue.team_leader, u.email, ue.institution, u.clg_name, ue.performance_category, u.Username
        ORDER BY total_votes DESC
      `, [id]);

      // Build CSV
      let csv = 'Rank,Team Name,Leader,Email,Institution,Category,Votes\n';
      rows.forEach((r, idx) => {
        csv += `${idx + 1},"${r.team_name}","${r.leader_name}","${r.email}","${r.institution}","${r.category}",${r.total_votes}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="results_${id}_${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } else if (type === 'users') {
      const [users] = await db.query(`
        SELECT id, Username, email, role, clg_name, ph_no, created_at FROM users ORDER BY id ASC
      `);
      let csv = 'ID,Username,Email,Role,College,Phone,Registered At\n';
      users.forEach(u => {
        csv += `${u.id},"${u.Username}","${u.email}","${u.role}","${u.clg_name || ''}","${u.ph_no || ''}","${u.created_at || ''}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users_export_${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } else {
      return res.status(400).json({ error: 'Unsupported export type' });
    }
  } catch (err) {
    console.error('exportReport error:', err);
    res.status(500).json({ error: 'Failed to generate export file' });
  }
};
