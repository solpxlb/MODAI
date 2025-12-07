import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithWallet: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Profile linking is now handled by the link-wallet-with-setup-token edge function
          // when users complete the group setup process
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithWallet = async () => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signMessage) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Create a minimal wallet wrapper for Supabase
      // Only provide publicKey and signMessage - let Supabase create the SIWS message format
      const supabaseWallet = {
        publicKey: wallet.publicKey,
        signMessage: wallet.signMessage,
      };

      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: 'solana',
        statement: 'I accept the Terms of Service and Privacy Policy of SolanaBot AI.',
        wallet: supabaseWallet as any,
      });

      if (error) {
        throw error;
      }

      // After successful auth, update user metadata with wallet address
      if (data.user) {
        await supabase.auth.updateUser({
          data: { wallet_address: wallet.publicKey!.toBase58() }
        });
      }

      toast({
        title: "Successfully signed in!",
        description: "Welcome to SolanaBot AI.",
      });
    } catch (error: any) {
      console.error('Error signing in with wallet:', error);

      // Provide more specific error messages
      let errorMessage = "Failed to sign in with wallet.";
      if (error.message) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Unable to connect to authentication service. Please check your network connection.";
        } else if (error.message.includes('wallet')) {
          errorMessage = "Wallet authentication failed. Please try again.";
        } else if (error.message.includes('User rejected')) {
          errorMessage = "Signature request was rejected. Please try again and approve the signature.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Disconnect wallet as well
      if (wallet.disconnect) {
        await wallet.disconnect();
      }

      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: error.message || "Failed to sign out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithWallet,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};