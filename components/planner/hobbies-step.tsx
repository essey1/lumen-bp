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

const HOBBIES = [
  "3D Printing", "Acting", "Anime", "Aquariums", "Archery",
  "Astronomy", "Baking", "Basketball", "Birdwatching", "Board Games",
  "Bowling", "Boxing", "Calligraphy", "Camping", "Card Games",
  "Chess", "Climbing", "Coding", "Collecting", "Cooking",
  "Crafts", "Creative Writing", "Cross-Country Running", "Cycling", "Dancing",
  "DIY Projects", "Drawing", "Drumming", "Electronics", "Embroidery",
  "Fashion Design", "Fishing", "Football", "Gaming", "Gardening",
  "Genealogy", "Golf", "Gymnastics", "Hiking", "Home Brewing",
  "Horseback Riding", "Journaling", "Juggling", "Kayaking", "Knitting",
  "Language Learning", "Leatherworking", "Lego Building", "Listening to Music", "Lockpicking",
  "Martial Arts", "Meditation", "Model Building", "Origami", "Painting",
  "Parkour", "Photography", "Piano", "Podcast Listening", "Poetry",
  "Pottery", "Puzzles", "Reading", "Rock Climbing", "Rowing",
  "Running", "Sailing", "Scrapbooking", "Sculpting", "Sewing",
  "Singing", "Skateboarding", "Skiing", "Soccer", "Stand-Up Comedy",
  "Swimming", "Table Tennis", "Tennis", "Traveling", "Video Editing",
  "Violin", "Volunteering", "Watercolor Painting", "Weightlifting", "Woodworking",
  "Writing", "Yoga", "Zumba",
]

const QUICK_PICKS = [
  "Reading", "Gaming", "Cooking", "Hiking", "Photography",
  "Drawing", "Running", "Coding", "Music", "Writing",
  "Traveling", "Yoga", "Soccer", "Swimming", "Painting",
  "Dancing", "Cycling", "Creative Writing", "Gardening", "Meditation",
]

const MAX_SELECTIONS = 3

interface HobbiesStepProps {
  selected: string[]
  onChange: (value: string[]) => void
}

export function HobbiesStep({ selected, onChange }: HobbiesStepProps) {
  const [open, setOpen] = useState(false)

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(h => h !== id))
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, id])
      setOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_SELECTIONS} hobbies •{" "}
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
            {selected.length >= MAX_SELECTIONS ? "Maximum selections reached" : "Search all hobbies..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Type to search..." />
            <CommandList>
              <CommandEmpty>No hobby found.</CommandEmpty>
              <CommandGroup>
                {HOBBIES.map(id => (
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
        <p className="mb-3 text-center text-sm text-muted-foreground">Popular hobbies:</p>
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
