const express = require('express');
const profileRouter = express.Router();
const User = require('../models/userModel');
const multer = require('multer');
const path = require('path');
const Profile = require('../models/profileModel');
const mongoose = require('mongoose');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = path.join(__dirname, '../uploads/photos');
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    fieldSize: 25 * 1024 * 1024 // 25MB max field size
  }
});

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const photosDir = path.join(uploadsDir, 'photos');

[uploadsDir, photosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Get user profile with photos
profileRouter.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Try to find profile by userId
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      // If not found, try to find by userId as ObjectId string
      if (mongoose.Types.ObjectId.isValid(userId)) {
        profile = await Profile.findOne({ userId: userId.toString() });
      }
    }

    if (!profile) {
      // Create a default profile if none exists
      profile = new Profile({
        userId,
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        sexuality: '',
        location: '',
        interests: [],
        photos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      try {
        await profile.save();
        console.log('Created default profile for user:', userId);
      } catch (saveError) {
        console.error('Error creating default profile:', saveError);
        throw saveError;
      }
    }

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Profile check error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Route to check profile
profileRouter.get('/api/profile/check/:id', async (req, res) => {
  const { firstName, lastName } = req.query;
  const { id } = req.params;

  try {
    // Find the profile by ID and match first and last names
    const profile = await Profile.findById(id);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Check if first and last names match (case insensitive)
    if (profile.firstName.toLowerCase() !== firstName.toLowerCase() || profile.lastName.toLowerCase() !== lastName.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Profile not found or name does not match' });
    }

    // Return the profile if matched
    return res.status(200).json({
      success: true,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        age: profile.age,
        location: profile.location,
        gender: profile.gender,
        sexuality: profile.sexuality
      }
    });
  } catch (error) {
    console.error('Error checking profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get profile with token
profileRouter.get('/check/:id', async (req, res) => {
  try {
    // Verify auth token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    // Get profile
    const profile = await Profile.findOne({ userId: req.params.id });
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    // Check if profile is complete
    const isComplete = profile.firstName && profile.lastName;
    
    res.json({ 
      success: true, 
      profile,
      isComplete 
    });

  } catch (error) {
    console.error('Profile check error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Photo upload route with better error handling
profileRouter.post('/upload-photo', async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.files || !req.files.photo) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const photoFile = req.files.photo;

    // Validate file type
    if (!photoFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed'
      });
    }

    // Validate file size (5MB)
    if (photoFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads/photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(photoFile.name);
    const filename = `photo-${uniqueSuffix}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Move file to uploads directory
    await photoFile.mv(filepath);

    // Return success response with file URL
    res.json({
      success: true,
      url: `/uploads/photos/${filename}`,
      message: 'Photo uploaded successfully'
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message
    });
  }
});

// Add this route for initial profile creation
profileRouter.post('/create', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Set trial dates
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(now.getDate() + 60); // 60 days trial period

    const profileData = {
      ...req.body,
      plan: 'free',
      trialStartDate: now,
      trialEndDate: trialEndDate,
      updatedAt: now
    };

    // Check if profile already exists
    let profile = await Profile.findOne({ userId });

    if (profile) {
      // Update existing profile but don't overwrite trial dates if they exist
      if (!profile.trialStartDate) profileData.trialStartDate = now;
      if (!profile.trialEndDate) profileData.trialEndDate = trialEndDate;
      
      profile = await Profile.findOneAndUpdate(
        { userId },
        profileData,
        { 
          new: true,
          runValidators: true,
          context: 'query'
        }
      );
    } else {
      // Create new profile
      profile = new Profile({
        ...profileData,
        createdAt: now
      });
      await profile.save();
    }

    // Update user's profile photo if it exists
    if (profile.photos && profile.photos.length > 0) {
      await User.findByIdAndUpdate(
        userId,
        { profilePicture: profile.photos[0] },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Profile created/updated successfully',
      profile
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating profile',
      error: error.message
    });
  }
});

// Add this route to handle profile updates
profileRouter.post('/update/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Update the delete photo route
profileRouter.delete('/photo/:userId/:filename', async (req, res) => {
  try {
    const { userId, filename } = req.params;
    
    // Remove the photo URL from the user's photos array
    const profile = await Profile.findOneAndUpdate(
      { userId },
      {
        $pull: { photos: `/uploads/photos/${filename}` }
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Delete the file from the filesystem
    const filePath = path.join(__dirname, '../uploads/photos', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    console.error('Photo deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting photo',
      error: error.message
    });
  }
});

// Add profile verification route
profileRouter.post('/verify', async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    // Find user by first name and last name (case-insensitive)
    const user = await User.findOne({
      firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
      lastName: { $regex: new RegExp(`^${lastName}$`, 'i') }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found with these names'
      });
    }

    // Return success with user data
    res.json({
      success: true,
      message: 'User verified successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Profile verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user',
      error: error.message
    });
  }
});

module.exports = profileRouter;

