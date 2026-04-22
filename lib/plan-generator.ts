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

// Prerequisites: built from course catalog + L&I sequence.
// Sub-100-level courses (developmental, e.g. MAT 010) are excluded as placement constraints.
function buildPrereqMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {
    "L&I 200": ["L&I 100"],
    "L&I 300": ["L&I 200"],
    "L&I 400": ["L&I 300"],
  };
  for (const [code, course] of Object.entries(COURSE_CATALOG)) {
    if (!course.prerequisites?.length) continue;
    const valid = course.prerequisites.filter(p => {
      const num = parseInt(p.match(/\d+/)?.[0] ?? "0");
      return num >= 100;
    });
    if (valid.length > 0) map[code] = valid;
  }
  return map;
}
const PREREQUISITES = buildPrereqMap();

// Courses that become redundant when a higher-level equivalent is already collected.
// Key = intro course to skip; value = any one of these triggers the skip.
const SUPERSEDED_BY: Record<string, string[]> = {
  "PHY 127": ["PHY 221", "PHY 222"],
  "PHY 128": ["PHY 221", "PHY 222"],
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

// Extra keyword hints per course code for career matching (supplements name-based scoring)
const COURSE_CAREER_HINTS: Record<string, string[]> = {
  // CSC upper-level
  "CSC 300": ["embedded", "hardware", "iot", "robotics", "electronics"],
  "CSC 301": ["ux", "interface", "frontend", "hci", "product"],
  "CSC 303": ["theory", "formal", "computation"],
  "CSC 330": ["sql", "backend", "storage"],
  "CSC 335": ["architecture", "low-level"],
  "CSC 410": ["ai", "artificial intelligence", "neural", "machine learning"],
  "CSC 412": ["cloud", "infrastructure", "internet"],
  "CSC 420": ["compiler", "formal"],
  "CSC 425": ["virtualization", "cloud"],
  "CSC 426": ["devops", "agile", "collaborative", "open source"],
  "CSC 433": ["numerical", "scientific computing", "simulation"],
  "CSC 440": ["optimization", "efficiency"],
  "CSC 445": ["modeling", "formal"],
  "CSC 450": ["cybersecurity", "cryptography"],
  // PHY / MAT distribution — career-domain hints
  "PHY 321": ["mechanical", "mechanics", "dynamics", "classical"],
  "PHY 335": ["biophysics"],
  "PHY 340": ["biophysics", "biology"],
  "PHY 482": ["quantum", "modern"],
  "PHY 485": ["materials", "solid state"],
  "MAT 433": ["numerical", "simulation", "scientific", "computational", "engineering"],
  "MAT 434": ["analysis", "real analysis", "pure math"],
  "MAT 337": ["differential", "dynamics", "engineering", "mechanical"],
  "MAT 330": ["multivariable", "calculus", "engineering"],
  "MAT 312": ["optimization", "operations", "industrial", "management"],
  "MAT 415": ["combinatorics", "discrete", "theory"],
  "CHM 311": ["analytical", "chemistry"],
  "SENS 310": ["ecology", "environment", "biology"],
};

// Career-goal keyword expansions (maps goal → relevant technical words)
const CAREER_KEYWORDS: Record<string, string[]> = {
  "Mechanical Engineer": ["mechanical", "mechanics", "thermal", "dynamics", "materials", "numerical", "classical", "manufacturing", "engineering"],
  "Industrial Designer": ["design", "manufacturing", "materials", "production", "prototype", "ergonomics", "industrial"],
  "Software Engineer": ["software", "programming", "systems", "open source", "engineering"],
  "Data Scientist": ["data", "algorithm", "analysis", "mining", "numerical", "statistics", "machine learning"],
  "Cybersecurity": ["security", "network", "cryptography", "systems"],
  "Research": ["analysis", "research", "laboratory", "numerical", "computational", "experimental", "simulation"],
  "AI Engineer": ["ai", "artificial intelligence", "neural", "machine learning", "algorithm"],
  "Environmental Engineer": ["environment", "ecology", "sustainability", "environmental"],
};

// General career fit scorer — works for any course
function scoreCourseFit(code: string, profile: StudentProfile): number {
  const data = COURSE_CATALOG[code];
  if (!data) return 0;

  const dept = code.split(" ")[0];
  const nameLower = data.name.toLowerCase();
  const allTargets = [...profile.careerGoals, ...profile.interests];
  const targetWords = allTargets
    .flatMap(t => [...(CAREER_KEYWORDS[t] ?? []), t.toLowerCase()])
    .map(w => w.toLowerCase());

  let score = 0;

  // Department preference match
  for (const tag of allTargets) {
    if ((INTEREST_DEPT_MAP[tag] ?? []).includes(dept)) score += 3;
  }

  // Course name word overlap
  for (const word of targetWords) {
    if (word.length > 3 && nameLower.includes(word)) score += 2;
  }

  // Hint keyword overlap
  for (const hint of COURSE_CAREER_HINTS[code] ?? []) {
    if (targetWords.some(w => w.includes(hint) || hint.includes(w))) score += 2;
  }

  return score;
}

// Build cross-requirement bonus: courses appearing in more requirement pools score higher.
// A course that satisfies both PHY Additional Distribution AND MAT minor gets a bonus.
function buildCrossReqBonus(profile: StudentProfile): Record<string, number> {
  const bonus: Record<string, number> = {};
  const allReqs = [
    ...profile.majors.flatMap(m => MAJORS[m]?.requirements ?? []),
    ...(profile.minors ?? []).flatMap(m => MINORS[m]?.requirements ?? []),
  ];
  for (const req of allReqs) {
    for (const c of req.courses) bonus[c] = (bonus[c] ?? 0) + 1;
  }
  return bonus;
}

// Backwards-compat alias for selectFromCategories (CSC upper-level)
function scoreUpperLevelCourse(code: string, profile: StudentProfile): number {
  return scoreCourseFit(code, profile);
}

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

  // WoK: every course has exactly 1; only tick the first unfulfilled one found
  let wokApplied = false;
  for (const wok of c.waysOfKnowing ?? []) {
    if (!wokApplied && (tracker.waysOfKnowing[wok] ?? 0) > 0) {
      tracker.waysOfKnowing[wok]!--;
      wokApplied = true;
    }
  }

  // Richnesses: a course may have 0-many, but IR and Beyond the Borders
  // cannot both be satisfied by the same course (Berea GEM restriction).
  const hasIR = (c.richnesses ?? []).includes("Internationally Rich");
  const hasBTB = (c.values ?? []).includes("Beyond the Borders");
  // When the course carries both, decide which single one to apply:
  // prefer whichever has higher remaining need; if tied, prefer BTB (Value).
  let irApplied = false;
  for (const r of c.richnesses ?? []) {
    if (r === "Writing" && tracker.writingRich > 0) tracker.writingRich--;
    if (r === "Internationally Rich" && tracker.internationallyRich > 0) {
      // Only apply IR if this course won't also be used for BTB, or IR is more urgent
      if (!hasBTB || tracker.internationallyRich >= tracker.beyondBorders) {
        tracker.internationallyRich--;
        irApplied = true;
      }
    }
    if (r === "Quantitatively Rich" && tracker.quantitativelyRich > 0) tracker.quantitativelyRich--;
  }

  // Values: only one value applies per course (Berea GEM restriction).
  // Also skip Beyond the Borders if IR was already applied from this same course.
  let valueApplied = false;
  for (const v of c.values ?? []) {
    if (valueApplied) break; // only one value per course
    if (v === "Beyond the Borders" && tracker.beyondBorders > 0) {
      if (hasIR && irApplied) break; // IR/BTB conflict — this course already counted for IR
      tracker.beyondBorders--;
      valueApplied = true;
    } else if (v === "Holistic Wellness" && tracker.holisticWellness > 0) {
      tracker.holisticWellness--;
      valueApplied = true;
    } else if (v === "Power & Equity" && tracker.powerEquity > 0) {
      tracker.powerEquity--;
      valueApplied = true;
    } else if (v === "Seeking Meaning" && tracker.seekingMeaning > 0) {
      tracker.seekingMeaning--;
      valueApplied = true;
    } else if (v === "Sustainability" && tracker.sustainability > 0) {
      tracker.sustainability--;
      valueApplied = true;
    }
  }

  for (const a of c.additional ?? []) {
    if ((a === "ALE" || a === "ALES") && tracker.ale > 0) tracker.ale--;
    if (a === "Physical Activity" && tracker.physicalActivity > 0) tracker.physicalActivity--;
  }
}

