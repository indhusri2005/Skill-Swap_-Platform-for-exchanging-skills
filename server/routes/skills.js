const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Predefined skill categories with subcategories
const skillCategories = {
  'Programming': [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Django', 'Flask', 'Laravel', 'Spring Boot',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
    'Git', 'Jenkins', 'GraphQL', 'REST APIs', 'Microservices', 'DevOps', 'Machine Learning',
    'Data Science', 'Artificial Intelligence', 'Blockchain', 'Mobile Development'
  ],
  'Design': [
    'UI/UX Design', 'Graphic Design', 'Web Design', 'Logo Design', 'Branding', 'Illustration',
    'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Sketch', 'Adobe XD', 'InDesign',
    'Canva', '3D Modeling', 'Animation', 'Video Editing', 'Motion Graphics', 'Typography',
    'Color Theory', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'
  ],
  'Business': [
    'Digital Marketing', 'SEO', 'Social Media Marketing', 'Content Marketing', 'Email Marketing',
    'PPC Advertising', 'Analytics', 'Project Management', 'Leadership', 'Sales',
    'Customer Service', 'Business Strategy', 'Entrepreneurship', 'Finance', 'Accounting',
    'Human Resources', 'Operations Management', 'Supply Chain', 'Consulting', 'Negotiation',
    'Public Speaking', 'Presentation Skills', 'Team Management', 'Agile/Scrum'
  ],
  'Languages': [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin', 'Japanese',
    'Korean', 'Arabic', 'Russian', 'Hindi', 'Dutch', 'Swedish', 'Norwegian', 'Polish',
    'Turkish', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Greek', 'Czech', 'Hungarian'
  ],
  'Music': [
    'Piano', 'Guitar', 'Violin', 'Drums', 'Bass Guitar', 'Saxophone', 'Flute', 'Trumpet',
    'Cello', 'Voice/Singing', 'Music Theory', 'Music Production', 'Audio Engineering',
    'Songwriting', 'Composition', 'DJing', 'Beat Making', 'Sound Design', 'Music Business'
  ],
  'Photography': [
    'Portrait Photography', 'Landscape Photography', 'Street Photography', 'Wedding Photography',
    'Product Photography', 'Fashion Photography', 'Food Photography', 'Travel Photography',
    'Photo Editing', 'Lightroom', 'Photoshop', 'Camera Techniques', 'Lighting', 'Composition'
  ],
  'Fitness & Health': [
    'Personal Training', 'Yoga', 'Pilates', 'CrossFit', 'Weight Training', 'Cardio',
    'Nutrition', 'Meal Planning', 'Meditation', 'Mindfulness', 'Mental Health',
    'Physical Therapy', 'Sports Training', 'Dance', 'Martial Arts', 'Running'
  ],
  'Cooking & Culinary': [
    'Baking', 'Pastry', 'Italian Cuisine', 'Asian Cuisine', 'French Cuisine', 'Mexican Cuisine',
    'Vegetarian Cooking', 'Vegan Cooking', 'Knife Skills', 'Food Presentation', 'Wine Pairing',
    'Cocktails', 'Grilling', 'Sous Vide', 'Food Photography', 'Recipe Development'
  ]
};

// @route   GET /api/skills/categories
// @desc    Get all skill categories with their skills
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = Object.keys(skillCategories).map(category => ({
      name: category,
      skills: skillCategories[category],
      count: skillCategories[category].length
    }));

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get skill categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching skill categories'
    });
  }
});

// @route   GET /api/skills/search
// @desc    Search for skills
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    let skills = [];

    // Search in specific category if provided
    if (category && skillCategories[category]) {
      skills = skillCategories[category].filter(skill =>
        skill.toLowerCase().includes(q.toLowerCase())
      ).map(skill => ({
        name: skill,
        category: category
      }));
    } else {
      // Search across all categories
      Object.keys(skillCategories).forEach(cat => {
        const matchingSkills = skillCategories[cat].filter(skill =>
          skill.toLowerCase().includes(q.toLowerCase())
        ).map(skill => ({
          name: skill,
          category: cat
        }));
        skills = skills.concat(matchingSkills);
      });
    }

    res.json({
      success: true,
      skills: skills.slice(0, 20) // Limit to 20 results
    });

  } catch (error) {
    console.error('Search skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching skills'
    });
  }
});

