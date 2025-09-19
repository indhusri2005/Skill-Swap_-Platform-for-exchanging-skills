import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, Award, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import apiService from '../services/api';

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
  };
  sessionStats: Array<{
    _id: string;
    count: number;
  }>;
  skillsStats: Array<{
    _id: {
      skill: string;
      category: string;
    };
    count: number;
    avgRating: number;
  }>;
  monthlyRegistrations: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
  }>;
}

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState('user_activity');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get('/admin/analytics');
      
      if (response.success) {
        setAnalyticsData(response.data || null);
      } else {
        console.error('Failed to fetch analytics:', response);
        setError('Failed to fetch analytics data');
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error.response?.data?.message || 'Error fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await apiService.get(`/admin/reports?type=${reportType}`);
      
      if (response.success) {
        // Convert data to downloadable format
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError('Failed to generate report');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      setError('Error generating report');
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
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
  const defaultAnalyticsData: AnalyticsData = {
    userStats: {
      totalUsers: 0,
      verifiedUsers: 0,
      activeUsers: 0
    },
    sessionStats: [],
    skillsStats: [],
    monthlyRegistrations: []
  };

  // Use actual data if available, otherwise use defaults
  const safeAnalyticsData = analyticsData || defaultAnalyticsData;
  const userStats = safeAnalyticsData.userStats || defaultAnalyticsData.userStats;
  const sessionStats = safeAnalyticsData.sessionStats || defaultAnalyticsData.sessionStats;
  const skillsStats = safeAnalyticsData.skillsStats || defaultAnalyticsData.skillsStats;
  const monthlyRegistrations = safeAnalyticsData.monthlyRegistrations || defaultAnalyticsData.monthlyRegistrations;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">Detailed platform analytics and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user_activity">User Activity</SelectItem>
              <SelectItem value="session_analytics">Session Analytics</SelectItem>
              <SelectItem value="skill_popularity">Skill Popularity</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.totalUsers > 0 
                ? Math.round((userStats.verifiedUsers / userStats.totalUsers) * 100)
                : 0}% verification rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.totalUsers > 0 
                ? Math.round((userStats.activeUsers / userStats.totalUsers) * 100)
                : 0}% of total users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Session Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {sessionStats.map((stat, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stat.count}</div>
                <p className="text-sm text-muted-foreground capitalize">{stat._id} Sessions</p>
              </div>
            ))}
          </div>
          {sessionStats.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No session data available</p>
          )}
        </CardContent>
      </Card>

      {/* Popular Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skillsStats.slice(0, 10).map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{skill._id.skill}</p>
                  <p className="text-sm text-muted-foreground">{skill._id.category}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">{skill.count} mentors</Badge>
                  {skill.avgRating > 0 && (
                    <div className="text-sm">
                      {skill.avgRating.toFixed(1)}⭐
                    </div>
                  )}
                </div>
              </div>
            ))}
            {skillsStats.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No skills data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly User Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly User Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyRegistrations.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {getMonthName(month._id.month)} {month._id.year}
                  </p>
                </div>
                <Badge variant="outline" className="text-blue-600">
                  {month.count} new users
                </Badge>
              </div>
            ))}
            {monthlyRegistrations.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No registration data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
