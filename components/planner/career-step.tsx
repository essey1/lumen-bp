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
  // Technology & Computing
  "Software Engineer", "Full-Stack Developer", "Front-End Developer", "Back-End Developer", "Mobile Developer",
  "Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI Engineer", "Cybersecurity Analyst",
  "Cloud Engineer", "DevOps Engineer", "Systems Analyst", "Database Administrator", "Network Administrator",
  "UX Designer", "Product Manager", "Game Developer", "Video Game Developer", "Animator",
  "Web Developer", "Robotics Engineer", "IT Specialist", "Technical Support Specialist",
  // Engineering & Physical Sciences
  "Mechanical Engineer", "Electrical Engineer", "Civil Engineer", "Chemical Engineer", "Biomedical Engineer",
  "Environmental Engineer", "Industrial Designer", "Architect", "Aerospace Engineer", "Nuclear Engineer",
  "Petroleum Engineer", "Materials Scientist", "Physicist", "Astronomer", "Meteorologist",
  // Life Sciences & Health
  "Biologist", "Ecologist", "Marine Biologist", "Wildlife Biologist", "Conservation Biologist",
  "Geneticist", "Neuroscientist", "Microbiologist", "Biochemist", "Immunologist",
  "Forensic Scientist", "Lab Technician", "Research Scientist", "Agricultural Scientist",
  "Chemist", "Geologist", "Paleontologist",
  // Healthcare & Medicine
  "Medical Doctor", "Surgeon", "Psychiatrist", "Physician Assistant", "Registered Nurse",
  "Nurse Practitioner", "Pharmacist", "Dentist", "Optometrist", "Radiologist",
  "Physical Therapist", "Occupational Therapist", "Speech Therapist", "Dietitian", "Nutritionist",
  "Athletic Trainer", "Health Administrator", "Public Health Worker", "Epidemiologist",
  "Medical School", "Dental School", "Veterinary School",
  // Mental Health & Social Services
  "Psychologist", "Clinical Psychologist", "Child Psychologist", "Counselor", "Therapist",
  "Psychotherapist", "Gerontologist", "Social Worker", "Community Organizer", "School Counselor",
  "Substance Abuse Counselor", "Marriage & Family Therapist",
  // Business, Finance & Management
  "Entrepreneur", "Startup Founder", "Business Analyst", "Business Consultant", "Product Manager",
  "Marketing Manager", "Brand Manager", "Digital Marketer", "Sales Manager", "Account Manager",
  "Financial Analyst", "Investment Banker", "Actuary", "Accountant", "Auditor",
  "Tax Advisor", "Real Estate Agent", "Supply Chain Manager", "Logistics Manager",
  "Human Resources Manager", "Recruiter", "Operations Manager", "Project Manager",
  "Hotel Manager", "Event Planner", "Sports Manager",
  // Law, Policy & Government
  "Lawyer", "Public Defender", "Judge", "Paralegal", "Policy Analyst",
  "Politician", "Diplomat", "Urban Planner", "Nonprofit Manager", "Nonprofit Director",
  "Law School", "International Development",
  // Education
  "Teacher", "College Professor", "Instructional Designer", "Curriculum Developer",
  "School Administrator", "Librarian",
  // Humanities, Media & Communication
  "Journalist", "Technical Writer", "Author", "Editor", "Translator",
  "Linguist", "Historian", "Archaeologist", "Philosopher", "Theologian",
  "Religious Leader", "Museum Curator", "Archivist",
  "Communications Director", "Social Media Manager", "Content Creator", "Public Relations Specialist",
  // Arts & Creative
  "Filmmaker", "Film Director", "Photographer", "Graphic Designer", "Visual Artist",
  "Musician", "Actor", "Performing Artist", "Fashion Designer", "Interior Designer",
  "Landscape Architect",
  // Agriculture, Environment & Sustainability
  "Park Ranger", "Food Policy Advocate", "Sustainability Consultant",
  "Environmental Consultant",
  // Graduate / Professional School
  "Graduate School",
  // Sports & Wellness
  "Sports Coach", "Fitness Trainer", "Athletic Trainer",
  // Other
  "Pilot", "Military Officer", "Administrative Assistant", "Construction Manager",
]

const QUICK_PICKS = [
  "Software Engineer", "Registered Nurse", "Teacher", "Data Scientist",
  "Psychologist", "Social Worker", "Lawyer", "Business Analyst",
  "Environmental Scientist", "Journalist", "Marketing Manager", "AI Engineer",
  "Medical School", "Graduate School", "Policy Analyst", "UX Designer",
  "Nonprofit Manager", "College Professor", "Financial Analyst", "Filmmaker",
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
