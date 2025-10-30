import { Button } from "@/components/ui/button";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { MessageSquare, Twitter, ArrowRight } from "lucide-react";

const HeroSection = () => {
  const handleGetStarted = () => {
    window.open('https://t.me/modfi_bot?startgroup=true', '_blank');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-warm">
      {/* FlickeringGrid Background */}
      <FlickeringGrid
        className="absolute inset-0 z-0"
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        color="#FF6B35"
        maxOpacity={0.15}
      />

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-minimal border border-border/50 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="text-sm font-medium text-muted-foreground">AI-Powered Moderation</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 animate-fade-in text-charcoal">
          Meet ModFi AI
        </h1>

        {/* Subheading */}
        <h2 className="text-xl md:text-2xl lg:text-3xl mb-8 text-gray animate-fade-in" style={{animationDelay: '0.1s'}}>
          Your AI Telegram Moderator for Solana Communities
        </h2>

        {/* Description */}
        <p className="text-base md:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: '0.2s'}}>
          The most advanced AI moderator for your Solana Telegram groups. 24/7 automated support with intelligent responses and comprehensive community management powered by ModFi AI.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3 text-base shadow-minimal hover:shadow-glow transition-all duration-300 hover:scale-105 group"
          >
            Get Started Now
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => window.open('https://t.me/modfi_bot', '_blank')}
            className="border-border hover:bg-minimal hover:border-border/80 font-medium px-8 py-3 text-base transition-all duration-300"
          >
            View Demo
          </Button>
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-6 md:gap-8 animate-fade-in" style={{animationDelay: '0.4s'}}>
          <a
            href="https://t.me/modfi_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-orange-500 transition-colors duration-300 group"
          >
            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">Community</span>
          </a>
          <a
            href="https://t.me/modfi_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-orange-500 transition-colors duration-300 group mr-1"
          >
            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">Try Bot</span>
          </a>
          <a
            href="https://x.com/modfiai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-orange-500 transition-colors duration-300 group"
          >
            <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">Twitter</span>
          </a>
        </div>
      </div>
    </div>
  );
};
export default HeroSection;