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
import type { StudentProfile as StudentProfileType } from "@/lib/types"
import { MINIMUM_TOTAL_CREDITS, MINIMUM_CREDITS_OUTSIDE_MAJOR } from "@/lib/types"

interface Props {
  searchParams: Promise<{
    majors?: string
    minors?: string
    interests?: string
    hobbies?: string
    careerGoals?: string
  }>
}

export default async function PlanPage({ searchParams }: Props) {
  const params = await searchParams

  const profile: StudentProfileType = {
    majors: params.majors ? params.majors.split(",") : ["CSC"],
    minors: params.minors ? params.minors.split(",") : [],
    interests: params.interests ? params.interests.split(",") : ["Technology"],
    hobbies: params.hobbies ? params.hobbies.split(",") : [],
    careerGoals: params.careerGoals ? params.careerGoals.split(",") : ["Software Engineer"],
  }

  const plan = generateAcademicPlan(profile)
  const stats = getPlanStats(plan)

  const years = [
    { label: "2026 – 27", fallTitle: "Fall 2026", springTitle: "Spring 2027", fall: plan.semesters[0], spring: plan.semesters[1] },
    { label: "2027 – 28", fallTitle: "Fall 2027", springTitle: "Spring 2028", fall: plan.semesters[2], spring: plan.semesters[3] },
    { label: "2028 – 29", fallTitle: "Fall 2028", springTitle: "Spring 2029", fall: plan.semesters[4], spring: plan.semesters[5] },
    { label: "2029 – 30", fallTitle: "Fall 2029", springTitle: "Spring 2030", fall: plan.semesters[6], spring: plan.semesters[7] },
  ]

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
          {years.map(({ label, fallTitle, springTitle, fall, spring }) => (
            <div key={label} className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <GraduationCap className="h-5 w-5 text-primary" />
                {label}
              </h2>
              <SemesterCard
                title={fallTitle}
                courses={fall.courses.map(c => ({
                  code: c.code,
                  name: c.name,
                  credits: c.credits,
                  fulfills: c.fulfills,
                  isPlaceholder: c.isPlaceholder,
                  placeholderCategory: c.placeholderCategory,
                  category: c.category,
                  scheduleDisclaimer: c.scheduleDisclaimer,
                }))}
                isOverloaded={fall.isOverloaded}
              />
              <SemesterCard
                title={springTitle}
                courses={spring.courses.map(c => ({
                  code: c.code,
                  name: c.name,
                  credits: c.credits,
                  fulfills: c.fulfills,
                  isPlaceholder: c.isPlaceholder,
                  placeholderCategory: c.placeholderCategory,
                  category: c.category,
                  scheduleDisclaimer: c.scheduleDisclaimer,
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
                <p className="text-sm text-muted-foreground">Overloaded</p>
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
