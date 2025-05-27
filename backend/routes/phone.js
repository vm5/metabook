const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const twilio = require('twilio');

// Development mode flag - set to true to bypass actual Twilio SMS sending
const DEV_MODE = true;

// Initialize Twilio client with hardcoded credentials
const twilioClient = DEV_MODE ? null : twilio(
  'AC874caea0bc2b8774eac79cf7a408b573',
  'b5523143c16ef711a778fdd46f33c4d6'
);
const TWILIO_PHONE_NUMBER = '+18106742215';

// Store verification codes in memory (in production, use Redis or similar)
const verificationStore = new Map();

// Generate a random 6-digit code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to update user and respond with consistent format
const updateUserAndRespond = async (userId, phoneNumber, res) => {
    try {
        // In DEV_MODE, skip checking if another user has this phone number
        if (!DEV_MODE) {
            const existingUser = await User.findOne({ 
                phoneNumber, 
                _id: { $ne: userId }
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'This phone number is already registered with another account'
                });
            }
        }

        // Update the user
        const user = await User.findByIdAndUpdate(
            userId,
            {
                phoneNumber: phoneNumber,
                isPhoneVerified: true,
                phoneVerificationCode: null,
                phoneVerificationExpires: null,
                verifiedBadge: true
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.json({
            success: true,
            message: DEV_MODE ? 'Phone number verified successfully (DEV MODE)' : 'Phone number verified successfully',
            user: {
                _id: user._id,
                phoneNumber: user.phoneNumber,
                isPhoneVerified: user.isPhoneVerified,
                verifiedBadge: user.verifiedBadge
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
};

// Send verification code via SMS
router.post('/send-code', async (req, res) => {
    try {
        const { userId, phoneNumber } = req.body;

        if (!userId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'User ID and phone number are required'
            });
        }

        // In dev mode, skip checking if phone number is already registered
        if (!DEV_MODE) {
            // First check if phone number is already registered
            const existingUser = await User.findOne({ phoneNumber });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({
                    success: false,
                    message: 'This phone number is already registered with another account'
                });
            }
        }

        // Generate verification code
        const code = DEV_MODE ? '123456' : generateVerificationCode();
        
        // Store code with timestamp
        verificationStore.set(userId, {
            code,
            phoneNumber,
            timestamp: Date.now()
        });

        if (DEV_MODE) {
            // In development mode, just log the code instead of sending SMS
            console.log('====================================');
            console.log(`DEV MODE: Verification code for ${phoneNumber}: ${code}`);
            console.log('====================================');
            
            // Send success response immediately
            return res.json({
                success: true,
                message: 'Verification code sent successfully (DEV MODE)',
                devMode: true,
                devCode: code // Include the code in response in dev mode only
            });
        }

        // Send SMS via Twilio in production mode
        try {
            const message = await twilioClient.messages.create({
                body: `Your LUCIFER verification code is: ${code}. Valid for 5 minutes.`,
                to: phoneNumber,
                from: TWILIO_PHONE_NUMBER
            });

            console.log('SMS sent successfully:', message.sid);

            res.json({
                success: true,
                message: 'Verification code sent successfully'
            });
        } catch (twilioError) {
            console.error('Twilio error:', twilioError);
            res.status(500).json({
                success: false,
                message: 'Failed to send verification code',
                error: twilioError.message
            });
        }

    } catch (error) {
        console.error('Error in send-code route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send verification code'
        });
    }
});

// Verify the code
router.post('/verify', async (req, res) => {
    try {
        const { userId, phoneNumber, code } = req.body;

        if (!userId || !phoneNumber || !code) {
            return res.status(400).json({
                success: false,
                message: 'User ID, phone number, and verification code are required'
            });
        }

        // DEV MODE: If we're in development mode and using the test code,
        // we can skip verification store lookup
        if (DEV_MODE && code === '123456') {
            return await updateUserAndRespond(userId, phoneNumber, res);
        }

        const storedData = verificationStore.get(userId);

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found. Please request a new code.'
            });
        }

        // In dev mode, accept any code that matches the length
        const isValidCode = DEV_MODE 
            ? (code === '123456' || code === storedData.code)
            : (storedData.code === code && storedData.phoneNumber === phoneNumber);

        // Check if code has expired (5 minutes) - skip in dev mode
        if (!DEV_MODE && Date.now() - storedData.timestamp > 300000) {
            verificationStore.delete(userId);
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new code.'
            });
        }

        if (!isValidCode) {
            return res.status(401).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Clear verification data
        verificationStore.delete(userId);

        // Update user data and send response
        return await updateUserAndRespond(userId, phoneNumber, res);

    } catch (error) {
        console.error('Error verifying phone number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify phone number'
        });
    }
});

module.exports = router; 