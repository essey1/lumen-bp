import type {
  AcademicPlan,
  PlannedCourse,
  SemesterPlan,
  StudentProfile,
  WayOfKnowing,
} from "./types";
import { MINIMUM_TOTAL_CREDITS, MINIMUM_CREDITS_OUTSIDE_MAJOR } from "./types";
import { MAJORS } from "./majors-data";
import { MINORS } from "./minors-data";
import { COURSE_CATALOG } from "./course-catalog";
import { isCourseAvailable } from "./course-schedule-data";

// Prerequisites: course -> courses that must appear in an EARLIER semester
const PREREQUISITES: Record<string, string[]> = {
  "CHM 221": ["CHM 131"],
  "CHM 222": ["CHM 221"],
  "BIO 114": ["BIO 113"],
  "BIO 222": ["BIO 221"],
  "BIO 212": ["BIO 211"],
  "PHY 222": ["PHY 221"],
  "MAT 135": ["MAT 115"],
  "MAT 225": ["MAT 135"],
  "MAT 216": ["MAT 135"],
  "CSC 236": ["CSC 226"],
  "CSC 246": ["CSC 236"],
  "CSC 303": ["CSC 236"],
  "CSC 324": ["CSC 236"],
  "CSC 314": ["CSC 236"],
  "L&I 200": ["L&I 100"],
  "L&I 300": ["L&I 200"],
  "L&I 400": ["L&I 300"],
};

// Maps student interests/career goals to preferred department prefixes for elective selection
const INTEREST_DEPT_MAP: Record<string, string[]> = {
  Technology: ["CSC", "PHY", "MAT", "ETAD"],
  Science: ["BIO", "CHM", "PHY", "SENS", "MAT"],
  Healthcare: ["BIO", "CHM", "PSY", "HLT", "NUR", "HHP"],
  Psychology: ["PSY", "SOC", "CFS", "PHI"],
  Business: ["BUS", "ECO", "COM", "MAT"],
  Arts: ["ART", "MUS", "THR", "COM"],
  Music: ["MUS", "ART", "THR"],
  Theatre: ["THR", "MUS", "COM"],
  Environment: ["SENS", "BIO", "CHM", "ANR", "GEO"],
  "Social Impact": ["PSJ", "SOC", "AFR", "WGS", "HIS"],
  History: ["HIS", "AFR", "PSC", "REL"],
  Writing: ["ENG", "COM", "PHI", "HIS"],
  Literature: ["ENG", "AFR", "WGS", "HIS"],
  Philosophy: ["PHI", "REL", "PSJ"],
  Religion: ["REL", "PHI", "HIS"],
  Communication: ["COM", "ENG", "THR"],
  Teaching: ["EDS", "PSY", "SOC", "CFS"],
  Agriculture: ["ANR", "BIO", "CHM", "SENS"],
  Mathematics: ["MAT", "PHY", "CSC"],
  Economics: ["ECO", "BUS", "MAT", "PSC"],
  "Political Science": ["PSC", "HIS", "SOC", "PSJ"],
  Sociology: ["SOC", "PSY", "AFR", "WGS"],
  Nursing: ["NUR", "BIO", "CHM", "PSY", "HLT"],
  Research: ["BIO", "CHM", "PSY", "MAT", "SENS"],
  "Software Engineer": ["CSC", "MAT", "PHY"],
  "Data Scientist": ["CSC", "MAT", "PSY", "ECO"],
  "Medical School": ["BIO", "CHM", "PHY", "PSY"],
  "Graduate School": ["MAT", "PHY", "BIO", "CHM", "ENG"],
  "Law School": ["PSC", "HIS", "PHI", "PSJ", "COM"],
  Journalist: ["COM", "ENG", "HIS", "PSC"],
  "Social Work": ["SOC", "PSY", "CFS", "PSJ"],
  "Film Studies": ["COM", "ENG", "THR", "ART"],
  Photography: ["ART", "COM"],
  "Fine Arts": ["ART", "MUS", "THR"],
};

