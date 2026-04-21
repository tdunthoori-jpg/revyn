"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { PageEnter } from "@/components/motion"
import { cn, getScoreColor, formatDuration } from "@/lib/utils"
import { Search, Upload, Clock, Flame, Thermometer, Snowflake, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface CallRow {
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
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const filters = [
  { key: "all", label: "All" },
  { key: "closed", label: "Closed" },
  { key: "follow_up", label: "Follow Up" },
  { key: "lost", label: "Lost" },
]

export default function CallsPage() {
  const [calls, setCalls] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetch("/api/calls")
      .then(r => r.json())
      .then(data => { setCalls(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = calls.filter((c) => {
    const matchSearch =
      (c.prospectName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.closer ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.setter ?? "").toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || c.callOutcome === filter
    return matchSearch && matchFilter
  })

  return (
    <PageEnter>
      <div className="p-8 max-w-6xl">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Calls</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {loading ? "Loading…" : `${calls.length} call${calls.length !== 1 ? "s" : ""} analyzed`}
            </p>
          </div>
          <Link href="/dashboard/upload">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2 glow-sm">
                <Upload className="w-3.5 h-3.5" /> Upload Call
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          className="flex items-center gap-3 mb-5 flex-wrap"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search prospect or closer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-white/8 h-9 text-sm w-64 focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-white/6">
            {filters.map((f) => (
              <motion.button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                  filter === f.key
                    ? "bg-primary text-white glow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && (
          <motion.div
            className="rounded-xl border border-white/6 bg-card overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
          >
            {calls.length > 0 && (
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-5 py-3 border-b border-white/5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider col-span-2">Prospect</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">Score</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block px-4">Outcome</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:block px-4">Duration</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:block px-4">Date</span>
              </div>
            )}
            <div className="divide-y divide-white/4">
              <AnimatePresence mode="popLayout">
                {filtered.map((call, i) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    layout
                  >
                    <Link
                      href={`/dashboard/calls/${call.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
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
                      <div className={cn("text-sm font-bold tabular-nums w-8 text-right hidden sm:block", getScoreColor(call.overallScore ?? 0))}>
                        {call.overallScore ?? "—"}
                      </div>
                      <div className="hidden sm:block w-24 text-right">
                        {call.callOutcome && <OutcomeBadge outcome={call.callOutcome} />}
                      </div>
                      <div className="text-[11px] text-muted-foreground hidden md:flex items-center gap-1 w-16 justify-end">
                        {call.duration ? <><Clock className="w-3 h-3" />{formatDuration(call.duration)}</> : "—"}
                      </div>
                      <div className="text-[11px] text-muted-foreground hidden lg:block w-14 text-right">
                        {call.createdAt ? formatDate(call.createdAt) : "—"}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {filtered.length === 0 && calls.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-16 text-center text-muted-foreground text-sm">
                No calls match your search.
              </motion.div>
            )}
            {calls.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-20 text-center">
                <p className="text-muted-foreground text-sm mb-4">No calls analyzed yet.</p>
                <Link href="/dashboard/upload">
                  <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                    <Upload className="w-3.5 h-3.5" /> Upload your first call
                  </Button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </PageEnter>
  )
}
