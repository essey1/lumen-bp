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
  // A
  "Abstract Algebra", "Accounting", "Acting", "Activism", "Acoustics",
  "African American Culture", "African American History", "African Studies",
  "Agricultural Policy", "Agriculture", "American Government", "American History",
  "Animal Behavior", "Animal Science", "Animation", "Anthropology",
  "Applied Ethics", "Applied Mathematics", "Appalachian Culture", "Appalachian Studies",
  "Arabic", "Archaeology", "Architecture", "Art Criticism", "Art Education", "Art History",
  "Artificial Intelligence", "Arts", "Asian Cinema", "Asian Culture", "Asian History",
  "Astrophysics", "Astronomy", "Athletics", "Audio Engineering", "Auditing",
  // B
  "Band", "Behavioral Economics", "Behavioral Science", "Biblical Studies",
  "Biochemistry", "Bioethics", "Bioinformatics", "Biology", "Biophysics",
  "Black Literature", "Blockchain", "Botany", "Broadcasting", "Buddhism", "Business",
  // C
  "CAD Design", "Campaign Management", "Ceramics", "Chemistry", "Child Advocacy",
  "Child Development", "Chinese Language", "Choir", "Civil Liberties",
  "Civil Rights", "Climate Change", "Clinical Psychology", "Cloud Computing",
  "Coaching", "Cognitive Science", "Communication", "Community Development",
  "Community Health", "Community Service", "Comparative Literature", "Comparative Politics",
  "Comparative Religion", "Composition", "Conflict Resolution", "Conservation",
  "Constitutional Law", "Content Strategy", "Counseling", "Creative Writing",
  "Criminal Justice", "Criminology", "Crop Science", "Cross-Cultural Communication",
  "Cultural Anthropology", "Cultural Heritage", "Cultural Studies", "Culinary Arts",
  "Curriculum Development", "Cybersecurity",
  // D
  "Data Science", "Data Visualization", "Database Design", "Decision Theory",
  "Demographics", "Design", "Development Economics", "Diaspora Studies",
  "Digital Marketing", "Digital Media", "Directing", "Diversity & Inclusion",
  "Drama", "Drawing",
  // E
  "Early Childhood Education", "East Asian Studies", "Ecology", "Economics",
  "Education", "Educational Technology", "Elections", "Electrical Systems",
  "Elementary Education", "Energy Systems", "Engineering", "English Literature",
  "Entrepreneurship", "Environmental Engineering", "Environmental Policy",
  "Environmental Science", "Epidemiology", "Ethics", "Exercise Science",
  // F
  "Faith & Culture", "Family Counseling", "Farm Management", "Fashion",
  "Feminist Theory", "Film Production", "Film Studies", "Finance",
  "Fine Arts", "Fitness", "Food Policy", "Food Science", "Food Systems",
  "Foreign Languages", "Foreign Policy", "Forensic Science", "French Language",
  // G
  "Game Development", "Game Theory", "Gender & Society", "Gender Equity",
  "Genetics", "Geography", "Geology", "German Language", "GIS & Mapping",
  "Global Health", "Global Markets", "Grammar", "Grant Writing",
  "Graphic Design", "Group Dynamics",
  // H
  "Health Education", "Health Policy", "Healthcare", "Historical Research",
  "History", "Horticulture", "Human Rights", "Human Resources", "Hydrology",
  // I
  "Immigration", "Immunology", "Inequality", "Innovation", "Insurance",
  "Intercultural Communication", "Interfaith Dialogue", "Interior Design",
  "International Law", "International Relations", "Investment", "IoT",
  // J – K
  "Japanese Language", "Journalism", "Kinesiology",
  // L
  "Labor Economics", "Landscape Architecture", "Language Learning", "Law",
  "Leadership", "LGBTQ+ Studies", "Lighting Design", "Linguistics",
  "Literary Analysis", "Literature", "Livestock Management", "Logic", "Logistics",
  // M
  "Mandarin", "Manufacturing", "Marine Biology", "Marine Science",
  "Marketing", "Materials Science", "Mathematics", "Media", "Media Production",
  "Mentoring", "Meteorology", "Microbiology", "Military History",
  "Mixed Media", "Mobile Apps", "Modern History", "Music Education",
  "Music History", "Music Performance", "Music Production", "Music Theory",
  "Music Therapy", "Musical Theatre",
  // N
  "Nanotechnology", "Natural Resource Management", "Negotiation",
  "Neuroscience", "Nonviolent Resistance", "Nuclear Physics",
  "Number Theory", "Nursing", "Nutrition",
  // O
  "Operations", "Operations Research", "Oral History", "Organic Chemistry",
  "Organizational Psychology", "Outdoor Sports",
  // P
  "Painting", "Paleontology", "Pan-Africanism", "Parenting", "Peace Studies",
  "Peacebuilding", "Pediatrics", "Pharmacology", "Philosophy",
  "Philosophy of Mind", "Photography", "Physics", "Physiology",
  "Poetry", "Political Philosophy", "Political Science", "Printmaking",
  "Probability", "Project Management", "Prose Fiction", "Public Administration",
  "Public Health", "Public Policy", "Public Relations", "Public Speaking",
  "Publishing",
  // Q – R
  "Quantum Mechanics", "Race & Ethnicity", "Racial Justice",
  "Renewable Energy", "Religious Studies", "Research", "Restorative Justice",
  "Rhetoric", "Risk Management", "Robotics", "Romance Languages",
  // S
  "Sales", "Screenwriting", "Sculpture", "Secondary Education",
  "Social Activism", "Social Impact", "Social Justice", "Social Media",
  "Social Movements", "Social Theory", "Social Work", "Sociology",
  "Soil Science", "Software Development", "Songwriting", "Sound Design",
  "Spanish Language", "Special Education", "Speech", "Spirituality",
  "Sports Broadcasting", "Sports Performance", "Stage Management", "Startups",
  "Statistics", "Strength & Conditioning", "Studio Art", "Supply Chain",
  "Sustainability", "Sustainable Agriculture", "Sustainable Design",
  "Systems Thinking",
  // T
  "Teaching", "Technical Writing", "Technology", "Textile Arts", "Theatre",
  "Theology", "Thermodynamics", "Toxicology", "Translation",
  // U – V
  "Urban Planning", "Urban Studies", "UX/UI", "Video Production",
  "Virtual Reality", "Voice & Movement",
  // W – Z
  "Water Conservation", "Water Sports", "Web Development",
  "Wildlife Biology", "Wildlife Management", "Women's History",
  "Women's Leadership", "Woodworking", "World History", "World Religions",
  "Writing",
].sort((a, b) => a.localeCompare(b))

// A small curated showcase — just examples to spark ideas
const EXAMPLE_PICKS = [
  "Data Science", "Biology", "Psychology",
  "Creative Writing", "Political Science", "Music Performance",
  "Business", "Environmental Science", "Nursing",
  "Engineering", "Film Studies", "Agriculture",
  "Philosophy", "Theatre", "History",
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
      // Do NOT close the popover — let the user keep picking more interests
      // without having to reopen the dropdown (also prevents scroll-to-top).
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} academic interests •{" "}
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
                    // Disable (but still show) when at max and this item isn't already selected
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
          Quick picks — or search above for hundreds more
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