// @route   GET /api/skills/popular
// @desc    Get popular skills based on user activity
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get most offered skills
    const popularOfferedSkills = await User.aggregate([
      { $unwind: '$skillsOffered' },
      {
        $group: {
          _id: {
            name: '$skillsOffered.name',
            category: '$skillsOffered.category'
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$skillsOffered.rating' },
          totalSessions: { $sum: '$skillsOffered.sessionCount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: '$_id.name',
          category: '$_id.category',
          mentorCount: '$count',
          averageRating: { $round: ['$averageRating', 1] },
          totalSessions: 1,
          _id: 0
        }
      }
    ]);

    // Get most wanted skills
    const popularWantedSkills = await User.aggregate([
      { $unwind: '$skillsWanted' },
      {
        $group: {
          _id: {
            name: '$skillsWanted.name',
            category: '$skillsWanted.category'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: '$_id.name',
          category: '$_id.category',
          learnerCount: '$count',
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      popularOffered: popularOfferedSkills,
      popularWanted: popularWantedSkills
    });

  } catch (error) {
    console.error('Get popular skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular skills'
    });
  }
});

// @route   GET /api/skills/mentors
// @desc    Find mentors for a specific skill
// @access  Public
router.get('/mentors', async (req, res) => {
  try {
    const { skill, category, level, page = 1, limit = 10 } = req.query;

    if (!skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    let filter = {
      'skillsOffered.name': { $regex: new RegExp(skill, 'i') },
      isActive: true
    };

    if (category) {
      filter['skillsOffered.category'] = category;
    }

    if (level) {
      filter['skillsOffered.level'] = level;
    }

    const mentors = await User.find(filter)
      .select('firstName lastName avatar title bio location timezone skillsOffered stats')
      .sort({ 'stats.averageRating': -1, 'stats.totalSessions': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter to only show the relevant skills
    const filteredMentors = mentors.map(mentor => {
      const relevantSkills = mentor.skillsOffered.filter(s => 
        s.name.toLowerCase().includes(skill.toLowerCase()) &&
        (category ? s.category === category : true) &&
        (level ? s.level === level : true)
      );

      return {
        ...mentor.toObject(),
        skillsOffered: relevantSkills
      };
    });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      mentors: filteredMentors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Find mentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding mentors'
    });
  }
});

// @route   GET /api/skills/learners
// @desc    Find learners for a specific skill
// @access  Private (mentors looking for students)
router.get('/learners', auth, async (req, res) => {
  try {
    const { skill, category, level, page = 1, limit = 10 } = req.query;

    if (!skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    let filter = {
      'skillsWanted.name': { $regex: new RegExp(skill, 'i') },
      isActive: true,
      _id: { $ne: req.user.id } // Exclude current user
    };

    if (category) {
      filter['skillsWanted.category'] = category;
    }

    if (level) {
      filter['skillsWanted.level'] = level;
    }

    const learners = await User.find(filter)
      .select('firstName lastName avatar title bio location timezone skillsWanted')
      .sort({ 'skillsWanted.priority': -1, lastActive: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter to only show the relevant skills
    const filteredLearners = learners.map(learner => {
      const relevantSkills = learner.skillsWanted.filter(s => 
        s.name.toLowerCase().includes(skill.toLowerCase()) &&
        (category ? s.category === category : true) &&
        (level ? s.level === level : true)
      );

      return {
        ...learner.toObject(),
        skillsWanted: relevantSkills
      };
    });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      learners: filteredLearners,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Find learners error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding learners'
    });
  }
});

// @route   GET /api/skills/matches
// @desc    Find skill matches for current user (skills they want vs skills others offer)
// @access  Private
router.get('/matches', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser || !currentUser.skillsWanted.length) {
      return res.json({
        success: true,
        matches: []
      });
    }

    const wantedSkills = currentUser.skillsWanted.map(s => s.name);
    
    const matches = await User.find({
      _id: { $ne: req.user.id },
      isActive: true,
      'skillsOffered.name': { $in: wantedSkills }
    })
    .select('firstName lastName avatar title bio skillsOffered stats')
    .sort({ 'stats.averageRating': -1 });

    // Calculate match score for each potential mentor
    const scoredMatches = matches.map(mentor => {
      let matchScore = 0;
      const matchingSkills = [];

      mentor.skillsOffered.forEach(offeredSkill => {
        const wantedSkill = currentUser.skillsWanted.find(ws => 
          ws.name.toLowerCase() === offeredSkill.name.toLowerCase()
        );
        
        if (wantedSkill) {
          matchingSkills.push({
            name: offeredSkill.name,
            category: offeredSkill.category,
            mentorLevel: offeredSkill.level,
            wantedLevel: wantedSkill.level,
            priority: wantedSkill.priority
          });

          // Calculate match score based on various factors
          let skillScore = 0;
          
          // Priority weight
          const priorityWeights = { 'High': 3, 'Medium': 2, 'Low': 1 };
          skillScore += priorityWeights[wantedSkill.priority] || 1;
          
          // Rating weight
          skillScore += (offeredSkill.rating || 0) * 0.5;
          
          // Session count weight (experience)
          skillScore += Math.min(offeredSkill.sessionCount || 0, 10) * 0.1;
          
          matchScore += skillScore;
        }
      });

      return {
        user: mentor,
        matchingSkills,
        matchScore: Math.round(matchScore * 10) / 10
      };
    }).filter(match => match.matchingSkills.length > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20); // Limit to top 20 matches

    res.json({
      success: true,
      matches: scoredMatches
    });

  } catch (error) {
    console.error('Get skill matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding skill matches'
    });
  }
});

