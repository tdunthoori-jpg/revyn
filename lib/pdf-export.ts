import type { CallAnalysis } from "@/lib/gemini"
import { formatDuration } from "@/lib/utils"

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

function scoreBar(score: number, max = 100): string {
  const filled = Math.round((score / max) * 20)
  return "█".repeat(filled) + "░".repeat(20 - filled) + `  ${score}%`
}

function outcomeLabel(outcome: string): string {
  const map: Record<string, string> = {
    closed: "✅ CLOSED",
    follow_up: "🔄 FOLLOW UP",
    lost: "❌ LOST",
    no_show: "👻 NO SHOW",
  }
  return map[outcome] ?? outcome.toUpperCase()
}

export async function exportCallToPdf(call: CallData) {
  const { analysis } = call

  // Build a clean HTML document to print as PDF
  const date = new Date(call.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Call Analysis — ${call.prospectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; padding: 40px; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 12px; margin-top: 28px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
    h3 { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    .meta { color: #888; font-size: 12px; margin-bottom: 24px; }
    .meta span { margin-right: 16px; }
    .pills { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .pill { padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; }
    .pill-green { background: #d1fae5; color: #065f46; }
    .pill-amber { background: #fef3c7; color: #92400e; }
    .pill-red { background: #fee2e2; color: #991b1b; }
    .pill-blue { background: #dbeafe; color: #1e40af; }
    .pill-purple { background: #ede9fe; color: #5b21b6; }
    .summary { background: #f8fafc; border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 8px; color: #444; }
    .scores-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .score-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 8px; }
    .score-label { color: #555; }
    .score-value { font-weight: 700; font-size: 15px; }
    .score-green { color: #059669; }
    .score-amber { color: #d97706; }
    .score-red { color: #dc2626; }
    .bar { height: 6px; border-radius: 3px; background: #e5e7eb; margin-top: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 5px; color: #444; }
    .objection { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
    .objection-text { font-weight: 600; margin-bottom: 4px; }
    .objection-handled { color: #666; font-size: 12px; margin-bottom: 4px; }
    .objection-better { color: #6366f1; font-size: 12px; }
    .ghost-close { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; color: #444; white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; color: #aaa; font-size: 11px; display: flex; justify-content: space-between; }
    .tone-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .tone-item { background: #f8fafc; border-radius: 8px; padding: 10px 12px; }
    .tone-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
    .tone-value { font-weight: 600; font-size: 14px; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>

  <h1>${call.prospectName}</h1>
  <div class="meta">
    <span>📅 ${date}</span>
    ${call.setter ? `<span>🎯 ${call.setter} → ${call.closer}</span>` : ""}
    ${call.source ? `<span>📣 ${call.source}</span>` : ""}
    ${call.duration ? `<span>⏱ ${formatDuration(call.duration)}</span>` : ""}
  </div>

  <div class="pills">
    <span class="pill ${analysis.callOutcome === "closed" ? "pill-green" : analysis.callOutcome === "follow_up" ? "pill-amber" : "pill-red"}">${outcomeLabel(analysis.callOutcome)}</span>
    <span class="pill pill-purple">Score: ${analysis.overallScore}/100</span>
    <span class="pill pill-blue">Close probability: ${analysis.closeProbability}%</span>
    <span class="pill ${analysis.leadTemperature === "hot" ? "pill-red" : analysis.leadTemperature === "warm" ? "pill-amber" : "pill-blue"}">${analysis.leadTemperature === "hot" ? "🔥 Hot" : analysis.leadTemperature === "warm" ? "🌡 Warm" : "❄️ Cold"} lead</span>
    ${analysis.refundRisk === "high" ? '<span class="pill pill-red">⚠️ High refund risk</span>' : ""}
  </div>

  <h2>Summary</h2>
  <div class="summary">${analysis.summary}</div>

  <h2>Scores</h2>
  <div class="scores-grid">
    ${Object.entries(analysis.scores).map(([key, val]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())
      const cls = val >= 70 ? "score-green" : val >= 50 ? "score-amber" : "score-red"
      const barColor = val >= 70 ? "#059669" : val >= 50 ? "#d97706" : "#dc2626"
      return `<div class="score-item">
        <span class="score-label">${label}</span>
        <div style="text-align:right">
          <span class="score-value ${cls}">${val}</span>
          <div class="bar"><div class="bar-fill" style="width:${val}%;background:${barColor}"></div></div>
        </div>
      </div>`
    }).join("")}
  </div>

  <h2>Strengths</h2>
  <ul>${(analysis.strengths ?? []).map(s => `<li>${s}</li>`).join("")}</ul>

  <h2>Areas to Improve</h2>
  <ul>${(analysis.improvements ?? []).map(s => `<li>${s}</li>`).join("")}</ul>

  ${analysis.objections?.length ? `
  <h2>Objections Handled</h2>
  ${analysis.objections.map(o => `
    <div class="objection">
      <div class="objection-text">❝ ${o.objection} ❞</div>
      <div class="objection-handled">How handled: ${o.howHandled}</div>
      <div class="objection-better">💡 Better response: ${o.betterResponse}</div>
    </div>
  `).join("")}` : ""}

  ${analysis.toneInsights ? `
  <h2>Tone & Delivery</h2>
  <div class="tone-grid">
    <div class="tone-item"><div class="tone-label">Closer Confidence</div><div class="tone-value">${analysis.toneInsights.closerConfidence}/100</div></div>
    <div class="tone-item"><div class="tone-label">Closer Energy</div><div class="tone-value">${analysis.toneInsights.closerEnergy}</div></div>
    <div class="tone-item"><div class="tone-label">Prospect Engagement</div><div class="tone-value">${analysis.toneInsights.prospectEngagement}</div></div>
    <div class="tone-item"><div class="tone-label">Talk Ratio</div><div class="tone-value">${analysis.toneInsights.talkRatio?.closer ?? "—"}% you / ${analysis.toneInsights.talkRatio?.prospect ?? "—"}% them</div></div>
    <div class="tone-item"><div class="tone-label">Filler Words</div><div class="tone-value">${analysis.toneInsights.fillerWordFrequency}</div></div>
    <div class="tone-item"><div class="tone-label">Emotional Tone</div><div class="tone-value">${analysis.toneInsights.emotionalTone}</div></div>
  </div>` : ""}

  <h2>Ghost Close Script</h2>
  <div class="ghost-close">${analysis.ghostCloseScript}</div>

  <h2>Next Call Strategy</h2>
  <div class="summary">${analysis.nextCallStrategy}</div>

  <div class="footer">
    <span>Generated by Revyn AI Sales Intelligence</span>
    <span>${date}</span>
  </div>

</body>
</html>`

  // Open in a new window and trigger print-to-PDF
  const win = window.open("", "_blank")
  if (!win) throw new Error("Popup blocked")
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
  }
}
