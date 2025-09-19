import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, UserCheck, UserX, Shield, Trash2, Edit, Eye, ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription } from '../components/ui/alert';
import apiService from '../services/api';
import { useAdminRealTime } from '../contexts/SocketContext';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  isVerified: boolean;
  lastActive: string;
  createdAt: string;
  permissions?: string[];
  adminNotes?: string;
  stats: {
    totalSessions: number;
    averageRating: number;
  };
  skillsOffered: Array<{
    name: string;
    category: string;
  }>;
}

interface UserDetail extends User {
  sessions: any[];
  reviews: any[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminUserManagement: React.FC = () => {
  const { users: realTimeUsers, isConnected } = useAdminRealTime();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Edit modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    role: '',
    isActive: false,
    isVerified: false,
    permissions: [] as string[],
    adminNotes: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, searchTerm, statusFilter, roleFilter]);

  // Update users list with real-time changes
  useEffect(() => {
    if (realTimeUsers && realTimeUsers.length > 0) {
      setUsers(prev => {
        const updated = [...prev];
        realTimeUsers.forEach(realTimeUser => {
          const index = updated.findIndex(u => u._id === realTimeUser.id);
          if (index >= 0) {
            // Update existing user
            updated[index] = { ...updated[index], ...realTimeUser };
          } else {
            // Add new user (if it matches current filters)
            updated.unshift(realTimeUser as User);
          }
        });
        return updated;
      });
    }
  }, [realTimeUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter,
        role: roleFilter
      });

      const response = await apiService.get(`/admin/users?${params}`);
      
      if (response.success) {
        const data = response.data as any;
        setUsers(data?.users || []);
        setPagination(data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        console.error('Failed to fetch users:', response);
        setError('Failed to fetch users');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await apiService.get(`/admin/users/${userId}`);
      if (response.success) {
        const data = response.data as any;
        setSelectedUser(data?.user || null);
      } else {
        console.error('Failed to fetch user details:', response);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error fetching user details');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await apiService.put(`/admin/users/${selectedUser._id}`, editForm);
      if (response.success) {
        setEditDialogOpen(false);
        fetchUsers();
        fetchUserDetails(selectedUser._id);
        setError(null);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error updating user');
    }
  };

  const openEditDialog = (user: User) => {
    setEditForm({
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      permissions: user.permissions || [],
      adminNotes: user.adminNotes || ''
    });
    setEditDialogOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (!isVerified) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Live" : "Offline"}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage platform users, roles, and permissions
          {isConnected && <span className="text-green-600 ml-2">• Live updates enabled</span>}
        </p>
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({pagination.totalUsers})
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
              {users.map((user) => (
                <div key={user._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(user.isActive, user.isVerified)}>
                            {getStatusText(user.isActive, user.isVerified)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        <p className="font-medium">{user.stats.totalSessions} sessions</p>
                        <p className="text-muted-foreground">
                          {user.stats.averageRating > 0 ? `${user.stats.averageRating}⭐` : 'No rating'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => fetchUserDetails(user._id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {users.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.currentPage - 1) * 20 + 1} to {Math.min(pagination.currentPage * 20, pagination.totalUsers)} of {pagination.totalUsers} users
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={editForm.isActive} 
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={editForm.isVerified} 
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isVerified: checked }))}
                />
                <Label>Verified</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                value={editForm.adminNotes}
                onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                placeholder="Internal notes about this user..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {selectedUser.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedUser.isActive, selectedUser.isVerified)}>
                    {getStatusText(selectedUser.isActive, selectedUser.isVerified)}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{selectedUser.stats.totalSessions}</div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">
                      {selectedUser.stats.averageRating > 0 ? selectedUser.stats.averageRating.toFixed(1) : 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{selectedUser.skillsOffered.length}</div>
                    <p className="text-sm text-muted-foreground">Skills Offered</p>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Notes */}
              {selectedUser.adminNotes && (
                <div>
                  <Label>Admin Notes</Label>
                  <div className="p-3 bg-gray-50 rounded border">
                    {selectedUser.adminNotes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
