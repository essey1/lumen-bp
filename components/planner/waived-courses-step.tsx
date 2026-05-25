"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, X, Plus, Check } from "lucide-react"
import { COURSE_CATALOG } from "@/lib/course-catalog"
import { NewCourseModal, type NewCourseResult } from "@/components/shared/new-course-modal"

// Session-local catalog — grows when user adds new courses
const ALL_COURSES = Object.values(COURSE_CATALOG).sort((a, b) => a.code.localeCompare(b.code))

// ── Pill for a selected waived course ─────────────────────────────────────────
function WaivedPill({ code, name, onRemove }: { code: string; name: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.3)" }}>
      <span className="font-mono font-semibold">{code}</span>
      {name && name !== code && <span className="opacity-70">— {name.length > 28 ? name.slice(0, 28) + "…" : name}</span>}
      <button type="button" onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// ── Searchable combobox for adding a waived course ────────────────────────────
interface ComboboxProps {
  onSelect: (code: string, name: string) => void
  excluded: string[]
}

function WaivedCourseCombobox({ onSelect, excluded }: ComboboxProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [showNewCourse, setShowNewCourse] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const base = q
      ? ALL_COURSES.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      : ALL_COURSES.slice(0, 35)
    return base.filter(c => !excluded.includes(c.code)).slice(0, 30)
  }, [query, excluded])

  function pick(code: string, name: string) {
    onSelect(code, name)
    setQuery("")
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleNewCourse(result: NewCourseResult) {
    if (!ALL_COURSES.find(c => c.code === result.code)) {
      ALL_COURSES.push({ code: result.code, name: result.name, credits: result.credits })
      ALL_COURSES.sort((a, b) => a.code.localeCompare(b.code))
    }
    onSelect(result.code, result.name)
    setShowNewCourse(false)
    setQuery("")
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "#4a7a72" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search by course code or name…"
            className="h-10 w-full rounded-xl pl-9 pr-4 text-sm outline-none transition"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e2ede8",
            }}
            onFocus={() => setOpen(true)}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
          />
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl shadow-xl"
            style={{ background: "#0d1f18", border: "1px solid rgba(255,255,255,0.12)" }}>
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-center text-sm" style={{ color: "#4a7a72" }}>
                No courses found.
              </p>
            )}
            {filtered.map(c => (
              <button key={c.code} type="button"
                onMouseDown={e => { e.preventDefault(); pick(c.code, c.name) }}
                className="flex w-full items-baseline gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-white/5">
                <span className="w-20 shrink-0 font-mono text-xs font-semibold" style={{ color: "#f5a623" }}>
                  {c.code}
                </span>
                <span className="flex-1 min-w-0 truncate text-xs" style={{ color: "#c8e0d8" }}>
                  {c.name}
                </span>
                <span className="shrink-0 text-[10px]" style={{ color: "#4a7a72" }}>
                  {c.credits}cr
                </span>
              </button>
            ))}

            {/* Add new course — always at the bottom */}
            <button type="button"
              onMouseDown={e => { e.preventDefault(); setOpen(false); setShowNewCourse(true) }}
              className="flex w-full items-center gap-2 border-t px-4 py-3 text-left text-xs font-semibold transition-colors hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "#f5a623" }}>
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Add a new course not in the catalog…
            </button>
          </div>
        )}
      </div>

      <NewCourseModal
        open={showNewCourse}
        initialCode={query}
        onClose={() => setShowNewCourse(false)}
        onCreated={handleNewCourse}
      />
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  selected: string[]
  onChange: (value: string[]) => void
}

export function WaivedCoursesStep({ selected, onChange }: Props) {
  // Build a map from code → name for selected courses
  const [nameMap, setNameMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const code of selected) {
      const c = COURSE_CATALOG[code]
      m[code] = c?.name ?? code
    }
    return m
  })

  function addCourse(code: string, name: string) {
    if (selected.includes(code)) return
    setNameMap(prev => ({ ...prev, [code]: name }))
    onChange([...selected, code])
  }

  function removeCourse(code: string) {
    onChange(selected.filter(c => c !== code))
  }

  return (
    <div className="space-y-5">
      <p className="text-center text-sm" style={{ color: "#7aada0" }}>
        Add any courses you have already completed or been waived from.
        Search by code (e.g.{" "}
        <span className="font-medium" style={{ color: "#e2ede8" }}>CHM 101</span>) or name.
        Don&apos;t see a course? Use the &ldquo;Add new course&rdquo; option below.
      </p>

      {/* Search combobox */}
      <WaivedCourseCombobox onSelect={addCourse} excluded={selected} />

      {/* Selected courses */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#4a7a72" }}>
            {selected.length} course{selected.length !== 1 ? "s" : ""} waived
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map(code => (
              <WaivedPill
                key={code}
                code={code}
                name={nameMap[code] ?? code}
                onRemove={() => removeCourse(code)}
              />
            ))}
          </div>
        </div>
      )}

      {selected.length === 0 && (
        <div className="rounded-xl py-6 text-center" style={{ border: "1px dashed rgba(255,255,255,0.10)" }}>
          <Check className="mx-auto mb-2 h-6 w-6" style={{ color: "#4a7a72" }} />
          <p className="text-sm" style={{ color: "#4a7a72" }}>
            No waived courses yet — search above to add them.
          </p>
        </div>
      )}
    </div>
  )
}
