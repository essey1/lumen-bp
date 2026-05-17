"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft, GraduationCap, Sparkles, Pencil, X, Plus, Trash2, Check, Lock,
} from "lucide-react"
import { StudentProfile } from "@/components/plan/student-profile"
import { OverflowWarning } from "@/components/plan/overflow-warning"
import { CareerAdvice } from "@/components/plan/career-advice"
import { SavePlanButton } from "@/components/plan/save-plan-button"
import { ExportButton } from "@/components/plan/export-button"
import { PlanCourseCombobox } from "@/components/plan/course-combobox"
import { generateAcademicPlan, getPlanStats, type CompletedSemesterInput } from "@/lib/plan-generator"
import type { StudentProfile as StudentProfileType, SemesterPlan, PlannedCourse } from "@/lib/types"
import { MINIMUM_TOTAL_CREDITS, MINIMUM_CREDITS_OUTSIDE_MAJOR } from "@/lib/types"
import type { MathPlacement } from "@/lib/types"

// ── Inline course editor ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Major:   "bg-blue-50 border-blue-200 text-blue-800",
  Minor:   "bg-purple-50 border-purple-200 text-purple-800",
  GEM:     "bg-green-50 border-green-200 text-green-800",
  Elective:"bg-gray-50 border-gray-200 text-gray-700",
}

