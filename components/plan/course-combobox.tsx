"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Check } from "lucide-react";
import { COURSE_CATALOG } from "@/lib/course-catalog";
import type { PlannedCourse } from "@/lib/types";

const ALL_COURSES = Object.values(COURSE_CATALOG).sort((a, b) =>
  a.code.localeCompare(b.code)
);

interface Props {
  course: PlannedCourse;
  onChange: (updated: PlannedCourse) => void;
}

export function PlanCourseCombobox({ course, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const isSelected = !!course.code && !course.isPlaceholder;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {isSelected ? (
        <div className="flex items-center gap-1.5 h-8 rounded border border-current/30 bg-black/5 px-2">
          <Check className="h-3 w-3 shrink-0 opacity-60" />
          <span className="flex-1 min-w-0 truncate text-xs">
            <span className="font-mono font-semibold">{course.code}</span>
            <span className="opacity-70"> — {course.name}</span>
          </span>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); clear(); }}
            className="shrink-0 opacity-50 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
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
            filtered.map((c) => (
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
                <span className="shrink-0 text-[10px] text-muted-foreground/60">
                  {c.credits}cr
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
