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
  // ── Technology & Computing (CSC, ETAD)
  "Software Engineer", "Full-Stack Developer", "Front-End Developer", "Back-End Developer",
  "Mobile Developer", "Web Developer", "Game Developer",
  "Data Scientist", "Data Analyst", "Data Engineer", "Machine Learning Engineer",
  "AI Engineer", "AI Researcher",
  "Cybersecurity Analyst", "Penetration Tester", "Information Security Officer",
  "Cloud Engineer", "DevOps Engineer", "Systems Administrator",
  "Database Administrator", "Network Administrator", "IT Specialist",
  "UX Designer", "Product Designer", "UI Designer",
  "Product Manager", "Technical Project Manager",
  "Robotics Engineer", "Embedded Systems Engineer",
  "CAD Technician", "Engineering Technologist", "Manufacturing Engineer",
  "Quality Engineer", "Product Developer",

  // ── Engineering & Physical Sciences (PHY, PHY_ENG, ETAD, CHM, MAT)
  "Mechanical Engineer", "Electrical Engineer", "Civil Engineer",
  "Chemical Engineer", "Biomedical Engineer", "Environmental Engineer",
  "Aerospace Engineer", "Nuclear Engineer", "Petroleum Engineer",
  "Structural Technologist", "Energy Systems Engineer",
  "Semiconductor Engineer", "Photovoltaic Engineer",
  "Industrial Designer", "Architect", "Materials Scientist",
  "Physicist", "Astrophysicist", "Nuclear Physicist", "Optics Researcher",
  "Quantum Computing Researcher", "Astronomer", "Meteorologist",
  "Cryptographer", "Operations Researcher", "Statistician",
  "Math Educator", "Financial Mathematician",

  // ── Life Sciences & Agriculture (BIO, CHM, ANR, SENS)
  "Biologist", "Ecologist", "Marine Biologist", "Wildlife Biologist",
  "Conservation Biologist", "Geneticist", "Neuroscientist",
  "Microbiologist", "Biochemist", "Immunologist",
  "Forensic Scientist", "Forensic Chemist",
  "Lab Technician", "Research Scientist", "Bioinformatics Analyst",
  "Agricultural Scientist", "Agronomist", "Animal Scientist",
  "Farm Manager", "Horticulturist", "Soil Scientist",
  "Natural Resource Manager", "Range Manager", "Beekeeper",
  "Food Scientist", "Food Systems Manager",
  "Chemist", "Pharmaceutical Scientist", "Industrial Chemist",
  "Food Chemist", "Cosmetic Chemist", "Polymer Scientist",
  "Geologist", "Paleontologist",
  "Environmental Scientist", "Climate Change Analyst",
  "GIS Analyst", "Hydrologist", "Air Quality Specialist",
  "Water Quality Specialist", "Sustainability Manager",
  "Conservation Planner",

  // ── Healthcare & Medicine (NUR, HLT, HHP, BIO, CHM)
  "Registered Nurse", "Nurse Practitioner", "Critical Care Nurse",
  "Pediatric Nurse", "Labor & Delivery Nurse", "Flight Nurse",
  "Forensic Nurse", "Travel Nurse", "Nursing Professor",
  "Medical Doctor", "Surgeon", "Psychiatrist",
  "Physician Assistant", "Pharmacist",
  "Dentist", "Dental Hygienist", "Optometrist", "Radiologist",
  "Physical Therapist", "Occupational Therapist",
  "Speech Therapist", "Recreation Therapist",
  "Dietitian", "Nutritionist", "Lactation Consultant",
  "Athletic Trainer", "Strength & Conditioning Coach",
  "Exercise Physiologist", "Sport Psychologist",
  "Health Administrator", "Hospital Administrator",
  "Public Health Worker", "Community Health Worker",
  "Health Educator", "Health Policy Analyst",
  "Public Health Inspector", "Epidemiologist",
  "Medical School", "Dental School", "Veterinary School",

  // ── Mental Health & Social Services (PSY, SOC, CFS, PSJ, WGS)
  "Psychologist", "Clinical Psychologist", "Child Psychologist",
  "Counselor", "Therapist", "Psychotherapist",
  "Marriage & Family Therapist", "School Counselor",
  "Substance Abuse Counselor", "Corrections Counselor",
  "Gerontologist", "Social Worker", "Child Welfare Worker",
  "Child Life Specialist", "Family Services Coordinator",
  "Community Organizer", "Human Rights Advocate",
  "Peace Corps Volunteer", "Peacebuilder", "Conflict Mediator",
  "Refugee Resettlement Specialist", "Humanitarian Aid Worker",
  "Policy Researcher",

  // ── Education (EDS, AFR, MUS, THR, HHP, REL)
  "Elementary Teacher", "Middle School Teacher", "High School Teacher",
  "Early Childhood Teacher", "Special Education Teacher",
  "ESL Teacher", "Foreign Language Teacher",
  "School Administrator", "School Principal",
  "Curriculum Developer", "Instructional Designer",
  "College Professor", "Librarian", "Teaching Assistant",
  "History Teacher", "Drama Teacher", "Music Teacher",
  "Art Educator", "Math Educator",

  // ── Business, Finance & Management (BUS, ECO, COM, PSY)
  "Entrepreneur", "Startup Founder", "Business Analyst", "Business Consultant",
  "Marketing Manager", "Brand Manager", "Digital Marketer",
  "Sales Manager", "Account Manager",
  "Financial Analyst", "Investment Banker", "Actuary",
  "Accountant", "Auditor", "Tax Advisor",
  "Development Economist", "Economic Researcher", "Labor Economist",
  "Market Research Analyst", "Trade Analyst",
  "Real Estate Agent", "Supply Chain Manager", "Logistics Manager",
  "Human Resources Manager", "Recruiter",
  "Operations Manager", "Project Manager",
  "Hotel Manager", "Event Planner", "Sports Manager",
  "Athletic Director",

  // ── Law, Policy & Government (PSC, PSJ, SOC, AFR)
  "Lawyer", "Civil Liberties Lawyer", "Public Defender",
  "Judge", "Paralegal",
  "Policy Analyst", "Politician", "Government Analyst",
  "Intelligence Analyst", "Campaign Manager",
  "Lobbyist", "City Council Member", "State Representative",
  "Diplomat", "Foreign Service Officer", "Cultural Attaché",
  "Urban Planner", "Demographer", "Immigration Specialist",
  "Nonprofit Manager", "Nonprofit Director",
  "Diversity Officer", "Title IX Coordinator",
  "Diversity & Inclusion Specialist",
  "Law School", "International Development",

  // ── Humanities, Communication & Media (COM, ENG, HIS, PHI, REL)
  "Journalist", "Broadcast Journalist", "News Anchor",
  "Sports Broadcaster", "Podcast Producer",
  "Technical Writer", "Copywriter", "Grant Writer",
  "Speechwriter", "Screenwriter",
  "Author", "Editor", "Book Editor", "Magazine Editor",
  "Literary Agent", "Publishing Professional",
  "Translator", "Interpreter", "Localization Specialist",
  "Linguist", "Language Instructor",
  "Historian", "Oral Historian", "Historic Preservation Specialist",
  "Archaeologist", "Philosopher", "Bioethicist",
  "Clinical Ethicist", "Ethics Officer", "Business Ethicist",
  "Philosophy Teacher",
  "Theologian", "Religious Educator", "Chaplain",
  "Hospital Chaplain", "Interfaith Minister",
  "Faith Community Leader", "Ministry Coordinator",
  "Communications Director", "PR Specialist",
  "Social Media Manager", "Content Creator",

  // ── Arts, Theatre & Music (ART, ARH, MUS, THR, COM)
  "Filmmaker", "Film Director", "Documentary Filmmaker",
  "Video Producer", "Casting Director", "Stage Manager",
  "Theatre Director", "Choreographer", "Voice Actor",
  "Set Designer", "Costume Designer", "Lighting Designer",
  "Photographer", "Graphic Designer", "Illustrator",
  "Muralist", "Studio Artist", "Ceramicist",
  "Fashion Designer", "Interior Designer",
  "Art Historian", "Art Conservator", "Art Consultant",
  "Gallery Manager", "Exhibition Designer",
  "Museum Curator", "Cultural Heritage Manager",
  "Archivist",
  "Musician", "Composer", "Songwriter",
  "Recording Artist", "Session Musician",
  "Sound Engineer", "Music Producer", "Music Therapist",
  "Choir Director", "Band Director",
  "Performing Artist", "Actor",

  // ── African & African American Studies (AFR)
  "Civil Rights Advocate", "Cultural Historian",
  "African Studies Scholar", "Community Advocate",
  "Social Justice Advocate",

  // ── Asian & International Studies (AST)
  "International Relations Specialist", "Translation Specialist",

  // ── Women's, Gender & Sexuality Studies (WGS)
  "Gender Equity Consultant", "LGBTQ+ Advocate",
  "Women's Rights Advocate", "Women's Center Director",
  "Feminist Researcher",

  // ── Agriculture & Environment
  "Park Ranger", "Food Policy Advocate", "Sustainability Consultant",
  "Environmental Consultant", "Wildlife Conservationist",

  // ── Graduate / Professional School
  "Graduate School", "Seminary",

  // ── Other
  "Pilot", "Military Officer", "Administrative Assistant",
  "Construction Manager", "Landscape Architect",
]

const QUICK_PICKS = [
  "Software Engineer", "Registered Nurse", "Elementary Teacher", "Data Scientist",
  "Psychologist", "Social Worker", "Lawyer", "Business Analyst",
  "Environmental Scientist", "Journalist", "Marketing Manager", "AI Engineer",
  "Medical School", "Graduate School", "Policy Analyst", "Music Teacher",
  "Nonprofit Manager", "College Professor", "Financial Analyst", "Filmmaker",
  "Community Organizer", "Agronomist", "Music Therapist", "Drama Teacher",
  "Foreign Service Officer", "Health Educator",
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
