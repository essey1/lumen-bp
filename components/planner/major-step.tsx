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
import { AVAILABLE_MAJORS } from "@/lib/majors-data"

// Format majors for display - using code for data, name for display
const MAJORS = AVAILABLE_MAJORS.map(m => ({
  code: m.code,
  label: `${m.name} (${m.degree})`,
}))

const MAX_SELECTIONS = 3
const MIN_SELECTIONS = 1

interface MajorStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function MajorStep({ selected, onChange }: MajorStepProps) {
  const [open, setOpen] = useState(false)

  const toggleMajor = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((m) => m !== code))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, code])
    }
  }

  const removeMajor = (code: string) => {
    onChange(selected.filter((m) => m !== code))
  }

  const getMajorLabel = (code: string) => {
    return MAJORS.find(m => m.code === code)?.label || code
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-[#6b5d4b]">
          Select {MIN_SELECTIONS} to {MAX_SELECTIONS} majors •{" "}
          <span
            className={cn(
              "font-medium",
              selected.length >= MIN_SELECTIONS
                ? "text-[#0b6b82]"
                : "text-[#6b5d4b]"
            )}
          >
            {selected.length} selected
          </span>
        </p>
      </div>

      {/* Selected Majors */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selected.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className="gap-1 rounded-full bg-[#0b6b82] px-3 py-1.5 text-sm text-white"
            >
              {getMajorLabel(code)}
              <button
                onClick={() => removeMajor(code)}
                className="ml-1 rounded-full hover:bg-white/20"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {getMajorLabel(code)}</span>
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
            className="w-full justify-between rounded-full border-[#0b6b82]/25 bg-white/80 text-[#10212a] hover:bg-[#e6f4f4]"
            disabled={selected.length >= MAX_SELECTIONS}
          >
            {selected.length >= MAX_SELECTIONS
              ? "Maximum selections reached"
              : "Search and select a major..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full border-[#0b6b82]/20 bg-[#fffaf0] p-0 text-[#10212a]" align="start">
          <Command>
            <CommandInput placeholder="Search majors..." />
            <CommandList>
              <CommandEmpty>No major found.</CommandEmpty>
              <CommandGroup>
                {MAJORS.map((major) => (
                  <CommandItem
                    key={major.code}
                    value={major.label}
                    onSelect={() => {
                      toggleMajor(major.code)
                      if (!selected.includes(major.code)) {
                        setOpen(false)
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(major.code) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {major.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Select Grid */}
      <div>
        <p className="mb-3 text-center text-sm text-[#6b5d4b]">
          Or choose from available options:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {MAJORS.map((major) => (
            <button
              key={major.code}
              onClick={() => toggleMajor(major.code)}
              disabled={
                !selected.includes(major.code) && selected.length >= MAX_SELECTIONS
              }
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                selected.includes(major.code)
                  ? "border-[#0b6b82] bg-[#0b6b82] text-white shadow-[0_0_18px_rgba(11,107,130,0.24)]"
                  : "border-[#0b6b82]/20 bg-white/72 text-[#10212a] hover:border-[#0b6b82] hover:bg-[#e6f4f4]",
                !selected.includes(major.code) &&
                  selected.length >= MAX_SELECTIONS &&
                  "cursor-not-allowed opacity-50"
              )}
            >
              {major.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
