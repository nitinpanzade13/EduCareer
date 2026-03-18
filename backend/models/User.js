const mongoose = require('mongoose');

// Sub-schemas for cleaner structure
const activitySchema = new mongoose.Schema({
  text: String,
  time: { type: Date, default: Date.now },
  points: String,
  type: String // 'quiz', 'badge', 'goal', 'course'
});

const taskSchema = new mongoose.Schema({
  title: String,
  deadline: String,
  priority: { type: String, enum: ['High', 'Medium', 'Low'] }
});

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'admin', 'superadmin', 'instructor'],
    default: 'student' 
  },
  
  // 🆕 NEW PROFILE FIELDS (Added for 100% Completion)
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  github: { type: String, default: "" },
  education: { type: String, default: "" },
  experience: { type: String, default: "" },
  // --------------------------------------------------

  skills: [String],
  profilePicture: { type: String, default: '' },
  
  // 📊 Stats
  stats: {
    profileComplete: { type: Number, default: 15 },
    coursesStarted: { type: Number, default: 0 },
    badgesEarned: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 }
  },
  
  earnedBadges: [{
    courseName: String,
    icon: { type: String, default: 'Trophy' },
    earnedAt: { type: Date, default: Date.now }
  }],

  // 🕒 Activity & Tasks
  recentActivities: { type: [activitySchema], default: [] },
  upcomingTasks: { type: [taskSchema], default: [] },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);