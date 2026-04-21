// Academic plan generation logic for Lumen
// Builds a 4-year course plan based on selected majors and GEM requirements
// Rules:
// - Exactly 4 credits per semester (no more, no less)
// - Maximum 2 major courses per semester
// - L&I 100, 200 freshman; L&I 300 soph/junior; L&I 400 senior
// - Core major courses in freshman/sophomore, upper-level in junior/senior
// - Sequential courses (e.g., CHM 221 -> CHM 222) must be in different semesters

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
import { MAJORS } from "./majors-data";
import { COURSE_CATALOG } from "./course-catalog";

// Prerequisites mapping - course that requires another course first
// Format: "COURSE" -> "PREREQUISITE" (prerequisite must be taken in earlier semester)
const PREREQUISITES: Record<string, string> = {
  "CHM 222": "CHM 221",
  "BIO 222": "BIO 221",
  "BIO 212": "BIO 211",
  "PHY 222": "PHY 221",
  "MAT 135": "MAT 115",
  "MAT 225": "MAT 135",
  "MAT 216": "MAT 135",
  // CSC prerequisite chain: 226 -> 236 -> 246
  "CSC 236": "CSC 226",
  "CSC 246": "CSC 236",
  "CSC 303": "CSC 236",
  "CSC 324": "CSC 236",
  "CSC 314": "CSC 236",
  "L&I 200": "L&I 100",
  "L&I 300": "L&I 200",
  "L&I 400": "L&I 300",
};

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

// Helper to find which semester a course is placed in
function findCourseSemester(semesters: SemesterPlan[], courseCode: string): number {
  for (let i = 0; i < semesters.length; i++) {
    if (semesters[i].courses.some(c => c.code === courseCode)) {
      return i;
    }
  }
  return -1;
}

