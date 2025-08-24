const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    let filter = { recipient: userId };
    
    // Filter for unread notifications only
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unread count'
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sender', 'firstName lastName avatar');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification'
    });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification (usually for system notifications)
// @access  Private
router.post('/', [
  auth,
  body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
  body('type').isIn([
    'session_request', 
    'session_accepted', 
    'session_declined', 
    'session_cancelled',
    'session_reminder',
    'new_review',
    'message_received',
    'skill_match',
    'system_announcement'
  ]).withMessage('Invalid notification type'),
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('message').isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters'),
  body('relatedId').optional().isMongoId().withMessage('Related ID must be valid if provided')
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

    const { recipientId, type, title, message, relatedId, actionUrl } = req.body;
    const senderId = req.user.id;

    // Create new notification
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      relatedId,
      actionUrl,
      isRead: false
    });

    await notification.save();

    // Populate the notification for response
    await notification.populate('sender', 'firstName lastName avatar');

    // TODO: Send real-time notification via socket.io
    // const io = req.app.get('io');
    // io.to(recipientId).emit('newNotification', notification);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notification'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark as read
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification'
    });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { 
        $set: { 
          isRead: true, 
          readAt: new Date() 
        } 
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notifications'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification'
    });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Delete all read notifications for current user
// @access  Private
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeUnread = false } = req.query;

    let filter = { recipient: userId };
    
    // Only delete read notifications by default
    if (includeUnread !== 'true') {
      filter.isRead = true;
    }

    const result = await Notification.deleteMany(filter);

    res.json({
      success: true,
      message: `${result.deletedCount} notifications cleared successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing notifications'
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics for current user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Notification.aggregate([
      { $match: { recipient: require('mongoose').Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      }
    ]);

    const totalNotifications = await Notification.countDocuments({ recipient: userId });
    const totalUnread = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.json({
      success: true,
      stats: {
        total: totalNotifications,
        unread: totalUnread,
        byType: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            unread: stat.unreadCount
          };
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification statistics'
    });
  }
});

// Helper function to create notifications (can be used by other routes)
const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    await notification.populate('sender', 'firstName lastName avatar');
    
    // TODO: Send real-time notification via socket.io
    // const io = require('../server').io;
    // io.to(data.recipient.toString()).emit('newNotification', notification);
    
    return notification;
  } catch (error) {
    console.error('Create notification helper error:', error);
    throw error;
  }
};

// Export helper function for use in other route files
router.createNotification = createNotification;

module.exports = router;
