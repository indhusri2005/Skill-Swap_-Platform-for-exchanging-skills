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
      console.error('❌ Need at least 5 other users. Run seedDatabase.js first.');
      return;
    }

    console.log('✅ Found users');

    // Clear existing data for clean demo
    await Session.deleteMany({ $or: [{ mentor: sarah._id }, { student: sarah._id }] });
    await Notification.deleteMany({ $or: [{ recipient: sarah._id }, { sender: sarah._id }] });
    await Review.deleteMany({ $or: [{ reviewer: sarah._id }, { reviewee: sarah._id }] });

    // Create comprehensive session data
    const sessions = [
      // 1. ACTIVE SESSIONS (accepted) - Sarah learning
      {
        mentor: others[0]._id,
        student: sarah._id,
        skill: 'Node.js Backend Development',
        status: 'accepted',
        requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days ahead
        duration: 90,
        sessionType: 'Video Call',
        message: 'Hi! I would love to learn Node.js backend development from you. I can teach React and TypeScript in return.',
        mentorMessage: 'Great! Looking forward to our session. I have prepared some Node.js exercises for you.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['React', 'TypeScript', 'Frontend Development'],
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
        requestedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days ahead
        duration: 120,
        sessionType: 'Workshop',
        message: 'I want to improve my design skills for better user interfaces.',
        mentorMessage: 'Perfect! I will show you my design process and some powerful tools.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['React', 'JavaScript', 'Frontend Development'],
          skillWanted: 'UI/UX Design Principles',
          isSwapRequest: true,
          requiresResponse: false
        }
      },

      // 2. ACTIVE SESSIONS - Sarah teaching
      {
        mentor: sarah._id,
        student: others[2]._id,
        skill: 'React Hooks and State Management',
        status: 'accepted',
        requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days ahead
        duration: 60,
        sessionType: 'Code Review',
        message: 'I need help with React hooks in my project.',
        mentorMessage: 'Sure! Send me your code and I will help you optimize it.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        swapDetails: {
          skillOffered: ['Python', 'Data Science'],
          skillWanted: 'React Hooks and State Management',
          isSwapRequest: true,
          requiresResponse: false
        }
      },

      // 3. PENDING SESSIONS - incoming requests (Sarah as mentor)
      {
        mentor: sarah._id,
        student: others[3]._id,
        skill: 'TypeScript Best Practices',
        status: 'pending',
        requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week ahead
        duration: 90,
        sessionType: 'Mentorship',
        message: 'Hi Sarah! I am working on a large TypeScript project and need guidance on best practices, type safety, and project structure. I can teach you Spanish conversation or help with business strategy in return.',
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
        student: others[4]._id,
        skill: 'Frontend Architecture',
        status: 'pending',
        requestedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days ahead
        duration: 120,
        sessionType: 'Workshop',
        message: 'I am building a complex frontend application and would love your insights on architecture patterns and scalability. I can help with DevOps and Docker in exchange.',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        swapDetails: {
          skillOffered: ['DevOps', 'Docker', 'AWS', 'CI/CD'],
          skillWanted: 'Frontend Architecture',
          isSwapRequest: true,
          requiresResponse: true
        }
      },

      // 4. PENDING SESSIONS - outgoing requests (Sarah as student)
      {
        mentor: others[0]._id,
        student: sarah._id,
        skill: 'Machine Learning Basics',
        status: 'pending',
        requestedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks ahead
        duration: 150,
        sessionType: 'Workshop',
        message: 'I am interested in learning ML basics to enhance my development skills. I can teach advanced React patterns and performance optimization.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        swapDetails: {
          skillOffered: ['React', 'Performance Optimization', 'Frontend Architecture'],
          skillWanted: 'Machine Learning Basics',
          isSwapRequest: true,
          requiresResponse: true
        }
      },

      // 5. COMPLETED SESSIONS
      {
        mentor: sarah._id,
        student: others[0]._id,
        skill: 'React Component Patterns',
        status: 'completed',
        requestedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        duration: 60,
        sessionType: 'Video Call',
        message: 'Need help with advanced React patterns.',
        mentorMessage: 'Happy to help! I will show you some advanced patterns.',
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
        mentor: others[1]._id,
        student: sarah._id,
        skill: 'Design Systems',
        status: 'completed',
        requestedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        duration: 90,
        sessionType: 'Workshop',
        message: 'Want to learn about building design systems.',
        mentorMessage: 'Excellent topic! I will walk you through our design system.',
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
        mentor: others[2]._id,
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

    // Update Sarah's stats based on the sessions
    sarah.stats = {
      totalSessions: 6, // 3 completed + 3 active
      hoursLearned: 4.5, // (90+120+150+90+120)/60 = 9.5 hours learned
      hoursTaught: 2.5, // (60+60)/60 = 2 hours taught  
      averageRating: 5.0,
      totalReviews: 1,
      completionRate: 100,
      responseRate: 100
    };

    await sarah.save();
    console.log('✅ Updated Sarah\'s stats');

    console.log('\n🎉 SUCCESS! Added comprehensive swap data for Sarah Chen!');
    console.log('\n📊 Summary:');
    console.log(`   • ${sessions.filter(s => s.status === 'accepted').length} Active sessions`);
    console.log(`   • ${sessions.filter(s => s.status === 'pending').length} Pending requests`);
    console.log(`   • ${sessions.filter(s => s.status === 'completed').length} Completed sessions`);
    console.log('\n🚀 Ready to test My Swaps section with Sarah Chen!');
    console.log('📝 Login with: sarah.chen@example.com / password123');

  } catch (error) {
    console.error('❌ Error adding Sarah swap data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addSarahData();
