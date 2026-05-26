"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Pencil, X, Plus, Trash2, Check, Lock, Sparkles, User, Save } from "lucide-react"
import { ForestNav } from "@/components/forest-nav"
import { LumenFireflies } from "@/components/lumen-ambience"
import { StudentProfile } from "@/components/plan/student-profile"
import { OverflowWarning } from "@/components/plan/overflow-warning"
import { CareerAdvice } from "@/components/plan/career-advice"
import { ExportButton } from "@/components/plan/export-button"
import { PlanCourseCombobox } from "@/components/plan/course-combobox"
import { generateAcademicPlan, getPlanStats, type CompletedSemesterInput } from "@/lib/plan-generator"
import type { CustomCourseEntry, StudentProfile as StudentProfileType, SemesterPlan, PlannedCourse } from "@/lib/types"
import { MINIMUM_TOTAL_CREDITS, MINIMUM_CREDITS_OUTSIDE_MAJOR } from "@/lib/types"
import type { MathPlacement } from "@/lib/types"

// ── Category colors (light, for white grid background) ───────────────────────
const CAT_CLS: Record<string, string> = {
  Major:    "bg-blue-50 border-blue-200 text-blue-800",
  Minor:    "bg-purple-50 border-purple-200 text-purple-800",
  GEM:      "bg-green-50 border-green-200 text-green-800",
  Elective: "bg-amber-50 border-amber-200 text-amber-800",
}
const getCatCls = (cat: string) => CAT_CLS[cat] ?? CAT_CLS.Elective

// Keep CAT for the legend dots only
const CAT_DOT: Record<string, string> = {
  Major:    "#5ba8c7",
  Minor:    "#b07fe8",
  GEM:      "#6fcf97",
  Elective: "#f5a623",
}

