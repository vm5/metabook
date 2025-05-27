const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password, coordinates } = req.body;

    // Enhanced debug logging
    console.log('Login attempt details:', {
      email: email.toLowerCase(),
      passwordProvided: !!password,
      passwordLength: password ? password.length : 0
    });

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('No user found with email:', email.toLowerCase());
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email.toLowerCase());
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate session ID
    const sessionId = uuidv4();
    user.sessionId = sessionId;

    // Update user's location if coordinates provided
    if (coordinates) {
      user.location = {
        ...user.location,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        }
      };
    }

    await user.save();

    // Get JWT_SECRET and cookieOptions from authMiddleware
    const { JWT_SECRET, cookieOptions } = require('../middleware/authMiddleware');

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        sessionId: sessionId
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookie
    res.cookie('token', token, cookieOptions);

    // Return user data (excluding password)
    const { password: _, ...userData } = user.toObject();
    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login. Please try again.'
    });
  }
});

// Logout route
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const JWT_SECRET = require('../middleware/authMiddleware').JWT_SECRET;
      const decoded = jwt.verify(token, JWT_SECRET);
      await User.findByIdAndUpdate(decoded.userId, { sessionId: null });
    }

    res.clearCookie('token');
    res.json({
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

// Session check route
router.get("/session-check", async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const JWT_SECRET = require('../middleware/authMiddleware').JWT_SECRET;
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.sessionId !== decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    res.json({
      success: true,
      message: 'Session valid',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Session check error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid session'
    });
  }
});

module.exports = router; 