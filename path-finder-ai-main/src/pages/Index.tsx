import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { AboutSection } from "@/components/AboutSection";
import { WhyChooseSection } from "@/components/WhyChooseSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Added id="home" */}
      <div id="home">
        <HeroSection />
      </div>
      
      <FeaturesSection />
      
      {/* Added id="about" */}
      <div id="about" className="scroll-mt-20"> 
        <AboutSection />
      </div>
      
      <WhyChooseSection />
      
      {/* Added id="contact" */}
      <div id="contact" className="scroll-mt-20">
        <CTASection />
      </div>
      
      <Footer />
    </main>
  );
};

export default Index;