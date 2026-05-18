import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Course {
  code: string
  name: string
  credits: number
  fulfills?: string[]
  isPlaceholder?: boolean
  placeholderCategory?: string
  category?: string
  scheduleDisclaimer?: boolean
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
  // Berea uses 1 course = 1 credit, exactly 4 courses per semester
  const maxCredits = 4

  return (
    <Card
      className={cn(
        "border-[#0b6b82]/15 bg-white/82 shadow-sm transition-shadow hover:shadow-md",
        isOverloaded && "border-[#d59c23]"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[#10212a]">
            {title}
          </CardTitle>
          {isOverloaded && (
            <AlertTriangle className="h-4 w-4 text-[#d59c23]" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {courses.map((course, idx) => (
          <div
            key={`${course.code}-${idx}`}
            className={cn(
              "flex items-start justify-between gap-2 border-b border-[#0b6b82]/10 pb-2 last:border-0 last:pb-0",
              course.isPlaceholder && "bg-[#fff4cb]/60 rounded-md px-2 py-1 -mx-2 border-dashed"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className={cn(
                "text-xs font-semibold",
                course.isPlaceholder ? "text-[#6b5d4b] italic" : "text-[#0b6b82]"
              )}>
                {course.isPlaceholder ? (
                  <span className="flex items-center gap-1">
                    <span className="rounded bg-[#0b6b82]/10 px-1 text-[10px]">TBD</span>
                    {course.placeholderCategory || "Elective"}
                  </span>
                ) : (
                  course.code
                )}
              </p>
              <p className={cn(
                "truncate text-xs",
                course.isPlaceholder ? "text-[#6b5d4b]/75 italic" : "text-[#40505a]"
              )}>
                {course.name}
              </p>
              {!course.isPlaceholder && course.fulfills && course.fulfills.length > 0 && (
                <p className="mt-0.5 text-[10px] text-muted-foreground/60 leading-tight">
                  {course.fulfills.join(" · ")}
                </p>
              )}
              {course.scheduleDisclaimer && (
                <p className="mt-0.5 text-[10px] text-amber-600/70 leading-tight italic">
                  ≈ semester may vary — confirm with advisor
                </p>
              )}
            </div>
            <Badge 
              variant={course.isPlaceholder ? "outline" : "secondary"} 
              className={cn(
                "shrink-0 text-xs",
                course.isPlaceholder && "border-dashed border-[#d59c23]/40 bg-[#fff4cb] text-[#10212a]"
              )}
            >
              {course.credits === 1 ? "1 cr" : `${course.credits} cr`}
            </Badge>
          </div>
        ))}

        {/* Credit Total */}
        <div
          className={cn(
            "flex items-center justify-between rounded-md px-2 py-1.5",
            isOverloaded ? "bg-[#fff4cb]" : "bg-[#e6f4f4]"
          )}
        >
          <span className="text-xs font-medium text-[#40505a]">
            Total
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              isOverloaded ? "text-[#a15e08]" : "text-[#10212a]"
            )}
          >
            {totalCredits} {totalCredits === 1 ? "credit" : "credits"}
            {isOverloaded && (
              <span className="ml-1 text-xs font-normal">
                ({(totalCredits - maxCredits).toFixed(totalCredits % 1 === 0 ? 0 : 2)} over)
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
