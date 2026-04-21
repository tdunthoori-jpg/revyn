"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { PageEnter, FadeUp } from "@/components/motion"
import { FileAudio, Loader2, CheckCircle, X, Sparkles, ClipboardPaste, Link } from "lucide-react"
import { cn } from "@/lib/utils"

type Mode = "file" | "fathom" | "transcript"

function CallDetailsForm({ form, setForm }: {
  form: { prospectName: string; setter: string; closer: string; source: string; applicationAnswers: string }
  setForm: (f: typeof form) => void
}) {
  return (
    <FadeUp delay={0.1}>
      <div className="rounded-2xl border border-white/6 bg-card p-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">Call Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Prospect Name *</Label>
            <Input placeholder="e.g. James Mitchell" value={form.prospectName}
              onChange={(e) => setForm({ ...form, prospectName: e.target.value })}
              className="bg-secondary/60 border-white/8 focus:border-primary/50 h-9 text-sm" />
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Traffic Source</Label>
            <Input placeholder="Instagram organic, FB Ads…" value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="bg-secondary/60 border-white/8 focus:border-primary/50 h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Setter</Label>
            <Input placeholder="Setter name" value={form.setter}
              onChange={(e) => setForm({ ...form, setter: e.target.value })}
              className="bg-secondary/60 border-white/8 focus:border-primary/50 h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Closer</Label>
            <Input placeholder="Closer name" value={form.closer}
              onChange={(e) => setForm({ ...form, closer: e.target.value })}
              className="bg-secondary/60 border-white/8 focus:border-primary/50 h-9 text-sm" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Application / Lead Answers</Label>
            <Textarea
              placeholder="Paste the lead's application answers here — significantly improves AI accuracy…"
              value={form.applicationAnswers}
              onChange={(e) => setForm({ ...form, applicationAnswers: e.target.value })}
              className="bg-secondary/60 border-white/8 focus:border-primary/50 min-h-[90px] text-sm resize-none" />
          </div>
        </div>
      </div>
    </FadeUp>
  )
}

