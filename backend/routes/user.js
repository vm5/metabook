const User = require('./../models/userModel');
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Gallery = require('../models/galleryModel');
const mongoose = require('mongoose');
const authorize = require('../middleware/authMiddleware');
const Profile = require('../models/profileModel');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const Post = require('../models/postModel');
const Connection = require('../models/connectionModel');
const DisabledAccount = require('../models/disabledAccountModel');
const DeletedAccount = require('../models/deletedAccountModel');

const userRouter = express.Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tech@teamlucifer.com',
    pass: 'XSMYs2pdjtzcQBBX8vjY'
  }
});

// Newsletter sending function
const sendNewsletter = async (subject, content) => {
  try {
    // Get all users who subscribed to newsletter
    const subscribers = await User.find({ newsletter: true }, 'email');
    
    if (subscribers.length === 0) {
      console.log('No newsletter subscribers found');
      return;
    }

    const mailOptions = {
      from: 'tech@teamlucifer.com',
      bcc: subscribers.map(user => user.email), // Use BCC for privacy
      subject: subject,
      html: generateNewsletterTemplate(content)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Newsletter sent to ${subscribers.length} subscribers`);
    return true;
  } catch (error) {
    console.error('Error sending newsletter:', error);
    throw error;
  }
};

// Newsletter template generator
const generateNewsletterTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LUCIFER - Newsletter</title>
      <style>
        body {
          font-family: 'Monospace';
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: rgb(22, 21, 21);
          color: #ffffff;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: rgb(12, 12, 12);
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, rgba(26, 26, 26, 0.69) 0%, rgb(0, 0, 0) 100%);
          padding: 30px 20px;
          text-align: center;
        }
        .logo {
          font-size: 36px;
          font-weight: bold;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }
        .content {
          padding: 30px;
          color: #ffffff;
        }
        .footer {
          background-color: rgb(12, 12, 12);
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 14px;
        }
        .unsubscribe {
          color: #666666;
          font-size: 12px;
          text-align: center;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">LUCIFER</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} LUCIFER. All rights reserved.</p>
          <div class="unsubscribe">
            To unsubscribe from our newsletter, please log in to your account and update your preferences.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Admin route to send newsletter
userRouter.post('/send-newsletter', authorize.authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin (you should implement proper admin checks)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    await sendNewsletter(subject, content);

    res.json({
      success: true,
      message: 'Newsletter sent successfully'
    });
  } catch (error) {
    console.error('Error in send-newsletter route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send newsletter'
    });
  }
});

// Route to update newsletter preference
userRouter.patch('/newsletter-preference', authorize.authenticateJWT, async (req, res) => {
  try {
    const { newsletter } = req.body;
    
    if (typeof newsletter !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Newsletter preference must be a boolean'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { newsletter },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `Newsletter subscription ${newsletter ? 'enabled' : 'disabled'}`,
      newsletter: user.newsletter
    });
  } catch (error) {
    console.error('Error updating newsletter preference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update newsletter preference'
    });
  }
});

userRouter.get('/search', async (req, res) => {
  console.log("in /search route with searchText:", req.query);
  try{
    const searchText = req.query.searchText;
    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page -1 ) * limit;

    const users = await User.find({
      $or: [
        { firstName: { $regex: searchText, $options: "i" } },
        { lastName: { $regex: searchText, $options: "i" } },
        { username: { $regex: searchText, $options: "i" } }
      ]
    }).select("firstName lastName username isVerified country relationship profilePicture coverPicture")
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await User.countDocuments({
      $or: [
        { firstName: { $regex: searchText, $options: "i" } },
        { lastName: { $regex: searchText, $options: "i" } },
        { username: { $regex: searchText, $options: "i" } }
      ]
    });
    return res.status(200).json({
      totalCount: totalCount,
      suggestions: users
    });
  } catch (error) {
    console.error('Error occured : ', error);
    res.status(500).json({
      error: 'Error fetching search result'
    });
  }
});

userRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;
    console.log('Received signup request with data:', {
      firstName,
      lastName,
      username,
      email
    });

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    // Create new user (password will be hashed by model's pre-save middleware)
    const user = new User({
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password // Raw password, will be hashed by model
    });

    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);

    // Create default profile
    try {
      // First try to find an existing profile
      let profile = await Profile.findOne({ userId: savedUser._id.toString() });
      
      if (!profile) {
        // Create new profile without sessionId
        profile = new Profile({
          userId: savedUser._id.toString(),
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await profile.save();
        console.log('Default profile created for user:', savedUser._id);
      } else {
        // Update existing profile
        profile.firstName = savedUser.firstName;
        profile.lastName = savedUser.lastName;
        profile.updatedAt = new Date();
        await profile.save();
        console.log('Updated existing profile for user:', savedUser._id);
      }
    } catch (error) {
      console.error('Error handling profile:', error);
      // Don't throw the error, just log it and continue
      // The user is already created, so we don't want to fail the signup
    }

    const token = authorize.generateToken(user, req);
    res.cookie("token", token, authorize.cookieOptions);

    res.json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: savedUser._id.toString(),
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email
      }
    });

  } catch (error) {
    console.log('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating user. Please try again.'
    });
  }
});

userRouter.get("/fetchUsers", async (req, res) => {
    try {
        const user = await User.find();
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

userRouter.post("/verify", async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    // Find user with matching first and last name
    const user = await User.findOne({
      firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
      lastName: { $regex: new RegExp(`^${lastName}$`, 'i') }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Return success with firstName for feed page
    res.json({
      success: true,
      firstName: user.firstName
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

userRouter.get('/public-gallery', async (req, res) => {
  try {
    const gallery = await Gallery.find({ isPublic: true })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      gallery
    });
  } catch (error) {
    console.error('Error fetching public gallery:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery'
    });
  }
});

// Add session check route
userRouter.get('/session-check', async (req, res) => {
  try {
    console.log('Session check request received');
    
    // Get token from cookie or Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    console.log('Token found:', !!token);
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, authorize.JWT_SECRET);
      console.log('Token verified, fetching user data');
      
      // Get user data
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('User not found for token');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Return success with user data
      console.log('Session check successful for user:', user._id);
      res.json({
        success: true,
        message: 'Session is valid',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          verifiedBadge: user.verifiedBadge
        }
      });
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid session token'
      });
    }
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during session check'
    });
  }
});

userRouter.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Fetching user with ID:', userId);
    
    let user;
    
    // First try to find by MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).select('-password');
      console.log('Searched by ObjectId:', user ? 'found' : 'not found');
    }
    
    // If not found and userId is a string, try to find by _id as string
    if (!user) {
      user = await User.findOne({ _id: userId }).select('-password');
      console.log('Searched by _id string:', user ? 'found' : 'not found');
    }

    if (!user) {
      console.log('User not found with any method');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found:', user._id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Configure multer for different upload types
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'banner') {
      cb(null, 'uploads/banners/');
    } else if (file.fieldname === 'gallery') {
      cb(null, 'uploads/gallery/');
    }
  },
  filename: function (req, file, cb) {
    const prefix = file.fieldname === 'banner' ? 'banner-' : 'gallery-';
    cb(null, prefix + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Banner upload route
userRouter.post('/:userId/banner', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.files || !req.files.banner) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.files.banner;
    const filename = `banner_${userId}_${Date.now()}${path.extname(file.name)}`;
    const filepath = path.join(__dirname, '..', 'uploads', 'banners', filename);

    // Move the file
    await file.mv(filepath);

    // Update user banner path in database
    const bannerPath = `/uploads/banners/${filename}`;
    
    // Find user and get old banner path
    const user = await User.findById(userId);
    if (!user) {
      // Clean up file if user not found
      fs.unlinkSync(filepath);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old banner if it exists
    if (user.banner) {
      const oldPath = path.join(__dirname, '..', user.banner);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user with new banner
    user.banner = bannerPath;
    await user.save();

    res.json({
      success: true,
      banner: bannerPath
    });

  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading banner',
      error: error.message
    });
  }
});

// Gallery upload route
userRouter.post('/:userId/gallery', upload.array('gallery', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const galleryPaths = req.files.map(file => '/uploads/gallery/' + file.filename);
    
    // Add to public gallery collection
    const galleryItems = galleryPaths.map(path => ({
      userId: req.params.userId,
      imagePath: path,
      isPublic: true
    }));

    await Gallery.insertMany(galleryItems);

    // Update user's photos array
    user.photos = [...(user.photos || []), ...galleryPaths];
    await user.save();

    res.json({ 
      success: true, 
      gallery: galleryPaths 
    });
  } catch (error) {
    console.error('Error uploading to gallery:', error);
    res.status(500).json({ success: false, message: 'Error uploading to gallery' });
  }
});

// Add this new route
userRouter.get('/check-exists', async (req, res) => {
  try {
    const { email, username } = req.query;
    
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    res.json({
      exists: !!existingUser,
      message: existingUser ? 'User already exists' : 'Username and email are available'
    });
  } catch (error) {
    console.error('Check exists error:', error);
    res.status(500).json({
      error: 'Server error checking user existence'
    });
  }
});

// Add login route
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password, coordinates, rememberMe, newsletter } = req.body;
    console.log('Login attempt for:', email);

    // Set CORS headers explicitly for this route
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('User found, verifying password...');

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Password verified successfully');

    // Update user's location if coordinates are provided
    if (coordinates) {
      user.location = {
        ...user.location,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        }
      };
    }

    // Update newsletter preference if provided
    if (typeof newsletter === 'boolean') {
      user.newsletter = newsletter;
    }

    await user.save();

    // Generate JWT token with remember me option
    const token = authorize.generateToken(user, rememberMe);
    
    // Set cookie with token and remember me option
    const cookieOptions = {
      ...authorize.cookieOptions,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 days if remember me, 1 day if not
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    };
    res.cookie('token', token, cookieOptions);

    console.log('Token generated and cookie set');

    // Return success with user data
    res.json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verifiedBadge: user.verifiedBadge,
        newsletter: user.newsletter
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get user by ID
userRouter.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      console.error('No ID provided in request');
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    console.log('Attempting to find user with ID:', id);
    
    const user = await User.findById(id);
    
    if (!user) {
      console.error('No user found with ID:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Remove sensitive information and ensure profile picture is properly handled
    const userResponse = {
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture || '/default-avatar.png',
        location: user.location,
        // Add other non-sensitive fields as needed
      }
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user',
      error: error.message 
    });
  }
});

// Disable account
userRouter.post('/:userId/disable', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user and their profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store disabled account info
    const disabledAccount = new DisabledAccount({
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      isTemporary: true
    });
    await disabledAccount.save();

    // Update user status to disabled
    user.isDisabled = true;
    user.disabledAt = new Date();
    await user.save();

    // Hide user's posts (but don't delete them)
    await Post.updateMany(
      { userId: userId },
      { $set: { isHidden: true } }
    );

    res.json({
      success: true,
      message: 'Account temporarily disabled'
    });
  } catch (error) {
    console.error('Error disabling account:', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling account',
      error: error.message
    });
  }
});

// Delete account
userRouter.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user and their data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = await Profile.findOne({ userId });

    // Store deleted account info
    const deletedAccount = new DeletedAccount({
      originalUserId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileData: {
        ...profile?.toObject(),
        lastProfilePicture: user.profilePicture
      }
    });
    await deletedAccount.save();

    // Delete user's posts
    await Post.deleteMany({ userId });

    // Delete user's connections
    await Connection.deleteMany({
      $or: [
        { userId: userId },
        { followingId: userId }
      ]
    });

    // Delete user's profile
    if (profile) {
      await Profile.findByIdAndDelete(profile._id);
    }

    // Finally, delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
});

// Reactivate disabled account
userRouter.post('/:userId/reactivate', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if account is actually disabled
    if (!user.isDisabled) {
      return res.status(400).json({
        success: false,
        message: 'Account is not disabled'
      });
    }

    // Reactivate account
    user.isDisabled = false;
    user.disabledAt = null;
    await user.save();

    // Unhide user's posts
    await Post.updateMany(
      { userId: userId },
      { $set: { isHidden: false } }
    );

    // Remove from disabled accounts
    await DisabledAccount.findOneAndDelete({ userId });

    res.json({
      success: true,
      message: 'Account reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating account:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivating account',
      error: error.message
    });
  }
});

module.exports = userRouter;