// ── Single course row ─────────────────────────────────────────────────────────
function EditableCourseRow({
  course, editMode, onChange, onRemove,
}: {
  course: PlannedCourse; editMode: boolean
  onChange: (c: PlannedCourse) => void; onRemove: () => void
}) {
  const cls = getCatCls(course.category)

  if (!editMode) {
    return (
      <div className={`rounded-md border px-2.5 py-2 text-xs ${cls}`}>
        <div className="flex items-start gap-1.5">
          <span className="font-mono font-semibold shrink-0">{course.isPlaceholder ? "TBD" : course.code}</span>
          <span className="flex-1 min-w-0 leading-tight break-words">{course.name}</span>
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
    )
  }

  return (
    <div className={`rounded-md border px-2 py-1.5 text-xs ${cls}`}>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 min-w-0">
          <PlanCourseCombobox course={course} onChange={onChange} />
        </div>
        <button type="button" onClick={onRemove}
          className="shrink-0 rounded p-1 transition-colors hover:bg-red-100 text-current opacity-50 hover:opacity-100 hover:text-red-600">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// ── Semester card ─────────────────────────────────────────────────────────────
function EditableSemesterCard({
  title, semester, editMode, onCourseChange, onAddCourse, onRemoveCourse,
}: {
  title: string; semester: SemesterPlan; editMode: boolean
  onCourseChange: (idx: number, c: PlannedCourse) => void
  onAddCourse: () => void; onRemoveCourse: (idx: number) => void
}) {
  const isFall   = title.toLowerCase().includes("fall")
  const isDone   = semester.isCompleted
  const termLabel = isFall ? "Fall" : "Spring"

  return (
    <div className="flex flex-col gap-1">
      {/* Semester header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-wide" style={{ color: isFall ? "#b87a00" : "#1a7a52", fontFamily: "var(--font-cinzel)" }}>
            {termLabel}
          </span>
          {isDone && <Lock className="h-3 w-3 text-gray-400" />}
        </div>
        <span className="text-[11px] font-mono font-semibold text-gray-400">
          {semester.totalCredits}cr
        </span>
      </div>

      {/* Course list */}
      <div className={`flex flex-col gap-1.5 rounded-xl p-2 ${isDone ? "bg-gray-50 border border-dashed border-gray-200" : "bg-white border border-gray-200"}`}>
        {isDone && (
          <p className="text-[10px] italic px-1 pb-1 mb-0.5 text-gray-400 border-b border-gray-100">
            Completed semester
          </p>
        )}
        {semester.courses.map((c, i) => (
          <EditableCourseRow
            key={`${c.code}-${i}`} course={c}
            editMode={editMode && !isDone}
            onChange={u => onCourseChange(i, u)}
            onRemove={() => onRemoveCourse(i)}
          />
        ))}
        {editMode && !isDone && (
          <button type="button" onClick={onAddCourse}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-1.5 text-[11px] text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600">
            <Plus className="h-3 w-3" /> Add course
          </button>
        )}
      </div>
    </div>
  )
}

// ── Full plan view ────────────────────────────────────────────────────────────
function PlanView({ initialPlan, profile }: {
  initialPlan: ReturnType<typeof generateAcademicPlan>
  profile: StudentProfileType
}) {
  const [semesters, setSemesters] = useState<SemesterPlan[]>(initialPlan.semesters)
  const [editMode, setEditMode] = useState(false)
  const stats = getPlanStats({ ...initialPlan, semesters })

  const YEARS = [
    { label: "Year 1", num: "I",   fallIdx: 0, springIdx: 1 },
    { label: "Year 2", num: "II",  fallIdx: 2, springIdx: 3 },
    { label: "Year 3", num: "III", fallIdx: 4, springIdx: 5 },
    { label: "Year 4", num: "IV",  fallIdx: 6, springIdx: 7 },
  ]

  const updateCourse = useCallback((si: number, ci: number, u: PlannedCourse) => {
    setSemesters(prev => prev.map((s, i) => i !== si ? s : {
      ...s,
      courses: s.courses.map((c, j) => j === ci ? u : c),
      totalCredits: s.courses.map((c, j) => j === ci ? u : c).reduce((a, c) => a + c.credits, 0),
    }))
  }, [])

  const addCourse = useCallback((si: number) => {
    setSemesters(prev => prev.map((s, i) => {
      if (i !== si) return s
      const courses = [...s.courses, { code: "NEW", name: "New Course", credits: 1, fulfills: [], category: "Elective" } as PlannedCourse]
      return { ...s, courses, totalCredits: courses.reduce((a, c) => a + c.credits, 0) }
    }))
  }, [])

  const removeCourse = useCallback((si: number, ci: number) => {
    setSemesters(prev => prev.map((s, i) => {
      if (i !== si) return s
      const courses = s.courses.filter((_, j) => j !== ci)
      return { ...s, courses, totalCredits: courses.reduce((a, c) => a + c.credits, 0) }
    }))
  }, [])

  const unfulfilledCourses = initialPlan.unfulfilledRequirements.map((req, i) => ({ code: `REQ ${i + 1}`, name: req, credits: 1 }))

  return (
    <div>
      {/* Edit controls */}
      <div className="mb-4 flex justify-end gap-2">
        {editMode ? (
          <>
            <span className="flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
              Editing — click any course to change it
            </span>
            <button onClick={() => setEditMode(false)}
              className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100">
              <Check className="h-3.5 w-3.5" /> Done
            </button>
            <button onClick={() => { setSemesters(initialPlan.semesters); setEditMode(false) }}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition hover:bg-gray-50">
              <X className="h-3 w-3" /> Reset
            </button>
          </>
        ) : (
          <button onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
            <Pencil className="h-3.5 w-3.5" /> Edit Plan
          </button>
        )}
      </div>

      {/* Year columns — white panel */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {YEARS.map(({ label, num, fallIdx, springIdx }) => (
          <div key={label} className="flex flex-col gap-4">
            {/* Year header */}
            <div className="flex items-baseline gap-2 border-b border-gray-200 pb-2">
              <span className="text-2xl font-black" style={{ fontFamily: "var(--font-cinzel)", color: "#b87a00" }}>
                {num}
              </span>
              <span className="text-sm font-semibold text-gray-500" style={{ fontFamily: "var(--font-cinzel)" }}>
                {label}
              </span>
            </div>

            {/* Fall */}
            <EditableSemesterCard
              title={`Fall – ${label}`} semester={semesters[fallIdx]}
              editMode={editMode}
              onCourseChange={(ci, c) => updateCourse(fallIdx, ci, c)}
              onAddCourse={() => addCourse(fallIdx)}
              onRemoveCourse={ci => removeCourse(fallIdx, ci)}
            />
            {/* Spring */}
            <EditableSemesterCard
              title={`Spring – ${label}`} semester={semesters[springIdx]}
              editMode={editMode}
              onCourseChange={(ci, c) => updateCourse(springIdx, ci, c)}
              onAddCourse={() => addCourse(springIdx)}
              onRemoveCourse={ci => removeCourse(springIdx, ci)}
            />
          </div>
        ))}
      </div>
      </div>{/* end white panel */}

      {/* Overflow warning */}
      {(initialPlan.warnings.length > 0 || unfulfilledCourses.length > 0) && (
        <div className="mt-8">
          <OverflowWarning courses={unfulfilledCourses} warnings={initialPlan.warnings} />
        </div>
      )}

      {/* Stats strip */}
      <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl p-5 md:grid-cols-6"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {[
          { v: stats.totalCredits,         l: "Credits"       },
          { v: stats.totalCourses,         l: "Courses"       },
          { v: stats.majorCourses,         l: "Major"         },
          { v: stats.creditsOutsideMajor,  l: "Outside Major" },
          { v: stats.placeholderCourses,   l: "TBD"           },
          { v: stats.overloadedSemesters,  l: "Overloaded", warn: stats.overloadedSemesters > 0 },
        ].map(({ v, l, warn }) => (
          <div key={l} className="text-center">
            <p className="text-2xl font-black" style={{ fontFamily: "var(--font-cinzel)", color: warn ? "#f5a623" : "#5ba8c7" }}>{v}</p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        {Object.entries(CAT_DOT).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{cat}</span>
          </div>
        ))}
      </div>

      {/* Career advice */}
      <div className="mt-10">
        <CareerAdvice
          careerGoals={profile.careerGoals} majors={profile.majors}
          courses={semesters.flatMap(s => s.courses.map(c => ({ code: c.code, name: c.name })))}
          interests={profile.interests}
        />
      </div>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────────────
function PlanPageInner() {
  const searchParams = useSearchParams()
  // saved=1 is set when arriving from the planner after successfully saving all 3 plans
  const wasSaved = searchParams.get("saved") === "1"
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<StudentProfileType | null>(null)
  const [plans, setPlans] = useState<{
    A: ReturnType<typeof generateAcademicPlan>
    B: ReturnType<typeof generateAcademicPlan>
    C: ReturnType<typeof generateAcademicPlan>
  } | null>(null)

  useEffect(() => {
    const p: StudentProfileType = {
      majors:        searchParams.get("majors")?.split(",")               ?? ["CSC"],
      minors:        searchParams.get("minors")?.split(",").filter(Boolean) ?? [],
      interests:     searchParams.get("interests")?.split(",")            ?? ["Technology"],
      hobbies:       [],
      careerGoals:   searchParams.get("careerGoals")?.split(",")          ?? ["Software Engineer"],
      mathPlacement: (searchParams.get("mathPlacement") ?? "none") as MathPlacement,
      waivedCourses: searchParams.get("waivedCourses")?.split(",").filter(Boolean) ?? [],
    }
    let completedSemesters: CompletedSemesterInput[] = []
    try {
      const s = sessionStorage.getItem("completedSemesters")
      if (s) completedSemesters = JSON.parse(s)
    } catch { /* ignore */ }

    let customCourses: CustomCourseEntry[] = []
    try {
      const c = sessionStorage.getItem("customCourses")
      if (c) customCourses = JSON.parse(c)
    } catch { /* ignore */ }

    setProfile(p)
    setPlans({
      A: generateAcademicPlan(p, { planType: "A", completedSemesters, customCourses }),
      B: generateAcademicPlan(p, { planType: "B", completedSemesters, customCourses }),
      C: generateAcademicPlan(p, { planType: "C", completedSemesters, customCourses }),
    })
    setReady(true)
  }, [searchParams])

  if (!ready || !profile || !plans) {
    return (
      <div className="lumen-app-shell flex min-h-screen items-center justify-center">
        <LumenFireflies className="fixed opacity-80" />
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "rgba(245,166,35,0.3)", borderTopColor: "#f5a623" }} />
          <p className="text-sm" style={{ color: "#7aada0", fontStyle: "italic" }}>Charting your path…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lumen-app-shell" style={{
        fontFamily: "var(--font-lora),Georgia,serif",
        background: [
          "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(245,166,35,0.18) 0%, transparent 65%)",
          "radial-gradient(ellipse 50% 40% at 15% 50%, rgba(245,166,35,0.07) 0%, transparent 60%)",
          "radial-gradient(ellipse 50% 40% at 85% 50%, rgba(245,166,35,0.07) 0%, transparent 60%)",
          "linear-gradient(180deg,#122418 0%,#1a3020 40%,#203828 75%,#274030 100%)",
        ].join(","),
      }}>
      <LumenFireflies className="fixed opacity-85" />
      <ForestNav actions={
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/profile" className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#c8e0d8] transition hover:border-white/30">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
          <Link href="/planner" className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#7aada0] transition hover:border-white/30 hover:text-[#c8e0d8]">
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Preferences</span>
          </Link>
          <ExportButton />
        </div>
      } />

      <main className="lumen-app-content mx-auto max-w-[1400px] px-4 py-8 pt-24">

        {/* Page title */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-black tracking-tight md:text-4xl" style={{ fontFamily: "var(--font-cinzel)", color: "#f0ede0" }}>
            Your Academic Journey
          </h1>
          <p className="text-sm italic" style={{ color: "#9abfb8" }}>
            Compare all three variants · min {MINIMUM_TOTAL_CREDITS} credits · {MINIMUM_CREDITS_OUTSIDE_MAJOR} outside your major
          </p>
        </div>

        <StudentProfile profile={{ majors: profile.majors, minors: profile.minors, interests: profile.interests, careerGoals: profile.careerGoals }} />

        {/* Saved banner — shown when arriving from the planner after a successful save */}
        {wasSaved && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl p-5"
            style={{ background: "rgba(111,207,151,0.10)", border: "1px solid rgba(111,207,151,0.25)" }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(111,207,151,0.20)" }}>
              <Save className="h-5 w-5" style={{ color: "#6fcf97" }} />
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#6fcf97" }}>All three plans saved to your account!</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                Browse Plans A, B, and C below. Head to <Link href="/profile" className="underline" style={{ color: "#f5a623" }}>Dashboard</Link> to access them anytime.
              </p>
            </div>
          </div>
        )}

        {/* Plan tabs */}
        <Tabs defaultValue="A" className="mt-10">
          <div className="mb-8 flex justify-center">
            <TabsList className="rounded-full p-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {["A","B","C"].map(p => (
                <TabsTrigger key={p} value={p}
                  className="rounded-full px-6 py-1.5 text-sm font-semibold data-[state=active]:text-[#071410] transition-all"
                  style={{ fontFamily: "var(--font-cinzel)" }}>
                  Plan {p}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {(["A","B","C"] as const).map(p => (
            <TabsContent key={p} value={p}>
              <PlanView initialPlan={plans[p]} profile={profile} />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <footer className="mt-16 border-t py-8 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-xs italic" style={{ color: "#4a7a72" }}>
          Sample plan based on your preferences. Consult your academic advisor for official course registration.
        </p>
      </footer>
    </div>
  )
}

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="lumen-app-shell flex min-h-screen items-center justify-center">
        <LumenFireflies className="fixed opacity-80" />
        <Sparkles className="h-8 w-8 animate-spin" style={{ color: "#f5a623" }} />
      </div>
    }>
      <PlanPageInner />
    </Suspense>
  )
}
