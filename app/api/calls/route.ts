import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("calls")
    .select("id, prospect_name, setter, closer, source, duration, fathom_url, created_at, analysis->overallScore, analysis->callOutcome, analysis->closeProbability, analysis->leadTemperature")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const calls = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    prospectName: row.prospect_name,
    setter: row.setter,
    closer: row.closer,
    source: row.source,
    duration: row.duration,
    fathomUrl: row.fathom_url,
    createdAt: row.created_at,
    overallScore: row.overallScore,
    callOutcome: row.callOutcome,
    closeProbability: row.closeProbability,
    leadTemperature: row.leadTemperature,
  }))

  return NextResponse.json(calls)
}
