import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-crypto-purple/5 via-transparent to-crypto-orange/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--crypto-orange)/0.05),transparent_70%)]" />
      
      <div className="text-center space-y-6 relative z-10 max-w-md mx-auto">
        <div className="space-y-4">
          <div className="relative">
            <h1 className="text-8xl font-bold bg-gradient-to-r from-crypto-orange to-crypto-purple bg-clip-text text-transparent">
              404
            </h1>
            <div className="absolute inset-0 text-8xl font-bold text-crypto-orange/10 blur-sm">
              404
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground leading-relaxed">
              The page you're looking for doesn't exist or has been moved to a different location.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <a 
            href="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-crypto-orange hover:bg-crypto-orange/90 text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-crypto-orange/25 hover:-translate-y-0.5"
          >
            Return to Home
          </a>
          
          <div className="text-sm text-muted-foreground">
            Error Code: {location.pathname}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
