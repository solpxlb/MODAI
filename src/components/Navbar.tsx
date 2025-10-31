import { useState } from "react";
import { Menu, X } from "lucide-react";
import ModFiLogo from "/orb.png";
import { useNavigate } from "react-router-dom";
import { WalletAuthButton } from "@/components/WalletAuthButton";
import { useAuth } from "@/components/AuthProvider";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDashboardClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Home', onClick: () => navigate('/') },
    { label: 'Dashboard', onClick: handleDashboardClick },
    { label: 'How It Works', onClick: () => scrollToSection('how-it-works') },
    { label: 'Pricing', onClick: () => scrollToSection('pricing') },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-warm backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo - Left */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center">
              <img src={ModFiLogo} alt="ModFi" className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
            </div>
          </div>

          {/* Centered Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="relative text-sm font-normal text-gray-600 hover:text-charcoal transition-all duration-200 group py-1"
              >
                {item.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>

          {/* Wallet Button - Right */}
          <div className="hidden lg:block">
            <WalletAuthButton showDisconnect={true} />
          </div>

          {/* Mobile/Tablet Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ?
              <X className="h-5 w-5 text-charcoal" /> :
              <Menu className="h-5 w-5 text-charcoal" />
            }
          </button>
        </div>

        {/* Mobile/Tablet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 mt-4 space-y-1 animate-slide-in">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-sm font-normal text-gray-600 hover:text-charcoal hover:bg-gray-50 rounded-md transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-200">
              <WalletAuthButton className="w-full" showDisconnect={true} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};