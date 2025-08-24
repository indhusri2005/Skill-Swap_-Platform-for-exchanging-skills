const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Store active user connections
const activeUsers = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

const socketHandler = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.firstName} (${socket.user._id})`);

    // Add user to active users
    activeUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their personal room for notifications
    socket.join(`user_${socket.user._id}`);

    // Update user's last active time
    socket.user.lastActive = new Date();
    socket.user.save().catch(console.error);

    // Emit user online status to friends/contacts
    socket.broadcast.emit('user_online', {
      userId: socket.user._id,
      firstName: socket.user.firstName,
      lastName: socket.user.lastName,
      avatar: socket.user.getAvatarUrl()
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', (data) => {
      const { otherUserId } = data;
      const conversationId = [socket.user._id.toString(), otherUserId]
        .sort()
        .join('_');
      
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.user._id} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (data) => {
      const { otherUserId } = data;
      const conversationId = [socket.user._id.toString(), otherUserId]
        .sort()
        .join('_');
      
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.user._id} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, content, messageType = 'text', replyTo } = data;

        // Validate recipient
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          socket.emit('message_error', { error: 'Recipient not found' });
          return;
        }

        // Create message
        const message = new Message({
          sender: socket.user._id,
          recipient: recipientId,
          content,
          messageType,
          replyTo: replyTo || null,
          metadata: {
            platform: 'web',
            userAgent: socket.handshake.headers['user-agent']
          }
        });

        await message.save();
        
        // Populate sender info
        await message.populate('sender', 'firstName lastName avatar');
        if (replyTo) {
          await message.populate('replyTo', 'content sender');
        }

        // Create conversation room
        const conversationId = [socket.user._id.toString(), recipientId]
          .sort()
          .join('_');

        // Emit to conversation room
        io.to(`conversation_${conversationId}`).emit('new_message', {
          ...message.toObject(),
          sender: {
            ...message.sender.toObject(),
            avatar: message.sender.getAvatarUrl()
          }
        });

        // Send notification to recipient if they're not in the conversation
        const recipientSocket = activeUsers.get(recipientId);
        if (recipientSocket) {
          io.to(`user_${recipientId}`).emit('message_notification', {
            id: message._id,
            sender: {
              id: socket.user._id,
              firstName: socket.user.firstName,
              lastName: socket.user.lastName,
              avatar: socket.user.getAvatarUrl()
            },
            preview: content.substring(0, 100),
            createdAt: message.createdAt
          });
        }

        // Create notification in database
        await Notification.createNotification({
          recipient: recipientId,
          sender: socket.user._id,
          type: 'new_message',
          title: `New message from ${socket.user.firstName}`,
          message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          data: {
            messageId: message._id,
            conversationId
          },
          channels: ['in-app', 'push']
        });

        socket.emit('message_sent', { messageId: message._id });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle message read receipts
    socket.on('mark_messages_read', async (data) => {
      try {
        const { otherUserId } = data;

        await Message.markConversationAsRead(socket.user._id, otherUserId);

        // Notify the other user that messages were read
        const conversationId = [socket.user._id.toString(), otherUserId]
          .sort()
          .join('_');
        
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          readBy: socket.user._id,
          conversationId
        });

      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { otherUserId } = data;
      const conversationId = [socket.user._id.toString(), otherUserId]
        .sort()
        .join('_');
      
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.user._id,
        firstName: socket.user.firstName,
        conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      const { otherUserId } = data;
      const conversationId = [socket.user._id.toString(), otherUserId]
        .sort()
        .join('_');
      
      socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
        userId: socket.user._id,
        conversationId
      });
    });

    // Handle session-related events
    socket.on('join_session', (sessionId) => {
      socket.join(`session_${sessionId}`);
      console.log(`User ${socket.user._id} joined session ${sessionId}`);
    });

    socket.on('leave_session', (sessionId) => {
      socket.leave(`session_${sessionId}`);
      console.log(`User ${socket.user._id} left session ${sessionId}`);
    });

    // Handle session updates (for real-time session status changes)
    socket.on('session_update', (data) => {
      const { sessionId, status, update } = data;
      socket.to(`session_${sessionId}`).emit('session_updated', {
        sessionId,
        status,
        update,
        updatedBy: socket.user._id
      });
    });

    // Handle notification acknowledgment
    socket.on('notification_read', async (notificationId) => {
      try {
        await Notification.findByIdAndUpdate(notificationId, {
          isRead: true,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Mark notification read error:', error);
      }
    });

    // Handle meeting link sharing
    socket.on('share_meeting_link', async (data) => {
      try {
        const { recipientId, meetingLink, sessionId, scheduledTime } = data;

        // Validate recipient
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          socket.emit('meeting_link_error', { error: 'Recipient not found' });
          return;
        }

        // Create message with meeting link
        const message = new Message({
          sender: socket.user._id,
          recipient: recipientId,
          content: `Meeting Link: ${meetingLink}${scheduledTime ? `\nScheduled for: ${scheduledTime}` : ''}`,
          messageType: 'meeting_link',
          metadata: {
            meetingLink,
            sessionId,
            scheduledTime
          }
        });

        await message.save();
        await message.populate('sender', 'firstName lastName avatar');

        // Create conversation room
        const conversationId = [socket.user._id.toString(), recipientId]
          .sort()
          .join('_');

        // Emit to conversation room
        io.to(`conversation_${conversationId}`).emit('meeting_link_shared', {
          ...message.toObject(),
          sender: {
            ...message.sender.toObject(),
            avatar: message.sender.getAvatarUrl()
          }
        });

        // Notify recipient
        io.to(`user_${recipientId}`).emit('meeting_link_notification', {
          from: socket.user.firstName,
          meetingLink,
          sessionId,
          scheduledTime
        });

        socket.emit('meeting_link_sent', { messageId: message._id });

      } catch (error) {
        console.error('Share meeting link error:', error);
        socket.emit('meeting_link_error', { error: 'Failed to share meeting link' });
      }
    });

    // Handle session reschedule requests
    socket.on('request_reschedule', async (data) => {
      try {
        const { sessionId, newDate, reason, recipientId } = data;
        const Session = require('../models/Session');

        // Validate session
        const session = await Session.findById(sessionId).populate('mentor student');
        if (!session) {
          socket.emit('reschedule_error', { error: 'Session not found' });
          return;
        }

        // Check if user is part of this session
        if (session.mentor._id.toString() !== socket.user._id.toString() && 
            session.student._id.toString() !== socket.user._id.toString()) {
          socket.emit('reschedule_error', { error: 'Unauthorized' });
          return;
        }

        // Create reschedule request notification
        const recipient = session.mentor._id.toString() === socket.user._id.toString() 
          ? session.student 
          : session.mentor;

        await Notification.createNotification({
          recipient: recipient._id,
          sender: socket.user._id,
          type: 'session_rescheduled',
          title: 'Session Reschedule Request',
          message: `${socket.user.firstName} wants to reschedule your session to ${new Date(newDate).toLocaleDateString()}`,
          data: {
            sessionId,
            newDate,
            reason,
            actionUrl: `/sessions/${sessionId}`
          },
          priority: 'high',
          isActionRequired: true,
          channels: ['in-app', 'email']
        });

        // Emit real-time notification
        io.to(`user_${recipient._id}`).emit('session_reschedule_request', {
          sessionId,
          newDate,
          reason,
          requestedBy: {
            id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName
          }
        });

        socket.emit('reschedule_request_sent', { sessionId });

      } catch (error) {
        console.error('Reschedule request error:', error);
        socket.emit('reschedule_error', { error: 'Failed to send reschedule request' });
      }
    });

    // Handle getting online users
    socket.on('get_online_users', () => {
      const onlineUsers = Array.from(activeUsers.values()).map(user => ({
        userId: user.user._id,
        firstName: user.user.firstName,
        lastName: user.user.lastName,
        avatar: user.user.getAvatarUrl(),
        connectedAt: user.connectedAt
      }));

      socket.emit('online_users', onlineUsers);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.firstName} (${reason})`);

      // Remove from active users
      activeUsers.delete(socket.user._id.toString());

      // Update last active time
      socket.user.lastActive = new Date();
      socket.user.save().catch(console.error);

      // Notify others that user went offline
      socket.broadcast.emit('user_offline', {
        userId: socket.user._id,
        lastActive: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Utility functions for external use
  io.sendToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  io.sendToSession = (sessionId, event, data) => {
    io.to(`session_${sessionId}`).emit(event, data);
  };

  io.sendToConversation = (userId1, userId2, event, data) => {
    const conversationId = [userId1.toString(), userId2.toString()]
      .sort()
      .join('_');
    io.to(`conversation_${conversationId}`).emit(event, data);
  };

  io.getActiveUsers = () => {
    return Array.from(activeUsers.values());
  };

  io.isUserOnline = (userId) => {
    return activeUsers.has(userId.toString());
  };

  return io;
};

module.exports = socketHandler;
