"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MathPlacement } from "@/lib/types"

const LEVELS: { value: MathPlacement; label: string; description: string }[] = [
  { value: "none",    label: "None",    description: "I have not completed any of these" },
  { value: "MAT 010", label: "MAT 010", description: "Elementary Algebra I" },
  { value: "MAT 011", label: "MAT 011", description: "Elementary Algebra II" },
  { value: "MAT 012", label: "MAT 012", description: "Elementary Algebra III" },
  { value: "MAT 115", label: "MAT 115", description: "College Algebra with Modeling" },
  { value: "MAT 125", label: "MAT 125", description: "Trigonometry with Applications" },
  { value: "MAT 135", label: "MAT 135", description: "Calculus I" },
  { value: "MAT 225", label: "MAT 225", description: "Calculus II" },
  { value: "MAT 330", label: "MAT 330", description: "Calculus III" },
]

interface Props {
  selected: MathPlacement
  onChange: (value: MathPlacement) => void
}

export function MathPlacementStep({ selected, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center pb-1">
        Up to what level of developmental math have you waived?
        Choose the highest level that has already been completed or waived.
        Everything below that level will be treated as satisfied.
      </p>
      {LEVELS.map((level, idx) => {
        const isSelected = selected === level.value
        const isSatisfied = selected !== "none" && idx > 0 &&
          LEVELS.findIndex(l => l.value === selected) >= idx

        return (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={cn(
              "w-full flex items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : isSatisfied
                  ? "border-primary/30 bg-primary/[0.03]"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            {isSelected ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            ) : (
              <Circle className={cn("h-5 w-5 shrink-0", isSatisfied ? "text-primary/40" : "text-muted-foreground/40")} />
            )}
            <div className="flex-1 min-w-0">
              <span className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>
                {level.label}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">{level.description}</span>
            </div>
            {isSatisfied && !isSelected && (
              <span className="text-xs text-primary/60 shrink-0">satisfied</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
