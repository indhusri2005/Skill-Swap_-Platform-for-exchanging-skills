const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get user's conversations (list of people they've messaged)
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Get unique conversations for the user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { recipient: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await User.findById(conv._id).select('firstName lastName avatar title lastActive');
        return {
          user: otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({
      success: true,
      conversations: populatedConversations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(conversations.length / limit)
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
});

// @route   GET /api/messages/:userId
// @desc    Get messages between current user and another user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    const { page = 1, limit = 50 } = req.query;

    // Validate other user exists
    const otherUser = await User.findById(otherUserId).select('firstName lastName avatar');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'firstName lastName avatar')
    .populate('recipient', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    });

    // Mark messages from other user as read
    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: currentUserId,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      otherUser,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
});

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', [
  auth,
  body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message content must be between 1 and 1000 characters'),
  body('type').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type')
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

    const { recipientId, content, type = 'text', sessionId } = req.body;
    const senderId = req.user.id;

    // Check if trying to message themselves
    if (recipientId === senderId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a message to yourself'
      });
    }

    // Validate recipient exists
    const recipient = await User.findById(recipientId).select('firstName lastName avatar');
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
      type,
      sessionId,
      read: false
    });

    await message.save();

    // Populate the message for response
    await message.populate('sender', 'firstName lastName avatar');
    await message.populate('recipient', 'firstName lastName avatar');

    // TODO: Send real-time message via socket.io
    // const io = req.app.get('io');
    // io.to(recipientId).emit('newMessage', message);

    // TODO: Create notification for recipient
    // const notificationService = require('./notifications');
    // await notificationService.createNotification({
    //   recipient: recipientId,
    //   sender: senderId,
    //   type: 'message_received',
    //   title: 'New Message',
    //   message: `${req.user.firstName} sent you a message`,
    //   relatedId: message._id
    // });

    res.status(201).json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark a message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the recipient
    if (message.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark messages addressed to you as read'
      });
    }

    // Mark as read
    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating message'
    });
  }
});

// @route   PUT /api/messages/conversation/:userId/read-all
// @desc    Mark all messages in a conversation as read
// @access  Private
router.put('/conversation/:userId/read-all', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: currentUserId,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'All messages in conversation marked as read'
    });

  } catch (error) {
    console.error('Mark conversation read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating messages'
    });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message (soft delete - only for sender)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete messages you sent'
      });
    }

    // Check if message is not too old (e.g., within 1 hour)
    const hoursSinceMessage = (new Date() - message.createdAt) / (1000 * 60 * 60);
    if (hoursSinceMessage > 1) {
      return res.status(400).json({
        success: false,
        message: 'Messages can only be deleted within 1 hour of sending'
      });
    }

    // Soft delete - mark as deleted instead of actually removing
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get count of unread messages for current user
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      recipient: userId,
      read: false,
      deleted: { $ne: true }
    });

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Get unread messages count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unread count'
    });
  }
});

// @route   POST /api/messages/search
// @desc    Search messages by content
// @access  Private
router.post('/search', [
  auth,
  body('query').trim().isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
  body('userId').optional().isMongoId().withMessage('User ID must be valid if provided')
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

    const { query, userId } = req.body;
    const currentUserId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    let filter = {
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId }
      ],
      content: { $regex: query, $options: 'i' },
      deleted: { $ne: true }
    };

    // If userId is provided, search only in that conversation
    if (userId) {
      filter.$or = [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ];
    }

    const messages = await Message.find(filter)
      .populate('sender', 'firstName lastName avatar')
      .populate('recipient', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(filter);

    res.json({
      success: true,
      messages,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching messages'
    });
  }
});

module.exports = router;
