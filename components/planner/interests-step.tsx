"use client"

import { cn } from "@/lib/utils"
import {
  Beaker,
  Briefcase,
  Code,
  Leaf,
  Mic,
  Palette,
  PenTool,
  Scale,
  GraduationCap,
  Heart,
  Cpu,
  Users,
} from "lucide-react"

const INTERESTS = [
  { id: "Research", label: "Research", icon: Beaker },
  { id: "Technology", label: "Technology", icon: Cpu },
  { id: "Writing", label: "Writing", icon: PenTool },
  { id: "Teaching", label: "Teaching", icon: GraduationCap },
  { id: "Healthcare", label: "Healthcare", icon: Heart },
  { id: "Business", label: "Business", icon: Briefcase },
  { id: "Arts", label: "Arts", icon: Palette },
  { id: "Community Service", label: "Community Service", icon: Users },
  { id: "Environment", label: "Environment", icon: Leaf },
  { id: "Law", label: "Law", icon: Scale },
  { id: "Engineering", label: "Engineering", icon: Code },
  { id: "Media", label: "Media", icon: Mic },
]

const MAX_SELECTIONS = 5

interface InterestsStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function InterestsStep({ selected, onChange }: InterestsStepProps) {
  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, interest])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-[#6b5d4b]">
          Select up to {MAX_SELECTIONS} interests •{" "}
          <span
            className={cn(
              "font-medium",
              selected.length >= 1 ? "text-[#0b6b82]" : "text-[#6b5d4b]"
            )}
          >
            {selected.length} selected
          </span>
        </p>
      </div>

      {/* Pill Grid */}
      <div className="flex flex-wrap justify-center gap-3">
        {INTERESTS.map((interest) => {
          const Icon = interest.icon
          const isSelected = selected.includes(interest.id)
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS

          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                isSelected
                  ? "border-[#0b6b82] bg-[#0b6b82] text-white shadow-[0_0_18px_rgba(11,107,130,0.24)]"
                  : "border-[#0b6b82]/20 bg-white/72 text-[#10212a] hover:border-[#0b6b82] hover:bg-[#e6f4f4]",
                isDisabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {interest.label}
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
              i < selected.length ? "bg-[#f0b83f]" : "bg-[#0b6b82]/15"
            )}
          />
        ))}
      </div>
    </div>
  )
}
