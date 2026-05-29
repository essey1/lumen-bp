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
import { AVAILABLE_MAJORS, isMajorBlockedByDept } from "@/lib/majors-data"

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
    } else if (selected.length < MAX_SELECTIONS && !isMajorBlockedByDept(code, selected)) {
      onChange([...selected, code])
    }
  }

  const isDisabled = (code: string) =>
    !selected.includes(code) && (selected.length >= MAX_SELECTIONS || isMajorBlockedByDept(code, selected))

  const disabledReason = (code: string) =>
    isMajorBlockedByDept(code, selected) ? "You already selected a major from this department" : "Maximum selections reached"

  const removeMajor = (code: string) => {
    onChange(selected.filter((m) => m !== code))
  }

  const getMajorLabel = (code: string) => {
    return MAJORS.find(m => m.code === code)?.label || code
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
          {selected.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className="max-w-full whitespace-normal break-words gap-1 px-3 py-1.5 text-sm text-left"
            >
              {getMajorLabel(code)}
              <button
                onClick={() => removeMajor(code)}
                className="ml-1 rounded-full hover:bg-muted"
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
            className="w-full justify-between"
            disabled={selected.length >= MAX_SELECTIONS}
          >
            {selected.length >= MAX_SELECTIONS ? "Maximum selections reached" : "Search and select a major..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command className="[&_[cmdk-item]]:whitespace-normal [&_[cmdk-item]]:h-auto [&_[cmdk-item]]:py-2">
            <CommandInput placeholder="Search majors..." />
            <CommandList className="overflow-x-auto">
              <CommandEmpty>No major found.</CommandEmpty>
              <CommandGroup>
                {MAJORS.map((major) => {
                  const blocked = isMajorBlockedByDept(major.code, selected)
                  return (
                    <CommandItem
                      key={major.code}
                      value={major.label}
                      disabled={blocked && !selected.includes(major.code)}
                      className="items-start"
                      onSelect={() => {
                        if (blocked && !selected.includes(major.code)) return
                        toggleMajor(major.code)
                        if (!selected.includes(major.code)) setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 mt-0.5 h-4 w-4 shrink-0", selected.includes(major.code) ? "opacity-100" : "opacity-0")} />
                      <span className={cn("min-w-0 flex-1 whitespace-normal break-words", blocked && !selected.includes(major.code) && "opacity-40 line-through")}>
                        {major.label}
                      </span>
                      {blocked && !selected.includes(major.code) && (
                        <span className="ml-2 mt-0.5 shrink-0 text-[10px] text-muted-foreground">same dept</span>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

    </div>
  )
}
