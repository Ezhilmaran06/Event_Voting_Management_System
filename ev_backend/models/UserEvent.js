const mongoose = require('mongoose');

const userEventSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  team_name: {
    type: String,
    trim: true,
    default: 'Participant Team'
  },
  team_leader: {
    type: String,
    trim: true,
    default: null
  },
  team_details: {
    type: String,
    default: ''
  },
  performance_category: {
    type: String,
    trim: true,
    default: 'General'
  },
  institution: {
    type: String,
    trim: true,
    default: null
  },
  team_picture: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  registered_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      const hexId = ret._id ? ret._id.toString() : ret.id;
      ret.id = hexId;
      ret.userEventId = hexId;
      ret.participant_id = ret.user_id ? (ret.user_id._id ? ret.user_id._id.toString() : ret.user_id.toString()) : null;
      ret.userId = ret.participant_id;
      ret.eventId = ret.event_id ? (ret.event_id._id ? ret.event_id._id.toString() : ret.event_id.toString()) : null;
      ret.teamName = ret.team_name;
      ret.teamLeader = ret.team_leader;
      ret.teamDetails = ret.team_details;
      ret.performanceCategory = ret.performance_category;
      ret.teamPictureUrl = ret.team_picture;
      ret.registeredAt = ret.registered_at;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Compound unique index: A user can only register once per event
userEventSchema.index({ user_id: 1, event_id: 1 }, { unique: true });
userEventSchema.index({ event_id: 1, status: 1 });

userEventSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : null;
});

module.exports = mongoose.model('UserEvent', userEventSchema);
