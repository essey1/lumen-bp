import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Download,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react"
import { StudentProfile } from "@/components/plan/student-profile"
import { SemesterCard } from "@/components/plan/semester-card"
import { OverflowWarning } from "@/components/plan/overflow-warning"

// Mock student profile data
const MOCK_PROFILE = {
  majors: ["Computer Science", "Mathematics"],
  minors: ["Philosophy"],
  interests: ["Technology", "Research", "Writing"],
  careerGoals: ["Software Engineer", "Graduate School"],
}

// Mock course data for 4 years
const MOCK_PLAN = {
  year1: {
    fall: {
      courses: [
        { code: "CSC 120", name: "Introduction to Programming", credits: 4 },
        { code: "MAT 135", name: "Calculus I", credits: 4 },
        { code: "ENG 101", name: "College Writing I", credits: 3 },
        { code: "GST 101", name: "First Year Seminar", credits: 3 },
      ],
    },
    spring: {
      courses: [
        { code: "CSC 226", name: "Data Structures", credits: 4 },
        { code: "MAT 136", name: "Calculus II", credits: 4 },
        { code: "ENG 102", name: "College Writing II", credits: 3 },
        { code: "PHI 101", name: "Introduction to Philosophy", credits: 3 },
      ],
    },
  },
  year2: {
    fall: {
      courses: [
        { code: "CSC 303", name: "Algorithms", credits: 4 },
        { code: "MAT 225", name: "Linear Algebra", credits: 3 },
        { code: "CSC 236", name: "Computer Organization", credits: 4 },
        { code: "PHI 210", name: "Logic and Reasoning", credits: 3 },
      ],
    },
    spring: {
      courses: [
        { code: "CSC 310", name: "Database Systems", credits: 3 },
        { code: "MAT 301", name: "Real Analysis", credits: 3 },
        { code: "CSC 345", name: "Operating Systems", credits: 4 },
        { code: "SCI 101", name: "Natural Science Lab", credits: 4 },
      ],
    },
  },
  year3: {
    fall: {
      courses: [
        { code: "CSC 405", name: "Software Engineering", credits: 4 },
        { code: "MAT 320", name: "Probability & Statistics", credits: 3 },
        { code: "CSC 380", name: "Computer Networks", credits: 3 },
        { code: "PHI 305", name: "Ethics in Technology", credits: 3 },
      ],
    },
    spring: {
      // This semester is over capacity to demo the warning
      courses: [
        { code: "CSC 420", name: "Artificial Intelligence", credits: 4 },
        { code: "CSC 450", name: "Machine Learning", credits: 4 },
        { code: "MAT 410", name: "Abstract Algebra", credits: 3 },
        { code: "CSC 399", name: "Research Methods", credits: 3 },
        { code: "HUM 201", name: "Humanities Requirement", credits: 3 },
      ],
      isOverloaded: true,
    },
  },
  year4: {
    fall: {
      courses: [
        { code: "CSC 490", name: "Senior Capstone I", credits: 4 },
        { code: "CSC 460", name: "Computer Security", credits: 3 },
        { code: "MAT 450", name: "Mathematical Modeling", credits: 3 },
        { code: "GEN 401", name: "General Elective", credits: 3 },
      ],
    },
    spring: {
      courses: [
        { code: "CSC 491", name: "Senior Capstone II", credits: 4 },
        { code: "CSC 470", name: "Advanced Topics in CS", credits: 3 },
        { code: "PHI 401", name: "Senior Philosophy Seminar", credits: 3 },
        { code: "GEN 402", name: "General Elective", credits: 3 },
      ],
    },
  },
}

// Unfulfilled courses for overflow warning
const UNFULFILLED_COURSES = [
  { code: "PE 101", name: "Physical Education Requirement", credits: 1 },
  { code: "ART 150", name: "Fine Arts Requirement", credits: 3 },
  { code: "SOC 201", name: "Social Science Elective", credits: 3 },
]

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Lumen</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/planner">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Edit Preferences
              </Button>
            </Link>
            <Button size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            Your Academic Plan
          </h1>
          <p className="text-muted-foreground">
            A personalized 4-year course roadmap based on your goals
          </p>
        </div>

        {/* Student Profile Summary */}
        <StudentProfile profile={MOCK_PROFILE} />

        {/* 4-Year Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Year 1 */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              Year 1
            </h2>
            <SemesterCard
              title="Fall Semester"
              courses={MOCK_PLAN.year1.fall.courses}
            />
            <SemesterCard
              title="Spring Semester"
              courses={MOCK_PLAN.year1.spring.courses}
            />
          </div>

          {/* Year 2 */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              Year 2
            </h2>
            <SemesterCard
              title="Fall Semester"
              courses={MOCK_PLAN.year2.fall.courses}
            />
            <SemesterCard
              title="Spring Semester"
              courses={MOCK_PLAN.year2.spring.courses}
            />
          </div>

          {/* Year 3 */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              Year 3
            </h2>
            <SemesterCard
              title="Fall Semester"
              courses={MOCK_PLAN.year3.fall.courses}
            />
            <SemesterCard
              title="Spring Semester"
              courses={MOCK_PLAN.year3.spring.courses}
              isOverloaded
            />
          </div>

          {/* Year 4 */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              Year 4
            </h2>
            <SemesterCard
              title="Fall Semester"
              courses={MOCK_PLAN.year4.fall.courses}
            />
            <SemesterCard
              title="Spring Semester"
              courses={MOCK_PLAN.year4.spring.courses}
            />
          </div>
        </div>

        {/* Overflow Warning */}
        <OverflowWarning courses={UNFULFILLED_COURSES} />

        {/* Summary Stats */}
        <Card className="mt-8 border-border bg-card">
          <CardContent className="py-6">
            <div className="grid gap-6 text-center md:grid-cols-4">
              <div>
                <p className="text-3xl font-bold text-primary">128</p>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">8</p>
                <p className="text-sm text-muted-foreground">Semesters</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">32</p>
                <p className="text-sm text-muted-foreground">Courses</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-warning">3</p>
                <p className="text-sm text-muted-foreground">
                  Additional Courses Needed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            This is a sample plan based on your preferences. Consult with your
            academic advisor for official course registration.
          </p>
        </div>
      </footer>
    </div>
  )
}
