import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { WalletContextProvider } from "@/components/WalletProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import GroupContextManager from "./components/GroupContextManager";
import GroupSetup from "./components/GroupSetup";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Component to handle dynamic page titles
const PageTitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "AI Telegram Moderator",
      "/auth": "Sign In - AI Telegram Moderator",
      "/setup": "Group Setup - AI Telegram Moderator",
      "/dashboard": "Dashboard - AI Telegram Moderator",
    };

    // Set title based on current path, default to main title
    document.title = titles[location.pathname] || "AI Telegram Moderator";
  }, [location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletContextProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PageTitleManager />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Layout><Auth /></Layout>} />
              <Route path="/setup" element={<Layout><GroupSetup /></Layout>} />
              <Route 
                path="/dashboard" 
                element={
                  <Layout>
                    <ProtectedRoute>
                      <GroupContextManager />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </WalletContextProvider>
  </QueryClientProvider>
);

export default App;
