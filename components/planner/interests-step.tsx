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
  // Science — specific sub-fields
  "Anatomy", "Astrophysics", "Biochemistry", "Bioinformatics", "Botany",
  "Cell Biology", "Conservation Biology", "Ecology", "Epidemiology", "Evolutionary Biology",
  "Genetics", "Geology", "GIS & Mapping", "Hydrology", "Immunology",
  "Marine Biology", "Materials Science", "Meteorology", "Microbiology",
  "Nanotechnology", "Neuroscience", "Nuclear Physics", "Organic Chemistry",
  "Paleontology", "Pharmacology", "Physiology", "Quantum Mechanics",
  "Soil Science", "Thermodynamics", "Toxicology", "Wildlife Biology",

  // Computing & Technology
  "Artificial Intelligence", "Blockchain", "Cloud Computing", "Cybersecurity",
  "Data Analytics", "Data Science", "Data Visualization", "Database Design",
  "Embedded Systems", "Game Development", "Information Systems", "IoT",
  "Machine Learning", "Mobile App Development", "Robotics", "Software Architecture",
  "Software Development", "UI/UX Design", "Virtual Reality", "Web Development",

  // Engineering & Making
  "3D Printing", "CAD Design", "Electrical Engineering", "Electrical Systems",
  "Manufacturing", "Mechanical Design", "Mechatronics", "Product Design",
  "Renewable Energy Systems", "Structural Engineering", "Sustainable Design", "Woodworking",

  // Math & Logic
  "Abstract Algebra", "Actuarial Science", "Applied Mathematics",
  "Game Theory", "Logic", "Number Theory", "Operations Research",
  "Probability", "Statistics", "Systems Thinking",

  // Health & Medicine
  "Community Health", "Exercise Science", "Global Health",
  "Health Education", "Health Policy", "Kinesiology", "Mental Health",
  "Nutrition", "Pediatrics", "Physical Therapy", "Public Health",
  "Sports Medicine", "Strength & Conditioning",

  // Psychology — specific areas
  "Behavioral Science", "Child Development", "Cognitive Science", "Counseling",
  "Family Counseling", "Forensic Psychology", "Gerontology",
  "Organizational Psychology", "Social Psychology",

  // Business & Economics
  "Accounting", "Behavioral Economics", "Content Strategy",
  "Digital Marketing", "Economics", "Entrepreneurship", "Finance",
  "Financial Modeling", "Grant Writing", "Human Resources",
  "Innovation", "Labor Economics", "Marketing Strategy", "Negotiation",
  "Operations Management", "Project Management",
  "Risk Management", "Supply Chain Management",

  // Agriculture & Food
  "Agricultural Policy", "Animal Behavior", "Animal Science",
  "Beekeeping", "Crop Science", "Farm Management",
  "Food Policy", "Food Science", "Food Systems",
  "Horticulture", "Livestock Management", "Natural Resource Management",
  "Sustainable Agriculture", "Water Conservation", "Wildlife Management",

  // Environment & Sustainability
  "Climate Change", "Ecological Restoration", "Environmental Policy",
  "Renewable Energy", "Sustainability",

  // Education
  "Child Advocacy", "Curriculum Development", "Early Childhood Education",
  "Educational Technology", "Mentoring", "Special Education", "Teaching",

  // Arts & Craft
  "Animation", "Ceramics", "Drawing", "Fashion Design",
  "Film Production", "Graphic Design", "Industrial Design",
  "Interior Design", "Landscape Architecture", "Lighting Design",
  "Mixed Media", "Painting", "Photography", "Printmaking",
  "Sculpture", "Set Design", "Stage Management",
  "Studio Art", "Textile Arts", "Video Production",

  // Music & Performing Arts
  "Band", "Choir", "Composition", "Drama", "Film Studies",
  "Music Education", "Music History", "Music Performance",
  "Music Production", "Music Theory", "Music Therapy",
  "Musical Theatre", "Songwriting", "Sound Design", "Theatre",
  "Voice & Movement",

  // Writing & Literature
  "Comparative Literature", "Creative Writing", "Journalism",
  "Literary Analysis", "Oral History", "Poetry", "Prose Fiction",
  "Public Speaking", "Publishing", "Rhetoric", "Screenwriting",
  "Technical Writing",

  // Language & Culture
  "Chinese Language", "Cross-Cultural Communication", "French Language",
  "German Language", "Intercultural Communication", "Japanese Language",
  "Language Learning", "Linguistics", "Spanish Language", "Translation",

  // History & Culture
  "African American Culture", "African American History", "African Studies",
  "American History", "Appalachian Culture", "Appalachian Studies",
  "Archaeology", "Asian Cinema", "Asian Culture", "Asian History",
  "Black Literature", "Cultural Anthropology", "Cultural Heritage",
  "Cultural Studies", "Diaspora Studies", "East Asian Studies",
  "Historical Research", "Military History", "Modern History", "World History",

  // Law, Justice & Policy
  "Civil Liberties", "Civil Rights", "Conflict Resolution", "Constitutional Law",
  "Criminal Justice", "Criminology", "Foreign Policy", "Forensic Science",
  "Human Rights", "Immigration", "International Law", "International Relations",
  "Nonviolent Resistance", "Pan-Africanism", "Peace Studies", "Peacebuilding",
  "Public Administration", "Public Policy", "Restorative Justice",
  "Social Activism", "Social Justice", "Social Movements",

  // Communication & Media
  "Audio Engineering", "Broadcasting", "Communication",
  "Digital Media", "Directing", "Media Production",
  "Public Relations", "Social Media", "Sports Broadcasting",

  // Social Science
  "Community Development", "Demographics", "Development Economics",
  "Diversity & Inclusion", "Inequality", "Political Science",
  "Race & Ethnicity", "Racial Justice", "Social Theory",
  "Sociology", "Urban Planning", "Urban Studies",

  // Philosophy & Religion
  "Applied Ethics", "Biblical Studies", "Bioethics", "Buddhism",
  "Comparative Religion", "Faith & Culture", "Feminist Theory",
  "Gender & Society", "Gender Equity", "Interfaith Dialogue",
  "LGBTQ+ Studies", "Philosophy of Mind", "Political Philosophy",
  "Religious Studies", "Social Work", "Spirituality",
  "Theology", "Women's History", "Women's Leadership", "World Religions",

  // Sports & Fitness
  "Athletic Coaching", "Outdoor Sports", "Sports Performance", "Water Sports",
].sort((a, b) => a.localeCompare(b))

