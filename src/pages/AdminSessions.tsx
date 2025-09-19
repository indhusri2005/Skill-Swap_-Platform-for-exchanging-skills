import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Users, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import apiService from '../services/api';

interface Session {
  _id: string;
  mentor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  student: {
    firstName: string;
    lastName: string;
    email: string;
  };
  skillName: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledAt: string;
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalSessions: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminSessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSessions();
  }, [pagination.currentPage, statusFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '20',
        status: statusFilter
      });

      const response = await apiService.get(`/admin/sessions?${params}`);
      
      if (response.success) {
        setSessions(response.data?.sessions || []);
        setPagination(response.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalSessions: 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        console.error('Failed to fetch sessions:', response);
        setError('Failed to fetch sessions');
      }
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      setError(error.response?.data?.message || 'Error fetching sessions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Session Management</h1>
        <p className="text-muted-foreground">Monitor and manage all platform sessions</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sessions ({pagination.totalSessions})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const StatusIcon = getStatusIcon(session.status);
                return (
                  <div key={session._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {session.mentor.firstName} {session.mentor.lastName} → {session.student.firstName} {session.student.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Skill: {session.skillName} • Duration: {session.duration} min
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                            {session.scheduledAt && (
                              <span>Scheduled: {new Date(session.scheduledAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(session.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {session.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sessions.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sessions found</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.currentPage - 1) * 20 + 1} to {Math.min(pagination.currentPage * 20, pagination.totalSessions)} of {pagination.totalSessions} sessions
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSessions;
