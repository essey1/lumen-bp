"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Briefcase,
  Building2,
  Code,
  GraduationCap,
  Heart,
  Landmark,
  Lightbulb,
  Palette,
  Scale,
  Stethoscope,
  TrendingUp,
  Palette as Design,
  Users,
  DollarSign,
  Cpu,
  Music,
  Hammer,
  Calculator,
  Brain,
  PawPrint,
  Pill,
  Zap,
  Plane,
  Leaf,
  Trophy,
  Activity,
  Newspaper,
  Film,
  BookOpen,
  Target,
  BarChart3,
  Home,
  Star,
  Cloud,
  Wind,
  Wrench,
  Globe,
  Lock,
  Shield,
  Network,
  Server,
  Database,
  Settings,
  CheckSquare,
  Eye,
  Glasses,
  Microscope,
  Beaker,
  Atom,
  Map,
  Smartphone,
  Radio,
  Clapperboard,
  UtensilsCrossed,
  Apple,
  Mountain,
  Sprout,
  Telescope,
  Gauge,
  HardHat,
  FileText,
  Layers,
  Pen,
  Gamepad2,
  Headphones,
  Share2,
  Anchor,
  Camera,
  Dumbbell,
  Users2,
  Wine,
  Coffee,
  Flower,
  Sparkles,
  BookMarked,
  Languages,
  Shirt,
  Ticket,
  Wallet,
  Binoculars,
  Crown,
  Package,
  Ship,
  Warehouse,
  Hotel,
  Tractor,
  ShieldAlert,
  Siren,
  Sun,
  AlertCircle,
} from "lucide-react"

