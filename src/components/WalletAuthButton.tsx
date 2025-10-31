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
        className={cn("bg-orange-500 hover:bg-orange-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-all duration-200", className)}
        size="sm"
      >
        {connecting ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-3 w-3" />
            Connect Wallet
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
        className={cn("bg-orange-500 hover:bg-orange-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-all duration-200", className)}
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-3 w-3" />
            Sign In
          </>
        )}
      </Button>
    );
  }

  // If user is authenticated, show signed in state and optional disconnect
  if (user && showDisconnect) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="text-xs text-gray-600 hidden sm:block">
          {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
        </div>
        <Button
          onClick={signOut}
          size="sm"
          className="border border-orange-200 bg-transparent hover:bg-orange-500 hover:text-white text-orange-500 rounded-md px-3 py-1 text-xs font-medium transition-all duration-200"
        >
          <LogOut className="mr-1 h-3 w-3" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("text-xs text-gray-600 hidden sm:block", className)}>
      Connected
    </div>
  );
};

export const WalletConnectButton: React.FC<{ className?: string }> = ({ className }) => {
  return <WalletAuthButton className={className} />;
};

export const WalletDisconnectSection: React.FC<{ className?: string }> = ({ className }) => {
  return <WalletAuthButton className={className} showDisconnect />;
};