"use client"

import { cn, getScoreColor } from "@/lib/utils"
import { motion } from "framer-motion"
import { PageEnter, FadeUp, Stagger, StaggerItem } from "@/components/motion"
import { TrendingUp, TrendingDown, AlertTriangle, Crown, ArrowRight } from "lucide-react"

const setters = [
  { name: "Sarah K.", calls: 24, showRate: 78, qualityScore: 82, status: "top" },
  { name: "Tom B.", calls: 18, showRate: 61, qualityScore: 58, status: "warning" },
  { name: "Jay M.", calls: 5, showRate: 80, qualityScore: 74, status: "good" },
]

const closers = [
  { name: "Mike D.", calls: 29, closeRate: 41, avgScore: 79, revenue: "$87,000", status: "top" },
  { name: "Lisa R.", calls: 18, closeRate: 28, avgScore: 61, revenue: "$38,000", status: "warning" },
]

const pairings = [
  { setter: "Sarah K.", closer: "Mike D.", closeRate: 48, calls: 15, trend: "up" },
  { setter: "Sarah K.", closer: "Lisa R.", closeRate: 31, calls: 9, trend: "up" },
  { setter: "Tom B.", closer: "Mike D.", closeRate: 22, calls: 14, trend: "down" },
  { setter: "Tom B.", closer: "Lisa R.", closeRate: 18, calls: 4, trend: "down" },
]

function StatusPill({ status }: { status: string }) {
  if (status === "top") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[11px] font-medium">
      <Crown className="w-2.5 h-2.5" /> Top
    </span>
  )
  if (status === "warning") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/15 text-[11px] font-medium">
      <AlertTriangle className="w-2.5 h-2.5" /> Needs attention
    </span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15 text-[11px] font-medium">
      Good
    </span>
  )
}

function AnimatedBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
      />
    </div>
  )
}

export default function TeamPage() {
  return (
    <PageEnter>
      <div className="p-8 max-w-6xl">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h1 className="text-2xl font-bold tracking-tight">Team Performance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Setter/closer breakdown · last 30 days</p>
        </motion.div>

        {/* Alert */}
        <motion.div
          className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-6"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Tom B.</span> is booking leads with a 61% show rate and 58 quality score — below team average. Review his qualification criteria immediately.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          {/* Setters */}
          <div>
            <motion.div
              className="flex items-center justify-between mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Setters</h2>
              <span className="text-xs text-muted-foreground">{setters.length} active</span>
            </motion.div>
            <Stagger className="space-y-3" staggerDelay={0.08} delay={0.12}>
              {setters.map((s) => (
                <StaggerItem key={s.name}>
                  <motion.div
                    className="rounded-xl border border-white/6 bg-card p-5 hover:border-white/10 transition-colors"
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {s.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-semibold text-sm">{s.name}</span>
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-0.5">Calls booked</div>
                        <div className="font-bold text-lg">{s.calls}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-0.5">Show rate</div>
                        <div className={cn("font-bold text-lg", getScoreColor(s.showRate))}>{s.showRate}%</div>
                        <AnimatedBar value={s.showRate} color={s.showRate >= 70 ? "bg-emerald-400" : s.showRate >= 60 ? "bg-amber-400" : "bg-red-400"} />
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-0.5">Lead quality</div>
                        <div className={cn("font-bold text-lg", getScoreColor(s.qualityScore))}>{s.qualityScore}</div>
                        <AnimatedBar value={s.qualityScore} color={s.qualityScore >= 70 ? "bg-emerald-400" : s.qualityScore >= 60 ? "bg-amber-400" : "bg-red-400"} />
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {/* Closers */}
          <div>
            <motion.div
              className="flex items-center justify-between mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closers</h2>
              <span className="text-xs text-muted-foreground">{closers.length} active</span>
            </motion.div>
            <Stagger className="space-y-3" staggerDelay={0.08} delay={0.18}>
              {closers.map((c) => (
                <StaggerItem key={c.name}>
                  <motion.div
                    className="rounded-xl border border-white/6 bg-card p-5 hover:border-white/10 transition-colors"
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-400">
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-semibold text-sm">{c.name}</span>
                      </div>
                      <StatusPill status={c.status} />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-0.5">Calls</div>
                        <div className="font-bold text-lg">{c.calls}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-0.5">Close rate</div>
                        <div className={cn("font-bold text-lg", getScoreColor(c.closeRate))}>{c.closeRate}%</div>
                        <AnimatedBar value={c.closeRate} color={c.closeRate >= 35 ? "bg-emerald-400" : c.closeRate >= 25 ? "bg-amber-400" : "bg-red-400"} />
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-0.5">Avg score</div>
                        <div className={cn("font-bold text-lg", getScoreColor(c.avgScore))}>{c.avgScore}</div>
                        <AnimatedBar value={c.avgScore} color={c.avgScore >= 70 ? "bg-emerald-400" : c.avgScore >= 60 ? "bg-amber-400" : "bg-red-400"} />
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-0.5">Revenue</div>
                        <div className="font-bold text-sm text-emerald-400">{c.revenue}</div>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>

        {/* Pairings */}
        <FadeUp delay={0.2}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Setter × Closer Pairings</h2>
              <span className="text-xs text-primary font-medium">Best pairing: Sarah K. → Mike D.</span>
            </div>
            <div className="rounded-xl border border-white/6 bg-card overflow-hidden">
              <div className="divide-y divide-white/4">
                {pairings.map((p, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors"
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                  >
                    <div className="flex-1 flex items-center gap-2 text-sm">
                      <span className="font-medium">{p.setter}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{p.closer}</span>
                      <span className="text-xs text-muted-foreground">· {p.calls} calls</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${p.closeRate >= 40 ? "bg-emerald-400" : p.closeRate >= 25 ? "bg-amber-400" : "bg-red-400"}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.closeRate * 2}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                      </div>
                      <span className={cn("text-sm font-bold tabular-nums w-16 text-right", getScoreColor(p.closeRate))}>
                        {p.closeRate}% close
                      </span>
                      {p.trend === "up"
                        ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                        : <TrendingDown className="w-4 h-4 text-red-400" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Route more leads through Sarah K. → Mike D. to maximize revenue. Their 48% close rate is 2.1× the team average.
            </p>
          </div>
        </FadeUp>
      </div>
    </PageEnter>
  )
}
