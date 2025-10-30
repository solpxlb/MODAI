import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Wallet, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletAuthButtonProps {
  className?: string;
  showDisconnect?: boolean;
}

export const WalletAuthButton: React.FC<WalletAuthButtonProps> = ({ 
  className,
  showDisconnect = false 
}) => {
  const { connected, connecting, publicKey } = useWallet();
  const { user, loading, signInWithWallet, signOut } = useAuth();
  const { setVisible } = useWalletModal();

  // If wallet is not connected, show wallet connect button
  if (!connected) {
    return (
      <Button
        onClick={() => setVisible(true)}
        disabled={connecting}
        className={cn("bg-crypto-orange hover:bg-crypto-orange/90 text-white rounded-xl", className)}
        size="lg"
      >
        {connecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Select Wallet
          </>
        )}
      </Button>
    );
  }

  // If wallet is connected but user is not authenticated, show sign in button
  if (connected && !user) {
    return (
      <Button
        onClick={signInWithWallet}
        disabled={loading || connecting}
        className={cn("bg-crypto-orange hover:bg-crypto-orange/90 text-white rounded-xl", className)}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Sign In with Wallet
          </>
        )}
      </Button>
    );
  }

  // If user is authenticated, show signed in state and optional disconnect
  if (user && showDisconnect) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="text-sm text-muted-foreground">
          Connected: {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
        </div>
        <Button
          onClick={signOut}
          size="sm"
          className="border border-crypto-orange/20 bg-transparent hover:bg-crypto-orange hover:text-white text-crypto-orange"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      Wallet Connected
    </div>
  );
};

export const WalletConnectButton: React.FC<{ className?: string }> = ({ className }) => {
  return <WalletAuthButton className={className} />;
};

export const WalletDisconnectSection: React.FC<{ className?: string }> = ({ className }) => {
  return <WalletAuthButton className={className} showDisconnect />;
};