// GEM requirements tracker
interface GEMTracker {
  waysOfKnowing: Partial<Record<WayOfKnowing, number>>;
  writingRich: number;
  internationallyRich: number;
  quantitativelyRich: number;
  beyondBorders: number;
  holisticWellness: number;
  powerEquity: number;
  seekingMeaning: number;
  sustainability: number;
  ale: number;
  physicalActivity: number;
}

function freshGEMTracker(): GEMTracker {
  return {
    waysOfKnowing: {
      "Applied Studies": 1,
      "Creative Arts": 1,
      "Cultural & Ethnic Studies": 1,
      "Humanities": 1,
      "Quantitative Reasoning": 1,
      "Natural Science": 2,
      "Social Science": 1,
    },
    writingRich: 2,
    internationallyRich: 1,
    quantitativelyRich: 1,
    beyondBorders: 1,
    holisticWellness: 1,
    powerEquity: 1,
    seekingMeaning: 1,
    sustainability: 1,
    ale: 1,
    physicalActivity: 2,
  };
}

function applyGEM(tracker: GEMTracker, courseCode: string): void {
  const c = COURSE_CATALOG[courseCode];
  if (!c) return;
  for (const wok of c.waysOfKnowing ?? []) {
    if ((tracker.waysOfKnowing[wok] ?? 0) > 0) tracker.waysOfKnowing[wok]!--;
  }
  for (const r of c.richnesses ?? []) {
    if (r === "Writing" && tracker.writingRich > 0) tracker.writingRich--;
    if (r === "Internationally Rich" && tracker.internationallyRich > 0) tracker.internationallyRich--;
    if (r === "Quantitatively Rich" && tracker.quantitativelyRich > 0) tracker.quantitativelyRich--;
  }
  for (const v of c.values ?? []) {
    if (v === "Beyond the Borders" && tracker.beyondBorders > 0) tracker.beyondBorders--;
    if (v === "Holistic Wellness" && tracker.holisticWellness > 0) tracker.holisticWellness--;
    if (v === "Power & Equity" && tracker.powerEquity > 0) tracker.powerEquity--;
    if (v === "Seeking Meaning" && tracker.seekingMeaning > 0) tracker.seekingMeaning--;
    if (v === "Sustainability" && tracker.sustainability > 0) tracker.sustainability--;
  }
  for (const a of c.additional ?? []) {
    if ((a === "ALE" || a === "ALES") && tracker.ale > 0) tracker.ale--;
    if (a === "Physical Activity" && tracker.physicalActivity > 0) tracker.physicalActivity--;
  }
}

// Returns the earliest semester >= minSem where the course can be placed
function findSemester(
  semesters: SemesterPlan[],
  course: PlannedCourse,
  minSem: number,
  maxSem: number,
  placedMap: Map<string, number>
): number {
  const prereqs = PREREQUISITES[course.code] ?? [];
  let prereqFloor = minSem;
  for (const p of prereqs) {
    const pSem = placedMap.get(p);
    if (pSem === undefined) return -1; // prereq not placed yet
    prereqFloor = Math.max(prereqFloor, pSem + 1);
  }

  // Try within range, respecting availability
  for (let s = prereqFloor; s <= Math.min(maxSem, 7); s++) {
    if (semesters[s].totalCredits >= 4) continue;
    if (course.category === "Major" || course.category === "Minor") {
      const majorMinorCount = semesters[s].courses.filter(
        c => c.category === "Major" || c.category === "Minor"
      ).length;
      if (majorMinorCount >= 2) continue;
    }
    if (!isCourseAvailable(course.code, s)) continue;
    return s;
  }

  // Retry ignoring availability (course has no CSV data)
  for (let s = prereqFloor; s <= Math.min(maxSem, 7); s++) {
    if (semesters[s].totalCredits >= 4) continue;
    if (course.category === "Major" || course.category === "Minor") {
      const majorMinorCount = semesters[s].courses.filter(
        c => c.category === "Major" || c.category === "Minor"
      ).length;
      if (majorMinorCount >= 2) continue;
    }
    return s;
  }

  // Last resort: any open slot beyond maxSem
  for (let s = Math.min(maxSem, 7) + 1; s < 8; s++) {
    if (semesters[s].totalCredits >= 4) continue;
    return s;
  }

  return -1;
}

