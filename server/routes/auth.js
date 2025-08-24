const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { auth, authRateLimit } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit(authRateLimit);

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  authLimiter,
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create user with minimal profile data
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      verificationToken,
      isVerified: false,
      // Explicitly set profile fields to null/empty for new users
      bio: null,
      title: null,
      location: null,
      timezone: null,
      socialLinks: {
        website: null,
        linkedin: null,
        twitter: null,
        github: null
      },
      skillsOffered: [],
      skillsWanted: [],
      availability: {
        days: [],
        times: [],
        timezone: 'UTC'
      },
      sessionTypes: [],
      achievements: []
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.getAvatarUrl(),
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        // Return empty profile state for new users
        bio: user.bio,
        title: user.title,
        location: user.location,
        timezone: user.timezone,
        skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted,
        stats: user.stats
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  // authLimiter, // Temporarily disabled for debugging
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last active time
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.getAvatarUrl(),
        isVerified: user.isVerified,
        lastActive: user.lastActive,
        stats: user.stats,
        skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted
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

// @route   POST /api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Private
router.post('/resend-verification', auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email resend'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  authLimiter,
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Find user by reset token and check if token is not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new JWT token
    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      token: jwtToken
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.getAvatarUrl(),
        bio: user.bio,
        title: user.title,
        location: user.location,
        timezone: user.timezone,
        socialLinks: user.socialLinks,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastActive: user.lastActive,
        stats: user.stats,
        skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted,
        availability: user.availability,
        sessionTypes: user.sessionTypes,
        preferredSessionDuration: user.preferredSessionDuration,
        achievements: user.achievements,
        notificationSettings: user.notificationSettings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user profile'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal, server logs the action)
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Update last active time
    req.user.lastActive = new Date();
    await req.user.save();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

module.exports = router;
