import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Briefcase, Heart, Lightbulb } from "lucide-react"

interface StudentProfileProps {
  profile: {
    majors: string[]
    minors: string[]
    interests: string[]
    careerGoals: string[]
  }
}

export function StudentProfile({ profile }: StudentProfileProps) {
  return (
    <Card className="mb-8 border-border bg-card">
      <CardContent className="py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Majors */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Majors
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.majors.map((major) => (
                <Badge key={major} variant="default" className="text-xs">
                  {major}
                </Badge>
              ))}
            </div>
          </div>

          {/* Minors */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Minors
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.minors.length > 0 ? (
                profile.minors.map((minor) => (
                  <Badge key={minor} variant="secondary" className="text-xs">
                    {minor}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>

          {/* Interests */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Interests
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Career Goals */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Career Goals
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.careerGoals.map((goal) => (
                <Badge key={goal} variant="outline" className="text-xs">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
