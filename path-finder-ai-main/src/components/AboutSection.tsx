import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Personalized AI recommendations for your unique profile",
  "Real-time job market insights and career pathways",
  "Multilingual support including Hindi and Marathi",
  "Gamified learning with badges and achievements",
];

export function AboutSection() {
  return (
    <section id="about" className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              About <span className="text-gradient">EduCareer</span>
            </h2>
            
            <p className="text-muted-foreground text-lg leading-relaxed">
              We're building a unified AI-powered ecosystem that assists students in educational planning, 
              skill development, and career decision-making. Our platform bridges the gap between education, 
              skills, and employability.
            </p>

            <div className="space-y-4 pt-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-3xl blur-2xl" />
            <div className="relative bg-card border border-border rounded-2xl p-8 shadow-card">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-secondary rounded-xl p-6 text-center hover:shadow-soft transition-shadow">
                  <p className="text-4xl font-bold text-gradient">500+</p>
                  <p className="text-sm text-muted-foreground mt-1">Colleges & Universities</p>
                </div>
                <div className="bg-secondary rounded-xl p-6 text-center hover:shadow-soft transition-shadow">
                  <p className="text-4xl font-bold text-gradient">100+</p>
                  <p className="text-sm text-muted-foreground mt-1">Career Pathways</p>
                </div>
                <div className="bg-secondary rounded-xl p-6 text-center hover:shadow-soft transition-shadow">
                  <p className="text-4xl font-bold text-gradient">50+</p>
                  <p className="text-sm text-muted-foreground mt-1">Skill Courses</p>
                </div>
                <div className="bg-secondary rounded-xl p-6 text-center hover:shadow-soft transition-shadow">
                  <p className="text-4xl font-bold text-gradient">10+</p>
                  <p className="text-sm text-muted-foreground mt-1">Languages Supported</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground text-center">
                  Supporting <span className="font-semibold text-primary">Digital India</span> & <span className="font-semibold text-primary">Skill India</span> initiatives
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
