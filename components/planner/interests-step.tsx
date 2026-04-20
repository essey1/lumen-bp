"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Beaker,
  Briefcase,
  Code,
  Leaf,
  Mic,
  Palette,
  PenTool,
  Scale,
  GraduationCap,
  Heart,
  Cpu,
  Users,
  Zap,
  Globe,
  TrendingUp,
  DollarSign,
  Home,
  Book,
  Microscope,
  Lightbulb,
  Rocket,
  Brain,
  Heart as HeartIcon,
  Music,
  Film,
  Camera,
  Paintbrush,
  Mountain,
  Waves,
  Wind,
  Sun,
  Moon,
  Star,
  Compass,
  Map,
  Navigation,
  Anchor,
  Plane,
  Train,
  Car,
  Bike,
  Activity,
  Trophy,
  Target,
  Smile,
  Eye,
  Ear,
  Dumbbell,
  Apple,
  Coffee,
  Wine,
  UtensilsCrossed,
  Shirt,
  Watch,
  Shield,
  Lock,
  Key,
  Wrench,
  Hammer,
  Drill,
  FileText,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Layers,
  Database,
  Server,
  Network,
  Wifi,
  Copy,
  Share2,
  MessageSquare,
  Mail,
  Send,
  BookOpen,
  Bookmark,
  BookMarked,
  Newspaper,
  Radio,
  Headphones,
  Gamepad2,
  Dice5,
  Theater,
  Award,
  Medal,
  PawPrint,
  Flower,
  Trees,
  Leaf as LeafIcon,
  Droplet,
  Wind as WindIcon,
  Cloudy,
  CloudRain,
  Zap as ZapIcon,
  Building2,
  Building,
  Factory,
  Store,
  ShoppingCart,
  Gift,
  Briefcase as BriefcaseIcon,
  Percent,
  CreditCard,
  Wallet,
  Clock,
  Calendar,
  CheckSquare,
  AlertCircle,
  Calculator,
  Handshake,
  Droplets,
  Truck,
  Trash2,
  Search,
  Microchip,
  Crown,
} from "lucide-react"

