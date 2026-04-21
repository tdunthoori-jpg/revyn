import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || !url.includes("fathom.video")) {
      return NextResponse.json({ error: "Please provide a valid Fathom share link" }, { status: 400 })
    }

    const jinaUrl = `https://r.jina.ai/${url}`
    const res = await fetch(jinaUrl, {
      headers: { "Accept": "text/plain", "X-No-Cache": "true" },
    })

    if (!res.ok) throw new Error("Failed to fetch Fathom page")

    const raw = await res.text()

    // Extract title (call name)
    const titleMatch = raw.match(/^Title:\s*(.+)$/m)
    const title = titleMatch?.[1]?.trim() ?? "Untitled Call"

    // Extract transcript: find the block after "Resume Auto-Scroll" or "Transcript"
    // Format is: SpeakerName\n> text\n\nSpeakerName\n> text
    const transcriptStart = raw.indexOf("Resume Auto-Scroll")
    const transcriptSection = transcriptStart !== -1 ? raw.slice(transcriptStart) : raw

    // Parse speaker/quote pairs
    const lines = transcriptSection.split("\n").map(l => l.trim()).filter(Boolean)
    const segments: string[] = []
    let currentSpeaker = ""

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Speaker lines: don't start with >, not a markdown heading, not a UI element
      if (!line.startsWith(">") && !line.startsWith("#") && !line.startsWith("[") &&
          !line.startsWith("!") && line.length > 1 && line.length < 80 &&
          /^[A-Z]/.test(line) && !line.includes("fathom") && !line.includes("http")) {
        currentSpeaker = line
      } else if (line.startsWith(">") && currentSpeaker) {
        const quote = line.replace(/^>\s*/, "").trim()
        if (quote.length > 2) {
          segments.push(`${currentSpeaker}: ${quote}`)
        }
      }
    }

    if (segments.length < 3) {
      return NextResponse.json({ error: "Could not extract transcript from this Fathom link. Make sure it's a public share link." }, { status: 400 })
    }

    const transcript = segments.join("\n")

    return NextResponse.json({ transcript, title })
  } catch (err) {
    console.error("Fathom fetch error:", err)
    return NextResponse.json({ error: "Failed to load Fathom recording" }, { status: 500 })
  }
}
