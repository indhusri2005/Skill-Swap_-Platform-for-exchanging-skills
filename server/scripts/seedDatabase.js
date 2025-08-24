const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Session = require('../models/Session');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Sample data
const sampleUsers = [
  {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@example.com',
    password: 'Password123',
    title: 'Senior Frontend Developer',
    bio: 'Passionate React developer with 8+ years of experience. Love teaching and helping others grow in their coding journey.',
    location: 'San Francisco, CA',
    timezone: 'America/Los_Angeles',
    isVerified: true,
    skillsOffered: [
      { name: 'React', level: 'Expert', category: 'Programming', experience: '8+ years building production React apps', rating: 4.9, sessionCount: 127 },
      { name: 'TypeScript', level: 'Advanced', category: 'Programming', experience: '5+ years in large scale applications', rating: 4.8, sessionCount: 89 },
      { name: 'Next.js', level: 'Advanced', category: 'Programming', experience: '3+ years building full-stack apps', rating: 4.9, sessionCount: 67 }
    ],
    skillsWanted: [
      { name: 'Machine Learning', level: 'Beginner', category: 'Programming', priority: 'High', progress: 15 },
      { name: 'Spanish', level: 'Intermediate', category: 'Languages', priority: 'Medium', progress: 60 }
    ],
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      times: ['Evening'],
      timezone: 'America/Los_Angeles'
    },
    sessionTypes: ['Video Call', 'Code Review', 'Mentorship'],
    stats: {
      totalSessions: 127,
      hoursLearned: 45,
      hoursTaught: 185,
      averageRating: 4.9,
      totalReviews: 89
    }
  },
  {
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus.johnson@example.com',
    password: 'Password123',
    title: 'Growth Marketing Expert',
    bio: 'Helped 50+ startups scale from 0 to $10M+ revenue through data-driven marketing strategies.',
    location: 'New York, NY',
    timezone: 'America/New_York',
    isVerified: true,
    skillsOffered: [
      { name: 'Digital Marketing', level: 'Expert', category: 'Business', experience: '10+ years in growth marketing', rating: 4.8, sessionCount: 156 },
      { name: 'SEO', level: 'Advanced', category: 'Business', experience: '8+ years optimizing for search', rating: 4.7, sessionCount: 98 },
      { name: 'Analytics', level: 'Advanced', category: 'Business', experience: 'Google Analytics certified expert', rating: 4.9, sessionCount: 87 }
    ],
    skillsWanted: [
      { name: 'Python', level: 'Intermediate', category: 'Programming', priority: 'High', progress: 40 },
      { name: 'UI/UX Design', level: 'Beginner', category: 'Design', priority: 'Medium', progress: 25 }
    ],
    availability: {
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      times: ['Morning', 'Afternoon'],
      timezone: 'America/New_York'
    },
    sessionTypes: ['Video Call', 'Workshop', 'Mentorship'],
    stats: {
      totalSessions: 156,
      hoursLearned: 32,
      hoursTaught: 234,
      averageRating: 4.8,
      totalReviews: 132
    }
  },
  {
    firstName: 'Elena',
    lastName: 'Rodriguez',
    email: 'elena.rodriguez@example.com',
    password: 'Password123',
    title: 'Spanish Language Teacher',
    bio: 'Native Spanish speaker and certified language teacher. Making language learning fun and practical for 12+ years.',
    location: 'Barcelona, Spain',
    timezone: 'Europe/Madrid',
    isVerified: true,
    skillsOffered: [
      { name: 'Spanish', level: 'Expert', category: 'Languages', experience: 'Native speaker, certified teacher', rating: 5.0, sessionCount: 234 },
      { name: 'French', level: 'Advanced', category: 'Languages', experience: '15+ years living in France', rating: 4.8, sessionCount: 67 }
    ],
    skillsWanted: [
      { name: 'Web Development', level: 'Beginner', category: 'Programming', priority: 'Medium', progress: 10 },
      { name: 'Photography', level: 'Intermediate', category: 'Photography', priority: 'Low', progress: 35 }
    ],
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      times: ['Morning', 'Afternoon', 'Evening'],
      timezone: 'Europe/Madrid'
    },
    sessionTypes: ['Video Call', 'Text Chat'],
    stats: {
      totalSessions: 234,
      hoursLearned: 28,
      hoursTaught: 312,
      averageRating: 5.0,
      totalReviews: 189
    }
  },
  {
    firstName: 'Raj',
    lastName: 'Patel',
    email: 'raj.patel@example.com',
    password: 'Password123',
    title: 'Full Stack Developer',
    bio: 'Python and Node.js expert with experience in building scalable applications. Love teaching backend development.',
    location: 'Mumbai, India',
    timezone: 'Asia/Kolkata',
    isVerified: true,
    skillsOffered: [
      { name: 'Python', level: 'Expert', category: 'Programming', experience: '9+ years in backend development', rating: 4.9, sessionCount: 198 },
      { name: 'Node.js', level: 'Advanced', category: 'Programming', experience: '6+ years building APIs', rating: 4.8, sessionCount: 145 },
      { name: 'MongoDB', level: 'Advanced', category: 'Programming', experience: '7+ years database design', rating: 4.7, sessionCount: 89 }
    ],
    skillsWanted: [
      { name: 'DevOps', level: 'Intermediate', category: 'Programming', priority: 'High', progress: 50 },
      { name: 'Machine Learning', level: 'Beginner', category: 'Programming', priority: 'High', progress: 20 }
    ],
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      times: ['Morning', 'Evening'],
      timezone: 'Asia/Kolkata'
    },
    sessionTypes: ['Video Call', 'Code Review', 'Workshop'],
    stats: {
      totalSessions: 198,
      hoursLearned: 67,
      hoursTaught: 289,
      averageRating: 4.8,
      totalReviews: 156
    }
  },
  {
    firstName: 'Amy',
    lastName: 'Zhang',
    email: 'amy.zhang@example.com',
    password: 'Password123',
    title: 'UX Designer',
    bio: 'Design thinking enthusiast with 6+ years creating user-centered digital experiences. Figma and Adobe specialist.',
    location: 'Toronto, Canada',
    timezone: 'America/Toronto',
    isVerified: true,
    skillsOffered: [
      { name: 'UI/UX Design', level: 'Expert', category: 'Design', experience: '6+ years in product design', rating: 4.9, sessionCount: 123 },
      { name: 'Figma', level: 'Expert', category: 'Design', experience: 'Figma certified professional', rating: 5.0, sessionCount: 156 },
      { name: 'Adobe Photoshop', level: 'Advanced', category: 'Design', experience: '8+ years in graphic design', rating: 4.8, sessionCount: 78 }
    ],
    skillsWanted: [
      { name: 'Frontend Development', level: 'Beginner', category: 'Programming', priority: 'Medium', progress: 30 },
      { name: 'Motion Graphics', level: 'Intermediate', category: 'Design', priority: 'Low', progress: 45 }
    ],
    availability: {
      days: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
      times: ['Afternoon', 'Evening'],
      timezone: 'America/Toronto'
    },
    sessionTypes: ['Video Call', 'Workshop'],
    stats: {
      totalSessions: 123,
      hoursLearned: 89,
      hoursTaught: 167,
      averageRating: 4.9,
      totalReviews: 98
    }
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'Password123',
    // This user represents a newly registered user with empty profile
    title: null,
    bio: null,
    location: null,
    timezone: null,
    isVerified: false,
    socialLinks: {
      website: null,
      linkedin: null,
      twitter: null,
      github: null
    },
    skillsOffered: [],
    skillsWanted: [],
    availability: {
      days: [],
      times: [],
      timezone: 'UTC'
    },
    sessionTypes: [],
    stats: {
      totalSessions: 0,
      hoursLearned: 0,
      hoursTaught: 0,
      averageRating: 0,
      totalReviews: 0
    },
    achievements: []
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Hash passwords
const hashPasswords = async (users) => {
  const hashedUsers = [];
  for (const user of users) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    hashedUsers.push({
      ...user,
      password: hashedPassword
    });
  }
  return hashedUsers;
};

