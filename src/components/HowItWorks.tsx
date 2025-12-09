import { UserPlus, Terminal, Link, Settings, Zap } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: "Add Warden Bot to Your Group",
      description: "Invite @wardenai_bot to your Telegram community where you're an admin."
    },
    {
      number: 2,
      icon: Terminal,
      title: "Run the Setup Command",
      description: "In your group chat, type:",
      code: "/settings@wardenai_bot"
    },
    {
      number: 3,
      icon: Link,
      title: "Get Your Private Setup Link",
      description: "Warden Bot will instantly DM you a secure link."
    },
    {
      number: 4,
      icon: Settings,
      title: "Connect & Configure",
      description: "Open the link, connect your wallet on our website, and set up your project context — tokenomics, roadmap, FAQs, rules, and more."
    },
    {
      number: 5,
      icon: Zap,
      title: "Go Live Instantly",
      description: "That's it. Your Warden Bot concierge is now active in your community, ready to answer questions, onboard newcomers, and help your mods 24/7."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6 text-charcoal">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Get your AI moderator up and running in minutes with our simple 5-step process.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="space-y-12">
          {/* Steps 1-3 */}
          <div className="grid md:grid-cols-3 gap-8">
            {steps.slice(0, 3).map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-card border border-border/50 rounded-minimal-lg p-8 h-full transition-all duration-300 hover:shadow-minimal hover:-translate-y-1">
                    {/* Step Number and Icon */}
                    <div className="flex items-center mb-6">
                      <div className="flex items-center justify-center w-16 h-16 bg-logo-subtle rounded-minimal-lg mr-4 group-hover:scale-105 transition-transform duration-300">
                        <span className="text-2xl font-bold text-orange-500">{step.number}</span>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-minimal group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold mb-3 text-charcoal">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>

                    {/* Code block for step 2 */}
                    {step.code && (
                      <div className="mt-4 p-3 bg-minimal rounded-minimal border border-border/50 font-mono text-sm">
                        <code className="text-orange-500">{step.code}</code>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Steps 4-5 */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {steps.slice(3, 5).map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="bg-card border border-border/50 rounded-minimal-lg p-8 h-full transition-all duration-300 hover:shadow-minimal hover:-translate-y-1">
                    {/* Step Number and Icon */}
                    <div className="flex items-center mb-6">
                      <div className="flex items-center justify-center w-16 h-16 bg-logo-subtle rounded-minimal-lg mr-4 group-hover:scale-105 transition-transform duration-300">
                        <span className="text-2xl font-bold text-orange-500">{step.number}</span>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-minimal group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold mb-3 text-charcoal">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;