"use client"

import { cn } from "@/lib/utils"
import {
  BookOpen,
  Camera,
  ChefHat,
  Code,
  Flower2,
  Gamepad2,
  Headphones,
  Mountain,
  Palette,
  PersonStanding,
  Theater,
  Trophy,
} from "lucide-react"

const HOBBIES = [
  { id: "Reading", label: "Reading", icon: BookOpen },
  { id: "Coding", label: "Coding", icon: Code },
  { id: "Painting", label: "Painting", icon: Palette },
  { id: "Music", label: "Music", icon: Headphones },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Hiking", label: "Hiking", icon: Mountain },
  { id: "Photography", label: "Photography", icon: Camera },
  { id: "Cooking", label: "Cooking", icon: ChefHat },
  { id: "Gaming", label: "Gaming", icon: Gamepad2 },
  { id: "Theater", label: "Theater", icon: Theater },
  { id: "Gardening", label: "Gardening", icon: Flower2 },
]

const MAX_SELECTIONS = 3

interface HobbiesStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function HobbiesStep({ selected, onChange }: HobbiesStepProps) {
  const toggleHobby = (hobby: string) => {
    if (selected.includes(hobby)) {
      onChange(selected.filter((h) => h !== hobby))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, hobby])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} hobbies •{" "}
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
        {HOBBIES.map((hobby) => {
          const Icon = hobby.icon
          const isSelected = selected.includes(hobby.id)
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS

          return (
            <button
              key={hobby.id}
              onClick={() => toggleHobby(hobby.id)}
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
              {hobby.label}
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
        Your hobbies help us suggest courses {"you'll"} enjoy beyond your major
      </p>
    </div>
  )
}
