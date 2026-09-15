const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  Username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['Admin', 'Organizer', 'Participant', 'Student', 'Staff'],
    default: 'Participant'
  },
  clg_name: {
    type: String,
    trim: true,
    default: null
  },
  ph_no: {
    type: String,
    trim: true,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      ret.username = ret.Username || ret.username;
      ret.collegeName = ret.clg_name || ret.collegeName;
      ret.phoneNumber = ret.ph_no ? ret.ph_no.toString() : null;
      ret.createdAt = ret.createdAt || ret.created_at;
      delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for 'id'
userSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : null;
});

module.exports = mongoose.model('User', userSchema);
