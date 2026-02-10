const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String },
    start_date_time: { type: Date },
    end_date_time: { type: Date },
    institute_name: { type: String },
    location: { type: String },
    manager_name: { type: String },
    ph_no: { type: String },
    user_email: { type: String, required: true },
}, { timestamps: true });

eventSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
