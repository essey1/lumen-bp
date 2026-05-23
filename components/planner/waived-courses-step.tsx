"use client"

import { useState, useMemo } from "react"
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { COURSE_CATALOG } from "@/lib/course-catalog"
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseCourseCodes(text: string): { known: string[]; custom: string[] } {
  const matches = text.toUpperCase().match(/\b[A-Z&]{2,5}\s*\d{3}[A-Z]?\b/g) ?? []
  const normalized = Array.from(
    new Set(matches.map(code => code.replace(/\s+/, " ").trim()))
  )
  const known: string[] = []
  const custom: string[] = []
  for (const code of normalized) {
    if (COURSE_CATALOG[code]) known.push(code)
    else custom.push(code)
  }
  return { known, custom }
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

// ── Pill toggle button ────────────────────────────────────────────────────────
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

// ── Inline form for a single unknown course ───────────────────────────────────
interface CourseFormProps {
  entry: CustomCourseEntry
  submitted: boolean
  sending: boolean
  onChange: (e: CustomCourseEntry) => void
  onSubmit: () => void
}

function CourseDetailForm({ entry, submitted, sending, onChange, onSubmit }: CourseFormProps) {
  const [open, setOpen] = useState(!submitted)

  // "I don't know" flags — when toggled, the corresponding fields are cleared
  const [nameUnknown, setNameUnknown] = useState(false)
  const [prereqUnknown, setPrereqUnknown] = useState(false)
  const [gemUnknown, setGemUnknown] = useState(false)

  const upd = (patch: Partial<CustomCourseEntry>) => onChange({ ...entry, ...patch })

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "rgba(245,166,35,0.35)" }}
    >
      {/* ── Collapsed header ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
        style={{ background: "rgba(245,166,35,0.07)" }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-sm font-bold" style={{ color: "#f5a623" }}>
            {entry.code}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {submitted && entry.name
              ? `— ${entry.name}`
              : "— not in catalog yet, tell us about it"}
          </span>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          {submitted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {open
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div className="space-y-5 px-4 py-5">

          {/* Course name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Course name</label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={nameUnknown}
                  onChange={e => {
                    setNameUnknown(e.target.checked)
                    if (e.target.checked) upd({ name: "" })
                  }}
                  className="accent-primary"
                />
                I don&apos;t know
              </label>
            </div>
            <Input
              value={entry.name}
              onChange={e => upd({ name: e.target.value })}
              placeholder={`e.g. "Physics and the Environment"`}
              disabled={nameUnknown}
              className={cn(nameUnknown && "opacity-40")}
            />
          </div>

          {/* Credits */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Credits</label>
            <div className="flex gap-2">
              {([0.5, 1] as const).map(cr => (
                <Pill key={cr} label={`${cr}`} active={entry.credits === cr} onClick={() => upd({ credits: cr })} />
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Prerequisites</label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={prereqUnknown}
                  onChange={e => {
                    setPrereqUnknown(e.target.checked)
                    if (e.target.checked) upd({ prerequisites: "" })
                  }}
                  className="accent-primary"
                />
                None / I don&apos;t know
              </label>
            </div>
            <Input
              value={entry.prerequisites}
              onChange={e => upd({ prerequisites: e.target.value })}
              placeholder="e.g. PHY 115, MAT 115 (comma-separated course codes)"
              disabled={prereqUnknown}
              className={cn(prereqUnknown && "opacity-40")}
            />
          </div>

          {/* GEM perspectives */}
          <div
            className="space-y-4 rounded-lg border p-4"
            style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                GEM perspectives this course covers
              </p>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={gemUnknown}
                  onChange={e => {
                    setGemUnknown(e.target.checked)
                    if (e.target.checked) upd({ wayOfKnowing: "", richnesses: [], value: "", additional: [] })
                  }}
                  className="accent-primary"
                />
                I don&apos;t know
              </label>
            </div>

            {!gemUnknown && (
              <div className="space-y-4">
                {/* Way of Knowing */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Way of Knowing <span className="font-normal normal-case">(pick one)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {WAYS_OF_KNOWING.map(wok => (
                      <Pill
                        key={wok} label={wok}
                        active={entry.wayOfKnowing === wok}
                        onClick={() => upd({ wayOfKnowing: entry.wayOfKnowing === wok ? "" : wok })}
                      />
                    ))}
                    <Pill
                      label="None"
                      active={entry.wayOfKnowing === ""}
                      onClick={() => upd({ wayOfKnowing: "" })}
                    />
                  </div>
                </div>

                {/* Richnesses */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Richnesses <span className="font-normal normal-case">(select all that apply)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {RICHNESSES.map(r => (
                      <Pill
                        key={r} label={r}
                        active={entry.richnesses.includes(r)}
                        onClick={() => upd({
                          richnesses: entry.richnesses.includes(r)
                            ? entry.richnesses.filter(x => x !== r)
                            : [...entry.richnesses, r],
                        })}
                      />
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Value <span className="font-normal normal-case">(pick one)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {VALUES.map(v => (
                      <Pill
                        key={v} label={v}
                        active={entry.value === v}
                        onClick={() => upd({ value: entry.value === v ? "" : v })}
                      />
                    ))}
                    <Pill label="None" active={entry.value === ""} onClick={() => upd({ value: "" })} />
                  </div>
                </div>

                {/* Additional */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Additional designations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["ALE", "ALES", "Physical Activity"] as const).map(a => (
                      <Pill
                        key={a} label={a}
                        active={entry.additional.includes(a)}
                        onClick={() => upd({
                          additional: entry.additional.includes(a)
                            ? entry.additional.filter(x => x !== a)
                            : [...entry.additional, a],
                        })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button type="button" size="sm" className="w-full gap-2" onClick={onSubmit} disabled={sending}>
            {sending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : submitted
                ? <><Send className="h-4 w-4" /> Update course details</>
                : <><Send className="h-4 w-4" /> Add to catalog</>
            }
          </Button>

          {submitted && (
            <p className="text-center text-xs text-green-600 dark:text-green-400">
              ✓ Details submitted — we&apos;ll add this course to the catalog. It&apos;s already counted as waived in your plan.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  selected: string[]
  onChange: (value: string[]) => void
  customCourses: Record<string, CustomCourseEntry>
  onCustomCoursesChange: (courses: Record<string, CustomCourseEntry>) => void
}

export function WaivedCoursesStep({ selected, onChange, customCourses, onCustomCoursesChange }: Props) {
  const [rawText, setRawText] = useState(() => selected.join(", "))
  const [submittedCodes, setSubmittedCodes] = useState<Set<string>>(
    () => new Set(Object.keys(customCourses))
  )
  const [sendingCode, setSendingCode] = useState<string | null>(null)

  const { known, custom } = useMemo(() => parseCourseCodes(rawText), [rawText])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setRawText(text)
    const { known: k, custom: c } = parseCourseCodes(text)
    // Initialise entry objects for newly-typed unknown codes
    const updated = { ...customCourses }
    for (const code of c) {
      if (!updated[code]) updated[code] = emptyEntry(code)
    }
    onCustomCoursesChange(updated)
    onChange([...k, ...c])
  }

  const handleEntryChange = (code: string, entry: CustomCourseEntry) => {
    onCustomCoursesChange({ ...customCourses, [code]: entry })
  }

  const handleSubmit = async (code: string) => {
    setSendingCode(code)
    try {
      await fetch("/api/custom-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customCourses[code] ?? emptyEntry(code)),
      })
    } catch { /* non-critical — notification is best-effort */ }
    setSendingCode(null)
    setSubmittedCodes(prev => new Set([...prev, code]))
  }

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-muted-foreground">
        Enter any courses you have already completed or been waived from,
        separated by commas or new lines. Use course codes like{" "}
        <span className="font-medium text-foreground">CHM 101</span>,{" "}
        <span className="font-medium text-foreground">BIO 101</span>, or{" "}
        <span className="font-medium text-foreground">CSC 226</span>.
        New or unlisted courses are welcome — just fill in their details below.
      </p>

      <Textarea
        value={rawText}
        onChange={handleTextChange}
        placeholder={"Examples:\nCHM 101, BIO 101\nCSC 226\nPHY 120"}
        className="min-h-32"
      />

      {/* Recognised courses */}
      {known.length > 0 && (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            {known.length} course{known.length === 1 ? "" : "s"} recognised in catalog
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {known.map(code => (
              <Badge key={code} variant="secondary" className="px-3 py-1.5 text-sm">
                {code}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Unknown courses — inline detail forms */}
      {custom.length > 0 && (
        <div className="space-y-3">
          <p className="text-center text-sm" style={{ color: "#f5a623" }}>
            {custom.length} course{custom.length === 1 ? "" : "s"} not yet in our catalog —
            fill in the details so we can credit them properly
          </p>
          {custom.map(code => (
            <CourseDetailForm
              key={code}
              entry={customCourses[code] ?? emptyEntry(code)}
              submitted={submittedCodes.has(code)}
              sending={sendingCode === code}
              onChange={entry => handleEntryChange(code, entry)}
              onSubmit={() => handleSubmit(code)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