function placeCourse(
  semesters: SemesterPlan[],
  course: PlannedCourse,
  semIdx: number,
  placedMap: Map<string, number>
): void {
  semesters[semIdx].courses.push(course);
  semesters[semIdx].totalCredits += course.credits;
  if (!course.isPlaceholder) placedMap.set(course.code, semIdx);
}

// Build preferred department list from student profile
function preferredDepts(profile: StudentProfile): string[] {
  const depts = new Set<string>();
  // Always include the student's major departments
  for (const m of profile.majors) depts.add(m.split("_")[0]);
  for (const m of profile.minors ?? []) depts.add(m.split("_")[0]);
  for (const tag of [...profile.interests, ...profile.careerGoals, ...profile.hobbies]) {
    for (const d of INTEREST_DEPT_MAP[tag] ?? []) depts.add(d);
  }
  return Array.from(depts);
}

// Find a real catalog course matching a filter, preferring preferred departments
function findCatalogCourse(
  filter: (code: string) => boolean,
  placed: Set<string>,
  preferred: string[]
): string | null {
  // Try preferred departments first
  for (const dept of preferred) {
    for (const code of Object.keys(COURSE_CATALOG)) {
      if (placed.has(code)) continue;
      if (!code.startsWith(dept + " ")) continue;
      if (!filter(code)) continue;
      return code;
    }
  }
  // Fall back to any department
  for (const code of Object.keys(COURSE_CATALOG)) {
    if (placed.has(code)) continue;
    if (!filter(code)) continue;
    return code;
  }
  return null;
}

// Score a course by how many UNFULFILLED GEM requirements it covers.
// Higher = better (one course knocking out multiple requirements).
function gemScore(tracker: GEMTracker, courseCode: string): number {
  const c = COURSE_CATALOG[courseCode];
  if (!c) return 0;
  let score = 0;
  for (const wok of c.waysOfKnowing ?? []) {
    if ((tracker.waysOfKnowing[wok] ?? 0) > 0) score++;
  }
  for (const r of c.richnesses ?? []) {
    if (r === "Writing" && tracker.writingRich > 0) score++;
    if (r === "Internationally Rich" && tracker.internationallyRich > 0) score++;
    if (r === "Quantitatively Rich" && tracker.quantitativelyRich > 0) score++;
  }
  for (const v of c.values ?? []) {
    if (v === "Beyond the Borders" && tracker.beyondBorders > 0) score++;
    if (v === "Holistic Wellness" && tracker.holisticWellness > 0) score++;
    if (v === "Power & Equity" && tracker.powerEquity > 0) score++;
    if (v === "Seeking Meaning" && tracker.seekingMeaning > 0) score++;
    if (v === "Sustainability" && tracker.sustainability > 0) score++;
  }
  for (const a of c.additional ?? []) {
    if ((a === "ALE" || a === "ALES") && tracker.ale > 0) score++;
    if (a === "Physical Activity" && tracker.physicalActivity > 0) score++;
  }
  return score;
}

function hasUnfulfilledGEM(tracker: GEMTracker): boolean {
  return (
    Object.values(tracker.waysOfKnowing).some(v => (v ?? 0) > 0) ||
    tracker.writingRich > 0 ||
    tracker.internationallyRich > 0 ||
    tracker.quantitativelyRich > 0 ||
    tracker.beyondBorders > 0 ||
    tracker.holisticWellness > 0 ||
    tracker.powerEquity > 0 ||
    tracker.seekingMeaning > 0 ||
    tracker.sustainability > 0 ||
    tracker.ale > 0 ||
    tracker.physicalActivity > 0
  );
}

