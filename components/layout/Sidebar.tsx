"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { UserButton } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import {
  PhoneCall, LayoutDashboard, Upload, Users, Brain, Settings
} from "lucide-react"

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/upload", icon: Upload, label: "Upload Call" },
  { href: "/dashboard/calls", icon: PhoneCall, label: "All Calls" },
  { href: "/dashboard/team", icon: Users, label: "Team" },
  { href: "/dashboard/briefing", icon: Brain, label: "Pre-Call Briefing" },
]

const MONTHLY_LIMIT = 20

export default function Sidebar() {
  const pathname = usePathname()
  const [callsThisMonth, setCallsThisMonth] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => {
        // Count calls this calendar month
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
        // API returns thisWeek — fetch full list for month count
        fetch("/api/calls")
          .then(r => r.json())
          .then((calls: { createdAt: string }[]) => {
            const thisMonth = Array.isArray(calls)
              ? calls.filter(c => new Date(c.createdAt).getTime() >= monthStart).length
              : 0
            setCallsThisMonth(thisMonth)
          })
      })
      .catch(() => {})
  }, [pathname])

  return (
    <aside className="w-56 min-h-screen border-r border-white/5 flex flex-col bg-sidebar shrink-0">
      {/* Logo */}
      <motion.div
        className="px-4 py-5 border-b border-white/5"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <motion.div
            className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center glow-sm shrink-0"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <PhoneCall className="w-3.5 h-3.5 text-white" />
          </motion.div>
          <span className="font-bold text-base tracking-tight">Revyn</span>
        </Link>
      </motion.div>

      {/* Nav */}
      <nav className="flex-1 p-2.5 space-y-0.5">
        <motion.div
          className="px-2 py-2 mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Menu</span>
        </motion.div>
        {nav.map((item, i) => {
          const active = pathname === item.href
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/4"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Bottom */}
      <motion.div
        className="p-2.5 border-t border-white/5 space-y-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-7 h-7",
              }
            }}
          />
          <Link
            href="#"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
        <div className="px-2.5 py-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground font-medium">Solo plan</span>
            <span className="text-[11px] text-primary font-semibold">
              {callsThisMonth ?? "—"}/{MONTHLY_LIMIT}
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full glow-sm"
              initial={{ width: 0 }}
              animate={{ width: callsThisMonth !== null ? `${Math.min((callsThisMonth / MONTHLY_LIMIT) * 100, 100)}%` : "0%" }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground/60 mt-1.5">calls analyzed this month</div>
        </div>
      </motion.div>
    </aside>
  )
}