const CAREER_GOALS = [
  { id: "Graduate School", label: "Graduate School", icon: GraduationCap },
  { id: "Medical School", label: "Medical School", icon: Stethoscope },
  { id: "Law School", label: "Law School", icon: Scale },
  { id: "Software Engineer", label: "Software Engineer", icon: Code },
  { id: "Data Scientist", label: "Data Scientist", icon: TrendingUp },
  { id: "Entrepreneur", label: "Entrepreneur", icon: Lightbulb },
  { id: "Product Manager", label: "Product Manager", icon: Briefcase },
  { id: "UX/UI Designer", label: "UX/UI Designer", icon: Palette },
  { id: "Teacher", label: "Teacher", icon: GraduationCap },
  { id: "Researcher", label: "Researcher", icon: Briefcase },
  { id: "Nonprofit Work", label: "Nonprofit Work", icon: Heart },
  { id: "Government", label: "Government", icon: Landmark },
  { id: "Healthcare", label: "Healthcare Professional", icon: Stethoscope },
  { id: "Creative Industry", label: "Creative Industry", icon: Music },
  { id: "Architect", label: "Architect/Engineer", icon: Hammer },
  { id: "Marketing", label: "Marketing/Business", icon: TrendingUp },
  { id: "Freelancer", label: "Freelancer/Self-Employed", icon: Lightbulb },
  { id: "Accountant", label: "Accountant", icon: Calculator },
  { id: "Psychologist", label: "Psychologist", icon: Brain },
  { id: "Veterinarian", label: "Veterinarian", icon: PawPrint },
  { id: "Pharmacist", label: "Pharmacist", icon: Pill },
  { id: "Nurse", label: "Nurse", icon: Heart },
  { id: "Physical Therapist", label: "Physical Therapist", icon: Activity },
  { id: "Electrician", label: "Electrician", icon: Zap },
  { id: "Pilot", label: "Pilot", icon: Plane },
  { id: "Environmental Scientist", label: "Environmental Scientist", icon: Leaf },
  { id: "Sports Manager", label: "Sports Manager", icon: Trophy },
  { id: "Journalist", label: "Journalist", icon: Newspaper },
  { id: "Film Director", label: "Film Director", icon: Clapperboard },
  { id: "Author", label: "Author", icon: BookOpen },
  { id: "Graphic Designer", label: "Graphic Designer", icon: Palette },
  { id: "Social Worker", label: "Social Worker", icon: Users },
  { id: "HR Manager", label: "HR Manager", icon: Briefcase },
  { id: "Recruiter", label: "Recruiter", icon: Target },
  { id: "Sales Manager", label: "Sales Manager", icon: TrendingUp },
  { id: "Real Estate Agent", label: "Real Estate Agent", icon: Home },
  { id: "Chef", label: "Chef", icon: UtensilsCrossed },
  { id: "Nutritionist", label: "Nutritionist", icon: Apple },
  { id: "Botanist", label: "Botanist", icon: Sprout },
  { id: "Geologist", label: "Geologist", icon: Mountain },
  { id: "Astronomer", label: "Astronomer", icon: Telescope },
  { id: "Meteorologist", label: "Meteorologist", icon: Cloud },
  { id: "Mechanic", label: "Mechanic", icon: Wrench },
  { id: "Plumber", label: "Plumber", icon: Wrench },
  { id: "Construction Manager", label: "Construction Manager", icon: HardHat },
  { id: "Web Developer", label: "Web Developer", icon: Globe },
  { id: "Mobile App Developer", label: "Mobile App Developer", icon: Smartphone },
  { id: "AI/ML Engineer", label: "AI/ML Engineer", icon: Brain },
  { id: "Cybersecurity Specialist", label: "Cybersecurity Specialist", icon: Lock },
  { id: "Network Administrator", label: "Network Administrator", icon: Network },
  { id: "Database Administrator", label: "Database Administrator", icon: Database },
  { id: "Systems Analyst", label: "Systems Analyst", icon: Settings },
  { id: "Business Analyst", label: "Business Analyst", icon: BarChart3 },
  { id: "Financial Analyst", label: "Financial Analyst", icon: TrendingUp },
  { id: "Economist", label: "Economist", icon: BarChart3 },
  { id: "Actuary", label: "Actuary", icon: Calculator },
  { id: "Insurance Agent", label: "Insurance Agent", icon: Shield },
  { id: "Investment Banker", label: "Investment Banker", icon: DollarSign },
  { id: "Stockbroker", label: "Stockbroker", icon: TrendingUp },
  { id: "Tax Advisor", label: "Tax Advisor", icon: Calculator },
  { id: "Auditor", label: "Auditor", icon: CheckSquare },
  { id: "Lawyer", label: "Lawyer", icon: Scale },
  { id: "Judge", label: "Judge", icon: Scale },
  { id: "Prosecutor", label: "Prosecutor", icon: Briefcase },
  { id: "Public Defender", label: "Public Defender", icon: Shield },
  { id: "Paralegal", label: "Paralegal", icon: FileText },
  { id: "Optometrist", label: "Optometrist", icon: Eye },
  { id: "Dentist", label: "Dentist", icon: Glasses },
  { id: "Dermatologist", label: "Dermatologist", icon: Stethoscope },
  { id: "Surgeon", label: "Surgeon", icon: Stethoscope },
  { id: "Therapist", label: "Therapist/Counselor", icon: Heart },
  { id: "Chiropractor", label: "Chiropractor", icon: Activity },
  { id: "Radiologist", label: "Radiologist", icon: Radio },
  { id: "Cardiologist", label: "Cardiologist", icon: Heart },
  { id: "Pathologist", label: "Pathologist", icon: Microscope },
  { id: "Microbiologist", label: "Microbiologist", icon: Beaker },
  { id: "Chemist", label: "Chemist", icon: Beaker },
  { id: "Physicist", label: "Physicist", icon: Atom },
  { id: "Civil Engineer", label: "Civil Engineer", icon: Building2 },
  { id: "Mechanical Engineer", label: "Mechanical Engineer", icon: Wrench },
  { id: "Electrical Engineer", label: "Electrical Engineer", icon: Zap },
  { id: "Urban Planner", label: "Urban Planner", icon: Map },
  { id: "Interior Designer", label: "Interior Designer", icon: Palette },
  { id: "Landscape Architect", label: "Landscape Architect", icon: Leaf },
  { id: "Musician", label: "Musician", icon: Music },
  { id: "Actor", label: "Actor", icon: Star },
  { id: "Comedian", label: "Comedian", icon: Star },
  { id: "Video Game Developer", label: "Video Game Developer", icon: Gamepad2 },
  { id: "Esports Manager", label: "Esports Manager", icon: Trophy },
  { id: "Podcast Producer", label: "Podcast Producer", icon: Headphones },
  { id: "Social Media Manager", label: "Social Media Manager", icon: Share2 },
  { id: "Influencer", label: "Influencer/Content Creator", icon: Star },
  { id: "Maritime Captain", label: "Maritime Captain", icon: Anchor },
  { id: "Adventure Guide", label: "Adventure Guide", icon: Mountain },
  { id: "Fitness Trainer", label: "Fitness Trainer", icon: Dumbbell },
  { id: "Sports Coach", label: "Sports Coach", icon: Trophy },
  { id: "Sommelier", label: "Sommelier", icon: Wine },
  { id: "Barista", label: "Barista", icon: Coffee },
  { id: "Florist", label: "Florist", icon: Flower },
  { id: "Animator", label: "Animator", icon: Sparkles },
  { id: "Museum Curator", label: "Museum Curator", icon: Layers },
  { id: "Librarian", label: "Librarian", icon: BookMarked },
  { id: "Translator", label: "Translator/Interpreter", icon: Languages },
  { id: "Fashion Designer", label: "Fashion Designer", icon: Shirt },
  { id: "Event Planner", label: "Event Planner", icon: Ticket },
  { id: "Consultant", label: "Business Consultant", icon: Lightbulb },
  { id: "Financial Advisor", label: "Financial Advisor", icon: Wallet },
  { id: "Private Investigator", label: "Private Investigator", icon: Binoculars },
  { id: "Entrepreneur/Startup", label: "Entrepreneur/Startup Founder", icon: Crown },
  { id: "HVAC Technician", label: "HVAC Technician", icon: Zap },
  { id: "Welding", label: "Welder", icon: Hammer },
  { id: "Carpentry", label: "Carpenter", icon: Hammer },
  { id: "Truck Driver", label: "Truck Driver", icon: Plane },
  { id: "Logistics Manager", label: "Logistics Manager", icon: Package },
  { id: "Supply Chain", label: "Supply Chain Manager", icon: Warehouse },
  { id: "Shipping Coordinator", label: "Shipping Coordinator", icon: Ship },
  { id: "Hotel Manager", label: "Hotel/Resort Manager", icon: Hotel },
  { id: "Tourism Guide", label: "Tourism Guide", icon: Map },
  { id: "Travel Agent", label: "Travel Agent", icon: Plane },
  { id: "Hospitality Manager", label: "Hospitality Manager", icon: Users },
  { id: "Farmer", label: "Farmer/Agriculture", icon: Tractor },
  { id: "Agricultural Specialist", label: "Agricultural Specialist", icon: Sprout },
  { id: "Veterinary Tech", label: "Veterinary Technician", icon: PawPrint },
  { id: "Police Officer", label: "Police Officer", icon: ShieldAlert },
  { id: "Security Professional", label: "Security Professional", icon: Lock },
  { id: "Firefighter", label: "Firefighter", icon: AlertCircle },
  { id: "Military Officer", label: "Military Officer", icon: Siren },
  { id: "Veteran Services", label: "Veteran Services", icon: Landmark },
  { id: "Administrative Assistant", label: "Administrative Assistant", icon: FileText },
  { id: "Office Manager", label: "Office Manager", icon: Briefcase },
  { id: "Executive Assistant", label: "Executive Assistant", icon: CheckSquare },
  { id: "Facilities Manager", label: "Facilities Manager", icon: Building2 },
  { id: "Property Manager", label: "Property Manager", icon: Home },
  { id: "Electrician Master", label: "Electrical Contractor", icon: Zap },
  { id: "Plumbing Contractor", label: "Plumbing Contractor", icon: Wrench },
  { id: "Wind Turbine Tech", label: "Wind Turbine Technician", icon: Wind },
  { id: "Solar Technician", label: "Solar Panel Technician", icon: Sun },
]

const MAX_SELECTIONS = 3

interface CareerStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function CareerStep({ selected, onChange }: CareerStepProps) {
  const toggleCareer = (career: string) => {
    if (selected.includes(career)) {
      onChange(selected.filter((c) => c !== career))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, career])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} career goals •{" "}
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
        {CAREER_GOALS.map((career) => {
          const Icon = career.icon
          const isSelected = selected.includes(career.id)
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS

          return (
            <button
              key={career.id}
              onClick={() => toggleCareer(career.id)}
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
              {career.label}
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

      <p className="text-center text-sm text-muted-foreground">
        {"We'll"} tailor your course plan to help you reach these goals
      </p>
    </div>
  )
}
