import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private callbacks: { [event: string]: Function[] } = {};

  connect(token?: string) {
    if (this.socket) {
      return;
    }

    this.socket = io('http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Set up event listeners for registered callbacks
    Object.keys(this.callbacks).forEach(event => {
      this.callbacks[event].forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: Function) {
    if (callback) {
      const callbacks = this.callbacks[event] || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      delete this.callbacks[event];
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  // Specific methods for common events
  onNewMessage(callback: (message: any) => void) {
    this.on('newMessage', callback);
  }

  onNewNotification(callback: (notification: any) => void) {
    this.on('newNotification', callback);
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.on('userTyping', callback);
  }

  onUserOnline(callback: (userId: string) => void) {
    this.on('userOnline', callback);
  }

  onUserOffline(callback: (userId: string) => void) {
    this.on('userOffline', callback);
  }

  // Emit methods
  sendMessage(data: { recipientId: string; content: string; type?: string; sessionId?: string }) {
    this.emit('send_message', data);
  }

  setTyping(data: { recipientId: string; isTyping: boolean }) {
    this.emit('typing', data);
  }

  joinRoom(roomId: string) {
    this.emit('joinRoom', roomId);
  }

  leaveRoom(roomId: string) {
    this.emit('leaveRoom', roomId);
  }

  // Enhanced chat methods
  markMessageAsRead(messageId: string) {
    this.emit('mark_message_read', messageId);
  }

  joinConversation(userId: string) {
    this.emit('join_conversation', userId);
  }

  leaveConversation(userId: string) {
    this.emit('leave_conversation', userId);
  }

  // Video call methods
  shareMeetingLink(data: {
    recipientId: string;
    meetingLink: string;
    sessionId?: string;
    scheduledTime?: string;
  }) {
    this.emit('share_meeting_link', data);
  }

  onMeetingLinkShared(callback: (data: any) => void) {
    this.on('meeting_link_shared', callback);
  }

  // Session reschedule methods
  requestReschedule(data: {
    sessionId: string;
    newDate: string;
    reason: string;
    recipientId: string;
  }) {
    this.emit('request_reschedule', data);
  }

  onSessionRescheduleRequest(callback: (data: any) => void) {
    this.on('session_reschedule_request', callback);
  }

  onSessionUpdate(callback: (data: any) => void) {
    this.on('session_update', callback);
  }

  // Enhanced event listeners
  onMessageRead(callback: (data: { messageId: string; readBy: string }) => void) {
    this.on('message_read', callback);
  }

  onTypingUpdate(callback: (data: { userId: string; isTyping: boolean; conversationId: string }) => void) {
    this.on('typing_update', callback);
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
