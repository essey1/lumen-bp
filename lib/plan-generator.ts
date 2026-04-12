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

// L&I (Learning & Inquiry) courses for new GEM curriculum
// L&I 100 prereq for 200, 200 prereq for 300
// L&I 100, 200 = Freshman only
// L&I 300 = Sophomore or Junior  
// L&I 400 = Senior only
const LI_COURSES = {
  "L&I 100": {
    code: "L&I 100",
    name: "Explorations",
    credits: 1,
    fulfills: ["L&I 100: Explorations"],
    category: "GEM" as const,
    yearRestriction: [1], // Freshman only
    semesterHint: 0, // Fall Year 1
  },
  "L&I 200": {
    code: "L&I 200", 
    name: "Discoveries",
    credits: 1,
    fulfills: ["L&I 200: Discoveries"],
    category: "GEM" as const,
    yearRestriction: [1], // Freshman only
    semesterHint: 1, // Spring Year 1
    prerequisites: ["L&I 100"],
  },
  "L&I 300": {
    code: "L&I 300",
    name: "Intersectional Justice in U.S.",
    credits: 1,
    fulfills: ["L&I 300: Intersectional Justice"],
    category: "GEM" as const,
    yearRestriction: [2, 3], // Sophomore or Junior
    semesterHint: 4, // Fall Year 3 (can be earlier)
    prerequisites: ["L&I 200"],
  },
  "L&I 400": {
    code: "L&I 400",
    name: "Global Issues",
    credits: 1,
    fulfills: ["L&I 400: Global Issues"],
    category: "GEM" as const,
    yearRestriction: [4], // Senior only
    semesterHint: 6, // Fall Year 4
    prerequisites: ["L&I 300"],
  },
};