// Check if a course can be placed in a semester (respects prerequisites)
function canPlaceInSemester(semesters: SemesterPlan[], course: PlannedCourse, semIdx: number): boolean {
  const prereq = PREREQUISITES[course.code];
  if (!prereq) return true;
  
  const prereqSemester = findCourseSemester(semesters, prereq);
  // Prerequisite must be in an earlier semester (lower index)
  return prereqSemester !== -1 && prereqSemester < semIdx;
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
  // Only courses with the major's prefix (e.g., BIO for Biology) count as "Major"
  // Collateral courses (CHM, MAT, etc.) count as "Elective" (outside major credits)
  for (const majorCode of profile.majors) {
    const major = MAJORS[majorCode];
    if (!major) continue;

    for (const req of major.requirements) {
      const isCapstone = req.category.toLowerCase().includes("capstone");
      // Distribution courses at 300+ level are upper level, but 200-level distribution can be taken earlier
      const isUpperLevel = req.category.toLowerCase().includes("upper") || 
                          req.category.toLowerCase().includes("advanced") ||
                          req.category.toLowerCase().includes("exploratory");
      const isCollateral = req.category.toLowerCase().includes("collateral");
      const isDistribution = req.category.toLowerCase().includes("distribution");

      // Helper to determine if course is in the major's department
      const isMajorCourse = (courseCode: string): boolean => {
        const prefix = courseCode.split(" ")[0];
        return prefix === majorCode;
      };

      // Add must-include courses
      if (req.mustInclude) {
        for (const courseCode of req.mustInclude) {
          if (plannedCourses.has(courseCode)) continue;

          const courseData = COURSE_CATALOG[courseCode];
          if (courseData) {
            // Only count as "Major" if it has the major's prefix
            const category = isMajorCourse(courseCode) ? "Major" : "Elective";
            const course: PlannedCourse = {
              code: courseData.code,
              name: courseData.name,
              credits: courseData.credits,
              fulfills: [`${major.name}: ${req.category}`],
              category: category,
            };
            plannedCourses.add(courseCode);
            
            const level = parseInt(courseCode.match(/\d+/)?.[0] || "100");
            
            // Collateral courses go to core (taken early) but marked as Elective
            if (isCollateral || !isMajorCourse(courseCode)) {
              coreMajorCourses.push(course);
            } else if (isCapstone) {
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
              const category = isMajorCourse(courseCode) ? "Major" : "Elective";
              const course: PlannedCourse = {
                code: courseData.code,
                name: courseData.name,
                credits: courseData.credits,
                fulfills: [`${major.name}: ${req.category}`],
                category: category,
              };
              plannedCourses.add(courseCode);
              
              const level = parseInt(courseCode.match(/\d+/)?.[0] || "100");
              if (isCollateral || !isMajorCourse(courseCode)) {
                coreMajorCourses.push(course);
              } else if (isCapstone) {
                capstoneCourses.push(course);
              } else if (level >= 300 || isUpperLevel) {
                upperMajorCourses.push(course);
              } else if (isDistribution && level >= 200) {
                // Distribution courses 200+ level go to upper level
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

  // STEP 3: Calculate how many GEM/elective courses we need
  // Total slots = 32 (8 semesters x 4 credits)
  // L&I courses already placed = 4
  // Major-related courses (core + upper + capstone) = variable
  const totalMajorRelatedCourses = coreMajorCourses.length + upperMajorCourses.length + capstoneCourses.length;
  const remainingSlots = 32 - 4 - totalMajorRelatedCourses; // 32 total - 4 L&I - major courses
  
  // Add GEM/perspective courses to fill slots
  // Many perspectives overlap with major courses
  const perspectiveCategories = [
    "Applied Studies",
    "Creative Arts", 
    "Humanities",
    "Social Science",
    "International Perspective",
    "Writing Intensive",
  ];
  
  const interestForWoK = profile.interests[0] || undefined;
  let gemCount = 0;
  let freeElectiveCount = 0;
  const MAX_FREE_ELECTIVES = 3;
  
  for (const category of perspectiveCategories) {
    if (gemCount >= remainingSlots) break;
    gemCourses.push(createWoKPlaceholder(category, interestForWoK));
    gemCount++;
  }

  // Add ALE if we have room
  if (gemCount < remainingSlots) {
    gemCourses.push({
      code: "ALE",
      name: "Applied Learning Experience",
      credits: 1,
      fulfills: ["ALE"],
      category: "GEM",
      isPlaceholder: true,
      placeholderCategory: "Applied Learning",
    });
    gemCount++;
  }

  // Fill remaining with interest-based electives (max 3 total)
  for (const interest of profile.interests) {
    if (gemCount >= remainingSlots || freeElectiveCount >= MAX_FREE_ELECTIVES) break;
    electiveCourses.push(createInterestPlaceholder(interest));
    gemCount++;
    freeElectiveCount++;
  }

  // STEP 5: Sort courses to ensure prerequisites come before dependents
  // Group sequential courses together and sort by course number
  coreMajorCourses.sort((a, b) => {
    const aNum = parseInt(a.code.match(/\d+/)?.[0] || "0");
    const bNum = parseInt(b.code.match(/\d+/)?.[0] || "0");
    return aNum - bNum;
  });
  upperMajorCourses.sort((a, b) => {
    const aNum = parseInt(a.code.match(/\d+/)?.[0] || "0");
    const bNum = parseInt(b.code.match(/\d+/)?.[0] || "0");
    return aNum - bNum;
  });

  // STEP 6: Distribute courses to semesters
  // Rules: 
  // - Exactly 4 credits per semester
  // - Max 2 major courses per semester
  // - Core majors in Year 1-2, Upper majors in Year 3-4, Capstones in Year 4
  // - Prerequisites must be in earlier semester than dependent course

  // Helper to try placing a course, respecting prerequisites
  const tryPlaceCourse = (course: PlannedCourse, courseList: PlannedCourse[], semIdx: number): boolean => {
    // Check prerequisite constraint
    if (!canPlaceInSemester(semesters, course, semIdx)) {
      return false;
    }
    
    semesters[semIdx].courses.push(course);
    semesters[semIdx].totalCredits += course.credits;
    
    // Remove from list
    const idx = courseList.indexOf(course);
    if (idx !== -1) courseList.splice(idx, 1);
    
    return true;
  };

  for (let semIdx = 0; semIdx < 8; semIdx++) {
    const year = Math.floor(semIdx / 2) + 1;
    const currentCredits = semesters[semIdx].totalCredits;
    const neededCredits = 4 - currentCredits;
    
    // Count current major-prefix courses only (not collateral like CHM, MAT)
    // Only courses with category "Major" count toward the 2-per-semester limit
    let currentMajorCount = semesters[semIdx].courses.filter(c => c.category === "Major").length;

    let creditsAdded = 0;

    // Year 1-2: Add core courses (both major and collateral)
    // Only actual major-prefix courses count toward the 2-per-semester limit
    if (year <= 2) {
      for (let i = 0; i < coreMajorCourses.length && creditsAdded < neededCredits; ) {
        const course = coreMajorCourses[i];
        // Check if we'd exceed major limit (only for actual major courses)
        if (course.category === "Major" && currentMajorCount >= 2) {
          i++;
          continue;
        }
        if (canPlaceInSemester(semesters, course, semIdx)) {
          semesters[semIdx].courses.push(course);
          semesters[semIdx].totalCredits += course.credits;
          creditsAdded += course.credits;
          if (course.category === "Major") currentMajorCount++;
          coreMajorCourses.splice(i, 1);
        } else {
          i++;
        }
      }
    }

    // Sophomore Spring (semIdx 3) and Year 3-4: Add upper major courses (max 2 actual major courses per semester)
    if (semIdx >= 3) {
      for (let i = 0; i < upperMajorCourses.length && creditsAdded < neededCredits; ) {
        const course = upperMajorCourses[i];
        if (course.category === "Major" && currentMajorCount >= 2) {
          i++;
          continue;
        }
        if (canPlaceInSemester(semesters, course, semIdx)) {
          semesters[semIdx].courses.push(course);
          semesters[semIdx].totalCredits += course.credits;
          creditsAdded += course.credits;
          if (course.category === "Major") currentMajorCount++;
          upperMajorCourses.splice(i, 1);
        } else {
          i++;
        }
      }
    }

    // Year 4: Add capstones
    if (year === 4) {
      for (let i = 0; i < capstoneCourses.length && creditsAdded < neededCredits; ) {
        const course = capstoneCourses[i];
        if (course.category === "Major" && currentMajorCount >= 2) {
          i++;
          continue;
        }
        if (canPlaceInSemester(semesters, course, semIdx)) {
          semesters[semIdx].courses.push(course);
          semesters[semIdx].totalCredits += course.credits;
          creditsAdded += course.credits;
          if (course.category === "Major") currentMajorCount++;
          capstoneCourses.splice(i, 1);
        } else {
          i++;
        }
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

  // STEP 6: Try to place any remaining courses in any available semester
  const allRemainingCourses = [
    ...coreMajorCourses,
    ...upperMajorCourses,
    ...capstoneCourses,
  ];

  // Try to place remaining courses in any semester that has room
  for (const course of allRemainingCourses) {
    let placed = false;
    for (let semIdx = 0; semIdx < 8 && !placed; semIdx++) {
      const currentMajorCount = semesters[semIdx].courses.filter(c => c.category === "Major").length;
      const currentCredits = semesters[semIdx].totalCredits;
      
      // Check if we can place this course (respect major limit and credits)
      const wouldExceedMajorLimit = course.category === "Major" && currentMajorCount >= 2;
      const wouldExceedCredits = currentCredits >= 4;
      
      if (!wouldExceedMajorLimit && !wouldExceedCredits && canPlaceInSemester(semesters, course, semIdx)) {
        semesters[semIdx].courses.push(course);
        semesters[semIdx].totalCredits += course.credits;
        placed = true;
      }
    }
    
    if (!placed) {
      unfulfilledRequirements.push(`${course.name} (${course.fulfills.join(", ")})`);
    }
  }
  
  // Any remaining GEM courses that couldn't fit
  for (const course of gemCourses) {
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
