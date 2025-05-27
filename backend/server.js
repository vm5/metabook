const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const PORT = 8080;
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const nodemailer = require('nodemailer');
require('dotenv').config();
const Post = require('./models/postModel');
const Profile = require('./models/profileModel'); 
const Connection = require('./models/connectionModel');
const profileRouter = require('./routes/profile');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');
const fileUpload = require('express-fileupload');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const connectionsRouter = require('./routes/connections');
const postRouter = require("./routes/post");
const adRouter = require("./routes/ad");
const twoFactorRouter = require("./routes/2fa");
const phoneRouter = require("./routes/phone");
const authorize = require("./middleware/authMiddleware");
const cookieParser = require("cookie-parser");
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const uuidv4 = require('uuid').v4;
const geoip = require('geoip-lite');

// Configure CORS before any routes
app.use(cors({
  origin: ['https://teamlucifer.com/', 'https://www.teamlucifer.com/'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours in seconds
}));

// Middleware setup
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure express-fileupload
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 6 // Max number of files
  },
  abortOnLimit: true,
  tempFileDir: path.join(__dirname, 'tmp'),
  useTempFiles: true,
  safeFileNames: true,
  preserveExtension: true,
  parseNested: true,
  uploadTimeout: 30000 // 30 seconds
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files
app.use('/uploads/photos', express.static(path.join(__dirname, 'uploads/photos')));
app.use('/uploads/posts', express.static(path.join(__dirname, 'uploads/posts')));
app.use('/uploads/posts/thumbnails', express.static(path.join(__dirname, 'uploads/posts/thumbnails')));

// Ensure uploads directories exist
const uploadDirs = ['uploads', 'uploads/photos', 'uploads/posts', 'uploads/posts/thumbnails'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Apply JWT authentication globally (except login & signup)
app.use((req, res, next) => {
  // List of public routes that don't require authentication
  const publicRoutes = [
    '/api/users/login',
    '/api/users/signup',
    '/api/send-otp',
    '/api/verify-otp',
    '/api/debug/otp-store',
    '/api/userRouter',
    '/api/2fa/setup',
    '/api/2fa/verify',
    '/api/phone/send-code',
    '/api/phone/verify',
    '/api/auth/login',
    '/documents/team_lucifer_privacy_policy_2025.pdf',
    '/uploads',
    '/uploads/photos',
    '/uploads/posts',
    '/uploads/posts/thumbnails'
  ];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  
  if (isPublicRoute) {
    console.log("Skipping authentication for public route:", req.path);
    return next();
  }

  // For protected routes, try to authenticate but don't block if token is missing
  try {
    authorize.authenticateJWT(req, res, next);
  } catch (error) {
    console.log("Authentication error:", error);
    // Continue without authentication
    next();
  }
});


// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// API routes

app.use("/api/posts", postRouter);
app.use("/api/users", userRouter);
app.use("/api/profile", profileRouter);
app.use("/api/connections", connectionsRouter);
app.use("/api/ad", adRouter);
app.use("/api/2fa", twoFactorRouter);
app.use("/api/phone", phoneRouter);
app.use("/api/auth", authRouter);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'mail.isourceworldwide.net',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER || "teamlucifer@isourceworldwide.net",
    pass: process.env.EMAIL_PASS || "&Hr5b5T?b$p@NJQt"
  },
  tls: {
    rejectUnauthorized: false 
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter error:", error);
  } else {
    console.log("Server is ready to send emails");
  }
});

