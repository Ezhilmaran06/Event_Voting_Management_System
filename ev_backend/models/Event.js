const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  banner_url: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'Competition',
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  start_date_time: {
    type: Date,
    default: Date.now
  },
  end_date_time: {
    type: Date,
    default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  },
  voting_start: {
    type: Date,
    default: null
  },
  voting_end: {
    type: Date,
    default: null
  },
  institute_name: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  manager_name: {
    type: String,
    default: '',
    trim: true
  },
  ph_no: {
    type: String,
    default: '',
    trim: true
  },
  user_email: {
    type: String,
    required: [true, 'Organizer email is required'],
    lowercase: true,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  max_participants: {
    type: Number,
    default: 50,
    min: [1, 'Must allow at least 1 participant']
  },
  rules: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Voting Open', 'Completed', 'Cancelled', 'Draft'],
    default: 'Upcoming'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      ret.eventName = ret.name;
      ret.eventType = ret.type;
      ret.bannerUrl = ret.banner_url;
      ret.startDateTime = ret.start_date_time;
      ret.endDateTime = ret.end_date_time;
      ret.votingStart = ret.voting_start;
      ret.votingEnd = ret.voting_end;
      ret.institutionName = ret.institute_name;
      ret.managerName = ret.manager_name;
      ret.phoneNumber = ret.ph_no ? ret.ph_no.toString() : '';
      ret.email = ret.user_email;
      ret.maxParticipants = ret.max_participants;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for 'id'
eventSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : null;
});

// Indexes for common query patterns
eventSchema.index({ status: 1, start_date_time: -1 });
eventSchema.index({ voting_start: 1, voting_end: 1 });
eventSchema.index({ user_email: 1 });
eventSchema.index({ organizer: 1 });

module.exports = mongoose.model('Event', eventSchema);
