import React, { useState, useEffect } from 'react';
import { Users, BookOpen, MessageSquare, TrendingUp, Award, Settings, UserCheck, UserX, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAdminRealTime } from '../contexts/SocketContext';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  completedSessions: number;
  totalReviews: number;
  sessionSuccessRate: number;
}

interface RecentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isVerified: boolean;
}

interface RecentSession {
  _id: string;
  mentor: {
    firstName: string;
    lastName: string;
  };
  student: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: {
    recentUsers: RecentUser[];
    recentSessions: RecentSession[];
  };
  analytics: {
    userGrowth: Array<{
      _id: { year: number; month: number };
      count: number;
    }>;
  };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats: realTimeStats, isConnected } = useAdminRealTime();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update dashboard data with real-time stats
  useEffect(() => {
    if (realTimeStats && data) {
      setData(prev => ({
        ...prev!,
        stats: {
          ...prev!.stats,
          ...realTimeStats
        }
      }));
    }
  }, [realTimeStats]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching admin dashboard data...');
      console.log('👤 Current user:', user);
      console.log('🛡️ User role:', user?.role);
      
      const response = await apiService.get('/admin/dashboard');
      console.log('📊 Dashboard response:', response);
      
      if (response.success) {
        // Handle nested data structure from API
        const apiData = response.data.data || response.data;
        console.log('📊 Processed dashboard data:', apiData);
        setData(apiData);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (error: any) {
      console.error('❌ Dashboard fetch error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 403) {
        setError('Access denied - Admin privileges required');
      } else if (error.response?.status === 401) {
        setError('Authentication failed - Please login again');
      } else {
        setError(error.response?.data?.message || error.message || 'Error fetching dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Default data structure to prevent crashes
  const defaultData = {
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      totalSessions: 0,
      completedSessions: 0,
      totalReviews: 0,
      sessionSuccessRate: 0
    },
    recentActivity: {
      recentUsers: [],
      recentSessions: []
    },
    analytics: {
      userGrowth: []
    }
  };

  // Use actual data if available, otherwise use defaults
  const dashboardData = data || defaultData;
  const stats = dashboardData.stats || defaultData.stats;
  const recentActivity = dashboardData.recentActivity || defaultData.recentActivity;
  const analytics = dashboardData.analytics || defaultData.analytics;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: `${stats.activeUsers} active users`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Sessions', 
      value: stats.totalSessions.toLocaleString(),
      description: `${stats.sessionSuccessRate}% completion rate`,
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      title: 'Reviews',
      value: stats.totalReviews.toLocaleString(),
      description: 'Platform feedback',
      icon: Award,
      color: 'text-yellow-600'
    },
    {
      title: 'Success Rate',
      value: `${stats.sessionSuccessRate}%`,
      description: 'Completed sessions',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? "Live" : "Offline"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}! 
            {isConnected && <span className="text-green-600 ml-2">• Real-time updates active</span>}
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Recent Users</TabsTrigger>
          <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Registered Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.isVerified ? (
                        <Badge variant="secondary" className="text-green-600">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">
                          <UserX className="w-3 h-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {recentActivity.recentUsers.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No recent users</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.recentSessions.map((session) => (
                  <div key={session._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {session.mentor.firstName} {session.mentor.lastName} → {session.student.firstName} {session.student.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Session
                    </Badge>
                  </div>
                ))}
                {recentActivity.recentSessions.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No recent sessions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.userGrowth.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {item.count} new users
                    </Badge>
                  </div>
                ))}
                {analytics.userGrowth.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No growth data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Broadcast
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Reports
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
