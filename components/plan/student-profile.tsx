import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, BookMarked, Briefcase, Heart } from "lucide-react"

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
    <Card className="mb-8 border-border bg-card">
      <CardContent className="py-6">
        <div className={`grid gap-6 ${hasMinors ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Majors</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.majors.map(m => (
                <Badge key={m} variant="default" className="text-xs">{m}</Badge>
              ))}
            </div>
          </div>

          {hasMinors && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Minors</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(profile.minors ?? []).map(m => (
                  <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Interests</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map(i => (
                <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Career Goals</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.careerGoals.map(g => (
                <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
