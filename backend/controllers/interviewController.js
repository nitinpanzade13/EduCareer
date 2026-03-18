const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeInterview = async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "Missing question or answer" });
  }

  try {
    // Use the Flash model for speed
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Technical Interview Coach.
      
      Context:
      - Interview Question: "${question}"
      - Candidate's Answer (Transcribed): "${answer}"
      
      Task:
      Analyze the answer and provide structured feedback.
      
      Output Schema (JSON only):
      {
        "rating": number (1-10),
        "sentiment": string (e.g., "Confident", "Hesitant", "Neutral", "Excited"),
        "feedback": string (Concise, constructive advice in 2-3 sentences max. Focus on clarity and technical accuracy.)
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up if Gemini wraps output in markdown code blocks
    if (text.startsWith("```json")) {
      text = text.replace(/```json/g, "").replace(/```/g, "");
    }

    const analysis = JSON.parse(text);
    res.json(analysis);

  } catch (error) {
    console.error("❌ Gemini Interview Analysis Error:", error);
    res.status(500).json({ 
      error: "AI Analysis failed", 
      details: error.message 
    });
  }
};