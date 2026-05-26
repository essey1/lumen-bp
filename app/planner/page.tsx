"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check, Sparkles, User, Loader2, LogOut } from "lucide-react"
import { ForestNav } from "@/components/forest-nav"
import { LumenFireflies } from "@/components/lumen-ambience"
import { MajorStep } from "@/components/planner/major-step"
import { MinorStep } from "@/components/planner/minor-step"
import { InterestsStep } from "@/components/planner/interests-step"
import { CareerStep } from "@/components/planner/career-step"
import { PlanNameStep } from "@/components/planner/plan-name-step"
import { type CompletedSemesterData } from "@/components/planner/completed-semesters-step"
import { AVAILABLE_MAJORS } from "@/lib/majors-data"
import { generateAcademicPlan, validateCompletedSemesters, type CompletedSemesterInput } from "@/lib/plan-generator"
import type { CustomCourseEntry, MathPlacement } from "@/lib/types"

const STEPS = [
  { id: 1, title: "Major",        description: "Choose your field of study" },
  { id: 2, title: "Minor",        description: "Add a minor (optional)" },
  { id: 3, title: "Interests",    description: "What excites you academically?" },
  { id: 4, title: "Career Goals", description: "Where are you headed?" },
  { id: 5, title: "Plan Name",    description: "Name your academic journey" },
]

