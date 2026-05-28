"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Pencil, Check, X, Trash2, GraduationCap, Loader2, Plus, Lock, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PlanCourseCombobox } from "@/components/plan/course-combobox";
import { CareerAdvice } from "@/components/plan/career-advice";
import { StudentProfile } from "@/components/plan/student-profile";
import { OverflowWarning } from "@/components/plan/overflow-warning";
import { LumenFireflies } from "@/components/lumen-ambience";
import { generateAcademicPlan } from "@/lib/plan-generator";
import { MINIMUM_TOTAL_CREDITS, MINIMUM_CREDITS_OUTSIDE_MAJOR } from "@/lib/types";
import type { SemesterPlan, PlannedCourse, MathPlacement } from "@/lib/types";

function BearMark({ size = 26 }: { size?: number }) {
  const h = Math.round(size * 1.54)
  return (
    <svg width={size} height={h} viewBox="0 0 130 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="65" cy="145" rx="40" ry="48" fill="#5ba8c7" />
      <ellipse cx="65" cy="90"  rx="34" ry="32" fill="#5ba8c7" />
      <circle  cx="38" cy="65" r="13" fill="#5ba8c7" /><circle  cx="92" cy="65" r="13" fill="#5ba8c7" />
      <circle  cx="38" cy="65" r="7"  fill="#7dc1dd" /><circle  cx="92" cy="65" r="7"  fill="#7dc1dd" />
      <ellipse cx="65" cy="100" rx="18" ry="14" fill="#f0f8ff" opacity="0.7" />
      <circle  cx="55" cy="86" r="4" fill="#2a4a5a" /><circle  cx="75" cy="86" r="4" fill="#2a4a5a" />
      <ellipse cx="65" cy="104" rx="6" ry="4" fill="#2a4a5a" />
      <ellipse cx="28" cy="148" rx="13" ry="30" fill="#5ba8c7" transform="rotate(-15 28 148)" />
      <ellipse cx="102" cy="148" rx="13" ry="30" fill="#5ba8c7" transform="rotate(15 102 148)" />
      <ellipse cx="48" cy="187" rx="14" ry="12" fill="#4a95b5" /><ellipse cx="82" cy="187" rx="14" ry="12" fill="#4a95b5" />
      <rect x="24" y="158" width="20" height="24" rx="4" fill="#c97d1a" />
      <rect x="26" y="160" width="16" height="20" rx="3" fill="#f5a623" />
      <circle cx="34" cy="170" r="7" fill="#fff3c4" opacity="0.9" />
      <circle cx="34" cy="170" r="4" fill="#f5a623" opacity="0.6" />
    </svg>
  )
}

// ── Types ───────────────────────────────────────────────────────────────────

type MultiVariantSemesters = { A: SemesterPlan[]; B: SemesterPlan[]; C: SemesterPlan[] };

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
  semesters: SemesterPlan[] | MultiVariantSemesters;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isMultiVariantSemesters(s: SemesterPlan[] | MultiVariantSemesters): s is MultiVariantSemesters {
  return !Array.isArray(s) && "A" in s && "B" in s && "C" in s;
}