// Clear existing data
const clearDatabase = async () => {
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Session.deleteMany({});
  await Review.deleteMany({});
  await Message.deleteMany({});
  await Notification.deleteMany({});
  console.log('Database cleared');
};

// Seed users
const seedUsers = async () => {
  console.log('Seeding users...');
  const hashedUsers = await hashPasswords(sampleUsers);
  const users = await User.insertMany(hashedUsers);
  console.log(`${users.length} users created`);
  return users;
};

// Create sample sessions
const seedSessions = async (users) => {
  console.log('Creating sample sessions...');
  const sessions = [
    {
      mentor: users[0]._id, // Sarah
      student: users[3]._id, // Raj
      skill: { name: 'React', category: 'Programming' },
      title: 'React Best Practices and Modern Patterns',
      description: 'Learn React hooks, state management, and component architecture best practices',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 60,
      sessionType: 'Video Call',
      status: 'confirmed',
      agenda: 'Cover React hooks, context API, and performance optimization techniques',
      objectives: ['Master useState and useEffect', 'Understand React context', 'Learn performance optimization']
    },
    {
      mentor: users[1]._id, // Marcus
      student: users[4]._id, // Amy
      skill: { name: 'Digital Marketing', category: 'Business' },
      title: 'Growth Marketing Strategies for Designers',
      description: 'Learn data-driven marketing approaches to grow your design business',
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      duration: 90,
      sessionType: 'Workshop',
      status: 'pending',
      agenda: 'SEO for design portfolios, social media marketing, and client acquisition',
      objectives: ['Build marketing funnel', 'Optimize portfolio for SEO', 'Social media strategy']
    },
    {
      mentor: users[2]._id, // Elena
      student: users[0]._id, // Sarah
      skill: { name: 'Spanish', category: 'Languages' },
      title: 'Conversational Spanish Practice Session',
      description: 'Practice Spanish conversation skills and improve fluency',
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      duration: 45,
      sessionType: 'Video Call',
      status: 'completed',
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      agenda: 'Conversational practice focusing on business Spanish',
      objectives: ['Improve pronunciation', 'Expand business vocabulary', 'Practice natural conversation flow']
    }
  ];

  const createdSessions = await Session.insertMany(sessions);
  console.log(`${createdSessions.length} sessions created`);
  return createdSessions;
};

