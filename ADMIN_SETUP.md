# SkillSwap Admin System Setup

## Overview
The SkillSwap platform now includes a comprehensive admin system with role-based access control, user management, analytics, and system administration capabilities.

## Features Implemented

### Backend Features
- **Role-based Authentication**: Support for `user`, `admin`, and `super_admin` roles
- **Admin Routes**: Complete set of admin API endpoints
- **User Management**: View, edit, activate/deactivate users
- **Analytics Dashboard**: Platform statistics and user growth tracking
- **Session Management**: Monitor and manage user sessions
- **Broadcast System**: Send notifications to all users or specific groups
- **Security**: Admin-only access with permission-based middleware

### Frontend Features
- **Seamless Admin Access**: Admin users login through regular form and are auto-redirected
- **Admin Dashboard**: Overview of platform statistics and recent activity
- **User Management Interface**: Search, filter, and manage users
- **Admin Navigation**: Clean sidebar navigation with role-based access
- **Integration**: Admin panel access through main application header for admin users

## User Roles and Permissions

### 1. User (Default)
- Standard platform access
- No admin privileges

### 2. Admin
- Access to admin panel
- Manage users (except other admins)
- View analytics
- Send broadcasts
- Manage sessions and content

### 3. Super Admin
- Full system access
- Can promote users to admin
- Can manage other admin users
- Can delete users
- All admin permissions

## Setup Instructions

### 1. Create Initial Admin User

First, create the initial admin user by running the setup script:

```bash
cd server
npm run create-admin
```

This will create a super admin user with these credentials:
- **Email**: `admin@skillswap.com`
- **Password**: `Admin@123`
- **Role**: `super_admin`

⚠️ **Important**: Change these credentials after first login in production!

### 2. Access Admin Panel

**Simple One-Step Process**:
1. Login with admin credentials using the regular login form on the main site
2. Admin users are automatically redirected to the admin dashboard
3. Or click on your profile avatar → "Admin Panel" to access anytime

### 3. Admin Panel Features

#### Dashboard (`/admin/dashboard`)
- Platform overview statistics
- Recent user registrations
- Recent session activity
- User growth analytics
- Quick action buttons

#### User Management (`/admin/users`)
- Search and filter users
- View detailed user profiles
- Edit user roles and permissions
- Activate/deactivate accounts
- Add admin notes
- Pagination support

#### Additional Admin Routes (Available via Navigation)
- **Sessions**: Monitor platform sessions
- **Analytics**: Detailed platform analytics
- **Reviews**: Manage user reviews
- **Messages**: System message management
- **Notifications**: Broadcast system
- **Settings**: System configuration

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with admin credentials
- `GET /api/auth/me` - Get current user (includes role)

### Admin Routes (Require Admin Role)
- `GET /api/admin/dashboard` - Dashboard overview
- `GET /api/admin/users` - List users with filters
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (super admin only)
- `GET /api/admin/sessions` - List sessions
- `GET /api/admin/analytics` - Platform analytics
- `POST /api/admin/broadcast` - Send broadcast notification
- `GET /api/admin/reports` - Generate reports

## Security Features

### Role-Based Access Control
```javascript
// Middleware examples
requireAdmin() // Requires admin or super_admin role
requirePermission('manage_users') // Specific permission check
authorize('super_admin') // Specific role requirement
```

### Protection Layers
1. **Route Protection**: Admin routes require authentication + admin role
2. **Component Protection**: Admin components check user role
3. **API Validation**: Server validates admin permissions on every request
4. **UI Integration**: Admin links only show for authorized users

## Development Notes

### Database Schema Updates
The User model now includes:
```javascript
role: {
  type: String,
  enum: ['user', 'admin', 'super_admin'],
  default: 'user'
},
permissions: [{
  type: String,
  enum: ['manage_users', 'manage_skills', 'manage_sessions', 'view_analytics', 'manage_content', 'system_settings']
}],
adminNotes: {
  type: String,
  maxLength: 1000,
  default: null
}
```

### Frontend Route Structure
```
/admin/login - Admin login form
/admin/
  ├── dashboard - Admin dashboard
  ├── users - User management
  ├── sessions - Session management
  ├── analytics - Analytics & reports
  └── ... (additional admin routes)
```

## Usage Examples

### Creating Additional Admin Users
1. Login as super admin
2. Go to User Management
3. Find the user to promote
4. Click "Edit" 
5. Change role to "admin"
6. Assign appropriate permissions
7. Save changes

### Sending Broadcast Notifications
```javascript
// Via API
POST /api/admin/broadcast
{
  "title": "System Maintenance",
  "message": "Platform will be offline for 30 minutes",
  "type": "warning",
  "targetUsers": ["userId1", "userId2"] // optional, defaults to all active users
}
```

### Generating Reports
```javascript
GET /api/admin/reports?type=user_activity&startDate=2023-01-01&endDate=2023-12-31
```

## Troubleshooting

### Common Issues

1. **Admin Access Not Working**
   - Verify admin user exists: Check database for user with admin role  
   - Run create-admin script if needed
   - Check if user account is active
   - Ensure user has proper admin role assigned

2. **Admin Panel Not Accessible**
   - Verify user has admin or super_admin role
   - Check if admin routes are properly imported in App.tsx
   - Ensure AuthContext includes role field

3. **Permission Denied Errors**
   - Verify user role in database
   - Check middleware is properly applied to routes
   - Ensure frontend role checks match backend requirements

### Database Queries for Troubleshooting

```javascript
// Find all admin users
db.users.find({ role: { $in: ['admin', 'super_admin'] } })

// Update user to admin
db.users.updateOne(
  { email: 'user@example.com' }, 
  { $set: { role: 'admin', permissions: ['manage_users', 'view_analytics'] } }
)
```

## Production Deployment

### Security Checklist
- [ ] Change default admin credentials
- [ ] Set up environment variables for admin secrets
- [ ] Enable HTTPS for admin routes
- [ ] Set up monitoring for admin actions
- [ ] Configure proper CORS for admin endpoints
- [ ] Set up audit logging for admin activities

### Environment Variables
```bash
# Add to server/.env
JWT_SECRET=your-secure-jwt-secret
ADMIN_DEFAULT_PASSWORD=secure-admin-password
```

## Future Enhancements

Potential additions for the admin system:
- Activity logging and audit trails
- Advanced analytics with charts
- Email templates management
- System configuration panel
- Backup and export functionality
- Multi-factor authentication for admins
- Rate limiting for admin actions

---

**Note**: This admin system provides a solid foundation for platform administration. Customize roles, permissions, and features based on your specific needs.
