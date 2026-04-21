import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { analyzeCall } from "@/lib/gemini"
import { transcribeAudio } from "@/lib/assemblyai"
import { supabase } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"
import { checkDailyBudget } from "@/lib/budget"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

const MAX_FILE_MB = 100

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Per-IP rate limit: 10 per hour
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const ipLimit = checkRateLimit(`analyze:${ip}`, 10, 60 * 60 * 1000)
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before analyzing another call." },
      { status: 429, headers: { "Retry-After": "3600" } }
    )
  }

  // Daily global budget cap
  const budget = await checkDailyBudget()
  if (!budget.allowed) {
    return NextResponse.json(
      { error: `Daily analysis limit reached (${budget.used}/${budget.limit}). Resets at midnight UTC.` },
      { status: 429 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    // File size cap
    if (file && file.size > MAX_FILE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large. Maximum size is ${MAX_FILE_MB}MB.` }, { status: 400 })
    }
    const prospectName = formData.get("prospectName") as string
    const setter = formData.get("setter") as string
    const closer = formData.get("closer") as string
    const source = formData.get("source") as string
    const applicationAnswers = formData.get("applicationAnswers") as string

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const tmpDir = join(process.cwd(), "tmp")
    await mkdir(tmpDir, { recursive: true })
    const tmpPath = join(tmpDir, `${randomUUID()}-${file.name}`)
    const bytes = await file.arrayBuffer()
    await writeFile(tmpPath, Buffer.from(bytes))

    const { transcript, duration } = await transcribeAudio(`file://${tmpPath}`)

    const analysis = await analyzeCall(transcript, transcript, {
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
      fathom_url: null,
    })

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: "Failed to save call" }, { status: 500 })
    }

    return NextResponse.json({ id })
  } catch (err) {
    console.error("Analysis error:", err)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
