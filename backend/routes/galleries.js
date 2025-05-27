const express = require('express');
const gallariesRouter = express.Router();
const Profile = require('../models/Profile');

// Get public galleries
gallariesRouter.get('/public', async (req, res) => {
  try {
    const profiles = await Profile.find({}, {
      photos: 1,
      firstName: 1,
      lastName: 1,
      _id: 1
    }).lean();

    const galleries = profiles.filter(profile => profile.photos && profile.photos.length > 0);

    res.json({
      success: true,
      galleries: galleries
    });
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch galleries'
    });
  }
});

module.exports = gallariesRouter; 