const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const InterviewQuestion = require('../models/InterviewQuestion'); // ✅ New Model
const QuizQuestion = require('../models/QuizQuestion'); // ✅ New Model
const verifyAdmin = require('../middleware/adminMiddleware');

router.use(verifyAdmin);

// --- HELPER: Extract YouTube ID ---
const getYoutubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// ==========================================
// 1. DASHBOARD STATS
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments({ status: 'Published' });
    const engagement = await User.aggregate([{ $group: { _id: null, totalPoints: { $sum: "$stats.totalPoints" } } }]);

    res.json([
      { label: "Total Students", value: totalUsers, change: "+5%", trend: "up" },
      { label: "Video Courses", value: totalCourses, change: "+2", trend: "up" },
      { label: "Total XP Earned", value: engagement[0]?.totalPoints || 0, change: "+15%", trend: "up" },
      { label: "System Status", value: "99.9%", change: "Stable", trend: "up" }
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. COURSE MANAGEMENT (YouTube Integrated)
// ==========================================
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { title, instructor, category, videoUrl, level, description } = req.body;
    
    // Auto-generate thumbnail from YouTube URL
    const videoId = getYoutubeId(videoUrl);
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://via.placeholder.com/300';

    const newCourse = new Course({
      title, instructor, category, videoUrl, level, description, thumbnail, status: 'Published'
    });
    
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. USER MANAGEMENT
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('name email role status stats createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.status = user.status === 'Active' ? 'Banned' : 'Active';
    await user.save();
    res.json({ message: `User marked as ${user.status}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. INTERVIEW QUESTION MANAGEMENT (New)
// ==========================================
router.get('/interviews', async (req, res) => {
  try {
    const questions = await InterviewQuestion.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interviews', async (req, res) => {
  try {
    const newQ = new InterviewQuestion(req.body);
    await newQ.save();
    res.status(201).json(newQ);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/interviews/:id', async (req, res) => {
  try {
    await InterviewQuestion.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. QUIZ MODULE MANAGEMENT (New)
// ==========================================
router.get('/quizzes', async (req, res) => {
  try {
    const questions = await QuizQuestion.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quizzes', async (req, res) => {
  try {
    const newQ = new QuizQuestion(req.body);
    await newQ.save();
    res.status(201).json(newQ);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/quizzes/:id', async (req, res) => {
  try {
    await QuizQuestion.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SUPER ADMIN ONLY: CHANGE USER ROLE
// ==========================================
router.put('/users/:id/role', async (req, res) => {
  try {
    // 1. Check if the person making the request is a superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: "Access Denied: Only Super Admins can assign roles." });
    }

    // 2. Prevent the superadmin from accidentally demoting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: "You cannot change your own Super Admin status." });
    }

    const { newRole } = req.body; // e.g., 'admin' or 'student'
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    targetUser.role = newRole;
    await targetUser.save();
    
    res.json({ message: `User promoted to ${newRole}`, user: targetUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;