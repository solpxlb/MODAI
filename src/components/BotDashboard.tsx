import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Bot, 
  DollarSign, 
  MessageSquare, 
  Settings, 
  TrendingUp, 
  Users,
  Zap
} from "lucide-react";
import ModFiLogo from "/orb.png";

const BotDashboard = () => {
  const bots = [
    {
      id: 1,
      name: "SolDoge Bot",
      status: "Active",
      group: "@soldoge_community",
      members: 15420,
      responses: 342,
      tokenPrice: "$0.0234",
      change: "+12.5%"
    },
    {
      id: 2,
      name: "Jupiter Protocol Bot",
      status: "Active", 
      group: "@jupiter_exchange",
      members: 28650,
      responses: 158,
      tokenPrice: "$0.7821",
      change: "-2.1%"
    }
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <img src={ModFiLogo} alt="ModFi AI" className="h-12 w-auto" />
          <div>
            <h1 className="text-4xl font-bold mb-2">Bot Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Manage and monitor your ModFi AI Telegram bots
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card shadow-card border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
              <Bot className="h-4 w-4 text-crypto-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Active moderators</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-crypto-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">44,070</div>
              <p className="text-xs text-muted-foreground">Across all groups</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responses Today</CardTitle>
              <MessageSquare className="h-4 w-4 text-crypto-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">500</div>
              <p className="text-xs text-muted-foreground">+18% from yesterday</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Activity className="h-4 w-4 text-crypto-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Bot Cards */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Bots</h2>
            <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
              <Zap className="mr-2 h-4 w-4" />
              Create New Bot
            </Button>
          </div>

          <div className="grid gap-6">
            {bots.map((bot) => (
              <Card key={bot.id} className="bg-gradient-card shadow-card border-border/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <img src={ModFiLogo} alt="ModFi AI" className="h-5 w-auto" />
                        {bot.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Moderating {bot.group}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-crypto-green/20 text-crypto-green border-crypto-green/30"
                      >
                        {bot.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Members</p>
                      <p className="text-lg font-semibold">{bot.members.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Responses</p>
                      <p className="text-lg font-semibold">{bot.responses}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Token Price</p>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-crypto-gold" />
                        <p className="text-lg font-semibold">{bot.tokenPrice}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">24h Change</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp 
                          className={`h-4 w-4 ${bot.change.startsWith('+') ? 'text-crypto-green' : 'text-crypto-red'}`} 
                        />
                        <p className={`text-lg font-semibold ${bot.change.startsWith('+') ? 'text-crypto-green' : 'text-crypto-red'}`}>
                          {bot.change}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotDashboard;