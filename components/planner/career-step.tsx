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

const CAREER_GOALS = [
  "Accountant", "Actor", "Administrative Assistant", "Agricultural Specialist", "AI/ML Engineer",
  "Architect", "Astronomer", "Author", "Barista", "Biochemist",
  "Biologist", "Business Analyst", "Business Consultant", "Carpenter", "Chef",
  "Chemist", "Civil Engineer", "Clinical Psychologist", "Coach", "Communications Director",
  "Community Organizer", "Construction Manager", "Content Creator", "Counselor/Therapist", "Cybersecurity Specialist",
  "Data Scientist", "Database Administrator", "Dentist", "Economist", "Educator/Teacher",
  "Electrical Engineer", "Entrepreneur", "Environmental Scientist", "Event Planner", "Fashion Designer",
  "Film Director", "Financial Advisor", "Financial Analyst", "Fitness Trainer", "Florist",
  "Forensic Scientist", "Game Developer", "Geologist", "Graphic Designer", "HR Manager",
  "Healthcare Professional", "Hotel Manager", "Industrial Designer", "Interior Designer", "Investment Banker",
  "Journalist", "Judge", "Landscape Architect", "Lawyer", "Librarian",
  "Logistics Manager", "Marine Biologist", "Marketing Manager", "Mechanical Engineer", "Medical Doctor",
  "Medical School", "Meteorologist", "Microbiologist", "Military Officer", "Mobile App Developer",
  "Museum Curator", "Musician", "Network Administrator", "Nonprofit Director", "Nurse",
  "Nutritionist", "Occupational Therapist", "Optometrist", "Paralegal", "Pharmacist",
  "Physical Therapist", "Physician Assistant", "Physicist", "Pilot", "Policy Analyst",
  "Political Scientist", "Product Manager", "Professor/Researcher", "Psychiatrist", "Psychologist",
  "Public Defender", "Public Health Officer", "Radiologist", "Real Estate Agent", "Recruiter",
  "Sales Manager", "School Counselor", "Security Professional", "Social Media Manager", "Social Worker",
  "Software Engineer", "Speech Therapist", "Sports Coach", "Sports Manager", "Startup Founder",
  "Supply Chain Manager", "Surgeon", "Sustainability Consultant", "Systems Analyst", "Tax Advisor",
  "Translator/Interpreter", "UX/UI Designer", "Urban Planner", "Veterinarian", "Video Game Developer",
  "Web Developer", "Welder", "Wildlife Biologist", "Graduate School", "Law School",
]

const QUICK_PICKS = [
  "Software Engineer", "Healthcare Professional", "Educator/Teacher", "Business Analyst",
  "Data Scientist", "Psychologist", "Social Worker", "Environmental Scientist",
  "Lawyer", "Nurse", "Researcher/Professor", "Marketing Manager",
  "Entrepreneur", "Graduate School", "Medical School", "UX/UI Designer",
]

const MAX_SELECTIONS = 3

interface CareerStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function CareerStep({ selected, onChange }: CareerStepProps) {
  const [open, setOpen] = useState(false)

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(c => c !== id))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, id])
      setOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} career goals •{" "}
          <span className={cn("font-medium", selected.length >= 1 ? "text-primary" : "text-muted-foreground")}>
            {selected.length} selected
          </span>
        </p>
      </div>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selected.map(id => (
            <Badge key={id} variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
              {id}
              <button onClick={() => toggle(id)} className="ml-1 rounded-full hover:bg-muted">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {id}</span>
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
            {selected.length >= MAX_SELECTIONS ? "Maximum selections reached" : "Search all career goals..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Type to search..." />
            <CommandList>
              <CommandEmpty>No career goal found.</CommandEmpty>
              <CommandGroup>
                {CAREER_GOALS.map(id => (
                  <CommandItem key={id} value={id} onSelect={() => toggle(id)}>
                    <Check className={cn("mr-2 h-4 w-4", selected.includes(id) ? "opacity-100" : "opacity-0")} />
                    {id}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick picks */}
      <div>
        <p className="mb-3 text-center text-sm text-muted-foreground">Popular career goals:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {QUICK_PICKS.map(id => (
            <button
              key={id}
              onClick={() => toggle(id)}
              disabled={!selected.includes(id) && selected.length >= MAX_SELECTIONS}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                selected.includes(id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                !selected.includes(id) && selected.length >= MAX_SELECTIONS && "cursor-not-allowed opacity-50"
              )}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: MAX_SELECTIONS }).map((_, i) => (
          <div key={i} className={cn("h-2 w-8 rounded-full transition-colors", i < selected.length ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {"We'll"} tailor your course plan to help you reach these goals.
      </p>
    </div>
  )
}
