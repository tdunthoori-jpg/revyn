import { AssemblyAI } from "assemblyai"

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! })

export async function transcribeAudio(audioUrl: string): Promise<{
  transcript: string
  duration: number
  utterances: { speaker: string; text: string; start: number; end: number }[]
}> {
  const transcript = await client.transcripts.transcribe({
    audio_url: audioUrl,
    speaker_labels: true,
  })

  if (transcript.status === "error") {
    throw new Error(`Transcription failed: ${transcript.error}`)
  }

  const utterances = (transcript.utterances || []).map((u) => ({
    speaker: `Speaker ${u.speaker}`,
    text: u.text,
    start: u.start / 1000,
    end: u.end / 1000,
  }))

  const formattedTranscript = utterances
    .map((u) => `[${formatTime(u.start)}] ${u.speaker}: ${u.text}`)
    .join("\n")

  return {
    transcript: formattedTranscript || transcript.text || "",
    duration: (transcript.audio_duration || 0),
    utterances,
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
