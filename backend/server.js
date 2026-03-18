require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const adminRoutes = require('./routes/adminRoutes'); // ✅ NEW: Admin Routes

const chatController = require('./controllers/chatController');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    
    // Register Models
    require('./models/User');
    require('./models/Resume');
    require('./models/College');
    require('./models/CollegeCutoff');
    require('./models/UserSkill');
    require('./models/Course'); 
    require('./models/InterviewQuestion');
    require('./models/QuizQuestion');
    console.log('✅ All Database Models Registered');
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/admin', adminRoutes); // ✅ NEW: Mount Admin API

app.get('/', (req, res) => {
  res.send('API is Running...');
});

app.post('/api/chat', chatController.chatWithGemini);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));