// Specific, relatable examples spanning different areas
const EXAMPLE_PICKS = [
  "Child Development",
  "Robotics",
  "Woodworking",
  "Anatomy",
  "Criminal Justice",
  "Graphic Design",
  "Food Science",
  "Songwriting",
  "Entrepreneurship",
  "Machine Learning",
  "Creative Writing",
  "Ecology",
  "Sports Performance",
  "Community Development",
  "Photography",
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
      onChange(selected.filter(c => c !== id))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} specific interests •{" "}
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
              <button
                type="button"
                onClick={() => toggle(id)}
                className="ml-1 rounded-full hover:bg-muted"
              >
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
            {selected.length >= MAX_SELECTIONS
              ? "Maximum selections reached"
              : selected.length > 0
                ? `${selected.length} selected — search to add more…`
                : "Search all interests…"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Type to search interests…" autoFocus />
            <CommandList>
              <CommandEmpty>No interest found.</CommandEmpty>
              <CommandGroup>
                {INTERESTS.map(id => (
                  <CommandItem
                    key={id}
                    value={id}
                    onSelect={() => toggle(id)}
                    className={cn(!selected.includes(id) && selected.length >= MAX_SELECTIONS && "opacity-40 pointer-events-none")}
                  >
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
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Quick picks — or search above for more
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_PICKS.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              disabled={!selected.includes(id) && selected.length >= MAX_SELECTIONS}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                selected.includes(id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                !selected.includes(id) && selected.length >= MAX_SELECTIONS && "cursor-not-allowed opacity-40"
              )}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
