import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (error || !data) return NextResponse.json({ error: "Call not found" }, { status: 404 })

  return NextResponse.json({
    id: data.id,
    prospectName: data.prospect_name,
    setter: data.setter,
    closer: data.closer,
    source: data.source,
    duration: data.duration,
    transcript: data.transcript,
    analysis: data.analysis,
    fathomUrl: data.fathom_url,
    createdAt: data.created_at,
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from("calls")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
