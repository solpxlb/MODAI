import { PricingCard } from "@/components/ui/dark-gradient-pricing"

const PricingSection = () => {
  return (
    <section id="pricing" className="relative overflow-hidden bg-minimal/30 py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6 text-charcoal">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Start free and scale as your community grows
          </p>
          <p className="text-sm text-muted-foreground/80">
            💡 Purchasing unlocks in 2 days
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PricingCard
            tier="Free"
            price="$0/mo"
            bestFor="Perfect for getting started"
            CTA="Get Started Free"
            benefits={[
              { text: "1 Telegram group", checked: true },
              { text: "100 queries/month", checked: true },
              { text: "Basic context upload", checked: true },
              { text: "Analytics dashboard", checked: false },
              { text: "Priority support", checked: false },
              { text: "Unlimited queries", checked: false },
            ]}
          />
          <PricingCard
            tier="Standard"
            price="$50/mo"
            bestFor="Best for growing communities"
            CTA="Buy Standard Plan"
            benefits={[
              { text: "2 Telegram groups", checked: true },
              { text: "Unlimited queries", checked: true },
              { text: "Unlimited context updates", checked: true },
              { text: "Analytics dashboard", checked: true },
              { text: "Priority support", checked: true },
              { text: "Advanced moderation", checked: false },
            ]}
          />
          <PricingCard
            tier="Scale"
            price="$150/mo"
            bestFor="Best for large communities"
            CTA="Buy Scale Plan"
            benefits={[
              { text: "Unlimited Telegram groups", checked: true },
              { text: "Unlimited queries", checked: true },
              { text: "Full analytics suite", checked: true },
              { text: "Premium support", checked: true },
              { text: "Advanced moderation", checked: true },
              { text: "Custom integrations", checked: true },
            ]}
          />
        </div>
      </div>
    </section>
  )
}

export default PricingSection