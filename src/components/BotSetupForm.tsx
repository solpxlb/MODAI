import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, FileText, Settings, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BotSetupForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    botName: "",
    tokenName: "",
    mintAddress: "",
    projectDescription: "",
    documentation: "",
    websiteUrl: "",
    telegramToken: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Bot Created Successfully!",
      description: "Your Solana moderation bot is now being configured. You'll receive setup instructions shortly.",
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <div className="p-3 rounded-full bg-gradient-primary shadow-glow">
              <Settings className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Setup Your Bot</h1>
          <p className="text-muted-foreground text-lg">
            Configure your AI moderator in just a few simple steps
          </p>
        </div>

        <Card className="bg-gradient-card shadow-elevated border-border/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-crypto-purple" />
              Bot Configuration
            </CardTitle>
            <CardDescription>
              Provide the essential information for your Solana project bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/20">
                  <TabsTrigger value="basic" className="data-[state=active]:bg-crypto-purple data-[state=active]:text-primary-foreground">
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="project" className="data-[state=active]:bg-crypto-purple data-[state=active]:text-primary-foreground">
                    Project Details
                  </TabsTrigger>
                  <TabsTrigger value="telegram" className="data-[state=active]:bg-crypto-purple data-[state=active]:text-primary-foreground">
                    Telegram Setup
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="botName">Bot Name</Label>
                      <Input
                        id="botName"
                        placeholder="e.g., MySolanaBot"
                        value={formData.botName}
                        onChange={(e) => setFormData({...formData, botName: e.target.value})}
                        className="bg-input/50 border-border/50 focus:border-crypto-purple"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tokenName">Token Name</Label>
                      <Input
                        id="tokenName"
                        placeholder="e.g., MyToken"
                        value={formData.tokenName}
                        onChange={(e) => setFormData({...formData, tokenName: e.target.value})}
                        className="bg-input/50 border-border/50 focus:border-crypto-purple"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mintAddress">Solana Mint Address</Label>
                    <Input
                      id="mintAddress"
                      placeholder="e.g., 11111111111111111111111111111111"
                      value={formData.mintAddress}
                      onChange={(e) => setFormData({...formData, mintAddress: e.target.value})}
                      className="bg-input/50 border-border/50 focus:border-crypto-purple font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      The bot will fetch real-time stats for this token
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="project" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">Project Description</Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="Describe your Solana project, its purpose, features, and key information that the bot should know..."
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({...formData, projectDescription: e.target.value})}
                      className="bg-input/50 border-border/50 focus:border-crypto-purple min-h-[120px] resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="documentation">Documentation/Whitepaper</Label>
                    <Textarea
                      id="documentation"
                      placeholder="Paste your project's documentation, whitepaper content, or key information here..."
                      value={formData.documentation}
                      onChange={(e) => setFormData({...formData, documentation: e.target.value})}
                      className="bg-input/50 border-border/50 focus:border-crypto-purple min-h-[150px] resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://yourproject.com"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                      className="bg-input/50 border-border/50 focus:border-crypto-purple"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="telegram" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="telegramToken">Telegram Bot Token</Label>
                    <Input
                      id="telegramToken"
                      placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi"
                      value={formData.telegramToken}
                      onChange={(e) => setFormData({...formData, telegramToken: e.target.value})}
                      className="bg-input/50 border-border/50 focus:border-crypto-purple font-mono text-sm"
                    />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-crypto-blue/10 border border-crypto-blue/20">
                    <h4 className="font-semibold text-crypto-blue mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      How to get your Telegram Bot Token:
                    </h4>
                    <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                      <li>Message <Badge variant="secondary" className="mx-1">@BotFather</Badge> on Telegram</li>
                      <li>Send <Badge variant="secondary" className="mx-1">/newbot</Badge> command</li>
                      <li>Follow the setup instructions</li>
                      <li>Copy the provided token and paste it above</li>
                    </ol>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg group"
                >
                  <Zap className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Deploy Bot
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BotSetupForm;