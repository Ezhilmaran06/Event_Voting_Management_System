const mongoose = require('mongoose');

const userEventSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    team_name: { type: String },
    team_picture: { type: String },
    registered_at: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure unique registration per user per event
userEventSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

userEventSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userEventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('UserEvent', userEventSchema);
