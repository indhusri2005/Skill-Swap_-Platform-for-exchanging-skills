// We'll get the io instance when it's ready
let io = null;

const setIO = (ioInstance) => {
  io = ioInstance;
};

const getIO = () => io;

// Emit real-time events for admin dashboard
const emitAdminUpdate = (type, data) => {
  if (io && io.sendToAdmins) {
    io.sendToAdmins('admin_update', { type, data });
  }
};

// User-related events
const userCreated = (user) => {
  emitAdminUpdate('user_created', {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isVerified: user.isVerified,
    role: user.role,
    createdAt: user.createdAt
  });
};

const userUpdated = (user) => {
  emitAdminUpdate('user_updated', {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isVerified: user.isVerified,
    role: user.role,
    updatedAt: user.updatedAt
  });
};

const userDeleted = (userId) => {
  emitAdminUpdate('user_deleted', { id: userId });
};

// Session-related events
const sessionCreated = (session) => {
  emitAdminUpdate('session_created', {
    id: session._id,
    mentor: session.mentor,
    student: session.student,
    skillName: session.skillName,
    status: session.status,
    scheduledAt: session.scheduledAt,
    createdAt: session.createdAt
  });
};

const sessionUpdated = (session) => {
  emitAdminUpdate('session_updated', {
    id: session._id,
    status: session.status,
    updatedAt: session.updatedAt
  });
};

const sessionCompleted = (session) => {
  emitAdminUpdate('session_completed', {
    id: session._id,
    mentor: session.mentor,
    student: session.student,
    duration: session.duration,
    completedAt: session.completedAt
  });
};

// Review-related events
const reviewCreated = (review) => {
  emitAdminUpdate('review_created', {
    id: review._id,
    reviewer: review.reviewer,
    reviewee: review.reviewee,
    rating: review.rating,
    createdAt: review.createdAt
  });
};

// Dashboard stats update
const dashboardStatsUpdated = (stats) => {
  emitAdminUpdate('dashboard_stats', stats);
};

// System events
const systemAlert = (alert) => {
  emitAdminUpdate('system_alert', alert);
};

module.exports = {
  setIO,
  getIO,
  userCreated,
  userUpdated,
  userDeleted,
  sessionCreated,
  sessionUpdated,
  sessionCompleted,
  reviewCreated,
  dashboardStatsUpdated,
  systemAlert
};
