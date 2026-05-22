-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Plan',
    "majors" TEXT NOT NULL,
    "minors" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "careerGoals" TEXT NOT NULL,
    "mathPlacement" TEXT NOT NULL DEFAULT 'none',
    "waivedCourses" TEXT NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'A',
    "semesters" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
