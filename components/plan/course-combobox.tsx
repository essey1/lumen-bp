"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Check, Plus, AlertTriangle } from "lucide-react";
import { COURSE_CATALOG } from "@/lib/course-catalog";
import { isCourseAvailable } from "@/lib/course-schedule-data";
import type { PlannedCourse } from "@/lib/types";
import { NewCourseModal, type NewCourseResult } from "@/components/shared/new-course-modal";

// Module-level cache — starts as catalog, grows when user adds courses this session.
// Using a mutable array so all mounted comboboxes share the same list.
const SESSION_COURSES = Object.values(COURSE_CATALOG).sort((a, b) => a.code.localeCompare(b.code));

interface Props {
  course: PlannedCourse;
  onChange: (updated: PlannedCourse) => void;
  semesterIndex?: number;
}

export function PlanCourseCombobox({ course, onChange, semesterIndex }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedNotOffered =
    semesterIndex !== undefined &&
    !!course.code &&
    !course.isPlaceholder &&
    !isCourseAvailable(course.code, semesterIndex);

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
    if (!query.trim()) return SESSION_COURSES.slice(0, 30);
    const q = query.toLowerCase();
    return SESSION_COURSES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [query]);

  function select(picked: { code: string; name: string; credits: number }) {
    onChange({ ...course, code: picked.code, name: picked.name, credits: picked.credits, isPlaceholder: false });
    setOpen(false);
    setQuery("");
  }

  function clear() {
    onChange({ ...course, code: "", name: "", isPlaceholder: true });
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleNewCourse(result: NewCourseResult) {
    // Add to session list so subsequent searches find it
    if (!SESSION_COURSES.find(c => c.code === result.code)) {
      SESSION_COURSES.push({ code: result.code, name: result.name, credits: result.credits });
      SESSION_COURSES.sort((a, b) => a.code.localeCompare(b.code));
    }
    onChange({
      ...course,
      code: result.code,
      name: result.name,
      credits: result.credits,
      isPlaceholder: false,
    });
    setOpen(false);
    setQuery("");
  }

  const isSelected = !!course.code && !course.isPlaceholder;

  return (
    <>
      <div ref={containerRef} className="relative flex-1 min-w-0">
        {isSelected ? (
          <div className="flex flex-col gap-0.5">
            <div className={`flex items-center gap-1.5 h-8 rounded border px-2 ${selectedNotOffered ? "border-amber-400 bg-amber-50" : "border-current/30 bg-black/5"}`}>
              <Check className="h-3 w-3 shrink-0 opacity-60" />
              <span className="flex-1 min-w-0 truncate text-xs">
                <span className="font-mono font-semibold">{course.code}</span>
                <span className="opacity-70"> — {course.name}</span>
              </span>
              {selectedNotOffered && (
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" title="Not offered this semester" />
              )}
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); clear(); }}
                className="shrink-0 opacity-50 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {selectedNotOffered && (
              <p className="text-[10px] text-amber-600 leading-tight px-0.5">
                Not offered this semester — confirm with your advisor
              </p>
            )}
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Search course…"
              className="h-8 w-full rounded border border-current/30 bg-black/5 pl-6 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-current/40"
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
            />
          </div>
        )}

        {open && !isSelected && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                No courses found.
              </div>
            ) : (
              filtered.map((c) => {
                const notOffered =
                  semesterIndex !== undefined && !isCourseAvailable(c.code, semesterIndex);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(c); }}
                    className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-muted transition-colors"
                  >
                    <span className="w-20 shrink-0 font-mono text-xs font-semibold text-foreground">
                      {c.code}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
                      {c.name}
                    </span>
                    {notOffered ? (
                      <span className="shrink-0 text-[10px] text-amber-500 font-medium">not offered</span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-muted-foreground/60">
                        {c.credits}cr
                      </span>
                    )}
                  </button>
                );
              })
            )}

            {/* Always-visible "Add new course" row */}
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
