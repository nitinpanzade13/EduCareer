const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructor: { type: String, required: true }, // e.g., Channel Name
  category: { type: String, required: true },
  
  // 📺 YOUTUBE INTEGRATION
  videoUrl: { type: String, required: true }, 
  thumbnail: { type: String, default: '' }, // Will be auto-generated from URL
  description: { type: String, default: '' },
  
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  
  studentsEnrolled: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['Published', 'Draft', 'Archived'], 
    default: 'Draft' 
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);