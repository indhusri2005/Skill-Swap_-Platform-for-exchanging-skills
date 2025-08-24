const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const Review = require('../models/Review');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/skillswap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addSarahData() {
  try {
    console.log('🔄 Adding Sarah Chen swap data...');

    // Get Sarah Chen
    const sarah = await User.findOne({ email: 'sarah.chen@example.com' });
    if (!sarah) {
      console.error('❌ Sarah Chen not found');
      return;
    }

    // Get other users
    const others = await User.find({ email: { $ne: 'sarah.chen@example.com' } }).limit(6);
    if (others.length < 5) {
      console.error('❌ Need at least 5 other users');
      return;
    }

    console.log('✅ Found users');

    // Clear existing data
    await Session.deleteMany({ $or: [{ mentor: sarah._id }, { student: sarah._id }] });
    await Notification.deleteMany({ $or: [{ recipient: sarah._id }, { sender: sarah._id }] });
    await Review.deleteMany({ $or: [{ reviewer: sarah._id }, { reviewee: sarah._id }] });

    // Create sessions
    const sessions = [
      // ACTIVE - Sarah learning
      {
        mentor: others[0]._id,
        student: sarah._id,
        skill: 'Node.js Backend Development',
        status: 'accepted',
        requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 90,
        sessionType: 'Video Call',
        message: 'Hi! I\'d love to learn Node.js from you.',
        mentorMessage: 'Great! Looking forward to our session.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['React', 'TypeScript'],
          skillWanted: 'Node.js Backend Development',
          isSwapRequest: true,
          requiresResponse: false
        }
      },
      {
        mentor: others[1]._id,
        student: sarah._id,
        skill: 'UI/UX Design Principles',
        status: 'accepted',
        requestedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: 120,
        sessionType: 'Workshop',
        message: 'Want to improve my design skills.',
        mentorMessage: 'Perfect! I\'ll show you my design process.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['React', 'JavaScript'],
          skillWanted: 'UI/UX Design Principles',
          isSwapRequest: true,
          requiresResponse: false
        }
      },
      // ACTIVE - Sarah teaching
      {
        mentor: sarah._id,
        student: others[2]._id,
        skill: 'React Hooks and State Management',
        status: 'accepted',
        requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        duration: 60,
        sessionType: 'Code Review',
        message: 'Need help with React hooks.',
        mentorMessage: 'Sure! Send me your code.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['Python', 'Data Science'],
          skillWanted: 'React Hooks and State Management',
          isSwapRequest: true,
          requiresResponse: false
        }
      },
      // PENDING - incoming (Sarah as mentor)
      {
        mentor: sarah._id,
        student: others[3]._id,
        skill: 'TypeScript Best Practices',
        status: 'pending',
        requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 90,
        sessionType: 'Mentorship',
        message: 'Hi Sarah! Need guidance on TypeScript best practices and project structure. I can teach Spanish or business strategy in return.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['Spanish', 'Business Strategy'],
          skillWanted: 'TypeScript Best Practices',
          isSwapRequest: true,
          requiresResponse: true
        }
      },
      {
        mentor: sarah._id,
        student: others[4]._id,
        skill: 'Frontend Architecture',
        status: 'pending',
        requestedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        duration: 120,
        sessionType: 'Workshop',
        message: 'Building a complex frontend app and would love your insights on architecture patterns. I can help with DevOps and Docker.',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['DevOps', 'Docker', 'AWS'],
          skillWanted: 'Frontend Architecture',
          isSwapRequest: true,
          requiresResponse: true
        }
      },
      // PENDING - outgoing (Sarah as student)
      {
        mentor: others[0]._id,
        student: sarah._id,
        skill: 'Machine Learning Basics',
        status: 'pending',
        requestedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration: 150,
        sessionType: 'Workshop',
        message: 'Interested in learning ML basics. I can teach advanced React patterns.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['React', 'Performance Optimization'],
          skillWanted: 'Machine Learning Basics',
          isSwapRequest: true,
          requiresResponse: true
        }
      },
      // COMPLETED
      {
        mentor: sarah._id,
        student: others[0]._id,
        skill: 'React Component Patterns',
        status: 'completed',
        requestedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 60,
        sessionType: 'Video Call',
        message: 'Need help with advanced React patterns.',
        mentorMessage: 'Happy to help!',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['Backend Development'],
          skillWanted: 'React Component Patterns',
          isSwapRequest: true,
          requiresResponse: false
        }
      },
      {
        mentor: others[1]._id,
        student: sarah._id,
        skill: 'Design Systems',
        status: 'completed',
        requestedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        duration: 90,
        sessionType: 'Workshop',
        message: 'Want to learn about design systems.',
        mentorMessage: 'I\'ll walk you through our design system.',
        createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['JavaScript'],
          skillWanted: 'Design Systems',
          isSwapRequest: true,
          requiresResponse: false
        }
      },
      {
        mentor: others[2]._id,
        student: sarah._id,
        skill: 'GraphQL Implementation',
        status: 'completed',
        requestedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        duration: 120,
        sessionType: 'Code Review',
        message: 'Need GraphQL implementation guidance.',
        mentorMessage: 'GraphQL is very powerful.',
        createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['React', 'TypeScript'],
          skillWanted: 'GraphQL Implementation',
          isSwapRequest: true,
          requiresResponse: false
        }
      }
    ];

    // Save sessions
    const savedSessions = await Session.insertMany(sessions);
    console.log(`✅ Created ${savedSessions.length} sessions`);

    // Create notifications
    const notifications = [
      {
        recipient: sarah._id,
        sender: others[3]._id,
        type: 'swap_request',
        title: `New skill swap request from ${others[3].firstName} ${others[3].lastName}`,
        message: `${others[3].firstName} wants to learn TypeScript Best Practices from you.`,
        data: {
          actionUrl: '/my-swaps',
          sessionId: savedSessions.find(s => s.skill === 'TypeScript Best Practices')._id,
          metadata: { requiresResponse: true }
        },
        isActionRequired: true,
        priority: 'normal',
        channels: ['in-app'],
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        recipient: sarah._id,
        sender: others[4]._id,
        type: 'swap_request',
        title: `New skill swap request from ${others[4].firstName} ${others[4].lastName}`,
        message: `${others[4].firstName} wants to learn Frontend Architecture from you.`,
        data: {
          actionUrl: '/my-swaps',
          sessionId: savedSessions.find(s => s.skill === 'Frontend Architecture')._id,
          metadata: { requiresResponse: true }
        },
        isActionRequired: true,
        priority: 'normal',
        channels: ['in-app'],
        read: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];

    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // Create reviews
    const reviews = [
      {
        reviewer: others[0]._id,
        reviewee: sarah._id,
        session: savedSessions.find(s => s.skill === 'React Component Patterns')._id,
        rating: 5,
        comment: "Sarah is an amazing React teacher! Explained component patterns so clearly. Highly recommended!",
        skillRating: 5,
        communicationRating: 5,
        punctualityRating: 5,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        reviewer: sarah._id,
        reviewee: others[1]._id,
        session: savedSessions.find(s => s.skill === 'Design Systems')._id,
        rating: 4,
        comment: "Great session on design systems! Deep knowledge and practical insights. Would book again.",
        skillRating: 5,
        communicationRating: 4,
        punctualityRating: 4,
        createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
      }
    ];

    await Review.insertMany(reviews);
    console.log(`✅ Created ${reviews.length} reviews`);

    // Update Sarah's stats
    sarah.stats = {
      totalSessions: 6,
      hoursLearned: 4.5,
      hoursTaught: 2.5,
      averageRating: 5.0,
      totalReviews: 1,
      completionRate: 100,
      responseRate: 100
    };

    await sarah.save();
    console.log('✅ Updated Sarah\'s stats');

    console.log('\n🎉 Success! Added comprehensive swap data for Sarah Chen!');
    console.log('\n📊 Summary:');
    console.log(`   • 3 Active sessions`);
    console.log(`   • 3 Pending requests`);
    console.log(`   • 3 Completed sessions`);
    console.log(`   • 2 Notifications`);
    console.log(`   • 2 Reviews`);
    console.log('\n🚀 Ready to test My Swaps section!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

addSarahData();
