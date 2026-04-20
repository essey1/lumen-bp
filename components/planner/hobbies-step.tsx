"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Camera,
  ChefHat,
  Code,
  Flower2,
  Gamepad2,
  Headphones,
  Mountain,
  Palette,
  PersonStanding,
  Theater,
  Trophy,
  Dumbbell,
  Activity,
  Guitar,
  Pencil,
  Dice5,
  Zap,
  Cpu,
  Brush,
  Sparkles,
  Heart,
  Users,
  Coffee,
  Wine,
  Tv,
  Film,
  Radio,
  Smile,
  Handshake,
  Apple,
  Lightbulb,
  Brain,
  Droplet,
  Leaf,
  Trees,
  Home,
  Anchor,
  Plane,
  Map,
  Compass,
  Sun,
  Moon,
  Aperture,
  Wand2,
  Star,
  Medal,
  Shirt,
  Scissors,
  Wind,
  Beaker,
  Atom,
  Columns,
  Music as MusicIcon,
  BookMarked,
  Eye,
  Bike,
  Car,
  Train,
  Waves,
  Target,
  Sword,
  Feather,
  Clock,
  Key,
  Briefcase,
  Calculator,
  Square,
  Triangle,
  Circle,
  TrendingUp,
  Layers,
  Building2,
  Hammer,
  Wrench,
  Cable,
  Rss,
  Send,
  MessageSquare,
  Share2,
  Download,
  ArrowRight,
  Zap as ZapIcon,
  Power,
  Vote,
  Gift,
  Gamepad as GamepadController,
  HelpCircle,
  Info,
  AlertCircle,
  Check,
  X,
  Plus,
  Minus,
  MoreHorizontal,
  Flag,
  Bookmark,
  Trash2,
  Edit,
  Copy,
  ArrowUp,
  Filter,
  Search,
  Bell,
  Settings,
  Cloud,
  Sprout,
} from "lucide-react"

