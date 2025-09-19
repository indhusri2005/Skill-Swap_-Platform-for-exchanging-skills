import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import socketService from '@/services/socket';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  title?: string;
  bio?: string;
  location?: string;
  isVerified: boolean;
  role?: 'user' | 'admin' | 'super_admin';
  skillsOffered: Array<{
    name: string;
    level: string;
    category: string;
    experience?: string;
    rating: number;
    sessionCount: number;
  }>;
  skillsWanted: Array<{
    name: string;
    level: string;
    category: string;
    priority: string;
    progress: number;
  }>;
  stats: {
    totalSessions: number;
    hoursLearned: number;
    hoursTaught: number;
    averageRating: number;
    totalReviews: number;
  };
  availability?: {
    days: string[];
    times: string[];
    timezone: string;
  };
  sessionTypes?: string[];
  preferredSessionDuration?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        setLoading(false);
        return;
      }

      apiService.setToken(token);
      
      // If we have stored user data, use it immediately
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // Then refresh user data from server
      const response = await apiService.getCurrentUser();
      
      if (response.success && response.data) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        // Invalid token, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        apiService.setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      apiService.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ email, password });

      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        apiService.setToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        socketService.connect(token);

        // Trigger mentor data refresh by dispatching a custom event
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { user: userData, timestamp: Date.now() }
        }));

        // Check if user is admin and redirect to admin panel
        if (userData.role && ['admin', 'super_admin'].includes(userData.role)) {
          // Redirect to admin dashboard after a short delay
          setTimeout(() => {
            window.location.href = '/admin/dashboard';
          }, 1500);
          
          toast({
            title: "Welcome back, Admin!",
            description: `Redirecting to admin panel...`,
          });
        } else {
          toast({
            title: "Welcome back!",
            description: `Good to see you again, ${userData.firstName}!`,
          });
        }

        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: response.error || "Invalid email or password",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Something went wrong. Please try again.",
      });
      return false;
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    try {
      const response = await apiService.register(userData);

      if (response.success && response.data) {
        const { token, user: newUser } = response.data;
        
        apiService.setToken(token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        socketService.connect(token);

        // Trigger mentor data refresh for new registrations
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { user: newUser, timestamp: Date.now(), action: 'register' }
        }));

        toast({
          title: "Welcome to SkillSwap!",
          description: "Your account has been created successfully. Please check your email to verify your account.",
        });

        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: response.error || "Failed to create account",
        });
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "Something went wrong. Please try again.",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.setToken(null);
    socketService.disconnect();
    setUser(null);
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await apiService.updateProfile(userData);

      if (response.success && response.data) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });

        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: response.error || "Failed to update profile",
        });
        return false;
      }
    } catch (error) {
      console.error('Update user error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Something went wrong. Please try again.",
      });
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      
      if (response.success && response.data) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
