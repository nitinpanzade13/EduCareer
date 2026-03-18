import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, BookOpen, Target, BrainCircuit } from "lucide-react";

const floatingCards = [
  { icon: BookOpen, label: "College Insights", delay: "0s" },
  { icon: Target, label: "Career Pathways", delay: "0.1s" },
  { icon: BrainCircuit, label: "AI Analysis", delay: "0.2s" },
  { icon: Sparkles, label: "Skill Matching", delay: "0.3s" },
];

export function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen pt-24 pb-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border animate-fade-up">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-secondary-foreground">
                AI-Powered Education Platform
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Navigate Your
              <span className="text-gradient"> Educational </span>
              Journey with AI
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
              From college selection to career success—our AI-driven platform provides personalized guidance, 
              skill analysis, and real-time insights to shape your future.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="heroOutline" size="xl">
                Explore Features
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <div>
                <p className="text-3xl font-bold text-gradient">10K+</p>
                <p className="text-sm text-muted-foreground">Students Guided</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gradient">500+</p>
                <p className="text-sm text-muted-foreground">Colleges Listed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gradient">95%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Right Content - Floating Cards */}
          <div className="relative hidden lg:block">
            <div className="relative w-full h-[500px]">
              {floatingCards.map((card, index) => (
                <div
                  key={card.label}
                  className="absolute animate-float"
                  style={{
                    animationDelay: card.delay,
                    top: `${20 + (index % 2) * 35}%`,
                    left: `${10 + (index % 2 === 0 ? index * 20 : index * 15)}%`,
                  }}
                >
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                      <card.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">{card.label}</p>
                  </div>
                </div>
              ))}

              {/* Central Illustration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                    <BrainCircuit className="w-16 h-16 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
