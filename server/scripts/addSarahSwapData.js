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

async function addSarahSwapData() {
  try {
    console.log('🔄 Adding Sarah Chen swap data...');

    // Get Sarah Chen's user data
    const sarah = await User.findOne({ email: 'sarah.chen@example.com' });
    if (!sarah) {
      console.error('❌ Sarah Chen not found in database');
      return;
    }

    console.log('✅ Found Sarah Chen:', sarah._id);

    // Get some other users to create sessions with
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

    await Notification.deleteMany({
      $or: [
        { recipient: sarah._id },
        { sender: sarah._id }
      ]
    });

    await Review.deleteMany({
      $or: [
        { reviewer: sarah._id },
        { reviewee: sarah._id }
      ]
    });

    console.log('🧹 Cleared existing data for Sarah');

    // Create various sessions for Sarah
    const sessions = [];
    const notifications = [];
    const reviews = [];

    // 1. ACTIVE SESSIONS (accepted) - where Sarah is learning
    const activeSession1 = new Session({
      mentor: otherUsers[0]._id,
      student: sarah._id,
      skill: 'Node.js Backend Development',
      status: 'accepted',
      requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 90,
      sessionType: 'Video Call',
      message: 'Hi Marcus! I\'d love to learn Node.js from you. I can teach React and TypeScript in return.',
      mentorMessage: 'Great! Looking forward to our session. I\'ve prepared some Node.js exercises for you.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      swapDetails: {
        skillOffered: ['React', 'TypeScript', 'Frontend Development'],
        skillWanted: 'Node.js Backend Development',
        isSwapRequest: true,
        requiresResponse: false
      }
    });

    const activeSession2 = new Session({
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
    });

    // 2. ACTIVE SESSIONS - where Sarah is teaching
    const activeSession3 = new Session({
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
    });

    // 3. PENDING SESSIONS - incoming requests (Sarah as mentor)
    const pendingSession1 = new Session({
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
    });

    const pendingSession2 = new Session({
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
    });

    // 4. PENDING SESSIONS - outgoing requests (Sarah as student)
    const pendingSession3 = new Session({
      mentor: otherUsers[5]._id,
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
    });

    // 5. COMPLETED SESSIONS - for review functionality
    const completedSession1 = new Session({
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
    });

    const completedSession2 = new Session({
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
    });

    const completedSession3 = new Session({
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
    });

    // Add all sessions to array
    sessions.push(
      activeSession1, activeSession2, activeSession3,
      pendingSession1, pendingSession2, pendingSession3,
      completedSession1, completedSession2, completedSession3
    );

    // Save all sessions
    const savedSessions = await Session.insertMany(sessions);
    console.log(`✅ Created ${savedSessions.length} sessions for Sarah`);

    // Create notifications for pending requests
    const notification1 = new Notification({
      recipient: sarah._id,
      sender: otherUsers[3]._id,
      type: 'swap_request',
      title: `New skill swap request from ${otherUsers[3].firstName} ${otherUsers[3].lastName}`,
      message: `${otherUsers[3].firstName} wants to learn TypeScript Best Practices from you. They can teach: Spanish, Business Strategy, Project Management.`,
      data: {
        actionUrl: '/my-swaps',
        sessionId: pendingSession1._id,
        metadata: {
          skillOffered: ['Spanish', 'Business Strategy', 'Project Management'],
          skillWanted: 'TypeScript Best Practices',
          sessionId: pendingSession1._id,
          requiresResponse: true
        }
      },
      isActionRequired: true,
      priority: 'normal',
      channels: ['in-app', 'email'],
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    const notification2 = new Notification({
      recipient: sarah._id,
      sender: otherUsers[4]._id,
      type: 'swap_request',
      title: `New skill swap request from ${otherUsers[4].firstName} ${otherUsers[4].lastName}`,
      message: `${otherUsers[4].firstName} wants to learn Frontend Architecture from you. They can teach: DevOps, Docker, AWS, CI/CD.`,
      data: {
        actionUrl: '/my-swaps',
        sessionId: pendingSession2._id,
        metadata: {
          skillOffered: ['DevOps', 'Docker', 'AWS', 'CI/CD'],
          skillWanted: 'Frontend Architecture',
          sessionId: pendingSession2._id,
          requiresResponse: true
        }
      },
      isActionRequired: true,
      priority: 'normal',
      channels: ['in-app', 'email'],
      read: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    });

    // Notification for session confirmation
    const notification3 = new Notification({
      recipient: sarah._id,
      sender: otherUsers[0]._id,
      type: 'session_accepted',
      title: `Session confirmed with ${otherUsers[0].firstName} ${otherUsers[0].lastName}`,
      message: `Your Node.js Backend Development session is confirmed for ${activeSession1.requestedDate.toDateString()}.`,
      data: {
        actionUrl: '/my-swaps',
        sessionId: activeSession1._id,
        metadata: {
          sessionId: activeSession1._id,
          sessionDate: activeSession1.requestedDate
        }
      },
      isActionRequired: false,
      priority: 'normal',
      channels: ['in-app'],
      read: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    notifications.push(notification1, notification2, notification3);

    // Save notifications
    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications for Sarah`);

    // Create reviews for completed sessions
    const review1 = new Review({
      reviewer: otherUsers[0]._id,
      reviewee: sarah._id,
      session: savedSessions.find(s => s.skill === 'React Component Patterns')?._id,
      rating: 5,
      comment: "Sarah is an amazing React teacher! She explained component patterns so clearly and provided excellent examples. Her teaching style is very engaging and she answered all my questions patiently. Highly recommended!",
      skillRating: 5,
      communicationRating: 5,
      punctualityRating: 5,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    const review2 = new Review({
      reviewer: sarah._id,
      reviewee: otherUsers[1]._id,
      session: savedSessions.find(s => s.skill === 'Design Systems')?._id,
      rating: 4,
      comment: "Great session on design systems! Elena has deep knowledge and shared practical insights. The workshop format worked really well. Would definitely book another session.",
      skillRating: 5,
      communicationRating: 4,
      punctualityRating: 4,
      createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
    });

    const review3 = new Review({
      reviewer: sarah._id,
      reviewee: otherUsers[2]._id,
      session: savedSessions.find(s => s.skill === 'GraphQL Implementation')?._id,
      rating: 5,
      comment: "Excellent GraphQL session! The code review approach was perfect for understanding implementation details. Very knowledgeable and helpful mentor.",
      skillRating: 5,
      communicationRating: 5,
      punctualityRating: 5,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    });

    reviews.push(review1, review2, review3);

    // Save reviews
    await Review.insertMany(reviews);
    console.log(`✅ Created ${reviews.length} reviews`);

    // Update Sarah's stats
    sarah.stats = {
      totalSessions: 6, // 3 completed + 3 active
      hoursLearned: 4.5, // 270 minutes / 60
      hoursTaught: 2.5, // 150 minutes / 60
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
    console.log(`   • ${notifications.length} Notifications`);
    console.log(`   • ${reviews.length} Reviews`);
    console.log('\n🚀 Ready to test My Swaps section!');

  } catch (error) {
    console.error('❌ Error adding Sarah swap data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addSarahSwapData();
