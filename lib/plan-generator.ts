// Academic plan generation logic for Lumen
// Builds a 4-year course plan based on selected majors and GEM requirements
// Rules:
// - Exactly 4 credits per semester (no more, no less)
// - Maximum 2 major courses per semester
// - L&I 100, 200 freshman; L&I 300 soph/junior; L&I 400 senior
// - Core major courses in freshman/sophomore, upper-level in junior/senior

import type {
  AcademicPlan,
  PlannedCourse,
  SemesterPlan,
  StudentProfile,
} from "./types";
import {
  MINIMUM_TOTAL_CREDITS,
  MINIMUM_CREDITS_OUTSIDE_MAJOR,
} from "./types";
import { MAJORS, COURSE_CATALOG } from "./majors-data";

// Ways of Knowing placeholder courses
function createWoKPlaceholder(category: string, interest?: string): PlannedCourse {
  const interestNote = interest ? ` (related to ${interest})` : "";
  return {
    code: `WoK`,
    name: `${category} Perspective${interestNote}`,
    credits: 1,
    fulfills: [`WoK: ${category}`],
    category: "GEM",
    isPlaceholder: true,
    placeholderCategory: `Ways of Knowing: ${category}`,
  };
}

// Richness placeholder courses
function createRichnessPlaceholder(richness: string): PlannedCourse {
  return {
    code: `Richness`,
    name: `Course with ${richness} Richness`,
    credits: 1,
    fulfills: [`Richness: ${richness}`],
    category: "GEM",
    isPlaceholder: true,
    placeholderCategory: `Richness: ${richness}`,
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
    code: `${majorCode}`,
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
  return {
    code: `Elective`,
    name: `Elective related to ${interest}`,
    credits: 1,
    fulfills: ["Interest-based Elective"],
    category: "Elective",
    isPlaceholder: true,
    placeholderCategory: interest,
  };
}

// Create generic elective placeholder
function createElectivePlaceholder(): PlannedCourse {
  return {
    code: `Elective`,
    name: `Free Elective`,
    credits: 1,
    fulfills: ["Free Elective"],
    category: "Elective",
    isPlaceholder: true,
    placeholderCategory: "Free Choice",
  };
}

export function generateAcademicPlan(profile: StudentProfile): AcademicPlan {
  const semesters: SemesterPlan[] = [];
  const warnings: string[] = [];
  const unfulfilledRequirements: string[] = [];
  const plannedCourses = new Set<string>();

  // Initialize 8 semesters (4 years) - each will have exactly 4 credits
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

  // Check if too many majors
  if (profile.majors.length > 2) {
    warnings.push(
      "With more than 2 majors, you may not be able to complete all requirements within 8 semesters"
    );
  }

  // Collect all courses by type
  const coreMajorCourses: PlannedCourse[] = [];
  const upperMajorCourses: PlannedCourse[] = [];
  const capstoneCourses: PlannedCourse[] = [];
  const gemCourses: PlannedCourse[] = [];
  const electiveCourses: PlannedCourse[] = [];

  // STEP 1: Add L&I courses (fixed placement)
  // These are added directly to semesters, not to the pool
  const liCourses = [
    { semIdx: 0, code: "L&I 100", name: "Explorations", fulfills: ["L&I 100: Explorations"] },
    { semIdx: 1, code: "L&I 200", name: "Discoveries", fulfills: ["L&I 200: Discoveries"] },
    { semIdx: 2, code: "L&I 300", name: "Intersectional Justice in U.S.", fulfills: ["L&I 300: Intersectional Justice"] },
    { semIdx: 6, code: "L&I 400", name: "Global Issues", fulfills: ["L&I 400: Global Issues"] },
  ];

  for (const li of liCourses) {
    semesters[li.semIdx].courses.push({
      code: li.code,
      name: li.name,
      credits: 1,
      fulfills: li.fulfills,
      category: "GEM",
    });
    semesters[li.semIdx].totalCredits += 1;
  }

  // STEP 2: Collect major courses
  for (const majorCode of profile.majors) {
    const major = MAJORS[majorCode];
    if (!major) continue;

    for (const req of major.requirements) {
      const isCapstone = req.category.toLowerCase().includes("capstone");
      const isUpperLevel = req.category.toLowerCase().includes("upper") || 
                          req.category.toLowerCase().includes("distribution") ||
                          req.category.toLowerCase().includes("advanced") ||
                          req.category.toLowerCase().includes("exploratory");

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
        const needed = req.coursesRequired - (req.mustInclude?.length || 0);
        for (let i = 0; i < needed; i++) {
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
            const placeholder = createMajorPlaceholder(majorCode, req.category, isUpperLevel ? "Upper-level" : undefined);
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

  // STEP 3: Add GEM perspective courses (Ways of Knowing)
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
  const interestForWoK = profile.interests[0] || undefined;
  for (const wok of wokCategories) {
    gemCourses.push(createWoKPlaceholder(wok, interestForWoK));
  }

  // Add Richness requirements
  gemCourses.push(createRichnessPlaceholder("International"));
  gemCourses.push(createRichnessPlaceholder("Quantitative"));
  gemCourses.push(createRichnessPlaceholder("Writing"));
  gemCourses.push(createRichnessPlaceholder("Writing")); // Need 2

  // Add ALE
  gemCourses.push({
    code: "ALE",
    name: "Applied Learning Experience",
    credits: 1,
    fulfills: ["ALE"],
    category: "GEM",
    isPlaceholder: true,
    placeholderCategory: "Applied Learning",
  });

  // STEP 4: Add interest-based electives
  for (const interest of profile.interests.slice(0, 3)) {
    electiveCourses.push(createInterestPlaceholder(interest));
  }

  // STEP 5: Distribute courses to semesters
  // Rules: 
  // - Exactly 4 credits per semester
  // - Max 2 major courses per semester
  // - Core majors in Year 1-2, Upper majors in Year 3-4, Capstones in Year 4

  for (let semIdx = 0; semIdx < 8; semIdx++) {
    const year = Math.floor(semIdx / 2) + 1;
    const currentCredits = semesters[semIdx].totalCredits;
    const neededCredits = 4 - currentCredits;
    
    // Count current major courses in this semester
    const currentMajorCount = semesters[semIdx].courses.filter(c => c.category === "Major").length;
    const maxMajorsToAdd = 2 - currentMajorCount;

    let creditsAdded = 0;
    let majorsAdded = 0;

    // Year 1-2: Add core major courses (max 2 per semester)
    if (year <= 2 && coreMajorCourses.length > 0 && majorsAdded < maxMajorsToAdd) {
      while (creditsAdded < neededCredits && majorsAdded < maxMajorsToAdd && coreMajorCourses.length > 0) {
        const course = coreMajorCourses.shift()!;
        semesters[semIdx].courses.push(course);
        semesters[semIdx].totalCredits += course.credits;
        creditsAdded += course.credits;
        majorsAdded++;
      }
    }

    // Year 3-4: Add upper major courses (max 2 per semester)
    if (year >= 3 && upperMajorCourses.length > 0 && majorsAdded < maxMajorsToAdd) {
      while (creditsAdded < neededCredits && majorsAdded < maxMajorsToAdd && upperMajorCourses.length > 0) {
        const course = upperMajorCourses.shift()!;
        semesters[semIdx].courses.push(course);
        semesters[semIdx].totalCredits += course.credits;
        creditsAdded += course.credits;
        majorsAdded++;
      }
    }

    // Year 4: Add capstones
    if (year === 4 && capstoneCourses.length > 0 && majorsAdded < maxMajorsToAdd) {
      while (creditsAdded < neededCredits && majorsAdded < maxMajorsToAdd && capstoneCourses.length > 0) {
        const course = capstoneCourses.shift()!;
        semesters[semIdx].courses.push(course);
        semesters[semIdx].totalCredits += course.credits;
        creditsAdded += course.credits;
        majorsAdded++;
      }
    }

    // Fill remaining slots with GEM courses
    while (creditsAdded < neededCredits && gemCourses.length > 0) {
      const course = gemCourses.shift()!;
      semesters[semIdx].courses.push(course);
      semesters[semIdx].totalCredits += course.credits;
      creditsAdded += course.credits;
    }

    // Fill remaining with interest-based electives
    while (creditsAdded < neededCredits && electiveCourses.length > 0) {
      const course = electiveCourses.shift()!;
      semesters[semIdx].courses.push(course);
      semesters[semIdx].totalCredits += course.credits;
      creditsAdded += course.credits;
    }

    // If still need credits, add generic electives
    while (creditsAdded < neededCredits) {
      const course = createElectivePlaceholder();
      semesters[semIdx].courses.push(course);
      semesters[semIdx].totalCredits += course.credits;
      creditsAdded += course.credits;
    }
  }

  // STEP 6: Handle remaining courses that couldn't fit
  const remainingCourses = [
    ...coreMajorCourses,
    ...upperMajorCourses,
    ...capstoneCourses,
    ...gemCourses,
  ];

  for (const course of remainingCourses) {
    unfulfilledRequirements.push(`${course.name} (${course.fulfills.join(", ")})`);
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
