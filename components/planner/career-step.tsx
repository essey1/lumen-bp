"use client"

import { cn } from "@/lib/utils"
import {
  Briefcase,
  Building2,
  Code,
  GraduationCap,
  Heart,
  Landmark,
  Lightbulb,
  Palette,
  Scale,
  Stethoscope,
} from "lucide-react"

const CAREER_GOALS = [
  { id: "Graduate School", label: "Graduate School", icon: GraduationCap },
  { id: "Medical School", label: "Medical School", icon: Stethoscope },
  { id: "Law School", label: "Law School", icon: Scale },
  { id: "Software Engineer", label: "Software Engineer", icon: Code },
  { id: "Entrepreneur", label: "Entrepreneur", icon: Lightbulb },
  { id: "Teacher", label: "Teacher", icon: GraduationCap },
  { id: "Researcher", label: "Researcher", icon: Briefcase },
  { id: "Nonprofit Work", label: "Nonprofit Work", icon: Heart },
  { id: "Government", label: "Government", icon: Landmark },
  { id: "Creative Industry", label: "Creative Industry", icon: Palette },
]

const MAX_SELECTIONS = 3

interface CareerStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function CareerStep({ selected, onChange }: CareerStepProps) {
  const toggleCareer = (career: string) => {
    if (selected.includes(career)) {
      onChange(selected.filter((c) => c !== career))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, career])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} career goals •{" "}
          <span
            className={cn(
              "font-medium",
              selected.length >= 1 ? "text-primary" : "text-muted-foreground"
            )}
          >
            {selected.length} selected
          </span>
        </p>
      </div>

      {/* Pill Grid */}
      <div className="flex flex-wrap justify-center gap-3">
        {CAREER_GOALS.map((career) => {
          const Icon = career.icon
          const isSelected = selected.includes(career.id)
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS

          return (
            <button
              key={career.id}
              onClick={() => toggleCareer(career.id)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                isDisabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {career.label}
            </button>
          )
        })}
      </div>

      {/* Selection progress */}
      <div className="flex justify-center gap-1.5">
        {Array.from({ length: MAX_SELECTIONS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-8 rounded-full transition-colors",
              i < selected.length ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {"We'll"} tailor your course plan to help you reach these goals
      </p>
    </div>
  )
}
