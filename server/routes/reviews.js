const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get reviews (for a user or all reviews by current user)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;
    const currentUserId = req.user.id;

    let filter = {};
    
    if (userId) {
      // Get reviews for a specific user (as reviewee)
      filter.reviewee = userId;
    } else {
      // Get reviews written by current user
      filter.reviewer = currentUserId;
    }

    const reviews = await Review.find(filter)
      .populate('reviewer', 'firstName lastName avatar')
      .populate('reviewee', 'firstName lastName avatar')
      .populate('session', 'sessionType duration')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(filter);

    // Calculate average rating if getting reviews for a specific user
    let averageRating = null;
    if (userId) {
      const ratingStats = await Review.aggregate([
        { $match: { reviewee: require('mongoose').Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      if (ratingStats.length > 0) {
        averageRating = Math.round(ratingStats[0].averageRating * 10) / 10;
      }
    }

    res.json({
      success: true,
      reviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      ...(averageRating !== null && { averageRating, totalReviews: total })
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'firstName lastName avatar')
      .populate('reviewee', 'firstName lastName avatar')
      .populate('session', 'sessionType duration skill')
      .populate('session.skill', 'name category');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      review
    });

  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching review'
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', [
  auth,
  body('sessionId').isMongoId().withMessage('Valid session ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
  body('skillRating').optional().isInt({ min: 1, max: 5 }).withMessage('Skill rating must be between 1 and 5'),
  body('communicationRating').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('punctualityRating').optional().isInt({ min: 1, max: 5 }).withMessage('Punctuality rating must be between 1 and 5')
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

    const { 
      sessionId, 
      rating, 
      comment, 
      skillRating, 
      communicationRating, 
      punctualityRating 
    } = req.body;
    const reviewerId = req.user.id;

    // Get the session and validate
    const session = await Session.findById(sessionId)
      .populate('mentor', 'firstName lastName')
      .populate('student', 'firstName lastName')
      .populate('skill', 'name category');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed sessions'
      });
    }

    // Determine who is being reviewed
    let revieweeId;
    if (session.mentor._id.toString() === reviewerId) {
      revieweeId = session.student._id.toString();
    } else if (session.student._id.toString() === reviewerId) {
      revieweeId = session.mentor._id.toString();
    } else {
      return res.status(403).json({
        success: false,
        message: 'You can only review sessions you participated in'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      session: sessionId,
      reviewer: reviewerId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this session'
      });
    }

    // Create new review
    const review = new Review({
      session: sessionId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      skill: {
        name: session.skill?.name || 'General',
        category: session.skill?.category || 'Other'
      },
      rating,
      comment,
      skillRating,
      communicationRating,
      punctualityRating
    });

    await review.save();

    // Populate the review for response
    await review.populate('reviewer', 'firstName lastName avatar');
    await review.populate('reviewee', 'firstName lastName avatar');
    await review.populate('session', 'sessionType duration');

    // Create notification for the reviewee
    try {
      const reviewer = await User.findById(reviewerId);
      const notification = new Notification({
        userId: revieweeId,
        type: 'review',
        title: 'New Review Received',
        message: `${reviewer.firstName} ${reviewer.lastName} has left you a ${rating}-star review for your ${session.skill?.name || 'session'}.`,
        data: {
          reviewId: review._id,
          sessionId: sessionId,
          rating: rating,
          reviewerName: `${reviewer.firstName} ${reviewer.lastName}`
        },
        priority: 'normal'
      });
      await notification.save();
      console.log('✅ Review notification created for user:', revieweeId);
    } catch (notificationError) {
      console.error('❌ Failed to create review notification:', notificationError);
    }

    // Update reviewee's stats
    try {
      const reviewee = await User.findById(revieweeId);
      await reviewee.updateStats();
    } catch (statsError) {
      console.error('Failed to update user stats:', statsError);
    }

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating review'
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', [
  auth,
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
  body('skillRating').optional().isInt({ min: 1, max: 5 }).withMessage('Skill rating must be between 1 and 5'),
  body('communicationRating').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('punctualityRating').optional().isInt({ min: 1, max: 5 }).withMessage('Punctuality rating must be between 1 and 5')
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

    const reviewId = req.params.id;
    const userId = req.user.id;
    const updateData = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the reviewer
    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }

    // Check if review is not too old (e.g., within 7 days)
    const daysSinceReview = (new Date() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceReview > 7) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be edited within 7 days of creation'
      });
    }

    // Update the review
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        review[key] = updateData[key];
      }
    });

    review.updatedAt = new Date();
    await review.save();

    // Populate the review for response
    await review.populate('reviewer', 'firstName lastName avatar');
    await review.populate('reviewee', 'firstName lastName avatar');
    await review.populate('session', 'sessionType duration');

    // Update reviewee's stats
    try {
      const reviewee = await User.findById(review.reviewee);
      await reviewee.updateStats();
    } catch (statsError) {
      console.error('Failed to update user stats:', statsError);
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating review'
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the reviewer
    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    // Check if review is not too old (e.g., within 24 hours)
    const hoursSinceReview = (new Date() - review.createdAt) / (1000 * 60 * 60);
    if (hoursSinceReview > 24) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be deleted within 24 hours of creation'
      });
    }

    const revieweeId = review.reviewee;
    await Review.findByIdAndDelete(reviewId);

    // Update reviewee's stats
    try {
      const reviewee = await User.findById(revieweeId);
      await reviewee.updateStats();
    } catch (statsError) {
      console.error('Failed to update user stats:', statsError);
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting review'
    });
  }
});

// @route   GET /api/reviews/stats/:userId
// @desc    Get review statistics for a user
// @access  Public
router.get('/stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const stats = await Review.aggregate([
      { $match: { reviewee: require('mongoose').Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          averageSkillRating: { $avg: '$skillRating' },
          averageCommunicationRating: { $avg: '$communicationRating' },
          averagePunctualityRating: { $avg: '$punctualityRating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalReviews: 0,
          averageRating: 0,
          averageSkillRating: 0,
          averageCommunicationRating: 0,
          averagePunctualityRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    const result = stats[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    const finalStats = {
      totalReviews: result.totalReviews,
      averageRating: Math.round(result.averageRating * 10) / 10,
      averageSkillRating: result.averageSkillRating ? Math.round(result.averageSkillRating * 10) / 10 : null,
      averageCommunicationRating: result.averageCommunicationRating ? Math.round(result.averageCommunicationRating * 10) / 10 : null,
      averagePunctualityRating: result.averagePunctualityRating ? Math.round(result.averagePunctualityRating * 10) / 10 : null,
      ratingDistribution: distribution
    };

    res.json({
      success: true,
      stats: finalStats
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching review statistics'
    });
  }
});

module.exports = router;
