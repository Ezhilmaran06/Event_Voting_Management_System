const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  participant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Participant/Candidate ID is required']
  },
  voter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Voter ID is required']
  },
  receipt_id: {
    type: String,
    required: true,
    unique: true
  },
  ip_address: {
    type: String,
    default: null
  },
  vote_time: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      ret.votedAt = ret.vote_time;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// CRITICAL: Compound unique index prevents any voter from voting more than once in the same event
voteSchema.index({ event_id: 1, voter_id: 1 }, { unique: true });
voteSchema.index({ event_id: 1, participant_id: 1 });
voteSchema.index({ voter_id: 1 });

voteSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : null;
});

module.exports = mongoose.model('Vote', voteSchema);
