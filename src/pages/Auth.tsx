import React, { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { WalletAuthButton } from '@/components/WalletAuthButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import WardenBotLogo from "/warden_logo_trans.png";

const Auth: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      // User is authenticated, redirect to intended destination
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background with gradient and glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-crypto-purple/10 via-transparent to-crypto-orange/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--crypto-orange)/0.1),transparent_50%)]" />

      <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <img src={WardenBotLogo} alt="Warden Bot" className="h-16 w-auto" />
              <div className="absolute inset-0 rounded-full blur-xl bg-crypto-orange/20" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-crypto-orange bg-clip-text text-transparent">
              Welcome to Warden Bot
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed">
              Connect your Solana wallet to access your AI-powered Telegram group management platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground">Secure Wallet Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Solana wallet for secure, decentralized authentication
                </p>
              </div>
              <div className="relative">
                <WalletAuthButton className="w-full h-12 text-base font-medium bg-crypto-orange hover:bg-crypto-orange/90 border-0 shadow-lg hover:shadow-xl hover:shadow-crypto-orange/25 transition-all duration-300" />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Supported Wallets</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/20">
                <div className="w-2 h-2 rounded-full bg-crypto-orange" />
                <span className="text-sm font-medium">Phantom</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/20">
                <div className="w-2 h-2 rounded-full bg-crypto-orange" />
                <span className="text-sm font-medium">Solflare</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground leading-relaxed">
            By connecting your wallet, you agree to our{" "}
            <span className="text-crypto-orange hover:underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="text-crypto-orange hover:underline cursor-pointer">Privacy Policy</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;