import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  GoogleAuthProvider,
  AuthError,
  User as FirebaseUser
} from "firebase/auth";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // 🔄 Sync with MongoDB Backend
  const syncUserWithBackend = async (user: FirebaseUser, name?: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: name || user.displayName || "Student",
          photoURL: user.photoURL
        }),
      });

      if (!response.ok) throw new Error('Failed to sync');
      console.log("✅ Synced with MongoDB");
    } catch (error) {
      console.error("❌ Backend Sync Error:", error);
    }
  };

  // 🌐 Handle Google Login Only
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Sync user to MongoDB
      await syncUserWithBackend(user);

      // 2. Fetch fresh data from MongoDB to get the Role
      let userRole = "student";
      try {
        const dbRes = await fetch(`http://localhost:5000/api/users/${user.uid}`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          userRole = dbData.role || "student";
        }
      } catch (err) {
        console.error("Failed to fetch role from DB", err);
      }

      // 3. Save session locally WITH ROLE
      localStorage.setItem("educareer_user", JSON.stringify({
        name: user.displayName || "Student",
        email: user.email,
        uid: user.uid,
        role: userRole, // ✅ Role saved here
        isLoggedIn: true
      }));

      toast({
        title: "Welcome!",
        description: `Successfully logged in as ${user.displayName}`
      });

      // 4. Redirect based on Role
      if (userRole === "admin" || userRole === "superadmin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      console.error(error);
      toast({
        title: "Login Failed",
        description: "Could not authenticate with Google",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 📧 Handle Email/Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password) {
      toast({ title: "Error", description: "Fill all fields", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      let userCredential;

      // ----------------- LOGIN FLOW -----------------
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Fetch fresh data from MongoDB to get the Role
        let userRole = "student";
        try {
          const dbRes = await fetch(`http://localhost:5000/api/users/${userCredential.user.uid}`);
          if (dbRes.ok) {
            const dbData = await dbRes.json();
            userRole = dbData.role || "student";
          }
        } catch (err) {
          console.error("Failed to fetch role from DB", err);
        }

        // Save session locally WITH ROLE
        localStorage.setItem("educareer_user", JSON.stringify({
          name: userCredential.user.displayName || formData.name || "Student",
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          role: userRole, // ✅ Role saved here
          isLoggedIn: true
        }));
        
        toast({ title: "Success", description: "Authentication successful." });

        // Redirect based on Role
        if (userRole === "admin" || userRole === "superadmin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }

      // ----------------- SIGN UP FLOW -----------------
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: formData.name });
        }
        await syncUserWithBackend(userCredential.user, formData.name);

        // New signups are always default 'student'
        localStorage.setItem("educareer_user", JSON.stringify({
          name: formData.name || "Student",
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          role: "student",
          isLoggedIn: true
        }));
        
        toast({ title: "Success", description: "Account created successfully." });
        navigate("/dashboard");
      }

    } catch (error) {
      const firebaseError = error as AuthError;
      let msg = "Authentication failed.";
      if (firebaseError.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (firebaseError.code === 'auth/user-not-found') msg = "No user found.";
      if (firebaseError.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (firebaseError.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-card rounded-2xl shadow-glow border border-border p-8 animate-fade-up">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              Edu<span className="text-gradient">Career</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {isLogin ? "Sign in to continue" : "Start your journey today"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            )}

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Google Login Only */}
          <div className="grid grid-cols-1 gap-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
          </div>

          <p className="text-center mt-8 text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}