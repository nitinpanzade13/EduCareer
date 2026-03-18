// backend/controllers/chatController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with your API Key
// ⚠️ IMPORTANT: In a real app, use process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI("AIzaSyA-OqiBjEbq9-u3OzNaQcnGdBXc7zLuzsQ"); 

exports.chatWithGemini = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Use the Flash model for speed
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

    // Add system instruction for persona
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are an expert AI Career Advisor. Help students with colleges, skills, and resumes. Be concise and helpful." }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to help students navigate their careers." }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error("❌ Gemini Error:", error);
    res.status(500).json({ error: "AI Service failed. Please try again." });
  }
};