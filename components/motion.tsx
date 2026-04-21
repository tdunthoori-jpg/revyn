"use client"

import { motion, type Variants, type MotionProps } from "framer-motion"
import { type ReactNode } from "react"
import type React from "react"

// ── Shared variants ──────────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
}

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

// ── Wrapper components ───────────────────────────────────────────────────────

interface AnimProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
  once?: boolean
}

/** Fades + slides up on scroll into view */
export function FadeUp({ children, className, style, delay = 0, once = true }: AnimProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-40px" }}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

/** Staggered children — wrap around a list */
export function Stagger({
  children,
  className,
  style,
  delay = 0,
  staggerDelay = 0.08,
  once = true,
}: AnimProps & { staggerDelay?: number }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-40px" }}
      variants={stagger(staggerDelay, delay)}
    >
      {children}
    </motion.div>
  )
}



/** Single stagger child — use inside <Stagger> */
export function StaggerItem({ children, className }: AnimProps) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  )
}

/** Page-level entrance — wraps entire page content */
export function PageEnter({ children, className }: AnimProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

/** Hover scale card wrapper */
export function HoverCard({ children, className }: AnimProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.985 }}
    >
      {children}
    </motion.div>
  )
}

/** Animated number counter */
import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"

export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 })
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (inView) motionVal.set(to)
  }, [inView, to, motionVal])

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v) + suffix
    })
  }, [spring, suffix])

  return <span ref={ref} className={className}>0{suffix}</span>
}
