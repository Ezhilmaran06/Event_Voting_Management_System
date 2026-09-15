const Notification = require('../models/Notification');
const User = require('../models/User');

exports.createNotification = async (userId, title, message, type = 'info') => {
  try {
    if (!userId) return;
    await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      is_read: false
    });
  } catch (err) {
    console.error('⚠️ Notification error:', err.message);
  }
};

exports.notifyAllUsers = async (title, message, type = 'info') => {
  try {
    const users = await User.find({}, '_id').lean();
    if (users.length === 0) return;

    const notifs = users.map(u => ({
      user_id: u._id,
      title,
      message,
      type,
      is_read: false
    }));

    await Notification.insertMany(notifs);
  } catch (err) {
    console.error('⚠️ Broadcast notification error:', err.message);
  }
};
