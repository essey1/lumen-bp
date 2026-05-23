// Course and curriculum types for Lumen academic planner

/**
 * Prerequisite tree node.
 * - A bare string means a single required course.
 * - { type: "AND", courses: [...] } means ALL children must be satisfied.
 * - { type: "OR",  courses: [...] } means ANY ONE child suffices.
 * Children can be strings or nested nodes, allowing full AND/OR nesting.
 */
export type PrereqNode =
  | string
  | { type: "AND" | "OR"; courses: PrereqNode[] };

export interface Course {
  code: string;
  name: string;
  credits: number;
  prerequisites?: PrereqNode;
  // GEM attributes - a course can fulfill multiple requirements
  waysOfKnowing?: WayOfKnowing[];
  values?: Value[];
  richnesses?: Richness[];
  learningInquiryCore?: LearningInquiryCore;
  additional?: Additional[];
}

export type WayOfKnowing =
  | "Applied Studies"
  | "Creative Arts"
  | "Cultural & Ethnic Studies"
  | "Humanities"
  | "Quantitative Reasoning"
  | "Natural Science"
  | "Social Science";

export type Value =
  | "Beyond the Borders"
  | "Holistic Wellness"
  | "Power & Equity"
  | "Seeking Meaning"
  | "Sustainability";

export type Richness = "Internationally Rich" | "Quantitatively Rich" | "Writing";

export type LearningInquiryCore =
  | "Explorations"
  | "Discoveries"
  | "Intersectional Justice in U.S."
  | "Global Issues";

export type Additional =
  | "ALE"
  | "ALES"
  | "Physical Activity"
  | "NSL"
  | "AAWP"
  | "ARTP"
  | "INTN"
  | "INTP"
  | "RELP"
  | "PED2"
  | "WHP"
  | "PR"
  | "PRQ"
  | "SKI"
  | "CGI"
  | "CHUN"
  | "IART"
  | "APPA"
  | "BLAC"
  | "WISS"
  | "SHRT"
  | "LABR"
  | "DANC"
  | "PSLB"
  | "EAUT"
  | "ECUL"
  | "EGEN";

export interface GEMRequirements {
  learningInquiryCore: {
    explorations: number; // 1
    discoveries: number; // 1
    intersectionalJustice: number; // 1
    globalIssues: number; // 1
  };
  waysOfKnowing: {
    appliedStudies: number; // 1
    creativeArts: number; // 1
    culturalEthnicStudies: number; // 1
    humanities: number; // 1
    quantitativeReasoning: number; // 1
    naturalScience: number; // 2
    socialScience: number; // 1
  };
  richnesses: {
    internationallyRich: number; // 1
    quantitativelyRich: number; // 1
    writingRich: number; // 2
  };
  values: {
    beyondTheBorders: number; // 1
    holisticWellness: number; // 1
    powerAndEquity: number; // 1
    seekingMeaning: number; // 1
    sustainability: number; // 1
  };
  additional: {
    ale: number; // 1
    physicalActivity: number; // 2
  };
}

export interface MajorRequirement {
  category: string;
  description: string;
  coursesRequired: number;
  courses: string[]; // Course codes
  mustInclude?: string[]; // Specific courses that must be taken
  minUpperLevel?: number; // Minimum 400-level courses
  selectFromCategories?: {
    category: string;
    min: number;
    courses: string[];
  }[];
}

export interface Major {
  code: string;
  name: string;
  degree: "B.A." | "B.S.";
  requirements: MajorRequirement[];
  totalMajorCredits: number;
}

export interface Minor {
  code: string;
  name: string;
  requirements: MajorRequirement[];
  totalMinorCredits: number;
}

// Ordered list of math levels a student may have completed/waived before enrollment.
// Each value means "completed up to and including this course."
export type MathPlacement =
  | "none"
  | "MAT 010" | "MAT 011" | "MAT 012"
  | "MAT 115" | "MAT 125" | "MAT 135"
  | "MAT 225" | "MAT 330";

export interface StudentProfile {
  majors: string[];
  minors: string[]; // Kept for compatibility but not used in planner
  interests: string[];
  hobbies: string[];
  careerGoals: string[];
  mathPlacement?: MathPlacement; // highest math level already completed/waived
  waivedCourses?: string[]; // other specific courses already waived
}

export interface SemesterPlan {
  year: number;
  semester: "Fall" | "Spring";
  courses: PlannedCourse[];
  totalCredits: number;
  isOverloaded: boolean;
  isCompleted?: boolean; // true for semesters the student has already finished
}

export interface PlannedCourse {
  code: string;
  name: string;
  credits: number;
  fulfills: string[]; // What requirements this fulfills
  category: "Major" | "Minor" | "GEM" | "Elective";
  isPlaceholder?: boolean; // True if this is a placeholder course
  placeholderCategory?: string; // Category for placeholder (e.g., "Design", "Systems")
  scheduleDisclaimer?: boolean; // True when exact semester offering is uncertain (e.g. rotating upper-level)
}

/**
 * A course the student has taken but that isn't yet in Lumen's catalog.
 * The student fills in the details so the plan generator can properly credit
 * GEM requirements and respect the course's prerequisites.
 */
export interface CustomCourseEntry {
  code: string;
  name: string;
  credits: number;
  /** Comma-separated raw text, e.g. "PHY 115, MAT 115" */
  prerequisites: string;
  wayOfKnowing: WayOfKnowing | "";
  richnesses: Richness[];
  /** Only one Value can apply to a given course (Berea GEM rule) */
  value: Value | "";
  additional: Array<"ALE" | "ALES" | "Physical Activity">;
}

export interface AcademicPlan {
  student: StudentProfile;
  semesters: SemesterPlan[];
  totalCredits: number;
  creditsOutsideMajor: number;
  unfulfilledRequirements: string[];
  warnings: string[];
}

// Constants - Berea College credit system: 1 course = 1 credit (not 3-4 like typical US colleges)
// Quarter credit courses (0.25) also exist for things like ensembles
export const MINIMUM_TOTAL_CREDITS = 32; // 32 course credits to graduate
export const MINIMUM_CREDITS_OUTSIDE_MAJOR = 20; // 20 credits must be outside major

// Credits per semester - exactly 4 courses per semester
// 8 semesters x 4 credits = 32 credits total to graduate
export const SEMESTER_CREDITS = {
  "1-Fall": 4,
  "1-Spring": 4,
  "2-Fall": 4,
  "2-Spring": 4,
  "3-Fall": 4,
  "3-Spring": 4,
  "4-Fall": 4,
  "4-Spring": 4,
} as const;

export const MAX_CREDITS_PER_SEMESTER = 4;
export const NORMAL_CREDITS_PER_SEMESTER = 4;
