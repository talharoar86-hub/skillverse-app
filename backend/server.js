const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./config/passport');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_fallback',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io integration
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('typing', ({ postId, userName }) => {
    socket.to(postId).emit('user_typing', { postId, userName });
  });

  socket.on('stop_typing', ({ postId }) => {
    socket.to(postId).emit('user_stop_typing', { postId });
  });

  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room`);
  });

  // Messaging events
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on('typing_message', ({ conversationId, userName }) => {
    socket.to(conversationId).emit('user_typing_message', { conversationId, userName });
  });

  socket.on('stop_typing_message', ({ conversationId }) => {
    socket.to(conversationId).emit('user_stop_typing_message', { conversationId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Pass io to routes
app.set('io', io);

// Middleware to check MongoDB connection
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1 && req.path.startsWith('/api')) {
    return res.status(503).json({ 
      message: 'Database connection is not established. Please ensure MongoDB is running.' 
    });
  }
  next();
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../', 'frontend', 'dist', 'index.html'))
  );
}

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/follow', require('./routes/followRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/mentor', require('./routes/mentorRoutes'));
app.use('/api/mentorship', require('./routes/mentorshipRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/enrollment', require('./routes/enrollmentRoutes'));
app.use('/api/exchange', require('./routes/exchangeRoutes'));
app.use('/api/feed', require('./routes/feedRoutes'));

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillVerse API is running' });
});

// 404 Diagnostic Handler (MUST BE LAST)
app.use((req, res, next) => {
  res.status(404).json({ 
    message: 'Route not found on SkillVerse API',
    method: req.method,
    url: req.url,
    path: req.path
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 SkillVerse Server Ready on Port ${PORT}`);
  console.log(`========================================`);
});

