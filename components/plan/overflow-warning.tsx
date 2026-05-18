import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface Course {
  code: string
  name: string
  credits: number
}

interface OverflowWarningProps {
  courses: Course[]
  warnings?: string[]
}

export function OverflowWarning({ courses, warnings = [] }: OverflowWarningProps) {
  if (courses.length === 0 && warnings.length === 0) return null

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)

  return (
    <Alert className="border-[#d59c23]/40 bg-[#fff4cb]">
      <AlertTriangle className="h-5 w-5 text-[#a15e08]" />
      <AlertTitle className="text-[#6f3e04]">
        Additional Requirements
      </AlertTitle>
      <AlertDescription className="mt-3">
        {warnings.length > 0 && (
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#10212a]">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        )}
        {courses.length > 0 && (
          <p className="mb-4 text-sm text-[#10212a]">
            You will need to either overload a semester or enroll for additional
            semesters to complete these requirements:
          </p>
        )}
        {courses.length > 0 && (
          <Card className="border-[#d59c23]/30 bg-white/80">
            <CardContent className="py-4">
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.code}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-[#0b6b82]">
                        {course.code}
                      </span>
                      <span className="mx-2 text-[#6b5d4b]">-</span>
                      <span className="text-[#10212a]">{course.name}</span>
                    </div>
                    <Badge variant="outline" className="border-[#d59c23]/40 text-[#10212a]">{course.credits} credits</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#d59c23]/25 pt-4">
                <span className="text-sm font-medium text-[#6b5d4b]">
                  Total additional credits needed:
                </span>
                <Badge className="bg-[#d59c23] text-[#10212a] hover:bg-[#d59c23]">
                  {totalCredits} credits
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </AlertDescription>
    </Alert>
  )
}
