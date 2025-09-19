const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Admin user data
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@skillswap.com',
      password: 'Admin@123',
      role: 'super_admin',
      permissions: ['manage_users', 'manage_skills', 'manage_sessions', 'view_analytics', 'manage_content', 'system_settings'],
      isVerified: true,
      isActive: true,
      bio: 'System Administrator',
      title: 'Platform Administrator',
      adminNotes: 'Initial admin account created by setup script'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists:', adminData.email);
      return;
    }

    // Create admin user
    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Check if running directly (not imported)
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;
