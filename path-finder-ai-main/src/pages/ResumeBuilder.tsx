import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, ArrowLeft, Plus, Trash2, Download, Eye,
  Sparkles, CheckCircle, AlertCircle, Briefcase, GraduationCap,
  Award, Code, Mail, Phone, MapPin, Linkedin, Github,
  Zap, LayoutTemplate, Loader2, Upload, PenTool, X, Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
// --- AI SERVICE IMPORT ---
import { improveResumeText, parseResumeWithAI, getJobRecommendations } from '../services/aiService';

// --- PDF WORKER CONFIG ---
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// --- INTERFACES ---
interface Experience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
  grade: string;
}

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  achievements: string[];
}

interface AtsAnalysis {
  score: number;
  suggestions: { type: "success" | "warning" | "error"; text: string }[];
}

// ✅ NEW INTERFACE FOR JOBS
interface JobRecommendation {
  title: string;
  company: string;
  location: string;
  match: number;
  salary: string;
}

const initialResumeData: ResumeData = {
  name: "Your Name",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  achievements: []
};

const templates = [
  { id: "modern", name: "Modern", color: "bg-blue-600" },
  { id: "professional", name: "Professional", color: "bg-gray-800" },
  { id: "creative", name: "Creative", color: "bg-purple-600" },
];

