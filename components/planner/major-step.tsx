"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

const MAJORS = [
  "Computer Science",
  "Biology",
  "Economics",
  "Mathematics",
  "Psychology",
  "History",
  "English",
  "Sociology",
  "Physics",
  "Chemistry",
  "Business",
]

const MAX_SELECTIONS = 3
const MIN_SELECTIONS = 1

interface MajorStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function MajorStep({ selected, onChange }: MajorStepProps) {
  const [open, setOpen] = useState(false)

  const toggleMajor = (major: string) => {
    if (selected.includes(major)) {
      onChange(selected.filter((m) => m !== major))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, major])
    }
  }

  const removeMajor = (major: string) => {
    onChange(selected.filter((m) => m !== major))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select {MIN_SELECTIONS} to {MAX_SELECTIONS} majors •{" "}
          <span
            className={cn(
              "font-medium",
              selected.length >= MIN_SELECTIONS
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {selected.length} selected
          </span>
        </p>
      </div>

      {/* Selected Majors */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selected.map((major) => (
            <Badge
              key={major}
              variant="secondary"
              className="gap-1 px-3 py-1.5 text-sm"
            >
              {major}
              <button
                onClick={() => removeMajor(major)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {major}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Searchable Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={selected.length >= MAX_SELECTIONS}
          >
            {selected.length >= MAX_SELECTIONS
              ? "Maximum selections reached"
              : "Search and select a major..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search majors..." />
            <CommandList>
              <CommandEmpty>No major found.</CommandEmpty>
              <CommandGroup>
                {MAJORS.map((major) => (
                  <CommandItem
                    key={major}
                    value={major}
                    onSelect={() => {
                      toggleMajor(major)
                      if (!selected.includes(major)) {
                        setOpen(false)
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(major) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {major}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Select Grid */}
      <div>
        <p className="mb-3 text-center text-sm text-muted-foreground">
          Or choose from popular options:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {MAJORS.map((major) => (
            <button
              key={major}
              onClick={() => toggleMajor(major)}
              disabled={
                !selected.includes(major) && selected.length >= MAX_SELECTIONS
              }
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                selected.includes(major)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                !selected.includes(major) &&
                  selected.length >= MAX_SELECTIONS &&
                  "cursor-not-allowed opacity-50"
              )}
            >
              {major}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