export default function PlannerPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    majors:      [] as string[],
    minors:      [] as string[],
    interests:   [] as string[],
    careerGoals: [] as string[],
    planName:    "",
  })

  // Loaded from profile (if logged in) — used automatically at generation time
  const [profileMathPlacement, setProfileMathPlacement] = useState<MathPlacement>("none")
  const [profileWaivedCourses, setProfileWaivedCourses] = useState<string[]>([])
  const [completedSemesters, setCompletedSemesters] = useState<CompletedSemesterData[]>([])
  const [customCourses] = useState<Record<string, CustomCourseEntry>>({})

  // Auto-save state
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState("")

  // Pre-populate from user profile (logged-in users)
  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (!profile) return

        // Major
        if (profile.major) {
          const names: string[] = profile.major.split(", ").map((s: string) => s.trim()).filter(Boolean)
          const codes = names
            .map((name: string) => AVAILABLE_MAJORS.find(m => m.name === name)?.code)
            .filter((c): c is string => !!c)
          if (codes.length > 0) setFormData(prev => ({ ...prev, majors: codes }))
        }

        // Waivers — collected at signup, used automatically
        if (profile.mathPlacement) setProfileMathPlacement(profile.mathPlacement as MathPlacement)
        if (profile.waivedCourses) {
          try { setProfileWaivedCourses(JSON.parse(profile.waivedCourses)) } catch { /* ignore */ }
        }

        // Completed semesters
        if (profile.completedSemesters) {
          try { setCompletedSemesters(JSON.parse(profile.completedSemesters)) } catch { /* ignore */ }
        }
      })
      .catch(() => {}) // not logged in — proceed with defaults
  }, [])

  // Auto-fill plan name once we have a major
  useEffect(() => {
    if (formData.planName) return // user already typed something
    if (formData.majors.length === 0) return
    const majorName = AVAILABLE_MAJORS.find(m => m.code === formData.majors[0])?.name ?? formData.majors[0]
    setFormData(prev => ({
      ...prev,
      planName: prev.planName || `${majorName} — 4-Year Plan`,
    }))
  }, [formData.majors, formData.planName])

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      return
    }

    // ── Final step: generate Plans A, B, C and auto-save all three ──────────────
    setGenerating(true)
    setGenerateError("")

    try {
      // Validate completed semesters before generating
      const completedSemesterInputs: CompletedSemesterInput[] = completedSemesters
      const semErrors = validateCompletedSemesters(completedSemesterInputs)
      if (semErrors.length > 0) {
        setGenerateError(
          `${semErrors[0].message} Please update your completed semesters in your profile before generating.`
        )
        return
      }

      const profile = {
        majors:        formData.majors,
        minors:        formData.minors,
        interests:     formData.interests,
        hobbies:       [],
        careerGoals:   formData.careerGoals,
        mathPlacement: profileMathPlacement,
        waivedCourses: profileWaivedCourses,
      }

      const customCourseEntries: CustomCourseEntry[] = Object.values(customCourses)

      // Generate all three plan variants
      const planA = generateAcademicPlan(profile, { planType: "A", completedSemesters: completedSemesterInputs, customCourses: customCourseEntries })
      const planB = generateAcademicPlan(profile, { planType: "B", completedSemesters: completedSemesterInputs, customCourses: customCourseEntries })
      const planC = generateAcademicPlan(profile, { planType: "C", completedSemesters: completedSemesterInputs, customCourses: customCourseEntries })

      // Build preview URL params (used for both success and fallback paths)
      const params = new URLSearchParams()
      if (formData.majors.length > 0)      params.set("majors",      formData.majors.join(","))
      if (formData.minors.length > 0)      params.set("minors",      formData.minors.join(","))
      if (formData.interests.length > 0)   params.set("interests",   formData.interests.join(","))
      if (formData.careerGoals.length > 0) params.set("careerGoals", formData.careerGoals.join(","))
      if (profileMathPlacement !== "none") params.set("mathPlacement", profileMathPlacement)
      if (profileWaivedCourses.length > 0) params.set("waivedCourses", profileWaivedCourses.join(","))

      // Store sessionStorage data for the plan page
      if (completedSemesters.length > 0) {
        sessionStorage.setItem("completedSemesters", JSON.stringify(completedSemesters))
      } else {
        sessionStorage.removeItem("completedSemesters")
      }
      if (customCourseEntries.length > 0) {
        sessionStorage.setItem("customCourses", JSON.stringify(customCourseEntries))
      } else {
        sessionStorage.removeItem("customCourses")
      }

      const baseName = formData.planName.trim() || `${formData.majors[0] ?? "My"} Plan`
      const groupId = crypto.randomUUID() // links the 3 plans so they can be toggled
      const commonFields = {
        majors:        formData.majors,
        minors:        formData.minors,
        interests:     formData.interests,
        careerGoals:   formData.careerGoals,
        mathPlacement: profileMathPlacement,
        waivedCourses: profileWaivedCourses,
        groupId,
      }

      // Save all three plans in parallel
      const [resA, resB, resC] = await Promise.all([
        fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...commonFields, name: `${baseName} – A`, planType: "A", semesters: planA.semesters }) }),
        fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...commonFields, name: `${baseName} – B`, planType: "B", semesters: planB.semesters }) }),
        fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...commonFields, name: `${baseName} – C`, planType: "C", semesters: planC.semesters }) }),
      ])

      if (resA.ok) {
        const [dataA] = await Promise.all([
          resA.json(),
          resB.ok ? resB.json() : null,
          resC.ok ? resC.json() : null,
        ])
        // Go directly to the saved Plan A — it has A/B/C tabs to switch to siblings
        router.push(`/plan/${dataA.id}?saved=1`)
        return
      }

      // Not logged in or save failed — preview without save
      router.push(`/plan?${params.toString()}`)
    } catch {
      setGenerateError("Something went wrong. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const updateFormData = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    if (generating) return false
    switch (currentStep) {
      case 1: return formData.majors.length >= 1
      case 2: return true
      case 3: return formData.interests.length >= 1
      case 4: return formData.careerGoals.length >= 1
      case 5: return formData.planName.trim().length >= 1
      default: return true
    }
  }

  const majorName = formData.majors.length > 0
    ? (AVAILABLE_MAJORS.find(m => m.code === formData.majors[0])?.name ?? formData.majors[0])
    : undefined

  return (
    <div className="lumen-app-shell">
      <LumenFireflies className="fixed opacity-90" />
      <ForestNav actions={
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-[#7aada0] sm:block">Step {currentStep} of {STEPS.length}</span>
          <Link href="/profile" className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#c8e0d8] transition hover:border-white/30">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#7aada0] transition hover:border-white/30 hover:text-[#c8e0d8]">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
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
              <div key={step.id} className="hidden flex-col items-center md:flex"
                style={{ color: step.id === currentStep ? "#f5a623" : step.id < currentStep ? "rgba(245,166,35,0.5)" : "#4a7a72" }}>
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                  style={{
                    background:  step.id < currentStep ? "#f5a623" : step.id === currentStep ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.05)",
                    border:      step.id === currentStep ? "2px solid #f5a623" : step.id < currentStep ? "none" : "1px solid rgba(255,255,255,0.1)",
                    color:       step.id < currentStep ? "#071410" : step.id === currentStep ? "#f5a623" : "#4a7a72",
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

      {/* Glow layer */}
      <div className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,166,35,${(currentStep - 1) * 0.025}) 0%, transparent 70%)` }}
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
              <PlanNameStep
                value={formData.planName}
                onChange={v => updateFormData("planName", v)}
                majorName={majorName}
              />
            )}
          </div>

          {/* Error message */}
          {generateError && (
            <p className="mb-4 text-center text-sm text-red-400">{generateError}</p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handleBack}
              disabled={currentStep === 1 || generating}
              className="min-h-[44px] gap-2 px-5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()}
              className="min-h-[44px] gap-2 px-6">
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : currentStep === STEPS.length ? (
                <><Sparkles className="h-4 w-4" /> Generate Plan</>
              ) : (
                <>
                  {currentStep === 2 && formData.minors.length === 0 ? "Skip" : "Next"}
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
