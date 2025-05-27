const mongoose = require('mongoose');

const disabledAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  profilePicture: String,
  disabledAt: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    enum: ['user_requested', 'violation', 'other'],
    default: 'user_requested'
  },
  isTemporary: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('DisabledAccount', disabledAccountSchema); 