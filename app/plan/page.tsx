"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
import { LumenFireflies, LumenGuideBear } from "@/components/lumen-ambience"
import { generateAcademicPlan, getPlanStats } from "@/lib/plan-generator"
import type { StudentProfile as StudentProfileType, AcademicPlan } from "@/lib/types"
import { MINIMUM_TOTAL_CREDITS, MINIMUM_CREDITS_OUTSIDE_MAJOR } from "@/lib/types"
import { Suspense
 } from "react"

function PlanContent() {
  const searchParams = useSearchParams()
  
  // Parse profile from URL params or use defaults
  const majorsParam = searchParams.get("majors")
  const interestsParam = searchParams.get("interests")
  const hobbiesParam = searchParams.get("hobbies")
  const careerGoalsParam = searchParams.get("careerGoals")

  const profile: StudentProfileType = {
    majors: majorsParam ? majorsParam.split(",") : ["CSC"],
    minors: [], // Minors removed from planner
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
    <div className="min-h-screen bg-[#06151d] text-[#101820]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(47,160,154,0.52),transparent_34%),radial-gradient(circle_at_12%_84%,rgba(255,210,97,0.2),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(87,71,137,0.32),transparent_31%)]" />
      <LumenFireflies className="fixed" />
      <LumenGuideBear fixed className="scale-90 origin-bottom-left" />
      <div className="pointer-events-none fixed left-[-8rem] top-[-4rem] h-[42rem] w-[16rem] rotate-[13deg] rounded-[50%] border-r-[28px] border-[#20180f]/80" />
      <div className="pointer-events-none fixed right-[-8rem] top-[-3rem] h-[40rem] w-[16rem] rotate-[-14deg] rounded-[50%] border-l-[28px] border-[#20180f]/80" />
      {/* Header */}
      <header className="relative z-10 border-b border-[#ffe08a]/20 bg-[#07151d]/78 text-[#fff7d6] backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/berea-bear-logo.png"
              alt="Berea bear logo"
              width={160}
              height={126}
              priority
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-semibold text-[#fff7d6]">Lumen</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/planner">
              <Button variant="outline" size="sm" className="gap-2 rounded-full border-[#fff7d6]/30 bg-[#fff7d6]/10 text-[#fff7d6] hover:bg-[#fff7d6]/20 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Edit Preferences
              </Button>
            </Link>
            <Button size="sm" className="gap-2 rounded-full bg-[#fff4cb] text-[#06151d] hover:bg-[#ffe08a]">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8 rounded-[22px] bg-[#fffaf0]/95 px-6 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)] ring-1 ring-[#ffe08a]/30 backdrop-blur">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0b6b82]/10">
            <Sparkles className="h-7 w-7 fill-[#f0b83f] stroke-[#f0b83f]" />
          </div>
          <h1 className="mb-2 font-serif text-4xl font-bold text-[#10212a] md:text-6xl">
            Your Academic Plan
          </h1>
          <p className="text-[#40505a]">
            A personalized 4-year course roadmap based on your goals
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-[#40505a]">Minimum {MINIMUM_TOTAL_CREDITS} credits required</span>
            <span className="text-[#40505a]">|</span>
            <span className="text-[#40505a]">{MINIMUM_CREDITS_OUTSIDE_MAJOR} credits outside major</span>
          </div>
        </div>

        <div className="rounded-[22px] bg-[#fffaf0]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] ring-1 ring-[#ffe08a]/30 sm:p-6">
          {/* Student Profile Summary */}
          <StudentProfile profile={{
            majors: profile.majors,
            interests: profile.interests,
            careerGoals: profile.careerGoals,
          }} />

          {/* 4-Year Grid */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {years.map(({ year, fall, spring }) => (
              <div key={year} className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[#10212a]">
                  <GraduationCap className="h-5 w-5 text-[#0b6b82]" />
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
          <Card className="mt-8 border-[#0b6b82]/15 bg-white/80">
            <CardContent className="py-6">
              <div className="grid gap-6 text-center md:grid-cols-3 lg:grid-cols-6">
                <div>
                  <p className="text-3xl font-bold text-[#0b6b82]">{stats.totalCredits}</p>
                  <p className="text-sm text-[#40505a]">Total Credits</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#0b6b82]">{stats.totalCourses}</p>
                  <p className="text-sm text-[#40505a]">Courses</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#0b6b82]">{stats.majorCourses}</p>
                  <p className="text-sm text-[#40505a]">Major Courses</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#0b6b82]">{stats.creditsOutsideMajor}</p>
                  <p className="text-sm text-[#40505a]">Outside Major</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#536b78]">{stats.placeholderCourses}</p>
                  <p className="text-sm text-[#40505a]">TBD Courses</p>
                </div>
                <div>
                  <p className={`text-3xl font-bold ${stats.overloadedSemesters > 0 ? "text-warning" : "text-[#0b6b82]"}`}>
                    {stats.overloadedSemesters}
                  </p>
                  <p className="text-sm text-[#40505a]">
                    Overloaded
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 border-t border-[#ffe08a]/20 bg-[#07151d]/78 py-8 text-[#fff7d6]/75">
        <div className="container mx-auto px-4 text-center text-sm">
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
      <div className="min-h-screen bg-[#06151d] flex items-center justify-center text-[#fff7d6]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ffe08a] border-t-transparent mx-auto mb-4" />
          <p>Generating your plan...</p>
        </div>
      </div>
    }>
      <PlanContent />
    </Suspense>
  )
}
