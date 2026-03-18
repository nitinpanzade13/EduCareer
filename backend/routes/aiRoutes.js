const express = require('express');
const router = express.Router();
const { generateAIResponse } = require('../controllers/aiController');

// POST /api/ai/ask
router.post('/ask', generateAIResponse);

module.exports = router;