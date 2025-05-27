const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  newsletter: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  phoneNumber: {
    type: String,
    default: null,
    sparse: true // Allow multiple null values but enforce uniqueness for non-null values
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationCode: {
    type: String,
    default: null
  },
  phoneVerificationExpires: {
    type: Date,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  tempOTP: String,
  otpExpires: Date,
  work: {
    type: String,
    default: ''
  },
  location: {
    formatted_address: String,
    city: String,
    state: String,
    country: String,
    postcode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  country: {
    type: String,
    default: ''
  },
  relationship: {
    type: String,
    enum: ['', 'Single', 'In a relationship', 'Married'],
    default: ''
  },
  profilePicture: {
    type: String,
    default: null
  },
  coverPicture: {
    type: String,
    default: ''
  },
  sessionId: {
    type: String,
    default: null,
    index: true // Regular index instead of unique
  },
  // Add 2FA fields
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  verificationDeadline: {
    type: Date,
    default: null
  },
  verifiedBadge: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  isDisabled: {
    type: Boolean,
    default: false
  },
  disabledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  // Set verified badge when user completes both 2FA and phone verification
  if (this.isModified('twoFactorEnabled') || this.isModified('isPhoneVerified')) {
    this.verifiedBadge = this.twoFactorEnabled && this.isPhoneVerified;
  }
  
  next();
});

// Add pre-save middleware to check for existing username/email/phone
userSchema.pre('save', async function(next) {
  try {
    // Only check for duplicates if this is a new user or relevant fields are modified
    if (this.isNew || this.isModified('username') || this.isModified('email') || this.isModified('phoneNumber')) {
      const existingUser = await this.constructor.findOne({ 
        $or: [
          { username: this.username },
          { email: this.email },
          ...(this.phoneNumber ? [{ phoneNumber: this.phoneNumber }] : [])
        ],
        _id: { $ne: this._id } // Exclude current user when updating
      });
      
      if (existingUser) {
        if (existingUser.username === this.username) {
          throw new Error('Username already exists');
        }
        if (existingUser.email === this.email) {
          throw new Error('Email already exists');
        }
        if (this.phoneNumber && existingUser.phoneNumber === this.phoneNumber) {
          throw new Error('Phone number already registered');
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add a pre-save middleware to handle email uniqueness for disabled accounts
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    const DeletedAccount = mongoose.model('DeletedAccount');
    const DisabledAccount = mongoose.model('DisabledAccount');
    
    // Check if email exists in deleted or disabled accounts
    const deletedAccount = await DeletedAccount.findOne({ email: this.email });
    const disabledAccount = await DisabledAccount.findOne({ email: this.email });
    
    if (deletedAccount || disabledAccount) {
      // If account was deleted/disabled, allow reuse of email
      if (deletedAccount) {
        await DeletedAccount.findOneAndDelete({ email: this.email });
      }
      if (disabledAccount) {
        await DisabledAccount.findOneAndDelete({ email: this.email });
      }
    }
  }
  next();
});

userSchema.index({firstName : "text", lastName : "text", userName : "text"});

module.exports = mongoose.model('User', userSchema);