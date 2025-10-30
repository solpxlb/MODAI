import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit, 
  Trash2, 
  Plus, 
  MessageSquare, 
  Users, 
  Settings, 
  Brain,
  ExternalLink 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WalletAuthButton } from '@/components/WalletAuthButton';

interface TelegramGroup {
  id: string;
  chat_id: number;
  group_title: string;
  group_name: string;
  is_active: boolean;
  created_at: string;
}

interface GroupContext {
  id: string;
  context_type: string;
  title: string;
  content: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface ConversationMessage {
  id: string;
  telegram_message_id: number;
  telegram_user_id: number;
  username: string;
  message_text: string;
  bot_response: string | null;
  processed_at: string | null;
  created_at: string;
}

export default function GroupContextManager() {
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [contexts, setContexts] = useState<GroupContext[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [jwtWallet, setJwtWallet] = useState<string | null>(null);
  const [jwtChecked, setJwtChecked] = useState(false);
  
  // Form states
  const [editingContext, setEditingContext] = useState<GroupContext | null>(null);
  const [newContextType, setNewContextType] = useState('project_description');
  const [newContextTitle, setNewContextTitle] = useState('');
  const [newContextContent, setNewContextContent] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupData();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGroups(data || []);
      if (data && data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
      } else if (!data || data.length === 0) {
        // Diagnose JWT wallet claim visibility for RLS
        const { data: jwt } = await supabase.rpc('get_jwt_wallet_address');
        setJwtWallet(jwt ?? null);
        setJwtChecked(true);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGroupData = async () => {
    if (!selectedGroup) return;

    try {
      // Load contexts
      const { data: contextData, error: contextError } = await supabase
        .from('group_contexts')
        .select('*')
        .eq('group_id', selectedGroup.id)
        .order('priority', { ascending: false });

      if (contextError) throw contextError;
      setContexts(contextData || []);

      // Load recent messages
      const { data: messageData, error: messageError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('group_id', selectedGroup.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (messageError) throw messageError;
      setMessages(messageData || []);

    } catch (error) {
      console.error('Error loading group data:', error);
      toast({
        title: "Error",
        description: "Failed to load group data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addOrUpdateContext = async () => {
    if (!newContextTitle.trim() || !newContextContent.trim() || !selectedGroup) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingContext) {
        // Update existing context
        const { error } = await supabase
          .from('group_contexts')
          .update({
            context_type: newContextType as any,
            title: newContextTitle.trim(),
            content: newContextContent.trim()
          })
          .eq('id', editingContext.id);

        if (error) throw error;
        
        toast({
          title: "Context Updated",
          description: "Successfully updated context.",
        });
      } else {
        // Add new context
        const { error } = await supabase
          .from('group_contexts')
          .insert({
            group_id: selectedGroup.id,
            context_type: newContextType as any,
            title: newContextTitle.trim(),
            content: newContextContent.trim(),
            priority: contexts.length + 1
          });

        if (error) throw error;
        
        toast({
          title: "Context Added",
          description: "Successfully added new context.",
        });
      }

      // Reset form
      setNewContextTitle('');
      setNewContextContent('');
      setNewContextType('project_description');
      setEditingContext(null);
      
      // Reload data
      loadGroupData();

    } catch (error) {
      console.error('Error saving context:', error);
      toast({
        title: "Error",
        description: "Failed to save context. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteContext = async (contextId: string) => {
    if (!confirm('Are you sure you want to delete this context?')) return;

    try {
      const { error } = await supabase
        .from('group_contexts')
        .delete()
        .eq('id', contextId);

      if (error) throw error;

      toast({
        title: "Context Deleted",
        description: "Successfully deleted context.",
      });

      loadGroupData();
    } catch (error) {
      console.error('Error deleting context:', error);
      toast({
        title: "Error",
        description: "Failed to delete context. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (context: GroupContext) => {
    setEditingContext(context);
    setNewContextType(context.context_type);
    setNewContextTitle(context.title);
    setNewContextContent(context.content);
  };

  const cancelEditing = () => {
    setEditingContext(null);
    setNewContextTitle('');
    setNewContextContent('');
    setNewContextType('project_description');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(220_8%_20%/0.1),transparent_50%)]" />
        
        <Card className="relative z-10 bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
          <CardContent className="p-8 text-center space-y-4">
            <div className="relative mx-auto w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-crypto-orange/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-crypto-orange animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Loading Dashboard</h3>
              <p className="text-muted-foreground">Retrieving your group data and settings...</p>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(220_8%_20%/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(220_8%_15%/0.1),transparent_50%)]" />
      
      <div className="container mx-auto max-w-7xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="space-y-4">
          <Card className="bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
            <CardHeader className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-crypto-orange/10 border border-crypto-orange/20">
                  <Users className="h-8 w-8 text-crypto-orange" />
                </div>
                <div className="flex-1 space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-crypto-orange bg-clip-text text-transparent">
                    Group Management Dashboard
                  </h1>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Manage AI context, monitor conversations, and configure settings for your Telegram groups
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Empty state when no groups are found */}
        {groups.length === 0 && (
          <Card className="bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/20">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">No Groups Found</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  We couldn't find any Telegram groups associated with your wallet. Make sure you've added the bot to your groups and completed the setup process.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50 border border-border/20">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {jwtChecked
                    ? (jwtWallet
                        ? `Connected wallet: ${jwtWallet.slice(0, 8)}...${jwtWallet.slice(-8)}. If this isn't the wallet linked to your groups, please disconnect and reconnect with the correct wallet.`
                        : 'No wallet detected in your session. Please reconnect your wallet to access your groups.')
                    : 'Verifying your wallet connection...'}
                </p>
              </div>
              <div className="flex justify-center">
                <WalletAuthButton 
                  className="bg-crypto-orange hover:bg-crypto-orange/90 text-white shadow-lg hover:shadow-xl hover:shadow-crypto-orange/25 transition-all duration-300" 
                  showDisconnect 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Group Selection */}
        {groups.length > 0 && (
          <Card className="bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-crypto-orange/10 border border-crypto-orange/20">
                  <Users className="h-6 w-6 text-crypto-orange" />
                </div>
                <div>
                  <CardTitle className="text-xl">Select Group</CardTitle>
                  <CardDescription>Choose a group to manage its AI settings and view analytics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <Card 
                    key={group.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg bg-muted/30 border-border/50 ${
                      selectedGroup?.id === group.id 
                        ? 'ring-2 ring-crypto-orange bg-crypto-orange/5 border-crypto-orange/30 shadow-lg shadow-crypto-orange/10' 
                        : 'hover:border-crypto-orange/20 hover:bg-crypto-orange/5'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">{group.group_title}</h4>
                        <p className="text-sm text-muted-foreground font-mono">
                          ID: {group.chat_id}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={group.is_active ? 'default' : 'secondary'}
                          className={group.is_active ? 'bg-crypto-orange/20 text-crypto-orange border-crypto-orange/30' : ''}
                        >
                          {group.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {selectedGroup?.id === group.id && (
                          <div className="w-2 h-2 rounded-full bg-crypto-orange animate-pulse" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedGroup && (
          <Tabs defaultValue="contexts" className="space-y-6">
            <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/20">
              <TabsTrigger 
                value="contexts" 
                className="flex items-center gap-2 data-[state=active]:bg-crypto-orange data-[state=active]:text-white"
              >
                <Brain className="h-4 w-4" />
                AI Context
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="flex items-center gap-2 data-[state=active]:bg-crypto-orange data-[state=active]:text-white"
              >
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 data-[state=active]:bg-crypto-orange data-[state=active]:text-white"
              >
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* AI Context Tab */}
            <TabsContent value="contexts">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Add/Edit Context Form */}
                <Card className="bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-crypto-orange/10 border border-crypto-orange/20">
                        <Plus className="h-5 w-5 text-crypto-orange" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {editingContext ? 'Edit Context' : 'Add New Context'}
                        </CardTitle>
                        <CardDescription>
                          {editingContext ? 'Update existing AI knowledge' : 'Add information for the AI to understand and use'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contextType" className="text-sm font-medium">Context Type</Label>
                      <select
                        id="contextType"
                        className="w-full p-3 border border-border/50 rounded-lg bg-muted/30 focus:border-crypto-orange focus:ring-2 focus:ring-crypto-orange/20 transition-all"
                        value={newContextType}
                        onChange={(e) => setNewContextType(e.target.value)}
                      >
                        <option value="project_description">Project Description</option>
                        <option value="documentation">Documentation</option>
                        <option value="rules">Rules & Guidelines</option>
                        <option value="faq">FAQ</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contextTitle" className="text-sm font-medium">Title</Label>
                      <Input
                        id="contextTitle"
                        placeholder="e.g., Project Overview, Community Guidelines"
                        value={newContextTitle}
                        onChange={(e) => setNewContextTitle(e.target.value)}
                        className="bg-muted/30 border-border/50 focus:border-crypto-orange focus:ring-2 focus:ring-crypto-orange/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contextContent" className="text-sm font-medium">Content</Label>
                      <Textarea
                        id="contextContent"
                        placeholder="Enter detailed information that will help the AI understand your context..."
                        rows={8}
                        value={newContextContent}
                        onChange={(e) => setNewContextContent(e.target.value)}
                        className="bg-muted/30 border-border/50 focus:border-crypto-orange focus:ring-2 focus:ring-crypto-orange/20 resize-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={addOrUpdateContext} 
                        className="flex-1 bg-crypto-orange hover:bg-crypto-orange/90 text-white shadow-lg hover:shadow-xl hover:shadow-crypto-orange/25 transition-all duration-300"
                      >
                        {editingContext ? 'Update Context' : 'Add Context'}
                      </Button>
                      {editingContext && (
                        <Button variant="outline" onClick={cancelEditing} className="border-border/50 hover:bg-muted/50">
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Contexts */}
                <Card className="bg-card/80 backdrop-blur-lg border-border/20 shadow-elevated">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-crypto-orange/10 border border-crypto-orange/20">
                        <Brain className="h-5 w-5 text-crypto-orange" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Existing Context</CardTitle>
                        <CardDescription>
                          {contexts.length} context item{contexts.length !== 1 ? 's' : ''} configured
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contexts.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <div className="p-4 rounded-xl bg-muted/50 border border-border/20 inline-block">
                          <Brain className="h-8 w-8 text-muted-foreground mx-auto" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">No context items yet</p>
                          <p className="text-sm text-muted-foreground">Add your first context to help the AI understand your group</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {contexts.map((context) => (
                          <div key={context.id} className="p-4 border border-border/30 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-foreground">{context.title}</h4>
                                  <Badge variant="outline" className="text-xs bg-crypto-orange/10 text-crypto-orange border-crypto-orange/30">
                                    {context.context_type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                  {context.content}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(context)}
                                  className="h-8 w-8 p-0 hover:bg-crypto-orange/10 hover:text-crypto-orange"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteContext(context.id)}
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Conversations</CardTitle>
                  <CardDescription>
                    Latest {messages.length} messages from your group
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages recorded yet. Start chatting in your Telegram group!
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.map((message) => (
                        <div key={message.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                @{message.username || 'Unknown'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {new Date(message.created_at).toLocaleString()}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm mb-2">{message.message_text}</p>
                          {message.bot_response && (
                            <div className="mt-2 p-2 bg-muted rounded">
                              <p className="text-sm"><strong>Bot:</strong> {message.bot_response}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Group Settings</CardTitle>
                  <CardDescription>
                    Configure group behavior and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Group Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Title:</strong> {selectedGroup.group_title}</p>
                      <p><strong>Chat ID:</strong> {selectedGroup.chat_id}</p>
                      <p><strong>Status:</strong> 
                        <Badge variant={selectedGroup.is_active ? 'default' : 'secondary'} className="ml-2">
                          {selectedGroup.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </p>
                      <p><strong>Created:</strong> {new Date(selectedGroup.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">AI Configuration</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your AI bot is configured with {contexts.length} context item(s)
                    </p>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View in Telegram
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {groups.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Groups Found</h3>
              <p className="text-muted-foreground mb-4">
                Add the bot to your Telegram group and run /settings@modfi_bot to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
