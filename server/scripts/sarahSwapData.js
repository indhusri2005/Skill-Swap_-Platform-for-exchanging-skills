const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/skillswap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addSarahSwapData() {
  try {
    console.log('🔄 Adding Sarah Chen swap data...');

    // Get Sarah Chen
    const sarah = await User.findOne({ email: 'sarah.chen@example.com' });
    if (!sarah) {
      console.error('❌ Sarah Chen not found in database');
      return;
    }

    console.log('✅ Found Sarah Chen:', sarah._id);

    // Get other users
    const otherUsers = await User.find({ 
      email: { $ne: 'sarah.chen@example.com' } 
    }).limit(6);

    if (otherUsers.length === 0) {
      console.error('❌ No other users found. Please run seed database first.');
      return;
    }

    console.log(`✅ Found ${otherUsers.length} other users`);

    // Clear existing sessions for Sarah (for clean demo)
    await Session.deleteMany({
      $or: [
        { mentor: sarah._id },
        { student: sarah._id }
      ]
    });

    console.log('🧹 Cleared existing session data for Sarah');

    // Create comprehensive session data for Sarah
    const sessions = [
      // ACTIVE SESSIONS (accepted) - where Sarah is learning
      {
        mentor: otherUsers[0]._id,
        student: sarah._id,
        skill: 'Node.js Backend Development',
        status: 'accepted',
        requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 90,
        sessionType: 'Video Call',
        message: 'Hi! I\'d love to learn Node.js from you. I can teach React and TypeScript in return.',
        mentorMessage: 'Great! Looking forward to our session. I\'ve prepared some Node.js exercises for you.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        swapDetails: {
          skillOffered: ['React', 'TypeScript', 'Frontend Development'],
          skillWanted: 'Node.js Backend Development',
          isSwapRequest: true,
          requiresResponse: false
        }
      },
      {
        mentor: otherUsers[1]._id,
        student: sarah._id,
        skill: 'UI/UX Design Principles',
        status: 'accepted',
        requestedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        duration: 120,
        sessionType: 'Workshop',
        message: 'I want to improve my design skills for better user interfaces.',
        mentorMessage: 'Perfect! I\'ll show you my design process and some tools.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['React', 'JavaScript', 'Frontend Development'],
          skillWanted: 'UI/UX Design Principles',
          isSwapRequest: true,
          requiresResponse: false
        }
      },

      // ACTIVE SESSIONS - where Sarah is teaching
      {
        mentor: sarah._id,
        student: otherUsers[2]._id,
        skill: 'React Hooks and State Management',
        status: 'accepted',
        requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        duration: 60,
        sessionType: 'Code Review',
        message: 'I need help with React hooks in my project.',
        mentorMessage: 'Sure! Send me your code and I\'ll help you optimize it.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['Python', 'Data Science'],
          skillWanted: 'React Hooks and State Management',
          isSwapRequest: true,
          requiresResponse: false
        }
      },

      // PENDING SESSIONS - incoming requests (Sarah as mentor)
      {
        mentor: sarah._id,
        student: otherUsers[3]._id,
        skill: 'TypeScript Best Practices',
        status: 'pending',
        requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        duration: 90,
        sessionType: 'Mentorship',
        message: 'Hi Sarah! I\'m working on a large TypeScript project and need guidance on best practices, type safety, and project structure. I can teach you Spanish conversation or help with business strategy in return.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        swapDetails: {
          skillOffered: ['Spanish', 'Business Strategy', 'Project Management'],
          skillWanted: 'TypeScript Best Practices',
          isSwapRequest: true,
          requiresResponse: true
        }
      },
      {
        mentor: sarah._id,
        student: otherUsers[4]._id,
        skill: 'Frontend Architecture',
        status: 'pending',
        requestedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        duration: 120,
        sessionType: 'Workshop',
        message: 'I\'m building a complex frontend application and would love your insights on architecture patterns. I can help with DevOps and Docker in exchange.',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        swapDetails: {
          skillOffered: ['DevOps', 'Docker', 'AWS', 'CI/CD'],
          skillWanted: 'Frontend Architecture',
          isSwapRequest: true,
          requiresResponse: true
        }
      },

      // PENDING SESSIONS - outgoing requests (Sarah as student)  
      {
        mentor: otherUsers[0]._id,
        student: sarah._id,
        skill: 'Machine Learning Basics',
        status: 'pending',
        requestedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        duration: 150,
        sessionType: 'Workshop',
        message: 'I\'m interested in learning ML basics to enhance my development skills. I can teach advanced React patterns and performance optimization.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        swapDetails: {
          skillOffered: ['React', 'Performance Optimization', 'Frontend Architecture'],
          skillWanted: 'Machine Learning Basics',
          isSwapRequest: true,
          requiresResponse: true
        }
      },

      // COMPLETED SESSIONS
      {
        mentor: sarah._id,
        student: otherUsers[0]._id,
        skill: 'React Component Patterns',
        status: 'completed',
        requestedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        duration: 60,
        sessionType: 'Video Call',
        message: 'Need help with advanced React patterns.',
        mentorMessage: 'Happy to help! I\'ll show you some advanced patterns.',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['Backend Development', 'Node.js'],
          skillWanted: 'React Component Patterns',
          isSwapRequest: true,
          requiresResponse: false
        }
      },
      {
        mentor: otherUsers[1]._id,
        student: sarah._id,
        skill: 'Design Systems',
        status: 'completed',
        requestedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        duration: 90,
        sessionType: 'Workshop',
        message: 'Want to learn about building design systems.',
        mentorMessage: 'Excellent topic! I\'ll walk you through our design system.',
        createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['JavaScript', 'Frontend Development'],
          skillWanted: 'Design Systems',
          isSwapRequest: true,
          requiresResponse: false
        }
      },
      {
        mentor: otherUsers[2]._id,
        student: sarah._id,
        skill: 'GraphQL Implementation',
        status: 'completed',
        requestedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
        duration: 120,
        sessionType: 'Code Review',
        message: 'Need guidance on implementing GraphQL.',
        mentorMessage: 'Great choice! GraphQL is very powerful.',
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
    console.log(`✅ Created ${savedSessions.length} sessions for Sarah`);

    // Update Sarah's stats
    sarah.stats = {
      totalSessions: 6, // 3 completed + 3 active
      hoursLearned: 4.5, 
      hoursTaught: 2.5,
      averageRating: 5.0,
      totalReviews: 1,
      completionRate: 100,
      responseRate: 100
    };

    await sarah.save();
    console.log('✅ Updated Sarah\'s stats');

    console.log('\n🎉 Successfully added comprehensive swap data for Sarah Chen!');
    console.log('\n📊 Summary:');
    console.log(`   • ${sessions.filter(s => s.status === 'accepted').length} Active sessions`);
    console.log(`   • ${sessions.filter(s => s.status === 'pending').length} Pending requests`);
    console.log(`   • ${sessions.filter(s => s.status === 'completed').length} Completed sessions`);
    console.log('\n🚀 Ready to test My Swaps section!');
    console.log('📝 Login credentials: sarah.chen@example.com / password123');

  } catch (error) {
    console.error('❌ Error adding Sarah swap data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addSarahSwapData();
