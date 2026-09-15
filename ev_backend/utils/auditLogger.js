const AuditLog = require('../models/AuditLog');

exports.logAudit = async (userId, userEmail, action, details, ip = null) => {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    
    // Ensure userId is a valid MongoDB ObjectId or null
    let validUserId = null;
    if (userId && typeof userId === 'string' && userId.length === 24) {
      validUserId = userId;
    } else if (userId && userId._id) {
      validUserId = userId._id;
    }

    await AuditLog.create({
      user_id: validUserId,
      user_email: userEmail || null,
      action: action || 'UNKNOWN_ACTION',
      details: detailsStr,
      ip_address: ip
    });
  } catch (err) {
    console.error('⚠️ Audit log error:', err.message);
  }
};
