const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxLength: 500,
    default: null
  },
  title: {
    type: String,
    maxLength: 100,
    default: null
  },
  location: {
    type: String,
    maxLength: 100,
    default: null
  },
  timezone: {
    type: String,
    default: null
  },
  socialLinks: {
    website: { type: String, default: null },
    linkedin: { type: String, default: null },
    twitter: { type: String, default: null },
    github: { type: String, default: null }
  },
  skillsOffered: [{
    name: { type: String, required: true },
    level: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true 
    },
    category: { type: String, required: true },
    experience: { type: String, default: '' },
    sessionCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 }
  }],
  skillsWanted: [{
    name: { type: String, required: true },
    level: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true 
    },
    category: { type: String, required: true },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium' 
    },
    progress: { type: Number, default: 0, min: 0, max: 100 }
  }],
  availability: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    times: [{
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Late Night']
    }],
    timezone: { type: String, default: 'UTC' }
  },
  sessionTypes: [{
    type: String,
    enum: ['Video Call', 'Text Chat', 'Workshop', 'Code Review', 'Mentorship']
  }],
  preferredSessionDuration: {
    type: Number,
    default: 60, // minutes
    min: 15,
    max: 180
  },
  stats: {
    totalSessions: { type: Number, default: 0 },
    hoursLearned: { type: Number, default: 0 },
    hoursTaught: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  achievements: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  notificationSettings: {
    email: {
      newMessage: { type: Boolean, default: true },
      sessionReminder: { type: Boolean, default: true },
      sessionRequest: { type: Boolean, default: true },
      newReview: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    push: {
      newMessage: { type: Boolean, default: true },
      sessionReminder: { type: Boolean, default: true },
      sessionRequest: { type: Boolean, default: true },
      newReview: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate avatar URL
userSchema.methods.getAvatarUrl = function() {
  return this.avatar || `https://ui-avatars.com/api/?name=${this.firstName}+${this.lastName}&background=6366f1&color=fff`;
};

// Method to update user stats
userSchema.methods.updateStats = async function() {
  const Session = mongoose.model('Session');
  const Review = mongoose.model('Review');
  
  const completedSessions = await Session.countDocuments({
    $or: [
      { mentor: this._id, status: 'completed' },
      { student: this._id, status: 'completed' }
    ]
  });
  
  const mentorSessions = await Session.find({
    mentor: this._id,
    status: 'completed'
  });
  
  const studentSessions = await Session.find({
    student: this._id,
    status: 'completed'
  });
  
  const reviews = await Review.find({ reviewee: this._id });
  
  this.stats.totalSessions = completedSessions;
  this.stats.hoursTaught = mentorSessions.reduce((total, session) => total + session.duration, 0) / 60;
  this.stats.hoursLearned = studentSessions.reduce((total, session) => total + session.duration, 0) / 60;
  this.stats.totalReviews = reviews.length;
  this.stats.averageRating = reviews.length > 0 
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length 
    : 0;
  
  await this.save();
};

// Index for search
userSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  title: 'text', 
  bio: 'text',
  'skillsOffered.name': 'text' 
});

module.exports = mongoose.model('User', userSchema);
