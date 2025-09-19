const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { auth, requireAdmin, requirePermission, authorize } = require('../middleware/auth');
const realTimeEvents = require('../utils/realTimeEvents');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSessions,
      completedSessions,
      totalReviews,
      recentUsers,
      recentSessions,
      userGrowth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'completed' }),
      Review.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt isVerified'),
      Session.find().sort({ createdAt: -1 }).limit(5).populate('mentor student', 'firstName lastName'),
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    // Calculate success rate
    const sessionSuccessRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalSessions,
          completedSessions,
          totalReviews,
          sessionSuccessRate: parseFloat(sessionSuccessRate)
        },
        recentActivity: {
          recentUsers,
          recentSessions
        },
        analytics: {
          userGrowth: userGrowth.reverse()
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().isIn(['all', 'active', 'inactive', 'verified', 'unverified']),
  query('role').optional().isIn(['all', 'user', 'admin', 'super_admin'])
], requirePermission('manage_users'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const role = req.query.role || 'all';

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      switch (status) {
        case 'active':
          query.isActive = true;
          break;
        case 'inactive':
          query.isActive = false;
          break;
        case 'verified':
          query.isVerified = true;
          break;
        case 'unverified':
          query.isVerified = false;
          break;
      }
    }

    if (role !== 'all') {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -verificationToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get specific user details
// @access  Private (Admin)
router.get('/users/:id', requirePermission('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -verificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's sessions
    const sessions = await Session.find({
      $or: [{ mentor: user._id }, { student: user._id }]
    }).populate('mentor student', 'firstName lastName').limit(10);

    // Get user's reviews
    const reviews = await Review.find({ reviewee: user._id })
      .populate('reviewer', 'firstName lastName')
      .limit(10);

    res.json({
      success: true,
      data: {
        user,
        sessions,
        reviews
      }
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put('/users/:id', [
  body('role').optional().isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be boolean'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('adminNotes').optional().trim().isLength({ max: 1000 }).withMessage('Admin notes too long')
], requirePermission('manage_users'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only super_admin can modify admin users
    if (user.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can modify admin users'
      });
    }

    // Only super_admin can promote to admin
    if (req.body.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can promote users to admin'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['role', 'isActive', 'isVerified', 'permissions', 'adminNotes'];
    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        user[update] = req.body[update];
      }
    });

    await user.save();

    // Emit real-time event for admin
    realTimeEvents.userUpdated(user);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        permissions: user.permissions,
        adminNotes: user.adminNotes
      }
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (super admin only)
// @access  Private (Super Admin)
router.delete('/users/:id', authorize('super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin user'
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    // Emit real-time event for admin
    realTimeEvents.userDeleted(user._id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// @route   GET /api/admin/sessions
// @desc    Get all sessions with pagination
// @access  Private (Admin)
router.get('/sessions', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'scheduled', 'completed', 'cancelled'])
], requirePermission('manage_sessions'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'all';

    const query = status !== 'all' ? { status } : {};

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate('mentor student', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Session.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalSessions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Admin get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private (Admin)
router.get('/analytics', requirePermission('view_analytics'), async (req, res) => {
  try {
    // User analytics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    // Session analytics
    const sessionStats = await Session.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Skills analytics
    const skillsStats = await User.aggregate([
      { $unwind: '$skillsOffered' },
      {
        $group: {
          _id: '$skillsOffered.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Monthly user registration
    const monthlyRegistrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        userStats: userStats[0] || { totalUsers: 0, verifiedUsers: 0, activeUsers: 0 },
        sessionStats,
        skillsStats,
        monthlyRegistrations: monthlyRegistrations.reverse()
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// @route   POST /api/admin/broadcast
// @desc    Send broadcast notification
// @access  Private (Admin)
router.post('/broadcast', [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required (max 100 chars)'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message is required (max 500 chars)'),
  body('type').optional().isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
  body('targetUsers').optional().isArray().withMessage('Target users must be an array')
], requirePermission('manage_content'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, message, type = 'info', targetUsers } = req.body;

    // If targetUsers is specified, send to specific users, otherwise send to all active users
    const recipients = targetUsers && targetUsers.length > 0 
      ? targetUsers 
      : await User.find({ isActive: true }).distinct('_id');

    // Create notifications for all recipients
    const notifications = recipients.map(userId => ({
      user: userId,
      title,
      message,
      type,
      isRead: false,
      createdBy: req.user._id
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Broadcast sent to ${recipients.length} users`,
      recipientCount: recipients.length
    });
  } catch (error) {
    console.error('Admin broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending broadcast'
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Generate platform reports
// @access  Private (Admin)
router.get('/reports', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    let report = {};

    switch (type) {
      case 'user_activity':
        report = await User.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              newUsers: { $sum: 1 },
              verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        break;

      case 'session_analytics':
        report = await Session.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              avgDuration: { $avg: '$duration' }
            }
          }
        ]);
        break;

      case 'skill_popularity':
        report = await User.aggregate([
          { $unwind: '$skillsOffered' },
          {
            $group: {
              _id: {
                skill: '$skillsOffered.name',
                category: '$skillsOffered.category'
              },
              count: { $sum: 1 },
              avgRating: { $avg: '$skillsOffered.rating' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 50 }
        ]);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Use: user_activity, session_analytics, or skill_popularity'
        });
    }

    res.json({
      success: true,
      data: {
        reportType: type,
        generatedAt: new Date(),
        dateRange: { startDate, endDate },
        report
      }
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report'
    });
  }
});

module.exports = router;
