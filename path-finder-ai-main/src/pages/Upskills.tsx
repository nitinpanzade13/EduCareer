import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, ArrowLeft, Search, Play, Clock, Users, Star,
  Trophy, Target, Zap, Award, CheckCircle, Lock, ChevronRight,
  Brain, Code, BarChart, Briefcase, TrendingUp,
  Loader2, Terminal, X, RotateCcw, Video, Mic, Camera, 
  Lightbulb, Check, StopCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

// ==========================================
// 1. STANDALONE MODULE DATA (TESTS & QUIZZES)
// ==========================================
const categories = [
  { id: "all", name: "All Courses", icon: BookOpen },
  { id: "programming", name: "Programming", icon: Code },
  { id: "data", name: "Data Science", icon: BarChart },
  { id: "aptitude", name: "Aptitude", icon: Brain },
  { id: "career", name: "Career Skills", icon: Briefcase },
];

const standaloneQuizzes = [
  { id: "dsa", title: "Data Structures & Algorithms", questions: 10, duration: "30 min", difficulty: "Hard", category: "Programming" },
  { id: "aiml", title: "AI & Machine Learning", questions: 10, duration: "25 min", difficulty: "Medium", category: "Data Science" },
  { id: "python", title: "Python Proficiency", questions: 10, duration: "20 min", difficulty: "Easy", category: "Programming" },
  { id: "react", title: "React JS Master", questions: 10, duration: "25 min", difficulty: "Hard", category: "Programming" },
  { id: "aptitude", title: "General Aptitude", questions: 10, duration: "20 min", difficulty: "Medium", category: "Aptitude" },
];

const questionBank = {
  python: [
    { id: 1, type: "mcq", question: "What is the correct extension for a Python file?", options: [".pyt", ".pyth", ".py", ".pt"], correct: 2, explanation: "Python source files always use the .py extension." },
    { id: 2, type: "code", question: "Write a function `sum_list` that takes a list of numbers and returns the sum.", starterCode: "def sum_list(nums):\n    # Write code here\n    pass", testCase: "sum_list([1,2,3]) == 6", explanation: "You can use the built-in `sum()` function." },
    { id: 3, type: "mcq", question: "What is the output of: print(2 ** 3)?", options: ["6", "8", "9", "5"], correct: 1, explanation: "** is the exponentiation operator in Python. 2 * 2 * 2 = 8." },
  ],
  dsa: [
    { id: 1, type: "mcq", question: "Which data structure follows LIFO (Last In First Out)?", options: ["Queue", "Stack", "Tree", "Graph"], correct: 1, explanation: "A Stack follows LIFO. The last element added is the first one removed." },
    { id: 2, type: "mcq", question: "What is the time complexity of binary search?", options: ["O(n)", "O(n^2)", "O(log n)", "O(1)"], correct: 2, explanation: "Binary search divides the search interval in half each time, resulting in logarithmic time complexity." },
    { id: 3, type: "code", question: "Implement a function to reverse a string.", starterCode: "def reverse_string(s):\n    return s", testCase: "reverse_string('abc') == 'cba'", explanation: "In Python, you can use slicing: `return s[::-1]`." },
  ],
  aiml: [
    { id: 1, type: "mcq", question: "Which of these is a Supervised Learning algorithm?", options: ["K-Means", "Linear Regression", "Apriori", "PCA"], correct: 1, explanation: "Linear Regression uses labeled training data (input-output pairs)." },
    { id: 2, type: "mcq", question: "Overfitting occurs when...", options: ["Model learns noise as concepts", "Model is too simple", "Data is insufficient", "Training accuracy is low"], correct: 0, explanation: "Overfitting means the model memorized the training data and fails to generalize." },
  ],
  react: [
    { id: 1, type: "mcq", question: "Which hook manages state?", options: ["useEffect", "useState", "useContext", "useReducer"], correct: 1, explanation: "useState is the standard hook for adding state variables." },
    { id: 2, type: "mcq", question: "What is the virtual DOM?", options: ["Direct HTML", "Lightweight copy", "Browser API", "None"], correct: 1, explanation: "It's a memory representation of the UI." },
  ],
  aptitude: [
    { id: 1, type: "mcq", question: "Find the missing number: 2, 6, 12, 20, ?", options: ["30", "32", "42", "28"], correct: 0, explanation: "The pattern is n*(n+1). Next is 5*6 = 30." },
    { id: 2, type: "mcq", question: "If a shirt costs $20 after a 20% discount, what was the original price?", options: ["$25", "$24", "$30", "$22"], correct: 0, explanation: "$20 is 80% of the price. Original = 20 / 0.80 = $25." },
  ]
};

