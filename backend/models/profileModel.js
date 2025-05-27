const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  age: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: ''
  },
  sexuality: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  interests: [{
    type: String,
    default: []
  }],
  photos: [{
    type: String,
    default: []
  }],
  plan: {
    type: String,
    default: 'free'
  },
  trialStartDate: {
    type: Date,
    default: Date.now
  },
  trialEndDate: {
    type: Date,
    default: function() {
      // Set trial end date to 60 days (2 months) from now
      const date = new Date();
      date.setDate(date.getDate() + 60);
      return date;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add a pre-save middleware to handle validation
profileSchema.pre('save', function(next) {
  // Set default values if they're undefined
  if (!this.bio) this.bio = '';
  if (!this.interests) this.interests = [];
  if (!this.photos) this.photos = [];
  if (!this.plan) this.plan = 'free';
  
  // Set trial dates if they're not set
  if (!this.trialStartDate) this.trialStartDate = new Date();
  if (!this.trialEndDate) {
    const endDate = new Date(this.trialStartDate);
    endDate.setDate(endDate.getDate() + 60); // 60 days (2 months) trial
    this.trialEndDate = endDate;
  }
  
  next();
});

module.exports = mongoose.model('Profile', profileSchema); 