// Find the catalog course that covers the MOST unfulfilled GEM requirements in one shot.
// Prefers courses from preferred departments but will fall back to any dept.
function findGEMCourse(
  tracker: GEMTracker,
  semIdx: number,
  placed: Set<string>,
  preferred: string[]
): PlannedCourse | null {
  if (!hasUnfulfilledGEM(tracker)) return null;

  let bestCode: string | null = null;
  let bestScore = 0;
  let bestIsPreferred = false;

  const preferredSet = new Set(preferred);

  for (const code of Object.keys(COURSE_CATALOG)) {
    if (placed.has(code)) continue;
    if (!isCourseAvailable(code, semIdx)) continue;
    const score = gemScore(tracker, code);
    if (score === 0) continue;

    const isPreferred = preferredSet.has(code.split(" ")[0]);

    // Pick this course if it scores higher, or same score but preferred dept
    if (
      score > bestScore ||
      (score === bestScore && isPreferred && !bestIsPreferred)
    ) {
      bestCode = code;
      bestScore = score;
      bestIsPreferred = isPreferred;
    }
  }

  if (!bestCode) return null;
  const cat = COURSE_CATALOG[bestCode];
  const fulfills: string[] = [];
  for (const wok of cat.waysOfKnowing ?? []) {
    if ((tracker.waysOfKnowing[wok] ?? 0) > 0) fulfills.push(`WoK: ${wok}`);
  }
  for (const r of cat.richnesses ?? []) fulfills.push(r);
  for (const v of cat.values ?? []) fulfills.push(v);
  for (const a of cat.additional ?? []) {
    if (a === "ALE" || a === "ALES" || a === "Physical Activity") fulfills.push(a);
  }
  if (fulfills.length === 0) fulfills.push("GEM");
  return { code: bestCode, name: cat.name, credits: cat.credits, fulfills, category: "GEM" };
}

// Find any elective course from preferred departments available in the semester
function findElectiveCourse(
  semIdx: number,
  placed: Set<string>,
  preferred: string[]
): PlannedCourse | null {
  const code = findCatalogCourse(
    c => isCourseAvailable(c, semIdx),
    placed,
    preferred
  );
  if (!code) return null;
  const cat = COURSE_CATALOG[code];
  return { code, name: cat.name, credits: cat.credits, fulfills: ["Elective"], category: "Elective" };
}

interface CourseToPlace {
  course: PlannedCourse;
  minSem: number;
  maxSem: number;
}

