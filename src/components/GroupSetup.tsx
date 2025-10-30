import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, ExternalLink, Settings, Users, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { WalletAuthButton } from '@/components/WalletAuthButton';
import { useWallet } from '@solana/wallet-adapter-react';

interface GroupSetupProps {
  token?: string;
}

interface SetupSession {
  telegram_user_id: number;
  group_chat_id: number;
  expires_at: string;
  is_used: boolean;
}

interface TelegramGroup {
  id: string;
  chat_id: number;
  group_title: string;
  group_name: string;
  is_active: boolean;
}

interface GroupContext {
  id: string;
  context_type: string;
  title: string;
  content: string;
  priority: number;
  is_active: boolean;
}

export default function GroupSetup({ token }: GroupSetupProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { publicKey } = useWallet();
  
  const setupToken = token || searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SetupSession | null>(null);
  const [group, setGroup] = useState<TelegramGroup | null>(null);
  const [contexts, setContexts] = useState<GroupContext[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Form states for new context
  const [newContextType, setNewContextType] = useState('project_description');
  const [newContextTitle, setNewContextTitle] = useState('');
  const [newContextContent, setNewContextContent] = useState('');

  const linkAttemptedRef = useRef(false);
  const linkingRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);
  const successToastShownRef = useRef(false);

  // Reset guards when the setup token changes
  useEffect(() => {
    if (setupToken && setupToken !== lastTokenRef.current) {
      lastTokenRef.current = setupToken;
      linkAttemptedRef.current = false;
      successToastShownRef.current = false;
    }
  }, [setupToken]);

  // Show error if no token provided
  useEffect(() => {
    if (!setupToken) {
      setError('Setup token is required');
      toast({
        title: "Invalid Access",
        description: "No setup token provided. Please use the link from Telegram.",
        variant: "destructive",
      });
    }
  }, [setupToken]);

const linkWalletAndLoadSetup = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    console.log('Linking wallet with setup token...');

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Safer wallet address derivation - prioritize user metadata, then check if user.id is a web3 address
    let walletAddress = user.user_metadata?.wallet_address;
    
    if (!walletAddress && user.id) {
      // Check if user.id looks like a web3 address (not a UUID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      if (!isUUID && user.id.length > 32) {
        walletAddress = user.id;
      }
    }

    // Finally, try the connected wallet
    if (!walletAddress && publicKey) {
      walletAddress = publicKey.toString();
    }

    if (!walletAddress) {
      throw new Error('No wallet address found');
    }

      // Call the edge function to link wallet with setup token
      const { data: linkResult, error: linkError } = await supabase.functions.invoke(
        'link-wallet-with-setup-token',
        {
          body: {
            setupToken,
            walletAddress,
          },
        }
      );

      if (linkError) {
        console.error('Error linking wallet:', linkError);
        throw new Error(linkError.message || 'Failed to link wallet');
      }

      if (!linkResult?.success) {
        throw new Error(linkResult?.error || 'Failed to link wallet');
      }

      console.log('Wallet linked successfully, loading setup session...');
      
      // Refresh the session to get updated JWT claims with wallet_address
      await supabase.auth.refreshSession();
      await new Promise((r) => setTimeout(r, 300));
      
      // Now load the setup session
      await loadSetupSession();
      
      if (!successToastShownRef.current) {
        toast({
          title: "Authentication Successful",
          description: "Your wallet has been linked to the Telegram group setup.",
        });
        successToastShownRef.current = true;
      }

    } catch (err) {
      console.error('Error in linkWalletAndLoadSetup:', err);
      setError(err instanceof Error ? err.message : 'Failed to authenticate with setup session');
      setLoading(false);
      
    toast({
      title: "Authentication Failed",
      description: err instanceof Error ? err.message : 'Failed to authenticate with setup session',
      variant: "destructive",
    });
  }
}, [setupToken, user]);

  const linkWalletAndLoadSetupOnce = useCallback(async () => {
    if (linkingRef.current) return;
    linkingRef.current = true;
    try {
      await linkWalletAndLoadSetup();
    } finally {
      linkingRef.current = false;
    }
  }, [linkWalletAndLoadSetup]);

  const loadSetupSession = async (): Promise<boolean> => {
    try {
      // Verify setup session
      const { data: sessionData, error: sessionError } = await supabase
        .from('setup_sessions')
        .select('*')
        .eq('token', setupToken)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError || !sessionData) {
        toast({
          title: "Invalid or Expired Token",
          description: "This setup link has expired or is invalid. Please generate a new one from Telegram.",
          variant: "destructive",
        });
        return false;
      }

      setSession(sessionData);

      // Load group information with proper error handling
      const { data: groupData, error: groupError } = await supabase
        .from('telegram_groups')
        .select('*')
        .eq('chat_id', sessionData.group_chat_id)
        .maybeSingle();

      if (groupError) {
        console.error('Failed to load group:', groupError);
        setError('Failed to load group information');
        return false;
      }

      if (!groupData) {
        const { data: jwtWallet } = await supabase.rpc('get_jwt_wallet_address');
        const hint = jwtWallet ? `Detected wallet in token: ${jwtWallet}` : 'No wallet detected in token';
        console.error('No group access - user may not be a member or RLS policy blocking access', { hint });
        setError(`No access to this group. ${hint}. Please sign in with the wallet linked to this group and retry.`);
        return false;
      }

      setGroup(groupData);

      // Load existing contexts
      const { data: contextData } = await supabase
        .from('group_contexts')
        .select('*')
        .eq('group_id', groupData.id)
        .order('priority', { ascending: false });

      if (contextData) {
        setContexts(contextData);
      }

      return true;
    } catch (error) {
      console.error('Error loading setup session:', error);
      toast({
        title: "Error",
        description: "Failed to load setup session. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!setupToken || authLoading || !user) return;
    if (linkAttemptedRef.current) return;
    linkAttemptedRef.current = true;
    (async () => {
      setLoading(true);
      setError(null);
      const hasAccess = await loadSetupSession();
      if (!hasAccess) {
        await linkWalletAndLoadSetupOnce();
        await loadSetupSession();
      }
    })();
  }, [setupToken, user, authLoading, linkWalletAndLoadSetupOnce]);

  const addContext = async () => {
    if (!newContextTitle.trim() || !newContextContent.trim() || !group) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content for the context.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('group_contexts')
        .insert({
          group_id: group.id,
          context_type: newContextType as any,
          title: newContextTitle.trim(),
          content: newContextContent.trim(),
          priority: contexts.length + 1
        })
        .select()
        .single();

      if (error) throw error;

      setContexts([...contexts, data]);
      setNewContextTitle('');
      setNewContextContent('');
      
      toast({
        title: "Context Added",
        description: "Successfully added new context to your group.",
      });
    } catch (error) {
      console.error('Error adding context:', error);
      toast({
        title: "Error",
        description: "Failed to add context. Please try again.",
        variant: "destructive",
      });
    }
  };

  const completeSetup = async () => {
    if (!session || !group) return;

    try {
      // Mark session as used
      await supabase
        .from('setup_sessions')
        .update({ is_used: true })
        .eq('token', setupToken);

      // Update user profile with wallet if provided
      if (walletAddress.trim()) {
        await supabase
          .from('user_profiles')
          .update({ 
            wallet_address: walletAddress.trim(),
            is_verified: true 
          })
          .eq('telegram_user_id', session.telegram_user_id);
      }

      toast({
        title: "Setup Complete!",
        description: "Your group AI context has been configured successfully.",
      });

      // Redirect to dashboard or success page
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error completing setup:', error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(220_8%_20%/0.1),transparent_50%)]" />
        
        <Card className="w-full max-w-2xl relative z-10 bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative mx-auto w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                {authLoading ? "Authenticating..." : "Loading Setup Session..."}
              </h3>
              <p className="text-muted-foreground">
                {authLoading 
                  ? "Verifying your wallet connection and permissions" 
                  : "Retrieving your group configuration and settings"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication screen if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(220_8%_20%/0.1),transparent_50%)]" />
        
        <Card className="w-full max-w-2xl relative z-10 bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <Wallet className="h-12 w-12 text-primary" />
                <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-lg"></div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Authenticate with Solana Wallet
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Connect your Solana wallet to access the advanced group setup interface for your Telegram bot
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-primary/5 border-primary/20 text-foreground">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-sm leading-relaxed">
                Wallet authentication is required to configure your Telegram group's AI settings and manage bot permissions securely.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-4">
              <WalletAuthButton className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 border-0 shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300" />
            </div>
            
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border/20">
              <h4 className="font-medium text-foreground">After connecting your wallet:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Configure AI context and behavior for your group
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Set up group-specific settings and preferences
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Manage your profile and bot permissions
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if authentication linking failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-gray-800/10" />
        
        <Card className="w-full max-w-2xl relative z-10 bg-card/80 backdrop-blur-lg border-destructive/20 shadow-elevated">
          <CardContent className="p-8 space-y-6">
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-sm leading-relaxed">
                {error}
              </AlertDescription>
            </Alert>
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Authentication Failed</h3>
                <p className="text-muted-foreground">
                  There was an issue connecting your wallet to the group setup. Please try again.
                </p>
              </div>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-gray-800/10" />
        
        <Card className="w-full max-w-2xl relative z-10 bg-card/80 backdrop-blur-lg border-destructive/20 shadow-elevated">
          <CardContent className="p-8 text-center space-y-6">
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-sm leading-relaxed">
                Invalid or expired setup session. Please generate a new setup link from your Telegram group by using the <code className="px-1.5 py-0.5 bg-muted rounded text-xs">/setup</code> command.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Session Expired</h3>
              <p className="text-muted-foreground">
                The setup session has expired or is no longer valid. Return to your Telegram group to start over.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(220_8%_20%/0.1),transparent_50%)]" />
      
      <div className="container mx-auto max-w-6xl relative z-10 space-y-6">
        
        {/* Header */}
        <Card className="bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
          <CardHeader className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  Group Setup: {group.group_title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Configure AI context and advanced settings for your Telegram group to enhance bot interactions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="contexts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm border border-border/20">
            <TabsTrigger value="contexts" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              AI Context
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Profile
            </TabsTrigger>
            <TabsTrigger value="complete" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Complete Setup
            </TabsTrigger>
          </TabsList>

          {/* AI Context Tab */}
          <TabsContent value="contexts">
            <div className="space-y-6">
              
              {/* Existing Contexts */}
              {contexts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Context</CardTitle>
                    <CardDescription>
                      Your group's current AI knowledge base
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contexts.map((context) => (
                      <div key={context.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{context.title}</h4>
                          <Badge variant="outline">
                            {context.context_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {context.content}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Add New Context */}
              <Card>
                <CardHeader>
                  <CardTitle>Add AI Context</CardTitle>
                  <CardDescription>
                    Add information that the AI should know about your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contextType">Context Type</Label>
                      <select
                        id="contextType"
                        className="w-full p-2 bg-input border-border rounded-md text-foreground"
                        value={newContextType}
                        onChange={(e) => setNewContextType(e.target.value)}
                      >
                        <option value="project_description">Project Description</option>
                        <option value="documentation">Documentation</option>
                        <option value="rules">Rules</option>
                        <option value="faq">FAQ</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="contextTitle">Title</Label>
                      <Input
                        id="contextTitle"
                        placeholder="e.g., Project Overview"
                        value={newContextTitle}
                        onChange={(e) => setNewContextTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contextContent">Content</Label>
                    <Textarea
                      id="contextContent"
                      placeholder="Enter the information the AI should know..."
                      rows={6}
                      value={newContextContent}
                      onChange={(e) => setNewContextContent(e.target.value)}
                    />
                  </div>
                  <Button onClick={addContext} className="w-full">
                    Add Context
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Setup</CardTitle>
                <CardDescription>
                  Connect your Solana wallet (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="walletAddress">Solana Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    placeholder="Enter your Solana wallet address (optional)"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be used for future Solana-related features
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complete Setup Tab */}
          <TabsContent value="complete">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Complete Setup
                </CardTitle>
                <CardDescription>
                  Review and finalize your group configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Summary */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Group Information</h4>
                    <p className="text-sm text-muted-foreground">
                      {group.group_title} (Chat ID: {group.chat_id})
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium">AI Context Items</h4>
                    <p className="text-sm text-muted-foreground">
                      {contexts.length} context item(s) configured
                    </p>
                  </div>
                  
                  {walletAddress && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium">Wallet Connected</h4>
                        <p className="text-sm text-muted-foreground font-mono">
                          {walletAddress}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Once you complete setup, your AI bot will be ready to respond intelligently in your Telegram group using the context you've provided.
                  </AlertDescription>
                </Alert>

                <Button onClick={completeSetup} className="w-full" size="lg">
                  Complete Setup
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
