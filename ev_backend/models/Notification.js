const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      ret.userId = ret.user_id ? ret.user_id.toString() : null;
      ret.isRead = ret.is_read;
      ret.createdAt = ret.createdAt;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

notificationSchema.index({ user_id: 1, is_read: 1, createdAt: -1 });

notificationSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : null;
});

module.exports = mongoose.model('Notification', notificationSchema);
