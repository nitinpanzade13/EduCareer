import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress"; // Make sure you have this component or use a simple div
import { 
  User, Mail, Calendar, MapPin, Save, ArrowLeft, 
  Camera, Briefcase, GraduationCap, Award, Loader2, Plus, X,
  Linkedin, Github, CheckCircle2, AlertCircle
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Extended Interface for complete profile
interface UserProfile {
  name: string;
  email: string;
  uid: string;
  skills: string[];
  // New Fields
  bio?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  education?: string;
  experience?: string;
  
  stats: {
    profileComplete: number; // We will calculate this locally now
    badgesEarned: number;
  };
  createdAt: string;
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // --- FORM STATES ---
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  // --- 1. REAL-TIME PROGRESS CALCULATION ---
  const { progress, missingFields } = useMemo(() => {
    let score = 0;
    const missing = [];

    if (name.length > 2) score += 10; else missing.push("Name");
    if (bio.length > 10) score += 15; else missing.push("Bio");
    if (location.length > 2) score += 10; else missing.push("Location");
    if (education.length > 5) score += 15; else missing.push("Education");
    if (experience.length > 5) score += 15; else missing.push("Experience");
    if (skills.length > 0) score += 15; else missing.push("Skills");
    if (linkedin.length > 5 || github.length > 5) score += 20; else missing.push("Social Links");

    return { progress: Math.min(score, 100), missingFields: missing };
  }, [name, bio, location, education, experience, skills, linkedin, github]);

  // --- 2. FETCH DATA ---
  useEffect(() => {
    const fetchUser = async () => {
      const localData = localStorage.getItem("educareer_user");
      if (!localData) return navigate("/auth");
      
      const { uid } = JSON.parse(localData);
      
      try {
        const res = await fetch(`http://localhost:5000/api/users/${uid}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          // Populate States
          setName(data.name || "");
          setBio(data.bio || "");
          setLocation(data.location || "");
          setLinkedin(data.linkedin || "");
          setGithub(data.github || "");
          setEducation(data.education || "");
          setExperience(data.experience || "");
          setSkills(data.skills || []);
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // --- 3. SAVE CHANGES ---
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const updatedProfile = {
      name, bio, location, linkedin, github, education, experience, skills,
      stats: { ...user.stats, profileComplete: progress } // Save the calculated progress
    };

    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      if (!res.ok) throw new Error("Failed to update");

      // Update local storage for sidebar consistency
      const localData = JSON.parse(localStorage.getItem("educareer_user") || "{}");
      localStorage.setItem("educareer_user", JSON.stringify({ ...localData, name }));

      toast({ title: "Profile Updated", description: `You are now ${progress}% complete!` });
    } catch (error) {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">My Profile</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: IDENTITY & STATS --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-600 to-violet-600" />
              <div className="relative mt-8 mb-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-background p-1 border-4 border-background shadow-lg">
                  <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-600">
                    {name.charAt(0)}
                  </div>
                </div>
                <button className="absolute bottom-0 right-1/2 translate-x-10 translate-y-2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 shadow-md">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground">{name}</h2>
              <p className="text-muted-foreground mb-4">{user.email}</p>
              {location && <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-6"><MapPin className="w-3 h-3"/> {location}</p>}

              {/* Progress Bar */}
              <div className="mb-6 text-left">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Profile Completion</span>
                  <span className={progress === 100 ? "text-green-600 font-bold" : "text-primary"}>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {progress < 100 && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-500" /> 
                    Missing: {missingFields[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                <div>
                  <p className="text-2xl font-bold text-primary">{user.stats?.badgesEarned || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase">Badges</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{skills.length}</p>
                  <p className="text-xs text-muted-foreground uppercase">Skills</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: EDIT FORMS --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Personal Information */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Bio / Summary</Label>
                  <Textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="Briefly describe yourself..." 
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Professional Details (NEW) */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Professional Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Education</Label>
                  <Input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="e.g. B.Tech Computer Science, VIIT" />
                </div>
                <div className="space-y-2">
                  <Label>Experience / Current Role</Label>
                  <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. Student, Intern at..." />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Linkedin className="w-4 h-4 text-blue-600"/> LinkedIn Profile</Label>
                    <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Github className="w-4 h-4"/> GitHub Profile</Label>
                    <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Skills */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" /> Skills
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} placeholder="Add a skill (e.g., React, Python)" />
                  <Button onClick={addSkill} variant="secondary"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[50px] p-4 border border-dashed border-border rounded-xl">
                  {skills.length === 0 && <p className="text-sm text-muted-foreground w-full text-center py-2">Add skills to increase profile strength.</p>}
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {skill} <button onClick={() => removeSkill(skill)} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-4">
              <Button size="lg" onClick={handleSave} disabled={saving} className="shadow-2xl shadow-primary/30">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}