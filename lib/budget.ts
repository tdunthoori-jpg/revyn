import { supabase } from "@/lib/supabase"

// GPT-4o-mini pricing (per token)
const INPUT_COST_PER_TOKEN = 0.15 / 1_000_000
const OUTPUT_COST_PER_TOKEN = 0.60 / 1_000_000

// Worst-case estimate per analysis: 4000 input + 4000 output tokens
export const ESTIMATED_COST_PER_ANALYSIS = (4000 * INPUT_COST_PER_TOKEN) + (4000 * OUTPUT_COST_PER_TOKEN)

// Max analyses allowed per day globally (env var, default 100 → ~$0.30/day worst case)
const MAX_DAILY_ANALYSES = parseInt(process.env.MAX_DAILY_ANALYSES ?? "100", 10)

export async function checkDailyBudget(): Promise<{ allowed: boolean; used: number; limit: number }> {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const { count, error } = await supabase
    .from("calls")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00Z`)
    .lt("created_at", `${today}T23:59:59Z`)

  if (error) {
    // If we can't check, allow through (fail open) but log
    console.error("Budget check error:", error.message)
    return { allowed: true, used: 0, limit: MAX_DAILY_ANALYSES }
  }

  const used = count ?? 0
  return {
    allowed: used < MAX_DAILY_ANALYSES,
    used,
    limit: MAX_DAILY_ANALYSES,
  }
}
