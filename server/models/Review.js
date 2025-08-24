const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    name: { type: String, required: true },
    category: { type: String, required: true }
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxLength: 1000
  },
  // Individual detailed ratings
  skillRating: { type: Number, min: 1, max: 5 },
  communicationRating: { type: Number, min: 1, max: 5 },
  punctualityRating: { type: Number, min: 1, max: 5 },
  
  // Legacy aspects field for backward compatibility
  aspects: {
    knowledge: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    patience: { type: Number, min: 1, max: 5 },
    preparation: { type: Number, min: 1, max: 5 },
    helpfulness: { type: Number, min: 1, max: 5 }
  },
  tags: [{
    type: String,
    enum: [
      'knowledgeable', 'patient', 'clear-explanations', 'well-prepared',
      'punctual', 'helpful', 'encouraging', 'responsive', 'professional',
      'engaging', 'structured', 'practical-examples', 'good-communicator'
    ]
  }],
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  response: {
    comment: { type: String, maxLength: 500 },
    respondedAt: Date
  },
  isVerified: {
    type: Boolean,
    default: true // Since reviews come from actual sessions
  },
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpful votes count
reviewSchema.virtual('helpfulVotesCount').get(function() {
  return this.helpfulVotes.length;
});

// Virtual for overall rating calculation
reviewSchema.virtual('overallRating').get(function() {
  if (!this.aspects) return this.rating;
  
  const aspectRatings = Object.values(this.aspects).filter(rating => rating > 0);
  if (aspectRatings.length === 0) return this.rating;
  
  return aspectRatings.reduce((sum, rating) => sum + rating, 0) / aspectRatings.length;
});

// Method to check if user found review helpful
reviewSchema.methods.isHelpfulForUser = function(userId) {
  return this.helpfulVotes.some(vote => vote.user.toString() === userId.toString());
};

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function(userId) {
  if (!this.isHelpfulForUser(userId)) {
    this.helpfulVotes.push({ user: userId });
    return this.save();
  }
  throw new Error('User has already voted this review as helpful');
};

// Method to remove helpful vote
reviewSchema.methods.removeHelpfulVote = function(userId) {
  this.helpfulVotes = this.helpfulVotes.filter(
    vote => vote.user.toString() !== userId.toString()
  );
  return this.save();
};

// Index for efficient queries
reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });
reviewSchema.index({ session: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ 'skill.name': 1, 'skill.category': 1 });

// Compound index for skill-based reviews
reviewSchema.index({ reviewee: 1, 'skill.name': 1, rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
