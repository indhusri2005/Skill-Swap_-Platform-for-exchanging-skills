const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// @route   POST /api/sessions/test-swap
// @desc    Test endpoint for swap request debugging
// @access  Private
router.post('/test-swap', auth, async (req, res) => {
  try {
    console.log('Test swap request received');
    console.log('User:', req.user.id, req.user.firstName, req.user.lastName);
    console.log('Body:', req.body);
    
    return res.json({
      success: true,
      message: 'Test swap request received successfully',
      data: {
        userId: req.user.id,
        requestData: req.body,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Test swap error:', error);
    return res.status(500).json({
      success: false,
      message: 'Test swap request failed',
      error: error.message
    });
  }
});

// @route   GET /api/sessions
// @desc    Get user's sessions (as mentor or student)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    console.log('\n=== GET SESSIONS DEBUG ===');
    console.log('User requesting sessions:', {
      id: userId,
      name: `${req.user.firstName} ${req.user.lastName}`
    });
    console.log('Query params:', { status, role, page, limit });

    let filter = {};
    
    // Filter by role
    if (role === 'mentor') {
      filter.mentor = userId;
    } else if (role === 'student') {
      filter.student = userId;
    } else {
      // Get sessions where user is either mentor or student
      filter.$or = [{ mentor: userId }, { student: userId }];
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    console.log('Database filter:', JSON.stringify(filter, null, 2));

    const sessions = await Session.find(filter)
      .populate('mentor', 'firstName lastName avatar title')
      .populate('student', 'firstName lastName avatar title')
      .populate('skill', 'name category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Session.countDocuments(filter);
    
    // Add review information to each session
    const sessionsWithReviews = await Promise.all(sessions.map(async (session) => {
      const sessionObj = session.toObject();
      
      if (session.status === 'completed') {
        // Find reviews for this session
        const reviews = await Review.find({ session: session._id })
          .populate('reviewer', 'firstName lastName avatar')
          .populate('reviewee', 'firstName lastName avatar');
        
        // Check if current user has reviewed this session
        const userReview = reviews.find(r => r.reviewer._id.toString() === userId);
        const otherReview = reviews.find(r => r.reviewer._id.toString() !== userId);
        
        sessionObj.hasReview = !!userReview;
        sessionObj.userReview = userReview || null;
        sessionObj.otherReview = otherReview || null;
        sessionObj.reviewCount = reviews.length;
        
        // Add average rating if there are reviews
        if (reviews.length > 0) {
          const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          sessionObj.averageRating = Math.round(avgRating * 10) / 10;
        }
      } else {
        sessionObj.hasReview = false;
        sessionObj.userReview = null;
        sessionObj.otherReview = null;
        sessionObj.reviewCount = 0;
      }
      
      return sessionObj;
    }));
    
    console.log(`Found ${sessions.length} sessions (${total} total)`);
    console.log('Sessions summary:', sessions.map(s => ({
      id: s._id,
      mentor: s.mentor?.firstName + ' ' + s.mentor?.lastName,
      student: s.student?.firstName + ' ' + s.student?.lastName,
      skill: s.skill?.name,
      status: s.status,
      isExchange: s.isExchange,
      swapDetails: s.swapDetails
    })));

    res.json({
      success: true,
      sessions: sessionsWithReviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sessions'
    });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get session by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentor', 'firstName lastName avatar title email')
      .populate('student', 'firstName lastName avatar title email')
      .populate('skill', 'name category level');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is part of this session
    const userId = req.user.id;
    if (session.mentor._id.toString() !== userId && session.student._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching session'
    });
  }
});

// @route   POST /api/sessions
// @desc    Create a new session request
// @access  Private
router.post('/', [
  auth,
  body('mentorId').isMongoId().withMessage('Valid mentor ID is required'),
  body('skillId').isMongoId().withMessage('Valid skill ID is required'),
  body('requestedDate').isISO8601().withMessage('Valid date is required'),
  body('duration').isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes'),
  body('sessionType').isIn(['Video Call', 'Text Chat', 'Workshop', 'Code Review', 'Mentorship']).withMessage('Invalid session type'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { mentorId, skillId, requestedDate, duration, sessionType, message } = req.body;
    const studentId = req.user.id;

    // Check if user is trying to request session with themselves
    if (mentorId === studentId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request a session with yourself'
      });
    }

    // Check if mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Check if there's already a pending session between these users for this skill
    const existingSession = await Session.findOne({
      mentor: mentorId,
      student: studentId,
      status: 'pending'
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending session with this mentor'
      });
    }

    // Create new session
    const session = new Session({
      mentor: mentorId,
      student: studentId,
      skill: skillId,
      requestedDate: new Date(requestedDate),
      duration,
      sessionType,
      message,
      status: 'pending'
    });

    await session.save();

    // Populate the session for response
    await session.populate('mentor', 'firstName lastName avatar title email');
    await session.populate('student', 'firstName lastName avatar title email');
    await session.populate('skill', 'name category');

    // Send email notification to mentor
    try {
      await emailService.sendSessionRequestEmail(session);
    } catch (emailError) {
      console.error('Failed to send session request email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Session request sent successfully',
      session
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating session'
    });
  }
});

