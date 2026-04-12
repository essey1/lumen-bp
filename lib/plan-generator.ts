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
  SEMESTER_CREDITS,
} from "./types";
import { MAJORS, COURSE_CATALOG } from "./majors-data";

// Interest-based placeholder suggestions
const INTEREST_SUGGESTIONS: Record<string, string> = {
  "Artificial Intelligence": "AI/Machine Learning",
  "Web Development": "Web Technologies",
  "Cybersecurity": "Security",
  "Game Design": "Game Development",
  "Data Science": "Data Analytics",
  "Robotics": "Robotics/Embedded Systems",
  "Environmental Science": "Environmental Studies",
  "Social Justice": "Social Justice",
  "Music": "Music/Performance",
  "Health Sciences": "Health/Pre-Med",
  "Research": "Research Methods",
  "Design": "Design/Prototyping",
  "Mental Health": "Psychology/Counseling",
};

// GEM courses for the new curriculum
const GEM_COURSES: PlannedCourse[] = [
  // Learning & Inquiry Core (4 courses)
  {
    code: "GSTR 110",
    name: "Explorations",
    credits: 1,
    fulfills: ["LIC 1: Explorations"],
    category: "GEM",
  },
  {
    code: "GSTR 210",
    name: "Discoveries",
    credits: 1,
    fulfills: ["LIC 2: Discoveries"],
    category: "GEM",
  },
  {
    code: "GSTR 310",
    name: "Intersectional Justice in U.S.",
    credits: 1,
    fulfills: ["LIC 3: Intersectional Justice"],
    category: "GEM",
  },
  {
    code: "GSTR 410",
    name: "Global Issues",
    credits: 1,
    fulfills: ["LIC 4: Global Issues"],
    category: "GEM",
  },
  // Physical Activity (2 required, 0 credit each)
  {
    code: "PED 100A",
    name: "Physical Activity I",
    credits: 0,
    fulfills: ["Physical Activity"],
    category: "GEM",
  },
  {
    code: "PED 100B",
    name: "Physical Activity II",
    credits: 0,
    fulfills: ["Physical Activity"],
    category: "GEM",
  },
  // ALE
  {
    code: "ALE 100",
    name: "Applied Learning Experience",
    credits: 1,
    fulfills: ["ALE"],
    category: "GEM",
  },
];

// Ways of Knowing placeholder courses (to be filled based on major overlap)
function createWoKPlaceholder(category: string, interest?: string): PlannedCourse {
  const interestNote = interest ? ` (related to ${interest})` : "";
  return {
    code: `WoK-${category.toUpperCase().slice(0, 3)}`,
    name: `${category} Course${interestNote}`,
    credits: 1,
    fulfills: [`WoK: ${category}`],
    category: "GEM",
    isPlaceholder: true,
    placeholderCategory: category,
  };
}

// Richness placeholder courses
function createRichnessPlaceholder(richness: string): PlannedCourse {
  return {
    code: `RICH-${richness.toUpperCase().slice(0, 3)}`,
    name: `Course with ${richness} Richness`,
    credits: 1,
    fulfills: [`Richness: ${richness}`],
    category: "GEM",
    isPlaceholder: true,
    placeholderCategory: richness,
  };
}

// Create placeholder for major category
function createMajorPlaceholder(
  majorCode: string,
  category: string,
  level?: string
): PlannedCourse {
  const levelText = level ? `${level} ` : "";
  return {
    code: `${majorCode}-${category.toUpperCase().slice(0, 3)}`,
    name: `${levelText}${majorCode} course in ${category}`,
    credits: 1,
    fulfills: [`${majorCode}: ${category}`],
    category: "Major",
    isPlaceholder: true,
    placeholderCategory: category,
  };
}

// Create interest-based elective placeholder
function createInterestPlaceholder(interest: string): PlannedCourse {
  const suggestion = INTEREST_SUGGESTIONS[interest] || interest;
  return {
    code: `ELEC-INT`,
    name: `Elective related to ${suggestion}`,
    credits: 1,
    fulfills: ["Interest-based Elective"],
    category: "Elective",
    isPlaceholder: true,
    placeholderCategory: interest,
  };
}

function getSemesterCredits(year: number, semester: "Fall" | "Spring"): number {
  const key = `${year}-${semester}` as keyof typeof SEMESTER_CREDITS;
  return SEMESTER_CREDITS[key] || 4;
}

