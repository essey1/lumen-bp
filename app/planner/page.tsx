"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, Sparkles, User } from "lucide-react"
import { ForestNav } from "@/components/forest-nav"
import { LumenFireflies } from "@/components/lumen-ambience"
import { MajorStep } from "@/components/planner/major-step"
import { MinorStep } from "@/components/planner/minor-step"
import { InterestsStep } from "@/components/planner/interests-step"
import { CareerStep } from "@/components/planner/career-step"
import { MathPlacementStep } from "@/components/planner/math-placement-step"
import { WaivedCoursesStep } from "@/components/planner/waived-courses-step"
import { type CompletedSemesterData } from "@/components/planner/completed-semesters-step"
import { AVAILABLE_MAJORS } from "@/lib/majors-data"
import type { MathPlacement } from "@/lib/types"

const STEPS = [
  { id: 1, title: "Major",          description: "Choose your field of study" },
  { id: 2, title: "Minor",          description: "Add a minor (optional)" },
  { id: 3, title: "Interests",      description: "What excites you academically?" },
  { id: 4, title: "Career Goals",   description: "Where are you headed?" },
  { id: 5, title: "Math Waiver",    description: "Up to what math level have you waived?" },
  { id: 6, title: "Other Waivers",  description: "Add any other courses already waived" },
]

export default function PlannerPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    majors: [] as string[],
    minors: [] as string[],
    interests: [] as string[],
    careerGoals: [] as string[],
    mathPlacement: "none" as MathPlacement,
    waivedCourses: [] as string[],
  })
  const [completedSemesters, setCompletedSemesters] = useState<CompletedSemesterData[]>([])

  // Pre-populate majors and completed semesters from the user's profile (if logged in)
  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (!profile) return
        if (profile.major) {
          const names: string[] = profile.major.split(", ").map((s: string) => s.trim()).filter(Boolean)
          const codes = names
            .map((name: string) => AVAILABLE_MAJORS.find(m => m.name === name)?.code)
            .filter((c): c is string => !!c)
          if (codes.length > 0) setFormData(prev => ({ ...prev, majors: codes }))
        }
        if (profile.completedSemesters) {
          try {
            const parsed: CompletedSemesterData[] = JSON.parse(profile.completedSemesters)
            setCompletedSemesters(parsed)
          } catch { /* ignore */ }
        }
      })
      .catch(() => {}) // not logged in — skip
  }, [])

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Pass completed semesters (from profile) via sessionStorage to the plan page
      if (completedSemesters.length > 0) {
        sessionStorage.setItem("completedSemesters", JSON.stringify(completedSemesters))
      } else {
        sessionStorage.removeItem("completedSemesters")
      }

      const params = new URLSearchParams()
      if (formData.majors.length > 0) params.set("majors", formData.majors.join(","))
      if (formData.minors.length > 0) params.set("minors", formData.minors.join(","))
      if (formData.interests.length > 0) params.set("interests", formData.interests.join(","))
      if (formData.careerGoals.length > 0) params.set("careerGoals", formData.careerGoals.join(","))
      if (formData.mathPlacement !== "none") params.set("mathPlacement", formData.mathPlacement)
      if (formData.waivedCourses.length > 0) params.set("waivedCourses", formData.waivedCourses.join(","))
      router.push(`/plan?${params.toString()}`)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const updateFormData = (key: keyof typeof formData, value: string[] | MathPlacement) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.majors.length >= 1
      case 2: return true
      case 3: return formData.interests.length >= 1
      case 4: return formData.careerGoals.length >= 1
      case 5: return true
      case 6: return true
      default: return true
    }
  }

  return (
    <div className="lumen-app-shell">
      <LumenFireflies className="fixed opacity-90" />
      <ForestNav actions={
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-[#7aada0] sm:block">Step {currentStep} of {STEPS.length}</span>
          <Link href="/profile" className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#c8e0d8] transition hover:border-white/30">
            <User className="h-4 w-4" /> Profile
          </Link>
        </div>
      } />

      {/* Progress */}
      <div className="border-b pt-[57px]" style={{ borderColor: "rgba(245,166,35,0.12)", background: "rgba(245,166,35,0.03)" }}>
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#f5a623" }} />
          </div>
          <div className="flex justify-between">
            {STEPS.map(step => (
              <div key={step.id} className={`hidden flex-col items-center md:flex`}
                style={{ color: step.id === currentStep ? "#f5a623" : step.id < currentStep ? "rgba(245,166,35,0.5)" : "#4a7a72" }}>
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                  style={{
                    background: step.id < currentStep ? "#f5a623" : step.id === currentStep ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.05)",
                    border: step.id === currentStep ? "2px solid #f5a623" : step.id < currentStep ? "none" : "1px solid rgba(255,255,255,0.1)",
                    color: step.id < currentStep ? "#071410" : step.id === currentStep ? "#f5a623" : "#4a7a72",
                  }}>
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs font-medium" style={{ fontFamily: "var(--font-cinzel)" }}>{step.title}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 md:hidden">
            <span className="text-lg font-semibold" style={{ color: "#f5a623", fontFamily: "var(--font-cinzel)" }}>{STEPS[currentStep - 1].title}</span>
            <span style={{ color: "#4a7a72" }}>({currentStep}/{STEPS.length})</span>
          </div>
        </div>
      </div>

      {/* Glow layer — brightens as steps complete */}
      <div className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,166,35,${(currentStep - 1) * 0.025}) 0%, transparent 70%)`,
        }}
      />

      {/* Form Content */}
      <main className="lumen-app-content container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-cinzel)", color: "#f0ede0" }}>
              {STEPS[currentStep - 1].title}
            </h1>
            <p className="italic" style={{ color: "#7aada0" }}>{STEPS[currentStep - 1].description}</p>
          </div>

          <div className="mb-8">
            {currentStep === 1 && (
              <MajorStep selected={formData.majors} onChange={v => updateFormData("majors", v)} />
            )}
            {currentStep === 2 && (
              <MinorStep selected={formData.minors} onChange={v => updateFormData("minors", v)} selectedMajors={formData.majors} />
            )}
            {currentStep === 3 && (
              <InterestsStep selected={formData.interests} onChange={v => updateFormData("interests", v)} />
            )}
            {currentStep === 4 && (
              <CareerStep selected={formData.careerGoals} onChange={v => updateFormData("careerGoals", v)} />
            )}
            {currentStep === 5 && (
              <MathPlacementStep
                selected={formData.mathPlacement}
                onChange={v => updateFormData("mathPlacement", v)}
              />
            )}
            {currentStep === 6 && (
              <WaivedCoursesStep
                selected={formData.waivedCourses}
                onChange={v => updateFormData("waivedCourses", v)}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
              {currentStep === STEPS.length ? (
                <>Generate Plan<Sparkles className="h-4 w-4" /></>
              ) : (
                <>
                  {currentStep === 2 && formData.minors.length === 0 ? "Skip" : "Next" }
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
