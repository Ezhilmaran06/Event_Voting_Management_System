const db = require('../db');

// 1. Get notifications for the authenticated user
exports.getUserNotifications = async (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(401).json({ error: "User ID required" });
  }

  try {
    const [notifications] = await db.query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId]
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.status(200).json({
      unreadCount,
      notifications
    });
  } catch (err) {
    console.error('getUserNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// 2. Mark notification as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    await db.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? ${userId ? 'AND user_id = ?' : ''}`,
      userId ? [id, userId] : [id]
    );
    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// 3. Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  if (!userId) {
    return res.status(401).json({ error: "User ID required" });
  }

  try {
    await db.query(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};
