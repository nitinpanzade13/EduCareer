const express = require('express');
const router = express.Router();
const User = require('../models/User');

const Course = require('../models/Course');
const QuizQuestion = require('../models/QuizQuestion');

// 1. POST: Sync User (Login/Signup)
router.post('/sync', async (req, res) => {
  const { uid, email, name, photoURL } = req.body;
  try {
    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({ 
        uid, email, name, profilePicture: photoURL || '',
        // Default data for new users
        stats: { profileComplete: 15, coursesStarted: 0, badgesEarned: 0, totalPoints: 0 },
        recentActivities: [{ text: "Joined EduCareer", points: "+10", type: "badge" }],
        upcomingTasks: [{ title: "Complete Profile", deadline: "Today", priority: "High" }]
      });
      await user.save();
      return res.status(201).json(user);
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. GET: Fetch User Data
router.get('/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. PUT: Update Profile (✅ UPDATED to accept all fields)
router.put('/:uid', async (req, res) => {
  try {
    const updateData = req.body; // Capture ALL data sent from frontend (bio, location, etc.)
    
    const updatedUser = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { $set: updateData }, // Updates any field passed in the body
      { new: true, runValidators: true } // Returns the updated document & checks schema
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST: Award a badge to a user after passing a quiz
router.post('/:uid/award-badge', async (req, res) => {
  try {
    const { courseName } = req.body;
    const user = await User.findOne({ uid: req.params.uid });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if they already have this badge
    const alreadyHasBadge = user.earnedBadges.some(b => b.courseName === courseName);
    if (alreadyHasBadge) {
      return res.status(200).json({ message: "Badge already earned!", user });
    }

    // Add badge and update stats
    user.earnedBadges.push({ courseName, icon: 'Award' });
    user.stats.badgesEarned += 1;
    await user.save();

    res.status(200).json({ message: "Badge awarded successfully! 🏆", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PUBLIC CONTENT ROUTES (For Students)
// ==========================================

// GET all published courses
router.get('/content/courses', async (req, res) => {
  try {
    const courses = await Course.find({ status: 'Published' }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all quizzes
router.get('/content/quizzes', async (req, res) => {
  try {
    const quizzes = await QuizQuestion.find();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;