import { Shield, Zap, Globe, HeartHandshake } from "lucide-react";

const reasons = [
  {
    icon: Zap,
    title: "Speed to Value",
    description: "Get instant AI-powered recommendations and insights to accelerate your career decisions.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "End-to-end encryption for all your data with 99.5% system uptime guarantee.",
  },
  {
    icon: Globe,
    title: "Inclusive & Accessible",
    description: "Multilingual support and WCAG 2.1 compliant interface for users with disabilities.",
  },
  {
    icon: HeartHandshake,
    title: "Your Partner in Growth",
    description: "Personalized guidance from education to employment with continuous learning support.",
  },
];

export function WhyChooseSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="text-gradient">EduCareer?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A platform obsessed with quality, security, and measurable impact
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => (
            <div
              key={reason.title}
              className="text-center p-6 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-5 hover:scale-110 transition-transform duration-300">
                <reason.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{reason.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
