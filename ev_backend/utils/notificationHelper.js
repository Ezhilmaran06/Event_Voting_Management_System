const db = require('../db');

exports.createNotification = async (userId, title, message, type = 'info') => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, title, message, type]
    );
  } catch (err) {
    console.error('⚠️ Notification error:', err.message);
  }
};

exports.notifyAllUsers = async (title, message, type = 'info') => {
  try {
    const [users] = await db.query(`SELECT id FROM users`);
    for (const u of users) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [u.id, title, message, type]
      );
    }
  } catch (err) {
    console.error('⚠️ Broadcast notification error:', err.message);
  }
};
