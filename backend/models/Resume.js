const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema({
  company: String,
  position: String,
  duration: String,
  description: String
});

const EducationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  year: String,
  grade: String
});

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateId: { type: String, default: 'modern' }, // modern, professional, creative
  
  // Resume Data Fields
  name: String,
  email: String,
  phone: String,
  location: String,
  linkedin: String,
  github: String,
  summary: String,
  
  experience: [ExperienceSchema],
  projects: [ExperienceSchema],
  education: [EducationSchema],
  skills: [String],
  achievements: [String],
  
  atsScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);