// Other GEM courses
const OTHER_GEM_COURSES: PlannedCourse[] = [
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

  // Helper to add course to specific semester
  const addToSemester = (semIdx: number, course: PlannedCourse) => {
    semesters[semIdx].courses.push(course);
    semesters[semIdx].totalCredits += course.credits;
  };

  // Helper to get year from semester index
  const getYear = (semIdx: number) => Math.floor(semIdx / 2) + 1;

  // STEP 1: Place L&I courses in their required semesters
  // L&I 100 - Fall Year 1 (semIdx 0)
  addToSemester(0, {
    code: "L&I 100",
    name: "Explorations",
    credits: 1,
    fulfills: ["L&I 100: Explorations"],
    category: "GEM",
  });

  // L&I 200 - Spring Year 1 (semIdx 1) - prereq L&I 100
  addToSemester(1, {
    code: "L&I 200",
    name: "Discoveries",
    credits: 1,
    fulfills: ["L&I 200: Discoveries"],
    category: "GEM",
  });

  // L&I 300 - Sophomore or Junior (semIdx 2-5, we'll place in Fall Year 2)
  addToSemester(2, {
    code: "L&I 300",
    name: "Intersectional Justice in U.S.",
    credits: 1,
    fulfills: ["L&I 300: Intersectional Justice"],
    category: "GEM",
  });

  // L&I 400 - Senior only (semIdx 6 or 7, we'll place in Fall Year 4)
  addToSemester(6, {
    code: "L&I 400",
    name: "Global Issues",
    credits: 1,
    fulfills: ["L&I 400: Global Issues"],
    category: "GEM",
  });

  // Add other GEM courses (Physical Activity, ALE)
  for (const gemCourse of OTHER_GEM_COURSES) {
    // Spread these across early semesters
    const targetSem = gemCourse.code === "ALE 100" ? 3 : gemCourse.code === "PED 100A" ? 0 : 1;
    addToSemester(targetSem, { ...gemCourse });
  }

  // STEP 2: Collect major courses - separate core (100-200 level) from upper (300-400 level)
  const coreMajorCourses: PlannedCourse[] = [];
  const upperMajorCourses: PlannedCourse[] = [];
  const capstoneCourses: PlannedCourse[] = [];

  for (const majorCode of profile.majors) {
    const major = MAJORS[majorCode];
    if (!major) continue;

    for (const req of major.requirements) {
      const isCapstone = req.category.toLowerCase().includes("capstone");
      const isUpperLevel = req.category.toLowerCase().includes("upper") || 
                          req.category.toLowerCase().includes("distribution") ||
                          req.category.toLowerCase().includes("advanced");

      // Add must-include courses
      if (req.mustInclude) {
        for (const courseCode of req.mustInclude) {
          if (plannedCourses.has(courseCode)) continue;

          const courseData = COURSE_CATALOG[courseCode];
          if (courseData) {
            const course: PlannedCourse = {
              code: courseData.code,
              name: courseData.name,
              credits: courseData.credits,
              fulfills: [`${major.name}: ${req.category}`],
              category: "Major",
            };
            plannedCourses.add(courseCode);
            
            const level = parseInt(courseCode.match(/\d+/)?.[0] || "100");
            if (isCapstone) {
              capstoneCourses.push(course);
            } else if (level >= 300 || isUpperLevel) {
              upperMajorCourses.push(course);
            } else {
              coreMajorCourses.push(course);
            }
          }
        }
      }

      // Handle selectFromCategories (like CSC Design/Foundations/Systems)
      if (req.selectFromCategories) {
        for (const subCat of req.selectFromCategories) {
          const placeholder = createMajorPlaceholder(majorCode, subCat.category, "Upper-level");
          upperMajorCourses.push(placeholder);
        }
      } else if (!req.mustInclude || req.coursesRequired > (req.mustInclude?.length || 0)) {
        // Fill remaining with placeholders or available courses
        const needed = req.coursesRequired - (req.mustInclude?.length || 0);
        for (let i = 0; i < needed; i++) {
          // Try to find an actual course
          let found = false;
          for (const courseCode of req.courses) {
            if (plannedCourses.has(courseCode)) continue;
            if (req.mustInclude?.includes(courseCode)) continue;
            
            const courseData = COURSE_CATALOG[courseCode];
            if (courseData) {
              const course: PlannedCourse = {
                code: courseData.code,
                name: courseData.name,
                credits: courseData.credits,
                fulfills: [`${major.name}: ${req.category}`],
                category: "Major",
              };
              plannedCourses.add(courseCode);
              
              const level = parseInt(courseCode.match(/\d+/)?.[0] || "100");
              if (isCapstone) {
                capstoneCourses.push(course);
              } else if (level >= 300 || isUpperLevel) {
                upperMajorCourses.push(course);
              } else {
                coreMajorCourses.push(course);
              }
              found = true;
              break;
            }
          }
          
          if (!found) {
            // Add placeholder
            const placeholder = createMajorPlaceholder(majorCode, req.category);
            if (isUpperLevel || isCapstone) {
              upperMajorCourses.push(placeholder);
            } else {
              coreMajorCourses.push(placeholder);
            }
          }
        }
      }
    }
  }

  // STEP 3: Add Ways of Knowing placeholders (Perspectives)
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
  const perspectivePlaceholders: PlannedCourse[] = [];
  const interestForWoK = profile.interests[0] || undefined;
  for (const wok of wokCategories) {
    perspectivePlaceholders.push(createWoKPlaceholder(wok, interestForWoK));
  }

  // Add Richness requirements as perspectives
  perspectivePlaceholders.push(createRichnessPlaceholder("International"));
  perspectivePlaceholders.push(createRichnessPlaceholder("Quantitative"));
  perspectivePlaceholders.push(createRichnessPlaceholder("Writing"));
  perspectivePlaceholders.push(createRichnessPlaceholder("Writing")); // Need 2

  // STEP 4: Place courses by year
  // Freshman & Sophomore: Core major courses + Perspectives
  // Junior & Senior: Upper-level major courses + Capstones
  
  const coursesToPlace = [
    ...coreMajorCourses,
    ...perspectivePlaceholders,
  ];
  const upperCoursesToPlace = [
    ...upperMajorCourses,
  ];

  // Interest-based electives
  for (const interest of profile.interests.slice(0, 2)) {
    coursesToPlace.push(createInterestPlaceholder(interest));
  }

  // Place core courses and perspectives in freshman/sophomore years (semIdx 0-3)
  for (let semIdx = 0; semIdx < 4; semIdx++) {
    const year = getYear(semIdx);
    const semester = semIdx % 2 === 0 ? "Fall" : "Spring";
    const targetCredits = getSemesterCredits(year, semester as "Fall" | "Spring");

    while (
      semesters[semIdx].totalCredits < targetCredits &&
      coursesToPlace.length > 0
    ) {
      const course = coursesToPlace.shift()!;
      addToSemester(semIdx, course);
    }
  }

  // Place upper-level courses in junior/senior years (semIdx 4-7)
  for (let semIdx = 4; semIdx < 8; semIdx++) {
    const year = getYear(semIdx);
    const semester = semIdx % 2 === 0 ? "Fall" : "Spring";
    const targetCredits = getSemesterCredits(year, semester as "Fall" | "Spring");

    // Reserve space for capstones in senior year
    const reserveForCapstone = semIdx >= 6 && capstoneCourses.length > 0 ? 1 : 0;

    while (
      semesters[semIdx].totalCredits < targetCredits - reserveForCapstone &&
      upperCoursesToPlace.length > 0
    ) {
      const course = upperCoursesToPlace.shift()!;
      addToSemester(semIdx, course);
    }
  }

  // Place capstones in senior year
  for (const capstone of capstoneCourses) {
    // Try fall senior first, then spring
    if (semesters[6].totalCredits < getSemesterCredits(4, "Fall")) {
      addToSemester(6, capstone);
    } else if (semesters[7].totalCredits < getSemesterCredits(4, "Spring") + 1) {
      addToSemester(7, capstone);
    } else {
      unfulfilledRequirements.push(`${capstone.name} (${capstone.fulfills.join(", ")})`);
    }
  }

  // Place any remaining courses
  const allRemaining = [...coursesToPlace, ...upperCoursesToPlace];
  for (const course of allRemaining) {
    let placed = false;
    for (let semIdx = 0; semIdx < 8 && !placed; semIdx++) {
      const year = getYear(semIdx);
      const semester = semIdx % 2 === 0 ? "Fall" : "Spring";
      const targetCredits = getSemesterCredits(year, semester as "Fall" | "Spring");

      if (semesters[semIdx].totalCredits + course.credits <= targetCredits + 1) {
        addToSemester(semIdx, course);
        placed = true;
      }
    }

    if (!placed) {
      unfulfilledRequirements.push(`${course.name} (${course.fulfills.join(", ")})`);
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
