"use client"

import { useState } from "react"
import { Loader2, Plus, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { CustomCourseEntry, Richness, Value, WayOfKnowing } from "@/lib/types"

// ── GEM option lists ──────────────────────────────────────────────────────────
const WAYS_OF_KNOWING: WayOfKnowing[] = [
  "Applied Studies",
  "Creative Arts",
  "Cultural & Ethnic Studies",
  "Humanities",
  "Quantitative Reasoning",
  "Natural Science",
  "Social Science",
]
const RICHNESSES: Richness[] = ["Writing", "Internationally Rich", "Quantitatively Rich"]
const VALUES: Value[] = [
  "Beyond the Borders",
  "Holistic Wellness",
  "Power & Equity",
  "Seeking Meaning",
  "Sustainability",
]

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/60"
      )}
    >
      {label}
    </button>
  )
}

function emptyEntry(code: string): CustomCourseEntry {
  return {
    code,
    name: "",
    credits: 1,
    prerequisites: "",
    wayOfKnowing: "",
    richnesses: [],
    value: "",
    additional: [],
  }
}

export interface NewCourseResult {
  entry: CustomCourseEntry
  /** Derived values for immediate use as a catalog-like course */
  code: string
  name: string
  credits: number
}

interface Props {
  open: boolean
  onClose: () => void
  /** Called when the user successfully submits a new course */
  onCreated: (result: NewCourseResult) => void
  /** Pre-fill the course code (e.g. when the user typed an unknown code) */
  initialCode?: string
}

export function NewCourseModal({ open, onClose, onCreated, initialCode = "" }: Props) {
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [entry, setEntry] = useState<CustomCourseEntry>(() => emptyEntry(initialCode.toUpperCase()))
  const [nameUnknown, setNameUnknown] = useState(false)
  const [prereqUnknown, setPrereqUnknown] = useState(false)
  const [gemUnknown, setGemUnknown] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const upd = (patch: Partial<CustomCourseEntry>) =>
    setEntry(prev => ({ ...prev, ...patch }))

  function handleCodeChange(raw: string) {
    const upper = raw.toUpperCase()
    setCode(upper)
    setEntry(prev => ({ ...prev, code: upper }))
  }

  async function handleSubmit() {
    if (!code.trim()) { setError("Course code is required."); return }
    setError("")
    setSending(true)
    const finalEntry: CustomCourseEntry = { ...entry, code: code.trim() }
    try {
      await fetch("/api/custom-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalEntry),
      })
    } catch {
      /* notification is best-effort — don't block the user */
    }
    setSending(false)
    onCreated({
      entry: finalEntry,
      code: finalEntry.code,
      name: nameUnknown ? finalEntry.code : (finalEntry.name || finalEntry.code),
      credits: finalEntry.credits,
    })
    onClose()
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl shadow-2xl sm:rounded-2xl"
        style={{ background: "#0d1f18", border: "1px solid rgba(245,166,35,0.25)" }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "rgba(245,166,35,0.15)", background: "rgba(245,166,35,0.06)" }}>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" style={{ color: "#f5a623" }} />
            <h2 className="font-semibold" style={{ color: "#f0ede0", fontFamily: "var(--font-cinzel)" }}>
              Add a New Course
            </h2>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] space-y-5 overflow-y-auto px-6 py-5 sm:max-h-[70vh]">
          <p className="text-sm" style={{ color: "#7aada0" }}>
            This course isn&apos;t in our catalog yet. Fill in what you know — anything helps.
            We&apos;ll add it so future students benefit too.
          </p>

          {/* Course code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7aada0" }}>
              Course Code <span style={{ color: "#f5a623" }}>*</span>
            </label>
            <Input
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              placeholder="e.g. BIO 215"
              className="forest-input font-mono"
            />
          </div>

          {/* Course name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7aada0" }}>
                Course Name
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs" style={{ color: "#4a7a72" }}>
                <input type="checkbox" checked={nameUnknown}
                  onChange={e => { setNameUnknown(e.target.checked); if (e.target.checked) upd({ name: "" }) }}
                  className="accent-primary" />
                I don&apos;t know
              </label>
            </div>
            <Input
              value={entry.name}
              onChange={e => upd({ name: e.target.value })}
              placeholder={`e.g. "Ecology and Evolution"`}
              disabled={nameUnknown}
              className={cn("forest-input", nameUnknown && "opacity-40")}
            />
          </div>

          {/* Credits */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7aada0" }}>
              Credits
            </label>
            <div className="flex gap-2">
              {([0.25, 0.5, 1] as const).map(cr => (
                <Pill key={cr} label={`${cr} cr`}
                  active={entry.credits === cr}
                  onClick={() => upd({ credits: cr })} />
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7aada0" }}>
                Prerequisites
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs" style={{ color: "#4a7a72" }}>
                <input type="checkbox" checked={prereqUnknown}
                  onChange={e => { setPrereqUnknown(e.target.checked); if (e.target.checked) upd({ prerequisites: "" }) }}
                  className="accent-primary" />
                None / I don&apos;t know
              </label>
            </div>
            <Input
              value={entry.prerequisites}
              onChange={e => upd({ prerequisites: e.target.value })}
              placeholder="e.g. BIO 115, CHM 101 (comma-separated)"
              disabled={prereqUnknown}
              className={cn("forest-input", prereqUnknown && "opacity-40")}
            />
          </div>

          {/* GEM perspectives */}
          <div className="space-y-3 rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7aada0" }}>
                GEM / Perspectives this course covers
              </p>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs" style={{ color: "#4a7a72" }}>
                <input type="checkbox" checked={gemUnknown}
                  onChange={e => {
                    setGemUnknown(e.target.checked)
                    if (e.target.checked) upd({ wayOfKnowing: "", richnesses: [], value: "", additional: [] })
                  }}
                  className="accent-primary" />
                I don&apos;t know
              </label>
            </div>

            {!gemUnknown && (
              <div className="space-y-4">
                {/* Way of Knowing */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#4a7a72" }}>
                    Way of Knowing <span className="font-normal normal-case opacity-70">(pick one)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {WAYS_OF_KNOWING.map(wok => (
                      <Pill key={wok} label={wok}
                        active={entry.wayOfKnowing === wok}
                        onClick={() => upd({ wayOfKnowing: entry.wayOfKnowing === wok ? "" : wok })} />
                    ))}
                    <Pill label="None" active={entry.wayOfKnowing === ""} onClick={() => upd({ wayOfKnowing: "" })} />
                  </div>
                </div>

                {/* Richnesses */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#4a7a72" }}>
                    Richnesses <span className="font-normal normal-case opacity-70">(select all that apply)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {RICHNESSES.map(r => (
                      <Pill key={r} label={r}
                        active={entry.richnesses.includes(r)}
                        onClick={() => upd({
                          richnesses: entry.richnesses.includes(r)
                            ? entry.richnesses.filter(x => x !== r)
                            : [...entry.richnesses, r],
                        })} />
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#4a7a72" }}>
                    Value <span className="font-normal normal-case opacity-70">(pick one)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {VALUES.map(v => (
                      <Pill key={v} label={v}
                        active={entry.value === v}
                        onClick={() => upd({ value: entry.value === v ? "" : v })} />
                    ))}
                    <Pill label="None" active={entry.value === ""} onClick={() => upd({ value: "" })} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}
            style={{ color: "#7aada0" }}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit} disabled={sending}
            className="gap-2"
            style={{ background: "#f5a623", color: "#071410" }}>
            {sending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
              : <><Send className="h-4 w-4" /> Add Course</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
