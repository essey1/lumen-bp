// Course and curriculum types for Lumen academic planner

export interface Course {
  code: string;
  name: string;
  credits: number;
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
  | "Quantitative Focus"
  | "Natural Science"
  | "Social Science";

export type Value =
  | "Beyond the Borders"
  | "Holistic Wellness"
  | "Power & Equity"
  | "Seeking Meaning"
  | "Sustainability";

export type Richness = "International" | "Quantitative" | "Writing";

export type LearningInquiryCore =
  | "Explorations"
  | "Discoveries"
  | "Intersectional Justice in U.S."
  | "Global Issues";

export type Additional = "ALE" | "Physical Activity";

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
    quantitativeFocus: number; // 1
    naturalScience: number; // 2
    socialScience: number; // 1
  };
  richnesses: {
    international: number; // 1
    quantitative: number; // 1
    writing: number; // 2
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

export interface StudentProfile {
  majors: string[];
  minors: string[];
  interests: string[];
  hobbies: string[];
  careerGoals: string[];
}

export interface SemesterPlan {
  year: number;
  semester: "Fall" | "Spring";
  courses: PlannedCourse[];
  totalCredits: number;
  isOverloaded: boolean;
}

export interface PlannedCourse {
  code: string;
  name: string;
  credits: number;
  fulfills: string[]; // What requirements this fulfills
  category: "Major" | "Minor" | "GEM" | "Elective";
}

export interface AcademicPlan {
  student: StudentProfile;
  semesters: SemesterPlan[];
  totalCredits: number;
  creditsOutsideMajor: number;
  unfulfilledRequirements: string[];
  warnings: string[];
}

// Constants
export const MINIMUM_TOTAL_CREDITS = 32;
export const MINIMUM_CREDITS_OUTSIDE_MAJOR = 20;
export const MAX_CREDITS_PER_SEMESTER = 4.5;
export const NORMAL_CREDITS_PER_SEMESTER = 4;
