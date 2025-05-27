const mongoose = require('mongoose');

const deletedAccountSchema = new mongoose.Schema({
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  profileData: Object,  // Store any additional profile data
  deletedAt: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    enum: ['user_requested', 'violation', 'other'],
    default: 'user_requested'
  }
});

module.exports = mongoose.model('DeletedAccount', deletedAccountSchema); 