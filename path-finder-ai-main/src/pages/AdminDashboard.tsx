import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutDashboard, Users, BookOpen, Brain, 
  Settings, LogOut, Search, Plus, Trash2, 
  MoreVertical, ShieldAlert, BarChart3, Bell, 
  CheckCircle, GraduationCap, TrendingUp, AlertCircle,
  FileText, Activity, Lock, Unlock, Filter, ChevronDown,
  Mic, ListPlus, Star, Play, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// --- MOCK ADMIN DATA (Fallback) ---
const statsMock = [
  { label: "Total Students", value: "1,240", change: "+12%", trend: "up", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Active Courses", value: "45", change: "+3", trend: "up", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Quizzes Taken", value: "8.5K", change: "+24%", trend: "up", icon: Brain, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Revenue (MTD)", value: "$12K", change: "+8%", trend: "up", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [interviewQs, setInterviewQs] = useState<any[]>([]);
  const [quizQs, setQuizQs] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>(statsMock);
  
  // ✅ Super Admin State
  const [myRole, setMyRole] = useState("admin");
  
  // Form States
  const [newInterviewQ, setNewInterviewQ] = useState({ question: "", category: "hr" });
  const [newQuizQ, setNewQuizQ] = useState({ 
    question: "", category: "", type: "mcq", 
    option1: "", option2: "", option3: "", option4: "", 
    correct: 0, explanation: "" 
  });
  
  // Course Modal State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    title: "", instructor: "", category: "Programming", videoUrl: "", level: "Beginner", description: ""
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const localData = localStorage.getItem("educareer_user");
      if (!localData) return;
      const { uid, role } = JSON.parse(localData);
      
      // ✅ Set local role for Super Admin checks
      setMyRole(role || "admin");
      
      const headers = { 'x-user-uid': uid };

      const [statsRes, usersRes, coursesRes, interviewRes, quizRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/stats', { headers }),
        fetch('http://localhost:5000/api/admin/users', { headers }),
        fetch('http://localhost:5000/api/admin/courses', { headers }),
        fetch('http://localhost:5000/api/admin/interviews', { headers }),
        fetch('http://localhost:5000/api/admin/quizzes', { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (interviewRes.ok) setInterviewQs(await interviewRes.json());
      if (quizRes.ok) setQuizQs(await quizRes.json());

    } catch (error) {
      console.error("Admin Fetch Error", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLERS ---
  const handleLogout = () => navigate("/");

  const handleAction = async (endpoint: string, method: string) => {
    const localData = localStorage.getItem("educareer_user");
    if (!localData) return;
    const { uid } = JSON.parse(localData);

    try {
      await fetch(`http://localhost:5000/api/admin/${endpoint}`, {
        method,
        headers: { 'x-user-uid': uid }
      });
      fetchData(); 
      toast({ title: "Success", description: "Action completed successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Action failed.", variant: "destructive" });
    }
  };

  // ✅ NEW: Super Admin Role Change Handler
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!confirm(`Are you sure you want to make this user a ${newRole}?`)) return;

    const localData = localStorage.getItem("educareer_user");
    if (!localData) return;
    const { uid } = JSON.parse(localData);

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': uid },
        body: JSON.stringify({ newRole })
      });

      if (res.ok) {
        toast({ title: "Success", description: `User role updated to ${newRole}` });
        fetchData();
      } else {
        const errorData = await res.json();
        toast({ title: "Access Denied", description: errorData.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseForm.title || !newCourseForm.videoUrl) {
      toast({ title: "Missing Fields", description: "Title and Video URL are required.", variant: "destructive" });
      return;
    }
    await postData('courses', newCourseForm);
    setIsCourseModalOpen(false);
    setNewCourseForm({ title: "", instructor: "", category: "Programming", videoUrl: "", level: "Beginner", description: "" });
  };

  const handleAddInterviewQ = async () => {
    if(!newInterviewQ.question) return;
    await postData('interviews', newInterviewQ);
    setNewInterviewQ({ question: "", category: "hr" });
  };

  const handleAddQuizQ = async () => {
    if(!newQuizQ.question || !newQuizQ.category) {
        toast({ title: "Error", description: "Please enter a question and select a linked course.", variant: "destructive" });
        return;
    }
    const formattedData = {
        ...newQuizQ,
        options: [newQuizQ.option1, newQuizQ.option2, newQuizQ.option3, newQuizQ.option4]
    };
    await postData('quizzes', formattedData);
    setNewQuizQ({ ...newQuizQ, question: "", explanation: "" });
  };

  const postData = async (endpoint: string, data: any) => {
    const localData = localStorage.getItem("educareer_user");
    if (!localData) return;
    const { uid } = JSON.parse(localData);

    try {
        const res = await fetch(`http://localhost:5000/api/admin/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-uid': uid },
            body: JSON.stringify(data)
        });
        if(res.ok) {
            toast({ title: "Success", description: "Item added successfully!" });
            fetchData();
        }
    } catch (e) {
        toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans flex relative">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:flex flex-col z-40">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Edu<span className="text-primary">Admin</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SidebarItem icon={Users} label="Users" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
          <SidebarItem icon={BookOpen} label="Courses" active={activeTab === "content"} onClick={() => setActiveTab("content")} />
          
          {/* ✅ Only Super Admins might see sensitive financial/Analytics in real apps, but we'll show it generally here unless you want to hide it! */}
          <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 border-t border-border">Modules</div>
          <SidebarItem icon={Mic} label="Interview Qs" active={activeTab === "interviews"} onClick={() => setActiveTab("interviews")} />
          <SidebarItem icon={Brain} label="Quiz Bank" active={activeTab === "quizzes"} onClick={() => setActiveTab("quizzes")} />
        </nav>

        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 justify-start" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="lg:ml-64 flex-1 p-8">
        
        {/* TOP HEADER */}
        <header className="flex justify-between items-center mb-8 sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md py-2 -mx-8 px-8 border-b border-transparent transition-all">
          <div>
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {activeTab === "interviews" ? "Interview Management" : activeTab === "quizzes" ? "Quiz Bank" : `${activeTab} Dashboard`}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Administrator Control Panel</p>
          </div>
          <div className="flex items-center gap-4">
            {myRole === "superadmin" && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                Super Admin Access
              </span>
            )}
            <Button variant="outline" size="icon" className="rounded-full bg-white relative border-border">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </Button>
          </div>
        </header>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform`}>
                      {stat.icon && <stat.icon className="w-6 h-6" />}
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">{stat.change}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
            
            {/* System Health */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6 max-w-3xl">
              <h2 className="text-lg font-bold text-foreground mb-6">System Status</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Server Load</span>
                    <span className="text-green-600">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Database Usage</span>
                    <span className="text-blue-600">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === "users" && (
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider font-semibold">
                  <tr><th className="p-5 pl-6">User</th><th className="p-5">Role</th><th className="p-5">Status</th><th className="p-5 text-right pr-6">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-5 pl-6"><p className="font-bold">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></td>
                      <td className="p-5">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.role === 'superadmin' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-5"><span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === "Active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{user.status}</span></td>
                      <td className="p-5 text-right pr-6 space-x-2">
                        
                        {/* ✅ ONLY SUPER ADMIN SEES THIS BUTTON */}
                        {myRole === 'superadmin' && user.role !== 'superadmin' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`text-xs h-8 ${user.role === 'admin' ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'}`}
                            onClick={() => handleRoleChange(user._id, user.role)}
                          >
                            {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                          </Button>
                        )}

                        <Button variant="ghost" size="icon" onClick={() => handleAction(`users/${user._id}/status`, 'PUT')}>
                          {user.status === 'Active' ? <Lock className="w-4 h-4 text-amber-600"/> : <Unlock className="w-4 h-4 text-green-600"/>}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction(`users/${user._id}`, 'DELETE')}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- COURSES TAB --- */}
        {activeTab === "content" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Managed Courses</h2>
              <Button onClick={() => setIsCourseModalOpen(true)} className="rounded-full shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Create Course</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.length === 0 ? (
                <div className="col-span-full p-12 text-center text-muted-foreground bg-white rounded-2xl border border-dashed">
                  No courses added yet. Click "Create Course" to add a YouTube video.
                </div>
              ) : (
                courses.map(course => (
                  <div key={course._id} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/50 hover:shadow-md transition-all group">
                    <div className="mb-4 aspect-video rounded-lg overflow-hidden relative bg-slate-100">
                       <img src={course.thumbnail} alt="Course" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={course.videoUrl} target="_blank" rel="noreferrer" className="text-white bg-white/20 backdrop-blur p-3 rounded-full hover:bg-primary transition-colors">
                            <Play className="w-6 h-6 fill-white"/>
                          </a>
                       </div>
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">By {course.instructor}</p>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4 bg-muted/50 p-3 rounded-lg">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.studentsEnrolled || 0}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {course.rating || "New"}</span>
                      <span className="ml-auto px-2 py-0.5 rounded bg-white border border-border shadow-sm text-primary">{course.level}</span>
                    </div>

                    <Button variant="outline" size="sm" className="w-full text-xs rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" onClick={() => handleAction(`courses/${course._id}`, 'DELETE')}>
                      <Trash2 className="w-3 h-3 mr-2" /> Delete Course
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- ANALYTICS TAB --- */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-foreground mb-4">Platform Engagement Overview</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="font-bold text-slate-700 mb-6">Course Views (Last 7 Days)</h3>
                <div className="flex items-end gap-3 h-48 mt-4">
                  {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-primary/20 rounded-t-md relative flex items-end justify-center group-hover:bg-primary/30 transition-colors" style={{ height: '100%' }}>
                        <div className="w-full bg-primary rounded-t-md transition-all duration-1000" style={{ height: `${height}%` }}></div>
                        <span className="absolute -top-6 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{height * 12}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Day {i+1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
                <h3 className="font-bold text-slate-700">Top Categories</h3>
                <div className="space-y-4">
                  {[
                    { name: "Programming", percent: 75, color: "bg-blue-500" },
                    { name: "Data Science", percent: 45, color: "bg-purple-500" },
                    { name: "Aptitude", percent: 30, color: "bg-amber-500" },
                  ].map(cat => (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-muted-foreground">{cat.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`${cat.color} h-2 rounded-full`} style={{ width: `${cat.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- INTERVIEW QUESTIONS TAB --- */}
        {activeTab === "interviews" && (
            <div className="space-y-6 animate-in fade-in-50">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Mic className="w-4 h-4 text-primary"/> Add New Interview Question</h3>
                    <div className="flex gap-4">
                        <select className="border rounded-md p-2 bg-background w-40 text-sm" value={newInterviewQ.category} onChange={(e) => setNewInterviewQ({...newInterviewQ, category: e.target.value})}>
                            <option value="hr">HR</option>
                            <option value="frontend">Frontend</option>
                            <option value="backend">Backend</option>
                        </select>
                        <Input placeholder="Enter question..." value={newInterviewQ.question} onChange={(e) => setNewInterviewQ({...newInterviewQ, question: e.target.value})} />
                        <Button onClick={handleAddInterviewQ}><Plus className="w-4 h-4 mr-2"/> Add</Button>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {interviewQs.map((q) => (
                        <div key={q._id} className="p-4 border-b border-border last:border-0 flex justify-between items-center hover:bg-muted/30">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded mr-3">{q.category}</span>
                                <span className="font-medium text-foreground">{q.question}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleAction(`interviews/${q._id}`, 'DELETE')} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    ))}
                    {interviewQs.length === 0 && <div className="p-8 text-center text-muted-foreground">No questions found.</div>}
                </div>
            </div>
        )}

        {/* --- QUIZ BANK TAB --- */}
        {activeTab === "quizzes" && (
            <div className="space-y-6 animate-in fade-in-50">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><Brain className="w-4 h-4 text-primary"/> Add Quiz Question</h3>
                    <div className="grid grid-cols-2 gap-4">
                        
                        <select 
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={newQuizQ.category} 
                          onChange={e => setNewQuizQ({...newQuizQ, category: e.target.value})}
                        >
                          <option value="" disabled>Select Linked Course...</option>
                          {courses.map(c => (
                            <option key={c._id} value={c.title}>{c.title}</option>
                          ))}
                          <option value="General Aptitude">General Aptitude</option>
                        </select>

                        <Input placeholder="Question Text" value={newQuizQ.question} onChange={e => setNewQuizQ({...newQuizQ, question: e.target.value})} />
                        
                        <Input placeholder="Option 1" value={newQuizQ.option1} onChange={e => setNewQuizQ({...newQuizQ, option1: e.target.value})} />
                        <Input placeholder="Option 2" value={newQuizQ.option2} onChange={e => setNewQuizQ({...newQuizQ, option2: e.target.value})} />
                        <Input placeholder="Option 3" value={newQuizQ.option3} onChange={e => setNewQuizQ({...newQuizQ, option3: e.target.value})} />
                        <Input placeholder="Option 4" value={newQuizQ.option4} onChange={e => setNewQuizQ({...newQuizQ, option4: e.target.value})} />
                        
                        <div className="col-span-2 flex gap-4">
                            <Input type="number" placeholder="Correct Index (0-3)" className="w-48" value={newQuizQ.correct} onChange={e => setNewQuizQ({...newQuizQ, correct: parseInt(e.target.value)})} />
                            <Input placeholder="Explanation" className="flex-1" value={newQuizQ.explanation} onChange={e => setNewQuizQ({...newQuizQ, explanation: e.target.value})} />
                            <Button onClick={handleAddQuizQ}><Plus className="w-4 h-4 mr-2"/> Add to Bank</Button>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {quizQs.map((q) => (
                        <div key={q._id} className="p-4 border-b border-border last:border-0 flex justify-between items-start hover:bg-muted/30">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">{q.category}</span>
                                    <span className="font-medium text-foreground">{q.question}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">Answer: {q.options[q.correct]} • Exp: {q.explanation}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleAction(`quizzes/${q._id}`, 'DELETE')} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>

      {/* --- ADD COURSE MODAL (Popup) --- */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen className="text-primary w-5 h-5"/> Add YouTube Course</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCourseModalOpen(false)} className="rounded-full hover:bg-slate-200">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Course Title</label>
                <Input placeholder="e.g., Python for Beginners" value={newCourseForm.title} onChange={e => setNewCourseForm({...newCourseForm, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Instructor / Channel</label>
                  <Input placeholder="e.g., FreeCodeCamp" value={newCourseForm.instructor} onChange={e => setNewCourseForm({...newCourseForm, instructor: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm" value={newCourseForm.category} onChange={e => setNewCourseForm({...newCourseForm, category: e.target.value})}>
                    <option value="Programming">Programming</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="Career Skills">Career Skills</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">YouTube Video URL</label>
                <Input placeholder="https://www.youtube.com/watch?v=..." value={newCourseForm.videoUrl} onChange={e => setNewCourseForm({...newCourseForm, videoUrl: e.target.value})} />
                <p className="text-[10px] text-muted-foreground mt-1">We will automatically fetch the video thumbnail for you.</p>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Difficulty Level</label>
                <div className="flex gap-4">
                  {["Beginner", "Intermediate", "Advanced"].map(lvl => (
                    <label key={lvl} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="level" checked={newCourseForm.level === lvl} onChange={() => setNewCourseForm({...newCourseForm, level: lvl})} className="accent-primary" /> {lvl}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCourseModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCourse}>Save Course</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-all ${active ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      <Icon className="w-5 h-5" /> {label}
    </button>
  );
}