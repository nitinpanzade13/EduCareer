const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  category: { type: String, required: true }, // e.g., 'python', 'dsa'
  type: { type: String, enum: ['mcq', 'code', 'descriptive'], default: 'mcq' },
  question: { type: String, required: true },
  options: [String], // Only for MCQs
  correct: Number,   // Index of correct option
  explanation: String, // For Practice Mode
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizQuestion', schema);