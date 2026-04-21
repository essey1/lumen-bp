"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Download,
  GraduationCap,
  Sparkles,
} from "lucide-react"
import { StudentProfile } from "@/components/plan/student-profile"
import { SemesterCard } from "@/components/plan/semester-card"
import { OverflowWarning } from "@/components/plan/overflow-warning"
import { CareerAdvice } from "@/components/plan/career-advice"
import { generateAcademicPlan, getPlanStats } from "@/lib/plan-generator"
import type { StudentProfile as StudentProfileType, AcademicPlan } from "@/lib/types"
import { MINIMUM_TOTAL_CREDITS, MINIMUM_CREDITS_OUTSIDE_MAJOR } from "@/lib/types"
import { Suspense
 } from "react"

function PlanContent() {
  const searchParams = useSearchParams()
  
  // Parse profile from URL params or use defaults
  const majorsParam = searchParams.get("majors")
  const minorsParam = searchParams.get("minors")
  const interestsParam = searchParams.get("interests")
  const hobbiesParam = searchParams.get("hobbies")
  const careerGoalsParam = searchParams.get("careerGoals")

  const profile: StudentProfileType = {
    majors: majorsParam ? majorsParam.split(",") : ["CSC"],
    minors: minorsParam ? minorsParam.split(",") : [],
    interests: interestsParam ? interestsParam.split(",") : ["Technology"],
    hobbies: hobbiesParam ? hobbiesParam.split(",") : [],
    careerGoals: careerGoalsParam ? careerGoalsParam.split(",") : ["Software Engineer"],
  }

  // Generate the academic plan
  const plan = generateAcademicPlan(profile)
  const stats = getPlanStats(plan)

  // Group semesters by year
  const years = [
    { year: 1, fall: plan.semesters[0], spring: plan.semesters[1] },
    { year: 2, fall: plan.semesters[2], spring: plan.semesters[3] },
    { year: 3, fall: plan.semesters[4], spring: plan.semesters[5] },
    { year: 4, fall: plan.semesters[6], spring: plan.semesters[7] },
  ]

  // Get unfulfilled requirements for warning
  const unfulfilledCourses = plan.unfulfilledRequirements.map((req, i) => ({
    code: `REQ ${i + 1}`,
    name: req,
    credits: 1,
  }))

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
            <Button size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            Your Academic Plan
          </h1>
          <p className="text-muted-foreground">
            A personalized 4-year course roadmap based on your goals
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Minimum {MINIMUM_TOTAL_CREDITS} credits required</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{MINIMUM_CREDITS_OUTSIDE_MAJOR} credits outside major</span>
          </div>
        </div>

        {/* Student Profile Summary */}
        <StudentProfile profile={{
          majors: profile.majors,
          minors: profile.minors,
          interests: profile.interests,
          careerGoals: profile.careerGoals,
        }} />

        {/* 4-Year Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {years.map(({ year, fall, spring }) => (
            <div key={year} className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <GraduationCap className="h-5 w-5 text-primary" />
                Year {year}
              </h2>
              <SemesterCard
                title="Fall Semester"
                courses={fall.courses.map(c => ({
                  code: c.code,
                  name: c.name,
                  credits: c.credits,
                  isPlaceholder: c.isPlaceholder,
                  placeholderCategory: c.placeholderCategory,
                  category: c.category,
                }))}
                isOverloaded={fall.isOverloaded}
              />
              <SemesterCard
                title="Spring Semester"
                courses={spring.courses.map(c => ({
                  code: c.code,
                  name: c.name,
                  credits: c.credits,
                  isPlaceholder: c.isPlaceholder,
                  placeholderCategory: c.placeholderCategory,
                  category: c.category,
                }))}
                isOverloaded={spring.isOverloaded}
              />
            </div>
          ))}
        </div>

        {/* Overflow Warning */}
        {(plan.warnings.length > 0 || unfulfilledCourses.length > 0) && (
          <OverflowWarning 
            courses={unfulfilledCourses} 
            warnings={plan.warnings}
          />
        )}

        {/* Career Advice from AI */}
        <CareerAdvice
          careerGoals={profile.careerGoals}
          majors={profile.majors}
          courses={plan.semesters.flatMap(s => s.courses.map(c => ({ code: c.code, name: c.name })))}
          interests={profile.interests}
        />

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
                <p className="text-sm text-muted-foreground">
                  Overloaded
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            This is a sample plan based on your preferences. Consult with your
            academic advisor for official course registration.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Generating your plan...</p>
        </div>
      </div>
    }>
      <PlanContent />
    </Suspense>
  )
}
