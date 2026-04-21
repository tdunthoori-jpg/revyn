import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function ask(prompt: string, maxTokens = 3000): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a JSON API. Always respond with valid JSON only, no markdown, no explanation." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  })
  return completion.choices[0].message.content ?? ""
}

export interface CallAnalysis {
  overallScore: number
  closeProbability: number
  callOutcome: "closed" | "follow_up" | "lost" | "no_show"
  summary: string
  scores: {
    offerClarity: number
    objectionHandling: number
    rapport: number
    closingAttempt: number
    tonality: number
    qualification: number
  }
  strengths: string[]
  improvements: string[]
  keyMoments: {
    timestamp: string
    type: "buying_signal" | "objection" | "lost_interest" | "great_moment" | "missed_opportunity"
    description: string
    quote: string
  }[]
  objections: {
    objection: string
    howHandled: string
    score: number
    betterResponse: string
  }[]
  toneInsights: {
    closerConfidence: number
    closerEnergy: "high" | "medium" | "low"
    prospectEngagement: "high" | "medium" | "low"
    talkRatio: { closer: number; prospect: number }
    fillerWordFrequency: "high" | "medium" | "low"
    hesitationMoments: string[]
    confidenceHighs: string[]
    confidenceLows: string[]
    emotionalTone: "excited" | "neutral" | "tense" | "warm" | "defensive"
  }
  ghostCloseScript: string
  nextCallStrategy: string
  leadTemperature: "hot" | "warm" | "cold"
  refundRisk: "low" | "medium" | "high"
  refundRiskReason: string
}

export async function analyzeCall(transcript: string, fullTranscript: string, leadInfo?: {
  name?: string
  source?: string
  applicationAnswers?: string
}): Promise<CallAnalysis> {
  const leadCtx = leadInfo ? ` Lead: ${leadInfo.name || "Unknown"}, Source: ${leadInfo.source || "Unknown"}.` : ""

  // Build time-labelled segments from full transcript for key moments
  const fullWords = fullTranscript.trim().split(/\s+/)
  const totalWords = fullWords.length
  const WPM = 180
  const estimatedDurationSec = Math.round((totalWords / WPM) * 60)

  const toTS = (wordIdx: number) => {
    const sec = Math.round((wordIdx / totalWords) * estimatedDurationSec)
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
    return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${m}:${String(s).padStart(2,"0")}`
  }

  const totalDurationLabel = toTS(totalWords)

  // 4 segments × 200 words each, spread evenly, each with explicit time range for AI
  const SAMPLE = 200
  const sliceAt = totalWords > SAMPLE * 4
    ? [0, Math.floor(totalWords * 0.28), Math.floor(totalWords * 0.57), Math.floor(totalWords * 0.85)]
    : [0]

  const scanBlock = sliceAt.map((start, i) => {
    const end = Math.min(start + SAMPLE, totalWords)
    return `[Segment ${i + 1}: ${toTS(start)}–${toTS(end)}]\n${fullWords.slice(start, end).join(" ")}`
  }).join("\n\n")

  // Pass 1: main analysis on truncated transcript
  const analysisPrompt = `You are a high-ticket sales coach. Analyze this call transcript.${leadCtx}

TRANSCRIPT:
${transcript}

Return JSON only:
{"overallScore":<0-100>,"closeProbability":<0-100>,"callOutcome":<"closed"|"follow_up"|"lost"|"no_show">,"summary":<2-3 sentences>,"scores":{"offerClarity":<0-100>,"objectionHandling":<0-100>,"rapport":<0-100>,"closingAttempt":<0-100>,"tonality":<0-100>,"qualification":<0-100>},"strengths":[<4 specific>],"improvements":[<4 specific>],"objections":[{"objection":<text>,"howHandled":<text>,"score":<0-100>,"betterResponse":<text>}],"toneInsights":{"closerConfidence":<0-100>,"closerEnergy":<"high"|"medium"|"low">,"prospectEngagement":<"high"|"medium"|"low">,"talkRatio":{"closer":<int>,"prospect":<int>},"fillerWordFrequency":<"high"|"medium"|"low">,"hesitationMoments":[<2 examples>],"confidenceHighs":[<2 examples>],"confidenceLows":[<2 examples>],"emotionalTone":<"excited"|"neutral"|"tense"|"warm"|"defensive">},"ghostCloseScript":<100-130 word follow-up>,"nextCallStrategy":<plan>,"leadTemperature":<"hot"|"warm"|"cold">,"refundRisk":<"low"|"medium"|"high">,"refundRiskReason":<reason>}`

  // Pass 2: key moments — separate prompt on time-labelled segments
  const momentsPrompt = `Sales call analyst. Call total length: ${totalDurationLabel}. Below are 4 excerpts from different time windows of the call. Find 2 key moments per segment. Timestamps must be within each segment's labeled window.${leadCtx}

${scanBlock}

Return JSON only:
{"keyMoments":[{"timestamp":<"M:SS" or "H:MM:SS" within that segment>,"type":<"buying_signal"|"objection"|"lost_interest"|"great_moment"|"missed_opportunity">,"description":<1 sentence>,"quote":<verbatim>}]}`

  // Run both calls — add 800ms gap between them to avoid TPM rate window
  const analysisText = await ask(analysisPrompt, 2500)
  const analysis = JSON.parse(analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim())

  await new Promise(r => setTimeout(r, 800))

  let keyMoments: CallAnalysis["keyMoments"] = []
  try {
    const momentsText = await ask(momentsPrompt, 1500)
    const parsed = JSON.parse(momentsText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim())
    keyMoments = parsed.keyMoments || []
  } catch (e) {
    console.error("Moments scan error:", String(e))
  }

  return { ...analysis, keyMoments } as CallAnalysis
}

export async function generatePreCallBriefing(leadInfo: {
  name: string
  source: string
  applicationAnswers: string
  previousInteractions?: string
}): Promise<{
  closeScore: number
  temperature: "hot" | "warm" | "cold"
  primaryPainPoint: string
  likelyObjections: string[]
  recommendedOpeningAngle: string
  thingsToAvoid: string[]
  suggestedTalkingPoints: string[]
  estimatedDecisionMaker: boolean
}> {
  const prompt = `You are an expert high-ticket sales coach. Based on this lead's information, generate a pre-call briefing card for the closer.

Lead Name: ${leadInfo.name}
Traffic Source: ${leadInfo.source}
Application Answers: ${leadInfo.applicationAnswers}
Previous Interactions: ${leadInfo.previousInteractions || "None"}

Return a JSON object (no markdown, pure JSON):
{
  "closeScore": <0-100 predicted close likelihood>,
  "temperature": <"hot" | "warm" | "cold">,
  "primaryPainPoint": <their #1 pain point based on their answers>,
  "likelyObjections": [<3 most likely objections this specific person will raise>],
  "recommendedOpeningAngle": <exactly how to open the call with this person>,
  "thingsToAvoid": [<2-3 things NOT to bring up or do with this lead>],
  "suggestedTalkingPoints": [<3-4 specific talking points that will resonate with this person>],
  "estimatedDecisionMaker": <true if they appear to be the decision maker, false if they may need to consult spouse/partner>
}`

  const text = await ask(prompt)
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(cleaned)
}
