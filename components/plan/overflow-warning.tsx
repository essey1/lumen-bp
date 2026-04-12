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
    <Alert className="border-warning bg-warning/10">
      <AlertTriangle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-warning-foreground">
        Additional Requirements
      </AlertTitle>
      <AlertDescription className="mt-3">
        {warnings.length > 0 && (
          <ul className="mb-4 list-disc pl-5 text-sm text-foreground space-y-1">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        )}
        {courses.length > 0 && (
          <p className="mb-4 text-sm text-foreground">
            You will need to either overload a semester or enroll for additional
            semesters to complete these requirements:
          </p>
        )}
        {courses.length > 0 && (
          <Card className="border-warning/30 bg-background">
            <CardContent className="py-4">
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.code}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-primary">
                        {course.code}
                      </span>
                      <span className="mx-2 text-muted-foreground">—</span>
                      <span className="text-foreground">{course.name}</span>
                    </div>
                    <Badge variant="outline">{course.credits} credits</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Total additional credits needed:
                </span>
                <Badge className="bg-warning text-warning-foreground hover:bg-warning">
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
