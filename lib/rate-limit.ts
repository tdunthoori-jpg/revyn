// In-memory sliding window rate limiter — resets on server restart
// Used for per-IP limits. Daily budget is tracked in Supabase so it survives restarts.

const store = new Map<string, number[]>()

export function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (store.get(key) ?? []).filter(t => t > windowStart)

  if (hits.length >= maxRequests) {
    const resetAt = new Date(hits[0] + windowMs)
    return { allowed: false, remaining: 0, resetAt }
  }

  hits.push(now)
  store.set(key, hits)

  // Prune stale keys to avoid memory leak
  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      if (v.every(t => t <= windowStart)) store.delete(k)
    }
  }

  return { allowed: true, remaining: maxRequests - hits.length, resetAt: null }
}
