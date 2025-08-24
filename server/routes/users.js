const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const Review = require('../models/Review');
const { auth, requireVerification, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with filtering and search
// @access  Public
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().isString().trim(),
  query('skills').optional().isString(),
  query('location').optional().isString(),
  query('sortBy').optional().isIn(['rating', 'sessions', 'recent']).withMessage('Invalid sort option')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    page = 1,
    limit = 20,
    search,
    skills,
    location,
    sortBy = 'rating'
  } = req.query;

  const skip = (page - 1) * limit;

  // Build query
  let query = { isActive: true };

  // Filter for mentors (users ready for mentoring)
  if (req.query.isMentor === 'true') {
    query['skillsOffered.0'] = { $exists: true }; // At least one skill offered
    query.isVerified = true; // Only verified users can be mentors
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (skills) {
    const skillsArray = skills.split(',').map(s => s.trim());
    query['skillsOffered.name'] = { $in: skillsArray };
  }

  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  // Build sort
  let sort = {};
  switch (sortBy) {
    case 'rating':
      sort = { 'stats.averageRating': -1, 'stats.totalSessions': -1 };
      break;
    case 'sessions':
      sort = { 'stats.totalSessions': -1, 'stats.averageRating': -1 };
      break;
    case 'recent':
      sort = { lastActive: -1 };
      break;
    default:
      sort = { 'stats.averageRating': -1 };
  }

  const users = await User.find(query)
    .select('-password -verificationToken -resetPasswordToken -resetPasswordExpire')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  // Add avatar URLs
  const usersWithAvatars = users.map(user => ({
    ...user.toObject(),
    avatar: user.getAvatarUrl()
  }));

  res.json({
    success: true,
    users: usersWithAvatars,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @route   GET /api/users/all-including-inactive
// @desc    Get all users including inactive ones (for debugging)
// @access  Public
router.get('/all-including-inactive', asyncHandler(async (req, res) => {
  const users = await User.find({}) // No isActive filter
    .select('firstName lastName email skillsOffered isActive isVerified stats')
    .sort({ createdAt: -1 })
    .limit(50);

  const usersWithAvatars = users.map(user => ({
    ...user.toObject(),
    avatar: user.getAvatarUrl ? user.getAvatarUrl() : '/placeholder.svg'
  }));

  res.json({
    success: true,
    message: `Found ${users.length} total users (including inactive)`,
    users: usersWithAvatars,
    activeCount: users.filter(u => u.isActive).length,
    inactiveCount: users.filter(u => !u.isActive).length
  });
}));

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -verificationToken -resetPasswordToken -resetPasswordExpire');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User profile is not available'
    });
  }

  // Get recent reviews
  const reviews = await Review.find({ 
    reviewee: user._id, 
    isPublic: true,
    isHidden: false 
  })
    .populate('reviewer', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(10);

  const userProfile = {
    ...user.toObject(),
    avatar: user.getAvatarUrl(),
    reviews: reviews.map(review => ({
      ...review.toObject(),
      reviewer: {
        ...review.reviewer.toObject(),
        avatar: review.reviewer.getAvatarUrl()
      }
    }))
  };

  res.json({
    success: true,
    user: userProfile
  });
}));

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('title').optional().isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
  body('timezone').optional().isString(),
  body('socialLinks.website').optional().isURL().withMessage('Website must be a valid URL'),
  body('socialLinks.linkedin').optional().isURL().withMessage('LinkedIn must be a valid URL'),
  body('socialLinks.twitter').optional().isURL().withMessage('Twitter must be a valid URL'),
  body('socialLinks.github').optional().isURL().withMessage('GitHub must be a valid URL')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const allowedFields = [
    'firstName', 'lastName', 'bio', 'title', 'location', 'timezone', 'socialLinks'
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      // Handle string fields - convert empty strings to null to maintain data consistency
      if (typeof req.body[field] === 'string') {
        const trimmedValue = req.body[field].trim();
        updateData[field] = trimmedValue === '' ? null : trimmedValue;
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  // Log profile update for debugging
  console.log(`Profile update for user ${req.user._id}:`, updateData);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -verificationToken -resetPasswordToken -resetPasswordExpire');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      ...user.toObject(),
      avatar: user.getAvatarUrl()
    }
  });
}));

// @route   POST /api/users/skills/offered
// @desc    Add or update offered skills
// @access  Private
router.post('/skills/offered', [
  auth,
  requireVerification,
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Skill name must be between 2 and 50 characters'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid skill level'),
  body('category').trim().isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters'),
  body('experience').optional().isLength({ max: 200 }).withMessage('Experience must be less than 200 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, level, category, experience } = req.body;
  const user = await User.findById(req.user._id);

  // Check if skill already exists
  const existingSkillIndex = user.skillsOffered.findIndex(
    skill => skill.name.toLowerCase() === name.toLowerCase()
  );

  if (existingSkillIndex > -1) {
    // Update existing skill
    user.skillsOffered[existingSkillIndex] = {
      ...user.skillsOffered[existingSkillIndex],
      level,
      category,
      experience: experience || user.skillsOffered[existingSkillIndex].experience
    };
  } else {
    // Add new skill
    user.skillsOffered.push({
      name,
      level,
      category,
      experience: experience || '',
      sessionCount: 0,
      rating: 0
    });
  }

  await user.save();

  res.json({
    success: true,
    message: 'Skill added successfully',
    skillsOffered: user.skillsOffered
  });
}));

// @route   DELETE /api/users/skills/offered/:skillId
// @desc    Remove offered skill
// @access  Private
router.delete('/skills/offered/:skillId', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.skillsOffered = user.skillsOffered.filter(
    skill => skill._id.toString() !== req.params.skillId
  );

  await user.save();

  res.json({
    success: true,
    message: 'Skill removed successfully',
    skillsOffered: user.skillsOffered
  });
}));