// OTP store and generator
const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP Routes
app.post('/api/send-otp', async (req, res) => {
  const { email, userId } = req.body;
  console.log("Attempting to send OTP to:", email);
  
  try {
    // Check if there's an active OTP
    const existingOTP = otpStore.get(email);
    if (existingOTP && Date.now() - existingOTP.timestamp < 300000) { // 5 minutes
      return res.json({
        success: true,
        message: 'An OTP has already been sent. Please check your email.',
        userId: userId
      });
    }

    // Generate new OTP only if no active OTP exists
    const otp = generateOTP();
    console.log(`Generated OTP: ${otp} for email: ${email}`);

    // Store OTP with timestamp and userId
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      userId
    });

    const mailOptions = {
      from: 'tech@teamlucifer.com',
      to: email,
      subject: 'Your Verification Code - LUCIFER',
      html: generateEmailTemplate(otp)
    };

    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      userId: userId
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// Make sure generateEmailTemplate is defined
const generateEmailTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LUCIFER - Email Verification</title>
      <style>
        body {
          font-family: 'Monospace';
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color:rgb(22, 21, 21);
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color:rgb(12, 12, 12);
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg,rgba(26, 26, 26, 0.69) 0%,rgb(0, 0, 0) 100%);
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
          text-align: center;
        }
        .otp-box {
          background-color:rgb(10, 10, 10);
          border: 2px dashed #1a1a1a;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          display: inline-block;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color:rgb(252, 241, 241);
          letter-spacing: 4px;
          font-family: 'Monospace';
        }
        .message {
          color: #666666;
          margin: 20px 0;
        }
        .footer {
          background-color:rgb(12, 12, 12);
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 14px;
          font-family: 'Monospace';
        }
        .warning {
          color: #dc3545;
          font-size: 14px;
          margin-top: 20px;
          padding: 10px;
          background-color: #fff3f3;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">LUCIFER</div>
        </div>
        <div class="content">
          <h2 style="color:rgb(241, 239, 239); margin-bottom: 20px;">Email Verification</h2>
          <p class="message">Your verification code is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="message">This code will expire in 5 minutes.</p>
          <div class="warning">
            ⚠️ If you didn't request this code, please ignore this email.
          </div>
        </div>
        <div class="footer">
          <p>© 2025 LUCIFER. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  console.log('Received OTP verification request:', { email, otp });

  try {
    const storedOTPData = otpStore.get(email);
    
    if (!storedOTPData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found for this email' 
      });
    }

    if (storedOTPData.otp === otp) {
      // Get the user data after successful OTP verification
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Clear the OTP after successful verification
      otpStore.delete(email);

      // Generate 2FA setup URL
      const setupUrl = `/2fa-setup/${user._id}`;

      return res.json({ 
        success: true, 
        message: 'OTP verified successfully',
        userId: user._id, // Send back the MongoDB ObjectId
        nextStep: '2fa-setup',
        setupUrl: setupUrl
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Debug route for OTP store
app.get('/api/debug/otp-store', (req, res) => {
  const store = Array.from(otpStore.entries()).map(([email, data]) => ({
    email,
    otp: data.otp,
    timestamp: data.timestamp
  }));
  res.json(store);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files' });
    }
  }
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: err.message
  });
});

