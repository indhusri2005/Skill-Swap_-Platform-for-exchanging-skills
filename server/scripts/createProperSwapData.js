const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/skillswap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createProperSwapData() {
  try {
    console.log('🔄 Creating proper swap data for comprehensive testing...');

    // Get all users
    const users = await User.find({});
    if (users.length < 5) {
      console.error('❌ Need at least 5 users in database. Please run seedDatabase first.');
      return;
    }

    console.log(`✅ Found ${users.length} users`);

    // Get Sarah Chen specifically
    const sarah = users.find(user => user.email === 'sarah.chen@example.com');
    if (!sarah) {
      console.error('❌ Sarah Chen not found');
      return;
    }

    console.log('✅ Found Sarah Chen:', sarah._id);

    // Get other specific users for more realistic data
    const marcus = users.find(user => user.email === 'marcus.johnson@example.com');
    const elena = users.find(user => user.email === 'elena.rodriguez@example.com');
    const raj = users.find(user => user.email === 'raj.patel@example.com');
    const amy = users.find(user => user.email === 'amy.zhang@example.com');

    const otherUsers = [marcus, elena, raj, amy].filter(Boolean);
    if (otherUsers.length === 0) {
      console.error('❌ Could not find other specific users. Using available users.');
      return;
    }

    console.log(`✅ Found ${otherUsers.length} other specific users`);

    // Clear existing sessions for clean demo
    await Session.deleteMany({
      $or: [
        { mentor: sarah._id },
        { student: sarah._id }
      ]
    });

    console.log('🧹 Cleared existing session data for Sarah');

    // Create comprehensive session data with proper schema
    const sessions = [
      // CONFIRMED SESSIONS - where Sarah is learning (active tab)
      {
        mentor: raj._id, // Raj teaches Python
        student: sarah._id,
        skill: { 
          name: 'Python', 
          category: 'Programming' 
        },
        title: 'Python Backend Development Fundamentals',
        description: 'Learn Python basics, Django framework, and API development best practices.',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 90,
        sessionType: 'Video Call',
        status: 'confirmed',
        timezone: 'America/Los_Angeles',
        agenda: 'Python syntax, OOP concepts, and Django introduction',
        objectives: ['Master Python basics', 'Understand Django MVC', 'Build simple API'],
        notes: {
          studentNotes: 'Looking forward to learning backend development with Python!'
        }
      },
      {
        mentor: amy._id, // Amy teaches UI/UX
        student: sarah._id,
        skill: { 
          name: 'UI/UX Design', 
          category: 'Design' 
        },
        title: 'Design Thinking and User Interface Principles',
        description: 'Learn design thinking methodology and create better user interfaces.',
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        duration: 120,
        sessionType: 'Workshop',
        status: 'confirmed',
        timezone: 'America/Los_Angeles',
        agenda: 'Design thinking process, wireframing, and prototyping',
        objectives: ['Understand design thinking', 'Create user personas', 'Design effective wireframes'],
        notes: {
          studentNotes: 'Want to improve my design skills for better user experiences.'
        }
      },

      // CONFIRMED SESSIONS - where Sarah is teaching (active tab)
      {
        mentor: sarah._id,
        student: marcus._id, // Marcus learns React
        skill: { 
          name: 'React', 
          category: 'Programming' 
        },
        title: 'Modern React Development with Hooks',
        description: 'Learn React hooks, state management, and modern development patterns.',
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        duration: 60,
        sessionType: 'Code Review',
        status: 'confirmed',
        timezone: 'America/Los_Angeles',
        agenda: 'React hooks, context API, and component patterns',
        objectives: ['Master React hooks', 'Implement state management', 'Review code quality'],
        notes: {
          mentorNotes: 'Marcus has good JavaScript foundation, focus on React-specific patterns.'
        }
      },
      {
        mentor: sarah._id,
        student: elena._id, // Elena learns TypeScript  
        skill: { 
          name: 'TypeScript', 
          category: 'Programming' 
        },
        title: 'TypeScript for JavaScript Developers',
        description: 'Introduction to TypeScript, type safety, and modern development practices.',
        scheduledAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        duration: 90,
        sessionType: 'Video Call',
        status: 'confirmed',
        timezone: 'America/Los_Angeles',
        agenda: 'TypeScript basics, interfaces, generics, and project setup',
        objectives: ['Understand TypeScript benefits', 'Learn type annotations', 'Set up TS project'],
        notes: {
          mentorNotes: 'Elena wants to add TypeScript to her web development toolkit.'
        }
      },

      // PENDING SESSIONS - incoming requests to Sarah (pending tab)
      {
        mentor: sarah._id,
        student: amy._id, // Amy wants to learn React
        skill: { 
          name: 'React', 
          category: 'Programming' 
        },
        title: 'React for Designers: Building Interactive UIs',
        description: 'Learn React from a designer perspective to build interactive prototypes.',
        scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        duration: 90,
        sessionType: 'Workshop',
        status: 'pending',
        timezone: 'America/Los_Angeles',
        agenda: 'React components, props, state, and styling approaches',
        objectives: ['Build interactive components', 'Understand React workflow', 'Create responsive UIs'],
        notes: {
          studentNotes: 'As a designer, I want to learn React to create better design prototypes and work closer with developers.'
        }
      },
      {
        mentor: sarah._id,
        student: raj._id, // Raj wants to learn TypeScript
        skill: { 
          name: 'TypeScript', 
          category: 'Programming' 
        },
        title: 'Advanced TypeScript for Backend Development',
        description: 'Learn advanced TypeScript patterns for building robust backend applications.',
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        duration: 120,
        sessionType: 'Mentorship',
        status: 'pending',
        timezone: 'America/Los_Angeles', 
        agenda: 'Advanced types, decorators, and backend TypeScript patterns',
        objectives: ['Master advanced TypeScript', 'Apply types to Node.js', 'Build type-safe APIs'],
        notes: {
          studentNotes: 'Want to use TypeScript in my Node.js projects for better code quality.'
        }
      },

      // PENDING SESSIONS - outgoing requests from Sarah (pending tab)
      {
        mentor: marcus._id, // Sarah wants to learn Digital Marketing
        student: sarah._id,
        skill: { 
          name: 'Digital Marketing', 
          category: 'Business' 
        },
        title: 'Growth Marketing for Tech Professionals',
        description: 'Learn digital marketing strategies to grow your tech career and projects.',
        scheduledAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        duration: 90,
        sessionType: 'Workshop',
        status: 'pending',
        timezone: 'America/Los_Angeles',
        agenda: 'Personal branding, LinkedIn optimization, and content marketing',
        objectives: ['Build personal brand', 'Optimize online presence', 'Create marketing funnel'],
        notes: {
          studentNotes: 'Want to learn marketing to better promote my freelance development services.'
        }
      },
      {
        mentor: elena._id, // Sarah wants to improve Spanish
        student: sarah._id,
        skill: { 
          name: 'Spanish', 
          category: 'Languages' 
        },
        title: 'Business Spanish Conversation Practice',
        description: 'Practice Spanish conversation skills with focus on business contexts.',
        scheduledAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        duration: 45,
        sessionType: 'Video Call',
        status: 'pending',
        timezone: 'America/Los_Angeles',
        agenda: 'Business vocabulary, formal conversations, and cultural context',
        objectives: ['Improve business vocabulary', 'Practice formal speech', 'Cultural understanding'],
        notes: {
          studentNotes: 'Working with Spanish-speaking clients and want to improve my professional Spanish.'
        }
      },

      // COMPLETED SESSIONS (completed tab)
      {
        mentor: sarah._id,
        student: raj._id, // Sarah taught React to Raj
        skill: { 
          name: 'React', 
          category: 'Programming' 
        },
        title: 'React Fundamentals and Component Architecture',
        description: 'Introduction to React development and component-based architecture.',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        duration: 90,
        sessionType: 'Video Call',
        status: 'completed',
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        actualDuration: 95,
        timezone: 'America/Los_Angeles',
        agenda: 'React basics, components, props, state, and hooks introduction',
        objectives: ['Understand React concepts', 'Build first components', 'Handle state and events'],
        notes: {
          mentorNotes: 'Great session! Raj picked up React concepts quickly.',
          studentNotes: 'Excellent teaching! Sarah explained everything clearly.'
        },
        feedback: {
          studentFeedback: {
            rating: 5,
            comment: 'Sarah is an amazing teacher! Her explanations were clear and the hands-on examples really helped me understand React concepts.',
            submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          },
          mentorFeedback: {
            rating: 5,
            comment: 'Raj was a fantastic student - asked great questions and was very engaged throughout the session.',
            submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        mentor: amy._id, // Sarah learned Figma from Amy
        student: sarah._id,
        skill: { 
          name: 'Figma', 
          category: 'Design' 
        },
        title: 'Figma for Developers: Design Collaboration',
        description: 'Learn Figma basics to better collaborate with designers and create prototypes.',
        scheduledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        duration: 60,
        sessionType: 'Workshop',
        status: 'completed',
        completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        actualDuration: 75,
        timezone: 'America/Los_Angeles',
        agenda: 'Figma interface, components, prototyping, and developer handoff',
        objectives: ['Navigate Figma interface', 'Understand design systems', 'Export assets for development'],
        notes: {
          mentorNotes: 'Sarah grasped Figma quickly and asked insightful questions about the design process.',
          studentNotes: 'This was incredibly helpful! Now I understand how designers think and can collaborate better.'
        },
        feedback: {
          studentFeedback: {
            rating: 5,
            comment: 'Amazing session! Amy showed me not just how to use Figma but also helped me understand the design workflow. This will definitely improve my collaboration with designers.',
            submittedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
          },
          mentorFeedback: {
            rating: 5,
            comment: 'Sarah was wonderful to work with. Her developer perspective brought great questions and insights to the session.',
            submittedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        mentor: marcus._id, // Sarah learned SEO from Marcus
        student: sarah._id,
        skill: { 
          name: 'SEO', 
          category: 'Business' 
        },
        title: 'SEO Fundamentals for Developer Portfolios',
        description: 'Learn SEO basics to improve visibility of developer portfolios and projects.',
        scheduledAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        duration: 75,
        sessionType: 'Mentorship',
        status: 'completed',
        completedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        actualDuration: 80,
        timezone: 'America/Los_Angeles',
        agenda: 'SEO basics, keyword research, on-page optimization, and technical SEO',
        objectives: ['Understand SEO fundamentals', 'Optimize portfolio site', 'Track SEO performance'],
        notes: {
          mentorNotes: 'Sarah had great questions about technical SEO and how it relates to web development.',
          studentNotes: 'Marcus provided actionable SEO strategies I could implement immediately on my portfolio.'
        },
        feedback: {
          studentFeedback: {
            rating: 4,
            comment: 'Great session on SEO fundamentals. Marcus provided practical advice that I could apply right away to my portfolio site.',
            submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
          },
          mentorFeedback: {
            rating: 5,
            comment: 'Sarah was very engaged and asked excellent questions about technical SEO. It was great to help a developer understand marketing concepts.',
            submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
          }
        }
      },

      // CANCELLED SESSION (for completeness)
      {
        mentor: sarah._id,
        student: marcus._id,
        skill: { 
          name: 'Next.js', 
          category: 'Programming' 
        },
        title: 'Next.js Full-Stack Development',
        description: 'Learn Next.js for building full-stack React applications.',
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        duration: 120,
        sessionType: 'Workshop',
        status: 'cancelled',
        cancelledAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        cancelledBy: marcus._id,
        cancellationReason: 'Schedule conflict - had an urgent work deadline',
        timezone: 'America/Los_Angeles',
        agenda: 'Next.js setup, routing, API routes, and deployment',
        objectives: ['Set up Next.js project', 'Understand file-based routing', 'Build API endpoints'],
        notes: {
          mentorNotes: 'Looking forward to teaching Next.js concepts and best practices.'
        }
      }
    ];

    // Insert sessions
    const createdSessions = await Session.insertMany(sessions);
    console.log(`✅ Created ${createdSessions.length} sessions for Sarah`);

    // Log summary
    console.log('\n📊 Session Summary:');
    const statusCounts = sessions.reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {});

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} sessions`);
    });

    // Log role distribution
    const sarahAsMentor = sessions.filter(s => s.mentor.toString() === sarah._id.toString()).length;
    const sarahAsStudent = sessions.filter(s => s.student.toString() === sarah._id.toString()).length;
    
    console.log('\n👥 Role Distribution:');
    console.log(`   Sarah as Mentor: ${sarahAsMentor} sessions`);
    console.log(`   Sarah as Student: ${sarahAsStudent} sessions`);

    console.log('\n✨ Comprehensive swap data created successfully!');
    console.log('🔗 Login as sarah.chen@example.com to see all the session data in My Swaps');
    
  } catch (error) {
    console.error('❌ Error creating swap data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 Database connection closed');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  createProperSwapData();
}

module.exports = createProperSwapData;