// Create sample reviews
const seedReviews = async (users, sessions) => {
  console.log('Creating sample reviews...');
  const reviews = [
    {
      session: sessions[2]._id, // Completed Spanish session
      reviewer: users[0]._id, // Sarah
      reviewee: users[2]._id, // Elena
      skill: { name: 'Spanish', category: 'Languages' },
      rating: 5,
      comment: 'Elena is an amazing Spanish teacher! Very patient and her explanations are crystal clear. I learned so much in just 45 minutes.',
      aspects: {
        knowledge: 5,
        communication: 5,
        patience: 5,
        preparation: 5,
        helpfulness: 5
      },
      tags: ['knowledgeable', 'patient', 'clear-explanations', 'helpful', 'encouraging'],
      wouldRecommend: true
    }
  ];

  const createdReviews = await Review.insertMany(reviews);
  console.log(`${createdReviews.length} reviews created`);
  return createdReviews;
};

// Create sample messages
const seedMessages = async (users) => {
  console.log('Creating sample messages...');
  const messages = [
    {
      sender: users[3]._id, // Raj
      recipient: users[0]._id, // Sarah
      content: 'Hi Sarah! Thanks for accepting my React session request. I\'m really excited to learn from you!',
      type: 'text',
      read: false
    },
    {
      sender: users[0]._id, // Sarah
      recipient: users[3]._id, // Raj
      content: 'Hi Raj! I\'m looking forward to our session too. Do you have any specific React topics you\'d like to focus on?',
      type: 'text',
      read: true
    },
    {
      sender: users[3]._id, // Raj
      recipient: users[0]._id, // Sarah
      content: 'I\'d love to learn about React hooks and state management best practices. Also, testing with Jest would be great!',
      type: 'text',
      read: false
    }
  ];

  const createdMessages = await Message.insertMany(messages);
  console.log(`${createdMessages.length} messages created`);
  return createdMessages;
};

// Create sample notifications
const seedNotifications = async (users) => {
  console.log('Creating sample notifications...');
  const notifications = [
    {
      recipient: users[0]._id, // Sarah
      sender: users[3]._id, // Raj
      type: 'session_request',
      title: 'New Session Request',
      message: 'Raj wants to learn React from you',
      isRead: false,
      priority: 'normal',
      isActionRequired: true
    },
    {
      recipient: users[3]._id, // Raj
      sender: users[0]._id, // Sarah
      type: 'session_confirmed',
      title: 'Session Confirmed',
      message: 'Sarah has confirmed your React session request',
      isRead: true,
      readAt: new Date(),
      priority: 'normal'
    },
    {
      recipient: users[4]._id, // Amy
      sender: users[0]._id, // System - using a user as sender since it's required
      type: 'system_announcement',
      title: 'Welcome to SkillSwap!',
      message: 'Complete your profile to start connecting with mentors and learners',
      isRead: false,
      priority: 'normal'
    }
  ];

  const createdNotifications = await Notification.insertMany(notifications);
  console.log(`${createdNotifications.length} notifications created`);
  return createdNotifications;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data
    const users = await seedUsers();
    const sessions = await seedSessions(users);
    const reviews = await seedReviews(users, sessions);
    const messages = await seedMessages(users);
    const notifications = await seedNotifications(users);
    
    console.log('\n=== DATABASE SEEDED SUCCESSFULLY ===');
    console.log(`✅ ${users.length} users`);
    console.log(`✅ ${sessions.length} sessions`);
    console.log(`✅ ${reviews.length} reviews`);
    console.log(`✅ ${messages.length} messages`);
    console.log(`✅ ${notifications.length} notifications`);
    console.log('\n📧 Sample login credentials:');
    console.log('Email: sarah.chen@example.com | Password: Password123');
    console.log('Email: marcus.johnson@example.com | Password: Password123');
    console.log('Email: elena.rodriguez@example.com | Password: Password123');
    console.log('Email: raj.patel@example.com | Password: Password123');
    console.log('Email: amy.zhang@example.com | Password: Password123');
    console.log('\n🆕 New user with empty profile (for testing):');
    console.log('Email: john.doe@example.com | Password: Password123');
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