const HOBBIES = [
  { id: "Reading", label: "Reading", icon: BookOpen },
  { id: "Coding", label: "Coding", icon: Code },
  { id: "Painting", label: "Painting", icon: Palette },
  { id: "Music", label: "Music", icon: Headphones },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Hiking", label: "Hiking", icon: Mountain },
  { id: "Photography", label: "Photography", icon: Camera },
  { id: "Cooking", label: "Cooking", icon: ChefHat },
  { id: "Gaming", label: "Gaming", icon: Gamepad2 },
  { id: "Theater", label: "Theater", icon: Theater },
  { id: "Gardening", label: "Gardening", icon: Flower2 },
  { id: "Fitness", label: "Fitness/Gym", icon: Dumbbell },
  { id: "Yoga", label: "Yoga", icon: Activity },
  { id: "Guitar", label: "Playing Guitar", icon: Guitar },
  { id: "Drawing", label: "Drawing/Sketching", icon: Pencil },
  { id: "Board Games", label: "Board Games", icon: Dice5 },
  { id: "Web Design", label: "Web Design", icon: Cpu },
  { id: "Digital Art", label: "Digital Art", icon: Brush },
  { id: "Crafts", label: "Crafts & DIY", icon: Sparkles },
  { id: "Volunteering", label: "Volunteering", icon: Heart },
  { id: "Socializing", label: "Socializing", icon: Users },
  { id: "Coffee Tasting", label: "Coffee Tasting", icon: Coffee },
  { id: "Wine Tasting", label: "Wine Tasting", icon: Wine },
  { id: "Watching TV", label: "Watching TV", icon: Tv },
  { id: "Movies", label: "Movies/Films", icon: Film },
  { id: "Podcasts", label: "Podcasts", icon: Radio },
  { id: "Stand-up Comedy", label: "Stand-up Comedy", icon: Smile },
  { id: "Networking", label: "Networking", icon: Handshake },
  { id: "Studying", label: "Studying", icon: Apple },
  { id: "Learning", label: "Learning New Skills", icon: Lightbulb },
  { id: "Puzzles", label: "Puzzles & Logic", icon: Brain },
  { id: "Swimming", label: "Swimming", icon: Droplet },
  { id: "Nature Walking", label: "Nature Walking", icon: Leaf },
  { id: "Birdwatching", label: "Birdwatching", icon: Eye },
  { id: "Home Design", label: "Home Design", icon: Home },
  { id: "Sailing", label: "Sailing", icon: Anchor },
  { id: "Travel", label: "Travel", icon: Plane },
  { id: "Map Collecting", label: "Map Collecting", icon: Map },
  { id: "Orienteering", label: "Orienteering", icon: Compass },
  { id: "Outdoor Activities", label: "Outdoor Activities", icon: Sun },
  { id: "Stargazing", label: "Stargazing", icon: Moon },
  { id: "Macro Photography", label: "Macro Photography", icon: Aperture },
  { id: "Fantasy", label: "Fantasy/Sci-Fi", icon: Wand2 },
  { id: "Astronomy", label: "Astronomy", icon: Star },
  { id: "Competitive Sports", label: "Competitive Sports", icon: Medal },
  { id: "Fashion", label: "Fashion Design", icon: Shirt },
  { id: "Tailoring", label: "Tailoring/Sewing", icon: Scissors },
  { id: "Embroidery", label: "Embroidery", icon: Pencil },
  { id: "Kiting", label: "Kite Flying/Watersports", icon: Wind },
  { id: "Chemistry", label: "Chemistry Experiments", icon: Beaker },
  { id: "Physics", label: "Physics", icon: Atom },
  { id: "Architecture", label: "Architecture", icon: Columns },
  { id: "Anime", label: "Anime/Manga", icon: MusicIcon },
  { id: "BookClubs", label: "Book Clubs", icon: BookMarked },
  { id: "Cycling", label: "Cycling", icon: Bike },
  { id: "Racing", label: "Racing/Rally", icon: Car },
  { id: "Model Trains", label: "Model Trains", icon: Train },
  { id: "Surfing", label: "Surfing/Watersports", icon: Waves },
  { id: "Archery", label: "Archery", icon: Target },
  { id: "Sword Fighting", label: "Sword Fighting/Fencing", icon: Sword },
  { id: "Writing", label: "Creative Writing", icon: Feather },
  { id: "Collecting", label: "Collecting", icon: Clock },
  { id: "Real Estate", label: "Real Estate Interest", icon: Key },
  { id: "Entrepreneurship", label: "Entrepreneurship", icon: Briefcase },
  { id: "Spreadsheets", label: "Data/Spreadsheets", icon: Calculator },
  { id: "Geometry", label: "Geometry", icon: Square },
  { id: "Trigonometry", label: "Trigonometry", icon: Triangle },
  { id: "3D Art", label: "3D Art Design", icon: Layers },
  { id: "Carpentry", label: "Carpentry", icon: Hammer },
  { id: "Electronics", label: "Electronics", icon: Wrench },
  { id: "Networking Tech", label: "Tech Networking", icon: Cable },
  { id: "Social Media", label: "Social Media", icon: Share2 },
  { id: "Blogging", label: "Blogging", icon: Rss },
  { id: "Vlogging", label: "Vlogging", icon: Send },
  { id: "Community", label: "Community Service", icon: Users },
  { id: "Mentoring", label: "Mentoring", icon: BookOpen },
  { id: "Forecasting", label: "Weather Forecasting", icon: Cloud },
  { id: "Dancing", label: "Dancing", icon: PersonStanding },
  { id: "Ping Pong", label: "Ping Pong/Table Tennis", icon: Trophy },
  { id: "Badminton", label: "Badminton", icon: Feather },
  { id: "Horse Riding", label: "Horse Riding", icon: Activity },
  { id: "Martial Arts", label: "Martial Arts", icon: Zap },
  { id: "Rock Climbing", label: "Rock Climbing", icon: Mountain },
  { id: "Camping", label: "Camping", icon: Trees },
  { id: "Fishing", label: "Fishing", icon: Target },
  { id: "Canoeing", label: "Canoeing/Kayaking", icon: Waves },
  { id: "Ice Skating", label: "Ice Skating", icon: Zap },
  { id: "Snowboarding", label: "Snowboarding", icon: Wind },
  { id: "Photography Studio", label: "Photography Studio", icon: Camera },
  { id: "Video Editing", label: "Video Editing", icon: Film },
  { id: "Music Production", label: "Music Production", icon: Guitar },
  { id: "Podcasting", label: "Podcasting", icon: Radio },
  { id: "Streaming", label: "Streaming", icon: Share2 },
  { id: "Knitting", label: "Knitting/Crochet", icon: Pencil },
  { id: "Sewing", label: "Sewing", icon: Pencil },
  { id: "Quilting", label: "Quilting", icon: Layers },
  { id: "Embroidery", label: "Embroidery", icon: Pencil },
  { id: "Jewelry Making", label: "Jewelry Making", icon: Star },
  { id: "Woodworking", label: "Woodworking", icon: Hammer },
  { id: "Metalworking", label: "Metalworking", icon: Wrench },
  { id: "Leathercraft", label: "Leathercraft", icon: Shirt },
  { id: "Pottery", label: "Pottery/Ceramics", icon: Brush },
  { id: "Sculpture", label: "Sculpture", icon: Sparkles },
  { id: "Model Building", label: "Model Building/Kits", icon: Cpu },
  { id: "Scale Models", label: "Scale Models (Cars/Planes)", icon: Plane },
  { id: "RC Hobbies", label: "RC Drones/Cars", icon: Gamepad2 },
  { id: "Coin Collecting", label: "Coin/Stamp Collecting", icon: Star },
  { id: "Comic Books", label: "Comic Books", icon: BookOpen },
  { id: "Trading Cards", label: "Trading Cards", icon: Cpu },
  { id: "Vinyl Records", label: "Vinyl Record Collecting", icon: Radio },
  { id: "Memorabilia", label: "Memorabilia/Collectibles", icon: Trophy },
  { id: "Antiques", label: "Antiquing/Thrifting", icon: Clock },
  { id: "Car Restoration", label: "Car Restoration", icon: Wrench },
  { id: "Motorcycle Repair", label: "Motorcycle Repair", icon: Wind },
  { id: "Aquascaping", label: "Aquascaping", icon: Droplet },
  { id: "Terrarium", label: "Terrarium Building", icon: Flower2 },
  { id: "Beekeeping", label: "Beekeeping", icon: Sprout },
  { id: "Composting", label: "Composting", icon: Leaf },
  { id: "Urban Farming", label: "Urban Farming", icon: Apple },
  { id: "Scuba Diving", label: "Scuba Diving", icon: Droplet },
  { id: "Snorkeling", label: "Snorkeling", icon: Eye },
  { id: "Freediving", label: "Freediving", icon: Waves },
  { id: "Windsurfing", label: "Windsurfing", icon: Wind },
  { id: "Kitesurfing", label: "Kitesurfing", icon: Wind },
  { id: "Whitewater Rafting", label: "Whitewater Rafting", icon: Waves },
  { id: "Kayaking", label: "Kayaking", icon: Waves },
  { id: "Stand-Up Paddling", label: "Stand-Up Paddling", icon: Activity },
  { id: "Parkour", label: "Parkour/Freerunning", icon: PersonStanding },
  { id: "Skateboarding", label: "Skateboarding", icon: Activity },
  { id: "Longboarding", label: "Longboarding", icon: Wind },
  { id: "Slacklining", label: "Slacklining", icon: Wind },
  { id: "Mountaineering", label: "Mountaineering", icon: Mountain },
  { id: "Bouldering", label: "Bouldering", icon: Mountain },
  { id: "Skydiving", label: "Skydiving", icon: Plane },
  { id: "Paragliding", label: "Paragliding", icon: Plane },
  { id: "Hang Gliding", label: "Hang Gliding", icon: Wind },
  { id: "Hot Air Ballooning", label: "Hot Air Ballooning", icon: Sun },
  { id: "Drone Flying", label: "Drone/RC Flying", icon: Plane },
  { id: "Motorsports", label: "Motorsports Racing", icon: Trophy },
  { id: "Dirt Biking", label: "Dirt Biking", icon: Wind },
  { id: "Go-Karting", label: "Go-Karting", icon: Trophy },
  { id: "Tabletop RPG", label: "Tabletop RPG (D&D)", icon: Dice5 },
  { id: "LARPing", label: "LARPing", icon: Theater },
  { id: "Cosplay", label: "Cosplay", icon: Shirt },
  { id: "Animation", label: "Animation/Stop-Motion", icon: Film },
  { id: "Filmmaking", label: "Filmmaking", icon: Film },
  { id: "Photography (Professional)", label: "Professional Photography", icon: Camera },
  { id: "Macro Photography", label: "Macro Photography", icon: Aperture },
  { id: "Drone Photography", label: "Drone Photography", icon: Plane },
  { id: "Street Photography", label: "Street Photography", icon: Eye },
  { id: "Film Photography", label: "Film Photography", icon: Radio },
  { id: "Digital Art", label: "Digital Art/Animation", icon: Brush },
  { id: "Pixel Art", label: "Pixel Art", icon: Cpu },
  { id: "CAD Design", label: "CAD/3D Design", icon: Cpu },
  { id: "Graphic Design", label: "Graphic Design", icon: Palette },
  { id: "Typography", label: "Typography/Calligraphy", icon: Pencil },
  { id: "Keyboard Building", label: "Keyboard Building", icon: Cpu },
  { id: "PC Building", label: "PC Building/Modding", icon: Zap },
  { id: "Tech Modding", label: "Tech Modding", icon: Settings },
  { id: "Aquarium Maintenance", label: "Aquarium Maintenance", icon: Droplet },
  { id: "Terrarium Care", label: "Terrarium Care", icon: Trees },
  { id: "Bonsai", label: "Bonsai Cultivation", icon: Sprout },
  { id: "Hydroponics", label: "Hydroponics", icon: Droplet },
  { id: "Speedcubing", label: "Speedcubing (Rubik's Cube)", icon: Dice5 },
  { id: "Magic Tricks", label: "Magic Tricks/Illusions", icon: Wand2 },
  { id: "Juggling", label: "Juggling", icon: Star },
  { id: "Poi Spinning", label: "Poi Spinning", icon: Wind },
]

const MAX_SELECTIONS = 3

interface HobbiesStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function HobbiesStep({ selected, onChange }: HobbiesStepProps) {
  const toggleHobby = (hobby: string) => {
    if (selected.includes(hobby)) {
      onChange(selected.filter((h) => h !== hobby))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, hobby])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} hobbies •{" "}
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
        {HOBBIES.map((hobby) => {
          const Icon = hobby.icon
          const isSelected = selected.includes(hobby.id)
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS

          return (
            <button
              key={hobby.id}
              onClick={() => toggleHobby(hobby.id)}
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
              {hobby.label}
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
        Your hobbies help us suggest courses {"you'll"} enjoy beyond your major
      </p>
    </div>
  )
}
