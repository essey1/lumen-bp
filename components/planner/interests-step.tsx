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
  "Aerobiology", "Anatomy", "Analytical Chemistry", "Arachnology",
  "Astrobiology", "Astrophysics", "Atmospheric Science",
  "Behavioral Ecology", "Biochemistry", "Biogeography", "Bioinformatics",
  "Biomaterials", "Biomimicry", "Biophotonics", "Biophysics", "Botany",
  "Carbon Science", "Cell Biology", "Chemical Biology", "Chronobiology",
  "Climate Science", "Computational Biology", "Computational Chemistry",
  "Conservation Biology", "Cryobiology", "Dendrology",
  "Ecology", "Electrochemistry", "Entomology", "Epidemiology",
  "Environmental Chemistry", "Environmental Toxicology",
  "Ethology", "Evolutionary Biology", "Experimental Physics", "Extremophile Biology",
  "Forensic Chemistry", "Freshwater Biology", "Genetics", "Geology",
  "Geophysics", "GIS & Mapping", "High Energy Physics", "Histology",
  "Herpetology", "Hydrology", "Ichthyology", "Immunology",
  "Inorganic Chemistry", "Invertebrate Biology", "Lichenology",
  "Mammalogy", "Marine Biology", "Materials Science", "Mathematical Biology",
  "Meteorology", "Microbiology", "Molecular Biology", "Molecular Genetics",
  "Morphology", "Mycology", "Nanotechnology", "Neuroscience",
  "Nuclear Physics", "Oceanography", "Organic Chemistry",
  "Ornithology", "Paleontology", "Parasitology", "Pharmacology",
  "Physical Chemistry", "Photonics", "Physiology",
  "Planetary Science", "Plant Pathology", "Polymer Science",
  "Population Genetics", "Primatology", "Quantum Mechanics",
  "Remote Sensing", "Sedimentology", "Seismology", "Soil Science",
  "Solar Physics", "Space Exploration", "Spectroscopy", "Stratigraphy",
  "Synthetic Biology", "Systematics", "Thermodynamics", "Toxicology",
  "Virology", "Volcanology", "Wildlife Biology", "Zoology",

  // Computing & Technology
  "3D Modeling", "Accessibility Technology", "Agile Development", "API Design",
  "Artificial Intelligence", "Augmented Reality", "Autonomous Systems",
  "Blockchain", "Browser Engineering", "Chatbot Development",
  "Cloud Computing", "Compiler Design", "Computer Architecture",
  "Computer Graphics", "Computer Networks", "Computer Simulation", "Computer Vision",
  "Continuous Integration", "Cryptography", "Cybersecurity",
  "Data Analytics", "Data Engineering", "Data Pipelines", "Data Science",
  "Data Visualization", "Data Warehousing", "Database Design",
  "Deep Learning", "DevOps", "Digital Forensics", "Distributed Systems",
  "Edge Computing", "Embedded Systems", "Ethical Hacking",
  "Federated Learning", "Firmware Development", "Game Development",
  "Graph Databases", "Hardware Security", "High-Performance Computing",
  "Human-Computer Interaction", "Information Architecture", "Information Systems",
  "Infrastructure Engineering", "IoT", "Knowledge Graphs",
  "Language Models", "Machine Learning", "Machine Translation",
  "Malware Analysis", "Memory Systems", "Microcontroller Programming",
  "Mixed Reality", "MLOps", "Mobile App Development",
  "Motion Planning", "Multi-Agent Systems", "Natural Language Processing",
  "Open Source Development", "Operating Systems", "Optimization Algorithms",
  "Parallel Computing", "Privacy Engineering", "Programming Languages",
  "Quantum Computing", "Real-Time Systems", "Reinforcement Learning",
  "Reverse Engineering", "Robotics", "Robotics Simulation",
  "Search Engines", "Semantic Web", "Signal Processing",
  "Smart Grid Technology", "Software Architecture", "Software Development",
  "Software Testing", "Speech Recognition", "System Administration",
  "Systems Programming", "Time Series Analysis", "UI/UX Design",
  "User Research", "Version Control", "Virtual Reality",
  "Web Accessibility", "Web Development", "Web Security",
  "Wireless Networks", "XR Development",

  // Engineering & Making
  "3D Printing", "Acoustic Engineering", "Aerospace Engineering",
  "Architectural Engineering", "Automation", "Biomedical Engineering",
  "Biomechanics", "Bridge Design", "Building Systems",
  "CAD Design", "Chemical Engineering", "Civil Engineering",
  "Control Systems", "Corrosion Engineering", "Electrical Engineering",
  "Electrical Systems", "Environmental Engineering", "Fire Safety Engineering",
  "Fluid Dynamics", "Food Engineering", "Forensic Engineering",
  "Geotechnical Engineering", "Hydraulic Engineering",
  "Industrial Engineering", "Laser Engineering", "Manufacturing",
  "Marine Engineering", "Materials Testing", "Mechanical Design",
  "Mechatronics", "Mining Engineering", "Naval Architecture",
  "Nuclear Engineering", "Paper Engineering", "Petroleum Engineering",
  "Photovoltaics", "Power Electronics", "Precision Engineering",
  "Product Design", "Rail Engineering", "Renewable Energy Systems",
  "Safety Engineering", "Semiconductor Engineering", "Structural Engineering",
  "Sustainable Design", "Systems Engineering", "Thermal Engineering",
  "Traffic Engineering", "Water Treatment Engineering",
  "Wind Energy Engineering", "Woodworking",

  // Math & Logic
  "Abstract Algebra", "Actuarial Science", "Algebraic Geometry",
  "Algebraic Topology", "Applied Mathematics", "Approximation Theory",
  "Automated Theorem Proving", "Category Theory", "Chaos Theory",
  "Coding Theory", "Combinatorics", "Complex Analysis",
  "Computational Mathematics", "Cryptanalysis", "Differential Equations",
  "Discrete Mathematics", "Dynamic Programming", "Ergodic Theory",
  "Financial Mathematics", "Formal Logic", "Fractal Geometry",
  "Functional Analysis", "Game Theory", "Geometric Analysis",
  "Graph Theory", "Information Theory", "Integer Programming",
  "Knot Theory", "Lie Theory", "Linear Algebra",
  "Logic", "Mathematical Finance", "Mathematical Modeling",
  "Measure Theory", "Model Theory", "Network Theory",
  "Non-Euclidean Geometry", "Number Theory", "Numerical Analysis",
  "Operations Research", "Partial Differential Equations",
  "Probability", "Proof Theory", "Ramsey Theory",
  "Real Analysis", "Set Theory", "Statistics",
  "Stochastic Processes", "Symplectic Geometry", "Systems Thinking", "Topology",

  // Health & Medicine
  "Addiction Medicine", "Allergology", "Alternative Medicine",
  "Anesthesiology", "Athletic Training", "Audiology", "Cardiology",
  "Clinical Research", "Community Health", "Dermatology",
  "Emergency Medicine", "Endocrinology", "Exercise Science",
  "Family Medicine", "Gastroenterology", "Genomic Medicine",
  "Geriatrics", "Global Health", "Health Education",
  "Health Informatics", "Health Policy", "Hospital Administration",
  "Integrative Medicine", "Kinesiology", "Medical Imaging",
  "Medical Laboratory Science", "Medical Research", "Mental Health",
  "Midwifery", "Neonatology", "Nephrology", "Neurology",
  "Nursing", "Nutrition", "Occupational Therapy",
  "Oncology", "Ophthalmology", "Orthodontics", "Orthopedics",
  "Pain Management", "Palliative Care", "Pediatrics",
  "Pharmacy", "Physical Therapy", "Psychiatry",
  "Public Health", "Radiology", "Rehabilitation Medicine",
  "Reproductive Medicine", "Rheumatology",
  "Speech-Language Pathology", "Sports Medicine",
  "Strength & Conditioning", "Surgery", "Telemedicine",
  "Urology", "Veterinary Medicine",

  // Psychology — specific areas
  "Addiction Psychology", "Animal-Assisted Therapy", "Art Therapy",
  "Behavioral Science", "Child Development", "Clinical Neuropsychology",
  "Cognitive Science", "Community Psychology", "Counseling",
  "Cross-Cultural Psychology", "Educational Psychology",
  "Environmental Psychology", "Evolutionary Psychology",
  "Experimental Psychology", "Family Counseling",
  "Forensic Psychology", "Gerontology", "Health Psychology",
  "Industrial Psychology", "Mindfulness Research",
  "Music Therapy Psychology", "Narrative Therapy",
  "Neuropsychology", "Organizational Psychology",
  "Positive Psychology", "Psychoanalysis", "School Psychology",
  "Social Psychology", "Sport Psychology", "Trauma-Informed Care",

  // Business & Economics
  "Accounting", "Asset Management", "Behavioral Economics",
  "Behavioral Finance", "Brand Management", "Business Analytics",
  "Business Law", "Business Strategy", "Change Management",
  "Consumer Behavior", "Content Strategy", "Corporate Governance",
  "Corporate Social Responsibility", "Cost Accounting",
  "Customer Experience", "Data-Driven Marketing",
  "Development Finance", "Digital Marketing", "E-Commerce",
  "Economic Development", "Economic Geography", "Economics",
  "Employee Relations", "Entrepreneurship", "Family Business",
  "Finance", "Financial Modeling", "Financial Planning",
  "Global Business", "Grant Writing", "Healthcare Economics",
  "Human Resources", "Impact Investing", "Inclusive Business",
  "Industrial Organization", "Innovation", "Insurance",
  "International Business", "International Trade",
  "Investment Banking", "Labor Economics", "Leadership Development",
  "Macroeconomics", "Management Consulting", "Managerial Accounting",
  "Market Research", "Marketing Strategy", "Mergers & Acquisitions",
  "Microeconomics", "Negotiation", "Nonprofit Management",
  "Operations Management", "Organizational Behavior",
  "Organizational Design", "Performance Management",
  "Private Equity", "Product Management", "Project Management",
  "Public Finance", "Real Estate", "Risk Management",
  "Sales Management", "Social Enterprise", "Startup Ecosystems",
  "Strategic Planning", "Supply Chain Management", "Tax Policy",
  "Technology Management", "Urban Economics", "Venture Capital",
  "Wealth Management",

  // Agriculture & Food
  "Agribusiness", "Agricultural Biotechnology", "Agricultural Economics",
  "Agricultural Education", "Agricultural Policy", "Agroecology",
  "Animal Behavior", "Animal Science", "Aquaculture",
  "Artisan Food Production", "Beekeeping", "Biodynamic Farming",
  "Community Supported Agriculture", "Composting", "Craft Brewing",
  "Crop Science", "Distilling", "Farm Management",
  "Fermentation Science", "Food Anthropology", "Food Chemistry",
  "Food Justice", "Food Photography", "Food Policy",
  "Food Science", "Food Sovereignty", "Food Systems",
  "Food Technology", "Foraging", "Garden Design", "Grain Farming",
  "Greenhouse Management", "Horticulture", "Indigenous Agriculture",
  "Integrated Pest Management", "Livestock Management",
  "Natural Resource Management", "Organic Certification",
  "Pastry Arts", "Plant Breeding", "Precision Agriculture",
  "Regenerative Agriculture", "Seed Saving", "Sensory Science",
  "Small-Scale Farming", "Soil Health", "Sustainable Agriculture",
  "Urban Agriculture", "Vertical Farming", "Viticulture",
  "Water Conservation", "Wildlife Management",

  // Environment & Sustainability
  "Biodiversity Conservation", "Carbon Sequestration",
  "Circular Economy", "Clean Technology", "Climate Adaptation",
  "Climate Change", "Climate Communication", "Climate Justice",
  "Clean Energy Policy", "Conservation Finance",
  "Corporate Sustainability", "Ecological Restoration",
  "Ecosystem Services", "Energy Efficiency", "Environmental Advocacy",
  "Environmental Consulting", "Environmental Education",
  "Environmental Impact Assessment", "Environmental Journalism",
  "Environmental Law", "Environmental Monitoring", "Environmental Policy",
  "Forest Conservation", "Green Architecture", "Green Building",
  "Green Chemistry", "Green Finance", "Green Infrastructure",
  "Land Stewardship", "Life Cycle Assessment", "Low-Carbon Design",
  "Marine Conservation", "Nature-Based Solutions", "Ocean Conservation",
  "Pollution Control", "Regenerative Design", "Renewable Energy",
  "Resilience Planning", "Restoration Ecology", "Sustainable Fashion",
  "Sustainable Forestry", "Sustainable Tourism", "Sustainability",
  "Urban Ecology", "Watershed Management", "Wetland Conservation",
  "Wildlife Conservation", "Zero Waste",

  // Education
  "Adult Education", "Arts Education", "Child Advocacy",
  "Civic Education", "College Access", "Curriculum Development",
  "Early Childhood Education", "Education Policy", "Education Research",
  "Educational Technology", "Environmental Education",
  "Financial Literacy Education", "First-Generation College Support",
  "Global Education", "Higher Education Administration",
  "Homeschool Education", "Human Rights Education",
  "Informal Education", "Instructional Design", "Language Arts Education",
  "Learning Differences", "Library Science", "Mathematics Education",
  "Mentoring", "Montessori Education", "Multicultural Education",
  "Online Learning", "Outdoor Education", "Peace Education",
  "Physical Education", "Special Education", "STEM Education",
  "Teacher Training", "Teaching", "Tutoring", "Writing Pedagogy",

  // Arts & Craft
  "Animation", "Architectural Drawing", "Artist Books", "Assemblage Art",
  "Batik", "Block Printing", "Body Art", "Book Arts",
  "Calligraphy", "Ceramics", "Collage", "Community Art",
  "Concept Art", "Conceptual Art", "Crochet", "Digital Art",
  "Drawing", "Eco Art", "Embroidery", "Encaustic Painting",
  "Environmental Art", "Experimental Film", "Fashion Design",
  "Fiber Arts", "Film Production", "Folk Art", "Furniture Making",
  "Glassblowing", "Graphic Design", "Illustration",
  "Industrial Design", "Installation Art", "Interactive Art",
  "Interior Design", "Jewelry Design", "Knitting",
  "Lacquerwork", "Land Art", "Landscape Architecture",
  "Lighting Design", "Lino Printing", "Macramé",
  "Marquetry", "Metalworking", "Mixed Media", "Mosaic Art",
  "Mural Art", "Natural Dyeing", "Oil Painting", "Origami",
  "Painting", "Papermaking", "Pen & Ink Drawing",
  "Performance Art", "Photography", "Plein Air Painting",
  "Pottery", "Printmaking", "Public Art", "Puppet Making",
  "Quilting", "Resin Art", "Sculpture", "Screen Printing",
  "Set Design", "Silversmithing", "Social Practice Art",
  "Soft Sculpture", "Stained Glass", "Stage Management",
  "Street Art", "Studio Art", "Tapestry", "Textile Arts",
  "Upcycled Art", "Video Production", "Watercolor",
  "Weaving", "Welded Sculpture", "Woodcarving", "Woodturning",

  // Music & Performing Arts
  "Acoustic Performance", "Ballet", "Ballroom Dance", "Band",
  "Beat Making", "Blues Music", "Breakdancing",
  "Chamber Music", "Choir", "Choral Conducting",
  "Circus Arts", "Classical Guitar", "Classical Piano",
  "Club DJing", "Comedy", "Composition", "Contemporary Dance",
  "Country Music", "Dance Choreography", "Drama",
  "Electronic Music", "Ensemble Playing", "Experimental Music",
  "Film Studies", "Flamenco", "Folk Music", "Funk Music",
  "Gospel Music", "Hip-Hop", "Improv Comedy", "Improv Theatre",
  "Jazz Performance", "Latin Music", "Marching Band",
  "Mime", "Modern Dance", "Music Arrangement", "Music Business",
  "Music Education", "Music History", "Music Licensing",
  "Music Marketing", "Music Performance", "Music Production",
  "Music Technology", "Music Theory", "Music Therapy",
  "Musical Theatre", "Musical Directing", "Opera",
  "Orchestral Conducting", "Physical Theatre",
  "Puppetry", "R&B Music", "Rap & Lyricism", "Rock Music",
  "Slam Poetry", "Solo Performance", "Songwriting", "Sound Design",
  "Stand-Up Comedy", "Storytelling", "Street Performance",
  "String Quartet", "Tap Dance", "Theatre",
  "Voice & Movement", "World Music",

  // Writing & Literature
  "Academic Writing", "Autobiography", "Blogging",
  "Children's Literature", "Comedy Writing", "Comparative Literature",
  "Creative Writing", "Crime Fiction", "Cultural Criticism",
  "Drama Writing", "Essay Writing", "Fantasy Writing",
  "Food Writing", "Grant Writing", "Historical Fiction",
  "Horror Writing", "Humor Writing", "Journalism",
  "Literary Analysis", "Literary Editing", "Literary Magazines",
  "Literary Translation", "Long-Form Journalism", "Memoir Writing",
  "Mystery Writing", "Nature Writing", "Oral History",
  "Personal Essay", "Poetry", "Political Writing",
  "Prose Fiction", "Public Speaking", "Publishing",
  "Rhetoric", "Romance Writing", "Science Fiction",
  "Science Writing", "Screenwriting", "Social Commentary",
  "Sports Writing", "Technical Writing", "Travel Writing",
  "True Crime", "Young Adult Fiction", "Zine Making",

  // Language & Culture
  "American Sign Language", "Arabic Language", "Celtic Studies",
  "Chinese Language", "Cross-Cultural Communication",
  "Dialect Studies", "East African Studies", "Etymology",
  "Folklore", "French Language", "German Language",
  "Greek Language", "Hawaiian Language", "Heritage Language Learning",
  "Hindi Language", "Indigenous Languages", "Intercultural Communication",
  "Japanese Language", "Korean Language", "Latin Language",
  "Latin American Studies", "Language Learning", "Linguistics",
  "Middle Eastern Studies", "Native American Studies",
  "Pacific Islander Studies", "Persian Language", "Phonetics",
  "Portuguese Language", "Russian Language", "Slavic Studies",
  "Sociolinguistics", "Southeast Asian Studies", "Spanish Language",
  "Swahili Language", "Swedish Language", "Translation",
  "Turkish Language",

  // History & Culture
  "African American Culture", "African American History", "African Studies",
  "American History", "Ancient Egypt", "Ancient Greece", "Ancient Rome",
  "Appalachian Culture", "Appalachian Studies",
  "Archaeology", "Asian Cinema", "Asian Culture", "Asian History",
  "Black Literature", "Byzantine History", "Cold War History",
  "Colonial History", "Cultural Anthropology", "Cultural Heritage",
  "Cultural Studies", "Diaspora Studies", "East Asian Studies",
  "Environmental History", "Historical Research",
  "Holocaust Studies", "Industrial Revolution", "Islamic History",
  "Latin American History", "Medieval History", "Military History",
  "Modern History", "Ottoman History", "Postcolonial Studies",
  "Renaissance Studies", "Revolutionary History", "Russian History",
  "Silk Road Studies", "Slavery Studies", "South Asian History",
  "Victorian History", "Women's Studies in History", "World History",

  // Law, Justice & Policy
  "Administrative Law", "Animal Rights Law", "Antitrust Law",
  "Arbitration", "Aviation Law", "Banking Law", "Bioethics Law",
  "Civil Liberties", "Civil Rights", "Climate Law",
  "Conflict Resolution", "Constitutional Law",
  "Consumer Protection Law", "Corporate Law", "Criminal Justice",
  "Criminology", "Disability Rights", "Discrimination Law",
  "Drug Policy", "Elder Law", "Election Law",
  "Employment Law", "Energy Law", "Entertainment Law",
  "Environmental Justice", "Family Law", "Food Policy Law",
  "Foreign Policy", "Forensic Science", "Gun Policy",
  "Health Law", "Housing Policy", "Human Rights",
  "Immigration", "Immigration Law", "Intellectual Property",
  "International Law", "International Relations",
  "Internet Law", "Juvenile Justice", "Labor Law",
  "Land Use Law", "Mediation", "Mental Health Law",
  "Military Law", "Nonviolent Resistance", "Pan-Africanism",
  "Patent Law", "Peace Studies", "Peacebuilding",
  "Prison Reform", "Privacy Law", "Property Law",
  "Public Administration", "Public Interest Law", "Public Policy",
  "Restorative Justice", "Social Activism", "Social Justice",
  "Social Movements", "Space Law", "Sports Law",
  "Tax Law", "Technology Policy", "Tort Law",
  "Trade Law", "Trademark Law", "Transportation Law",
  "Tribal Law", "Water Rights", "Workers' Rights",

  // Communication & Media
  "Advertising", "Audio Engineering", "Brand Journalism",
  "Broadcast Journalism", "Broadcasting", "Campaign Strategy",
  "Children's Media", "Communication", "Community Radio",
  "Crisis Communication", "Data Journalism", "Digital Media",
  "Directing", "Documentary Making", "Editorial Photography",
  "Film Criticism", "Food Media", "Games Journalism",
  "Graphic Journalism", "Health Communication",
  "Hyperlocal Journalism", "Immersive Journalism",
  "Infographic Design", "Investigative Journalism",
  "Media Literacy", "Media Policy", "Media Production",
  "Multimedia Storytelling", "Music Journalism",
  "Narrative Journalism", "News Photography",
  "Nonprofit Communications", "Participatory Media",
  "Photo Journalism", "Podcast Production",
  "Political Communication", "Print Journalism",
  "Public Relations", "Radio Production", "Science Journalism",
  "Social Justice Media", "Social Media", "Sports Broadcasting",
  "Sports Journalism", "Strategic Communication",
  "Television Production", "Travel Journalism",
  "Visual Journalism",

  // Social Science
  "Applied Anthropology", "Area Studies", "Cognitive Anthropology",
  "Comparative Politics", "Community Development", "Conflict Studies",
  "Critical Race Theory", "Decolonization Studies", "Demographics",
  "Development Economics", "Digital Sociology",
  "Disability Studies", "Diversity & Inclusion",
  "Economic Anthropology", "Feminist Sociology",
  "Food Anthropology", "Gender Studies", "Globalization Studies",
  "Historical Sociology", "Human Geography", "Indigenous Studies",
  "Inequality", "International Development", "Labor Studies",
  "Medical Anthropology", "Migration Studies", "Military Sociology",
  "Music Anthropology", "Organizational Sociology",
  "Political Economy", "Political Science", "Political Sociology",
  "Popular Culture Studies", "Poverty Studies", "Prison Studies",
  "Public Sociology", "Qualitative Research", "Quantitative Research",
  "Race & Ethnicity", "Racial Justice", "Rural Sociology",
  "Social Movements Studies", "Social Network Analysis",
  "Social Policy", "Social Stratification", "Social Theory",
  "Sociology", "Surveillance Studies", "Tourism Studies",
  "Urban Planning", "Urban Studies", "Visual Anthropology",
  "Visual Sociology", "Youth Studies",

  // Philosophy & Religion
  "Aesthetics", "African Philosophy", "Analytic Philosophy",
  "Ancient Philosophy", "Animal Ethics", "Applied Ethics",
  "Biblical Studies", "Bioethics", "Buddhism", "Buddhist Philosophy",
  "Category Theory Ethics", "Christian Ethics", "Comparative Religion",
  "Continental Philosophy", "Critical Theory", "Digital Ethics",
  "Empiricism", "Environmental Ethics", "Epistemology",
  "Existentialism", "Faith & Culture", "Feminist Philosophy",
  "Feminist Theory", "Gender & Society", "Gender Equity",
  "Hindu Philosophy", "Interfaith Dialogue", "Islamic Philosophy",
  "Jewish Philosophy", "LGBTQ+ Studies", "Logic & Reasoning",
  "Metaphysics", "Moral Psychology", "Native American Spirituality",
  "Naturalism", "Nihilism", "Ontology", "Phenomenology",
  "Philosophy of Art", "Philosophy of Language",
  "Philosophy of Mathematics", "Philosophy of Mind",
  "Philosophy of Religion", "Philosophy of Science",
  "Political Philosophy", "Pragmatism", "Process Philosophy",
  "Rationalism", "Religious Studies", "Social Work",
  "Spirituality", "Stoicism", "Sufism", "Taoism",
  "Theology", "Transhumanism", "Utilitarianism", "Virtue Ethics",
  "Women's History", "Women's Leadership", "World Religions",

  // Sports & Fitness
  "Archery", "Athletic Coaching", "Badminton", "Baseball",
  "Basketball Coaching", "Bouldering", "Boxing", "Climbing",
  "Cricket", "Cross-Country Running", "Cycling", "Dance",
  "Equestrian Sports", "Fencing", "Football Coaching", "Golf",
  "Gymnastics", "Handball", "Hiking", "Hockey",
  "Judo", "Kayaking", "Lacrosse", "Long-Distance Running",
  "Martial Arts", "Mountain Biking", "Outdoor Sports",
  "Parkour", "Powerlifting", "Rock Climbing", "Rowing",
  "Rugby", "Sailing", "Skiing", "Soccer Coaching",
  "Softball", "Sports Performance", "Surfing", "Swimming",
  "Table Tennis", "Tennis", "Track & Field",
  "Ultimate Frisbee", "Volleyball", "Water Sports",
  "Weight Training", "Wrestling", "Yoga",

  // Culinary Arts
  "Baking", "Butchery", "Cake Decorating", "Catering",
  "Cheese Making", "Chocolate Making", "Cocktail Making",
  "Coffee Roasting", "Confectionery", "Cooking",
  "Culinary History", "Culinary Innovation", "Culinary Tourism",
  "Dim Sum", "Food Styling", "Home Brewing",
  "Ice Cream Making", "Japanese Cuisine", "Mediterranean Cuisine",
  "Mexican Cuisine", "Molecular Gastronomy", "Noodle Making",
  "Pickling & Preserving", "Pizza Making", "Plant-Based Cooking",
  "Sausage Making", "Sourdough Baking", "Spice Blending",
  "Sushi Making", "Tea Ceremony", "Wine Pairing",

  // Architecture & Design
  "Adaptive Reuse", "Architectural History", "Architectural Theory",
  "Biophilic Design", "Building Information Modeling",
  "Community Design", "Design History", "Design Justice",
  "Design Research", "Ecological Architecture",
  "Exhibition Design", "Experience Design", "Font Design",
  "Green Architecture", "Historic Preservation", "Housing Design",
  "Interior Architecture", "Landscape Design", "Motion Design",
  "Packaging Design", "Parametric Design", "Retail Design",
  "Service Design", "Spatial Design", "Sustainable Architecture",
  "Systems Design", "Typographic Design", "Universal Design",
  "Urban Design", "Wayfinding Design",

  // Cross-disciplinary & Emerging
  "Archival Studies", "Biomimetic Design", "Citizen Science",
  "Civic Technology", "Clinical Data Science",
  "Cognitive Enhancement", "Collective Intelligence",
  "Computational Social Science", "Design Thinking",
  "Digital Ethics", "Digital Humanities",
  "Disability Innovation", "Embodied Cognition",
  "Environmental History", "Ethnobotany",
  "Evidence-Based Policy", "Existential Risk Studies",
  "Extended Reality", "Food Tech", "Futurism",
  "Gender Technology", "Gerontechnology",
  "Global Studies", "Health Technology",
  "Human Factors Engineering", "Human Flourishing",
  "Indigenous Knowledge", "Information Science",
  "Innovation Studies", "Interdisciplinary Research",
  "Knowledge Management", "Learning Sciences",
  "Longevity Research", "Marine Technology",
  "Media Studies", "Mind-Body Medicine",
  "Mixed Methods Research", "Moral Machines",
  "Network Science", "Neuroethics",
  "Open Data", "Open Science", "Participatory Design",
  "Peace Technology", "Permaculture",
  "Philosophy of Technology", "Policy Design",
  "Public Interest Technology", "Resilience Studies",
  "Science Communication", "Science & Technology Studies",
  "Science Policy", "Smart Cities",
  "Social Computing", "Social Innovation",
  "Sociotechnical Systems", "Soft Robotics",
  "Space Policy", "Speculative Design",
  "Sustainability Science", "Technoethics",
  "Technology Assessment", "Translational Research",
  "Urban Farming", "Urban Technology", "Wearable Technology",
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
