"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react"
import { MajorStep } from "@/components/planner/major-step"
import { MinorStep } from "@/components/planner/minor-step"
import { InterestsStep } from "@/components/planner/interests-step"
import { HobbiesStep } from "@/components/planner/hobbies-step"
import { CareerStep } from "@/components/planner/career-step"

const STEPS = [
  { id: 1, title: "Major", description: "Choose your field of study" },
  { id: 2, title: "Minor", description: "Add complementary subjects" },
  { id: 3, title: "Interests", description: "What excites you?" },
  { id: 4, title: "Hobbies", description: "Your personal passions" },
  { id: 5, title: "Career Goals", description: "Where are you headed?" },
]

export default function PlannerPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    majors: [] as string[],
    minors: [] as string[],
    interests: [] as string[],
    hobbies: [] as string[],
    careerGoals: [] as string[],
  })

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Navigate to plan page
      router.push("/plan")
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
        return true // Minors are optional
      case 3:
        return formData.interests.length >= 1
      case 4:
        return formData.hobbies.length >= 1
      case 5:
        return formData.careerGoals.length >= 1
      default:
        return true
    }
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
          <div className="hidden text-sm text-muted-foreground sm:block">
            Step {currentStep} of {STEPS.length}
          </div>
        </div>
      </header>

      {/* Progress Section */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Progress value={progress} className="mb-4 h-2" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`hidden flex-col items-center md:flex ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                      ? "text-primary/60"
                      : "text-muted-foreground"
                }`}
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                        ? "border-2 border-primary bg-background text-primary"
                        : "border border-border bg-background text-muted-foreground"
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
            <span className="text-lg font-semibold text-primary">
              {STEPS[currentStep - 1].title}
            </span>
            <span className="text-muted-foreground">
              ({currentStep}/{STEPS.length})
            </span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Step Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              {STEPS[currentStep - 1].title}
            </h1>
            <p className="text-muted-foreground">
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
              <MinorStep
                selected={formData.minors}
                onChange={(value) => updateFormData("minors", value)}
              />
            )}
            {currentStep === 3 && (
              <InterestsStep
                selected={formData.interests}
                onChange={(value) => updateFormData("interests", value)}
              />
            )}
            {currentStep === 4 && (
              <HobbiesStep
                selected={formData.hobbies}
                onChange={(value) => updateFormData("hobbies", value)}
              />
            )}
            {currentStep === 5 && (
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
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
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
