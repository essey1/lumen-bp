"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COURSE_CATALOG } from "@/lib/course-catalog";
import { NewCourseModal, type NewCourseResult } from "@/components/shared/new-course-modal";

export interface CompletedCourse {
  code: string;
  name: string;
  credits: number;
}

export interface CompletedSemesterData {
  year: number;
  semester: "Fall" | "Spring";
  courses: CompletedCourse[];
}

interface Props {
  completedCount: number;
  onCountChange: (n: number) => void;
  semesters: CompletedSemesterData[];
  onSemestersChange: (s: CompletedSemesterData[]) => void;
}

const SEM_LABELS = [
  { year: 1, semester: "Fall"   as const, label: "Year 1 — Fall" },
  { year: 1, semester: "Spring" as const, label: "Year 1 — Spring" },
  { year: 2, semester: "Fall"   as const, label: "Year 2 — Fall" },
  { year: 2, semester: "Spring" as const, label: "Year 2 — Spring" },
  { year: 3, semester: "Fall"   as const, label: "Year 3 — Fall" },
  { year: 3, semester: "Spring" as const, label: "Year 3 — Spring" },
  { year: 4, semester: "Fall"   as const, label: "Year 4 — Fall" },
];

// Flat sorted array built once from the catalog
const ALL_COURSES = Object.values(COURSE_CATALOG).sort((a, b) =>
  a.code.localeCompare(b.code)
);

// ── Searchable course combobox ───────────────────────────────────────────────

function CourseCombobox({
  value,
  onChange,
}: {
  value: CompletedCourse;
  onChange: (c: CompletedCourse) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_COURSES.slice(0, 30);
    const q = query.toLowerCase();
    return ALL_COURSES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [query]);

  const isSelected = !!value.code;

  function selectCourse(c: { code: string; name: string; credits: number }) {
    onChange({ code: c.code, name: c.name, credits: c.credits });
    setOpen(false);
    setQuery("");
  }

  function clearCourse() {
    onChange({ code: "", name: "", credits: 1 });
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleNewCourse(result: NewCourseResult) {
    // Add to session list if not already there
    if (!ALL_COURSES.find(c => c.code === result.code)) {
      ALL_COURSES.push({ code: result.code, name: result.name, credits: result.credits });
      ALL_COURSES.sort((a, b) => a.code.localeCompare(b.code));
    }
    onChange({ code: result.code, name: result.name, credits: result.credits });
    setShowNewCourse(false);
    setQuery("");
  }

  return (
    <>
      <div ref={containerRef} className="relative flex-1 min-w-0">
        {isSelected ? (
          // Show selected course as a pill
          <div className="flex items-center gap-2 h-9 rounded-md border border-border bg-muted/40 px-3">
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="flex-1 min-w-0 truncate text-sm">
              <span className="font-mono font-semibold text-foreground">{value.code}</span>
              <span className="text-muted-foreground"> — {value.name}</span>
            </span>
            <button
              type="button"
              onClick={clearCourse}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          // Search input
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Search by code or name…"
              className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
            />
          </div>
        )}

        {/* Dropdown */}
        {open && !isSelected && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No courses found.
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectCourse(c); }}
                  className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  <span className="shrink-0 w-20 font-mono text-xs font-semibold text-foreground">
                    {c.code}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-muted-foreground text-xs">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground/60">
                    {c.credits}cr
                  </span>
                </button>
              ))
            )}

            {/* Add new course option — always visible */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); setShowNewCourse(true); }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-xs font-semibold transition-colors hover:bg-muted"
              style={{ color: "#f5a623" }}
            >
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
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultSemesters(count: number): CompletedSemesterData[] {
  return SEM_LABELS.slice(0, count).map(({ year, semester }) => ({
    year,
    semester,
    courses: [{ code: "", name: "", credits: 1 }],
  }));
}

// ── Main step component ───────────────────────────────────────────────────────

