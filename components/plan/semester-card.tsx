import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Course {
  code: string
  name: string
  credits: number
  isPlaceholder?: boolean
  placeholderCategory?: string
  category?: string
}

interface SemesterCardProps {
  title: string
  courses: Course[]
  isOverloaded?: boolean
}

export function SemesterCard({
  title,
  courses,
  isOverloaded = false,
}: SemesterCardProps) {
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)
  const maxCredits = 16

  return (
    <Card
      className={cn(
        "border-border bg-card transition-shadow hover:shadow-md",
        isOverloaded && "border-warning"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            {title}
          </CardTitle>
          {isOverloaded && (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {courses.map((course, idx) => (
          <div
            key={`${course.code}-${idx}`}
            className={cn(
              "flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0",
              course.isPlaceholder && "bg-muted/50 rounded-md px-2 py-1 -mx-2 border-dashed"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className={cn(
                "text-xs font-semibold",
                course.isPlaceholder ? "text-muted-foreground italic" : "text-primary"
              )}>
                {course.isPlaceholder ? (
                  <span className="flex items-center gap-1">
                    <span className="text-[10px] bg-muted px-1 rounded">TBD</span>
                    {course.placeholderCategory || "Elective"}
                  </span>
                ) : (
                  course.code
                )}
              </p>
              <p className={cn(
                "truncate text-xs",
                course.isPlaceholder ? "text-muted-foreground/70 italic" : "text-muted-foreground"
              )}>
                {course.name}
              </p>
            </div>
            <Badge 
              variant={course.isPlaceholder ? "outline" : "secondary"} 
              className={cn(
                "shrink-0 text-xs",
                course.isPlaceholder && "border-dashed"
              )}
            >
              {course.credits} cr
            </Badge>
          </div>
        ))}

        {/* Credit Total */}
        <div
          className={cn(
            "flex items-center justify-between rounded-md px-2 py-1.5",
            isOverloaded ? "bg-warning/10" : "bg-muted"
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">
            Total
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              isOverloaded ? "text-warning" : "text-foreground"
            )}
          >
            {totalCredits} credits
            {isOverloaded && (
              <span className="ml-1 text-xs font-normal">
                ({totalCredits - maxCredits} over)
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
