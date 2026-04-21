import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Fetch all user calls (just the fields needed for stats)
  const { data, error } = await supabase
    .from("calls")
    .select("id, prospect_name, setter, closer, source, duration, fathom_url, created_at, analysis->overallScore, analysis->callOutcome, analysis->leadTemperature, analysis->closeProbability")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const calls = data ?? []
  const total = calls.length

  const closed = calls.filter(c => c.callOutcome === "closed").length
  const closeRate = total > 0 ? Math.round((closed / total) * 100) : 0

  const scores = calls.map(c => Number(c.overallScore)).filter(s => !isNaN(s) && s > 0)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  // Week-over-week: calls in last 7 days vs prior 7 days
  const now = Date.now()
  const msWeek = 7 * 24 * 60 * 60 * 1000
  const thisWeek = calls.filter(c => now - new Date(c.created_at).getTime() < msWeek).length
  const lastWeek = calls.filter(c => {
    const age = now - new Date(c.created_at).getTime()
    return age >= msWeek && age < msWeek * 2
  }).length

  const recentCalls = calls.slice(0, 5).map(c => ({
    id: c.id,
    prospectName: c.prospect_name,
    setter: c.setter,
    closer: c.closer,
    source: c.source,
    duration: c.duration,
    createdAt: c.created_at,
    overallScore: c.overallScore,
    callOutcome: c.callOutcome,
    leadTemperature: c.leadTemperature,
  }))

  return NextResponse.json({
    total,
    closeRate,
    avgScore,
    thisWeek,
    lastWeek,
    recentCalls,
  })
}
