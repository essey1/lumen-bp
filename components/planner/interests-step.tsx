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

const INTERESTS = [
  "Accounting", "Acoustics", "Agriculture", "Aerospace Engineering", "Anthropology",
  "Architecture", "Artificial Intelligence", "Arts", "Astronomy", "Athletics",
  "Behavioral Science", "Biology", "Blockchain", "Botany", "Business",
  "Chemistry", "Climate Action", "Cloud Computing", "Coaching", "Cognitive Science",
  "Communication", "Community Service", "Construction", "Content Strategy", "Criminology",
  "Culinary Arts", "Cybersecurity", "Data Science", "Database Design", "Decision Theory",
  "Design", "Digital Marketing", "E-Commerce", "Economics", "Ecology",
  "Education", "Electrical Systems", "Energy Systems", "Engineering", "Entrepreneurship",
  "Environment", "Environmental Engineering", "Epidemiology", "Ethics", "Fashion",
  "Film Studies", "Finance", "Fine Arts", "Fitness", "Game Development",
  "Game Theory", "Genetics", "Geography", "Geology", "Healthcare",
  "History", "Human Resources", "Immunology", "Innovation", "Insurance",
  "Interior Design", "International Relations", "Investment", "IoT", "Law",
  "Leadership", "Linguistics", "Literature", "Logistics", "Manufacturing",
  "Marine Biology", "Marine Science", "Marketing", "Mathematics", "Media",
  "Mentoring", "Meteorology", "Microbiology", "Mobile Apps", "Music Theory",
  "Nanotechnology", "Negotiation", "Neuroscience", "Nutrition", "Operations",
  "Organizational Psychology", "Outdoor Sports", "Paleontology", "Pharmacology", "Philosophy",
  "Photography", "Physics", "Political Science", "Project Management", "Psychology",
  "Public Policy", "Public Speaking", "Renewable Energy", "Religious Studies", "Research",
  "Risk Management", "Robotics", "Sales", "Social Impact", "Social Work",
  "Sociology", "Software Development", "Startups", "Supply Chain", "Sustainability",
  "Systems Thinking", "Teaching", "Technology", "Toxicology", "Urban Planning",
  "UX/UI", "Virtual Reality", "Water Sports", "Web Development", "Wellness",
  "Wildlife Biology", "Writing",
]

const QUICK_PICKS = [
  "Technology", "Healthcare", "Business", "Arts", "Research",
  "Environment", "Psychology", "Writing", "Social Impact", "Teaching",
  "Engineering", "Mathematics", "Music Theory", "Film Studies", "Political Science",
  "Economics", "Biology", "Data Science", "Philosophy", "Communication",
]

const MAX_SELECTIONS = 5

interface InterestsStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function InterestsStep({ selected, onChange }: InterestsStepProps) {
  const [open, setOpen] = useState(false)

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, id])
      setOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} interests •{" "}
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
            {selected.length >= MAX_SELECTIONS ? "Maximum selections reached" : "Search all interests..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Type to search..." />
            <CommandList>
              <CommandEmpty>No interest found.</CommandEmpty>
              <CommandGroup>
                {INTERESTS.map(id => (
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
        <p className="mb-3 text-center text-sm text-muted-foreground">Popular interests:</p>
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
    </div>
  )
}
