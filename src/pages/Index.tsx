import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BotSetupForm from "@/components/BotSetupForm";
import BotDashboard from "@/components/BotDashboard";
import { Features } from "@/components/ui/features-4";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'setup' | 'dashboard'>('home');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDashboardClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  if (currentView === 'setup') {
    return (
      <>
        <Navbar />
        <div className="pt-20">
          <BotSetupForm />
        </div>
      </>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <>
        <Navbar />
        <div className="pt-20">
          <BotDashboard />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <HeroSection />
      <Features />
      <HowItWorks />
      <PricingSection />
      <Footer />
    </>
  );
};

export default Index;