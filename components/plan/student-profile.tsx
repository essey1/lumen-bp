import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, BookMarked, Briefcase, Heart } from "lucide-react"

const MAX_BADGES = 3

function BadgeList({ items, variant }: { items: string[]; variant: "default" | "secondary" | "outline" }) {
  const visible = items.slice(0, MAX_BADGES)
  const overflow = items.length - MAX_BADGES
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(item => (
        <Badge key={item} variant={variant} className="text-[10px] lg:text-xs px-1.5 py-0.5">{item}</Badge>
      ))}
      {overflow > 0 && (
        <span className="text-[10px] lg:text-xs px-1.5 py-0.5 rounded-full bg-black/10 text-current/60">+{overflow}</span>
      )}
    </div>
  )
}

interface StudentProfileProps {
  profile: {
    majors: string[]
    minors?: string[]
    interests: string[]
    careerGoals: string[]
  }
}

export function StudentProfile({ profile }: StudentProfileProps) {
  const hasMinors = (profile.minors ?? []).length > 0

  return (
    <Card className="mb-4 border-border bg-card">
      <CardContent className="py-3">
        <div className={`grid gap-2.5 ${hasMinors ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"}`}>
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary shrink-0" />
              <span className="text-xs lg:text-sm font-semibold text-foreground uppercase tracking-wide">Major</span>
            </div>
            <BadgeList items={profile.majors} variant="default" />
          </div>

          {hasMinors && (
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <BookMarked className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Minor</span>
              </div>
              <BadgeList items={profile.minors ?? []} variant="secondary" />
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary shrink-0" />
              <span className="text-xs lg:text-sm font-semibold text-foreground uppercase tracking-wide">Interests</span>
            </div>
            <BadgeList items={profile.interests} variant="outline" />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary shrink-0" />
              <span className="text-xs lg:text-sm font-semibold text-foreground uppercase tracking-wide">Goals</span>
            </div>
            <BadgeList items={profile.careerGoals} variant="outline" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