// @route   POST /api/users/skills/wanted
// @desc    Add or update wanted skills
// @access  Private
router.post('/skills/wanted', [
  auth,
  requireVerification,
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Skill name must be between 2 and 50 characters'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid skill level'),
  body('category').trim().isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority level')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, level, category, priority = 'Medium' } = req.body;
  const user = await User.findById(req.user._id);

  // Check if skill already exists
  const existingSkillIndex = user.skillsWanted.findIndex(
    skill => skill.name.toLowerCase() === name.toLowerCase()
  );

  if (existingSkillIndex > -1) {
    // Update existing skill
    user.skillsWanted[existingSkillIndex] = {
      ...user.skillsWanted[existingSkillIndex],
      level,
      category,
      priority
    };
  } else {
    // Add new skill
    user.skillsWanted.push({
      name,
      level,
      category,
      priority,
      progress: 0
    });
  }

  await user.save();

  res.json({
    success: true,
    message: 'Learning goal added successfully',
    skillsWanted: user.skillsWanted
  });
}));

// @route   PUT /api/users/skills/wanted/:skillId/progress
// @desc    Update skill learning progress
// @access  Private
router.put('/skills/wanted/:skillId/progress', [
  auth,
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.user._id);
  const skill = user.skillsWanted.id(req.params.skillId);

  if (!skill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found'
    });
  }

  skill.progress = req.body.progress;
  await user.save();

  res.json({
    success: true,
    message: 'Progress updated successfully',
    skill
  });
}));

// @route   DELETE /api/users/skills/wanted/:skillId
// @desc    Remove wanted skill
// @access  Private
router.delete('/skills/wanted/:skillId', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.skillsWanted = user.skillsWanted.filter(
    skill => skill._id.toString() !== req.params.skillId
  );

  await user.save();

  res.json({
    success: true,
    message: 'Learning goal removed successfully',
    skillsWanted: user.skillsWanted
  });
}));

// @route   PUT /api/users/availability
// @desc    Update user availability
// @access  Private
router.put('/availability', [
  auth,
  requireVerification,
  body('days').optional().isArray().withMessage('Days must be an array'),
  body('times').optional().isArray().withMessage('Times must be an array'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
  body('sessionTypes').optional().isArray().withMessage('Session types must be an array'),
  body('preferredSessionDuration').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const allowedFields = ['availability', 'sessionTypes', 'preferredSessionDuration'];
  const updateData = {};

  if (req.body.days || req.body.times || req.body.timezone) {
    updateData.availability = {
      days: req.body.days || req.user.availability?.days || [],
      times: req.body.times || req.user.availability?.times || [],
      timezone: req.body.timezone || req.user.availability?.timezone || 'UTC'
    };
  }

  if (req.body.sessionTypes) {
    updateData.sessionTypes = req.body.sessionTypes;
  }

  if (req.body.preferredSessionDuration) {
    updateData.preferredSessionDuration = req.body.preferredSessionDuration;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -verificationToken -resetPasswordToken -resetPasswordExpire');

  res.json({
    success: true,
    message: 'Availability updated successfully',
    availability: user.availability,
    sessionTypes: user.sessionTypes,
    preferredSessionDuration: user.preferredSessionDuration
  });
}));

// @route   PUT /api/users/notification-settings
// @desc    Update notification settings
// @access  Private
router.put('/notification-settings', [
  auth,
  body('email').optional().isObject().withMessage('Email settings must be an object'),
  body('push').optional().isObject().withMessage('Push settings must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.user._id);

  if (req.body.email) {
    user.notificationSettings.email = {
      ...user.notificationSettings.email,
      ...req.body.email
    };
  }

  if (req.body.push) {
    user.notificationSettings.push = {
      ...user.notificationSettings.push,
      ...req.body.push
    };
  }

  await user.save();

  res.json({
    success: true,
    message: 'Notification settings updated successfully',
    notificationSettings: user.notificationSettings
  });
}));

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', [
  auth,
  upload.single('avatar')
], asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const user = await User.findById(req.user._id);
  user.avatar = req.file.path; // This will be the Cloudinary URL if using cloud storage
  await user.save();

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    avatar: user.getAvatarUrl()
  });
}));

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Public
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('stats skillsOffered achievements');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get additional stats
  const upcomingSessions = await Session.countDocuments({
    $or: [{ mentor: user._id }, { student: user._id }],
    status: 'confirmed',
    scheduledAt: { $gte: new Date() }
  });

  const completedThisMonth = await Session.countDocuments({
    $or: [{ mentor: user._id }, { student: user._id }],
    status: 'completed',
    completedAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  });

  res.json({
    success: true,
    stats: {
      ...user.stats.toObject(),
      upcomingSessions,
      completedThisMonth,
      skillsOffered: user.skillsOffered.length,
      achievements: user.achievements.length
    }
  });
}));

// @route   GET /api/users/debug/all
// @desc    Debug endpoint to see all users in database
// @access  Private
router.get('/debug/all', auth, async (req, res) => {
  try {
    console.log('\n=== DEBUG ALL USERS ===');
    const users = await User.find({})
      .select('firstName lastName email skillsOffered skillsWanted isVerified isActive createdAt')
      .limit(20); // Increased limit to see more users
      
    console.log(`Found ${users.length} users in database`);
    console.log('Users:', users.map(u => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      skillsOffered: u.skillsOffered?.length || 0,
      isVerified: u.isVerified,
      isActive: u.isActive
    })));
    
    res.json({
      success: true,
      users: users.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        skillsOffered: u.skillsOffered || [],
        skillsWanted: u.skillsWanted || [],
        isVerified: u.isVerified,
        isActive: u.isActive,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

module.exports = router;