const interviewQuestionSets = {
  hr: ["Tell me about a time you faced a significant challenge.", "Where do you see yourself in 5 years?", "Why should we hire you over other candidates?", "What is your greatest strength and weakness?"],
  frontend: ["Explain the concept of closures in JavaScript.", "How do you optimize a React application for performance?", "Describe the difference between localStorage and sessionStorage.", "What is the Box Model in CSS?"],
  backend: ["Explain the difference between SQL and NoSQL databases.", "How do you handle authentication in a REST API?", "What is the purpose of a reverse proxy?", "Explain ACID properties in databases."]
};

export default function Upskills() {
  const [activeTab, setActiveTab] = useState<"courses" | "quizzes" | "achievements" | "interview">("courses");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // --- MONGODB DATA STATES (For Courses Tab) ---
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [dbQuizzes, setDbQuizzes] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- TEST & PRACTICE MODE STATE ---
  const [testMode, setTestMode] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false); 
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeQuizSource, setActiveQuizSource] = useState<"course" | "standalone" | null>(null); // ✅ Separates the two systems
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showSolution, setShowSolution] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(900);
  const [codeOutput, setCodeOutput] = useState("");
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{score: number, accuracy: number} | null>(null);

  // --- INTERVIEW MODE STATE ---
  const [interviewMode, setInterviewMode] = useState(false);
  const [interviewStep, setInterviewStep] = useState<"setup" | "recording" | "processing" | "result">("setup");
  const [interviewCategory, setInterviewCategory] = useState<"hr" | "frontend" | "backend">("hr");
  const [currentInterviewQ, setCurrentInterviewQ] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState(""); 
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // ==========================================
  // 1. DATA FETCHING FROM BACKEND
  // ==========================================
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const localData = localStorage.getItem("educareer_user");
        const uid = localData ? JSON.parse(localData).uid : null;
        
        const [coursesRes, quizzesRes, userRes] = await Promise.all([
          fetch('http://localhost:5000/api/users/content/courses'),
          fetch('http://localhost:5000/api/users/content/quizzes'),
          uid ? fetch(`http://localhost:5000/api/users/${uid}`) : Promise.resolve(null)
        ]);
        
        if (coursesRes.ok) setDbCourses(await coursesRes.json());
        if (quizzesRes.ok) setDbQuizzes(await quizzesRes.json());
        if (userRes && userRes.ok) {
          const userData = await userRes.json();
          setUserBadges(userData.earnedBadges || []);
          setUserXP(userData.stats?.totalPoints || 0);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const filteredCourses = useMemo(() => {
    return dbCourses.filter(course => 
      (activeCategory === "all" || course.category.toLowerCase().includes(activeCategory.toLowerCase())) &&
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeCategory, searchQuery, dbCourses]);


  // --- TIMER EFFECTS ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTestRunning && !practiceMode && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTestRunning && !practiceMode) {
      finishTest();
    }
    return () => clearInterval(timer);
  }, [isTestRunning, timeLeft, practiceMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (interviewStep === "recording") {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [interviewStep]);

  // ==========================================
  // 2. DUAL QUIZ LOGIC (COURSE vs STANDALONE)
  // ==========================================

  const startTest = (quizId: string, mode: 'test' | 'practice', source: 'course' | 'standalone') => {
    let qs = [];
    
    // Check where to pull the questions from
    if (source === 'course') {
      qs = dbQuizzes.filter(q => q.category === quizId); // Pull from Admin DB
    } else {
      qs = questionBank[quizId as keyof typeof questionBank] || []; // Pull from massive array
    }

    if (qs.length === 0) {
      toast({ title: "No Questions", description: "Questions for this module are not available yet.", variant: "destructive" });
      return;
    }

    setActiveQuizId(quizId);
    setActiveQuizSource(source);
    setCurrentQuestions(qs);
    setPracticeMode(mode === 'practice'); 
    setTestMode(true); 
    setIsTestRunning(true);
    setTimeLeft(mode === 'practice' ? 0 : qs.length * 60); 
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowSolution(false); 
    setTestResult(null);
    setCodeOutput("");
  };

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: value }));
    if (practiceMode) setShowSolution(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowSolution(false); 
      setCodeOutput("");
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    setIsTestRunning(false);
    let correctCount = 0;
    
    currentQuestions.forEach((q, idx) => {
      if (q.type === 'code' || q.type === 'descriptive') {
        if ((answers[idx] || "").length > 5) correctCount++;
      } else {
        if (answers[idx] === q.correct) correctCount++;
      }
    });

    const score = (correctCount / currentQuestions.length) * 100;
    setTestResult({ score, accuracy: score });

    // ✅ ONLY AWARD BADGE IF IT WAS A COURSE EXAM
    if (!practiceMode && score >= 70 && activeQuizSource === 'course') {
      try {
        const localData = localStorage.getItem("educareer_user");
        if (localData) {
          const { uid } = JSON.parse(localData);
          const res = await fetch(`http://localhost:5000/api/users/${uid}/award-badge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseName: activeQuizId })
          });

          if (res.ok) {
            toast({ 
              title: "🎉 Course Completed!", 
              description: `You earned the ${activeQuizId} Master Badge!`,
              className: "bg-green-500 text-white border-none"
            });
            // Refresh badges
            const userRes = await fetch(`http://localhost:5000/api/users/${uid}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              setUserBadges(userData.earnedBadges || []);
              setUserXP(userData.stats?.totalPoints || 0);
            }
          }
        }
      } catch (err) {
        console.error("Failed to award badge", err);
      }
    }
  };

  const runCode = () => {
    setCodeOutput("Running...");
    setTimeout(() => {
      const code = answers[currentQuestionIndex] || "";
      if (code.includes("return") || code.includes("print") || code.includes("def")) {
        setCodeOutput(`> Code Executed Successfully ✅\n> Output: [Simulated Output]\n> Status: Passed`);
      } else {
        setCodeOutput(`> Syntax Error ❌\n> Expected: Valid Python/JS Code`);
      }
    }, 1000);
  };

  // ==========================================
  // 3. INTERVIEW HANDLERS (Mocked AI Logic)
  // ==========================================

  const startInterviewSetup = async () => { 
    setInterviewMode(true); 
    setInterviewStep("setup"); 
    setTranscript(""); 
    
    try { 
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); 
      setStream(mediaStream); 
      setTimeout(() => { 
        if (videoRef.current) videoRef.current.srcObject = mediaStream; 
      }, 100); 
    } catch (err) { 
      toast({ title: "Camera Error", description: "Please allow camera access.", variant: "destructive" }); 
    } 
  };

  const stopInterview = () => { 
    if (stream) stream.getTracks().forEach(track => track.stop()); 
    setStream(null); 
    if (recognitionRef.current) recognitionRef.current.stop(); 
    setInterviewMode(false); 
  };

  const startRecording = () => { 
    if (!stream) return; 
    setInterviewStep("recording"); 
    setRecordingTime(0); 
    setTranscript(""); 

    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) { 
            const recognition = new SpeechRecognition(); 
            recognition.continuous = true; 
            recognition.interimResults = true; 
            recognition.lang = 'en-US'; 
            recognition.onresult = (event: any) => { 
                let t = ""; 
                for (let i = event.resultIndex; i < event.results.length; i++) t += event.results[i][0].transcript; 
                setTranscript(t); 
            }; 
            recognition.start(); 
            recognitionRef.current = recognition; 
        }
    }
  };

  const finishRecording = async () => { 
    if (recognitionRef.current) recognitionRef.current.stop(); 
    setInterviewStep("processing"); 
    
    setTimeout(() => { 
      setAnalysisResult({ 
        transcription: transcript || "Mock transcription because mic was silent...", 
        rating: Math.floor(Math.random() * 3) + 7, 
        sentiment: "Confident", 
        feedback: "Good use of keywords. Try to structure your answer using the STAR method (Situation, Task, Action, Result) for better impact." 
      }); 
      setInterviewStep("result"); 
    }, 2000); 
  };

  const formatTime = (seconds: number) => { 
    const mins = Math.floor(seconds / 60); 
    const secs = seconds % 60; 
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`; 
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;

  // ==========================================
  // 4. RENDERERS (VIEWS)
  // ==========================================

  if (interviewMode) {
    const questions = interviewQuestionSets[interviewCategory];
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl relative">
          <Button variant="secondary" size="icon" className="absolute top-4 right-4 z-10 rounded-full" onClick={stopInterview}>
            <X className="w-5 h-5" />
          </Button>

          <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
            {interviewStep !== "processing" && interviewStep !== "result" && (
              <>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror-mode" />
                {transcript && (
                  <div className="absolute bottom-24 left-0 right-0 text-center px-8">
                    <span className="bg-black/60 text-white px-4 py-2 rounded-xl text-lg font-medium backdrop-blur-sm">"{transcript}"</span>
                  </div>
                )}
              </>
            )}

            {interviewStep === "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white">
                <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                <h3 className="text-2xl font-bold">Analyzing Answer...</h3>
              </div>
            )}

            {interviewStep === "result" && analysisResult && (
              <div className="absolute inset-0 bg-zinc-900 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto text-left">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-500" /></div>
                    <div><h2 className="text-2xl font-bold text-white">Analysis Complete</h2></div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-800/50 p-4 rounded-xl text-center"><p className="text-green-400 font-bold text-3xl">{analysisResult.rating}/10</p></div>
                      <div className="bg-zinc-800/50 p-4 rounded-xl text-center"><p className="text-blue-400 font-bold text-2xl">{analysisResult.sentiment}</p></div>
                    </div>
                    <div className="bg-zinc-800/50 p-6 rounded-xl"><p className="text-zinc-100">{analysisResult.feedback}</p></div>
                    <Button className="w-full h-12 text-lg" onClick={() => { setInterviewStep("setup"); setCurrentInterviewQ(prev => (prev + 1) % questions.length) }}>Next Question</Button>
                  </div>
                </div>
              </div>
            )}

            {(interviewStep === "setup" || interviewStep === "recording") && (
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
                <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-6">"{questions[currentInterviewQ]}"</h3>
                {interviewStep === "setup" ? (
                  <Button size="lg" className="rounded-full px-8 h-14 bg-red-600 hover:bg-red-700 text-white border-0" onClick={startRecording}><Video className="w-5 h-5 mr-2" /> Start Answer</Button>
                ) : (
                  <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 shadow-lg" onClick={finishRecording}><StopCircle className="w-5 h-5 mr-2 text-red-600" /> Stop & Submit</Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (testMode && activeQuizId) {
    if (testResult) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-8 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><Trophy className="w-12 h-12 text-primary" /></div>
            <h2 className="text-3xl font-bold text-foreground mb-2">{practiceMode ? "Practice Complete!" : "Test Submitted!"}</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-muted/50 border border-border"><p className="text-sm text-muted-foreground mb-1">Score</p><p className="text-3xl font-bold">{testResult.score.toFixed(0)}%</p></div>
              <div className="p-4 rounded-2xl bg-muted/50 border border-border"><p className="text-sm text-muted-foreground mb-1">Accuracy</p><p className="text-3xl font-bold">{testResult.accuracy >= 70 ? "High" : "Average"}</p></div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setTestMode(false)}>Return to Dashboard</Button>
          </div>
        </div>
      );
    }

    const question = currentQuestions[currentQuestionIndex];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b border-border p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${practiceMode ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{practiceMode ? "Practice" : "Exam"}</div>
            <span className="font-bold capitalize text-lg">{activeQuizId}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTestMode(false)}><X className="w-5 h-5" /></Button>
        </header>
        
        <div className="flex-1 container mx-auto p-4 md:p-8 max-w-4xl">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">{question?.question}</h2>

            {(!question?.type || question?.type === "mcq") && (
              <div className="grid gap-3">
                {question?.options?.map((opt: string, idx: number) => {
                  let btnClass = answers[currentQuestionIndex] === idx ? "border-primary bg-primary/5" : "border-border";
                  if (practiceMode && showSolution) {
                    if (idx === question.correct) btnClass = "border-green-500 bg-green-50 text-green-700 font-medium";
                    else if (answers[currentQuestionIndex] === idx) btnClass = "border-red-500 bg-red-50 text-red-700";
                  }
                  return (
                    <button key={idx} onClick={() => !showSolution && handleAnswer(idx)} disabled={practiceMode && showSolution} className={`text-left p-4 rounded-xl border-2 flex items-center gap-3 ${btnClass}`}>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${answers[currentQuestionIndex] === idx ? "border-primary" : ""}`}>
                        {answers[currentQuestionIndex] === idx && <div className="w-3 h-3 bg-primary rounded-full" />}
                      </div>
                      <span className="text-base">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {question?.type === "descriptive" && (
              <Textarea placeholder="Type your answer here..." className="min-h-[200px] text-lg p-4" value={answers[currentQuestionIndex] || ""} onChange={(e) => handleAnswer(e.target.value)} />
            )}
            
            {question?.type === "code" && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-border bg-slate-950">
                  <div className="bg-slate-900 text-slate-400 text-xs px-4 py-2 border-b border-slate-800"><Terminal className="w-3 h-3 inline mr-2" /> code_editor</div>
                  <textarea className="w-full h-[300px] bg-transparent text-slate-50 font-mono p-4 focus:outline-none" value={answers[currentQuestionIndex] || question.starterCode} onChange={(e) => handleAnswer(e.target.value)} spellCheck={false} />
                </div>
                <Button onClick={runCode} className="bg-green-600 hover:bg-green-700 text-white"><Play className="w-4 h-4 mr-2" /> Run Code</Button>
                {codeOutput && <div className="bg-slate-900 rounded-xl p-4 text-sm text-green-400 font-mono">{codeOutput}</div>}
              </div>
            )}

            {practiceMode && showSolution && (
              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-3"><Lightbulb className="w-5 h-5 text-blue-600"/> Explanation</h4>
                <p className="text-blue-800">{question?.explanation || "No explanation provided."}</p>
              </div>
            )}
          </div>
        </div>

        <footer className="bg-card border-t border-border p-4 sticky bottom-0 z-50">
          <div className="container mx-auto max-w-4xl flex justify-between items-center">
            <Button variant="outline" onClick={() => { setShowSolution(false); setCurrentQuestionIndex(prev => Math.max(0, prev - 1)); }} disabled={currentQuestionIndex === 0}>Previous</Button>
            <div className="flex gap-3">
              {practiceMode && !showSolution && <Button variant="secondary" onClick={() => setShowSolution(true)} disabled={answers[currentQuestionIndex] === undefined}>Check Answer</Button>}
              <Button onClick={handleNextQuestion}>{currentQuestionIndex === currentQuestions.length - 1 ? "Finish Test" : "Next Question"} <ChevronRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // 5. MAIN DASHBOARD RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" /> Back
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Upskills & Prep</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="font-bold">{userXP.toLocaleString()}</span> <span className="text-xs opacity-70">XP</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border sticky top-[73px] bg-background/95 backdrop-blur z-30 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {[{ id: "courses", label: "Courses", icon: BookOpen }, { id: "quizzes", label: "Tests & Quizzes", icon: Brain }, { id: "interview", label: "AI Interview", icon: Video }, { id: "achievements", label: "Achievements", icon: Trophy }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 py-4 border-b-2 transition-colors whitespace-nowrap font-medium ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="py-8">
        <div className="container mx-auto px-4">
          
          {/* TAB 1: DB COURSES (Course-Specific Exams) */}
          {activeTab === "courses" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="sticky top-40 space-y-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input placeholder="Search courses..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <h3 className="font-bold mb-3 text-foreground">Categories</h3>
                    <div className="space-y-1">
                      {categories.map(c => (
                        <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activeCategory === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                          <c.icon className="w-4 h-4"/>{c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 ? (
                  <div className="col-span-full text-center p-12 bg-card rounded-xl border-2 border-dashed border-border text-muted-foreground">
                    No courses found. Wait for the admin to add some!
                  </div>
                ) : (
                  filteredCourses.map(course => {
                    const hasQuiz = dbQuizzes.some(q => q.category === course.title);
                    return (
                    <div key={course._id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                      <div className="aspect-video relative overflow-hidden bg-slate-100">
                        <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={course.title} />
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold mb-1 text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                        <p className="text-xs text-muted-foreground mb-4">By {course.instructor}</p>
                        <div className="mt-auto pt-4 border-t border-border flex gap-2">
                          <a href={course.videoUrl} target="_blank" rel="noreferrer" className="flex-1">
                            <Button variant="outline" className="w-full text-xs h-9">Watch</Button>
                          </a>
                          {/* ✅ Trigger Course Exam from DB */}
                          <Button 
                            className={`flex-1 text-xs h-9 ${hasQuiz ? 'bg-primary' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
                            onClick={() => hasQuiz && startTest(course.title, 'test', 'course')}
                            disabled={!hasQuiz}
                          >
                            {hasQuiz ? "Course Exam" : "No Exam"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STANDALONE TESTS & QUIZZES (The Massive Static Module) */}
          {activeTab === "quizzes" && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">Skill Assessment Center</h2>
                <p className="text-muted-foreground">Test your general knowledge with our curated standalone question banks.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {standaloneQuizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    
                    <div className="flex-1 relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {quiz.difficulty}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">{quiz.category}</span>
                      </div>
                      <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">{quiz.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <span className="flex items-center gap-1.5"><Brain className="w-4 h-4 text-primary" /> {questionBank[quiz.id as keyof typeof questionBank]?.length || 0} Qs</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      {/* ✅ Trigger Standalone Quizzes */}
                      <Button variant="outline" onClick={() => startTest(quiz.id, 'practice', 'standalone')} className="hover:bg-primary/5 hover:text-primary hover:border-primary/30">
                        <BookOpen className="w-4 h-4 mr-2" /> Practice
                      </Button>
                      <Button variant="hero" onClick={() => startTest(quiz.id, 'test', 'standalone')}>
                        <TrendingUp className="w-4 h-4 mr-2" /> Take Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INTERVIEW */}
          {activeTab === "interview" && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-12 border border-indigo-500/20 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-4 text-foreground">AI Video Interview Simulator</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-lg">
                  Practice answering behavioral and technical questions in a realistic environment. 
                  Our AI analyzes your speech, confidence, and content to provide instant feedback.
                </p>
                
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Choose Your Track</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
                  <button onClick={() => setInterviewCategory("hr")} className={`p-6 rounded-2xl border-2 transition-all ${interviewCategory === "hr" ? "border-primary bg-primary/10 shadow-lg scale-105" : "border-border hover:border-primary/50 bg-card"}`}>
                    <Users className={`w-8 h-8 mx-auto mb-3 ${interviewCategory === 'hr' ? 'text-primary' : 'text-muted-foreground'}`}/>
                    <h3 className="font-bold">HR / Behavioral</h3>
                  </button>
                  <button onClick={() => setInterviewCategory("frontend")} className={`p-6 rounded-2xl border-2 transition-all ${interviewCategory === "frontend" ? "border-blue-500 bg-blue-500/10 shadow-lg scale-105" : "border-border hover:border-blue-500/50 bg-card"}`}>
                    <Code className={`w-8 h-8 mx-auto mb-3 ${interviewCategory === 'frontend' ? 'text-blue-500' : 'text-muted-foreground'}`}/>
                    <h3 className="font-bold">Frontend Dev</h3>
                  </button>
                  <button onClick={() => setInterviewCategory("backend")} className={`p-6 rounded-2xl border-2 transition-all ${interviewCategory === "backend" ? "border-green-500 bg-green-500/10 shadow-lg scale-105" : "border-border hover:border-green-500/50 bg-card"}`}>
                    <Terminal className={`w-8 h-8 mx-auto mb-3 ${interviewCategory === 'backend' ? 'text-green-500' : 'text-muted-foreground'}`}/>
                    <h3 className="font-bold">Backend Dev</h3>
                  </button>
                </div>
                
                <Button size="lg" variant="hero" className="px-12 h-14 text-lg shadow-xl shadow-primary/20 rounded-full" onClick={startInterviewSetup}>
                  Start Interview Session <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: MONGODB ACHIEVEMENTS & BADGES */}
          {activeTab === "achievements" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              
              {/* Render Backend Badges (Earned from Tab 1) */}
              {userBadges.map((badge, i) => (
                <div key={`db-${i}`} className="bg-card rounded-2xl border border-amber-200 bg-amber-50/30 p-6 flex gap-5 items-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br from-amber-400 to-orange-600 text-white">
                    <Award className="w-8 h-8"/>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg leading-tight">{badge.courseName} Master</h3>
                    <p className="text-sm text-amber-700 mt-1 font-medium">Passed Exam</p>
                  </div>
                </div>
              ))}

              {/* Default Mock Achievements */}
              <div className="bg-card rounded-2xl border p-6 flex gap-5 items-center opacity-60 grayscale border-border">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                  <Lock className="w-8 h-8"/>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Interview Ready</h3>
                  <p className="text-sm text-muted-foreground mb-3">Complete 3 Mock Interviews</p>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '30%' }} />
                  </div>
                  <p className="text-xs text-right mt-1 font-medium">30%</p>
                </div>
              </div>
              
            </div>
          )}
        </div>
      </section>
    </div>
  );
}