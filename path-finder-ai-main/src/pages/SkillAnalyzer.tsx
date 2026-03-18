import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, ArrowLeft, Target, BookOpen, 
  ChevronRight, Play, BarChart3, Lightbulb, 
  Zap, CheckCircle, XCircle, Clock, GraduationCap, Loader2, Trophy, AlertTriangle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

// --- 🧠 1. DATABASE OF QUIZ QUESTIONS (New Feature) ---
const quizDatabase = {
  "Problem Solving": {
    question: "You have a bucket of 3 liters and a bucket of 5 liters. How can you measure exactly 4 liters?",
    options: [
      "Fill 5L, pour into 3L, empty 3L, pour remaining 2L from 5L to 3L, fill 5L, pour into 3L until full.",
      "Fill 3L, pour into 5L, fill 3L again, pour into 5L.",
      "It is impossible with these buckets.",
      "Fill both buckets half way."
    ],
    correct: 0
  },
  "React": {
    question: "Which hook is used to perform side effects in a functional component?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    correct: 1
  },
  "Python": {
    question: "What is the output of print(2 ** 3)?",
    options: ["6", "8", "9", "5"],
    correct: 1
  }
};

// --- 📚 2. DATABASE OF COURSES (Mapped to Gaps) ---
const courseDatabase = [
  { id: 1, title: "Advanced Machine Learning", provider: "Coursera", duration: "8 weeks", rating: 4.8, skill: "Machine Learning", image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300" },
  { id: 2, title: "React.js Masterclass", provider: "Udemy", duration: "10 weeks", rating: 4.9, skill: "React", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300" },
  { id: 3, title: "Node.js Backend Guide", provider: "Udemy", duration: "12 weeks", rating: 4.7, skill: "Node.js", image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300" },
  { id: 4, title: "System Design Interview Prep", provider: "Educative", duration: "4 weeks", rating: 4.9, skill: "System Design", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300" },
];

// --- 🎯 3. CAREER PATHS (Requirements) ---
const careerRoles = [
  { title: "Frontend Developer", required: ["React", "JavaScript", "CSS", "Problem Solving"] },
  { title: "Backend Developer", required: ["Node.js", "Python", "SQL", "System Design"] },
  { title: "Data Scientist", required: ["Python", "Machine Learning", "SQL", "Statistics"] },
];

const skillCategories = [
  { name: "Programming", icon: "💻", color: "from-blue-500 to-cyan-500" },
  { name: "Data Science", icon: "📊", color: "from-purple-500 to-pink-500" },
  { name: "Soft Skills", icon: "🗣️", color: "from-green-500 to-emerald-500" },
];

export default function SkillAnalyzer() {
  const [activeTab, setActiveTab] = useState<"analysis" | "courses" | "career">("analysis");
  const [showAssessment, setShowAssessment] = useState(false);
  
  // Quiz State
  const [currentQuizSkill, setCurrentQuizSkill] = useState("Problem Solving");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<"idle" | "submitting" | "success" | "failed">("idle");

  // User Data State
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // --- 🔄 Fetch User Data ---
  useEffect(() => {
    const fetchUser = async () => {
      const localData = localStorage.getItem("educareer_user");
      if (!localData) return navigate("/auth");
      
      const { uid } = JSON.parse(localData);
      try {
        const res = await fetch(`http://localhost:5000/api/users/${uid}`);
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          setUserSkills(data.skills || []);
        }
      } catch (error) {
        console.error("Failed to load skills", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // --- 🧠 Dynamic Analysis Logic ---
  const careerAnalysis = useMemo(() => {
    return careerRoles.map(role => {
      const owned = role.required.filter(s => userSkills.includes(s));
      const missing = role.required.filter(s => !userSkills.includes(s));
      const match = Math.round((owned.length / role.required.length) * 100);
      return { ...role, match, owned, missing };
    }).sort((a, b) => b.match - a.match); // Sort by best match
  }, [userSkills]);

  const recommendedCourses = useMemo(() => {
    // Recommend courses ONLY for skills the user is missing in their top career match
    const topCareer = careerAnalysis[0]; // Best fit role
    if (!topCareer) return [];
    
    return courseDatabase.filter(c => topCareer.missing.includes(c.skill));
  }, [careerAnalysis]);

  // --- ✅ Quiz Submission ---
  const handleSubmitQuiz = async () => {
    if (selectedOption === null) return;
    setQuizStatus("submitting");

    const correctIndex = quizDatabase[currentQuizSkill as keyof typeof quizDatabase]?.correct;
    const isCorrect = selectedOption === correctIndex;

    setTimeout(async () => {
      if (isCorrect) {
        // Add skill to DB
        if (!userSkills.includes(currentQuizSkill) && userData) {
          const updatedSkills = [...userSkills, currentQuizSkill];
          try {
            await fetch(`http://localhost:5000/api/users/${userData.uid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...userData, skills: updatedSkills }),
            });
            setUserSkills(updatedSkills);
          } catch (e) { console.error(e); }
        }
        setQuizStatus("success");
        toast({ title: "Correct Answer! 🎉", description: `${currentQuizSkill} Verified.` });
      } else {
        setQuizStatus("failed");
        toast({ title: "Incorrect", description: "Don't worry, try reviewing the concepts.", variant: "destructive" });
      }
    }, 1500);
  };

  const closeAssessment = () => {
    setShowAssessment(false);
    setQuizStatus("idle");
    setSelectedOption(null);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Skill Gap Analyzer</span>
              </div>
            </div>
            <Button variant="hero" onClick={() => { setCurrentQuizSkill("Problem Solving"); setShowAssessment(true); }}>
              <Target className="w-4 h-4 mr-2" />
              Verify New Skill
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Unlock Your <span className="text-gradient">Potential</span>
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              We analyzed your profile against <strong>{careerRoles.length} career paths</strong>. Here is where you stand.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="text-3xl font-bold text-primary">{userSkills.length}</div>
                <div className="text-sm text-muted-foreground">Skills Verified</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="text-3xl font-bold text-green-500">{careerAnalysis[0]?.match || 0}%</div>
                <div className="text-sm text-muted-foreground">Best Career Match</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="text-3xl font-bold text-amber-500">{recommendedCourses.length}</div>
                <div className="text-sm text-muted-foreground">Learning Gaps</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="text-3xl font-bold text-purple-500">Top 10%</div>
                <div className="text-sm text-muted-foreground">Peer Ranking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-border sticky top-20 bg-background/95 backdrop-blur z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: "analysis", label: "Skill Analysis", icon: BarChart3 },
              { id: "career", label: "Career Paths", icon: Target },
              { id: "courses", label: "Recommended Courses", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          
          {/* --- TAB 1: ANALYSIS --- */}
          {activeTab === "analysis" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <h2 className="text-xl font-bold mb-4">Skill Categories</h2>
                <div className="space-y-3">
                  {skillCategories.map((category) => (
                    <div key={category.name} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 cursor-pointer transition-all">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl`}>
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-sm text-muted-foreground">View Analysis</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold mb-4">Your Verified Skills</h2>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="space-y-6">
                    {userSkills.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Zap className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">No verified skills yet.</p>
                        <Button onClick={() => setShowAssessment(true)}>Take Your First Quiz</Button>
                      </div>
                    ) : (
                      userSkills.map((skill, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-foreground">{skill}</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            </div>
                            <span className="text-sm font-medium text-foreground">Intermediate</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                      ))
                    )}
                  </div>

                  {userSkills.length > 0 && (
                    <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-6 h-6 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-900 mb-1">AI Recommendation</p>
                          <p className="text-sm text-blue-700">
                            You have strong foundation skills! To advance your career to <strong>Senior Developer</strong>, 
                            consider verifying <strong>System Design</strong> next.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 2: CAREER PATHS --- */}
          {activeTab === "career" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Career Compatibility</h2>
              <div className="grid gap-6">
                {careerAnalysis.map((career) => (
                  <div key={career.title} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{career.title}</h3>
                        <p className="text-muted-foreground text-sm">Based on market demand</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Match Score</p>
                          <p className={`text-2xl font-bold ${career.match > 70 ? "text-green-500" : career.match > 40 ? "text-amber-500" : "text-red-500"}`}>
                            {career.match}%
                          </p>
                        </div>
                        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${career.match > 70 ? "border-green-100 bg-green-50" : "border-amber-100 bg-amber-50"}`}>
                          <GraduationCap className={`w-6 h-6 ${career.match > 70 ? "text-green-600" : "text-amber-600"}`} />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" /> You Have
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {career.owned.length > 0 ? career.owned.map(s => (
                            <span key={s} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">{s}</span>
                          )) : <span className="text-sm text-muted-foreground italic">No matching skills yet</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Skills (Gap)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {career.missing.length > 0 ? career.missing.map(s => (
                            <span key={s} className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">{s}</span>
                          )) : <span className="text-sm text-green-600 font-medium">✨ You are fully qualified!</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB 3: COURSES --- */}
          {activeTab === "courses" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold">Recommended Learning Path</h2>
                  <p className="text-muted-foreground text-sm">Courses targeted to fill your skill gaps</p>
                </div>
              </div>
              
              {recommendedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendedCourses.map((course) => (
                    <div key={course.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-glow transition-all group flex flex-col h-full">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-md font-bold shadow-sm">
                            Fills Gap: {course.skill}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">{course.provider}</p>
                        <h3 className="font-bold text-foreground mb-2 line-clamp-2 leading-tight">{course.title}</h3>
                        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration}</span>
                          <span className="flex items-center gap-1 text-amber-500 font-medium">★ {course.rating}</span>
                        </div>
                        <Button variant="hero" className="w-full mt-4" size="sm">
                          <Play className="w-3.5 h-3.5 mr-2" /> Start Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card rounded-2xl border border-dashed">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold">You're on track!</h3>
                  <p className="text-muted-foreground">No critical skill gaps found for your top career path.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* --- ASSESSMENT QUIZ MODAL --- */}
      {showAssessment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            {quizStatus === "success" ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Trophy className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Skill Verified!</h2>
                <p className="text-muted-foreground mb-6">"{currentQuizSkill}" has been added to your profile.</p>
                <Button onClick={closeAssessment} className="w-full">Continue</Button>
              </div>
            ) : quizStatus === "failed" ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Not quite right</h2>
                <p className="text-muted-foreground mb-6">Review the concepts and try again later.</p>
                <Button onClick={closeAssessment} variant="outline" className="w-full">Close</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> Skill Verification
                  </h2>
                  <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground font-mono">{currentQuizSkill}</span>
                </div>
                
                <div className="mb-6">
                  <p className="text-lg font-medium mb-4">
                    {quizDatabase[currentQuizSkill as keyof typeof quizDatabase]?.question || "Question not found for this skill."}
                  </p>
                  <div className="space-y-3">
                    {quizDatabase[currentQuizSkill as keyof typeof quizDatabase]?.options.map((opt, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedOption(i)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedOption === i 
                            ? "border-primary bg-primary/10 ring-1 ring-primary" 
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedOption === i ? "border-primary bg-primary text-white" : "border-muted-foreground"}`}>
                            {selectedOption === i && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="text-sm">{opt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={closeAssessment} disabled={quizStatus === "submitting"}>
                    Cancel
                  </Button>
                  <Button 
                    variant="hero" 
                    className="flex-1" 
                    onClick={handleSubmitQuiz} 
                    disabled={selectedOption === null || quizStatus === "submitting"}
                  >
                    {quizStatus === "submitting" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit Answer"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}