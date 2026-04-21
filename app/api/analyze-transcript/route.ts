import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { analyzeCall } from "@/lib/gemini"
import { supabase } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"
import { checkDailyBudget } from "@/lib/budget"
import { randomUUID } from "crypto"

const MAX_TRANSCRIPT_WORDS = 30_000 // ~3 hours of speech — anything beyond is abuse

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ── 1. Per-IP rate limit: 10 analyses per hour ──
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const ipLimit = checkRateLimit(`analyze:${ip}`, 10, 60 * 60 * 1000)
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before analyzing another call." },
      { status: 429, headers: { "Retry-After": "3600" } }
    )
  }

  // ── 2. Daily global budget cap ──
  const budget = await checkDailyBudget()
  if (!budget.allowed) {
    return NextResponse.json(
      { error: `Daily analysis limit reached (${budget.used}/${budget.limit}). Resets at midnight UTC.` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { transcript, prospectName, setter, closer, source, applicationAnswers, fathomUrl } = body

    if (!transcript || transcript.trim().length < 20) {
      return NextResponse.json({ error: "Please paste a transcript before analyzing" }, { status: 400 })
    }

    // ── 3. Hard input size cap ──
    const wordCount = transcript.trim().split(/\s+/).length
    if (wordCount > MAX_TRANSCRIPT_WORDS) {
      return NextResponse.json(
        { error: `Transcript too long (${wordCount.toLocaleString()} words). Maximum is ${MAX_TRANSCRIPT_WORDS.toLocaleString()} words.` },
        { status: 400 }
      )
    }

    // Truncate for analysis to keep costs down
    const MAX_WORDS = 1800
    const words = transcript.trim().split(/\s+/)
    let trimmedTranscript = transcript.trim()
    if (words.length > MAX_WORDS) {
      const startCount = Math.floor(MAX_WORDS * 0.4)
      const midCount = Math.floor(MAX_WORDS * 0.3)
      const endCount = MAX_WORDS - startCount - midCount
      const midStart = Math.floor(words.length / 2) - Math.floor(midCount / 2)
      trimmedTranscript = [
        words.slice(0, startCount).join(" "),
        "\n\n[... middle of call ...]\n\n",
        words.slice(midStart, midStart + midCount).join(" "),
        "\n\n[... later in call ...]\n\n",
        words.slice(words.length - endCount).join(" "),
      ].join("")
    }

    const duration = Math.round((wordCount / 150) * 60)

    const analysis = await analyzeCall(trimmedTranscript, transcript.trim(), {
      name: prospectName,
      source,
      applicationAnswers,
    })

    const id = randomUUID()

    const { error } = await supabase.from("calls").insert({
      id,
      user_id: userId,
      prospect_name: prospectName || null,
      setter: setter || null,
      closer: closer || null,
      source: source || null,
      duration,
      transcript,
      analysis,
      fathom_url: fathomUrl || null,
    })

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: "Failed to save call" }, { status: 500 })
    }

    return NextResponse.json({ id })
  } catch (err) {
    console.error("Transcript analysis error:", err)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
