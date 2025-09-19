import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  MessageSquare,
  Award,
  Bell,
  Send
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users
    },
    {
      name: 'Sessions',
      href: '/admin/sessions',
      icon: BookOpen
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3
    },
    {
      name: 'Broadcast',
      href: '/admin/broadcast',
      icon: Send
    }
  ];

  // Check if user has admin role
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-red-600 text-white">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-red-700 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {user.role?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-red-100 text-red-700 border-r-2 border-red-600' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find(item => item.href === location.pathname)?.name || 'Admin Panel'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/')}
            >
              View Site
            </Button>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span>Logged in as</span>
              <span className="font-medium">{user.firstName} {user.lastName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
