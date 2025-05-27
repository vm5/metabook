const express = require('express');
const usersRouter = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Session = require('../models/Session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises; // Use promises version

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vedantmarathe2@gmail.com',
    pass: 'qfzr rlxw rlqc rlzm'
  }
});

// Signup route
usersRouter.post('/signup', async (req, res) => {
  try {
    // First check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered. Please use a different email or login."
      });
    }

    // If user doesn't exist, create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPass,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
      location: {
        area: req.body.location.area,
        city: req.body.location.city,
        formatted: `${req.body.location.area}, ${req.body.location.city}`
      }
    });

    const user = await newUser.save();
    
    // Remove password from response
    const { password, ...others } = user._doc;
    
    // Send OTP email
    const mailOptions = {
      from: 'vedantmarathe2@gmail.com',
      to: req.body.email,
      subject: 'Your OTP for LuciferFB Registration',
      text: `Your OTP is: ${otp}\nValid for 10 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Account created successfully!",
      data: others
    });

  } catch (error) {
    console.error("Signup error:", error);
    
    // Handle different types of errors
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "This email is already registered. Please use a different email or login."
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later."
      });
    }
  }
});

// Verify OTP route
usersRouter.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        error: 'OTP expired'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});


  

// Get all users route
usersRouter.get('/all', async (req, res) => {
  try {
    const users = await User.find({}, {
      firstName: 1,
      lastName: 1,
      location: 1,
      photos: 1,
      _id: 1
    }).lean();

    console.log('Fetched users:', users);
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Banner upload route
usersRouter.post('/:userId/banner', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if file exists in request
    if (!req.files || !req.files.banner) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.files.banner;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const bannerDir = path.join(uploadDir, 'banners');
    
    try {
      await fs.mkdir(bannerDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
    }

    // Create filename and path
    const filename = `banner_${userId}_${Date.now()}${path.extname(file.name)}`;
    const filepath = path.join(bannerDir, filename);

    // Save file
    try {
      await file.mv(filepath);
    } catch (err) {
      console.error('Error moving file:', err);
      return res.status(500).json({
        success: false,
        message: 'Error saving file'
      });
    }

    // Update user banner path in database
    const bannerPath = `/uploads/banners/${filename}`;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { banner: bannerPath },
      { new: true }
    );

    if (!user) {
      // Delete file if user not found
      await fs.unlink(filepath);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      banner: bannerPath
    });

  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading banner'
    });
  }
});

module.exports = usersRouter; 