function EditableCourseRow({
  course,
  editMode,
  onChange,
  onRemove,
}: {
  course: PlannedCourse
  editMode: boolean
  onChange: (c: PlannedCourse) => void
  onRemove: () => void
}) {
  const color = CATEGORY_COLORS[course.category] ?? CATEGORY_COLORS.Elective

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
    )
  }

  return (
    <div className={`rounded-md border px-2 py-1.5 text-xs ${color}`}>
      <div className="flex items-center gap-1.5">
        <PlanCourseCombobox course={course} onChange={onChange} />
        <button type="button" onClick={onRemove} className="shrink-0 opacity-50 hover:opacity-100">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function EditableSemesterCard({
  title,
  semester,
  editMode,
  onCourseChange,
  onAddCourse,
  onRemoveCourse,
}: {
  title: string
  semester: SemesterPlan
  editMode: boolean
  onCourseChange: (idx: number, c: PlannedCourse) => void
  onAddCourse: () => void
  onRemoveCourse: (idx: number) => void
}) {
  const isCompleted = semester.isCompleted

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
          <p className="text-[10px] text-muted-foreground italic px-1 pb-1 border-b border-border">Completed</p>
        )}
        {semester.courses.map((c, i) => (
          <EditableCourseRow
            key={`${c.code}-${i}`}
            course={c}
            editMode={editMode && !isCompleted}
            onChange={updated => onCourseChange(i, updated)}
            onRemove={() => onRemoveCourse(i)}
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
  )
}

// ── Main plan view (per plan type A/B/C) ───────────────────────────────────

function PlanView({
  initialPlan,
  profile,
}: {
  initialPlan: ReturnType<typeof generateAcademicPlan>
  profile: StudentProfileType
}) {
  const [semesters, setSemesters] = useState<SemesterPlan[]>(initialPlan.semesters)
  const [editMode, setEditMode] = useState(false)

  const stats = getPlanStats({ ...initialPlan, semesters })

  const YEAR_LABELS = [
    { label: "Year 1", fallTitle: "Fall – Year 1", springTitle: "Spring – Year 1", fallIdx: 0, springIdx: 1 },
    { label: "Year 2", fallTitle: "Fall – Year 2", springTitle: "Spring – Year 2", fallIdx: 2, springIdx: 3 },
    { label: "Year 3", fallTitle: "Fall – Year 3", springTitle: "Spring – Year 3", fallIdx: 4, springIdx: 5 },
    { label: "Year 4", fallTitle: "Fall – Year 4", springTitle: "Spring – Year 4", fallIdx: 6, springIdx: 7 },
  ]

  const updateCourse = useCallback((semIdx: number, courseIdx: number, updated: PlannedCourse) => {
    setSemesters(prev => prev.map((sem, si) =>
      si !== semIdx ? sem : {
        ...sem,
        courses: sem.courses.map((c, ci) => ci === courseIdx ? updated : c),
        totalCredits: sem.courses.map((c, ci) => ci === courseIdx ? updated : c).reduce((s, c) => s + c.credits, 0),
      }
    ))
  }, [])

  const addCourse = useCallback((semIdx: number) => {
    setSemesters(prev => prev.map((sem, si) => {
      if (si !== semIdx) return sem
      const newCourse: PlannedCourse = { code: "NEW", name: "New Course", credits: 1, fulfills: [], category: "Elective" }
      const courses = [...sem.courses, newCourse]
      return { ...sem, courses, totalCredits: courses.reduce((s, c) => s + c.credits, 0) }
    }))
  }, [])

  const removeCourse = useCallback((semIdx: number, courseIdx: number) => {
    setSemesters(prev => prev.map((sem, si) => {
      if (si !== semIdx) return sem
      const courses = sem.courses.filter((_, ci) => ci !== courseIdx)
      return { ...sem, courses, totalCredits: courses.reduce((s, c) => s + c.credits, 0) }
    }))
  }, [])

  const unfulfilledCourses = initialPlan.unfulfilledRequirements.map((req, i) => ({
    code: `REQ ${i + 1}`,
    name: req,
    credits: 1,
  }))

  return (
    <>
      {/* Edit toggle */}
      <div className="mb-4 flex justify-end">
        {editMode ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              Edit mode: change any course below
            </span>
            <Button size="sm" variant="outline" onClick={() => setEditMode(false)} className="gap-1.5">
              <Check className="h-3.5 w-3.5" /> Done Editing
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setSemesters(initialPlan.semesters); setEditMode(false) }} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit Plan
          </Button>
        )}
      </div>

      {/* 4-Year Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {YEAR_LABELS.map(({ label, fallTitle, springTitle, fallIdx, springIdx }) => (
          <div key={label} className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              {label}
            </h2>
            <EditableSemesterCard
              title={fallTitle}
              semester={semesters[fallIdx]}
              editMode={editMode}
              onCourseChange={(ci, c) => updateCourse(fallIdx, ci, c)}
              onAddCourse={() => addCourse(fallIdx)}
              onRemoveCourse={ci => removeCourse(fallIdx, ci)}
            />
            <EditableSemesterCard
              title={springTitle}
              semester={semesters[springIdx]}
              editMode={editMode}
              onCourseChange={(ci, c) => updateCourse(springIdx, ci, c)}
              onAddCourse={() => addCourse(springIdx)}
              onRemoveCourse={ci => removeCourse(springIdx, ci)}
            />
          </div>
        ))}
      </div>

      {/* Overflow Warning */}
      {(initialPlan.warnings.length > 0 || unfulfilledCourses.length > 0) && (
        <OverflowWarning courses={unfulfilledCourses} warnings={initialPlan.warnings} />
      )}

      {/* Summary Stats */}
      <Card className="mt-8 border-border bg-card">
        <CardContent className="py-6">
          <div className="grid gap-6 text-center md:grid-cols-3 lg:grid-cols-6">
            <div>
              <p className="text-3xl font-bold text-primary">{stats.totalCredits}</p>
              <p className="text-sm text-muted-foreground">Total Credits</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.totalCourses}</p>
              <p className="text-sm text-muted-foreground">Courses</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.majorCourses}</p>
              <p className="text-sm text-muted-foreground">Major Courses</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.creditsOutsideMajor}</p>
              <p className="text-sm text-muted-foreground">Outside Major</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-muted-foreground">{stats.placeholderCourses}</p>
              <p className="text-sm text-muted-foreground">TBD Courses</p>
            </div>
            <div>
              <p className={`text-3xl font-bold ${stats.overloadedSemesters > 0 ? "text-warning" : "text-primary"}`}>
                {stats.overloadedSemesters}
              </p>
              <p className="text-sm text-muted-foreground">Overloaded</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="mt-6 flex justify-center">
        <SavePlanButton
          majors={profile.majors}
          minors={profile.minors}
          interests={profile.interests}
          careerGoals={profile.careerGoals}
          mathPlacement={profile.mathPlacement ?? "none"}
          waivedCourses={profile.waivedCourses ?? []}
          planType={initialPlan.student.majors[0] ?? "Custom"}
          semesters={semesters}
        />
      </div>

      {/* Career advice */}
      <div className="mt-8">
        <CareerAdvice
          careerGoals={profile.careerGoals}
          majors={profile.majors}
          courses={semesters.flatMap(s => s.courses.map(c => ({ code: c.code, name: c.name })))}
          interests={profile.interests}
        />
      </div>
    </>
  )
}

