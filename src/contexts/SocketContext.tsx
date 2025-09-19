import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  adminUpdates: AdminUpdate[];
}

interface AdminUpdate {
  type: string;
  data: any;
  timestamp: Date;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  adminUpdates: []
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [adminUpdates, setAdminUpdates] = useState<AdminUpdate[]>([]);
  const { user } = useAuth();
  
  // Get token directly from localStorage like the API service does
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const token = getToken();
    console.log('🔍 SocketContext useEffect triggered');
    console.log('👤 User:', user ? `${user.firstName} ${user.lastName}` : 'Not logged in');
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    console.log('🛡️ User role:', user?.role || 'No role');

    if (user && token) {
      // Connect to Socket.IO server
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('🔌 Attempting to connect to Socket.IO server:', apiUrl);
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');
      console.log('👤 User role:', user.role);
      
      const newSocket = io(apiUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('🔗 Connected to Socket.IO server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from Socket.IO server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        console.error('❌ Backend server may not be running on port 5000');
        console.error('❌ Make sure to start: cd server && npm run dev');
        setIsConnected(false);
      });

      // Admin-specific event listeners
      if (user.role && ['admin', 'super_admin'].includes(user.role)) {
        // Listen for admin updates
        newSocket.on('admin_update', (update) => {
          console.log('📊 Admin update received:', update);
          const newUpdate: AdminUpdate = {
            type: update.type,
            data: update.data,
            timestamp: new Date()
          };
          
          setAdminUpdates(prev => [newUpdate, ...prev.slice(0, 99)]); // Keep last 100 updates
        });

        // Listen for dashboard stats updates
        newSocket.on('dashboard_stats', (stats) => {
          console.log('📈 Dashboard stats update:', stats);
          const newUpdate: AdminUpdate = {
            type: 'dashboard_stats',
            data: stats,
            timestamp: new Date()
          };
          
          setAdminUpdates(prev => [newUpdate, ...prev.slice(0, 99)]);
        });

        // Listen for system alerts
        newSocket.on('system_alert', (alert) => {
          console.log('🚨 System alert:', alert);
          const newUpdate: AdminUpdate = {
            type: 'system_alert',
            data: alert,
            timestamp: new Date()
          };
          
          setAdminUpdates(prev => [newUpdate, ...prev.slice(0, 99)]);
        });
      }

      // General user events
      newSocket.on('user_online', (data) => {
        console.log('👤 User online:', data);
      });

      newSocket.on('user_offline', (data) => {
        console.log('👤 User offline:', data);
      });

      // Notification events
      newSocket.on('message_notification', (data) => {
        console.log('💬 Message notification:', data);
      });

      newSocket.on('notification_received', (data) => {
        console.log('🔔 Notification received:', data);
      });

      setSocket(newSocket);

      return () => {
        console.log('🚪 Cleaning up socket connection');
        newSocket.disconnect();
      };
    } else {
      console.log('❌ Socket connection not established - missing user or token');
      if (!user) console.log('❌ User is null/undefined');
      if (!token) console.log('❌ Token is null/undefined');
      if (socket) {
        // User logged out, disconnect socket
        console.log('🚪 User logged out, disconnecting socket');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setAdminUpdates([]);
      }
    }
  }, [user]); // Remove token dependency since we get it directly

  const value: SocketContextType = {
    socket,
    isConnected,
    adminUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook for admin-specific real-time updates
export const useAdminRealTime = () => {
  const { socket, isConnected, adminUpdates } = useSocket();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // Subscribe to specific admin events
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle user events
    const handleUserCreated = (data: any) => {
      console.log('👤➕ User created:', data.data);
      setUsers(prev => [data.data, ...prev]);
    };

    const handleUserUpdated = (data: any) => {
      console.log('👤✏️ User updated:', data.data);
      setUsers(prev => prev.map(user => 
        user.id === data.data.id ? { ...user, ...data.data } : user
      ));
    };

    const handleUserDeleted = (data: any) => {
      console.log('👤❌ User deleted:', data.data);
      setUsers(prev => prev.filter(user => user.id !== data.data.id));
    };

    // Handle session events
    const handleSessionCreated = (data: any) => {
      console.log('📅➕ Session created:', data.data);
      setSessions(prev => [data.data, ...prev]);
    };

    const handleSessionUpdated = (data: any) => {
      console.log('📅✏️ Session updated:', data.data);
      setSessions(prev => prev.map(session => 
        session.id === data.data.id ? { ...session, ...data.data } : session
      ));
    };

    // Handle dashboard stats
    const handleDashboardStats = (data: any) => {
      console.log('📊 Dashboard stats updated:', data);
      setStats(data);
    };

    // Listen for admin updates
    socket.on('admin_update', (update) => {
      switch (update.type) {
        case 'user_created':
          handleUserCreated(update);
          break;
        case 'user_updated':
          handleUserUpdated(update);
          break;
        case 'user_deleted':
          handleUserDeleted(update);
          break;
        case 'session_created':
          handleSessionCreated(update);
          break;
        case 'session_updated':
          handleSessionUpdated(update);
          break;
        case 'dashboard_stats':
          handleDashboardStats(update.data);
          break;
        default:
          console.log('🔄 Unknown admin update type:', update.type);
      }
    });

    return () => {
      socket.off('admin_update');
    };
  }, [socket, isConnected]);

  return {
    stats,
    users,
    sessions,
    adminUpdates,
    isConnected
  };
};
