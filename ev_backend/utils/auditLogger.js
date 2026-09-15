const db = require('../db');

exports.logAudit = async (userId, userEmail, action, details, ip = null) => {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    await db.query(
      `INSERT INTO audit_logs (user_id, user_email, action, details, ip_address) VALUES (?, ?, ?, ?, ?)`,
      [userId || null, userEmail || null, action, detailsStr, ip]
    );
  } catch (err) {
    console.error('⚠️ Audit log error:', err.message);
  }
};
