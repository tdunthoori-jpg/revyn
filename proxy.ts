import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Auth is enforced in each API route via Clerk's auth() helper.
// Dashboard page-level redirects are handled in the layout.
export function proxy(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
}