function ProgressBar({ steps, step, stepLabels }: {
  steps: { key: string; label: string; done: boolean }[]
  step: string
  stepLabels: Record<string, string>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-primary/15 bg-primary/5 p-5"
    >
      <div className="flex items-center mb-4">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <motion.div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                s.done ? "bg-emerald-500 text-white" : step === s.key ? "bg-primary text-white glow-sm" : "bg-white/8 text-muted-foreground"
              }`}
              animate={step === s.key ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {s.done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </motion.div>
            <span className={`ml-2 text-xs font-medium ${step === s.key ? "text-primary" : s.done ? "text-emerald-400" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className={`h-px flex-1 mx-3 ${s.done ? "bg-emerald-500/40" : "bg-white/8"}`} />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        {step === "done" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        <span className="text-muted-foreground">{stepLabels[step as keyof typeof stepLabels]}</span>
      </div>
    </motion.div>
  )
}

function SubmitButton({ uploading, label }: { uploading: boolean; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Button type="submit" disabled={uploading} className="w-full bg-primary hover:bg-primary/90 text-white h-11 text-sm font-semibold glow-sm">
        {uploading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{label}</>
          : <><Sparkles className="w-4 h-4 mr-2" />{label}</>}
      </Button>
    </motion.div>
  )
}

export default function UploadPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("fathom")
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<"idle" | "fetching" | "transcribing" | "analyzing" | "done">("idle")
  const [form, setForm] = useState({ prospectName: "", setter: "", closer: "", source: "", applicationAnswers: "" })
  const [transcript, setTranscript] = useState("")
  const [fathomUrl, setFathomUrl] = useState("")

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith("audio/")) setFile(f)
    else toast.error("Please upload an audio file (MP3, M4A, WAV)")
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : "Something went wrong"
    try { const p = JSON.parse(msg); toast.error(p.error || msg) } catch { toast.error(msg) }
    setUploading(false)
    setStep("idle")
  }

  const handleFathomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fathomUrl.trim()) return toast.error("Please enter a Fathom share link")
    if (!fathomUrl.includes("fathom.video")) return toast.error("Please enter a valid fathom.video link")
    if (!form.prospectName) return toast.error("Please enter the prospect name")
    setUploading(true)
    setStep("fetching")
    try {
      // Fetch transcript from Fathom
      const fetchRes = await fetch("/api/fetch-fathom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fathomUrl }),
      })
      if (!fetchRes.ok) throw new Error(await fetchRes.text())
      const { transcript: fetchedTranscript } = await fetchRes.json()

      // Analyze
      setStep("analyzing")
      const res = await fetch("/api/analyze-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fetchedTranscript, fathomUrl, ...form }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setStep("done")
      toast.success("Analysis complete!")
      setTimeout(() => router.push(`/dashboard/calls/${data.id}`), 800)
    } catch (err) {
      handleError(err)
    }
  }

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error("Please upload a call recording")
    if (!form.prospectName) return toast.error("Please enter the prospect name")
    setUploading(true)
    setStep("transcribing")
    try {
      const formData = new FormData()
      formData.append("file", file)
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      setStep("analyzing")
      const res = await fetch("/api/analyze", { method: "POST", body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setStep("done")
      toast.success("Analysis complete!")
      setTimeout(() => router.push(`/dashboard/calls/${data.id}`), 800)
    } catch (err) {
      handleError(err)
    }
  }

  const handleTranscriptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transcript.trim()) return toast.error("Please paste a transcript")
    if (!form.prospectName) return toast.error("Please enter the prospect name")
    setUploading(true)
    setStep("analyzing")
    try {
      const res = await fetch("/api/analyze-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, ...form }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setStep("done")
      toast.success("Analysis complete!")
      setTimeout(() => router.push(`/dashboard/calls/${data.id}`), 800)
    } catch (err) {
      handleError(err)
    }
  }

  const stepLabels: Record<string, string> = {
    idle: "",
    fetching: "Fetching Fathom recording...",
    transcribing: "Transcribing your call...",
    analyzing: "AI is analyzing the call...",
    done: "Analysis complete! Redirecting...",
  }

  const progressSteps = mode === "file"
    ? [
        { key: "transcribing", label: "Transcribe", done: step === "analyzing" || step === "done" },
        { key: "analyzing", label: "Analyze", done: step === "done" },
        { key: "done", label: "Complete", done: step === "done" },
      ]
    : mode === "fathom"
    ? [
        { key: "fetching", label: "Fetch", done: step === "analyzing" || step === "done" },
        { key: "analyzing", label: "Analyze", done: step === "done" },
        { key: "done", label: "Complete", done: step === "done" },
      ]
    : [
        { key: "analyzing", label: "Analyze", done: step === "done" },
        { key: "done", label: "Complete", done: step === "done" },
      ]

  const tabs = [
    { key: "fathom" as Mode, label: "Fathom Link", icon: Link },
    { key: "file" as Mode, label: "Upload Audio", icon: FileAudio },
    { key: "transcript" as Mode, label: "Paste Transcript", icon: ClipboardPaste },
  ]

  return (
    <PageEnter>
      <div className="p-8 max-w-3xl">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h1 className="text-2xl font-bold tracking-tight">Analyze a Call</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Get a full AI analysis in under 2 minutes</p>
        </motion.div>

        {/* Mode tabs */}
        <motion.div
          className="flex items-center gap-1 p-1 rounded-xl bg-card border border-white/6 mb-4 w-fit"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setMode(key); setUploading(false); setStep("idle") }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                mode === key ? "bg-primary text-white glow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Fathom Link ── */}
          {mode === "fathom" && (
            <motion.form key="fathom-form" onSubmit={handleFathomSubmit} className="space-y-4"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}>
              <motion.div
                className="rounded-2xl border border-primary/20 bg-primary/5 p-6"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Link className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Fathom Share Link</div>
                    <div className="text-[11px] text-muted-foreground">Paste any public fathom.video/share/... link</div>
                  </div>
                </div>
                <Input
                  placeholder="https://fathom.video/share/..."
                  value={fathomUrl}
                  onChange={(e) => setFathomUrl(e.target.value)}
                  className="bg-secondary/60 border-white/8 focus:border-primary/50 h-10 text-sm font-mono"
                />
              </motion.div>

              <CallDetailsForm form={form} setForm={setForm} />
              <AnimatePresence>
                {uploading && <ProgressBar steps={progressSteps} step={step} stepLabels={stepLabels} />}
              </AnimatePresence>
              <SubmitButton uploading={uploading} label={uploading ? stepLabels[step] : "Analyze Fathom Call"} />
            </motion.form>
          )}

          {/* ── Upload Audio ── */}
          {mode === "file" && (
            <motion.form key="file-form" onSubmit={handleFileSubmit} className="space-y-4"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
                  dragging ? "border-primary bg-primary/8 glow-sm"
                  : file ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-white/10 bg-card hover:border-white/20 hover:bg-white/2"
                }`}
              >
                <div className="p-10 text-center">
                  <AnimatePresence mode="wait">
                    {file ? (
                      <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-semibold">{file.name}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB · ready to analyze</div>
                        </div>
                        <button type="button" onClick={() => setFile(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 cursor-pointer">
                          <X className="w-3 h-3" /> Remove file
                        </button>
                      </motion.div>
                    ) : (
                      <motion.label key="empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} className="block cursor-pointer">
                        <Input type="file" accept="audio/*" className="hidden" onChange={onFileChange} />
                        <div className="flex flex-col items-center gap-4">
                          <motion.div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                            <FileAudio className="w-7 h-7 text-primary" />
                          </motion.div>
                          <div>
                            <div className="font-semibold mb-1">Drop your call recording here</div>
                            <div className="text-sm text-muted-foreground">MP3, M4A, WAV · click to browse</div>
                          </div>
                        </div>
                      </motion.label>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
              <CallDetailsForm form={form} setForm={setForm} />
              <AnimatePresence>
                {uploading && <ProgressBar steps={progressSteps} step={step} stepLabels={stepLabels} />}
              </AnimatePresence>
              <SubmitButton uploading={uploading} label={uploading ? stepLabels[step] : "Analyze Call with AI"} />
            </motion.form>
          )}

          {/* ── Paste Transcript ── */}
          {mode === "transcript" && (
            <motion.form key="transcript-form" onSubmit={handleTranscriptSubmit} className="space-y-4"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <motion.div
                className="rounded-2xl border border-white/6 bg-card p-6"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transcript</h2>
                  <div className="text-[11px] text-muted-foreground/60">Works with Otter · Fireflies · Zoom AI · Any tool</div>
                </div>
                <Textarea
                  placeholder={`Paste your transcript here. Speaker labels help accuracy, e.g:\n\nSpeaker A: Hey James, how's it going?\nSpeaker B: Good, excited to chat today...`}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="bg-secondary/60 border-white/8 focus:border-primary/50 min-h-[220px] text-sm resize-none font-mono leading-relaxed"
                />
                {transcript.length > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px] text-muted-foreground">
                      {transcript.trim().split(/\s+/).length.toLocaleString()} words · ~{Math.round(transcript.trim().split(/\s+/).length / 150)} min call
                    </p>
                    <button type="button" onClick={() => setTranscript("")} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  </div>
                )}
              </motion.div>
              <CallDetailsForm form={form} setForm={setForm} />
              <AnimatePresence>
                {uploading && <ProgressBar steps={progressSteps} step={step} stepLabels={stepLabels} />}
              </AnimatePresence>
              <SubmitButton uploading={uploading} label={uploading ? stepLabels[step] : "Analyze Transcript with AI"} />
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </PageEnter>
  )
}
