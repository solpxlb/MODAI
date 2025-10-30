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

  const navItems = [
    { label: 'Home', onClick: () => navigate('/') },
    { label: 'Dashboard', onClick: handleDashboardClick },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-warm backdrop-blur-md border-b border-border/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center">
              <img src={ModFiLogo} alt="ModFi" className="h-14 w-auto transition-transform duration-300 group-hover:scale-105" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}

            <div className="pl-4 border-l border-border">
              <WalletAuthButton showDisconnect={true} />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-minimal transition-colors duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ?
              <X className="h-5 w-5 text-foreground" /> :
              <Menu className="h-5 w-5 text-foreground" />
            }
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 mt-4 space-y-1 animate-slide-in">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-minimal rounded-md transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-border/50">
              <WalletAuthButton className="w-full" showDisconnect={true} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};