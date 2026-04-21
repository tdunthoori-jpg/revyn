"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { PageEnter, FadeUp, Stagger, StaggerItem } from "@/components/motion"
import {
  PhoneCall, TrendingUp, TrendingDown, Upload,
  Clock, CheckCircle, AlertCircle, ArrowRight,
  Flame, Thermometer, Snowflake, Brain, Loader2
} from "lucide-react"
import { cn, getScoreColor, formatDuration } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"

interface DashboardData {
  total: number
  closeRate: number
  avgScore: number
  thisWeek: number
  lastWeek: number
  recentCalls: {
    id: string
    prospectName: string
    setter: string
    closer: string
    source: string
    duration: number
    createdAt: string
    overallScore: number
    callOutcome: string
    leadTemperature: string
  }[]
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, { label: string; class: string }> = {
    closed: { label: "Closed", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" },
    follow_up: { label: "Follow Up", class: "bg-amber-500/10 text-amber-400 border-amber-500/15" },
    lost: { label: "Lost", class: "bg-red-500/10 text-red-400 border-red-500/15" },
    no_show: { label: "No Show", class: "bg-white/5 text-muted-foreground border-white/10" },
  }
  const o = map[outcome] || map.lost
  return <Badge className={cn("text-[11px] border font-medium px-2 py-0.5", o.class)}>{o.label}</Badge>
}

function TempIcon({ temp }: { temp: string }) {
  if (temp === "hot") return <Flame className="w-3 h-3 text-orange-400" />
  if (temp === "warm") return <Thermometer className="w-3 h-3 text-amber-400" />
  return <Snowflake className="w-3 h-3 text-blue-400" />
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function DashboardPage() {
  const { user } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const weekChange = data ? data.thisWeek - data.lastWeek : 0
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  const stats = data ? [
    {
      label: "Total Calls",
      value: String(data.total),
      change: data.thisWeek > 0 ? `+${data.thisWeek} this week` : "No calls this week",
      up: data.thisWeek >= data.lastWeek,
      icon: PhoneCall,
      color: "text-violet-400",
      bg: "bg-violet-500/8",
    },
    {
      label: "Close Rate",
      value: `${data.closeRate}%`,
      change: data.total > 0 ? `${Math.round((data.closeRate / 100) * data.total)} of ${data.total} closed` : "No calls yet",
      up: data.closeRate >= 30,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/8",
    },
    {
      label: "Avg Call Score",
      value: data.avgScore > 0 ? String(data.avgScore) : "—",
      change: data.avgScore >= 70 ? "Above target" : data.avgScore > 0 ? "Needs improvement" : "No data yet",
      up: data.avgScore >= 70,
      icon: data.avgScore >= 70 ? TrendingUp : AlertCircle,
      color: data.avgScore >= 70 ? "text-emerald-400" : "text-amber-400",
      bg: data.avgScore >= 70 ? "bg-emerald-500/8" : "bg-amber-500/8",
    },
    {
      label: "This Week",
      value: String(data.thisWeek),
      change: weekChange > 0 ? `+${weekChange} vs last week` : weekChange < 0 ? `${weekChange} vs last week` : "Same as last week",
      up: weekChange >= 0,
      icon: weekChange >= 0 ? TrendingUp : TrendingDown,
      color: weekChange >= 0 ? "text-emerald-400" : "text-red-400",
      bg: weekChange >= 0 ? "bg-emerald-500/8" : "bg-red-500/8",
    },
  ] : []

  return (
    <PageEnter>
      <div className="p-8 max-w-7xl">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user ? `Hey, ${user.firstName ?? user.emailAddresses[0]?.emailAddress?.split("@")[0]} 👋` : "Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{today}</p>
          </div>
          <Link href="/dashboard/upload">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2 glow-sm">
                <Upload className="w-3.5 h-3.5" /> Upload Call
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-white/6 bg-card p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" staggerDelay={0.07}>
            {stats.map((s) => (
              <StaggerItem key={s.label}>
                <motion.div
                  className="rounded-xl border border-white/6 bg-card p-5 hover:border-white/10 transition-colors h-full"
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.bg)}>
                      <s.icon className={cn("w-3.5 h-3.5", s.color)} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold tracking-tight mb-1.5">{s.value}</div>
                  <div className={cn("text-[11px] flex items-center gap-1 font-medium", s.up ? "text-emerald-400" : "text-red-400")}>
                    {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {s.change}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Recent Calls */}
        <FadeUp delay={0.15} className="rounded-xl border border-white/6 bg-card mb-5">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Recent Calls</h2>
            <Link href="/dashboard/calls">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs h-7 px-2 hover:text-foreground">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && data?.recentCalls.length === 0 && (
            <div className="py-14 text-center">
              <p className="text-muted-foreground text-sm mb-4">No calls analyzed yet.</p>
              <Link href="/dashboard/upload">
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                  <Upload className="w-3.5 h-3.5" /> Upload your first call
                </Button>
              </Link>
            </div>
          )}

          {!loading && data && data.recentCalls.length > 0 && (
            <div className="divide-y divide-white/4">
              {data.recentCalls.map((call, i) => (
                <motion.div key={call.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
                  <Link href={`/dashboard/calls/${call.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <span className="text-[10px] font-bold text-primary">
                        {(call.prospectName ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm">{call.prospectName ?? "Unknown"}</span>
                        {call.leadTemperature && <TempIcon temp={call.leadTemperature} />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {[call.setter, call.closer].filter(Boolean).join(" → ")}
                        {call.source ? ` · ${call.source}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={cn("text-sm font-bold tabular-nums hidden sm:block", getScoreColor(call.overallScore ?? 0))}>
                        {call.overallScore ?? "—"}
                      </div>
                      {call.callOutcome && <OutcomeBadge outcome={call.callOutcome} />}
                      <div className="text-[11px] text-muted-foreground hidden md:flex items-center gap-1">
                        {call.duration ? <><Clock className="w-3 h-3" />{formatDuration(call.duration)}</> : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground hidden lg:block w-16 text-right">
                        {call.createdAt ? formatDate(call.createdAt) : ""}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </FadeUp>

        {/* Quick Actions */}
        <Stagger className="grid md:grid-cols-3 gap-3" staggerDelay={0.07} delay={0.2}>
          <StaggerItem>
            <Link href="/dashboard/upload" className="group block rounded-xl border border-primary/15 bg-primary/5 p-5 hover:bg-primary/8 hover:border-primary/25 transition-all h-full">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center mb-3 group-hover:bg-primary/25 transition-colors">
                <Upload className="w-4 h-4 text-primary" />
              </div>
              <div className="font-semibold text-sm mb-1">Upload a call</div>
              <div className="text-xs text-muted-foreground">Get AI analysis in under 2 minutes</div>
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link href="/dashboard/briefing" className="group block rounded-xl border border-white/6 bg-card p-5 hover:border-white/10 hover:bg-white/2 transition-all h-full">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                <Brain className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-semibold text-sm mb-1">Pre-call briefing</div>
              <div className="text-xs text-muted-foreground">Prep your closer before the call</div>
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link href="/dashboard/calls" className="group block rounded-xl border border-white/6 bg-card p-5 hover:border-white/10 hover:bg-white/2 transition-all h-full">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-violet-400" />
              </div>
              <div className="font-semibold text-sm mb-1">All calls</div>
              <div className="text-xs text-muted-foreground">Browse and search your call history</div>
            </Link>
          </StaggerItem>
        </Stagger>
      </div>
    </PageEnter>
  )
}
