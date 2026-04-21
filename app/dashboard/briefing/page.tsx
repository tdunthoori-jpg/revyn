"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { PageEnter, FadeUp, Stagger, StaggerItem } from "@/components/motion"
import { Brain, Loader2, Flame, Thermometer, Snowflake, CheckCircle, XCircle, AlertTriangle, Copy, Sparkles, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Briefing {
  closeScore: number
  temperature: "hot" | "warm" | "cold"
  primaryPainPoint: string
  likelyObjections: string[]
  recommendedOpeningAngle: string
  thingsToAvoid: string[]
  suggestedTalkingPoints: string[]
  estimatedDecisionMaker: boolean
}

function CardReveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

export default function BriefingPage() {
  const [form, setForm] = useState({ name: "", source: "", applicationAnswers: "", previousInteractions: "" })
  const [loading, setLoading] = useState(false)
  const [briefing, setBriefing] = useState<Briefing | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.applicationAnswers) return toast.error("Name and application answers are required")
    setLoading(true)
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setBriefing(data)
    } catch {
      toast.error("Failed to generate briefing")
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const scoreColor = (score: number) =>
    score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"

  const scoreRingColor = (score: number) =>
    score >= 70 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171"

  return (
    <PageEnter>
      <div className="p-8 max-w-5xl">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h1 className="text-2xl font-bold tracking-tight">Pre-Call Briefing</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Generate a battle card for your closer before the call</p>
        </motion.div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-5">
          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="rounded-2xl border border-white/6 bg-card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Lead Info</h2>
              <Stagger staggerDelay={0.06} delay={0.1}>
                <StaggerItem className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Prospect Name *</Label>
                  <Input placeholder="e.g. James Mitchell" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-secondary/60 border-white/8 focus:border-primary/50 h-9 text-sm" />
                </StaggerItem>
                <StaggerItem className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Traffic Source</Label>
                  <Input placeholder="Instagram organic, FB Ads, Referral…" value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="bg-secondary/60 border-white/8 focus:border-primary/50 h-9 text-sm" />
                </StaggerItem>
                <StaggerItem className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Application Answers *</Label>
                  <Textarea placeholder="Paste their full application answers here…"
                    value={form.applicationAnswers}
                    onChange={(e) => setForm({ ...form, applicationAnswers: e.target.value })}
                    className="bg-secondary/60 border-white/8 focus:border-primary/50 min-h-[130px] text-sm resize-none" />
                </StaggerItem>
                <StaggerItem className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Previous Interactions</Label>
                  <Textarea placeholder="Any DMs, emails, or prior context…"
                    value={form.previousInteractions}
                    onChange={(e) => setForm({ ...form, previousInteractions: e.target.value })}
                    className="bg-secondary/60 border-white/8 focus:border-primary/50 min-h-[70px] text-sm resize-none" />
                </StaggerItem>
              </Stagger>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white h-11 text-sm font-semibold glow-sm">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating battle card...</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Generate Battle Card</>}
              </Button>
            </motion.div>
          </motion.form>

          {/* Output */}
          <AnimatePresence mode="wait">
            {briefing ? (
              <motion.div
                key="briefing"
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Score header */}
                <CardReveal delay={0} className="rounded-2xl border border-white/6 bg-card p-5 flex items-center gap-5">
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" width="80" height="80">
                      <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <motion.circle
                        cx="40" cy="40" r="28" fill="none"
                        stroke={scoreRingColor(briefing.closeScore)} strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 28}
                        initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - briefing.closeScore / 100) }}
                        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                      />
                    </svg>
                    <span className={cn("text-xl font-bold", scoreColor(briefing.closeScore))}>{briefing.closeScore}%</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Close probability</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {briefing.temperature === "hot" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/15 text-xs font-medium"><Flame className="w-3 h-3" /> Hot lead</span>}
                      {briefing.temperature === "warm" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15 text-xs font-medium"><Thermometer className="w-3 h-3" /> Warm lead</span>}
                      {briefing.temperature === "cold" && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15 text-xs font-medium"><Snowflake className="w-3 h-3" /> Cold lead</span>}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {briefing.estimatedDecisionMaker ? "Decision maker" : "May need partner approval"}
                      </span>
                    </div>
                  </div>
                </CardReveal>

                {/* Pain point */}
                <CardReveal delay={0.07} className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <div className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1.5">Primary Pain Point</div>
                  <p className="text-sm font-medium leading-relaxed">{briefing.primaryPainPoint}</p>
                </CardReveal>

                {/* Opening */}
                <CardReveal delay={0.14} className="rounded-2xl border border-white/6 bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recommended Opening</div>
                    <button onClick={() => copy(briefing.recommendedOpeningAngle)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed">{briefing.recommendedOpeningAngle}</p>
                </CardReveal>

                {/* Grid: objections + talking points */}
                <CardReveal delay={0.21} className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/6 bg-card p-4">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Likely Objections</div>
                    <ul className="space-y-2">
                      {briefing.likelyObjections.map((o, i) => (
                        <motion.li key={i} className="flex items-start gap-2 text-sm"
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.07 }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground leading-snug">{o}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/6 bg-card p-4">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Talking Points</div>
                    <ul className="space-y-2">
                      {briefing.suggestedTalkingPoints.map((p, i) => (
                        <motion.li key={i} className="flex items-start gap-2 text-sm"
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.07 }}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground leading-snug">{p}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </CardReveal>

                {/* Avoid */}
                <CardReveal delay={0.28} className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
                  <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-3">Do NOT Do This</div>
                  <ul className="space-y-2">
                    {briefing.thingsToAvoid.map((t, i) => (
                      <motion.li key={i} className="flex items-start gap-2 text-sm"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.07 }}
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-snug">{t}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardReveal>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="flex items-center justify-center rounded-2xl border-2 border-dashed border-white/8 min-h-[400px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <div className="text-center">
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Brain className="w-6 h-6 text-primary/40" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Your battle card will appear here</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Fill in the lead info and click generate</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageEnter>
  )
}
