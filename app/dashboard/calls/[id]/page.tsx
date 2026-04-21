"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn, getScoreColor, formatDuration } from "@/lib/utils"
import type { CallAnalysis } from "@/lib/gemini"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { PageEnter, FadeUp, Stagger, StaggerItem } from "@/components/motion"
import {
  TrendingUp, TrendingDown, Flame, Thermometer, Snowflake, Loader2,
  CheckCircle, XCircle, Lightbulb, AlertTriangle,
  MessageSquare, Target, Zap, Brain, Copy, Clock, ArrowLeft,
  Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward, X,
  ExternalLink, Mic, Activity, Users, BarChart3, Star, Crosshair,
  Trash2, Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

interface CallData {
  id: string
  prospectName: string
  setter: string
  closer: string
  source: string
  duration: number
  transcript: string
  analysis: CallAnalysis
  fathomUrl?: string | null
  createdAt: string
}

const SCORE_LABELS = {
  offerClarity: "Offer Clarity",
  objectionHandling: "Objection Handling",
  rapport: "Rapport",
  closingAttempt: "Closing Attempt",
  tonality: "Tonality",
  qualification: "Qualification",
}

// Each type gets a distinct shape via clip-path + unique color/glow
const MOMENT_META = {
  buying_signal: {
    icon: TrendingUp,
    label: "Buying Signal",
    color: "text-emerald-400",
    bg: "bg-emerald-400/15",
    border: "border-emerald-400/40",
    glow: "shadow-[0_0_16px_rgba(52,211,153,0.35)]",
    gradBorder: "from-emerald-400/60 to-emerald-400/10",
    gradBg: "from-emerald-500/10 to-transparent",
    clip: "polygon(50% 0%,100% 100%,0% 100%)",   // upward triangle
    ringColor: "#34d399",
  },
  objection: {
    icon: AlertTriangle,
    label: "Objection",
    color: "text-amber-400",
    bg: "bg-amber-400/15",
    border: "border-amber-400/40",
    glow: "shadow-[0_0_16px_rgba(251,191,36,0.35)]",
    gradBorder: "from-amber-400/60 to-amber-400/10",
    gradBg: "from-amber-500/10 to-transparent",
    clip: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",  // diamond
    ringColor: "#fbbf24",
  },
  lost_interest: {
    icon: TrendingDown,
    label: "Lost Interest",
    color: "text-red-400",
    bg: "bg-red-400/15",
    border: "border-red-400/40",
    glow: "shadow-[0_0_16px_rgba(248,113,113,0.35)]",
    gradBorder: "from-red-400/60 to-red-400/10",
    gradBg: "from-red-500/10 to-transparent",
    clip: "polygon(50% 100%,100% 0%,0% 0%)",   // downward triangle
    ringColor: "#f87171",
  },
  great_moment: {
    icon: Star,
    label: "Great Moment",
    color: "text-violet-400",
    bg: "bg-violet-400/15",
    border: "border-violet-400/40",
    glow: "shadow-[0_0_16px_rgba(167,139,250,0.35)]",
    gradBorder: "from-violet-400/60 to-violet-400/10",
    gradBg: "from-violet-500/10 to-transparent",
    clip: "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",  // hexagon
    ringColor: "#a78bfa",
  },
  missed_opportunity: {
    icon: Crosshair,
    label: "Missed Opportunity",
    color: "text-orange-400",
    bg: "bg-orange-400/15",
    border: "border-orange-400/40",
    glow: "shadow-[0_0_16px_rgba(251,146,60,0.35)]",
    gradBorder: "from-orange-400/60 to-orange-400/10",
    gradBg: "from-orange-500/10 to-transparent",
    clip: "circle(50%)",   // circle
    ringColor: "#fb923c",
  },
}

function timestampToSeconds(ts: string, callDurationSec?: number): number {
  const parts = ts.split(":").map(Number)
  const cap = callDurationSec ?? 7200

  if (parts.length === 4) {
    // H:MM:SS:00 — AI appended extra :00, ignore last part
    const v = parts[0] * 3600 + parts[1] * 60 + parts[2]
    return v <= cap ? v : parts[0] * 60 + parts[1]
  }
  if (parts.length === 3) {
    const asHMS = parts[0] * 3600 + parts[1] * 60 + parts[2]
    // If result exceeds call duration, AI wrote MM:SS:00 — reinterpret as M:SS
    return asHMS <= cap ? asHMS : parts[0] * 60 + parts[1]
  }
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  return `${m}:${String(sec).padStart(2, "0")}`
}

// Animated number counter
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20 })
  const [display, setDisplay] = useState(0)
  useEffect(() => { motionVal.set(value) }, [value, motionVal])
  useEffect(() => spring.on("change", v => setDisplay(Math.round(v))), [spring])
  return <span className={className}>{display}</span>
}

