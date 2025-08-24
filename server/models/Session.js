const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    name: { type: String, required: true },
    category: { type: String, required: true }
  },
  exchangeSkill: {
    name: { type: String },
    category: { type: String }
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  description: {
    type: String,
    maxLength: 1000
  },
  sessionType: {
    type: String,
    enum: ['Video Call', 'Text Chat', 'Workshop', 'Code Review', 'Mentorship'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // minutes
    required: true,
    min: 15,
    max: 180
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  meetingLink: {
    type: String,
    default: ''
  },
  agenda: {
    type: String,
    maxLength: 500
  },
  objectives: [{
    type: String,
    maxLength: 200
  }],
  materials: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['document', 'video', 'article', 'code', 'other'],
      default: 'document'
    }
  }],
  notes: {
    mentorNotes: { type: String, maxLength: 1000 },
    studentNotes: { type: String, maxLength: 1000 }
  },
  feedback: {
    mentorFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxLength: 500 },
      submittedAt: Date
    },
    studentFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxLength: 500 },
      submittedAt: Date
    }
  },
  rescheduleHistory: [{
    previousDate: { type: Date, required: true },
    newDate: { type: Date, required: true },
    reason: { type: String, maxLength: 200 },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedAt: { type: Date, default: Date.now }
  }],
  cancellationReason: {
    type: String,
    maxLength: 200
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  completedAt: Date,
  actualDuration: Number, // actual duration in minutes
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly']
    },
    endDate: Date,
    occurrences: Number
  },
  parentSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  childSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  reminders: {
    sent24Hours: { type: Boolean, default: false },
    sent1Hour: { type: Boolean, default: false },
    sent10Minutes: { type: Boolean, default: false }
  },
  isExchange: {
    type: Boolean,
    default: false
  },
  exchangeSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  swapDetails: {
    skillOffered: [{ type: String }],
    skillWanted: { type: String },
    isSwapRequest: { type: Boolean, default: false },
    requiresResponse: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session duration in hours
sessionSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Virtual for formatted scheduled time
sessionSchema.virtual('formattedScheduledTime').get(function() {
  return this.scheduledAt.toLocaleString();
});

// Method to check if session can be cancelled
sessionSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledAt);
  const timeDiff = scheduledTime - now;
  const hoursUntilSession = timeDiff / (1000 * 60 * 60);
  
  return hoursUntilSession > 2 && this.status !== 'completed' && this.status !== 'cancelled';
};

// Method to check if session can be rescheduled
sessionSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledAt);
  const timeDiff = scheduledTime - now;
  const hoursUntilSession = timeDiff / (1000 * 60 * 60);
  
  return hoursUntilSession > 4 && this.status !== 'completed' && this.status !== 'cancelled';
};

// Method to create recurring sessions
sessionSchema.methods.createRecurringSessions = async function() {
  if (!this.isRecurring || !this.recurringPattern.frequency) {
    return [];
  }
  
  const sessions = [];
  const Session = mongoose.model('Session');
  let currentDate = new Date(this.scheduledAt);
  
  const getNextDate = (date, frequency) => {
    const next = new Date(date);
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  };
  
  let occurrenceCount = 0;
  const maxOccurrences = this.recurringPattern.occurrences || 10;
  const endDate = this.recurringPattern.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default
  
  while (occurrenceCount < maxOccurrences && currentDate < endDate) {
    currentDate = getNextDate(currentDate, this.recurringPattern.frequency);
    
    const sessionData = {
      ...this.toObject(),
      _id: undefined,
      scheduledAt: new Date(currentDate),
      parentSession: this._id,
      status: 'pending'
    };
    
    const newSession = new Session(sessionData);
    await newSession.save();
    
    sessions.push(newSession);
    this.childSessions.push(newSession._id);
    
    occurrenceCount++;
  }
  
  await this.save();
  return sessions;
};

// Index for efficient queries
sessionSchema.index({ mentor: 1, scheduledAt: 1 });
sessionSchema.index({ student: 1, scheduledAt: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });
sessionSchema.index({ 'skill.name': 1, 'skill.category': 1 });

// Pre-save middleware to update completion status
sessionSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