// Route to get all users
app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching users...'); // Debug log
    const users = await User.find({}, {
      firstName: 1,
      lastName: 1,
      profilePhoto: 1,
      location: 1,
      age: 1,
      gender: 1,
      _id: 1
    });
    console.log('Found users:', users); // Debug log
    res.json(users);
  } catch (error) {
    console.error('Error in /api/users route:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID (for view profile)
app.get('/api/users/:id', async (req, res) => {
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

    // Remove sensitive information
    const userResponse = {
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
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

// Get profile by userId
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    let profile = await Profile.findOne({ userId });
    
    if (!profile) {
      // Create a default profile if none exists
      const defaultProfile = new Profile({
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
        profile = await defaultProfile.save();
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
    console.error('Error in profile route:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// In server.js, update the profile update route
app.put('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'age', 'gender'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate age
    if (parseInt(req.body.age) < 18) {
      return res.status(400).json({ message: 'Must be 18 or older' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const profile = await Profile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Share profile
app.get('/api/profile/share/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error sharing profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Updated log route with location tracking
app.post('/log', async (req, res) => {
  try {
    const { userId, coordinates } = req.body;
    let locationData = null;

    if (coordinates && coordinates.latitude && coordinates.longitude) {
      // User allowed geolocation - use reverse geocoding
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}`);
        const address = response.data.address;
        
        locationData = {
          formatted_address: response.data.display_name,
          city: address.city || address.town || address.village,
          state: address.state,
          country: address.country,
          postcode: address.postcode,
          coordinates: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          }
        };
      } catch (error) {
        console.error('Error in reverse geocoding:', error);
      }
    }

    if (!locationData) {
      // Fallback to IP-based geolocation
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const geo = geoip.lookup(ip);
      
      if (geo) {
        locationData = {
          formatted_address: `${geo.city}, ${geo.region}, ${geo.country}`,
          city: geo.city,
          state: geo.region,
          country: geo.country,
          coordinates: {
            latitude: geo.ll[0],
            longitude: geo.ll[1]
          }
        };
      }
    }

    if (userId && locationData) {
      // Update user's location in database
      await User.findByIdAndUpdate(userId, {
        location: locationData
      }, { new: true });
    }

    res.status(200).json({
      success: true,
      message: 'Location logged successfully',
      location: locationData
    });
  } catch (error) {
    console.error('Error logging location:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging location',
      error: error.message
    });
  }
});

// Profile Routes
app.post('/api/profile/create', async (req, res) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      age,
      gender,
      sexuality,
      location,
      interests,
      photos
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Set default values for required fields if not provided
    const profileData = {
      userId,
      firstName: firstName || '',
      lastName: lastName || '',
      age: age || '',
      gender: gender || '',
      sexuality: sexuality || '',
      location: location || '',
      interests: interests || [],
      photos: photos || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if profile exists by userId
    let profile = await Profile.findOne({ userId });
    
    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { userId },
        profileData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      profile = new Profile(profileData);
      await profile.save();
    }

    // Update user's profile picture if photos exist
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
    console.warn('Error creating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating profile',
      error: error.message
    });
  }
});

// Root route handler
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LUCIFER API is running',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      posts: '/api/posts',
      profile: '/api/profile',
      connections: '/api/connections'
    }
  });
});

// Make sure this is BEFORE your 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Signup route
app.post('/api/users/signup', async (req, res) => {
  console.log("Received signup request:", req.body); // Debug log
  
  // ... rest of the signup route
});

// Add logout route
app.post('/api/users/logout', async (req, res) => {
  try {
    // Clear the session cookie
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
});

// 2FA Routes
app.post('/api/2fa/setup', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `LUCIFER (${user.email})`
    });

    // Update user with 2FA details
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false // Will be set to true after verification
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update user'
      });
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCode,
      message: '2FA setup initiated'
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error setting up 2FA',
      error: error.message 
    });
  }
});

app.post('/api/2fa/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Enable 2FA and set verified status
    user.twoFactorEnabled = true;
    user.isVerified = true;
    user.verifiedBadge = true;
    await user.save();

    // Generate phone verification URL
    const phoneVerifyUrl = `/phone-verify/${user._id}`;

    // Return success
    return res.json({
      success: true,
      message: '2FA verification successful',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verifiedBadge: user.verifiedBadge,
        twoFactorEnabled: user.twoFactorEnabled
      },
      nextStep: 'phone-verify',
      phoneVerifyUrl: phoneVerifyUrl
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ success: false, message: 'Error verifying 2FA' });
  }
});

// Phone verification store
const phoneVerificationStore = new Map();

// Phone verification routes
app.post('/api/phone/send-code', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    
    if (!userId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'User ID and phone number are required'
      });
    }

    // Generate a 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code with timestamp
    phoneVerificationStore.set(userId, {
      code: verificationCode,
      phoneNumber,
      timestamp: Date.now()
    });

    // In a real application, you would send this code via SMS
    // For development, we'll just log it
    console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Error sending phone verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

app.post('/api/phone/verify', async (req, res) => {
  try {
    const { userId, phoneNumber, code } = req.body;
    
    if (!userId || !phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID, phone number, and verification code are required'
      });
    }

    const storedData = phoneVerificationStore.get(userId);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new code.'
      });
    }

    // Check if code has expired (5 minutes)
    if (Date.now() - storedData.timestamp > 300000) {
      phoneVerificationStore.delete(userId);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    if (storedData.code !== code || storedData.phoneNumber !== phoneNumber) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Update user's phone number in database
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        phoneNumber,
        phoneVerified: true
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clear the verification data
    phoneVerificationStore.delete(userId);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified
      }
    });
  } catch (error) {
    console.error('Error verifying phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone number'
    });
  }
});

// Add function to check for expired trials and update profiles
const checkTrialExpirations = async () => {
  try {
    const now = new Date();
    
    // Find profiles with free plan and expired trial
    const expiredProfiles = await Profile.find({
      plan: 'free',
      trialEndDate: { $lt: now }
    });
    
    console.log(`Found ${expiredProfiles.length} expired trials`);
    
    // Update these profiles if needed
    for (const profile of expiredProfiles) {
      console.log(`Trial expired for user: ${profile.userId}, profile ID: ${profile._id}`);
      // You can implement logic here to notify users or change their plan
      // For now, we'll just log the expiration
    }
  } catch (error) {
    console.error('Error checking trial expirations:', error);
  }
};

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/lucifer', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Run trial expiration check on server start
  checkTrialExpirations();
  
  // Schedule trial expiration check to run daily
  setInterval(checkTrialExpirations, 24 * 60 * 60 * 1000); // 24 hours
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});
