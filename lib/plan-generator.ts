// Academic plan generation logic for Lumen
// Builds a 4-year course plan based on selected majors and GEM requirements

import type {
  AcademicPlan,
  PlannedCourse,
  SemesterPlan,
  StudentProfile,
} from "./types";
import {
  MINIMUM_TOTAL_CREDITS,
  MINIMUM_CREDITS_OUTSIDE_MAJOR,
  MAX_CREDITS_PER_SEMESTER,
  NORMAL_CREDITS_PER_SEMESTER,
} from "./types";
import { GEM_REQUIREMENTS, GEM_LABELS } from "./gem-requirements";
import { MAJORS, COURSE_CATALOG } from "./majors-data";

// Sample GEM courses that fulfill various requirements
const GEM_COURSES: Record<string, PlannedCourse> = {
  // Learning & Inquiry Core
  "GSTR 110": {
    code: "GSTR 110",
    name: "Explorations",
    credits: 1,
    fulfills: ["LIC 1: Explorations"],
    category: "GEM",
  },
  "GSTR 210": {
    code: "GSTR 210",
    name: "Discoveries",
    credits: 1,
    fulfills: ["LIC 2: Discoveries"],
    category: "GEM",
  },
  "GSTR 310": {
    code: "GSTR 310",
    name: "Intersectional Justice in U.S.",
    credits: 1,
    fulfills: ["LIC 3: Intersectional Justice"],
    category: "GEM",
  },
  "GSTR 410": {
    code: "GSTR 410",
    name: "Global Issues",
    credits: 1,
    fulfills: ["LIC 4: Global Issues"],
    category: "GEM",
  },
  // Physical Activity
  "PED 100A": {
    code: "PED 100A",
    name: "Physical Activity I",
    credits: 0.5,
    fulfills: ["Physical Activity"],
    category: "GEM",
  },
  "PED 100B": {
    code: "PED 100B",
    name: "Physical Activity II",
    credits: 0.5,
    fulfills: ["Physical Activity"],
    category: "GEM",
  },
  "PED 100C": {
    code: "PED 100C",
    name: "Physical Activity III",
    credits: 0.5,
    fulfills: ["Physical Activity"],
    category: "GEM",
  },
  "PED 100D": {
    code: "PED 100D",
    name: "Physical Activity IV",
    credits: 0.5,
    fulfills: ["Physical Activity"],
    category: "GEM",
  },
  // ALE
  "ALE 100": {
    code: "ALE 100",
    name: "Academic Life Experience",
    credits: 1,
    fulfills: ["ALE"],
    category: "GEM",
  },
  // Ways of Knowing samples
  "ENG 101": {
    code: "ENG 101",
    name: "Writing I",
    credits: 1,
    fulfills: ["WoK: Humanities", "Richness: Writing"],
    category: "GEM",
  },
  "ENG 102": {
    code: "ENG 102",
    name: "Writing II",
    credits: 1,
    fulfills: ["WoK: Humanities", "Richness: Writing"],
    category: "GEM",
  },
  "ART 100": {
    code: "ART 100",
    name: "Intro to Visual Arts",
    credits: 1,
    fulfills: ["WoK: Creative Arts"],
    category: "GEM",
  },
  "SOC 100": {
    code: "SOC 100",
    name: "Intro to Sociology",
    credits: 1,
    fulfills: ["WoK: Social Science"],
    category: "GEM",
  },
  "ANT 100": {
    code: "ANT 100",
    name: "Cultural Anthropology",
    credits: 1,
    fulfills: ["WoK: Cultural & Ethnic Studies", "Value: Beyond the Borders"],
    category: "GEM",
  },
  "BUS 100": {
    code: "BUS 100",
    name: "Intro to Business",
    credits: 1,
    fulfills: ["WoK: Applied Studies"],
    category: "GEM",
  },
};

