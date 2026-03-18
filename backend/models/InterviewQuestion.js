const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  question: { type: String, required: true },
  category: { type: String, enum: ['hr', 'frontend', 'backend'], required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InterviewQuestion', schema);