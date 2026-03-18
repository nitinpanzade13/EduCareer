const mongoose = require('mongoose');

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true }, // Indexed for search
  location: {
    city: String,
    state: String,
    country: String
  },
  rating: Number, // From your CSV
  establishedYear: Number,
  university: String,
  collegeType: String, // Public/Private
  
  // Financials & Stats
  averageFees: Number,
  totalEnrollment: Number,
  campusSize: String,
  
  // Lists
  courses: [String],
  facilities: [String],
  
  // Media
  image: { type: String, default: "https://images.unsplash.com/photo-1562774053-701939374585?w=400" }
});

module.exports = mongoose.model('College', CollegeSchema);