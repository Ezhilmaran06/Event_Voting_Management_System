const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  user_email: {
    type: String,
    default: null
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    default: ''
  },
  ip_address: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user_id: 1, createdAt: -1 });

auditLogSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : null;
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
