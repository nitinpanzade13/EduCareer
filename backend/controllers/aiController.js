const axios = require('axios');

exports.generateAIResponse = async (req, res) => {
  // Destructure max_tokens from the request body
  const { prompt, max_tokens } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // Forward the request to Python AI
    // use passed max_tokens OR default to 2000 (Resume parsing needs high limits)
    const pythonResponse = await axios.post('http://127.0.0.1:8000/generate', {
      prompt: prompt,
      max_tokens: max_tokens || 2500 
    });

    // Send the AI's text back to the React Frontend
    res.status(200).json({ 
      success: true,
      data: pythonResponse.data.response 
    });

  } catch (error) {
    console.error("❌ AI Service Error:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: "AI Service is currently offline. Please try again later." 
      });
    }
    
    res.status(500).json({ error: "Failed to generate AI response" });
  }
};