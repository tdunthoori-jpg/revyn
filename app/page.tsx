"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  PhoneCall, TrendingUp, Zap, Brain, BarChart3,
  ArrowRight, CheckCircle, Star, Users, Shield
} from "lucide-react"
import { motion } from "framer-motion"
import { FadeUp, Stagger, StaggerItem } from "@/components/motion"
import { useAuth } from "@clerk/nextjs"

const features = [
  {
    icon: Brain,
    title: "AI Call Analysis",
    desc: "Upload any sales call and get a full breakdown — scores, objections, key moments, and exact coaching notes in seconds.",
    color: "from-violet-500/20 to-violet-500/0",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },
  {
    icon: Zap,
    title: "Ghost Close Script",
    desc: "Didn't close? AI generates a hyper-personalized follow-up script targeting that specific prospect's exact objections.",
    color: "from-amber-500/20 to-amber-500/0",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
  },
  {
    icon: BarChart3,
    title: "Pre-Call Briefing",
    desc: "Feed in the lead's application. Get a battle card telling your closer exactly how to open and what objections to expect.",
    color: "from-cyan-500/20 to-cyan-500/0",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
  },
  {
    icon: Users,
    title: "Setter/Closer Dashboard",
    desc: "See who's performing, who's sending bad leads, and which setter/closer pairings produce the most revenue.",
    color: "from-emerald-500/20 to-emerald-500/0",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
]

const stats = [
  { value: "23%", label: "Average close rate lift" },
  { value: "2x", label: "Faster rep onboarding" },
  { value: "68%", label: "Refund risk reduction" },
]

const testimonials = [
  { quote: "We went from a 22% close rate to 41% in 6 weeks. The ghost close script alone recovered 4 deals in our first month.", name: "Marcus T.", role: "Business coach, $25K offer" },
  { quote: "I fired my $3K/month sales coach and replaced them with Revyn. Better insights, 24/7, and it never misses a call.", name: "Priya S.", role: "Agency owner" },
  { quote: "The setter dashboard showed me that one setter was tanking my numbers. Fixed it and our show rate jumped from 55% to 78%.", name: "Jake R.", role: "High ticket closer" },
]

const plans = [
  {
    name: "Solo",
    price: "$197",
    desc: "For solo coaches and closers",
    features: ["20 calls/month", "AI call analysis & scoring", "Ghost close scripts", "Pre-call briefing cards", "Objection playbook"],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Agency",
    price: "$497",
    desc: "For teams with setters and closers",
    features: ["Unlimited calls", "Everything in Solo", "Setter/closer dashboard", "Team performance tracking", "Multi-user access (up to 10)"],
    cta: "Start free trial",
    highlighted: true,
  },
]

export default function LandingPage() {
  const { isSignedIn } = useAuth()
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-sm">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Revyn</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white glow-sm">
                  Go to dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign in</Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white glow-sm">
                    Get started free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-28 px-6 text-center gradient-hero">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-[120px] animate-orb" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[300px] rounded-full bg-violet-600/6 blur-[100px] animate-orb" style={{ animationDelay: "-4s" }} />
          <div className="absolute top-40 right-1/4 w-[350px] h-[250px] rounded-full bg-purple-700/5 blur-[80px] animate-orb" style={{ animationDelay: "-8s" }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8"
          >
            <Shield className="w-3.5 h-3.5" />
            Built exclusively for the setter/closer model
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-[0.95]"
          >
            Your AI sales coach
            <br />
            <span className="gradient-text">that never sleeps.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Revyn analyzes every sales call, scores your setters and closers,
            generates ghost close scripts, and tells you exactly why you&apos;re
            losing deals — before it costs you another $10K.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap mb-20"
          >
            <Link href="/sign-up">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 px-8 h-12 text-base glow animate-pulse-glow">
                  Start analyzing calls free <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
            <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/10 hover:bg-white/5">
                  {isSignedIn ? "Go to dashboard" : "Sign in"}
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5 max-w-2xl mx-auto"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.1 }}
                className="bg-background/80 px-6 py-6 text-center"
              >
                <div className="text-4xl font-bold gradient-text mb-1.5">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-28">
        <FadeUp className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Features</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything Gong won&apos;t
            <br />build for you
          </h2>
          <p className="text-muted-foreground text-lg">Because they don&apos;t know what a setter is.</p>
        </FadeUp>

        <Stagger className="grid md:grid-cols-2 gap-4" staggerDelay={0.1}>
          {features.map((f, i) => (
            <StaggerItem key={f.title}>
            <motion.div
              key={f.title}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl p-8 border border-white/6 bg-card overflow-hidden hover:border-white/12 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-5`}
                >
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2.5">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-28 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Social proof</div>
            <h2 className="text-4xl font-bold">Coaches closing more deals</h2>
          </FadeUp>
          <Stagger className="grid md:grid-cols-3 gap-4" staggerDelay={0.1}>
            {testimonials.map((t) => (
              <StaggerItem key={t.name}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl p-6 border border-white/6 bg-card hover:border-white/10 h-full"
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i, type: "spring" }} viewport={{ once: true }}>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Pricing</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-3">Simple, honest pricing</h2>
            <p className="text-muted-foreground">Start free. Cancel anytime.</p>
          </FadeUp>
          <Stagger className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto" staggerDelay={0.12}>
            {plans.map((plan) => (
              <StaggerItem key={plan.name}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-2xl p-8 border h-full ${
                    plan.highlighted ? "border-primary/40 bg-primary/5 glow" : "border-white/6 bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium mb-4">
                      Most popular
                    </div>
                  )}
                  <div className="text-xl font-bold mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-6">{plan.desc}</div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((feat, fi) => (
                      <motion.li key={feat}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: fi * 0.05 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        {feat}
                      </motion.li>
                    ))}
                  </ul>
                  <Link href="/sign-up">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className={`w-full h-11 ${plan.highlighted ? "bg-primary hover:bg-primary/90 text-white" : "border-white/10 hover:bg-white/5"}`}
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Stop losing deals
              <br />you should win.
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">Upload your first call free. No credit card required.</p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 px-10 h-12 text-base glow">
                Analyze your first call free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/80 flex items-center justify-center">
              <PhoneCall className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">Revyn</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Revyn. Built for closers who refuse to lose.</p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
