import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generatePreCallBriefing } from "@/lib/gemini"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const limit = checkRateLimit(`briefing:${ip}`, 20, 60 * 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  try {
    const { name, source, applicationAnswers, previousInteractions } = await req.json()
    if (!name || !applicationAnswers) {
      return NextResponse.json({ error: "Name and application answers are required" }, { status: 400 })
    }
    const briefing = await generatePreCallBriefing({ name, source, applicationAnswers, previousInteractions })
    return NextResponse.json(briefing)
  } catch (err) {
    console.error("Briefing error:", err)
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 })
  }
}