function collectMajorCourses(profile: StudentProfile, collected: Set<string>): CourseToPlace[] {
  const result: CourseToPlace[] = [];

  for (const majorCode of profile.majors) {
    const major = MAJORS[majorCode];
    if (!major) continue;

    for (const req of major.requirements) {
      const cat = req.category.toLowerCase();
      const isCapstone = cat.includes("capstone");
      const isUpper = cat.includes("upper") || cat.includes("advanced") || cat.includes("exploratory");
      const isCollateral = cat.includes("collateral");

      const minSem = isCapstone ? 6 : isUpper ? 3 : 0;
      const maxSem = isCapstone ? 7 : isUpper ? 7 : isCollateral ? 5 : 5;

      // mustInclude courses
      for (const code of req.mustInclude ?? []) {
        if (collected.has(code)) continue;
        const data = COURSE_CATALOG[code];
        if (!data) continue;
        const isMaj = code.startsWith(majorCode.split("_")[0] + " ");
        const level = parseInt(code.match(/\d+/)?.[0] ?? "100");
        result.push({
          course: {
            code: data.code,
            name: data.name,
            credits: data.credits,
            fulfills: [`${major.name}: ${req.category}`],
            category: isMaj ? "Major" : "Elective",
          },
          minSem: isCapstone ? 6 : isCollateral ? 0 : level >= 300 ? 3 : 0,
          maxSem,
        });
        collected.add(code);
      }

      // selectFromCategories: one course per sub-category
      if (req.selectFromCategories) {
        for (const sub of req.selectFromCategories) {
          let found = false;
          for (const code of sub.courses) {
            if (collected.has(code)) continue;
            const data = COURSE_CATALOG[code];
            if (!data) continue;
            const isMaj = code.startsWith(majorCode.split("_")[0] + " ");
            result.push({
              course: {
                code: data.code,
                name: data.name,
                credits: data.credits,
                fulfills: [`${major.name}: ${req.category} (${sub.category})`],
                category: isMaj ? "Major" : "Elective",
              },
              minSem: 3,
              maxSem: 7,
            });
            collected.add(code);
            found = true;
            break;
          }
          if (!found) {
            result.push({
              course: {
                code: majorCode.split("_")[0],
                name: `${sub.category} course`,
                credits: 1,
                fulfills: [`${major.name}: ${sub.category}`],
                category: "Major",
                isPlaceholder: true,
                placeholderCategory: sub.category,
              },
              minSem: 3,
              maxSem: 7,
            });
          }
        }
        continue; // don't also do the generic fill below
      }

      // Generic fill — count ALL already-collected courses from this req's list,
      // not just mustIncludes. This prevents placing PHY 127 when PHY 221 is already
      // collected for another major requirement (they cover the same material).
      const already = req.courses.filter(c => collected.has(c)).length;
      const needed = Math.max(0, req.coursesRequired - already);
      let count = 0;
      for (const code of req.courses) {
        if (count >= needed) break;
        if (collected.has(code)) continue;
        if (req.mustInclude?.includes(code)) continue;
        const data = COURSE_CATALOG[code];
        if (!data) continue;
        const isMaj = code.startsWith(majorCode.split("_")[0] + " ");
        const level = parseInt(code.match(/\d+/)?.[0] ?? "100");
        result.push({
          course: {
            code: data.code,
            name: data.name,
            credits: data.credits,
            fulfills: [`${major.name}: ${req.category}`],
            category: isMaj ? "Major" : "Elective",
          },
          minSem: isCapstone ? 6 : isCollateral ? 0 : level >= 300 ? 3 : 0,
          maxSem,
        });
        collected.add(code);
        count++;
      }
      // Placeholder if not enough real courses found
      while (count < needed) {
        result.push({
          course: {
            code: majorCode.split("_")[0],
            name: `${req.category} course`,
            credits: 1,
            fulfills: [`${major.name}: ${req.category}`],
            category: "Major",
            isPlaceholder: true,
            placeholderCategory: req.category,
          },
          minSem,
          maxSem,
        });
        count++;
      }
    }
  }

  return result;
}

function collectMinorCourses(profile: StudentProfile, collected: Set<string>): CourseToPlace[] {
  const result: CourseToPlace[] = [];

  for (const minorCode of profile.minors ?? []) {
    const minor = MINORS[minorCode];
    if (!minor) continue;

    for (const req of minor.requirements) {
      const sources = req.mustInclude?.length ? req.mustInclude : req.courses;
      let count = 0;
      for (const code of sources) {
        if (count >= req.coursesRequired) break;
        if (collected.has(code)) continue;
        const data = COURSE_CATALOG[code];
        if (!data) continue;
        const level = parseInt(code.match(/\d+/)?.[0] ?? "100");
        result.push({
          course: {
            code: data.code,
            name: data.name,
            credits: data.credits,
            fulfills: [`${minor.name}: ${req.category}`],
            category: "Minor",
          },
          minSem: level >= 300 ? 3 : 0,
          maxSem: 7,
        });
        collected.add(code);
        count++;
      }
      // Try remaining courses from the full list if mustInclude didn't fill the quota
      if (count < req.coursesRequired) {
        for (const code of req.courses) {
          if (count >= req.coursesRequired) break;
          if (collected.has(code)) continue;
          const data = COURSE_CATALOG[code];
          if (!data) continue;
          const level = parseInt(code.match(/\d+/)?.[0] ?? "100");
          result.push({
            course: {
              code: data.code,
              name: data.name,
              credits: data.credits,
              fulfills: [`${minor.name}: ${req.category}`],
              category: "Minor",
            },
            minSem: level >= 300 ? 3 : 0,
            maxSem: 7,
          });
          collected.add(code);
          count++;
        }
      }
    }
  }

  return result;
}

