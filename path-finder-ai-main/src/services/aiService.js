import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_URL = 'http://localhost:5000/api/ai';

// Initialize Gemini directly for Job Matching (Optional: if you want frontend-direct calls)
// OR keep using your backend API_URL if you prefer security.
// For this example, I will stick to your existing axios pattern for consistency.

// --- 1. Aggressive Text Cleaner ---
const cleanResumeText = (text) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Fix "PuneCGPA"
    .replace(/([a-zA-Z])(\d)/g, '$1 $2') // Fix "Khamgaon86"
    .replace(/^(SUMMARY|RESUME|CURRICULUM VITAE|PROFILE)$/im, "")
    .replace(/\n/g, " | ")
    .replace(/\s+/g, " ")
    .trim();
};

// --- 2. JSON Extractor ---
const extractJsonFromText = (text) => {
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    const result = JSON.parse(clean);
    
    // Sometimes Gemini returns a top-level array instead of an object
    // If we get an array, check if the first item is our object, or wrap it
    if (Array.isArray(result)) {
        return result[0] || {}; 
    }
    return result;
  } catch (e) {
    return null;
  }
};

// --- 3. Manual Fallback ---
const manualFallbackParser = (text) => {
  console.warn("⚠️ AI Failed. Using Regex Fallback.");
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/);
  
  const lines = text.split('\n').filter(l => l.trim().length > 3);
  let name = lines[0] || "Candidate Name";

  return {
    name,
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    linkedin: linkedinMatch ? linkedinMatch[0] : "",
    summary: "",
    skills: [],
    experience: [],
    projects: [], 
    education: [],
    achievements: []
  };
};

// --- 4. Generic AI Request ---
export const askAI = async (prompt) => {
  try {
    const response = await axios.post(`${API_URL}/ask`, { 
      prompt, 
      max_tokens: 3000
    });
    
    if (response.data.success) return response.data.data;
    if (response.data.result) return response.data.result;
    return null;
  } catch (error) {
    console.error("AI Connection Error:", error);
    return null;
  }
};

// --- 5. Main Resume Parser ---
export const parseResumeWithAI = async (resumeText) => {
  const cleanText = cleanResumeText(resumeText);
  console.log("Sending to AI:", cleanText.slice(0, 100));

  const prompt = `
    You are a Data Extraction Engine. Extract resume details into strict JSON.
    
    CRITICAL RULES:
    1. **NAME**: The name is the very first 2-3 words. It is NOT "Summary".
    2. **PROJECTS**: Extract the "PROJECTS" section carefully.
       - "VitalNex" and "AI-Powered Interview System" are PROJECTS, not just text.
    3. **EDUCATION**: Split "Pune CGPA" -> "Institution: Pune, Grade: CGPA".
    4. Provide ONLY the JSON object. No markdown.

    Required JSON Structure:
    {
      "name": "Full Name",
      "email": "Email",
      "phone": "Phone",
      "location": "City",
      "linkedin": "Url",
      "github": "Url",
      "summary": "Summary text",
      "skills": ["Skill1", "Skill2"],
      "experience": [
        { "id": "1", "company": "Company Name", "position": "Role", "duration": "Dates", "description": "Details" }
      ],
      "projects": [
        { "id": "1", "name": "Project Name", "tech": "Technologies used", "description": "What it does" }
      ],
      "education": [
        { "id": "1", "institution": "College Name", "degree": "Degree", "year": "Year", "grade": "Score" }
      ],
      "achievements": ["Achievement 1"]
    }

    Resume Text:
    "${cleanText.slice(0, 6000)}"
  `;

  const rawOutput = await askAI(prompt);

  if (rawOutput) {
    console.log("🤖 AI Response:", rawOutput);
    const parsedData = extractJsonFromText(rawOutput);
    
    if (parsedData) {
      if (!parsedData.name || parsedData.name.toLowerCase().includes("summary")) {
        const fallback = manualFallbackParser(resumeText);
        parsedData.name = fallback.name;
      }
      return parsedData;
    }
  }

  return manualFallbackParser(resumeText);
};

// --- 6. Resume Improver ---
export const improveResumeText = async (currentText) => {
  const prompt = `Rewrite this resume section to be professional, impactful, and concise. Use strong action verbs. Do not add markdown or "Here is the improved text":\n"${currentText}"`;
  return await askAI(prompt);
};

// --- 7. Job Recommendation Engine (NEW) ---
export const getJobRecommendations = async (resumeData) => {
  // We construct a prompt specifically for job matching
  const context = `
    Name: ${resumeData.name}
    Skills: ${resumeData.skills.join(", ")}
    Summary: ${resumeData.summary}
    Experience: ${resumeData.experience.map(e => `${e.position} at ${e.company}`).join(", ")}
    Education: ${resumeData.education.map(e => `${e.degree}`).join(", ")}
  `;

  const prompt = `
    Act as an expert AI Career Counselor. Based on the following resume profile, suggest 4 specific job roles that would be a high match.
    
    Resume Context:
    ${context}

    Output Requirements:
    - Provide exactly 4 job recommendations.
    - Return ONLY a JSON array. Do not include markdown formatting like \`\`\`json.
    - Use this specific schema for each object:
      {
        "title": "Job Title",
        "company": "A realistic top company name for this role",
        "location": "A major tech hub city in India (e.g. Bangalore, Pune, Hyderabad, Remote)",
        "match": number (0-100 based on skill fit),
        "salary": "Estimated salary range in LPA (e.g. ₹12-18 LPA)"
      }
  `;

  const rawOutput = await askAI(prompt);
  
  if (rawOutput) {
      // Use our safe extractor to get the JSON array
      const jobs = extractJsonFromText(rawOutput);
      
      // Ensure we always return an array, even if Gemini wraps it in an object like { jobs: [...] }
      if (Array.isArray(jobs)) return jobs;
      if (jobs && Array.isArray(jobs.jobs)) return jobs.jobs;
      if (jobs && Array.isArray(jobs.recommendations)) return jobs.recommendations;
  }

  // Fallback if AI fails
  return [
    { title: "Frontend Developer", company: "Tech Corp", location: "Remote", match: 85, salary: "₹8-12 LPA" },
    { title: "Software Engineer", company: "StartUp Inc", location: "Bangalore", match: 80, salary: "₹10-15 LPA" }
  ];
};