const CATEGORY_COLORS: Record<string, string> = {
  Major:    "bg-blue-50 border-blue-200 text-blue-800",
  Minor:    "bg-purple-50 border-purple-200 text-purple-800",
  GEM:      "bg-green-50 border-green-200 text-green-800",
  Elective: "bg-gray-50 border-gray-200 text-gray-700",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function CourseCard({
  course, editMode, onChange, onRemove,
}: {
  course: PlannedCourse;
  editMode: boolean;
  onChange: (c: PlannedCourse) => void;
  onRemove: () => void;
}) {
  const color = CATEGORY_COLORS[course.category] ?? CATEGORY_COLORS.Elective;

  if (!editMode) {
    return (
      <div className={`rounded-md border px-2.5 py-2 ${color}`}>
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-semibold text-xs shrink-0">
            {course.isPlaceholder ? (
              <span className="flex items-center gap-1">
                <span className="text-[10px] bg-black/10 px-1 py-0.5 rounded">TBD</span>
                <span className="text-xs">{course.placeholderCategory || "Elective"}</span>
              </span>
            ) : course.code}
          </span>
          <span className="shrink-0 text-[10px] opacity-60">{course.credits}cr</span>
        </div>
        {!course.isPlaceholder && (
          <p className="mt-0.5 text-xs leading-snug text-current/80">{course.name}</p>
        )}
        {course.fulfills.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {course.fulfills.slice(0, 2).map(f => (
              <span key={f} className="rounded bg-black/10 px-1 py-0.5 text-[10px] leading-tight">{f}</span>
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
  title, semester, editMode, onCourseChange, onAddCourse, onRemoveCourse,
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
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          {title}
          {isCompleted && <Lock className="h-3 w-3 text-muted-foreground" />}
        </h3>
        <span className="text-xs text-gray-500">{semester.totalCredits}cr</span>
      </div>
      <div className={`rounded-lg border p-2 space-y-1.5 ${isCompleted ? "bg-gray-50 border-dashed border-gray-200" : "bg-white border-gray-200"}`}>
        {isCompleted && (
          <p className="text-xs text-gray-400 italic px-1 pb-1 border-b border-gray-100">Completed semester</p>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SavedPlanPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [planName, setPlanName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "confirming" | "deleting">("idle");
  const [error, setError] = useState("");
  const [activeYear, setActiveYear] = useState(0);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{ unfulfilledRequirements: string[]; warnings: string[] } | null>(null);

  // Multi-variant support (new plans: semesters = { A, B, C })
  const [isMultiVariant, setIsMultiVariant] = useState(false);
  const [activeVariant, setActiveVariant] = useState<"A" | "B" | "C">("A");
  const [variantSemesters, setVariantSemesters] = useState<MultiVariantSemesters>({ A: [], B: [], C: [] });

  // Legacy single-variant (old plans: semesters = SemesterPlan[])
  const [singleSemesters, setSingleSemesters] = useState<SemesterPlan[]>([]);

  // Derived: what renders in the grid
  const currentSemesters: SemesterPlan[] = isMultiVariant
    ? (variantSemesters[activeVariant] ?? [])
    : singleSemesters;

  // ── Banner ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setShowSavedBanner(true);
      const t = setTimeout(() => setShowSavedBanner(false), 4000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  // ── Load plan ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data: SavedPlan) => {
        setPlan(data);
        setPlanName(data.name);
        if (isMultiVariantSemesters(data.semesters)) {
          setIsMultiVariant(true);
          setVariantSemesters(data.semesters);
        } else {
          setIsMultiVariant(false);
          setSingleSemesters(data.semesters as SemesterPlan[]);
        }
      })
      .catch(() => router.push("/profile"));
  }, [id, router]);

  // ── Requirements check (re-runs when plan loads or variant changes) ──────────
  useEffect(() => {
    if (!plan) return;
    const planType = isMultiVariant
      ? activeVariant
      : ((["A", "B", "C"].includes(plan.planType) ? plan.planType : "A") as "A" | "B" | "C");
    const gen = generateAcademicPlan(
      {
        majors:        plan.majors,
        minors:        plan.minors,
        interests:     plan.interests,
        hobbies:       [],
        careerGoals:   plan.careerGoals,
        mathPlacement: plan.mathPlacement as MathPlacement,
        waivedCourses: plan.waivedCourses,
      },
      { planType }
    );
    setGeneratedPlan({ unfulfilledRequirements: gen.unfulfilledRequirements, warnings: gen.warnings });
  }, [plan, isMultiVariant, activeVariant]);

  // ── Edit helpers ─────────────────────────────────────────────────────────────
  const updateCurrentSemesters = useCallback(
    (updater: (prev: SemesterPlan[]) => SemesterPlan[]) => {
      if (isMultiVariant) {
        setVariantSemesters(prev => ({
          ...prev,
          [activeVariant]: updater(prev[activeVariant] ?? []),
        }));
      } else {
        setSingleSemesters(prev => updater(prev));
      }
    },
    [isMultiVariant, activeVariant]
  );

  const updateCourse = useCallback((semIdx: number, courseIdx: number, updated: PlannedCourse) => {
    updateCurrentSemesters(prev =>
      prev.map((sem, si) => {
        if (si !== semIdx) return sem;
        const courses = sem.courses.map((c, ci) => ci === courseIdx ? updated : c);
        return { ...sem, courses, totalCredits: courses.reduce((s, c) => s + c.credits, 0) };
      })
    );
  }, [updateCurrentSemesters]);

  const addCourse = useCallback((semIdx: number) => {
    updateCurrentSemesters(prev =>
      prev.map((sem, si) => {
        if (si !== semIdx) return sem;
        const newCourse: PlannedCourse = { code: "NEW", name: "New Course", credits: 1, fulfills: [], category: "Elective" };
        const courses = [...sem.courses, newCourse];
        return { ...sem, courses, totalCredits: courses.reduce((s, c) => s + c.credits, 0) };
      })
    );
  }, [updateCurrentSemesters]);

  const removeCourse = useCallback((semIdx: number, courseIdx: number) => {
    updateCurrentSemesters(prev =>
      prev.map((sem, si) => {
        if (si !== semIdx) return sem;
        const courses = sem.courses.filter((_, ci) => ci !== courseIdx);
        return { ...sem, courses, totalCredits: courses.reduce((s, c) => s + c.credits, 0) };
      })
    );
  }, [updateCurrentSemesters]);

  // ── Save / delete ─────────────────────────────────────────────────────────────
  async function handleSaveChanges() {
    setSaveStatus("saving");
    setError("");
    const semestersPayload = isMultiVariant ? variantSemesters : singleSemesters;
    const res = await fetch(`/api/plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: planName, semesters: semestersPayload }),
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

  function handleCancelEdit() {
    if (plan) {
      if (isMultiVariantSemesters(plan.semesters)) {
        setVariantSemesters(plan.semesters);
      } else {
        setSingleSemesters(plan.semesters as SemesterPlan[]);
      }
    }
    setEditMode(false);
  }

  async function handleDelete() {
    if (deleteStatus === "idle") { setDeleteStatus("confirming"); return; }
    setDeleteStatus("deleting");
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    router.push("/profile");
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (currentSemesters.length === 0) return null;
    const majorPrefixList = (plan?.majors ?? []).map(code => code.split("_")[0]);
    const isInsideMajor = (courseCode: string) =>
      majorPrefixList.some(p => courseCode.startsWith(p + " ") || courseCode === p);
    const totalCredits        = currentSemesters.reduce((s, sem) => s + sem.totalCredits, 0);
    const totalCourses        = currentSemesters.reduce((s, sem) => s + sem.courses.length, 0);
    const majorCourses        = currentSemesters.reduce((s, sem) => s + sem.courses.filter(c => isInsideMajor(c.code)).length, 0);
    const creditsOutsideMajor = currentSemesters.reduce((s, sem) =>
      s + sem.courses.filter(c => !isInsideMajor(c.code)).reduce((a, c) => a + c.credits, 0), 0);
    const placeholderCourses  = currentSemesters.reduce((s, sem) => s + sem.courses.filter(c => c.isPlaceholder).length, 0);
    const overloadedSemesters = currentSemesters.filter(s => s.isOverloaded).length;
    return { totalCredits, totalCourses, majorCourses, creditsOutsideMajor, placeholderCourses, overloadedSemesters };
  }, [currentSemesters, plan]);

  const years = plan ? [
    { label: "Year 1", fallTitle: "Fall", springTitle: "Spring", fallIdx: 0, springIdx: 1 },
    { label: "Year 2", fallTitle: "Fall", springTitle: "Spring", fallIdx: 2, springIdx: 3 },
    { label: "Year 3", fallTitle: "Fall", springTitle: "Spring", fallIdx: 4, springIdx: 5 },
    { label: "Year 4", fallTitle: "Fall", springTitle: "Spring", fallIdx: 6, springIdx: 7 },
  ] : [];

  // ── Loading state ──────────────────────────────────────────────────────────────
  if (!plan) {
    return (
      <div className="lumen-app-shell flex min-h-screen items-center justify-center">
        <LumenFireflies className="fixed opacity-80" />
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="lumen-app-shell">
      <LumenFireflies className="fixed opacity-85" />

      {/* ── Header ── */}
      <header className="lumen-app-content border-b border-white/15 bg-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2" style={{ color: "#f5a623" }}>
              <BearMark size={24} />
              <span className="text-base font-bold tracking-wide hidden sm:inline" style={{ fontFamily: "var(--font-cinzel)" }}>Lumen</span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-1.5">
              {editMode ? (
                <>
                  <Button size="sm" onClick={handleSaveChanges} disabled={saveStatus === "saving"} className="gap-1.5 min-h-[36px]">
                    {saveStatus === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : saveStatus === "saved" ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    <span className="hidden sm:inline">{saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save"}</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit} className="min-h-[36px]">
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
                className="gap-1 min-h-[36px]"
              >
                {deleteStatus === "deleting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="hidden sm:inline">
                  {deleteStatus === "confirming" ? "Confirm" : deleteStatus === "deleting" ? "Deleting…" : "Delete"}
                </span>
              </Button>
              <div className="mx-0.5 h-5 w-px bg-white/20 hidden sm:block" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="gap-1 min-h-[36px] text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="lumen-app-content container mx-auto px-4 py-4 sm:py-6">

        {/* ── "Plan saved" banner ── */}
        {showSavedBanner && (
          <div
            className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium"
            style={{ borderColor: "rgba(111,207,151,0.4)", background: "rgba(111,207,151,0.12)", color: "#6fcf97" }}
          >
            <Check className="h-4 w-4 shrink-0" />
            Your plan has been saved! Scroll down to see your AI-powered career recommendations.
          </div>
        )}

        <Link href="/profile" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>

        {/* Plan title + meta */}
        <div className="mb-4">
          {editingName ? (
            <input
              className="w-full bg-transparent border-b-2 border-primary text-lg font-bold focus:outline-none sm:text-xl"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === "Enter" && setEditingName(false)}
              autoFocus
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="group flex items-center gap-2 text-left w-full">
              <h1 className="text-lg font-bold text-foreground sm:text-xl">{planName}</h1>
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
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

        {/* ── Plan A / B / C variant switcher (multi-variant plans only) ── */}
        {isMultiVariant && (
          <div className="mb-5 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              Plan
            </span>
            <div className="flex gap-2">
              {(["A", "B", "C"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setActiveVariant(v)}
                  className="flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-bold transition-all"
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    background: activeVariant === v ? "#f5a623" : "rgba(245,166,35,0.10)",
                    color:      activeVariant === v ? "#071410" : "#f5a623",
                    border:     activeVariant === v ? "none" : "1px solid rgba(245,166,35,0.30)",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            
          </div>
        )}

        {/* Student profile summary */}
        <StudentProfile profile={{
          majors:      plan.majors,
          minors:      plan.minors,
          interests:   plan.interests,
          careerGoals: plan.careerGoals,
        }} />

        {/* ── Plan grid — white panel ── */}
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 sm:p-4 md:p-6">

          {/* Mobile: year tabs */}
          <div className="md:hidden">
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
              {years.map(({ label }, i) => (
                <button
                  key={label}
                  onClick={() => setActiveYear(i)}
                  className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    borderColor: activeYear === i ? "rgba(245,166,35,0.6)" : "rgba(0,0,0,0.12)",
                    background:  activeYear === i ? "rgba(245,166,35,0.12)" : "transparent",
                    color:       activeYear === i ? "#b87a00" : "#6b7280",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {years[activeYear] && currentSemesters[years[activeYear].fallIdx] && currentSemesters[years[activeYear].springIdx] && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <SemesterColumn
                  title={years[activeYear].fallTitle}
                  semester={currentSemesters[years[activeYear].fallIdx]}
                  editMode={editMode}
                  onCourseChange={(ci, c) => updateCourse(years[activeYear].fallIdx, ci, c)}
                  onAddCourse={() => addCourse(years[activeYear].fallIdx)}
                  onRemoveCourse={ci => removeCourse(years[activeYear].fallIdx, ci)}
                />
                <SemesterColumn
                  title={years[activeYear].springTitle}
                  semester={currentSemesters[years[activeYear].springIdx]}
                  editMode={editMode}
                  onCourseChange={(ci, c) => updateCourse(years[activeYear].springIdx, ci, c)}
                  onAddCourse={() => addCourse(years[activeYear].springIdx)}
                  onRemoveCourse={ci => removeCourse(years[activeYear].springIdx, ci)}
                />
              </div>
            )}
          </div>

          {/* Desktop: all 4 years */}
          <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {years.map(({ label, fallTitle, springTitle, fallIdx, springIdx }) =>
              currentSemesters[fallIdx] && currentSemesters[springIdx] ? (
                <div key={label} className="space-y-4">
                  <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <GraduationCap className="h-3 w-3 text-primary" />
                    {label}
                  </h2>
                  <SemesterColumn
                    title={fallTitle}
                    semester={currentSemesters[fallIdx]}
                    editMode={editMode}
                    onCourseChange={(ci, c) => updateCourse(fallIdx, ci, c)}
                    onAddCourse={() => addCourse(fallIdx)}
                    onRemoveCourse={ci => removeCourse(fallIdx, ci)}
                  />
                  <SemesterColumn
                    title={springTitle}
                    semester={currentSemesters[springIdx]}
                    editMode={editMode}
                    onCourseChange={(ci, c) => updateCourse(springIdx, ci, c)}
                    onAddCourse={() => addCourse(springIdx)}
                    onRemoveCourse={ci => removeCourse(springIdx, ci)}
                  />
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* ── Plan Analysis ── */}
        {stats && (
          <>
            {/* 6-stat strip */}
            <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl p-5 sm:grid-cols-6"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {([
                { v: stats.totalCredits,        l: "Credits",       ok: stats.totalCredits >= MINIMUM_TOTAL_CREDITS },
                { v: stats.totalCourses,        l: "Courses" },
                { v: stats.majorCourses,        l: "Major" },
                { v: stats.creditsOutsideMajor, l: "Outside Major", ok: stats.creditsOutsideMajor >= MINIMUM_CREDITS_OUTSIDE_MAJOR },
                { v: stats.placeholderCourses,  l: "TBD",           warn: stats.placeholderCourses > 0 },
                { v: stats.overloadedSemesters, l: "Overloaded",    warn: stats.overloadedSemesters > 0 },
              ] as { v: number; l: string; ok?: boolean; warn?: boolean }[]).map(({ v, l, ok, warn }) => (
                <div key={l} className="text-center">
                  <p className="text-2xl font-black" style={{
                    fontFamily: "var(--font-cinzel)",
                    color: warn ? "#f5a623" : ok === true ? "#6fcf97" : ok === false ? "#f5a623" : "#5ba8c7",
                  }}>{v}</p>
                  <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{l}</p>
                </div>
              ))}
            </div>

            {/* Requirements check cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label:  "Credit Requirement",
                  met:    stats.totalCredits >= MINIMUM_TOTAL_CREDITS,
                  detail: `${stats.totalCredits} / ${MINIMUM_TOTAL_CREDITS} credits`,
                },
                {
                  label:  "Outside-Major Credits",
                  met:    stats.creditsOutsideMajor >= MINIMUM_CREDITS_OUTSIDE_MAJOR,
                  detail: `${stats.creditsOutsideMajor} / ${MINIMUM_CREDITS_OUTSIDE_MAJOR} required`,
                },
                {
                  label:  "Major Requirements",
                  met:    (generatedPlan?.unfulfilledRequirements.length ?? 1) === 0,
                  detail: generatedPlan
                    ? generatedPlan.unfulfilledRequirements.length === 0
                      ? "All requirements covered"
                      : `${generatedPlan.unfulfilledRequirements.length} unfulfilled`
                    : "Checking…",
                },
              ].map(({ label, met, detail }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl p-4"
                  style={{
                    background: met ? "rgba(111,207,151,0.08)" : "rgba(245,166,35,0.08)",
                    border: `1px solid ${met ? "rgba(111,207,151,0.2)" : "rgba(245,166,35,0.2)"}`,
                  }}>
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: met ? "rgba(111,207,151,0.2)" : "rgba(245,166,35,0.2)",
                      color: met ? "#6fcf97" : "#f5a623",
                    }}>
                    {met ? "✓" : "!"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: met ? "#6fcf97" : "#f5a623" }}>{label}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Unfulfilled requirements */}
            {generatedPlan && (generatedPlan.unfulfilledRequirements.length > 0 || generatedPlan.warnings.length > 0) && (
              <div className="mt-4">
                <OverflowWarning
                  courses={generatedPlan.unfulfilledRequirements.map((req, i) => ({ code: `REQ ${i + 1}`, name: req, credits: 1 }))}
                  warnings={generatedPlan.warnings}
                />
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              {[
                { label: "Major",    color: "#5ba8c7" },
                { label: "Minor",    color: "#b07fe8" },
                { label: "GEM",      color: "#6fcf97" },
                { label: "Elective", color: "#f5a623" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── AI Career Recommendations ── */}
        {plan.careerGoals.length > 0 && (
          <div className="mt-8">
            <CareerAdvice
              careerGoals={plan.careerGoals}
              majors={plan.majors}
              interests={plan.interests}
              courses={currentSemesters
                .flatMap(sem => sem.courses)
                .filter(c => !c.isPlaceholder)
                .map(c => ({ code: c.code, name: c.name }))}
            />
          </div>
        )}
      </main>
    </div>
  );
}