export function generateAcademicPlan(profile: StudentProfile): AcademicPlan {
  const semesters: SemesterPlan[] = [];
  const warnings: string[] = [];
  const unfulfilledRequirements: string[] = [];

  // Track planned courses
  const plannedCourses = new Set<string>();
  const allCourses: PlannedCourse[] = [];

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

  // Calculate total major credits needed
  let totalMajorCreditsNeeded = 0;
  for (const majorCode of profile.majors) {
    const major = MAJORS[majorCode];
    if (major) {
      totalMajorCreditsNeeded += major.totalMajorCredits;
    }
  }

  // Check if multiple majors might exceed what's possible
  if (profile.majors.length > 2) {
    warnings.push(
      "With more than 2 majors, you may not be able to complete all requirements within 8 semesters"
    );
  }

  // Process each major's requirements
  for (const majorCode of profile.majors) {
    const major = MAJORS[majorCode];
    if (!major) continue;

    for (const req of major.requirements) {
      let coursesAdded = 0;
      const neededCourses = req.coursesRequired;

      // Add must-include courses first (these are specific required courses)
      if (req.mustInclude) {
        for (const courseCode of req.mustInclude) {
          if (plannedCourses.has(courseCode)) continue;

          const courseData = COURSE_CATALOG[courseCode];
          if (courseData) {
            allCourses.push({
              code: courseData.code,
              name: courseData.name,
              credits: courseData.credits,
              fulfills: [`${major.name}: ${req.category}`],
              category: "Major",
            });
            plannedCourses.add(courseCode);
            coursesAdded++;
          }
        }
      }

      // For categories with selectFromCategories (like CSC upper-level)
      if (req.selectFromCategories) {
        for (const subCat of req.selectFromCategories) {
          // Add placeholder for each subcategory requirement
          const placeholder = createMajorPlaceholder(
            majorCode,
            subCat.category,
            "Upper-level"
          );
          allCourses.push(placeholder);
          coursesAdded++;
        }

        // If we need a 400-level, add that placeholder
        if (req.minUpperLevel && req.minUpperLevel > 0) {
          const placeholder = createMajorPlaceholder(
            majorCode,
            "400-Level Elective",
            "400-level"
          );
          // Don't add extra if already covered
        }
      } else {
        // Fill remaining with actual courses or placeholders
        const remainingNeeded = neededCourses - coursesAdded;
        let addedFromList = 0;

        for (const courseCode of req.courses) {
          if (addedFromList >= remainingNeeded) break;
          if (plannedCourses.has(courseCode)) continue;
          if (req.mustInclude?.includes(courseCode)) continue;

          const courseData = COURSE_CATALOG[courseCode];
          if (courseData) {
            allCourses.push({
              code: courseData.code,
              name: courseData.name,
              credits: courseData.credits,
              fulfills: [`${major.name}: ${req.category}`],
              category: "Major",
            });
            plannedCourses.add(courseCode);
            addedFromList++;
          }
        }

        // If we still need more, add placeholders
        const stillNeeded = remainingNeeded - addedFromList;
        for (let i = 0; i < stillNeeded; i++) {
          const placeholder = createMajorPlaceholder(majorCode, req.category);
          allCourses.push(placeholder);
        }
      }
    }
  }

  // Add GEM courses
  for (const gemCourse of GEM_COURSES) {
    allCourses.push({ ...gemCourse });
  }

  // Add Ways of Knowing placeholders (these may overlap with major courses)
  const wokCategories = [
    "Applied Studies",
    "Creative Arts",
    "Cultural & Ethnic Studies",
    "Humanities",
    "Quantitative Focus",
    "Natural Science",
    "Natural Science", // Need 2
    "Social Science",
  ];

  // Find an interest to suggest for each WoK
  const interestForWoK = profile.interests[0] || undefined;
  for (const wok of wokCategories) {
    allCourses.push(createWoKPlaceholder(wok, interestForWoK));
  }

  // Add Richness requirements
  allCourses.push(createRichnessPlaceholder("International"));
  allCourses.push(createRichnessPlaceholder("Quantitative"));
  allCourses.push(createRichnessPlaceholder("Writing"));
  allCourses.push(createRichnessPlaceholder("Writing")); // Need 2

  // Add interest-based electives
  for (const interest of profile.interests.slice(0, 2)) {
    allCourses.push(createInterestPlaceholder(interest));
  }

  // Sort courses by level for proper sequencing
  allCourses.sort((a, b) => {
    // GEM LIC courses in specific order
    if (a.code === "GSTR 110") return -1;
    if (b.code === "GSTR 110") return 1;
    if (a.code === "GSTR 210") return -1;
    if (b.code === "GSTR 210") return 1;

    // Capstones go last
    if (a.fulfills.some((f) => f.includes("Capstone"))) return 1;
    if (b.fulfills.some((f) => f.includes("Capstone"))) return -1;

    // Physical activity can go anywhere
    if (a.code.startsWith("PED")) return 0;
    if (b.code.startsWith("PED")) return 0;

    // Sort by course number
    const aLevel = parseInt(a.code.match(/\d+/)?.[0] || "100");
    const bLevel = parseInt(b.code.match(/\d+/)?.[0] || "100");
    return aLevel - bLevel;
  });

  // Distribute courses to semesters based on credit loading rules
  const coursesToPlace = [...allCourses];

  for (let semIdx = 0; semIdx < 8; semIdx++) {
    const year = Math.floor(semIdx / 2) + 1;
    const semester = semIdx % 2 === 0 ? "Fall" : "Spring";
    const targetCredits = getSemesterCredits(year, semester as "Fall" | "Spring");

    while (
      semesters[semIdx].totalCredits < targetCredits &&
      coursesToPlace.length > 0
    ) {
      // Find appropriate course for this semester level
      let courseIdx = -1;

      // First, try to find LIC courses for the right year
      if (semIdx === 0) {
        courseIdx = coursesToPlace.findIndex((c) => c.code === "GSTR 110");
      } else if (semIdx === 1) {
        courseIdx = coursesToPlace.findIndex((c) => c.code === "GSTR 210");
      } else if (semIdx === 4) {
        courseIdx = coursesToPlace.findIndex((c) => c.code === "GSTR 310");
      } else if (semIdx === 6) {
        courseIdx = coursesToPlace.findIndex((c) => c.code === "GSTR 410");
      }

      // Capstones go in year 4
      if (courseIdx === -1 && semIdx >= 6) {
        courseIdx = coursesToPlace.findIndex((c) =>
          c.fulfills.some((f) => f.includes("Capstone"))
        );
      }

      // 400-level courses go in year 3-4
      if (courseIdx === -1 && semIdx >= 4) {
        courseIdx = coursesToPlace.findIndex((c) => {
          const level = parseInt(c.code.match(/\d+/)?.[0] || "0");
          return level >= 400 && !c.fulfills.some((f) => f.includes("Capstone"));
        });
      }

      // 300-level courses go in year 2-4
      if (courseIdx === -1 && semIdx >= 2) {
        courseIdx = coursesToPlace.findIndex((c) => {
          const level = parseInt(c.code.match(/\d+/)?.[0] || "0");
          return level >= 300 && level < 400;
        });
      }

      // Take any remaining course
      if (courseIdx === -1 && coursesToPlace.length > 0) {
        courseIdx = 0;
      }

      if (courseIdx !== -1) {
        const course = coursesToPlace.splice(courseIdx, 1)[0];
        semesters[semIdx].courses.push(course);
        semesters[semIdx].totalCredits += course.credits;
      } else {
        break;
      }
    }
  }

  // Add any remaining courses to available semesters
  for (const course of coursesToPlace) {
    let placed = false;

    // Try to find a semester with room
    for (let semIdx = 0; semIdx < 8 && !placed; semIdx++) {
      const year = Math.floor(semIdx / 2) + 1;
      const semester = semIdx % 2 === 0 ? "Fall" : "Spring";
      const targetCredits = getSemesterCredits(year, semester as "Fall" | "Spring");

      if (semesters[semIdx].totalCredits + course.credits <= targetCredits + 1) {
        semesters[semIdx].courses.push(course);
        semesters[semIdx].totalCredits += course.credits;
        placed = true;
      }
    }

    if (!placed) {
      // Course couldn't be placed
      unfulfilledRequirements.push(
        `${course.name} (${course.fulfills.join(", ")})`
      );
    }
  }

  // Mark overloaded semesters
  for (let semIdx = 0; semIdx < 8; semIdx++) {
    const year = Math.floor(semIdx / 2) + 1;
    const semester = semIdx % 2 === 0 ? "Fall" : "Spring";
    const targetCredits = getSemesterCredits(year, semester as "Fall" | "Spring");

    if (semesters[semIdx].totalCredits > targetCredits) {
      semesters[semIdx].isOverloaded = true;
    }
  }

  // Calculate totals
  const totalCredits = semesters.reduce((sum, s) => sum + s.totalCredits, 0);
  const majorCredits = semesters.reduce(
    (sum, s) =>
      sum +
      s.courses
        .filter((c) => c.category === "Major")
        .reduce((cs, c) => cs + c.credits, 0),
    0
  );
  const creditsOutsideMajor = totalCredits - majorCredits;

  // Check minimum requirements
  if (totalCredits < MINIMUM_TOTAL_CREDITS) {
    warnings.push(
      `Total credits (${totalCredits}) is below the minimum requirement of ${MINIMUM_TOTAL_CREDITS} credits`
    );
  }

  if (creditsOutsideMajor < MINIMUM_CREDITS_OUTSIDE_MAJOR) {
    warnings.push(
      `Credits outside major (${creditsOutsideMajor}) is below the minimum requirement of ${MINIMUM_CREDITS_OUTSIDE_MAJOR} credits`
    );
  }

  // Add warning if requirements couldn't be fulfilled
  if (unfulfilledRequirements.length > 0) {
    warnings.push(
      `The plan could not fulfill all requirements within 8 semesters. ${unfulfilledRequirements.length} requirement(s) remain unfulfilled.`
    );
  }

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
  const placeholderCourses = plan.semesters.reduce(
    (sum, s) => sum + s.courses.filter((c) => c.isPlaceholder).length,
    0
  );
  const overloadedSemesters = plan.semesters.filter((s) => s.isOverloaded).length;

  return {
    totalCredits: plan.totalCredits,
    totalCourses,
    majorCourses,
    gemCourses,
    placeholderCourses,
    creditsOutsideMajor: plan.creditsOutsideMajor,
    overloadedSemesters,
    hasWarnings: plan.warnings.length > 0,
    unfulfilledCount: plan.unfulfilledRequirements.length,
  };
}
