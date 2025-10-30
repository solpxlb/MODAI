import { Bot, Layers, Clock, RefreshCw, Shield, BarChart } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: "Smart Auto-Replies",
    description: "Instantly answers community questions about your project using custom context you provide — from tokenomics to roadmap updates.",
    gradient: "from-orange-500/10 to-orange-500/5",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400"
  },
  {
    icon: Layers,
    title: "Multi-Project Ready",
    description: "One bot, multiple projects. Easily manage and isolate data across different Solana tokens or communities.",
    gradient: "from-gray-500/10 to-gray-500/5",
    iconBg: "bg-gray-500/10",
    iconColor: "text-gray-600 dark:text-gray-400"
  },
  {
    icon: Clock,
    title: "Always On",
    description: "Available 24/7 in your Telegram or Discord to engage users, onboard newcomers, and reduce moderator load.",
    gradient: "from-orange-400/10 to-orange-400/5",
    iconBg: "bg-orange-400/10",
    iconColor: "text-orange-500 dark:text-orange-400"
  },
  {
    icon: RefreshCw,
    title: "Seamless Updates",
    description: "Add, edit, or remove context as your project evolves — ModFi learns and adapts with you.",
    gradient: "from-orange-600/10 to-orange-600/5",
    iconBg: "bg-orange-600/10",
    iconColor: "text-orange-700 dark:text-orange-300"
  },
  {
    icon: Shield,
    title: "Safety Guardrails",
    description: "Built-in content filtering with human-in-the-loop escalation for sensitive queries.",
    gradient: "from-gray-800/10 to-gray-800/5",
    iconBg: "bg-gray-800/10",
    iconColor: "text-gray-800 dark:text-gray-400"
  },
  {
    icon: BarChart,
    title: "Analytics Dashboard",
    description: "Track engagement, trending questions, and community sentiment in real time.",
    gradient: "from-orange-500/10 to-gray-500/5",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-minimal/50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6 text-charcoal">
            Powerful Features for Modern Communities
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            ModFi is your AI-powered community concierge built for Solana projects. It helps project teams scale conversations, answer questions 24/7, and keep their communities safe, fun, and informed — without burning out moderators.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative bg-card border border-border/50 rounded-minimal-lg p-8 hover:shadow-minimal-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Subtle gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-minimal-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-minimal-lg ${feature.iconBg} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-3 text-charcoal group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}