// Returns the earliest semester >= minSem where the course can be placed.
// scheduleDisclaimer courses (CSC rotating categories) skip the availability check.
// For required courses (Major/Minor) that can't fit within schedule constraints,
// returns a fallback slot and sets course.scheduleDisclaimer so the card shows a warning.
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

  const isMajorMinor = course.category === "Major" || course.category === "Minor";
  // CSC rotating-category courses bypass schedule — exact semester is unknown
  const skipSchedule = course.scheduleDisclaimer === true;

  function majorMinorOk(s: number, relaxCap = false): boolean {
    if (!isMajorMinor) return true;
    const count = semesters[s].courses.filter(
      c => c.category === "Major" || c.category === "Minor"
    ).length;
    const cap = s === 0 ? 1 : relaxCap ? 3 : 2;
    return count < cap;
  }

  // Pass 1: strict — respect schedule and major/minor cap, within minSem..maxSem
  for (let s = prereqFloor; s <= Math.min(maxSem, 7); s++) {
    if (semesters[s].totalCredits >= 4) continue;
    if (!majorMinorOk(s)) continue;
    if (!skipSchedule && !isCourseAvailable(course.code, s)) continue;
    return s;
  }

  // Pass 2: relax major/minor cap (up to 3 per sem) but keep schedule check
  for (let s = prereqFloor; s <= Math.min(maxSem, 7); s++) {
    if (semesters[s].totalCredits >= 4) continue;
    if (!majorMinorOk(s, true)) continue;
    if (!skipSchedule && !isCourseAvailable(course.code, s)) continue;
    return s;
  }

  // Pass 3: extend beyond maxSem (still in 8 semesters), respect schedule
  for (let s = prereqFloor; s < 8; s++) {
    if (semesters[s].totalCredits >= 4) continue;
    if (!skipSchedule && !isCourseAvailable(course.code, s)) continue;
    return s;
  }

  // Pass 4 (CSC rotating-category courses only): schedule-blind final fallback.
  // Only courses already marked scheduleDisclaimer bypass the schedule here —
  // all other courses return -1 and go to unfulfilledRequirements.
  if (skipSchedule) {
    for (let s = prereqFloor; s < 8; s++) {
      if (semesters[s].totalCredits >= 4) continue;
      return s;
    }
  }

  return -1; // cannot fit within schedule constraints → unfulfilled
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
  for (const tag of [...profile.interests, ...profile.careerGoals]) {
    for (const d of INTEREST_DEPT_MAP[tag] ?? []) depts.add(d);
  }
  return Array.from(depts);
}

