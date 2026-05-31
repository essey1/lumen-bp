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

// Sorted alphabetically so the dropdown is easy to navigate
const CAREER_GOALS = [
  "Accountant",
  "Actor",
  "Administrative Assistant",
  "Aerospace Engineer",
  "African Studies Scholar",
  "Agronomist",
  "AI Engineer",
  "AI Researcher",
  "Animal Scientist",
  "Archaeologist",
  "Architect",
  "Archivist",
  "Art Conservator",
  "Art Consultant",
  "Art Educator",
  "Art Historian",
  "Athletic Director",
  "Athletic Trainer",
  "Auditor",
  "Author",
  "Back-End Developer",
  "Band Director",
  "Beekeeper",
  "Biochemist",
  "Bioinformatics Analyst",
  "Biologist",
  "Bioethicist",
  "Biomedical Engineer",
  "Book Editor",
  "Broadcast Journalist",
  "Business Analyst",
  "Business Consultant",
  "CAD Technician",
  "Campaign Manager",
  "Casting Director",
  "Ceramicist",
  "Chaplain",
  "Chemical Engineer",
  "Child Life Specialist",
  "Child Psychologist",
  "Child Welfare Worker",
  "Choir Director",
  "Civil Engineer",
  "Civil Liberties Lawyer",
  "Civil Rights Advocate",
  "Climate Change Analyst",
  "Clinical Ethicist",
  "Clinical Psychologist",
  "Cloud Engineer",
  "College Professor",
  "Community Advocate",
  "Community Health Worker",
  "Community Organizer",
  "Composer",
  "Conflict Mediator",
  "Conservation Biologist",
  "Conservation Planner",
  "Construction Manager",
  "Content Creator",
  "Copywriter",
  "Corrections Counselor",
  "Costume Designer",
  "Counselor",
  "Critical Care Nurse",
  "Cultural Attaché",
  "Cultural Heritage Manager",
  "Cultural Historian",
  "Curriculum Developer",
  "Data Analyst",
  "Data Engineer",
  "Data Scientist",
  "Database Administrator",
  "Demographer",
  "Dental Hygienist",
  "Dental School",
  "Dentist",
  "Development Economist",
  "DevOps Engineer",
  "Dietitian",
  "Diplomat",
  "Diversity & Inclusion Specialist",
  "Diversity Officer",
  "Documentary Filmmaker",
  "Drama Teacher",
  "Early Childhood Teacher",
  "Economic Researcher",
  "Ecologist",
  "Editor",
  "Electrical Engineer",
  "Elementary Teacher",
  "Embedded Systems Engineer",
  "Energy Systems Engineer",
  "Engineering Technologist",
  "Entrepreneur",
  "Environmental Consultant",
  "Environmental Engineer",
  "Environmental Scientist",
  "Epidemiologist",
  "ESL Teacher",
  "Ethics Officer",
  "Event Planner",
  "Exhibition Designer",
  "Exercise Physiologist",
  "Faith Community Leader",
  "Family Services Coordinator",
  "Farm Manager",
  "Fashion Designer",
  "Feminist Researcher",
  "Film Director",
  "Filmmaker",
  "Financial Analyst",
  "Financial Mathematician",
  "Flight Nurse",
  "Food Chemist",
  "Food Policy Advocate",
  "Food Scientist",
  "Food Systems Manager",
  "Foreign Language Teacher",
  "Foreign Service Officer",
  "Forensic Chemist",
  "Forensic Nurse",
  "Forensic Scientist",
  "Front-End Developer",
  "Full-Stack Developer",
  "Gallery Manager",
  "Game Developer",
  "Gender Equity Consultant",
  "Geneticist",
  "Geologist",
  "Gerontologist",
  "GIS Analyst",
  "Government Analyst",
  "Graduate School",
  "Grant Writer",
  "Graphic Designer",
  "Health Administrator",
  "Health Educator",
  "Health Policy Analyst",
  "High School Teacher",
  "Historic Preservation Specialist",
  "Historian",
  "History Teacher",
  "Horticulturist",
  "Hospital Administrator",
  "Hospital Chaplain",
  "Hotel Manager",
  "Human Resources Manager",
  "Human Rights Advocate",
  "Humanitarian Aid Worker",
  "Hydrologist",
  "Illustrator",
  "Immigration Specialist",
  "Industrial Chemist",
  "Industrial Designer",
  "Information Security Officer",
  "Instructional Designer",
  "Intelligence Analyst",
  "Interfaith Minister",
  "Interior Designer",
  "International Development",
  "International Relations Specialist",
  "Interpreter",
  "Investment Banker",
  "IT Specialist",
  "Judge",
  "Labor & Delivery Nurse",
  "Labor Economist",
  "Lactation Consultant",
  "Landscape Architect",
  "Language Instructor",
  "Law School",
  "Lawyer",
  "LGBTQ+ Advocate",
  "Librarian",
  "Lighting Designer",
  "Literary Agent",
  "Lobbyist",
  "Localization Specialist",
  "Logistics Manager",
  "Magazine Editor",
  "Manufacturing Engineer",
  "Marine Biologist",
  "Market Research Analyst",
  "Marketing Manager",
  "Marriage & Family Therapist",
  "Materials Scientist",
  "Math Educator",
  "Mechanical Engineer",
  "Medical Doctor",
  "Medical School",
  "Meteorologist",
  "Microbiologist",
  "Middle School Teacher",
  "Military Officer",
  "Ministry Coordinator",
  "Mobile Developer",
  "Muralist",
  "Museum Curator",
  "Music Producer",
  "Music Teacher",
  "Music Therapist",
  "Musician",
  "Natural Resource Manager",
  "Neonatal Nurse",
  "Network Administrator",
  "Neuroscientist",
  "News Anchor",
  "Nonprofit Director",
  "Nonprofit Manager",
  "Nuclear Engineer",
  "Nuclear Physicist",
  "Nurse Practitioner",
  "Nursing Professor",
  "Nutritionist",
  "Occupational Therapist",
  "Operations Manager",
  "Operations Researcher",
  "Optometrist",
  "Oral Historian",
  "Paleontologist",
  "Paralegal",
  "Park Ranger",
  "Peacebuilder",
  "Peace Corps Volunteer",
  "Pediatric Nurse",
  "Petroleum Engineer",
  "Pharmaceutical Scientist",
  "Pharmacist",
  "Philosopher",
  "Philosophy Teacher",
  "Photographer",
  "Physical Therapist",
  "Physician Assistant",
  "Physicist",
  "Pilot",
  "Podcast Producer",
  "Policy Analyst",
  "Policy Researcher",
  "Politician",
  "Polymer Scientist",
  "PR Specialist",
  "Product Designer",
  "Product Developer",
  "Product Manager",
  "Project Manager",
  "Psychiatrist",
  "Psychologist",
  "Psychotherapist",
  "Public Defender",
  "Public Health Inspector",
  "Public Health Worker",
  "Quality Engineer",
  "Quantum Computing Researcher",
  "Radiologist",
  "Real Estate Agent",
  "Recording Artist",
  "Recreation Therapist",
  "Recruiter",
  "Refugee Resettlement Specialist",
  "Registered Nurse",
  "Religious Educator",
  "Research Scientist",
  "Robotics Engineer",
  "Sales Manager",
  "School Counselor",
  "School Principal",
  "Screenwriter",
  "Secondary Education Teacher",
  "Semiconductor Engineer",
  "Seminary",
  "Session Musician",
  "Set Designer",
  "Social Justice Advocate",
  "Social Media Manager",
  "Social Worker",
  "Soil Scientist",
  "Software Engineer",
  "Songwriter",
  "Sound Engineer",
  "Special Education Teacher",
  "Speechwriter",
  "Sport Psychologist",
  "Sports Broadcaster",
  "Sports Manager",
  "Stage Manager",
  "Startup Founder",
  "State Representative",
  "Statistician",
  "Strength & Conditioning Coach",
  "Studio Artist",
  "Substance Abuse Counselor",
  "Supply Chain Manager",
  "Surgeon",
  "Sustainability Consultant",
  "Sustainability Manager",
  "Systems Administrator",
  "Teaching Assistant",
  "Technical Project Manager",
  "Technical Writer",
  "Theatre Director",
  "Theologian",
  "Therapist",
  "Title IX Coordinator",
  "Trade Analyst",
  "Translation Specialist",
  "Translator",
  "Travel Nurse",
  "UI Designer",
  "Urban Planner",
  "UX Designer",
  "Veterinary School",
  "Video Producer",
  "Voice Actor",
  "Water Quality Specialist",
  "Web Developer",
  "Wildlife Biologist",
  "Wildlife Conservationist",
  "Women's Center Director",
  "Women's Rights Advocate",

  // Tech & Engineering (additional)
  "Accessibility Engineer", "Acoustic Engineer", "Agricultural Engineer",
  "Android Developer", "AR/VR Developer", "Automation Engineer",
  "Biomechanical Engineer", "Bridge Engineer", "Blockchain Developer",
  "Chatbot Developer", "Cloud Architect", "Computer Vision Engineer",
  "Controls Engineer", "Cryptographer", "Cybersecurity Analyst",
  "Data Architect", "Data Visualization Specialist", "Deep Learning Engineer",
  "Digital Forensics Analyst", "Drone Engineer", "Firmware Engineer",
  "Game Designer", "Geotechnical Engineer", "Hardware Engineer",
  "Highway Engineer", "HVAC Engineer", "Instrumentation Engineer",
  "iOS Developer", "IT Auditor", "IT Manager", "IT Project Manager",
  "Machine Learning Engineer", "Mechatronics Engineer", "Mining Engineer",
  "MLOps Engineer", "Naval Architect", "Network Engineer",
  "NLP Engineer", "Optical Engineer", "Platform Engineer",
  "Power Systems Engineer", "Process Engineer", "Prompt Engineer",
  "QA Engineer", "Reliability Engineer", "Safety Engineer",
  "Security Analyst", "Security Engineer", "Site Reliability Engineer",
  "Software Architect", "Solutions Architect", "Structural Engineer",
  "Technical Recruiter", "Test Engineer", "Transportation Engineer",
  "Wind Energy Engineer",

  // Science & Research (additional)
  "Astrobiologist", "Astronomer", "Astrophysicist", "Atmospheric Scientist",
  "Computational Scientist", "Conservation Scientist", "Crystallographer",
  "Forensic Biologist", "Geochemist", "Geophysicist",
  "Immunologist", "Marine Chemist", "Molecular Biologist",
  "Oceanographer", "Ornithologist", "Particle Physicist",
  "Planetary Scientist", "Primatologist", "Seismologist",
  "Virologist", "Volcanologist", "Zoologist",

  // Healthcare (additional)
  "Anesthesiologist", "Cardiologist", "Chiropractor",
  "Clinical Researcher", "Dermatologist", "Doula",
  "Emergency Physician", "Endocrinologist", "Gastroenterologist",
  "Genetic Counselor", "Health Informatics Specialist",
  "Lab Technician", "Massage Therapist", "Medical Coder",
  "Mental Health Counselor", "Midwife", "Naturopath",
  "Neurologist", "Obstetrician", "Oncologist",
  "Pediatrician", "Podiatrist", "Pulmonologist",
  "Radiation Therapist", "Radiographer", "Rehabilitation Specialist",
  "Rheumatologist", "Sleep Specialist", "Sports Physician", "Urologist",

  // Business & Finance (additional)
  "Actuary", "Brand Strategist", "Budget Analyst",
  "Business Development Manager", "Chief of Staff",
  "Compensation Analyst", "Corporate Trainer", "Credit Analyst",
  "Customer Success Manager", "E-Commerce Manager",
  "Financial Planner", "Fraud Analyst", "Fund Manager",
  "Growth Hacker", "Hedge Fund Manager", "Insurance Agent",
  "Management Accountant", "Management Consultant",
  "M&A Analyst", "Operations Analyst", "Portfolio Manager",
  "Pricing Analyst", "Private Equity Analyst", "Procurement Manager",
  "Revenue Analyst", "Risk Analyst", "Tax Consultant",
  "Treasury Analyst", "Venture Capitalist",

  // Arts & Creative (additional)
  "3D Animator", "Animation Director", "Art Director",
  "Book Illustrator", "Brand Designer", "Children's Book Author",
  "Choreographer", "Colorist", "Comic Book Artist",
  "Concept Artist", "Dance Teacher", "Digital Artist",
  "Fashion Illustrator", "Film Editor", "Glass Artist",
  "Motion Graphics Designer", "Printmaker", "Production Designer",
  "Prop Maker", "Scenic Painter", "Storyboard Artist",
  "Tattoo Artist", "Textile Designer", "Type Designer",
  "Visual Development Artist", "Weaver",

  // Education (additional)
  "Academic Advisor", "Academic Dean", "Admissions Counselor",
  "Adult Literacy Educator", "Associate Professor",
  "College Registrar", "Community College Instructor",
  "Dean of Students", "Education Administrator",
  "Education Consultant", "Education Policy Analyst",
  "Financial Aid Advisor", "Head of School",
  "Higher Education Researcher", "K-12 Administrator",
  "Language Arts Teacher", "Learning Specialist",
  "Music Professor", "Online Course Designer", "Outdoor Educator",
  "Reading Specialist", "School Librarian", "School Psychologist",
  "STEM Coordinator", "Student Affairs Director",
  "Study Abroad Advisor", "Teaching Fellow",
  "Vice Principal", "Writing Center Director",

  // Social Work, Policy & Law (additional)
  "Affordable Housing Advocate", "Child Protective Services Worker",
  "City Council Member", "City Planner", "Community Health Educator",
  "Counter-Terrorism Analyst", "Crime Analyst", "Criminal Defense Attorney",
  "Economic Justice Advocate", "Elections Administrator",
  "Environmental Attorney", "Environmental Justice Advocate",
  "Foreign Policy Analyst", "Homeless Services Coordinator",
  "Housing Policy Analyst", "Human Trafficking Advocate",
  "Immigration Attorney", "International Aid Worker",
  "Juvenile Justice Counselor", "Labor Union Organizer",
  "Legislative Aide", "Mediator", "National Security Analyst",
  "Nonprofit Development Director", "Nonprofit Program Officer",
  "Peace & Conflict Researcher", "Political Consultant",
  "Poverty Researcher", "Prison Reform Advocate",
  "Probation Officer", "Program Evaluator",
  "Public Interest Attorney", "Racial Equity Consultant",
  "Refugee Advocate", "Social Entrepreneur", "Social Impact Analyst",
  "Think Tank Researcher", "Trauma Counselor", "Victim Advocate",
  "Youth Development Worker", "Youth Minister",

  // Food, Agriculture & Environment (additional)
  "Agricultural Extension Agent", "Aquaculture Specialist",
  "Carbon Analyst", "Carbon Market Specialist",
  "Chef", "Clean Energy Developer", "Climate Adaptation Specialist",
  "Climate Researcher", "Community Garden Director",
  "Conservation Director", "Coral Reef Ecologist",
  "Ecological Consultant", "Ecological Modeler", "Energy Auditor",
  "Environmental Data Scientist", "Environmental Educator",
  "Environmental Impact Assessor", "ESG Analyst",
  "Farm-to-Table Chef", "Fermentation Scientist",
  "Food Bank Director", "Food Educator", "Food Innovation Specialist",
  "Food Policy Researcher", "Food Security Analyst",
  "Food Technologist", "Food Waste Consultant",
  "Forest Manager", "Green Building Consultant",
  "Groundwater Scientist", "Herbalist",
  "Land Trust Manager", "Marine Conservationist",
  "National Park Ranger", "Ocean Policy Advocate",
  "Pastry Chef", "Plant Breeder",
  "Precision Agriculture Specialist", "Rancher",
  "Renewable Energy Developer", "Restaurant Manager",
  "Soil Conservation Specialist", "Sustainability Officer",
  "Sustainable Agriculture Consultant", "Urban Farmer",
  "Waste Management Specialist", "Water Resource Manager",
  "Wildlife Manager", "Wildlife Rehabilitator", "Wine Educator",

  // Media & Communication (additional)
  "Book Publicist", "Comedy Writer", "Content Strategist",
  "Documentary Journalist", "Fashion Writer", "Film Critic",
  "Freelance Journalist", "Investigative Reporter",
  "Literary Critic", "Media Consultant", "Media Planner",
  "Morning Show Host", "Multimedia Journalist", "Music Critic",
  "News Editor", "News Producer", "Podcast Host",
  "Political Commentator", "Radio Host", "Radio Journalist",
  "Science Journalist", "Social Media Strategist",
  "Sports Journalist", "Talk Show Host", "Travel Writer",
  "TV Producer",
].sort((a, b) => a.localeCompare(b))

// Small curated showcase — just a sample to show what's searchable
const EXAMPLE_PICKS = [
  "Software Engineer", "Registered Nurse", "Elementary Teacher",
  "Data Scientist", "Psychologist", "Social Worker",
  "Lawyer", "Entrepreneur", "Environmental Scientist",
  "Journalist", "Financial Analyst", "Medical School",
  "Graduate School", "Filmmaker", "Agronomist",
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
      // Keep the popover open so the user can continue browsing / picking more
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
                : "Search all career goals…"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Type to search career goals…" autoFocus />
            <CommandList>
              <CommandEmpty>No career goal found.</CommandEmpty>
              <CommandGroup>
                {CAREER_GOALS.map(id => (
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
