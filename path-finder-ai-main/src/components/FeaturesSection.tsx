import { 
  GraduationCap, 
  BarChart3, 
  MessageSquareText, 
  FileText, 
  Lightbulb,
  Users
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "College Finder",
    description: "AI-powered predictions and comparisons based on your exam scores, preferences, and career goals.",
    tags: ["ML", "Predictions", "Compare"],
  },
  {
    icon: BarChart3,
    title: "Skill Gap Analyzer",
    description: "Identify missing competencies and get personalized upskilling recommendations with visual analytics.",
    tags: ["Analysis", "Learning", "Growth"],
  },
  {
    icon: MessageSquareText,
    title: "AI Career Chatbot",
    description: "Multilingual conversational assistant using RAG technology for real-time career guidance.",
    tags: ["NLP", "RAG", "24/7"],
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Generate ATS-friendly resumes with AI scoring and improvement suggestions for better job matches.",
    tags: ["ATS", "AI Score", "Templates"],
  },
  {
    icon: Lightbulb,
    title: "EasyPrep Module",
    description: "Aptitude tests, mock interviews, and gamified learning with badges and rewards.",
    tags: ["Tests", "Gamification", "Practice"],
  },
  {
    icon: Users,
    title: "Mentorship Hub",
    description: "Connect with mentors, NGOs, and alumni for personalized guidance and support.",
    tags: ["Networking", "Guidance", "Support"],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Core <span className="text-gradient">Features</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful AI-driven tools to guide you from education to employment
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-glow transition-all duration-300 hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
