import { Button } from "@/components/ui/button";
import { 
  GraduationCap, User, BookOpen, Target, MessageSquare, 
  FileText, Brain, Award, TrendingUp, Calendar, Bell,
  LogOut, Settings, ChevronRight, Star, Clock, CheckCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Types
interface DashboardData {
  name: string;
  email: string;
  stats?: { // Optional to prevent crashes
    profileComplete: number;
    coursesStarted: number;
    badgesEarned: number;
    totalPoints: number;
  };
  recentActivities?: {
    text: string;
    time: string;
    points: string;
    type: string;
  }[];
  upcomingTasks?: {
    title: string;
    deadline: string;
    priority: "High" | "Medium" | "Low";
  }[];
}

const quickActions = [
  { icon: GraduationCap, label: "College Finder", href: "/college-finder", color: "from-violet-500 to-purple-600" },
  { icon: Brain, label: "Skill Analyzer", href: "/skill-analyzer", color: "from-blue-500 to-cyan-600" },
  { icon: MessageSquare, label: "AI Chatbot", href: "/chatbot", color: "from-green-500 to-emerald-600" },
  { icon: FileText, label: "Resume Builder", href: "/resume-builder", color: "from-orange-500 to-amber-600" },
  { icon: BookOpen, label: "Upskills", href: "/upskills", color: "from-pink-500 to-rose-600" },
];

export default function Dashboard() {
  const [user, setUser] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const localData = localStorage.getItem("educareer_user");
      
      if (!localData) {
        navigate("/auth");
        return;
      }

      const { uid } = JSON.parse(localData);

      try {
        const response = await fetch(`http://localhost:5000/api/users/${uid}`);
        if (!response.ok) throw new Error("Failed to fetch");
        
        const dbData = await response.json();
        setUser(dbData);
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("educareer_user");
    navigate("/");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <div className="p-10 text-center">Failed to load user data.</div>;

  const firstName = user.name ? user.name.split(' ')[0] : "Student";

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:block shadow-sm">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Edu<span className="text-primary">Career</span>
            </span>
          </Link>
        </div>

        <nav className="px-4 space-y-1 mt-4">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium border border-primary/20">
            <TrendingUp className="w-5 h-5" />
            Dashboard
          </Link>
          {quickActions.map(action => (
             <Link key={action.label} to={action.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
             <action.icon className="w-5 h-5" />
             {action.label}
           </Link>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors mb-2 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm text-foreground truncate">{user.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email || "No Email"}</p>
            </div>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 text-xs" asChild>
              <Link to="/profile">
                <Settings className="w-3 h-3 mr-2" />
                Settings
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
              <LogOut className="w-3 h-3 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen bg-slate-50/50">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome back, {firstName}! 👋</h1>
              <p className="text-sm text-muted-foreground mt-1">Here is what's happening with your projects today.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="rounded-full relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
              </Button>
              <Button className="rounded-full px-6" asChild>
                <Link to="/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats Cards - WITH SAFETY CHECKS (?. and || 0) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">+2%</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{user.stats?.profileComplete || 0}%</p>
              <p className="text-sm text-muted-foreground font-medium">Profile Completion</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50/80 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{user.stats?.coursesStarted || 0}</p>
              <p className="text-sm text-muted-foreground font-medium">Active Courses</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50/80 flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{user.stats?.badgesEarned || 0}</p>
              <p className="text-sm text-muted-foreground font-medium">Badges Earned</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-50/80 flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{user.stats?.totalPoints || 0}</p>
              <p className="text-sm text-muted-foreground font-medium">Total Points</p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="group bg-white rounded-2xl p-5 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${action.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150`} />
                  
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">{action.label}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    Open Tool <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {user.recentActivities && user.recentActivities.length > 0 ? (
                  user.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <Star className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{activity.text}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(activity.time).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{activity.points}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">Upcoming Tasks</h2>
              <div className="space-y-3">
                {user.upcomingTasks && user.upcomingTasks.length > 0 ? (
                  user.upcomingTasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-all">
                      <div className={`w-2 h-10 rounded-full ${
                        task.priority === 'High' ? 'bg-red-500' :
                        task.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                           <Calendar className="w-3 h-3" /> {task.deadline}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        task.priority === 'High' ? 'bg-red-50 text-red-600' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 text-xs">View Full Calendar</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}