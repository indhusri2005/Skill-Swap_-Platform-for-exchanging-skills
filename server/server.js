const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:8081",
      "http://172.29.80.1:8080",
      "http://172.29.80.1:8081"
    ],
    methods: ["GET", "POST"]
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const skillRoutes = require('./routes/skills');
const sessionRoutes = require('./routes/sessions');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

// Import socket handlers
const socketHandler = require('./sockets/socketHandler');

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://172.29.80.1:8080",
    "http://172.29.80.1:8081"
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SkillSwap API is running' });
});

// Socket.IO connection handling
const ioInstance = socketHandler(io);

// Initialize real-time events with io instance
const realTimeEvents = require('./utils/realTimeEvents');
realTimeEvents.setIO(ioInstance);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log(`Database: ${MONGODB_URI}`);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  console.log('\n🔧 To fix this issue:');
  console.log('1. Install MongoDB locally, OR');
  console.log('2. Use MongoDB Atlas (cloud), OR'); 
  console.log('3. Use Docker: docker run -d -p 27017:27017 mongo');
  console.log('\nFor now, starting server without database...');
  // Don't exit, let server run for static files
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, io };
