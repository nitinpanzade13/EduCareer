const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

// Route: POST /api/interview/analyze
router.post('/analyze', interviewController.analyzeInterview);

module.exports = router;