// ── Page root ──────────────────────────────────────────────────────────────

export default function PlanPage() {
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<StudentProfileType | null>(null)
  const [plans, setPlans] = useState<{
    A: ReturnType<typeof generateAcademicPlan>
    B: ReturnType<typeof generateAcademicPlan>
    C: ReturnType<typeof generateAcademicPlan>
  } | null>(null)

  useEffect(() => {
    const p: StudentProfileType = {
      majors: searchParams.get("majors")?.split(",") ?? ["CSC"],
      minors: searchParams.get("minors")?.split(",").filter(Boolean) ?? [],
      interests: searchParams.get("interests")?.split(",") ?? ["Technology"],
      hobbies: [],
      careerGoals: searchParams.get("careerGoals")?.split(",") ?? ["Software Engineer"],
      mathPlacement: (searchParams.get("mathPlacement") ?? "none") as MathPlacement,
      waivedCourses: searchParams.get("waivedCourses")?.split(",").filter(Boolean) ?? [],
    }

    let completedSemesters: CompletedSemesterInput[] = []
    try {
      const stored = sessionStorage.getItem("completedSemesters")
      if (stored) completedSemesters = JSON.parse(stored)
    } catch { /* ignore */ }

    setProfile(p)
    setPlans({
      A: generateAcademicPlan(p, { planType: "A", completedSemesters }),
      B: generateAcademicPlan(p, { planType: "B", completedSemesters }),
      C: generateAcademicPlan(p, { planType: "C", completedSemesters }),
    })
    setReady(true)
  }, [searchParams])

  if (!ready || !profile || !plans) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating your plan…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Lumen</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/planner">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Edit Preferences
              </Button>
            </Link>
            <ExportButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">Your Academic Plan</h1>
          <p className="text-muted-foreground">A personalized course roadmap — edit any course before saving</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Minimum {MINIMUM_TOTAL_CREDITS} credits required</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{MINIMUM_CREDITS_OUTSIDE_MAJOR} credits outside major</span>
          </div>
        </div>

        <StudentProfile profile={{
          majors: profile.majors,
          minors: profile.minors,
          interests: profile.interests,
          careerGoals: profile.careerGoals,
        }} />

        <Tabs defaultValue="A" className="mt-8">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="A">Plan A</TabsTrigger>
              <TabsTrigger value="B">Plan B</TabsTrigger>
              <TabsTrigger value="C">Plan C</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="A">
            <PlanView initialPlan={plans.A} profile={profile} />
          </TabsContent>
          <TabsContent value="B">
            <PlanView initialPlan={plans.B} profile={profile} />
          </TabsContent>
          <TabsContent value="C">
            <PlanView initialPlan={plans.C} profile={profile} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-12 border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Sample plan based on your preferences. Consult your academic advisor for official course registration.</p>
        </div>
      </footer>
    </div>
  )
}
