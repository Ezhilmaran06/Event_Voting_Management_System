const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    Username: { type: String, required: true },
    clg_name: { type: String },
    role: { type: String },
    email: { type: String, required: true, unique: true },
    ph_no: { type: String },
}, { timestamps: true });

// Virtual for 'id' to maintain compatibility with frontend expecting 'id'
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