export function CompletedSemestersStep({
  completedCount,
  onCountChange,
  semesters,
  onSemestersChange,
}: Props) {
  const [activeSem, setActiveSem] = useState(0);

  function handleCountChange(n: number) {
    onCountChange(n);
    if (n === 0) { onSemestersChange([]); return; }
    const existing = semesters.slice(0, n);
    const needed = buildDefaultSemesters(n).slice(existing.length);
    onSemestersChange([...existing, ...needed]);
    setActiveSem(Math.min(activeSem, n - 1));
  }

  function updateCourse(semIdx: number, courseIdx: number, updated: CompletedCourse) {
    onSemestersChange(
      semesters.map((sem, si) =>
        si !== semIdx ? sem : {
          ...sem,
          courses: sem.courses.map((c, ci) => ci !== courseIdx ? c : updated),
        }
      )
    );
  }

  function updateCredits(semIdx: number, courseIdx: number, credits: number) {
    const sem = semesters[semIdx];
    if (!sem) return;
    updateCourse(semIdx, courseIdx, { ...sem.courses[courseIdx], credits });
  }

  function addCourse(semIdx: number) {
    onSemestersChange(
      semesters.map((sem, si) =>
        si !== semIdx ? sem : { ...sem, courses: [...sem.courses, { code: "", name: "", credits: 1 }] }
      )
    );
  }

  function removeCourse(semIdx: number, courseIdx: number) {
    onSemestersChange(
      semesters.map((sem, si) =>
        si !== semIdx ? sem : { ...sem, courses: sem.courses.filter((_, ci) => ci !== courseIdx) }
      )
    );
  }

  return (
    <div className="space-y-6">
      {/* Count picker */}
      <div>
        <label className="mb-3 block text-sm font-medium text-foreground">
          How many semesters have you already completed?
        </label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleCountChange(n)}
              className={`rounded-lg border py-3 text-sm font-semibold transition-colors ${
                completedCount === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {completedCount === 0
            ? "You're just starting, we'll plan all 8 semesters."
            : `${completedCount} semester${completedCount > 1 ? "s" : ""} done. We'll plan the remaining ${8 - completedCount}.`}
        </p>
      </div>

      {/* Summer course disclaimer */}
      {completedCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-medium">Note on summer courses:</span> If you took a course over the summer, include it in whichever fall or spring semester is closest to when you took it.
        </div>
      )}

      {/* Semester tabs + course input */}
      {completedCount > 0 && semesters.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            Select the courses you took each semester:
          </p>

          {/* Semester tab strip */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {semesters.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSem(i)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeSem === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {SEM_LABELS[i]?.label ?? `Semester ${i + 1}`}
              </button>
            ))}
          </div>

          {/* Active semester editor */}
          {semesters[activeSem] && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {SEM_LABELS[activeSem]?.label}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {semesters[activeSem].courses.length} course{semesters[activeSem].courses.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2">
                {semesters[activeSem].courses.map((course, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    {/* Searchable course picker */}
                    <CourseCombobox
                      value={course}
                      onChange={(updated) => updateCourse(activeSem, ci, updated)}
                    />

                    {/* Credits — auto-filled but editable */}
                    <div className="shrink-0 flex items-center gap-1">
                      <input
                        type="number"
                        min={0.25}
                        max={4}
                        step={0.25}
                        value={course.credits}
                        onChange={(e) => updateCredits(activeSem, ci, parseFloat(e.target.value) || 1)}
                        className="h-9 w-16 rounded-md border border-border bg-background px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        title="Credits"
                      />
                      <span className="text-xs text-muted-foreground">cr</span>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeCourse(activeSem, ci)}
                      disabled={semesters[activeSem].courses.length <= 1}
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addCourse(activeSem)}
                className="mt-3 gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another course
              </Button>
            </div>
          )}

          {/* Prev / Next nav */}
          {semesters.length > 1 && (
            <div className="mt-3 flex justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveSem((p) => Math.max(0, p - 1))}
                disabled={activeSem === 0}
                className="text-xs"
              >
                ← Previous
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveSem((p) => Math.min(semesters.length - 1, p + 1))}
                disabled={activeSem === semesters.length - 1}
                className="text-xs"
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
