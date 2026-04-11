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

const MINORS = [
  "Mathematics",
  "Philosophy",
  "Art",
  "Music",
  "Environmental Studies",
  "Political Science",
  "Spanish",
  "French",
]

const MAX_SELECTIONS = 3

interface MinorStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function MinorStep({ selected, onChange }: MinorStepProps) {
  const [open, setOpen] = useState(false)

  const toggleMinor = (minor: string) => {
    if (selected.includes(minor)) {
      onChange(selected.filter((m) => m !== minor))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, minor])
    }
  }

  const removeMinor = (minor: string) => {
    onChange(selected.filter((m) => m !== minor))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} minors (optional) •{" "}
          <span className="font-medium text-primary">
            {selected.length} selected
          </span>
        </p>
      </div>

      {/* Selected Minors */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selected.map((minor) => (
            <Badge
              key={minor}
              variant="secondary"
              className="gap-1 px-3 py-1.5 text-sm"
            >
              {minor}
              <button
                onClick={() => removeMinor(minor)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {minor}</span>
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
              : "Search and select a minor..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search minors..." />
            <CommandList>
              <CommandEmpty>No minor found.</CommandEmpty>
              <CommandGroup>
                {MINORS.map((minor) => (
                  <CommandItem
                    key={minor}
                    value={minor}
                    onSelect={() => {
                      toggleMinor(minor)
                      if (!selected.includes(minor)) {
                        setOpen(false)
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(minor) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {minor}
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
          Or choose from available options:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {MINORS.map((minor) => (
            <button
              key={minor}
              onClick={() => toggleMinor(minor)}
              disabled={
                !selected.includes(minor) && selected.length >= MAX_SELECTIONS
              }
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                selected.includes(minor)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                !selected.includes(minor) &&
                  selected.length >= MAX_SELECTIONS &&
                  "cursor-not-allowed opacity-50"
              )}
            >
              {minor}
            </button>
          ))}
        </div>
      </div>

      {/* Skip hint */}
      <p className="text-center text-sm text-muted-foreground">
        {"Don't"} have a minor in mind? No worries — you can skip this step.
      </p>
    </div>
  )
}