export function generateAcademicPlan(profile: StudentProfile): AcademicPlan {
  const semesters: SemesterPlan[] = [];
  const warnings: string[] = [];
  const unfulfilledRequirements: string[] = [];
  // Maps placed course code -> semesterIndex (for prereq checking)
  const placedMap = new Map<string, number>();
  // Set of all codes either placed or collected (to avoid duplicates)
  const usedCodes = new Set<string>();
  const gemTracker = freshGEMTracker();
  const pref = preferredDepts(profile);

  // Initialize 8 semesters
  for (let year = 1; year <= 4; year++) {
    for (const semester of ["Fall", "Spring"] as const) {
      semesters.push({ year, semester, courses: [], totalCredits: 0, isOverloaded: false });
    }
  }

  if (profile.majors.length > 2) {
    warnings.push("With more than 2 majors, completing all requirements in 8 semesters may be difficult.");
  }

  // 1. Place L&I sequence (fixed positions)
  const liCourses: Array<{ semIdx: number; code: string; name: string; fulfills: string }> = [
    { semIdx: 0, code: "L&I 100", name: "Explorations", fulfills: "L&I: Explorations" },
    { semIdx: 1, code: "L&I 200", name: "Discoveries", fulfills: "L&I: Discoveries" },
    { semIdx: 2, code: "L&I 300", name: "Intersectional Justice in U.S.", fulfills: "L&I: Intersectional Justice" },
    { semIdx: 6, code: "L&I 400", name: "Global Issues", fulfills: "L&I: Global Issues" },
  ];
  for (const li of liCourses) {
    placeCourse(semesters, {
      code: li.code, name: li.name, credits: 1, fulfills: [li.fulfills], category: "GEM",
    }, li.semIdx, placedMap);
    usedCodes.add(li.code);
    applyGEM(gemTracker, li.code);
  }

  // 2. Collect required courses (major + minor)
  const majorCourses = collectMajorCourses(profile, usedCodes);
  const minorCourses = collectMinorCourses(profile, usedCodes);

  // Sort by minSem then course number (lower numbers = prerequisites tend to come first)
  const allRequired: CourseToPlace[] = [...majorCourses, ...minorCourses].sort((a, b) => {
    if (a.minSem !== b.minSem) return a.minSem - b.minSem;
    const aNum = parseInt(a.course.code.match(/\d+/)?.[0] ?? "0");
    const bNum = parseInt(b.course.code.match(/\d+/)?.[0] ?? "0");
    return aNum - bNum;
  });

  // 3. Place required courses — multiple passes to resolve prerequisites
  const unplaced: CourseToPlace[] = [];
  for (const item of allRequired) {
    const semIdx = findSemester(semesters, item.course, item.minSem, item.maxSem, placedMap);
    if (semIdx !== -1) {
      placeCourse(semesters, item.course, semIdx, placedMap);
      applyGEM(gemTracker, item.course.code);
    } else {
      unplaced.push(item);
    }
  }
  // Second pass for anything that failed (e.g. prereq placed after first attempt)
  for (const item of unplaced) {
    const semIdx = findSemester(semesters, item.course, item.minSem, item.maxSem, placedMap);
    if (semIdx !== -1) {
      placeCourse(semesters, item.course, semIdx, placedMap);
      applyGEM(gemTracker, item.course.code);
    } else {
      unfulfilledRequirements.push(`${item.course.name} (${item.course.fulfills.join(", ")})`);
    }
  }

  // 4. Fill remaining slots following the target footprint:
  //    ~2 major/minor (already placed) | ~1 GEM | ~1 career/interest elective
  //
  // Strategy per empty slot:
  //   - If this semester has no non-L&I GEM yet AND GEM is still needed → GEM
  //   - Else → interest/career elective (or GEM if no elective found)
  //   - Final fallback → placeholder
  for (let semIdx = 0; semIdx < 8; semIdx++) {
    while (semesters[semIdx].totalCredits < 4) {
      const nonLiGemCount = semesters[semIdx].courses.filter(
        c => c.category === "GEM" && !c.code.startsWith("L&I")
      ).length;

      // Prioritise placing exactly 1 non-L&I GEM per semester
      if (nonLiGemCount === 0 && hasUnfulfilledGEM(gemTracker)) {
        const gemCourse = findGEMCourse(gemTracker, semIdx, usedCodes, pref);
        if (gemCourse) {
          placeCourse(semesters, gemCourse, semIdx, placedMap);
          usedCodes.add(gemCourse.code);
          applyGEM(gemTracker, gemCourse.code);
          continue;
        }
      }

      // Use this slot for an interest/career elective
      const elective = findElectiveCourse(semIdx, usedCodes, pref);
      if (elective) {
        placeCourse(semesters, elective, semIdx, placedMap);
        usedCodes.add(elective.code);
        continue;
      }

      // Overflow: still-unfulfilled GEM requirements get a second slot if needed
      if (hasUnfulfilledGEM(gemTracker)) {
        const gemCourse = findGEMCourse(gemTracker, semIdx, usedCodes, pref);
        if (gemCourse) {
          placeCourse(semesters, gemCourse, semIdx, placedMap);
          usedCodes.add(gemCourse.code);
          applyGEM(gemTracker, gemCourse.code);
          continue;
        }
      }

      // Last resort placeholder
      semesters[semIdx].courses.push({
        code: "Elective",
        name: "Free Elective",
        credits: 1,
        fulfills: ["Free Elective"],
        category: "Elective",
        isPlaceholder: true,
        placeholderCategory: "Free Choice",
      });
      semesters[semIdx].totalCredits += 1;
    }
  }

  // 5. Calculate totals
  const totalCredits = semesters.reduce((s, sem) => s + sem.totalCredits, 0);
  const majorCredits = semesters.reduce(
    (s, sem) => s + sem.courses.filter(c => c.category === "Major").reduce((cs, c) => cs + c.credits, 0), 0
  );
  const creditsOutsideMajor = totalCredits - majorCredits;

  if (totalCredits < MINIMUM_TOTAL_CREDITS) {
    warnings.push(`Total credits (${totalCredits}) is below the minimum of ${MINIMUM_TOTAL_CREDITS}.`);
  }
  if (creditsOutsideMajor < MINIMUM_CREDITS_OUTSIDE_MAJOR) {
    warnings.push(`Credits outside major (${creditsOutsideMajor}) is below the minimum of ${MINIMUM_CREDITS_OUTSIDE_MAJOR}.`);
  }
  if (unfulfilledRequirements.length > 0) {
    warnings.push(`${unfulfilledRequirements.length} requirement(s) could not fit in 8 semesters.`);
  }

  return { student: profile, semesters, totalCredits, creditsOutsideMajor, unfulfilledRequirements, warnings };
}

export function getPlanStats(plan: AcademicPlan) {
  const totalCourses = plan.semesters.reduce((s, sem) => s + sem.courses.length, 0);
  const majorCourses = plan.semesters.reduce((s, sem) => s + sem.courses.filter(c => c.category === "Major").length, 0);
  const gemCourses = plan.semesters.reduce((s, sem) => s + sem.courses.filter(c => c.category === "GEM").length, 0);
  const placeholderCourses = plan.semesters.reduce((s, sem) => s + sem.courses.filter(c => c.isPlaceholder).length, 0);
  const overloadedSemesters = plan.semesters.filter(s => s.isOverloaded).length;

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