// @route   GET /api/skills/stats
// @desc    Get overall platform skill statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total unique skills offered
      User.aggregate([
        { $unwind: '$skillsOffered' },
        { $group: { _id: '$skillsOffered.name' } },
        { $count: 'uniqueSkills' }
      ]),
      
      // Total mentors
      User.countDocuments({ 
        skillsOffered: { $exists: true, $not: { $size: 0 } },
        isActive: true 
      }),
      
      // Total learners
      User.countDocuments({ 
        skillsWanted: { $exists: true, $not: { $size: 0 } },
        isActive: true 
      }),
      
      // Skills by category
      User.aggregate([
        { $unwind: '$skillsOffered' },
        {
          $group: {
            _id: '$skillsOffered.category',
            count: { $sum: 1 },
            uniqueSkills: { $addToSet: '$skillsOffered.name' }
          }
        },
        {
          $project: {
            category: '$_id',
            totalOfferings: '$count',
            uniqueSkills: { $size: '$uniqueSkills' },
            _id: 0
          }
        },
        { $sort: { totalOfferings: -1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalUniqueSkills: stats[0][0]?.uniqueSkills || 0,
        totalMentors: stats[1] || 0,
        totalLearners: stats[2] || 0,
        skillsByCategory: stats[3] || []
      }
    });

  } catch (error) {
    console.error('Get skills stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching skill statistics'
    });
  }
});

// @route   POST /api/skills/validate
// @desc    Validate if a skill exists in our categories
// @access  Public
router.post('/validate', [
  body('skillName').trim().isLength({ min: 2, max: 100 }).withMessage('Skill name must be between 2 and 100 characters'),
  body('category').optional().isString().withMessage('Category must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { skillName, category } = req.body;
    
    let isValid = false;
    let suggestedCategory = null;
    let suggestions = [];

    // Check if skill exists in specified category
    if (category && skillCategories[category]) {
      isValid = skillCategories[category].some(skill => 
        skill.toLowerCase() === skillName.toLowerCase()
      );
    }

    // If not found in specified category or no category provided, search all
    if (!isValid) {
      for (const [cat, skills] of Object.entries(skillCategories)) {
        if (skills.some(skill => skill.toLowerCase() === skillName.toLowerCase())) {
          isValid = true;
          suggestedCategory = cat;
          break;
        }
      }
    }

    // If still not valid, provide suggestions
    if (!isValid) {
      const allSkills = Object.values(skillCategories).flat();
      suggestions = allSkills.filter(skill => 
        skill.toLowerCase().includes(skillName.toLowerCase()) ||
        skillName.toLowerCase().includes(skill.toLowerCase())
      ).slice(0, 5);
    }

    res.json({
      success: true,
      isValid,
      suggestedCategory,
      suggestions
    });

  } catch (error) {
    console.error('Validate skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating skill'
    });
  }
});

module.exports = router;