export function generateAcademicPlan(profile: StudentProfile): AcademicPlan {
  const semesters: SemesterPlan[] = [];
  const warnings: string[] = [];
  const unfulfilledRequirements: string[] = [];

  // Track what requirements have been fulfilled
  const fulfilledRequirements = new Set<string>();
  const plannedCourses = new Set<string>();

  // Initialize 8 semesters (4 years)
  for (let year = 1; year <= 4; year++) {
    for (const semester of ["Fall", "Spring"] as const) {
      semesters.push({
        year,
        semester,
        courses: [],
        totalCredits: 0,
        isOverloaded: false,
      });
    }
  }

  // Get major requirements
  const majorCourses: PlannedCourse[] = [];
  let totalMajorCredits = 0;

  for (const majorCode of profile.majors) {
    const major = MAJORS[majorCode];
    if (!major) continue;

    for (const req of major.requirements) {
      // Add must-include courses first
      if (req.mustInclude) {
        for (const courseCode of req.mustInclude) {
          if (plannedCourses.has(courseCode)) continue;

          const courseData = COURSE_CATALOG[courseCode];
          if (courseData) {
            majorCourses.push({
              code: courseData.code,
              name: courseData.name,
              credits: courseData.credits,
              fulfills: [`${major.name}: ${req.category}`],
              category: "Major",
            });
            plannedCourses.add(courseCode);
            totalMajorCredits += courseData.credits;
          }
        }
      }

      // Fill remaining required courses
      const mustIncludeCount = req.mustInclude?.length || 0;
      const remainingNeeded = req.coursesRequired - mustIncludeCount;

      if (remainingNeeded > 0) {
        let added = 0;
        for (const courseCode of req.courses) {
          if (added >= remainingNeeded) break;
          if (plannedCourses.has(courseCode)) continue;
          if (req.mustInclude?.includes(courseCode)) continue;

          const courseData = COURSE_CATALOG[courseCode];
          if (courseData) {
            majorCourses.push({
              code: courseData.code,
              name: courseData.name,
              credits: courseData.credits,
              fulfills: [`${major.name}: ${req.category}`],
              category: "Major",
            });
            plannedCourses.add(courseCode);
            totalMajorCredits += courseData.credits;
            added++;
          }
        }
      }
    }
  }

  // Add GEM courses
  const gemCourses: PlannedCourse[] = [
    GEM_COURSES["GSTR 110"],
    GEM_COURSES["GSTR 210"],
    GEM_COURSES["GSTR 310"],
    GEM_COURSES["GSTR 410"],
    GEM_COURSES["ENG 101"],
    GEM_COURSES["ENG 102"],
    GEM_COURSES["ART 100"],
    GEM_COURSES["SOC 100"],
    GEM_COURSES["ANT 100"],
    GEM_COURSES["BUS 100"],
    GEM_COURSES["PED 100A"],
    GEM_COURSES["PED 100B"],
    GEM_COURSES["PED 100C"],
    GEM_COURSES["PED 100D"],
    GEM_COURSES["ALE 100"],
  ];

  // Calculate credits outside major
  let creditsOutsideMajor = gemCourses.reduce((sum, c) => sum + c.credits, 0);

  // Distribute courses across semesters
  let courseIndex = 0;
  const allCourses = [...majorCourses, ...gemCourses];

  // Sort courses: core/intro courses first, capstones last
  allCourses.sort((a, b) => {
    const aLevel = parseInt(a.code.match(/\d+/)?.[0] || "0");
    const bLevel = parseInt(b.code.match(/\d+/)?.[0] || "0");

    // Capstones go to year 4
    if (a.fulfills.some((f) => f.includes("Capstone"))) return 1;
    if (b.fulfills.some((f) => f.includes("Capstone"))) return -1;

    // LIC courses in order
    if (a.code.startsWith("GSTR") && b.code.startsWith("GSTR")) {
      return aLevel - bLevel;
    }

    return aLevel - bLevel;
  });

  // Distribute to semesters
  for (const course of allCourses) {
    // Find best semester for this course
    let targetSemester = 0;

    // LIC courses go in specific years
    if (course.code === "GSTR 110") targetSemester = 0; // Year 1 Fall
    else if (course.code === "GSTR 210") targetSemester = 1; // Year 1 Spring
    else if (course.code === "GSTR 310") targetSemester = 4; // Year 3 Fall
    else if (course.code === "GSTR 410") targetSemester = 6; // Year 4 Fall
    // Capstones go to Year 4
    else if (course.fulfills.some((f) => f.includes("Capstone"))) {
      targetSemester = 7; // Year 4 Spring
    }
    // 400-level courses go to Year 3-4
    else if (parseInt(course.code.match(/\d+/)?.[0] || "0") >= 400) {
      targetSemester = Math.floor(Math.random() * 2) + 5; // Year 3 Spring or Year 4
    }
    // 300-level courses go to Year 2-3
    else if (parseInt(course.code.match(/\d+/)?.[0] || "0") >= 300) {
      targetSemester = Math.floor(Math.random() * 2) + 3; // Year 2 Spring or Year 3
    }
    // 200-level courses go to Year 1-2
    else if (parseInt(course.code.match(/\d+/)?.[0] || "0") >= 200) {
      targetSemester = Math.floor(Math.random() * 2) + 1; // Year 1 Spring or Year 2
    }
    // 100-level courses go to Year 1
    else {
      targetSemester = Math.floor(Math.random() * 2); // Year 1
    }

    // Find a semester with room
    let placed = false;
    for (let offset = 0; offset < 8 && !placed; offset++) {
      const semIdx = (targetSemester + offset) % 8;
      if (semesters[semIdx].totalCredits + course.credits <= MAX_CREDITS_PER_SEMESTER) {
        semesters[semIdx].courses.push(course);
        semesters[semIdx].totalCredits += course.credits;
        placed = true;
      }
    }

    // Force place if needed
    if (!placed) {
      semesters[targetSemester].courses.push(course);
      semesters[targetSemester].totalCredits += course.credits;
      semesters[targetSemester].isOverloaded = true;
    }
  }

  // Mark overloaded semesters
  for (const semester of semesters) {
    if (semester.totalCredits > NORMAL_CREDITS_PER_SEMESTER) {
      semester.isOverloaded = true;
    }
  }

  // Calculate totals
  const totalCredits = semesters.reduce((sum, s) => sum + s.totalCredits, 0);

  // Check minimum requirements
  if (totalCredits < MINIMUM_TOTAL_CREDITS) {
    warnings.push(
      `Total credits (${totalCredits}) below minimum requirement (${MINIMUM_TOTAL_CREDITS})`
    );
  }

  if (creditsOutsideMajor < MINIMUM_CREDITS_OUTSIDE_MAJOR) {
    warnings.push(
      `Credits outside major (${creditsOutsideMajor}) below minimum requirement (${MINIMUM_CREDITS_OUTSIDE_MAJOR})`
    );
  }

  // Check GEM requirements
  const checkGEMRequirements = () => {
    // This would check against actual fulfilled requirements
    // For now, we assume the plan is complete
  };

  return {
    student: profile,
    semesters,
    totalCredits,
    creditsOutsideMajor,
    unfulfilledRequirements,
    warnings,
  };
}

// Get summary statistics for a plan
export function getPlanStats(plan: AcademicPlan) {
  const totalCourses = plan.semesters.reduce(
    (sum, s) => sum + s.courses.length,
    0
  );
  const majorCourses = plan.semesters.reduce(
    (sum, s) => sum + s.courses.filter((c) => c.category === "Major").length,
    0
  );
  const gemCourses = plan.semesters.reduce(
    (sum, s) => sum + s.courses.filter((c) => c.category === "GEM").length,
    0
  );
  const overloadedSemesters = plan.semesters.filter((s) => s.isOverloaded).length;

  return {
    totalCredits: plan.totalCredits,
    totalCourses,
    majorCourses,
    gemCourses,
    creditsOutsideMajor: plan.creditsOutsideMajor,
    overloadedSemesters,
    hasWarnings: plan.warnings.length > 0,
  };
}
