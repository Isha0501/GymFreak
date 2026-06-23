import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Brain,
  Target,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Dumbbell,
  RefreshCw,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Schedule",
    description:
      "Tell us your goals and availability. We build an optimal weekly split and explain exactly why.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Zap,
    title: "Just Tell Me What To Do",
    description:
      "One tap. Instantly get today's full workout — exercises, sets, reps, rest times. No thinking required.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Target,
    title: "Exercise Intelligence",
    description:
      "Every exercise comes with alternatives, similarity scores, and the tradeoffs explained clearly.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Progress That Matters",
    description:
      "Track volume by muscle group, spot imbalances, and celebrate personal records as they happen.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
];

const benefits = [
  "Personalized schedule for your goals and schedule",
  "Smart exercise selection based on your equipment",
  "Injury-aware recommendations",
  "Swap any exercise with intelligent alternatives",
  "Track sets, reps, and weight over time",
  "Instant workout generation — zero decision fatigue",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">GymFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <Badge variant="purple" className="mb-6 text-xs">
          Free to use · No credit card required
        </Badge>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Stop guessing.
          <br />
          <span className="text-primary">Start growing.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          GymFlow AI builds your perfect workout schedule, selects the right exercises for your
          goals, and eliminates decision fatigue — so you spend your energy lifting, not planning.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup">
            <Button size="xl" className="w-full sm:w-auto gap-2">
              Build My Program
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="xl" variant="outline" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Just Tell Me CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 sm:p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            &quot;Just Tell Me What To Do&quot;
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Our signature feature. One tap and you get a complete, personalized workout for today —
            no choices, no paralysis, just results.
          </p>
          <Link href="/signup">
            <Button variant="success" size="lg" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try It Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Built to remove confusion</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every feature is designed to answer the questions that stop people at the gym door.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6 flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-base">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Everything you need to make progress</h2>
              <p className="text-muted-foreground mb-6">
                From beginner to advanced, GymFlow AI adapts to where you are and where you want
                to go.
              </p>
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <Dumbbell className="w-3 h-3 text-primary-foreground" />
            </div>
            <span>GymFlow AI</span>
          </div>
          <p>Built for people who want to get stronger without the confusion.</p>
        </div>
      </footer>
    </div>
  );
}
