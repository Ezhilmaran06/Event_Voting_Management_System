const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    voter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Ensure unique vote per event per voter
voteSchema.index({ event_id: 1, voter_id: 1 }, { unique: true });

voteSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

voteSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Vote', voteSchema);
