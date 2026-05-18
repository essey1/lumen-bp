"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react"
import { MajorStep } from "@/components/planner/major-step"
import { InterestsStep } from "@/components/planner/interests-step"
import { HobbiesStep } from "@/components/planner/hobbies-step"
import { CareerStep } from "@/components/planner/career-step"
import { LumenFireflies, LumenGuideBear } from "@/components/lumen-ambience"

const STEPS = [
  { id: 1, title: "Major", description: "Choose your field of study" },
  { id: 2, title: "Interests", description: "What excites you?" },
  { id: 3, title: "Hobbies", description: "Your personal passions" },
  { id: 4, title: "Career Goals", description: "Where are you headed?" },
]

export default function PlannerPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    majors: [] as string[],
    interests: [] as string[],
    hobbies: [] as string[],
    careerGoals: [] as string[],
  })

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Navigate to plan page with form data as query params
      const params = new URLSearchParams()
      if (formData.majors.length > 0) params.set("majors", formData.majors.join(","))
      if (formData.interests.length > 0) params.set("interests", formData.interests.join(","))
      if (formData.hobbies.length > 0) params.set("hobbies", formData.hobbies.join(","))
      if (formData.careerGoals.length > 0) params.set("careerGoals", formData.careerGoals.join(","))
      router.push(`/plan?${params.toString()}`)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (key: keyof typeof formData, value: string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.majors.length >= 1
      case 2:
        return formData.interests.length >= 1
      case 3:
        return formData.hobbies.length >= 1
      case 4:
        return formData.careerGoals.length >= 1
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-[#06151d] text-[#101820]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(47,160,154,0.55),transparent_36%),radial-gradient(circle_at_15%_80%,rgba(255,210,97,0.22),transparent_28%),radial-gradient(circle_at_86%_72%,rgba(87,71,137,0.34),transparent_31%)]" />
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
          <div className="hidden text-sm text-[#fff7d6]/80 sm:block">
            Step {currentStep} of {STEPS.length}
          </div>
        </div>
      </header>

      {/* Progress Section */}
      <div className="relative z-10 border-b border-[#ffe08a]/20 bg-[#0b2630]/82 text-[#fff7d6] backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <Progress value={progress} className="mb-4 h-2 bg-[#fff7d6]/18" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`hidden flex-col items-center md:flex ${
                  step.id === currentStep
                    ? "text-[#ffe08a]"
                    : step.id < currentStep
                      ? "text-[#ffe08a]/70"
                      : "text-[#fff7d6]/55"
                }`}
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step.id < currentStep
                      ? "bg-[#ffe08a] text-[#06151d]"
                      : step.id === currentStep
                        ? "border-2 border-[#ffe08a] bg-[#07151d] text-[#ffe08a]"
                        : "border border-[#fff7d6]/25 bg-[#07151d] text-[#fff7d6]/55"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
              </div>
            ))}
          </div>
          {/* Mobile step indicator */}
          <div className="flex items-center justify-center gap-2 md:hidden">
            <span className="text-lg font-semibold text-[#ffe08a]">
              {STEPS[currentStep - 1].title}
            </span>
            <span className="text-[#fff7d6]/70">
              ({currentStep}/{STEPS.length})
            </span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl rounded-[22px] bg-[#fffaf0]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] ring-1 ring-[#ffe08a]/30 backdrop-blur sm:p-9">
          {/* Step Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0b6b82]/10 text-[#0b6b82]">
              <Sparkles className="h-7 w-7 fill-[#f0b83f] stroke-[#f0b83f]" />
            </div>
            <h1 className="mb-2 font-serif text-4xl font-bold text-[#10212a] md:text-5xl">
              {STEPS[currentStep - 1].title}
            </h1>
            <p className="text-[#40505a]">
              {STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && (
              <MajorStep
                selected={formData.majors}
                onChange={(value) => updateFormData("majors", value)}
              />
            )}
            {currentStep === 2 && (
              <InterestsStep
                selected={formData.interests}
                onChange={(value) => updateFormData("interests", value)}
              />
            )}
            {currentStep === 3 && (
              <HobbiesStep
                selected={formData.hobbies}
                onChange={(value) => updateFormData("hobbies", value)}
              />
            )}
            {currentStep === 4 && (
              <CareerStep
                selected={formData.careerGoals}
                onChange={(value) => updateFormData("careerGoals", value)}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2 rounded-full border-[#0b6b82]/30 bg-white/70 text-[#10212a] hover:bg-[#e6f4f4]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 rounded-full bg-[#0b6b82] text-white shadow-[0_0_24px_rgba(11,107,130,0.25)] hover:bg-[#084f61]"
            >
              {currentStep === STEPS.length ? (
                <>
                  Generate Plan
                  <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
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
