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
import { AVAILABLE_MINORS } from "@/lib/minors-data"

const MINORS = AVAILABLE_MINORS.map(m => ({ code: m.code, label: m.name }))
const MAX_SELECTIONS = 2

interface MinorStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function MinorStep({ selected, onChange }: MinorStepProps) {
  const [open, setOpen] = useState(false)

  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter(m => m !== code))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, code])
      setOpen(false)
    }
  }

  const remove = (code: string) => onChange(selected.filter(m => m !== code))
  const getLabel = (code: string) => MINORS.find(m => m.code === code)?.label ?? code

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} minors (optional) •{" "}
          <span className={cn("font-medium", selected.length > 0 ? "text-primary" : "text-muted-foreground")}>
            {selected.length} selected
          </span>
        </p>
      </div>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selected.map(code => (
            <Badge key={code} variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
              {getLabel(code)}
              <button onClick={() => remove(code)} className="ml-1 rounded-full hover:bg-muted">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {getLabel(code)}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Searchable dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={selected.length >= MAX_SELECTIONS}
          >
            {selected.length >= MAX_SELECTIONS ? "Maximum selections reached" : "Search and select a minor..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search minors..." />
            <CommandList>
              <CommandEmpty>No minor found.</CommandEmpty>
              <CommandGroup>
                {MINORS.map(m => (
                  <CommandItem
                    key={m.code}
                    value={m.label}
                    onSelect={() => toggle(m.code)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected.includes(m.code) ? "opacity-100" : "opacity-0")} />
                    {m.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick select grid */}
      <div>
        <p className="mb-3 text-center text-sm text-muted-foreground">Or choose from available minors:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {MINORS.map(m => (
            <button
              key={m.code}
              onClick={() => toggle(m.code)}
              disabled={!selected.includes(m.code) && selected.length >= MAX_SELECTIONS}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                selected.includes(m.code)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                !selected.includes(m.code) && selected.length >= MAX_SELECTIONS && "cursor-not-allowed opacity-50"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        No minor in mind? Skip this step — you can always add one later with your advisor.
      </p>
    </div>
  )
}
