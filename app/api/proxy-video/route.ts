import { NextRequest, NextResponse } from "next/server"

const FATHOM_BASE = "https://fathom.video"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url", { status: 400 })

  // Only allow fathom.video URLs
  if (!url.startsWith("https://fathom.video/")) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://fathom.video/",
    },
  })

  if (!res.ok) {
    return new NextResponse(`Upstream error ${res.status}`, { status: res.status })
  }

  const contentType = res.headers.get("content-type") || ""
  const isManifest = url.includes(".m3u8") || contentType.includes("text/plain") || contentType.includes("mpegurl")

  if (isManifest) {
    const text = await res.text()
    // Rewrite relative /share/... paths to go through our proxy
    const rewritten = text.replace(/^(\/[^\s#][^\s]*)$/gm, (match) => {
      return `/api/proxy-video?url=${encodeURIComponent(FATHOM_BASE + match)}`
    })
    return new NextResponse(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    })
  }

  // Binary segment — stream through with correct MIME type
  const upstreamType = res.headers.get("content-type") || ""
  const segmentType = upstreamType && !upstreamType.includes("octet-stream")
    ? upstreamType
    : url.includes(".ts") || url.includes("video_chunk")
      ? "video/MP2T"
      : "application/octet-stream"

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": segmentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