const INTERESTS = [
  { id: "Research", label: "Research", icon: Beaker },
  { id: "Technology", label: "Technology", icon: Cpu },
  { id: "Writing", label: "Writing", icon: PenTool },
  { id: "Teaching", label: "Teaching", icon: GraduationCap },
  { id: "Healthcare", label: "Healthcare", icon: Heart },
  { id: "Business", label: "Business", icon: Briefcase },
  { id: "Arts", label: "Arts", icon: Palette },
  { id: "Community Service", label: "Community Service", icon: Users },
  { id: "Environment", label: "Environment", icon: Leaf },
  { id: "Law", label: "Law", icon: Scale },
  { id: "Engineering", label: "Engineering", icon: Code },
  { id: "Media", label: "Media", icon: Mic },
  { id: "Physics", label: "Physics", icon: Zap },
  { id: "Geography", label: "Geography", icon: Globe },
  { id: "Economics", label: "Economics", icon: TrendingUp },
  { id: "Finance", label: "Finance", icon: DollarSign },
  { id: "Real Estate", label: "Real Estate", icon: Home },
  { id: "Literature", label: "Literature", icon: Book },
  { id: "Biology", label: "Biology", icon: Microscope },
  { id: "Innovation", label: "Innovation", icon: Lightbulb },
  { id: "Startups", label: "Startups", icon: Rocket },
  { id: "Psychology", label: "Psychology", icon: Brain },
  { id: "Philosophy", label: "Philosophy", icon: HeartIcon },
  { id: "Music Theory", label: "Music Theory", icon: Music },
  { id: "Film Studies", label: "Film Studies", icon: Film },
  { id: "Photography", label: "Photography", icon: Camera },
  { id: "Fine Arts", label: "Fine Arts", icon: Paintbrush },
  { id: "Outdoor Sports", label: "Outdoor Sports", icon: Mountain },
  { id: "Water Sports", label: "Water Sports", icon: Waves },
  { id: "Athletics", label: "Athletics", icon: Activity },
  { id: "Competition", label: "Competition", icon: Trophy },
  { id: "Goal Setting", label: "Goal Setting", icon: Target },
  { id: "Social Impact", label: "Social Impact", icon: Smile },
  { id: "Vision & Purpose", label: "Vision & Purpose", icon: Eye },
  { id: "Communication", label: "Communication", icon: MessageSquare },
  { id: "Fitness", label: "Fitness", icon: Dumbbell },
  { id: "Nutrition", label: "Nutrition", icon: Apple },
  { id: "Wellness", label: "Wellness", icon: HeartIcon },
  { id: "Culinary Arts", label: "Culinary Arts", icon: UtensilsCrossed },
  { id: "Fashion", label: "Fashion", icon: Shirt },
  { id: "Design", label: "Design", icon: Palette },
  { id: "Marketing", label: "Marketing", icon: TrendingUp },
  { id: "Sales", label: "Sales", icon: ShoppingCart },
  { id: "Cybersecurity", label: "Cybersecurity", icon: Lock },
  { id: "Software Development", label: "Software Development", icon: Code },
  { id: "Artificial Intelligence", label: "Artificial Intelligence", icon: Brain },
  { id: "Data Science", label: "Data Science", icon: BarChart3 },
  { id: "Cloud Computing", label: "Cloud Computing", icon: Server },
  { id: "Web Development", label: "Web Development", icon: Globe },
  { id: "Mobile Apps", label: "Mobile Apps", icon: Cpu },
  { id: "Game Development", label: "Game Development", icon: Gamepad2 },
  { id: "Robotics", label: "Robotics", icon: Zap },
  { id: "Astronomy", label: "Astronomy", icon: Moon },
  { id: "Geology", label: "Geology", icon: Mountain },
  { id: "Chemistry", label: "Chemistry", icon: Beaker },
  { id: "Marine Science", label: "Marine Science", icon: Waves },
  { id: "Botany", label: "Botany", icon: Flower },
  { id: "History", label: "History", icon: Book },
  { id: "Political Science", label: "Political Science", icon: Building2 },
  { id: "International Relations", label: "International Relations", icon: Globe },
  { id: "Agriculture", label: "Agriculture", icon: Trees },
  { id: "Sustainability", label: "Sustainability", icon: LeafIcon },
  { id: "Climate Action", label: "Climate Action", icon: Wind },
  { id: "Urban Planning", label: "Urban Planning", icon: Building },
  { id: "Architecture", label: "Architecture", icon: Home },
  { id: "Interior Design", label: "Interior Design", icon: Home },
  { id: "Construction", label: "Construction", icon: Hammer },
  { id: "Manufacturing", label: "Manufacturing", icon: Factory },
  { id: "Supply Chain", label: "Supply Chain", icon: TrendingUp },
  { id: "Quality Management", label: "Quality Management", icon: CheckSquare },
  { id: "Project Management", label: "Project Management", icon: CheckSquare },
  { id: "Leadership", label: "Leadership", icon: Trophy },
  { id: "Entrepreneurship", label: "Entrepreneurship", icon: Lightbulb },
  { id: "Investment", label: "Investment", icon: TrendingUp },
  { id: "Taxation", label: "Taxation", icon: Percent },
  { id: "Accounting", label: "Accounting", icon: Calculator },
  { id: "Auditing", label: "Auditing", icon: CheckSquare },
  { id: "Insurance", label: "Insurance", icon: Shield },
  { id: "Risk Management", label: "Risk Management", icon: AlertCircle },
  { id: "Human Resources", label: "Human Resources", icon: Users },
  { id: "Labor Relations", label: "Labor Relations", icon: Handshake },
  { id: "Organizational Psychology", label: "Organizational Psychology", icon: Brain },
  { id: "Career Development", label: "Career Development", icon: TrendingUp },
  { id: "Professional Networking", label: "Professional Networking", icon: Share2 },
  { id: "Mentoring", label: "Mentoring", icon: Users },
  { id: "Coaching", label: "Coaching", icon: Trophy },
  { id: "Public Speaking", label: "Public Speaking", icon: Mic },
  { id: "Negotiation", label: "Negotiation", icon: MessageSquare },
  { id: "Conflict Resolution", label: "Conflict Resolution", icon: HeartIcon },
  { id: "Genetics", label: "Genetics/Genomics", icon: Beaker },
  { id: "Neuroscience", label: "Neuroscience", icon: Brain },
  { id: "Ecology", label: "Ecology", icon: Leaf },
  { id: "Entomology", label: "Entomology", icon: Flower },
  { id: "Meteorology", label: "Meteorology", icon: Wind },
  { id: "Quantum Physics", label: "Quantum Physics", icon: Beaker },
  { id: "Astrophysics", label: "Astrophysics", icon: Moon },
  { id: "Fluid Dynamics", label: "Fluid Dynamics", icon: Droplets },
  { id: "Thermodynamics", label: "Thermodynamics", icon: Zap },
  { id: "Optics", label: "Optics", icon: Eye },
  { id: "Acoustics", label: "Acoustics", icon: Radio },
  { id: "Mineralogy", label: "Mineralogy", icon: Mountain },
  { id: "Seismology", label: "Seismology", icon: Activity },
  { id: "Paleontology", label: "Paleontology", icon: BookOpen },
  { id: "Ornithology", label: "Ornithology", icon: Eye },
  { id: "Marine Biology", label: "Marine Biology", icon: Waves },
  { id: "Microbiology", label: "Microbiology", icon: Microscope },
  { id: "Immunology", label: "Immunology", icon: Shield },
  { id: "Pharmacology", label: "Pharmacology", icon: Heart },
  { id: "Epidemiology", label: "Epidemiology", icon: Heart },
  { id: "Toxicology", label: "Toxicology", icon: AlertCircle },
  { id: "Sociology", label: "Sociology", icon: Users },
  { id: "Anthropology", label: "Anthropology", icon: Users },
  { id: "Religious Studies", label: "Religious Studies", icon: BookOpen },
  { id: "Linguistics", label: "Linguistics", icon: Newspaper },
  { id: "Archaeology", label: "Archaeology", icon: Mountain },
  { id: "Criminology", label: "Criminology", icon: Shield },
  { id: "Social Work", label: "Social Work", icon: Heart },
  { id: "Public Policy", label: "Public Policy", icon: Building2 },
  { id: "Ethics", label: "Ethics", icon: Scale },
  { id: "Epistemology", label: "Epistemology", icon: Brain },
  { id: "Aesthetics", label: "Aesthetics", icon: Palette },
  { id: "Logic", label: "Logic", icon: Cpu },
  { id: "Metaphysics", label: "Metaphysics", icon: Lightbulb },
  { id: "Behavioral Science", label: "Behavioral Science", icon: Brain },
  { id: "Cognitive Science", label: "Cognitive Science", icon: Brain },
  { id: "Neurolinguistics", label: "Neurolinguistics", icon: Brain },
  { id: "Game Theory", label: "Game Theory", icon: Gamepad2 },
  { id: "Decision Theory", label: "Decision Theory", icon: Target },
  { id: "Systems Thinking", label: "Systems Thinking", icon: Layers },
  { id: "Complexity Science", label: "Complexity Science", icon: Beaker },
  { id: "Quantum Computing", label: "Quantum Computing", icon: Cpu },
  { id: "Blockchain", label: "Blockchain", icon: Lock },
  { id: "IoT", label: "Internet of Things", icon: Network },
  { id: "Augmented Reality", label: "Augmented Reality", icon: Eye },
  { id: "Virtual Reality", label: "Virtual Reality", icon: Eye },
  { id: "Biotech", label: "Biotechnology", icon: Beaker },
  { id: "Nanotechnology", label: "Nanotechnology", icon: Microscope },
  { id: "Materials Science", label: "Materials Science", icon: Beaker },
  { id: "Energy Systems", label: "Energy Systems", icon: Zap },
  { id: "Renewable Energy", label: "Renewable Energy", icon: Leaf },
  { id: "Nuclear Science", label: "Nuclear Science", icon: Beaker },
  { id: "Water Treatment", label: "Water Treatment", icon: Droplets },
  { id: "Environmental Engineering", label: "Environmental Engineering", icon: Trees },
  { id: "Waste Management", label: "Waste Management", icon: Trash2 },
  { id: "Transportation Engineering", label: "Transportation Engineering", icon: Truck },
  { id: "Aerospace Engineering", label: "Aerospace Engineering", icon: Plane },
  { id: "Structural Engineering", label: "Structural Engineering", icon: Building2 },
  { id: "Mechanical Design", label: "Mechanical Design", icon: Wrench },
  { id: "HVAC Systems", label: "HVAC Systems", icon: Wind },
  { id: "Electrical Systems", label: "Electrical Systems", icon: Zap },
  { id: "Plumbing Systems", label: "Plumbing Systems", icon: Droplets },
  { id: "Heating Systems", label: "Heating Systems", icon: Lightbulb },
  { id: "Automation", label: "Automation", icon: Settings },
  { id: "Control Systems", label: "Control Systems", icon: Settings },
  { id: "Embedded Systems", label: "Embedded Systems", icon: Microchip },
  { id: "Network Engineering", label: "Network Engineering", icon: Network },
  { id: "Database Design", label: "Database Design", icon: Database },
  { id: "UX/UI", label: "UX/UI Design", icon: Palette },
  { id: "Brand Strategy", label: "Brand Strategy", icon: Lightbulb },
  { id: "Content Strategy", label: "Content Strategy", icon: BookOpen },
  { id: "Digital Marketing", label: "Digital Marketing", icon: Share2 },
  { id: "SEO", label: "SEO/SEM", icon: Search },
  { id: "E-Commerce", label: "E-Commerce", icon: ShoppingCart },
  { id: "Retail", label: "Retail Management", icon: Store },
  { id: "Supply Chain", label: "Supply Chain Management", icon: Truck },
  { id: "Operations", label: "Operations Management", icon: Settings },
]

const MAX_SELECTIONS = 5

interface InterestsStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function InterestsStep({ selected, onChange }: InterestsStepProps) {
  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, interest])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} interests •{" "}
          <span
            className={cn(
              "font-medium",
              selected.length >= 1 ? "text-primary" : "text-muted-foreground"
            )}
          >
            {selected.length} selected
          </span>
        </p>
      </div>

      {/* Pill Grid */}
      <div className="flex flex-wrap justify-center gap-3">
        {INTERESTS.map((interest) => {
          const Icon = interest.icon
          const isSelected = selected.includes(interest.id)
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS

          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                isDisabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {interest.label}
            </button>
          )
        })}
      </div>

      {/* Selection progress */}
      <div className="flex justify-center gap-1.5">
        {Array.from({ length: MAX_SELECTIONS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-8 rounded-full transition-colors",
              i < selected.length ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  )
}
