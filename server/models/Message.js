const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxLength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'session_invite', 'system'],
    default: 'text'
  },
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  relatedSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  originalContent: String,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  deliveryStatus: {
    sent: { type: Boolean, default: true },
    delivered: { type: Boolean, default: false },
    failed: { type: Boolean, default: false },
    error: String
  },
  metadata: {
    clientMessageId: String, // For message deduplication
    platform: String, // web, mobile, etc.
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since message was sent
messageSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Virtual for conversation ID (consistent ordering of participants)
messageSchema.virtual('conversationId').get(function() {
  const participants = [this.sender.toString(), this.recipient.toString()].sort();
  return participants.join('_');
});

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to edit message content
messageSchema.methods.editContent = function(newContent) {
  if (this.content !== newContent) {
    this.originalContent = this.originalContent || this.content;
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete message
messageSchema.methods.softDelete = function(deletedByUserId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedByUserId;
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji
  });
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to get conversation messages
messageSchema.statics.getConversation = function(userId1, userId2, options = {}) {
  const { page = 1, limit = 50, beforeDate } = options;
  const skip = (page - 1) * limit;
  
  let query = {
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ],
    isDeleted: false
  };
  
  if (beforeDate) {
    query.createdAt = { $lt: new Date(beforeDate) };
  }
  
  return this.find(query)
    .populate('sender', 'firstName lastName avatar')
    .populate('recipient', 'firstName lastName avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get user's recent conversations
messageSchema.statics.getRecentConversations = function(userId, limit = 20) {
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { recipient: userId }],
        isDeleted: false
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userId] },
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
                  { $eq: ['$recipient', userId] },
                  { $eq: ['$isRead', false] }
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
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: 1,
        lastMessage: 1,
        unreadCount: 1,
        otherUser: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1,
          lastActive: 1
        }
      }
    }
  ]);
};

// Static method to mark conversation as read
messageSchema.statics.markConversationAsRead = function(userId1, userId2) {
  return this.updateMany(
    {
      sender: userId2,
      recipient: userId1,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Index for efficient queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ relatedSession: 1, createdAt: -1 });
messageSchema.index({ 'metadata.clientMessageId': 1 });

// Compound index for conversation queries
messageSchema.index({ 
  sender: 1, 
  recipient: 1, 
  createdAt: -1, 
  isDeleted: 1 
});

module.exports = mongoose.model('Message', messageSchema);
