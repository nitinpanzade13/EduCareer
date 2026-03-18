const mongoose = require('mongoose');

const CollegeCutoffSchema = new mongoose.Schema({
  college_name: { type: String, index: true }, // Matches College.name
  branch: String,
  seat_type: String, // e.g., AI, OPEN, TFWS
  score_type: { type: String, enum: ['JEE(Main)', 'MHT-CET'] },
  
  // Statistics
  min: Number, // The cutoff score
  max: Number,
  mean: Number,
  count: Number
});

// Compound index for fast prediction queries
// User searches by: Score Type + Score > Min
CollegeCutoffSchema.index({ score_type: 1, min: 1 }); 

module.exports = mongoose.model('CollegeCutoff', CollegeCutoffSchema);