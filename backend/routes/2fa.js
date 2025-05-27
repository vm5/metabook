const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'mail.teamlucifer.com',
  port: 587,
  secure: false,
  auth: {
    user: "tech@teamlucifer.com",
    pass: "XSMYs2pdjtzcQBBX8vjY"
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Setup 2FA
router.post('/setup', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `LUCIFER (${user.email})`
    });

    // Save secret to user
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false;
    user.verificationDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await user.save();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Schedule verification reminder emails
    scheduleVerificationReminders(user);

    res.json({
      success: true,
      qrCode,
      message: 'Two-factor authentication setup initiated'
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, message: 'Error setting up 2FA' });
  }
});

// Verify 2FA token
router.post('/verify', async (req, res) => {
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

    if (verified) {
      user.twoFactorEnabled = true;
      user.isVerified = true;
      user.verificationDeadline = null; // Clear deadline after verification
      await user.save();

      // Send verification success email
      await sendVerificationSuccessEmail(user.email);

      res.json({
        success: true,
        message: 'Two-factor authentication verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ success: false, message: 'Error verifying 2FA' });
  }
});

// Function to schedule verification reminder emails
async function scheduleVerificationReminders(user) {
  const deadline = new Date(user.verificationDeadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  // Send initial reminder
  await sendReminderEmail(user.email, daysLeft);

  // Schedule daily reminders
  const reminderInterval = setInterval(async () => {
    const currentTime = new Date();
    const remainingDays = Math.ceil((deadline - currentTime) / (1000 * 60 * 60 * 24));

    if (remainingDays <= 0) {
      clearInterval(reminderInterval);
      // Delete unverified account
      await handleUnverifiedAccount(user._id);
    } else if (!user.isVerified) {
      await sendReminderEmail(user.email, remainingDays);
    } else {
      clearInterval(reminderInterval);
    }
  }, 24 * 60 * 60 * 1000); // Check every 24 hours
}

// Function to send reminder email
async function sendReminderEmail(email, daysLeft) {
  const mailOptions = {
    from: 'tech@teamlucifer.com',
    to: email,
    subject: `Action Required: Verify Your LUCIFER Account - ${daysLeft} Days Left`,
    html: generateReminderEmailTemplate(daysLeft)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${email}`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
}

// Function to send verification success email
async function sendVerificationSuccessEmail(email) {
  const mailOptions = {
    from: 'tech@teamlucifer.com',
    to: email,
    subject: 'Account Verified Successfully - LUCIFER',
    html: generateSuccessEmailTemplate()
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Success email sent to ${email}`);
  } catch (error) {
    console.error('Error sending success email:', error);
  }
}

// Function to handle unverified accounts
async function handleUnverifiedAccount(userId) {
  try {
    const user = await User.findById(userId);
    if (user && !user.isVerified) {
      // Send final warning email
      await sendFinalWarningEmail(user.email);
      // Delete the account
      await User.findByIdAndDelete(userId);
      console.log(`Unverified account deleted: ${userId}`);
    }
  } catch (error) {
    console.error('Error handling unverified account:', error);
  }
}

// Email templates
function generateReminderEmailTemplate(daysLeft) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3a9eff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .warning { color: #ff4d4d; font-weight: bold; }
        .button { background: #3a9eff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Verification Required</h1>
        </div>
        <div class="content">
          <h2>Action Required: Complete Your Account Verification</h2>
          <p>Your LUCIFER account requires verification through two-factor authentication.</p>
          <p class="warning">Time Remaining: ${daysLeft} days</p>
          <p>Please complete the verification process to ensure your account remains active. If you don't verify your account within ${daysLeft} days, it will be automatically deleted.</p>
          <p>To verify your account:</p>
          <ol>
            <li>Log in to your LUCIFER account</li>
            <li>Complete the two-factor authentication setup</li>
            <li>Scan the QR code with Google Authenticator</li>
            <li>Enter the verification code</li>
          </ol>
         
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSuccessEmailTemplate() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00c853; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .checkmark { color: #00c853; font-size: 48px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Verified Successfully!</h1>
        </div>
        <div class="content">
          <div class="checkmark">✓</div>
          <h2>Success!!</h2>
          <p>Your LUCIFER account has been successfully verified with two-factor authentication.</p>
          <p>Your account is now more secure, and you have received the verified badge.</p>
          <p>Thank you for helping us maintain a secure platform for all users.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router; 