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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SkillSwap API is running' });
});

// Socket.IO connection handling
socketHandler(io);

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, io };
