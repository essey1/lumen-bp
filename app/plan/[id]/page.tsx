"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, Save, Pencil, Check, X, Trash2, GraduationCap, Loader2, Plus, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanCourseCombobox } from "@/components/plan/course-combobox";
import { LumenFireflies } from "@/components/lumen-ambience";
import type { SemesterPlan, PlannedCourse } from "@/lib/types";

interface SavedPlan {
  id: string;
  name: string;
  majors: string[];
  minors: string[];
  interests: string[];
  careerGoals: string[];
  mathPlacement: string;
  waivedCourses: string[];
  planType: string;
  semesters: SemesterPlan[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Major:   "bg-blue-50 border-blue-200 text-blue-800",
  Minor:   "bg-purple-50 border-purple-200 text-purple-800",
  GEM:     "bg-green-50 border-green-200 text-green-800",
  Elective:"bg-gray-50 border-gray-200 text-gray-700",
};

function CourseCard({
  course,
  editMode,
  onChange,
  onRemove,
}: {
  course: PlannedCourse;
  editMode: boolean;
  onChange: (c: PlannedCourse) => void;
  onRemove: () => void;
}) {
  const color = CATEGORY_COLORS[course.category] ?? CATEGORY_COLORS.Elective;

  if (!editMode) {
    return (
      <div className={`rounded-md border px-2.5 py-2 text-xs ${color}`}>
        <div className="flex items-start gap-1.5">
          <span className="font-mono font-semibold shrink-0">{course.isPlaceholder ? "TBD" : course.code}</span>
          <span className="flex-1 leading-tight">{course.name}</span>
          <span className="shrink-0 text-[10px] opacity-60">{course.credits}cr</span>
        </div>
        {course.fulfills.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {course.fulfills.slice(0, 2).map(f => (
              <span key={f} className="rounded bg-black/5 px-1 py-0.5 text-[10px]">{f}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-md border px-2 py-1.5 text-xs ${color}`}>
      <div className="flex items-center gap-1.5">
        <PlanCourseCombobox course={course} onChange={onChange} />
        <select
          className="shrink-0 rounded border border-current/30 bg-transparent text-xs px-1 py-0.5 focus:outline-none cursor-pointer"
          value={course.category}
          onChange={e => onChange({ ...course, category: e.target.value as PlannedCourse["category"] })}
        >
          <option value="Major">Major</option>
          <option value="Minor">Minor</option>
          <option value="GEM">GEM</option>
          <option value="Elective">Elective</option>
        </select>
        <button type="button" onClick={onRemove} className="shrink-0 opacity-50 hover:opacity-100 hover:text-red-600 transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function SemesterColumn({
  title,
  semester,
  editMode,
  onCourseChange,
  onAddCourse,
  onRemoveCourse,
}: {
  title: string;
  semester: SemesterPlan;
  editMode: boolean;
  onCourseChange: (idx: number, c: PlannedCourse) => void;
  onAddCourse: () => void;
  onRemoveCourse: (idx: number) => void;
}) {
  const isCompleted = semester.isCompleted;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          {title}
          {isCompleted && <Lock className="h-3 w-3 text-muted-foreground" />}
        </h3>
        <span className="text-xs text-muted-foreground">{semester.totalCredits}cr</span>
      </div>
      <div className={`rounded-lg border p-2 space-y-1.5 ${isCompleted ? "bg-muted/30 border-dashed" : "bg-card border-border"}`}>
        {isCompleted && (
          <p className="text-[10px] text-muted-foreground italic px-1 pb-1 border-b border-border">Completed semester</p>
        )}
        {semester.courses.map((course, idx) => (
          <CourseCard
            key={`${course.code}-${idx}`}
            course={course}
            editMode={editMode && !isCompleted}
            onChange={updated => onCourseChange(idx, updated)}
            onRemove={() => onRemoveCourse(idx)}
          />
        ))}
        {editMode && !isCompleted && (
          <button
            type="button"
            onClick={onAddCourse}
            className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Plus className="h-3 w-3" /> Add course
          </button>
        )}
      </div>
    </div>
  );
}

export default function SavedPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [semesters, setSemesters] = useState<SemesterPlan[]>([]);
  const [planName, setPlanName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "confirming" | "deleting">("idle");
  const [error, setError] = useState("");
  const [activeYear, setActiveYear] = useState(0); // mobile tab index

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data: SavedPlan) => {
        setPlan(data);
        setSemesters(data.semesters);
        setPlanName(data.name);
      })
      .catch(() => router.push("/profile"));
  }, [id, router]);

  const updateCourse = useCallback((semIdx: number, courseIdx: number, updated: PlannedCourse) => {
    setSemesters(prev =>
      prev.map((sem, si) => {
        if (si !== semIdx) return sem;
        const courses = sem.courses.map((c, ci) => ci === courseIdx ? updated : c);
        return { ...sem, courses, totalCredits: courses.reduce((s, c) => s + c.credits, 0) };
      })
    );
  }, []);

  const addCourse = useCallback((semIdx: number) => {
    setSemesters(prev =>
      prev.map((sem, si) => {
        if (si !== semIdx) return sem;
        const newCourse: PlannedCourse = { code: "NEW", name: "New Course", credits: 1, fulfills: [], category: "Elective" };
        const courses = [...sem.courses, newCourse];
        return { ...sem, courses, totalCredits: courses.reduce((s, c) => s + c.credits, 0) };
      })
    );
  }, []);

  const removeCourse = useCallback((semIdx: number, courseIdx: number) => {
    setSemesters(prev =>
      prev.map((sem, si) => {
        if (si !== semIdx) return sem;
        const courses = sem.courses.filter((_, ci) => ci !== courseIdx);
        return { ...sem, courses, totalCredits: courses.reduce((s, c) => s + c.credits, 0) };
      })
    );
  }, []);

  async function handleSaveChanges() {
    setSaveStatus("saving");
    setError("");

    const res = await fetch(`/api/plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: planName, semesters }),
    });

    if (res.ok) {
      setSaveStatus("saved");
      setEditMode(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setError("Failed to save changes.");
      setSaveStatus("idle");
    }
  }

  async function handleDelete() {
    if (deleteStatus === "idle") { setDeleteStatus("confirming"); return; }
    setDeleteStatus("deleting");
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    router.push("/profile");
  }

  const years = plan
    ? [
        { label: "Year 1", fallTitle: "Fall – Year 1", springTitle: "Spring – Year 1", fallIdx: 0, springIdx: 1 },
        { label: "Year 2", fallTitle: "Fall – Year 2", springTitle: "Spring – Year 2", fallIdx: 2, springIdx: 3 },
        { label: "Year 3", fallTitle: "Fall – Year 3", springTitle: "Spring – Year 3", fallIdx: 4, springIdx: 5 },
        { label: "Year 4", fallTitle: "Fall – Year 4", springTitle: "Spring – Year 4", fallIdx: 6, springIdx: 7 },
      ]
    : [];

  if (!plan) {
    return (
      <div className="lumen-app-shell flex min-h-screen items-center justify-center">
        <LumenFireflies className="fixed opacity-80" />
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="lumen-app-shell">
      <LumenFireflies className="fixed opacity-85" />

      {/* ── Header ── */}
      <header className="lumen-app-content border-b border-white/15 bg-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          {/* Top row: logo + actions */}
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground hidden sm:inline">Lumen</span>
            </Link>

            {/* Action buttons — icon-only on mobile, labelled on sm+ */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {editMode ? (
                <>
                  <Button size="sm" onClick={handleSaveChanges} disabled={saveStatus === "saving"} className="gap-1.5 min-h-[36px]">
                    {saveStatus === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : saveStatus === "saved" ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    <span className="hidden sm:inline">{saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save"}</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSemesters(plan.semesters); setEditMode(false); }} className="min-h-[36px]">
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Cancel</span>
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-1.5 min-h-[36px]">
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              <Button
                size="sm"
                variant={deleteStatus === "confirming" ? "destructive" : "ghost"}
                onClick={handleDelete}
                disabled={deleteStatus === "deleting"}
                className="gap-1.5 min-h-[36px]"
              >
                {deleteStatus === "deleting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="hidden sm:inline">
                  {deleteStatus === "confirming" ? "Confirm" : deleteStatus === "deleting" ? "Deleting…" : "Delete"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="lumen-app-content container mx-auto px-4 py-6">
        <Link href="/profile" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Plan title + meta */}
        <div className="mb-5">
          {editingName ? (
            <input
              className="w-full bg-transparent border-b-2 border-primary text-xl font-bold focus:outline-none sm:text-2xl"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === "Enter" && setEditingName(false)}
              autoFocus
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="group flex items-center gap-2 text-left w-full">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">{planName}</h1>
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm line-clamp-2">
            {plan.majors.join(", ")}
            {plan.minors.length > 0 && ` · Minor: ${plan.minors.join(", ")}`}
            {" · "}Updated {new Date(plan.updatedAt).toLocaleDateString()}
          </p>
          {editMode && (
            <p className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 sm:text-sm">
              Edit mode: tap a course to change it. Use + to add, trash to remove. Locked semesters are completed.
            </p>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        {/* ── Mobile: year tabs + semester pair ── */}
        <div className="md:hidden">
          {/* Year tab strip */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {years.map(({ label }, i) => (
              <button
                key={label}
                onClick={() => setActiveYear(i)}
                className="shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition-all"
                style={{
                  borderColor: activeYear === i ? "rgba(245,166,35,0.5)" : "rgba(255,255,255,0.10)",
                  background:  activeYear === i ? "rgba(245,166,35,0.10)" : "transparent",
                  color:       activeYear === i ? "#f5a623" : "#7aada0",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Active year semesters side-by-side */}
          {years[activeYear] && semesters[years[activeYear].fallIdx] && semesters[years[activeYear].springIdx] && (
            <div className="grid grid-cols-2 gap-3">
              <SemesterColumn
                title={years[activeYear].fallTitle.replace(" – ", "\n")}
                semester={semesters[years[activeYear].fallIdx]}
                editMode={editMode}
                onCourseChange={(ci, c) => updateCourse(years[activeYear].fallIdx, ci, c)}
                onAddCourse={() => addCourse(years[activeYear].fallIdx)}
                onRemoveCourse={ci => removeCourse(years[activeYear].fallIdx, ci)}
              />
              <SemesterColumn
                title={years[activeYear].springTitle.replace(" – ", "\n")}
                semester={semesters[years[activeYear].springIdx]}
                editMode={editMode}
                onCourseChange={(ci, c) => updateCourse(years[activeYear].springIdx, ci, c)}
                onAddCourse={() => addCourse(years[activeYear].springIdx)}
                onRemoveCourse={ci => removeCourse(years[activeYear].springIdx, ci)}
              />
            </div>
          )}
        </div>

        {/* ── Desktop: all 4 years in a grid ── */}
        <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {years.map(({ label, fallTitle, springTitle, fallIdx, springIdx }) =>
            semesters[fallIdx] && semesters[springIdx] ? (
              <div key={label} className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {label}
                </h2>
                <SemesterColumn
                  title={fallTitle}
                  semester={semesters[fallIdx]}
                  editMode={editMode}
                  onCourseChange={(ci, c) => updateCourse(fallIdx, ci, c)}
                  onAddCourse={() => addCourse(fallIdx)}
                  onRemoveCourse={ci => removeCourse(fallIdx, ci)}
                />
                <SemesterColumn
                  title={springTitle}
                  semester={semesters[springIdx]}
                  editMode={editMode}
                  onCourseChange={(ci, c) => updateCourse(springIdx, ci, c)}
                  onAddCourse={() => addCourse(springIdx)}
                  onRemoveCourse={ci => removeCourse(springIdx, ci)}
                />
              </div>
            ) : null
          )}
        </div>

        <Card className="lumen-surface mt-8">
          <CardContent className="py-6">
            <div className="grid gap-6 text-center md:grid-cols-3">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {semesters.reduce((s, sem) => s + sem.totalCredits, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">
                  {semesters.reduce((s, sem) => s + sem.courses.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">
                  {semesters.reduce((s, sem) => s + sem.courses.filter(c => c.category === "Major").length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Major Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
