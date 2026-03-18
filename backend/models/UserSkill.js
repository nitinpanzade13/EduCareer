const mongoose = require('mongoose');

const UserSkillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // List of skills with proficiency
  skills: [{
    name: String, // e.g., "Python"
    level: { type: Number, default: 0 }, // 0-100
    verified: { type: Boolean, default: false } // Verified via Assessment?
  }],
  
  // Assessment History
  assessments: [{
    skillName: String,
    score: Number,
    date: { type: Date, default: Date.now }
  }],
  
  // Career Goal
  targetCareer: String, // e.g., "Data Scientist"
  recommendedCourses: [{
    title: String,
    provider: String,
    url: String
  }]
});

module.exports = mongoose.model('UserSkill', UserSkillSchema);