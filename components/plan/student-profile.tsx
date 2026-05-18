import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Briefcase, Heart } from "lucide-react"

interface StudentProfileProps {
  profile: {
    majors: string[]
    interests: string[]
    careerGoals: string[]
  }
}

export function StudentProfile({ profile }: StudentProfileProps) {
  return (
    <Card className="mb-8 border-[#0b6b82]/15 bg-white/80 shadow-sm">
      <CardContent className="py-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Majors */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#0b6b82]" />
              <span className="text-sm font-medium text-[#10212a]">
                Majors
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.majors.map((major) => (
                <Badge key={major} className="rounded-full bg-[#0b6b82] text-xs text-white">
                  {major}
                </Badge>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#0b6b82]" />
              <span className="text-sm font-medium text-[#10212a]">
                Interests
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="rounded-full border-[#0b6b82]/25 bg-[#e6f4f4] text-xs text-[#10212a]">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Career Goals */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#0b6b82]" />
              <span className="text-sm font-medium text-[#10212a]">
                Career Goals
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.careerGoals.map((goal) => (
                <Badge key={goal} variant="outline" className="rounded-full border-[#d59c23]/40 bg-[#fff4cb] text-xs text-[#10212a]">
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