function OutcomePill({ outcome }: { outcome: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    closed: { label: "Closed", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" },
    follow_up: { label: "Follow Up", cls: "bg-amber-500/10 text-amber-300 border-amber-500/25" },
    lost: { label: "Lost", cls: "bg-red-500/10 text-red-300 border-red-500/25" },
    no_show: { label: "No Show", cls: "bg-white/5 text-white/40 border-white/10" },
  }
  const o = map[outcome] || map.lost
  return <span className={cn("inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide uppercase", o.cls)}>{o.label}</span>
}

function TempPill({ temp }: { temp: string }) {
  if (temp === "hot") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/25 text-[11px] font-semibold tracking-wide uppercase"><Flame className="w-3 h-3" />Hot</span>
  if (temp === "warm") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[11px] font-semibold tracking-wide uppercase"><Thermometer className="w-3 h-3" />Warm</span>
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/25 text-[11px] font-semibold tracking-wide uppercase"><Snowflake className="w-3 h-3" />Cold</span>
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = size * 0.34
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171"
  const glowColor = score >= 80 ? "rgba(52,211,153,0.3)" : score >= 60 ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)"

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: glowColor }} />
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={size * 0.06} />
        {/* Glow copy */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={size * 0.06 + 3}
          strokeDasharray={circumference} strokeOpacity={0.15} strokeLinecap="round"
          style={{ strokeDashoffset: circumference - (score / 100) * circumference }} />
        <motion.circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.06}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="text-center z-10">
        <AnimatedNumber value={score} className={cn("font-bold tabular-nums", score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400")} style={{ fontSize: size * 0.26 } as React.CSSProperties} />
        <div className="text-white/30 font-medium" style={{ fontSize: size * 0.1 }}>/ 100</div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Video Player
// ────────────────────────────────────────────────
function VideoPlayer({ fathomUrl, moments, duration }: {
  fathomUrl: string
  moments: CallAnalysis["keyMoments"]
  duration: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shownMomentsRef = useRef<Set<number>>(new Set())

  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(duration || 3600)
  const [isPlaying, setIsPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [activeOverlay, setActiveOverlay] = useState<number | null>(null)
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null)
  const [hlsReady, setHlsReady] = useState(false)

  const rawVideoUrl = `${fathomUrl.split("?")[0]}/video.m3u8`
  const videoUrl = `/api/proxy-video?url=${encodeURIComponent(rawVideoUrl)}`

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let hls: import("hls.js").default | null = null
    let cancelled = false

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !videoRef.current) return
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false, startLevel: -1, maxBufferLength: 30 })
        hls.loadSource(videoUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!cancelled) setHlsReady(true) })
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return
          if (data.type === "networkError") hls?.startLoad()
          else if (data.type === "mediaError") hls?.recoverMediaError()
          else hls?.destroy()
        })
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoUrl
        video.load()
        setHlsReady(true)
      }
    })
    return () => { cancelled = true; hls?.destroy() }
  }, [videoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => {
      const t = video.currentTime
      setCurrentTime(t)
      moments.forEach((m, i) => {
        const ms = timestampToSeconds(m.timestamp, videoDuration)
        if (t >= ms && t < ms + 3 && !shownMomentsRef.current.has(i)) {
          shownMomentsRef.current.add(i)
          if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
          setActiveOverlay(i)
          overlayTimerRef.current = setTimeout(() => setActiveOverlay(null), 8000)
        }
      })
    }
    const onDuration = () => setVideoDuration(video.duration)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onSeeked = () => {
      const t = video.currentTime
      moments.forEach((m, i) => { if (timestampToSeconds(m.timestamp, videoDuration) > t) shownMomentsRef.current.delete(i) })
    }
    video.addEventListener("timeupdate", onTime)
    video.addEventListener("durationchange", onDuration)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("seeked", onSeeked)
    return () => {
      video.removeEventListener("timeupdate", onTime)
      video.removeEventListener("durationchange", onDuration)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("seeked", onSeeked)
    }
  }, [moments])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    isPlaying ? v.pause() : v.play().catch(() => {})
  }
  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }
  const skip = (s: number) => {
    const v = videoRef.current
    if (v) v.currentTime = Math.max(0, Math.min(v.currentTime + s, videoDuration))
  }
  const seekTo = useCallback((s: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = s
    if (!isPlaying) v.play().catch(() => {})
  }, [isPlaying])

  const onProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    seekTo(((e.clientX - rect.left) / rect.width) * videoDuration)
  }

  const progressPct = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0

  return (
    <FadeUp className="rounded-2xl overflow-hidden mb-6 bg-black border border-white/8" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6)" }}>
      {/* Video */}
      <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" playsInline onClick={togglePlay} />

        {/* Loading */}
        {!hlsReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border border-primary/20 animate-pulse" />
                <Loader2 className="w-6 h-6 text-primary animate-spin absolute inset-0 m-auto" />
              </div>
              <p className="text-xs text-white/40 font-medium tracking-widest uppercase">Loading</p>
            </div>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-t from-black to-transparent" />

        {/* Center play */}
        <AnimatePresence>
          {!isPlaying && hlsReady && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 0 40px rgba(255,255,255,0.1)" }}>
                <Play className="w-7 h-7 text-white ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Insight overlay — glassmorphism with colored glow border */}
        <AnimatePresence>
          {activeOverlay !== null && (() => {
            const m = moments[activeOverlay]
            const meta = MOMENT_META[m.type as keyof typeof MOMENT_META] || MOMENT_META.objection
            const Icon = meta.icon
            return (
              <motion.div
                key={activeOverlay}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-20 right-4 w-76 max-w-[calc(100%-2rem)] z-20"
                style={{ filter: `drop-shadow(0 0 24px ${meta.ringColor}33)` }}
              >
                {/* Gradient border via wrapper */}
                <div className="p-px rounded-2xl" style={{ background: `linear-gradient(135deg, ${meta.ringColor}60, ${meta.ringColor}10)` }}>
                  <div className="rounded-2xl p-4" style={{ background: "rgba(10,10,14,0.85)", backdropFilter: "blur(20px)" }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        {/* Icon badge */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: meta.ringColor + "20", border: `1px solid ${meta.ringColor}40` }}>
                          <Icon className={cn("w-4 h-4", meta.color)} />
                        </div>
                        <div>
                          <div className={cn("text-[10px] font-bold uppercase tracking-widest", meta.color)}>{meta.label}</div>
                          <div className="text-[10px] text-white/30 font-mono">{m.timestamp}</div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setActiveOverlay(null) }}
                        className="text-white/30 hover:text-white/70 transition-colors cursor-pointer mt-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-white leading-snug mb-2">{m.description}</p>
                    <div className="h-px bg-white/8 mb-2" />
                    <p className="text-[11px] text-white/45 italic leading-relaxed line-clamp-2">&ldquo;{m.quote}&rdquo;</p>
                    {/* Pulse dot */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.ringColor }}
                        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      <span className="text-[10px] text-white/30">AI insight · live</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-5 pt-3 pb-4 bg-black">
        {/* Progress bar */}
        <div ref={progressRef} className="relative h-8 flex items-center cursor-pointer group mb-1" onClick={onProgressClick}>
          {/* Track */}
          <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/8 top-1/2 -translate-y-1/2" />
          {/* Fill */}
          <div className="absolute left-0 h-[3px] rounded-full top-1/2 -translate-y-1/2 transition-none"
            style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.6))" }} />
          {/* Playhead */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progressPct}%`, boxShadow: "0 0 8px rgba(255,255,255,0.5)" }} />

          {/* Tick marks every 5% */}
          {Array.from({ length: 19 }, (_, i) => (
            <div key={i} className="absolute top-1/2 -translate-y-1/2 w-px h-1.5 bg-white/10 -translate-x-1/2"
              style={{ left: `${(i + 1) * 5}%` }} />
          ))}

          {/* Moment markers */}
          {moments.map((m, i) => {
            const secs = timestampToSeconds(m.timestamp, videoDuration)
            const pct = Math.min(Math.max((secs / videoDuration) * 100, 0.5), 99.5)
            const meta = MOMENT_META[m.type as keyof typeof MOMENT_META] || MOMENT_META.objection
            const isActive = activeOverlay === i

            return (
              <div key={i} className="absolute -translate-x-1/2 z-10" style={{ left: `${pct}%` }}
                onMouseEnter={(e) => { e.stopPropagation(); setTooltipIdx(i) }}
                onMouseLeave={() => setTooltipIdx(null)}
                onClick={(e) => { e.stopPropagation(); seekTo(secs); setActiveOverlay(i) }}>

                <motion.div
                  className="w-4 h-4 cursor-pointer relative flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.6 }}
                >
                  {/* Glow ring when active */}
                  {isActive && (
                    <motion.div className="absolute inset-[-4px] rounded-full"
                      style={{ background: meta.ringColor + "30" }}
                      animate={{ opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  )}
                  {/* Pure clip-path shape — no icon inside, shape IS the identifier */}
                  <div className="w-full h-full" style={{ background: meta.ringColor, clipPath: meta.clip, opacity: isActive ? 1 : 0.75 }} />
                </motion.div>

                {/* Tooltip */}
                <AnimatePresence>
                  {tooltipIdx === i && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-56 rounded-xl p-3 pointer-events-none"
                      style={{ background: "rgba(10,10,14,0.95)", backdropFilter: "blur(16px)", border: `1px solid ${meta.ringColor}40`, boxShadow: `0 0 20px ${meta.ringColor}20` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={cn("text-[9px] font-bold uppercase tracking-widest", meta.color)}>{meta.label}</span>
                        <span className="ml-auto text-[9px] font-mono text-white/30">{m.timestamp}</span>
                      </div>
                      <p className="text-[11px] font-medium leading-snug text-white/90">{m.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Control row */}
        <div className="flex items-center gap-2 mt-1">
          <button onClick={() => skip(-10)} className="text-white/40 hover:text-white/80 transition-colors cursor-pointer p-1">
            <SkipBack className="w-4 h-4" />
          </button>
          <motion.button onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: "hsl(var(--primary))", boxShadow: "0 0 20px hsl(var(--primary)/0.4)" }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
          </motion.button>
          <button onClick={() => skip(10)} className="text-white/40 hover:text-white/80 transition-colors cursor-pointer p-1">
            <SkipForward className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-white/30 ml-1 tabular-nums">
            {formatTime(currentTime)} <span className="text-white/15">/</span> {formatTime(videoDuration)}
          </span>

          <div className="flex-1" />

          {/* Moment chips */}
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {moments.slice(0, 6).map((m, i) => {
              const meta = MOMENT_META[m.type as keyof typeof MOMENT_META] || MOMENT_META.objection
              return (
                <motion.button key={i}
                  onClick={() => { seekTo(timestampToSeconds(m.timestamp, videoDuration)); setActiveOverlay(i) }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold cursor-pointer"
                  style={{ background: meta.ringColor + "15", border: `1px solid ${meta.ringColor}30`, color: meta.ringColor }}
                  whileHover={{ scale: 1.05, backgroundColor: meta.ringColor + "25" }}
                  whileTap={{ scale: 0.97 }}>
                  {/* Shape dot — same clip-path as timeline marker */}
                  <div className="w-2 h-2 shrink-0" style={{ background: meta.ringColor, clipPath: meta.clip }} />
                  {m.timestamp}
                </motion.button>
              )
            })}
            {moments.length > 6 && (
              <span className="text-[10px] text-white/25 px-1">+{moments.length - 6}</span>
            )}
          </div>

          <button onClick={toggleMute} className="text-white/40 hover:text-white/80 transition-colors cursor-pointer p-1 ml-1">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white/40 hover:text-white/80 transition-colors cursor-pointer p-1">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Moment type legend */}
        <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/5 flex-wrap">
          {(Object.entries(MOMENT_META) as [string, typeof MOMENT_META[keyof typeof MOMENT_META]][]).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 shrink-0" style={{ background: meta.ringColor, clipPath: meta.clip, opacity: 0.85 }} />
              <span className="text-[10px] text-white/35 font-medium">{meta.label}</span>
            </div>
          ))}
        </div>
      </div>
    </FadeUp>
  )
}

// ────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────
export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [call, setCall] = useState<CallData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    fetch(`/api/calls/${id}`)
      .then(r => { if (!r.ok) throw new Error("not found"); return r.json() })
      .then(data => { if (data?.analysis) setCall(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete this call for ${call?.prospectName}? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/calls/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Call deleted")
      router.push("/dashboard/calls")
    } else {
      toast.error("Failed to delete call")
      setDeleting(false)
    }
  }

  const handleExportPdf = async () => {
    if (!call) return
    setExportingPdf(true)
    try {
      const { exportCallToPdf } = await import("@/lib/pdf-export")
      await exportCallToPdf(call)
      toast.success("PDF downloaded")
    } catch {
      toast.error("PDF export failed")
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
          <Loader2 className="w-7 h-7 text-primary animate-spin absolute inset-0 m-auto" />
        </div>
        <p className="text-sm text-white/30 tracking-widest uppercase font-medium">Loading analysis</p>
      </div>
    </div>
  )

  if (!call) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-white/30">Call not found.</p>
    </div>
  )

  const { analysis } = call

  return (
    <PageEnter>
      <div className="p-8 max-w-5xl">

        {/* Back + actions row */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-7">
          <Link href="/dashboard/calls" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> All Calls
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost"
              className="text-white/30 hover:text-white/70 hover:bg-white/5 gap-1.5 text-xs h-8"
              onClick={handleExportPdf} disabled={exportingPdf}>
              {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export PDF
            </Button>
            <Button size="sm" variant="ghost"
              className="text-red-400/60 hover:text-red-400 hover:bg-red-400/8 gap-1.5 text-xs h-8"
              onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </Button>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div className="flex items-start justify-between gap-6 mb-5 flex-wrap"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}>
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-white">{call.prospectName}</h1>
              <OutcomePill outcome={analysis.callOutcome} />
              <TempPill temp={analysis.leadTemperature} />
            </div>
            <div className="flex items-center gap-3 text-xs text-white/30 flex-wrap">
              {call.setter && <span className="font-mono">{call.setter} <span className="text-white/15">→</span> {call.closer}</span>}
              {call.source && <><span className="text-white/10">·</span><span>{call.source}</span></>}
              <span className="text-white/10">·</span>
              <span className="flex items-center gap-1 font-mono"><Clock className="w-3 h-3" />{formatDuration(call.duration)}</span>
              {call.fathomUrl && <>
                <span className="text-white/10">·</span>
                <a href={call.fathomUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors">
                  <ExternalLink className="w-3 h-3" /> Fathom
                </a>
              </>}
            </div>
          </div>
          <ScoreRing score={analysis.overallScore} size={114} />
        </motion.div>

        {/* Summary card */}
        <FadeUp delay={0.1} className="rounded-2xl border border-white/6 px-5 py-4 mb-5"
          style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(8px)" }}>
          <p className="text-sm text-white/50 leading-relaxed">{analysis.summary}</p>
        </FadeUp>

        {/* Stat pills */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}>
          {[
            { label: "Close Probability", value: `${analysis.closeProbability}%`, color: analysis.closeProbability >= 60 ? "text-emerald-400" : "text-amber-400" },
            { label: "Refund Risk", value: analysis.refundRisk ?? "—", color: analysis.refundRisk === "high" ? "text-red-400" : analysis.refundRisk === "medium" ? "text-amber-400" : "text-emerald-400" },
            { label: "Confidence", value: `${analysis.toneInsights?.closerConfidence ?? "—"}`, color: "text-primary" },
            { label: "Talk Ratio", value: `${analysis.toneInsights?.talkRatio?.closer ?? "—"}% you`, color: "text-white/70" },
          ].map((s, i) => (
            <motion.div key={i} className="rounded-xl border border-white/6 px-4 py-3"
              style={{ background: "rgba(255,255,255,0.02)" }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}>
              <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">{s.label}</div>
              <div className={cn("text-xl font-bold tabular-nums capitalize", s.color)}>{s.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Video */}
        {call.fathomUrl && analysis.keyMoments?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}>
            <VideoPlayer fathomUrl={call.fathomUrl} moments={analysis.keyMoments} duration={call.duration} />
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.22 }}>
          <Tabs defaultValue="analysis">
            <TabsList className="h-auto p-1 mb-6 rounded-xl border border-white/6 bg-white/2 w-fit">
              {["analysis", "objections", "ghost-close", "transcript"].map(t => (
                <TabsTrigger key={t} value={t}
                  className="text-xs font-semibold capitalize px-5 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-white/40 hover:text-white/70 transition-all">
                  {t === "ghost-close" ? "Ghost Close" : t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Analysis ── */}
            <TabsContent value="analysis" className="space-y-4 mt-0">
              {/* Score breakdown */}
              <FadeUp className="rounded-2xl border border-white/6 p-6" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-primary" /> Score Breakdown
                </h2>
                <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
                  {Object.entries(SCORE_LABELS).map(([key, label], i) => {
                    const score = analysis.scores[key as keyof typeof analysis.scores]
                    const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171"
                    return (
                      <motion.div key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.06 }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-white/50 font-medium">{label}</span>
                          <AnimatedNumber value={score} className="text-sm font-bold tabular-nums" style={{ color } as React.CSSProperties} />
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}, ${color}80)`, boxShadow: `0 0 8px ${color}60` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }} />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </FadeUp>

              {/* Tone Insights */}
              {analysis.toneInsights && (
                <FadeUp className="rounded-2xl border border-white/6 p-6" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-primary" /> Tone & Delivery
                    <span className="ml-auto text-[9px] text-white/20 normal-case tracking-normal font-normal">Inferred from transcript</span>
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      {/* Confidence bar */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-xs text-white/40 flex items-center gap-1.5"><Activity className="w-3 h-3" />Closer Confidence</span>
                          <AnimatedNumber value={analysis.toneInsights.closerConfidence} className="text-xs font-bold text-primary tabular-nums" />
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.5))", boxShadow: "0 0 10px hsl(var(--primary)/0.4)" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis.toneInsights.closerConfidence}%` }}
                            transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} />
                        </div>
                      </div>
                      {/* Talk ratio */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-xs text-white/40 flex items-center gap-1.5"><Users className="w-3 h-3" />Talk Ratio</span>
                          <span className="text-xs text-white/30 font-mono">{analysis.toneInsights.talkRatio.closer}% / {analysis.toneInsights.talkRatio.prospect}%</span>
                        </div>
                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden flex gap-px">
                          <motion.div className="h-full rounded-l-full" style={{ background: "hsl(var(--primary))" }}
                            initial={{ width: 0 }} animate={{ width: `${analysis.toneInsights.talkRatio.closer}%` }}
                            transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }} />
                          <motion.div className="h-full rounded-r-full bg-emerald-400/50"
                            initial={{ width: 0 }} animate={{ width: `${analysis.toneInsights.talkRatio.prospect}%` }}
                            transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-primary/50">You</span>
                          <span className="text-[10px] text-emerald-400/50">Prospect</span>
                        </div>
                      </div>
                      {/* Pills */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: `Energy: ${analysis.toneInsights.closerEnergy}`, good: analysis.toneInsights.closerEnergy === "high" },
                          { label: `Prospect: ${analysis.toneInsights.prospectEngagement}`, good: analysis.toneInsights.prospectEngagement === "high" },
                          { label: `Fillers: ${analysis.toneInsights.fillerWordFrequency}`, good: analysis.toneInsights.fillerWordFrequency === "low" },
                          { label: `Tone: ${analysis.toneInsights.emotionalTone}`, good: ["warm", "excited"].includes(analysis.toneInsights.emotionalTone) },
                        ].map((p, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize"
                            style={{ background: p.good ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)", color: p.good ? "#34d399" : "#ffffff80", borderColor: p.good ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.08)" }}>
                            {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {analysis.toneInsights.confidenceHighs?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest mb-2.5">Confidence Highs</div>
                          <div className="space-y-2">
                            {analysis.toneInsights.confidenceHighs.map((h, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-white/40">
                                <CheckCircle className="w-3 h-3 text-emerald-400/60 shrink-0 mt-0.5" />{h}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.toneInsights.confidenceLows?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-red-400/70 uppercase tracking-widest mb-2.5">Hesitation Moments</div>
                          <div className="space-y-2">
                            {analysis.toneInsights.confidenceLows.map((l, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-white/40">
                                <AlertTriangle className="w-3 h-3 text-red-400/60 shrink-0 mt-0.5" />{l}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </FadeUp>
              )}

              {/* Strengths + Improvements */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Strengths", icon: CheckCircle, color: "text-emerald-400", borderColor: "rgba(52,211,153,0.12)", items: analysis.strengths },
                  { title: "Improvements", icon: Lightbulb, color: "text-amber-400", borderColor: "rgba(251,191,36,0.12)", items: analysis.improvements },
                ].map(({ title, icon: Icon, color, borderColor, items }) => (
                  <FadeUp key={title} className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor }}>
                    <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Icon className={cn("w-3.5 h-3.5", color)} /> {title}
                    </h2>
                    <Stagger className="space-y-3" staggerDelay={0.07}>
                      {items.map((s, i) => (
                        <StaggerItem key={i} className="flex items-start gap-2.5">
                          <Icon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", color)} />
                          <span className="text-sm text-white/50 leading-snug">{s}</span>
                        </StaggerItem>
                      ))}
                    </Stagger>
                  </FadeUp>
                ))}
              </div>

              {/* Key Moments list */}
              <FadeUp className="rounded-2xl border border-white/6 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-primary" /> Key Moments
                </h2>
                <div className="space-y-1">
                  {analysis.keyMoments.map((m, i) => {
                    const meta = MOMENT_META[m.type as keyof typeof MOMENT_META] || MOMENT_META.objection
                    const Icon = meta.icon
                    return (
                      <motion.div key={i}
                        className="flex gap-3 px-3 py-3 rounded-xl hover:bg-white/3 transition-colors group"
                        initial={{ opacity: 0, x: -6 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}>
                        {/* Icon badge — clean rounded square, no clip-path centering issues */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: meta.ringColor + "18", border: `1px solid ${meta.ringColor}35` }}>
                          <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">{m.timestamp}</span>
                            <span className={cn("text-[10px] font-bold uppercase tracking-wide", meta.color)}>{meta.label}</span>
                          </div>
                          <p className="text-sm font-medium text-white/80 mb-1 leading-snug">{m.description}</p>
                          <p className="text-[11px] text-white/30 italic leading-relaxed">&ldquo;{m.quote}&rdquo;</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </FadeUp>

              {/* Refund risk */}
              {analysis.callOutcome === "closed" && analysis.refundRisk && (
                <motion.div
                  className="rounded-2xl border p-4 flex items-start gap-3"
                  style={{
                    background: analysis.refundRisk === "high" ? "rgba(248,113,113,0.05)" : analysis.refundRisk === "medium" ? "rgba(251,191,36,0.05)" : "rgba(52,211,153,0.05)",
                    borderColor: analysis.refundRisk === "high" ? "rgba(248,113,113,0.15)" : analysis.refundRisk === "medium" ? "rgba(251,191,36,0.15)" : "rgba(52,211,153,0.15)"
                  }}
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.4 }}>
                  <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", analysis.refundRisk === "high" ? "text-red-400" : analysis.refundRisk === "medium" ? "text-amber-400" : "text-emerald-400")} />
                  <div>
                    <div className="font-semibold text-sm mb-1 capitalize text-white/80">{analysis.refundRisk} refund risk</div>
                    <p className="text-sm text-white/40">{analysis.refundRiskReason}</p>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            {/* ── Objections ── */}
            <TabsContent value="objections" className="space-y-4 mt-0">
              {analysis.objections.length === 0 ? (
                <div className="rounded-2xl border border-white/6 py-16 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-white/30 text-sm">No significant objections detected.</p>
                </div>
              ) : analysis.objections.map((obj, i) => (
                <motion.div key={i} className="rounded-2xl border border-white/6 p-5"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="font-semibold text-sm text-white/80">{obj.objection}</div>
                    <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: obj.score >= 80 ? "#34d399" : obj.score >= 60 ? "#fbbf24" : "#f87171" }}>{obj.score}/100</span>
                  </div>
                  <div className="h-px bg-white/6 mb-4" />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">How it was handled</div>
                      <p className="text-sm text-white/45 leading-relaxed">{obj.howHandled}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "hsl(var(--primary)/0.06)", border: "1px solid hsl(var(--primary)/0.12)" }}>
                      <div className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-2">Better response</div>
                      <p className="text-sm text-white/70 leading-relaxed mb-3">{obj.betterResponse}</p>
                      <button onClick={() => copy(obj.betterResponse, "Response")}
                        className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/70 transition-colors cursor-pointer">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            {/* ── Ghost Close ── */}
            <TabsContent value="ghost-close" className="space-y-4 mt-0">
              <motion.div className="rounded-2xl p-px"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.5), hsl(var(--primary)/0.1))" }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <div className="rounded-2xl p-6" style={{ background: "rgba(10,10,14,0.95)" }}>
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="font-bold text-sm flex items-center gap-2 text-white/80">
                      <Zap className="w-4 h-4 text-primary" /> Ghost Close Script
                    </h2>
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-7 border-white/10 hover:bg-white/5"
                      onClick={() => copy(analysis.ghostCloseScript, "Ghost close script")}>
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-white/50">{analysis.ghostCloseScript}</p>
                </div>
              </motion.div>

              <motion.div className="rounded-2xl border border-white/6 p-5" style={{ background: "rgba(255,255,255,0.02)" }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
                <h2 className="font-bold flex items-center gap-2 mb-3 text-sm text-white/70">
                  <MessageSquare className="w-4 h-4 text-amber-400" /> Next Call Strategy
                </h2>
                <p className="text-sm text-white/45 leading-relaxed">{analysis.nextCallStrategy}</p>
              </motion.div>

              <motion.div className="rounded-2xl border border-white/6 p-5 flex items-center justify-between gap-4 flex-wrap"
                style={{ background: "rgba(255,255,255,0.02)" }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
                <div>
                  <div className="font-bold text-sm mb-1 text-white/70">Close probability</div>
                  <div className="text-xs text-white/30">Likelihood this lead still closes with the right follow-up</div>
                </div>
                <motion.div
                  className="text-5xl font-bold tabular-nums"
                  style={{ color: analysis.closeProbability >= 60 ? "#34d399" : "#fbbf24" }}
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <AnimatedNumber value={analysis.closeProbability} />%
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* ── Transcript ── */}
            <TabsContent value="transcript" className="mt-0">
              <motion.div className="rounded-2xl border border-white/6 p-6" style={{ background: "rgba(255,255,255,0.02)" }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-sm text-white/60">Full Transcript</h2>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-7 border-white/10 hover:bg-white/5"
                    onClick={() => copy(call.transcript, "Transcript")}>
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                </div>
                <div className="text-xs text-white/30 leading-7 whitespace-pre-line font-mono max-h-[600px] overflow-y-auto">
                  {call.transcript}
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </PageEnter>
  )
}
