const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// 1. Get notifications for the authenticated user
exports.getUserNotifications = async (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(401).json({ error: "User ID required" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({ unreadCount: 0, notifications: [] });
    }

    const notifications = await Notification.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const formatted = notifications.map(n => n.toJSON());
    const unreadCount = formatted.filter(n => !n.isRead).length;

    res.status(200).json({
      unreadCount,
      notifications: formatted
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const query = { _id: id };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.user_id = userId;
    }

    await Notification.findOneAndUpdate(query, { $set: { is_read: true } });
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
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    await Notification.updateMany({ user_id: userId }, { $set: { is_read: true } });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};