// @route   POST /api/sessions/swap-request
// @desc    Create a skill swap request and send notification
// @access  Private
router.post('/swap-request', [
  auth,
  body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
  body('skillOffered').custom((value) => {
    if (Array.isArray(value) && value.length > 0) return true;
    if (typeof value === 'string' && value.trim() !== '') return true;
    throw new Error('At least one skill must be offered');
  }),
  body('skillWanted').optional(),
  body('message').optional().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
], async (req, res) => {
  try {
    console.log('\n=== SWAP REQUEST DEBUG START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request user:', {
      id: req.user.id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      isVerified: req.user.isVerified
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recipientId, skillOffered, skillWanted, message } = req.body;
    
    // Handle skillOffered as array or string
    const offeredSkills = Array.isArray(skillOffered) ? skillOffered : [skillOffered];
    const skillsText = offeredSkills.join(', ');
    const requesterId = req.user.id;
    
    console.log('Parsed data:', {
      recipientId,
      requesterId,
      skillOffered,
      offeredSkills,
      skillWanted,
      message
    });

    // Validate that recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Get requester details
    const requester = await User.findById(requesterId).select('firstName lastName avatar');
    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'Requester not found'
      });
    }

    // Prevent self-requests
    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send swap request to yourself'
      });
    }

    // Create session request for the swap
    const sessionData = {
      mentor: recipientId,
      student: requesterId,
      skill: {
        name: skillWanted || 'To be decided',
        category: 'General' // Default category for swap requests
      },
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      duration: 60, // Default 1 hour
      sessionType: 'Video Call', // Changed from 'Skill Swap' to valid enum value
      title: `Skill Swap: ${skillWanted || 'Open Discussion'}`,
      description: message || `Hi! I'd like to request a skill swap. I want to learn ${skillWanted || 'various skills'} from you. I can teach the following skills: ${skillsText}. Please choose which skill you'd like to learn from me!`,
      status: 'pending',
      isExchange: true, // Mark as exchange/swap
      exchangeSkill: {
        name: offeredSkills[0] || 'Various skills',
        category: 'General'
      },
      swapDetails: {
        skillOffered: offeredSkills,
        skillWanted: skillWanted || null,
        isSwapRequest: true,
        requiresResponse: true
      }
    };

    console.log('Creating session with data:', JSON.stringify(sessionData, null, 2));
    const session = new Session(sessionData);
    await session.save();
    console.log('Session saved successfully:', {
      sessionId: session._id,
      mentor: session.mentor,
      student: session.student,
      status: session.status,
      isExchange: session.isExchange,
      swapDetails: session.swapDetails
    });

    // Create notification for the recipient
    const notification = new Notification({
      recipient: recipientId,
      sender: requesterId,
      type: 'swap_request',
      title: `New skill swap request from ${requester.firstName} ${requester.lastName}`,
      message: `${requester.firstName} wants to learn ${skillWanted} from you. They can teach: ${skillsText}. Choose which skill you'd like to learn from them!`,
      data: {
        actionUrl: `/my-swaps`,
        sessionId: session._id,
        metadata: {
          skillOffered: offeredSkills,
          skillWanted: skillWanted || null,
          sessionId: session._id,
          requiresResponse: true
        }
      },
      isActionRequired: true,
      priority: 'normal',
      channels: ['in-app', 'email']
    });

    await notification.save();

    // Send email notification (optional)
    try {
      await emailService.sendSwapRequestEmail(recipient.email, {
        requesterName: `${requester.firstName} ${requester.lastName}`,
        skillOffered: skillsText,
        skillWanted: skillWanted || 'Open to discussion',
        message: sessionData.message,
        actionUrl: `${process.env.CLIENT_BASE_URL}/my-swaps`
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Swap request sent successfully',
      data: {
        sessionId: session._id,
        notificationId: notification._id
      }
    });

  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating swap request'
    });
  }
});