export default function ResumeBuilder() {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [showPreview, setShowPreview] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const resumeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [atsAnalysis, setAtsAnalysis] = useState<AtsAnalysis>({ score: 0, suggestions: [] });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ✅ NEW STATE FOR JOBS
  const [matchingJobs, setMatchingJobs] = useState<JobRecommendation[]>([]);
  const [isFetchingJobs, setIsFetchingJobs] = useState(false);

  // --- TEXT EXTRACTION ---
  const extractText = async (file: File): Promise<string> => {
    const fileType = file.type;

    if (fileType === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    }
    else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    throw new Error("Unsupported file type");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await extractText(file);
      
      if (text) {
        toast({ title: "Reading Resume...", description: "AI is extracting Projects & Experience..." });
        const aiData = await parseResumeWithAI(text);

        if (aiData) {
            const rawExperience = Array.isArray(aiData.experience) ? aiData.experience : [];
            const rawProjects = Array.isArray(aiData.projects) ? aiData.projects : [];

            const formattedProjects = rawProjects.map((proj: any, index: number) => ({
                id: `proj-${Date.now()}-${index}`,
                company: proj.name || "Project",
                position: "Personal Project",
                duration: proj.tech || "",
                description: proj.description || ""
            }));

            const combinedExperience = [...rawExperience, ...formattedProjects];

            setResumeData(prev => ({
                ...prev,
                name: aiData.name || prev.name,
                email: aiData.email || prev.email,
                phone: aiData.phone || prev.phone,
                location: aiData.location || prev.location,
                linkedin: aiData.linkedin || prev.linkedin,
                github: aiData.github || prev.github,
                summary: aiData.summary || prev.summary,
                skills: Array.isArray(aiData.skills) ? aiData.skills : [],
                experience: combinedExperience,
                education: Array.isArray(aiData.education) ? aiData.education.map((e: any, i: number) => ({
                    id: Date.now() + i + "edu",
                    institution: e.institution || "Institute",
                    degree: e.degree || "Degree",
                    year: e.year || "",
                    grade: e.grade || ""
                })) : [],
                achievements: Array.isArray(aiData.achievements) ? aiData.achievements : []
            }));
            
            toast({ title: "Success", description: "Projects and Experience loaded!" });
        }
      }
    } catch (error) {
      console.error("Parse Error:", error);
      toast({ title: "Parsing Failed", description: "Could not read the file correctly.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- ATS LOGIC ---
  useEffect(() => {
    const calculateATS = () => {
      let score = 0;
      const suggestions: AtsAnalysis["suggestions"] = [];

      if (resumeData.name && resumeData.email) {
        score += 20;
        suggestions.push({ type: "success", text: "Contact info present" });
      } else {
        suggestions.push({ type: "error", text: "Missing contact details" });
      }

      if (resumeData.summary.length > 50) {
        score += 15;
        suggestions.push({ type: "success", text: "Summary looks good" });
      } else {
        suggestions.push({ type: "warning", text: "Summary is too short" });
      }

      if (resumeData.experience.length > 0) {
        score += 25;
        suggestions.push({ type: "success", text: "Experience/Projects found" });
      } else {
        suggestions.push({ type: "error", text: "Add work experience or projects" });
      }

      if (resumeData.skills.length >= 5) {
        score += 20;
        suggestions.push({ type: "success", text: "Good skill set" });
      } else {
        suggestions.push({ type: "warning", text: "Add at least 5 skills" });
      }

      if (resumeData.linkedin) score += 10;
      if (resumeData.github) score += 10;

      setAtsAnalysis({ score, suggestions });
    };

    const timer = setTimeout(calculateATS, 500);
    return () => clearTimeout(timer);
  }, [resumeData]);

  // --- AI ACTIONS ---
  const aiImprove = async () => {
    if (!resumeData.summary || resumeData.summary.length < 10) {
      toast({ title: "Summary too short", description: "Please write a draft first.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const improvedText = await improveResumeText(resumeData.summary);
      if (improvedText) {
        setResumeData(prev => ({ ...prev, summary: improvedText }));
        toast({ title: "✨ AI Magic Complete", description: "Summary optimized." });
      }
    } catch (error) {
      toast({ title: "AI Error", description: "Failed to connect to AI.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ✅ NEW: FIND JOBS HANDLER
  const handleFindJobs = async () => {
    if (resumeData.skills.length === 0 && !resumeData.summary) {
        toast({ title: "Incomplete Profile", description: "Add skills or summary to find jobs.", variant: "destructive" });
        return;
    }

    setIsFetchingJobs(true);
    setMatchingJobs([]); // Clear previous results

    try {
        const jobs = await getJobRecommendations(resumeData);
        setMatchingJobs(jobs);
        toast({ title: "Jobs Found!", description: "AI matched your profile with relevant roles." });
    } catch (error) {
        console.error(error);
        toast({ title: "Search Failed", description: "Could not fetch jobs at this time.", variant: "destructive" });
    } finally {
        setIsFetchingJobs(false);
    }
  };

  // --- HELPER FUNCTIONS ---
  const addExperience = () => {
    setResumeData({ ...resumeData, experience: [...resumeData.experience, { id: Date.now().toString(), company: "", position: "", duration: "", description: "" }] });
  };

  const addEducation = () => {
    setResumeData({ ...resumeData, education: [...resumeData.education, { id: Date.now().toString(), institution: "", degree: "", year: "", grade: "" }] });
  };

  const addSkill = () => {
    if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
      setResumeData({ ...resumeData, skills: [...resumeData.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const downloadPDF = async () => {
    if (!resumeRef.current) return;
    try {
      const canvas = await html2canvas(resumeRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("resume.pdf");
    } catch (e) {
      console.error(e);
    }
  };

  // --- TEMPLATES (Kept concise for brevity, logic unchanged) ---
  const ModernTemplate = () => (
    <div className="bg-white text-gray-800 h-full min-h-[1000px] w-full flex font-sans">
      <div className="w-1/3 bg-slate-900 text-white p-8 space-y-6">
        <h1 className="text-3xl font-bold uppercase break-words">{resumeData.name || "Name"}</h1>
        <div className="space-y-2 text-sm opacity-90 break-words">
          <p>{resumeData.email}</p><p>{resumeData.phone}</p><p>{resumeData.location}</p>
          <p className="text-xs text-blue-300">{resumeData.linkedin}</p><p className="text-xs text-blue-300">{resumeData.github}</p>
        </div>
        <div className="pt-4 border-t border-slate-700">
          <h3 className="font-bold mb-2 text-blue-400">SKILLS</h3>
          <div className="flex flex-wrap gap-2">{resumeData.skills.map((s, i) => <span key={i} className="bg-slate-800 px-2 py-1 text-xs rounded">{s}</span>)}</div>
        </div>
      </div>
      <div className="w-2/3 p-10 space-y-6">
        <div><h2 className="font-bold border-b-2 border-slate-900 pb-1 mb-2">PROFILE</h2><p className="text-sm">{resumeData.summary}</p></div>
        <div><h2 className="font-bold border-b-2 border-slate-900 pb-1 mb-2">EXPERIENCE</h2>{resumeData.experience.map((exp, i) => (<div key={i} className="mb-4"><h3 className="font-bold">{exp.company}</h3><p className="text-sm text-blue-600 font-medium">{exp.position}</p><p className="text-sm text-gray-600 mt-1">{exp.description}</p></div>))}</div>
        <div><h2 className="font-bold border-b-2 border-slate-900 pb-1 mb-2">EDUCATION</h2>{resumeData.education.map((edu, i) => (<div key={i} className="mb-2"><h3 className="font-bold text-sm">{edu.institution}</h3><p className="text-xs text-gray-600">{edu.degree} • {edu.year}</p></div>))}</div>
      </div>
    </div>
  );

  const ProfessionalTemplate = () => (
    <div className="bg-white text-gray-900 h-full min-h-[1000px] w-full p-12 font-serif">
      <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
        <h1 className="text-4xl font-bold mb-2 uppercase tracking-wide">{resumeData.name}</h1>
        <div className="flex justify-center gap-3 text-sm flex-wrap"><span>{resumeData.email}</span><span>•</span><span>{resumeData.phone}</span></div>
      </div>
      <div className="space-y-6">
        <section><h3 className="font-bold uppercase tracking-widest border-b-2 border-gray-200 mb-3 pb-1 text-sm">Profile</h3><p className="text-sm leading-relaxed text-gray-700">{resumeData.summary}</p></section>
        <section><h3 className="font-bold uppercase tracking-widest border-b-2 border-gray-200 mb-3 pb-1 text-sm">Skills</h3><div className="text-sm text-gray-800">{resumeData.skills.join(" • ")}</div></section>
        <section><h3 className="font-bold uppercase tracking-widest border-b-2 border-gray-200 mb-3 pb-1 text-sm">Experience</h3>{resumeData.experience.map((exp, i) => (<div key={i} className="mb-5"><div className="flex justify-between"><h4 className="font-bold">{exp.company}</h4><span className="text-xs text-gray-500">{exp.duration}</span></div><p className="italic text-sm text-gray-600">{exp.position}</p><p className="text-sm text-gray-700">{exp.description}</p></div>))}</section>
      </div>
    </div>
  );

  const CreativeTemplate = () => (
    <div className="bg-white h-full min-h-[1000px] w-full shadow-lg p-0 relative overflow-hidden font-sans">
      <div className="bg-purple-700 text-white p-12 pb-24 clip-path-slant"><h1 className="text-5xl font-extrabold">{resumeData.name}</h1><p className="text-purple-200 mt-2">{resumeData.email}</p></div>
      <div className="px-12 -mt-10 grid grid-cols-3 gap-10 relative z-10">
        <div className="col-span-2 space-y-8 bg-white p-6 rounded-lg shadow-sm">
          <div><h3 className="text-purple-700 font-bold uppercase mb-2">Profile</h3><p className="text-gray-600">{resumeData.summary}</p></div>
          <div><h3 className="text-purple-700 font-bold uppercase mb-2">Experience</h3>{resumeData.experience.map((exp, i) => (<div key={i} className="mb-4 border-l-2 border-purple-200 pl-4"><h4 className="font-bold text-gray-800">{exp.company}</h4><p className="text-purple-600 text-sm mb-1">{exp.position}</p><p className="text-gray-600 text-sm">{exp.description}</p></div>))}</div>
        </div>
        <div className="col-span-1 space-y-6 pt-6"><div className="bg-purple-50 p-4 rounded-xl"><h3 className="text-purple-800 font-bold mb-2">Skills</h3><div className="flex flex-wrap gap-2">{resumeData.skills.map((s, i) => <span key={i} className="bg-white px-2 py-1 text-xs rounded text-purple-700">{s}</span>)}</div></div></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><ArrowLeft className="w-5 h-5" /> Back</Link>
            <h1 className="text-xl font-bold hidden md:block">Resume Builder</h1>
          </div>
          <div className="flex gap-3">
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isUploading ? "Scanning..." : "Upload & Auto-Fill"}
            </Button>
            <Button variant="hero" onClick={downloadPDF}><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT SIDEBAR - ATS & EDITOR */}
          <div className={`lg:col-span-5 space-y-6 ${showPreview ? 'hidden lg:block' : 'block'}`}>

            {/* ATS Score Card */}
            <div className={`bg-card rounded-2xl border border-border p-6 shadow-sm transition-all ${isAnalyzing ? 'ring-2 ring-primary ring-opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">ATS Score</h3>
                <Sparkles className={`w-5 h-5 text-primary ${isAnalyzing ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${atsAnalysis.score * 2.51} 251`} className="text-primary transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-foreground">{atsAnalysis.score}</span></div>
                </div>
                <div><p className="text-sm text-muted-foreground">Your resume is</p><p className="font-semibold text-foreground">{atsAnalysis.score >= 80 ? "Excellent" : atsAnalysis.score >= 60 ? "Good" : "Needs Work"}</p></div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {atsAnalysis.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {suggestion.type === "success" && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
                    {suggestion.type === "warning" && <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                    {suggestion.type === "error" && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                    <span className={`${suggestion.type === "success" ? "text-green-700" : suggestion.type === "warning" ? "text-amber-700" : "text-red-700"}`}>{suggestion.text}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary/5" onClick={aiImprove} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                {isAnalyzing ? "Optimizing..." : "AI Improve Resume"}
              </Button>
            </div>

            {/* ✅ JOB RECOMMENDATIONS (GEMINI POWERED) */}
            <div className="bg-card rounded-2xl border border-border p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Matching Jobs</h3>
                {matchingJobs.length > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{matchingJobs.length} matches</span>}
              </div>

              {matchingJobs.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">Click below to find jobs matching your resume profile.</p>
                    <Button onClick={handleFindJobs} disabled={isFetchingJobs} className="w-full">
                        {isFetchingJobs ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Search className="w-4 h-4 mr-2"/>}
                        {isFetchingJobs ? "AI is Searching..." : "Find AI Matched Jobs"}
                    </Button>
                </div>
              ) : (
                <div className="space-y-3">
                    {matchingJobs.map((job, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-primary/20">
                        <div className="flex items-start justify-between">
                        <div>
                            <p className="font-medium text-foreground">{job.title}</p>
                            <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                            <p className="text-xs text-primary mt-1 font-bold">{job.salary}</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-sm font-bold ${job.match > 85 ? 'text-green-600' : 'text-amber-600'}`}>{job.match}%</span>
                            <p className="text-[10px] text-muted-foreground uppercase">Match</p>
                        </div>
                        </div>
                    </div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-muted-foreground hover:text-primary" onClick={handleFindJobs}>
                        Refresh Recommendations
                    </Button>
                </div>
              )}
            </div>

            {/* EDITOR FORM */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="font-bold mb-4 flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-primary" /> Select Template</h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {templates.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`p-2 rounded-lg border-2 text-center transition-all ${selectedTemplate === t.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}>
                    <div className={`w-full h-12 rounded mb-2 ${t.color} opacity-80 mx-auto shadow-sm`}></div>
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {[{ id: "personal", label: "Personal", icon: Mail }, { id: "experience", label: "Exp", icon: Briefcase }, { id: "education", label: "Edu", icon: GraduationCap }, { id: "skills", label: "Skills", icon: Code }, { id: "achievements", label: "Awards", icon: Award }].map((tab) => (
                  <Button key={tab.id} variant={activeSection === tab.id ? "hero" : "ghost"} size="sm" onClick={() => setActiveSection(tab.id)}>
                    <tab.icon className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">{tab.label}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {activeSection === "personal" && (
                  <div className="space-y-4">
                    <Input placeholder="Full Name" value={resumeData.name} onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })} />
                    <Input placeholder="Email" value={resumeData.email} onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })} />
                    <Input placeholder="Phone" value={resumeData.phone} onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })} />
                    <Input placeholder="Location" value={resumeData.location} onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })} />
                    <Input placeholder="LinkedIn URL" value={resumeData.linkedin} onChange={(e) => setResumeData({ ...resumeData, linkedin: e.target.value })} />
                    <Input placeholder="GitHub URL" value={resumeData.github} onChange={(e) => setResumeData({ ...resumeData, github: e.target.value })} />
                    <Textarea placeholder="Professional Summary" rows={4} value={resumeData.summary} onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })} />
                  </div>
                )}

                {activeSection === "experience" && (
                  <div className="space-y-6">
                    {resumeData.experience.map((exp, index) => (
                      <div key={exp.id} className="p-4 border rounded-lg bg-muted/20 relative group">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setResumeData({ ...resumeData, experience: resumeData.experience.filter((_, i) => i !== index) })}><Trash2 className="w-4 h-4" /></Button>
                        <Input className="mb-2 font-bold" placeholder="Company/Project" value={exp.company} onChange={(e) => { const updated = [...resumeData.experience]; updated[index].company = e.target.value; setResumeData({ ...resumeData, experience: updated }); }} />
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Input placeholder="Position" value={exp.position} onChange={(e) => { const updated = [...resumeData.experience]; updated[index].position = e.target.value; setResumeData({ ...resumeData, experience: updated }); }} />
                          <Input placeholder="Duration" value={exp.duration} onChange={(e) => { const updated = [...resumeData.experience]; updated[index].duration = e.target.value; setResumeData({ ...resumeData, experience: updated }); }} />
                        </div>
                        <Textarea placeholder="Description" value={exp.description} onChange={(e) => { const updated = [...resumeData.experience]; updated[index].description = e.target.value; setResumeData({ ...resumeData, experience: updated }); }} />
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={addExperience}><Plus className="w-4 h-4 mr-2" /> Add Experience/Project</Button>
                  </div>
                )}

                {activeSection === "education" && (
                  <div className="space-y-6">
                    {resumeData.education.map((edu, index) => (
                      <div key={edu.id} className="p-4 border rounded-lg bg-muted/20 relative group">
                         <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setResumeData({ ...resumeData, education: resumeData.education.filter((_, i) => i !== index) })}><Trash2 className="w-4 h-4" /></Button>
                        <Input className="mb-2" placeholder="Institution" value={edu.institution} onChange={(e) => { const updated = [...resumeData.education]; updated[index].institution = e.target.value; setResumeData({ ...resumeData, education: updated }); }} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Degree" value={edu.degree} onChange={(e) => { const updated = [...resumeData.education]; updated[index].degree = e.target.value; setResumeData({ ...resumeData, education: updated }); }} />
                          <Input placeholder="Year" value={edu.year} onChange={(e) => { const updated = [...resumeData.education]; updated[index].year = e.target.value; setResumeData({ ...resumeData, education: updated }); }} />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={addEducation}><Plus className="w-4 h-4 mr-2" /> Add Education</Button>
                  </div>
                )}

                {activeSection === "skills" && (
                  <div className="space-y-4">
                    <div className="flex gap-2"><Input placeholder="Add a skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} /><Button onClick={addSkill}><Plus className="w-4 h-4" /></Button></div>
                    <div className="flex flex-wrap gap-2">{resumeData.skills.map((skill, i) => <span key={i} className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-2 border">{skill} <button className="text-destructive hover:font-bold" onClick={() => setResumeData({ ...resumeData, skills: resumeData.skills.filter(s => s !== skill) })}>×</button></span>)}</div>
                  </div>
                )}

                {activeSection === "achievements" && (
                  <div className="space-y-4">
                    {resumeData.achievements.map((ach, i) => (<Input key={i} value={ach} onChange={(e) => { const updated = [...resumeData.achievements]; updated[i] = e.target.value; setResumeData({ ...resumeData, achievements: updated }); }} />))}
                    <Button variant="outline" className="w-full" onClick={() => setResumeData({ ...resumeData, achievements: [...resumeData.achievements, ""] })}><Plus className="w-4 h-4 mr-2" /> Add Achievement</Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PREVIEW SECTION (Right) */}
          <div className={`lg:col-span-7 ${!showPreview ? 'hidden lg:block' : 'block'}`}>
            <div className="sticky top-24">
              <div className="bg-gray-100 p-8 rounded-xl shadow-inner overflow-hidden min-h-[800px] flex items-center justify-center">
                <div ref={resumeRef} className="transform scale-[0.8] origin-top shadow-2xl transition-all duration-500 ease-in-out bg-white w-[210mm] min-h-[297mm]">
                  {selectedTemplate === "modern" && <ModernTemplate />}
                  {selectedTemplate === "professional" && <ProfessionalTemplate />}
                  {selectedTemplate === "creative" && <CreativeTemplate />}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}