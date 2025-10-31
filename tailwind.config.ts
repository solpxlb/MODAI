import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'playfair': ['Playfair Display', 'Georgia', 'serif'],
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'geist': ['Geist', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Logo-based Color Palette
        // Base colors
        white: "#FFFFFF",
        cream: "#FAFAFA",
        light: "#F5F5F5",
        gray50: "#F9FAFB",
        gray100: "#F3F4F6",
        gray200: "#E5E7EB",
        gray300: "#D1D5DB",
        gray400: "#9CA3AF",
        gray500: "#6B7280",
        gray600: "#4B5563",
        charcoal: "#1A1A1A",
        dark: "#2D2D2D",

        // Orange accent colors from logo
        orange: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#FF6B35", // Primary orange from logo
          600: "#E55A2B", // Darker orange for hover
          700: "#C24420",
          800: "#9A3412",
          900: "#7C2D12",
          warm: "#FF6B35",
          accent: "#FF6B35",
        },

        // Neutral colors for text
        text: {
          primary: "#1A1A1A",
          secondary: "#4B5563",
          muted: "#6B7280",
          light: "#9CA3AF",
        },

        // Background colors
        bg: {
          primary: "#FFFFFF",
          secondary: "#FAFAFA",
          tertiary: "#F5F5F5",
          warm: "#f3efe7", // Navbar background
        },

        // System colors (keeping for shadcn compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        crypto: {
          green: "hsl(var(--crypto-green))",
          red: "hsl(var(--crypto-red))",
          blue: "hsl(var(--crypto-blue))",
          purple: "hsl(var(--crypto-purple))",
          gold: "hsl(var(--crypto-gold))",
          orange: "#FF6B35",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-card": "var(--gradient-card)",
        "gradient-hero": "var(--gradient-hero)",
        "logo-gradient": "linear-gradient(135deg, #FF6B35 0%, #2D2D2D 100%)",
        "logo-subtle": "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(45, 45, 45, 0.05) 100%)",
        "warm-gradient": "linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)",
        "charcoal-gradient": "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
        "orange-gradient": "linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)",
      },
      boxShadow: {
        "glow": "var(--shadow-glow)",
        "card": "var(--shadow-card)",
        "elevated": "var(--shadow-elevated)",
        "minimal": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "minimal-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
        "subtle": "0 2px 8px 0 rgba(0, 0, 0, 0.06)",
        "orange": "0 4px 14px 0 rgba(255, 107, 53, 0.25)",
        "charcoal": "0 4px 14px 0 rgba(26, 26, 26, 0.15)",
        "warm": "0 2px 8px 0 rgba(255, 107, 53, 0.1)",
      },
      transitionTimingFunction: {
        "smooth": "var(--transition-smooth)",
        "spring": "var(--transition-spring)",
        "minimal": "cubic-bezier(0.4, 0.0, 0.2, 1)",
        "minimal-in": "cubic-bezier(0.0, 0.0, 0.2, 1)",
        "minimal-out": "cubic-bezier(0.4, 0.0, 1, 1)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "minimal": "6px",
        "minimal-lg": "12px",
        "minimal-xl": "16px",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in": {
          from: {
            opacity: "0",
            transform: "translateX(-20px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "scale-in": {
          from: {
            opacity: "0",
            transform: "scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-in": "slide-in 0.5s ease-out",
        "scale-in": "scale-in 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
