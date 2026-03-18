import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CollegeFinder from "./pages/CollegeFinder";
import SkillAnalyzer from "./pages/SkillAnalyzer";
import Chatbot from "./pages/Chatbot";
import ResumeBuilder from "./pages/ResumeBuilder";
import Upskills from "./pages/Upskills";
import Profile from "./pages/Profile"; // 1. Import Profile
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// 🔒 Security Wrapper: Checks if user is logged in
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("educareer_user");
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={<AdminDashboard />} />
          
          <Route path="/profile" element={ // 2. Add Profile Route
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/college-finder" element={
            <ProtectedRoute>
              <CollegeFinder />
            </ProtectedRoute>
          } />
          
          <Route path="/skill-analyzer" element={
            <ProtectedRoute>
              <SkillAnalyzer />
            </ProtectedRoute>
          } />
          
          <Route path="/chatbot" element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          } />
          
          <Route path="/resume-builder" element={
            <ProtectedRoute>
              <ResumeBuilder />
            </ProtectedRoute>
          } />
          
          <Route path="/upskills" element={
            <ProtectedRoute>
              <Upskills />
            </ProtectedRoute>
          } />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;