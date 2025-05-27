const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['following', 'blocked'],
    default: 'following'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index to ensure unique connections
connectionSchema.index({ userId: 1, followingId: 1 }, { unique: true });

// Add a pre-save middleware to validate that a user cannot follow themselves
connectionSchema.pre('save', function(next) {
  if (this.userId.toString() === this.followingId.toString()) {
    next(new Error('Users cannot follow themselves'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Connection', connectionSchema); 