function isSuperseded(code: string, placed: Set<string>): boolean {
  return (SUPERSEDED_BY[code] ?? []).some(sup => placed.has(sup));
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
      if (isSuperseded(code, placed)) continue;
      if (!code.startsWith(dept + " ")) continue;
      if (!filter(code)) continue;
      return code;
    }
  }
  // Fall back to any department
  for (const code of Object.keys(COURSE_CATALOG)) {
    if (placed.has(code)) continue;
    if (isSuperseded(code, placed)) continue;
    if (!filter(code)) continue;
    return code;
  }
  return null;
}

// Score a course by how many UNFULFILLED GEM requirements it covers.
// Higher = better (one course knocking out multiple requirements).
// Applies the same restrictions as applyGEM (IR/BTB exclusion, one value per course).
function gemScore(tracker: GEMTracker, courseCode: string): number {
  const c = COURSE_CATALOG[courseCode];
  if (!c) return 0;
  let score = 0;

  // WoK: exactly 1 per course — only count the first unfulfilled one
  for (const wok of c.waysOfKnowing ?? []) {
    if ((tracker.waysOfKnowing[wok] ?? 0) > 0) { score++; break; }
  }

  const hasIR = (c.richnesses ?? []).includes("Internationally Rich");
  const hasBTB = (c.values ?? []).includes("Beyond the Borders");

  let irScore = 0;
  for (const r of c.richnesses ?? []) {
    if (r === "Writing" && tracker.writingRich > 0) score++;
    if (r === "Internationally Rich" && tracker.internationallyRich > 0) irScore = 1;
    if (r === "Quantitatively Rich" && tracker.quantitativelyRich > 0) score++;
  }

  // Values: only one value per course
  let valueScore = 0;
  let btbScore = 0;
  for (const v of c.values ?? []) {
    if (v === "Beyond the Borders" && tracker.beyondBorders > 0) { btbScore = 1; break; }
    if (v === "Holistic Wellness" && tracker.holisticWellness > 0) { valueScore = 1; break; }
    if (v === "Power & Equity" && tracker.powerEquity > 0) { valueScore = 1; break; }
    if (v === "Seeking Meaning" && tracker.seekingMeaning > 0) { valueScore = 1; break; }
    if (v === "Sustainability" && tracker.sustainability > 0) { valueScore = 1; break; }
  }

  // IR and BTB cannot both be credited to the same course
  if (hasIR && hasBTB && irScore > 0 && btbScore > 0) {
    // Count only the more urgent one
    score += tracker.internationallyRich >= tracker.beyondBorders ? irScore : btbScore;
  } else {
    score += irScore + btbScore;
  }
  score += valueScore;

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
    if (isSuperseded(code, placed)) continue;
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

interface CourseToPlace {
  course: PlannedCourse;
  minSem: number;
  maxSem: number;
}

function collectMajorCourses(profile: StudentProfile, collected: Set<string>, crossReqBonus: Record<string, number> = {}): CourseToPlace[] {
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

      // selectFromCategories: one course per sub-category, ranked by career/interest fit
      if (req.selectFromCategories) {
        for (const sub of req.selectFromCategories) {
          // Rank available courses by how well they match the student's goals
          const candidates = sub.courses
            .filter(c => !collected.has(c) && COURSE_CATALOG[c])
            .sort((a, b) => scoreUpperLevelCourse(b, profile) - scoreUpperLevelCourse(a, profile));

          const code = candidates[0];
          if (code) {
            const data = COURSE_CATALOG[code];
            const isMaj = code.startsWith(majorCode.split("_")[0] + " ");
            result.push({
              course: {
                code: data.code,
                name: data.name,
                credits: data.credits,
                fulfills: [`${major.name}: ${req.category} (${sub.category})`],
                category: isMaj ? "Major" : "Elective",
                scheduleDisclaimer: true,
              },
              minSem: 3,
              maxSem: 7,
            });
            collected.add(code);
          } else {
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

      // Sort candidates: prefer courses with high career fit + cross-req bonus
      const candidates = req.courses
        .filter(c => !collected.has(c) && !req.mustInclude?.includes(c) && COURSE_CATALOG[c])
        .sort((a, b) => {
          const sa = scoreCourseFit(a, profile) + (crossReqBonus[a] ?? 0) * 2;
          const sb = scoreCourseFit(b, profile) + (crossReqBonus[b] ?? 0) * 2;
          return sb - sa;
        });

      for (const code of candidates) {
        if (count >= needed) break;
        const data = COURSE_CATALOG[code];
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

function collectMinorCourses(profile: StudentProfile, collected: Set<string>, crossReqBonus: Record<string, number> = {}): CourseToPlace[] {
  const result: CourseToPlace[] = [];

  for (const minorCode of profile.minors ?? []) {
    const minor = MINORS[minorCode];
    if (!minor) continue;

    for (const req of minor.requirements) {
      // Count courses from this requirement's list that are already placed —
      // they satisfy the requirement even though we won't place them again.
      const allSources = [...(req.mustInclude ?? []), ...req.courses];
      const alreadySatisfied = allSources.filter(c => collected.has(c)).length;
      const needed = Math.max(0, req.coursesRequired - alreadySatisfied);
      if (needed === 0) continue;

      // mustInclude first, then fill remaining from full list sorted by fit
      const mustPlace = (req.mustInclude ?? []).filter(c => !collected.has(c) && COURSE_CATALOG[c]);
      const candidates = req.courses
        .filter(c => !collected.has(c) && !(req.mustInclude ?? []).includes(c) && COURSE_CATALOG[c])
        .sort((a, b) => {
          const sa = scoreCourseFit(a, profile) + (crossReqBonus[a] ?? 0) * 2;
          const sb = scoreCourseFit(b, profile) + (crossReqBonus[b] ?? 0) * 2;
          return sb - sa;
        });

      let count = 0;
      for (const code of [...mustPlace, ...candidates]) {
        if (count >= needed) break;
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
  const crossReqBonus = buildCrossReqBonus(profile);
  const majorCourses = collectMajorCourses(profile, usedCodes, crossReqBonus);
  const minorCourses = collectMinorCourses(profile, usedCodes, crossReqBonus);

  // Sort by minSem then course number (lower numbers = prerequisites tend to come first)
  const allRequired: CourseToPlace[] = [...majorCourses, ...minorCourses].sort((a, b) => {
    if (a.minSem !== b.minSem) return a.minSem - b.minSem;
    const aNum = parseInt(a.course.code.match(/\d+/)?.[0] ?? "0");
    const bNum = parseInt(b.course.code.match(/\d+/)?.[0] ?? "0");
    return aNum - bNum;
  });

  // 3. Place required courses — three passes to resolve prerequisite chains
  let remaining = allRequired;
  for (let pass = 0; pass < 3; pass++) {
    const stillUnplaced: CourseToPlace[] = [];
    for (const item of remaining) {
      const semIdx = findSemester(semesters, item.course, item.minSem, item.maxSem, placedMap);
      if (semIdx !== -1) {
        placeCourse(semesters, item.course, semIdx, placedMap);
        applyGEM(gemTracker, item.course.code);
      } else {
        stillUnplaced.push(item);
      }
    }
    remaining = stillUnplaced;
    if (remaining.length === 0) break;
  }
  for (const item of remaining) {
    unfulfilledRequirements.push(`${item.course.name} (${item.course.fulfills.join(", ")})`);
  }

  // 4. Fill remaining slots.
  // Priority: GEM requirements → Free Elective placeholder (max 2 across entire plan).
  let freeElectivesPlaced = 0;
  const MAX_FREE_ELECTIVES = 2;

  for (let semIdx = 0; semIdx < 8; semIdx++) {
    while (semesters[semIdx].totalCredits < 4) {
      // GEM courses (schedule-gated)
      if (hasUnfulfilledGEM(gemTracker)) {
        const gemCourse = findGEMCourse(gemTracker, semIdx, usedCodes, pref);
        if (gemCourse) {
          placeCourse(semesters, gemCourse, semIdx, placedMap);
          usedCodes.add(gemCourse.code);
          applyGEM(gemTracker, gemCourse.code);
          continue;
        }
      }

      // Free Elective placeholder — capped at 2 for the whole plan
      if (freeElectivesPlaced < MAX_FREE_ELECTIVES) {
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
        freeElectivesPlaced++;
      } else {
        break; // no more filler — leave this slot open
      }
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
