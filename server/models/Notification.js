const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'session_request',
      'session_confirmed',
      'session_reminder',
      'session_cancelled',
      'session_rescheduled',
      'session_completed',
      'new_message',
      'new_review',
      'review_response',
      'skill_match',
      'achievement_earned',
      'system_announcement',
      'payment_received',
      'payment_reminder',
      'request',
      'swap_request'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  message: {
    type: String,
    required: true,
    maxLength: 500
  },
  data: {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    skillName: String,
    achievementName: String,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isActionRequired: {
    type: Boolean,
    default: false
  },
  actionTaken: {
    type: Boolean,
    default: false
  },
  actionTakenAt: Date,
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // TTL index for auto-cleanup
  },
  deliveryStatus: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date
    },
    inApp: {
      delivered: { type: Boolean, default: true },
      deliveredAt: { type: Date, default: Date.now }
    }
  },
  channels: [{
    type: String,
    enum: ['email', 'push', 'in-app', 'sms'],
    default: ['in-app']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since notification was created
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark action as taken
notificationSchema.methods.markActionTaken = function() {
  this.actionTaken = true;
  this.actionTakenAt = new Date();
  return this.save();
};

// Static method to create and send notification
notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  
  // Set expiration date if not provided (default: 30 days)
  if (!notification.expiresAt) {
    notification.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  await notification.save();
  
  // Emit real-time notification via Socket.IO
  const { io } = require('../server');
  if (io) {
    io.to(`user_${notification.recipient}`).emit('notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data,
      createdAt: notification.createdAt
    });
  }
  
  // Queue email/push notifications based on user preferences
  await notification.queueExternalNotifications();
  
  return notification;
};

// Method to queue external notifications (email, push)
notificationSchema.methods.queueExternalNotifications = async function() {
  const User = mongoose.model('User');
  const recipient = await User.findById(this.recipient);
  
  if (!recipient) return;
  
  const emailService = require('../services/emailService');
  const pushService = require('../services/pushService');
  
  // Send email notification if enabled
  if (this.channels.includes('email') && recipient.notificationSettings?.email) {
    const emailEnabled = this.getEmailPreference(recipient.notificationSettings.email);
    if (emailEnabled) {
      try {
        await emailService.sendNotificationEmail(recipient, this);
        this.deliveryStatus.email.sent = true;
        this.deliveryStatus.email.sentAt = new Date();
        await this.save();
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  }
  
  // Send push notification if enabled
  if (this.channels.includes('push') && recipient.notificationSettings?.push) {
    const pushEnabled = this.getPushPreference(recipient.notificationSettings.push);
    if (pushEnabled) {
      try {
        await pushService.sendPushNotification(recipient, this);
        this.deliveryStatus.push.sent = true;
        this.deliveryStatus.push.sentAt = new Date();
        await this.save();
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }
  }
};

// Helper method to check email preference for notification type
notificationSchema.methods.getEmailPreference = function(emailSettings) {
  const typeMap = {
    'session_request': emailSettings.sessionRequest,
    'session_confirmed': emailSettings.sessionReminder,
    'session_reminder': emailSettings.sessionReminder,
    'new_message': emailSettings.newMessage,
    'new_review': emailSettings.newReview
  };
  
  return typeMap[this.type] !== undefined ? typeMap[this.type] : true;
};

// Helper method to check push preference for notification type
notificationSchema.methods.getPushPreference = function(pushSettings) {
  const typeMap = {
    'session_request': pushSettings.sessionRequest,
    'session_confirmed': pushSettings.sessionReminder,
    'session_reminder': pushSettings.sessionReminder,
    'new_message': pushSettings.newMessage,
    'new_review': pushSettings.newReview
  };
  
  return typeMap[this.type] !== undefined ? typeMap[this.type] : true;
};

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: 1, expiresAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