// @route   PUT /api/sessions/:id/respond
// @desc    Respond to session request (accept/decline)
// @access  Private
router.put('/:id/respond', [
  auth,
  body('response').isIn(['accepted', 'declined']).withMessage('Response must be either accepted or declined'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { response, message } = req.body;
    const sessionId = req.params.id;
    const userId = req.user.id;

    const session = await Session.findById(sessionId)
      .populate('mentor', 'firstName lastName avatar title email')
      .populate('student', 'firstName lastName avatar title email')
      .populate('skill', 'name category');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is the mentor for this session
    if (session.mentor._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentor can respond to this session'
      });
    }

    // Check if session is still pending
    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This session has already been responded to'
      });
    }

    // Update session
    session.status = response;
    if (message) {
      session.mentorMessage = message;
    }
    session.respondedAt = new Date();

    await session.save();

    // Send email notification to student
    try {
      await emailService.sendSessionResponseEmail(session);
    } catch (emailError) {
      console.error('Failed to send session response email:', emailError);
    }

    res.json({
      success: true,
      message: `Session ${response} successfully`,
      session
    });

  } catch (error) {
    console.error('Session response error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while responding to session'
    });
  }
});

// @route   PUT /api/sessions/:id/complete
// @desc    Mark session as completed
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    const session = await Session.findById(sessionId)
      .populate('mentor', 'firstName lastName avatar title')
      .populate('student', 'firstName lastName avatar title')
      .populate('skill', 'name category');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.mentor._id.toString() !== userId && session.student._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if session is accepted
    if (session.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only accepted sessions can be marked as completed'
      });
    }

    // Update session
    session.status = 'completed';
    session.completedAt = new Date();

    await session.save();

    // Update user stats
    try {
      await session.mentor.updateStats();
      await session.student.updateStats();
    } catch (statsError) {
      console.error('Failed to update user stats:', statsError);
    }

    res.json({
      success: true,
      message: 'Session marked as completed',
      session
    });

  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing session'
    });
  }
});

// @route   PUT /api/sessions/:id/cancel
// @desc    Cancel a session
// @access  Private
router.put('/:id/cancel', [
  auth,
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const { reason } = req.body;
    const sessionId = req.params.id;
    const userId = req.user.id;

    const session = await Session.findById(sessionId)
      .populate('mentor', 'firstName lastName avatar title email')
      .populate('student', 'firstName lastName avatar title email')
      .populate('skill', 'name category');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.mentor._id.toString() !== userId && session.student._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if session can be cancelled
    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This session cannot be cancelled'
      });
    }

    // Update session
    session.status = 'cancelled';
    session.cancelledBy = userId;
    session.cancellationReason = reason;
    session.cancelledAt = new Date();

    await session.save();

    // Send email notification to the other party
    try {
      await emailService.sendSessionCancellationEmail(session);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      session
    });

  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling session'
    });
  }
});

module.exports = router;
