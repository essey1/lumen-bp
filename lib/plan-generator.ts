import type {
  AcademicPlan,
  CustomCourseEntry,
  PlannedCourse,
  PrereqNode,
  SemesterPlan,
  StudentProfile,
  WayOfKnowing,
} from "./types";
import { MINIMUM_TOTAL_CREDITS, MINIMUM_CREDITS_OUTSIDE_MAJOR } from "./types";

/**
 * Flatten a PrereqNode tree into string[][] for internal scheduling logic.
 * Outer array = AND (all groups must be satisfied).
 * Inner array = OR (any one course in the group satisfies it).
 */
function flattenPrereq(node: PrereqNode | undefined): string[][] {
  if (!node) return [];
  if (typeof node === 'string') return [[node]];
  if (node.type === 'OR') {
    const options: string[] = [];
    for (const c of node.courses) {
      if (typeof c === 'string') options.push(c);
      else {
        // Nested node inside OR — collect all leaf strings
        const sub = flattenPrereq(c);
        for (const g of sub) options.push(...g);
      }
    }
    return options.length > 0 ? [options] : [];
  }
  // AND: each child becomes its own group
  const groups: string[][] = [];
  for (const c of node.courses) groups.push(...flattenPrereq(c));
  return groups;
}
import { MAJORS } from "./majors-data";
import { MINORS } from "./minors-data";
import { COURSE_CATALOG } from "./course-catalog";
import { isCourseAvailable } from "./course-schedule-data";

// Capstone courses mapped to the major(s) that own them.
// A capstone from major X should not appear in the plan of a student not enrolled in X.
const CAPSTONE_OWNER: Map<string, Set<string>> = new Map();
for (const [majorCode, major] of Object.entries(MAJORS)) {
  for (const req of major.requirements) {
    if (!req.category.toLowerCase().includes("capstone")) continue;
    for (const code of [...req.courses, ...(req.mustInclude ?? [])]) {
      if (!CAPSTONE_OWNER.has(code)) CAPSTONE_OWNER.set(code, new Set());
      CAPSTONE_OWNER.get(code)!.add(majorCode);
    }
  }
}

function isOtherMajorCapstone(code: string, userMajors: string[]): boolean {
  const owners = CAPSTONE_OWNER.get(code);
  if (!owners) return false;
  return !userMajors.some(m => owners.has(m));
}

// Returns 0 for Plan A, 1 for Plan B, 2 for Plan C.
// Used to offset into a sorted candidate list so each plan selects
// a different (but still career-aligned) course when there's a choice.
function planTypeOffset(planType: "A" | "B" | "C"): number {
  return planType === "A" ? 0 : planType === "B" ? 1 : 2;
}

// Prerequisites: built from course catalog + L&I sequence.
// Format: Record<courseCode, string[][]>
//   Outer array = AND groups (every group must be satisfied).
//   Inner array = OR alternatives (any one in the group satisfies it).
// Sub-100-level and catalog-absent courses are excluded from every group.
function buildPrereqMap(): Record<string, string[][]> {
  const map: Record<string, string[][]> = {
    "L&I 200": [["L&I 100", "GSTR 110"]],
    "L&I 300": [["L&I 200", "GSTR 210"]],
    "L&I 400": [["L&I 300", "GSTR 310"]],
    "GSTR 210": [["GSTR 110", "L&I 100"]],
    "GSTR 310": [["GSTR 210", "L&I 200"]],
    "GSTR 410": [["GSTR 310", "L&I 300"]],
  };
  for (const [code, course] of Object.entries(COURSE_CATALOG)) {
    if (!course.prerequisites) continue;
    // Flatten the PrereqNode tree and filter out unavailable courses
    const groups = flattenPrereq(course.prerequisites)
      .map(orGroup => orGroup.filter(p => {
        const num = parseInt(p.match(/\d+/)?.[0] ?? "0");
        return num >= 100 && !!COURSE_CATALOG[p];
      }))
      .filter(g => g.length > 0);
    if (groups.length > 0) map[code] = groups;
  }
  return map;
}
const PREREQUISITES = buildPrereqMap();

const MATH_PLACEMENT_ORDER = [
  "MAT 010",
  "MAT 011",
  "MAT 012",
  "MAT 115",
  "MAT 125",
  "MAT 135",
  "MAT 225",
  "MAT 330",
] as const;

function getWaivedCourses(profile: StudentProfile): Set<string> {
  const waived = new Set<string>(profile.waivedCourses ?? []);
  const placement = profile.mathPlacement ?? "none";
  const idx = MATH_PLACEMENT_ORDER.indexOf(placement as typeof MATH_PLACEMENT_ORDER[number]);
  if (idx >= 0) {
    for (let i = 0; i <= idx; i++) waived.add(MATH_PLACEMENT_ORDER[i]);
  }
  return waived;
}

// Courses that become redundant when a higher-level equivalent is already collected.
// Key = intro course to skip; value = any one of these triggers the skip.
const SUPERSEDED_BY: Record<string, string[]> = {
  "PHY 127": ["PHY 221", "PHY 222"],
  "PHY 128": ["PHY 221", "PHY 222"],
};

// 286-level codes are summer internship/field experience courses — excluded from plan.
function isInternshipCode(code: string): boolean {
  return /\s286[A-Z]?$/.test(code);
}

// Maps student interests/career goals to preferred department prefixes for elective selection
const INTEREST_DEPT_MAP: Record<string, string[]> = {
  // --- Disciplines / Academic Interests ---
  Technology: ["CSC", "PHY", "MAT", "ETAD"],
  "Computer Science": ["CSC", "MAT", "PHY", "ETAD"],
  Science: ["BIO", "CHM", "PHY", "SENS", "MAT", "GEO"],
  Biology: ["BIO", "CHM", "SENS", "ANR", "PHY", "HLT"],
  Chemistry: ["CHM", "BIO", "PHY", "MAT", "SENS"],
  Physics: ["PHY", "MAT", "CSC", "ETAD"],
  Mathematics: ["MAT", "PHY", "CSC", "ECO"],
  Statistics: ["MAT", "PSY", "ECO", "SOC", "CSC"],
  Healthcare: ["BIO", "CHM", "PSY", "HLT", "NUR", "HHP", "CFS"],
  Nursing: ["NUR", "BIO", "CHM", "PSY", "HLT", "HHP"],
  Medicine: ["BIO", "CHM", "PHY", "PSY", "NUR", "HLT"],
  "Public Health": ["HLT", "BIO", "PSY", "SOC", "NUR", "HHP"],
  "Health Sciences": ["HLT", "BIO", "CHM", "PSY", "NUR", "HHP"],
  "Physical Education": ["HHP", "BIO", "PSY", "HLT", "WELL"],
  Wellness: ["HHP", "HLT", "PSY", "WELL", "BIO"],
  Psychology: ["PSY", "SOC", "CFS", "PHI", "BIO", "NUR"],
  "Social Work": ["SOC", "PSY", "CFS", "PSJ", "HLT"],
  "Child Development": ["CFS", "PSY", "EDS", "SOC", "HLT"],
  "Family Studies": ["CFS", "PSY", "SOC", "HLT", "WGS"],
  Sociology: ["SOC", "PSY", "AFR", "WGS", "PSJ", "CFS"],
  "Anthropology": ["SOC", "AFR", "HIS", "REL", "WGS"],
  Business: ["BUS", "ECO", "COM", "MAT", "PSC"],
  "Business Administration": ["BUS", "ECO", "COM", "MAT", "PSC"],
  Accounting: ["BUS", "MAT", "ECO"],
  Finance: ["BUS", "ECO", "MAT", "PSC"],
  Marketing: ["BUS", "COM", "PSY", "ECO"],
  Management: ["BUS", "ECO", "COM", "PSY", "SOC"],
  Entrepreneurship: ["BUS", "ECO", "COM", "CSC", "MAT"],
  Economics: ["ECO", "BUS", "MAT", "PSC", "SOC"],
  "Political Science": ["PSC", "HIS", "SOC", "PSJ", "PHI", "ECO"],
  "International Relations": ["PSC", "HIS", "ECO", "SOC", "AFR", "AST"],
  "Public Policy": ["PSC", "ECO", "SOC", "PSJ", "HIS"],
  History: ["HIS", "AFR", "PSC", "REL", "AST", "APS"],
  "American History": ["HIS", "AFR", "PSC", "APS", "REL"],
  "African American Studies": ["AFR", "HIS", "SOC", "PSJ", "WGS", "REL"],
  "Asian Studies": ["AST", "HIS", "PHI", "REL", "SOC"],
  "Appalachian Studies": ["APS", "HIS", "SOC", "ENG", "ANR"],
  "Gender Studies": ["WGS", "SOC", "PSY", "PHI", "AFR", "PSJ"],
  "Women's Studies": ["WGS", "SOC", "AFR", "PHI", "REL", "HIS"],
  "Ethnic Studies": ["AFR", "WGS", "SOC", "HIS", "PSJ", "AST"],
  "Social Justice": ["PSJ", "SOC", "AFR", "WGS", "HIS", "PHI"],
  "Social Impact": ["PSJ", "SOC", "AFR", "WGS", "HIS", "ECO"],
  "Peace Studies": ["PSJ", "PHI", "SOC", "PSC", "REL"],
  Philosophy: ["PHI", "REL", "PSJ", "ENG", "HIS"],
  Religion: ["REL", "PHI", "HIS", "AFR", "AST"],
  "Religious Studies": ["REL", "PHI", "HIS", "AFR", "WGS"],
  Communication: ["COM", "ENG", "THR", "PSY", "SOC"],
  Journalism: ["COM", "ENG", "HIS", "PSC", "SOC"],
  "Media Studies": ["COM", "ENG", "THR", "ART", "SOC"],
  Writing: ["ENG", "COM", "PHI", "HIS", "AFR"],
  Literature: ["ENG", "AFR", "WGS", "HIS", "AST", "SPN"],
  English: ["ENG", "COM", "PHI", "HIS", "AFR", "WGS"],
  Languages: ["SPN", "FRN", "GER", "JPN", "CHI", "LAT"],
  Spanish: ["SPN", "PSJ", "HIS", "COM", "WGS"],
  French: ["FRN", "HIS", "ENG", "REL", "AFR"],
  German: ["GER", "HIS", "PHI", "ENG"],
  Japanese: ["JPN", "AST", "HIS", "MUS"],
  Chinese: ["CHI", "AST", "HIS", "ECO"],
  Arts: ["ART", "ARH", "MUS", "THR", "COM"],
  "Visual Arts": ["ART", "ARH", "COM", "ETAD"],
  "Art History": ["ARH", "ART", "HIS", "REL", "AFR"],
  Music: ["MUS", "ART", "THR", "AFR", "AST"],
  "Music Education": ["MUS", "EDS", "ART", "THR"],
  Theatre: ["THR", "MUS", "COM", "ENG", "ART"],
  "Film Studies": ["THR", "COM", "ENG", "ART", "ARH"],
  Photography: ["ART", "COM", "THR"],
  "Fine Arts": ["ART", "ARH", "MUS", "THR"],
  "Performing Arts": ["MUS", "THR", "ART", "HHP"],
  "Graphic Design": ["ART", "COM", "CSC", "ETAD"],
  Teaching: ["EDS", "PSY", "SOC", "CFS", "MAT", "ENG"],
  Education: ["EDS", "PSY", "SOC", "CFS", "AFR", "ENG"],
  "Elementary Education": ["EDS", "CFS", "PSY", "MAT", "ENG"],
  "Secondary Education": ["EDS", "PSY", "MAT", "ENG", "BIO"],
  Environment: ["SENS", "BIO", "CHM", "ANR", "GEO", "PSJ"],
  "Environmental Science": ["SENS", "BIO", "CHM", "GEO", "PHY", "ANR"],
  "Environmental Studies": ["SENS", "BIO", "ANR", "GEO", "PSJ", "ECO"],
  Sustainability: ["SENS", "ANR", "ECO", "SOC", "BIO", "PSJ"],
  Agriculture: ["ANR", "BIO", "CHM", "SENS", "ECO", "GEO"],
  "Animal Science": ["ANR", "BIO", "CHM", "HHP"],
  "Plant Science": ["ANR", "BIO", "CHM", "SENS", "GEO"],
  "Food Science": ["ANR", "BIO", "CHM", "SENS", "HLT"],
  Geology: ["GEO", "SENS", "BIO", "CHM", "PHY"],
  Geography: ["GEO", "SENS", "HIS", "ECO", "ANR"],
  Research: ["BIO", "CHM", "PSY", "MAT", "SENS", "CSC"],
  "Quantitative Analysis": ["MAT", "ECO", "PSY", "CSC", "BUS"],
  // --- Career Goal / Post-Grad Tracks ---
  "Software Engineer": ["CSC", "MAT", "PHY", "ETAD"],
  "Full-Stack Developer": ["CSC", "MAT", "COM", "ETAD"],
  "Front-End Developer": ["CSC", "ART", "COM", "ETAD"],
  "Back-End Developer": ["CSC", "MAT", "PHY"],
  "Mobile Developer": ["CSC", "MAT", "ETAD"],
  "Data Scientist": ["CSC", "MAT", "PSY", "ECO", "BIO"],
  "Data Analyst": ["CSC", "MAT", "ECO", "BUS", "PSY"],
  "Machine Learning Engineer": ["CSC", "MAT", "PHY", "BIO"],
  "AI Engineer": ["CSC", "MAT", "PHY", "ETAD"],
  "Cybersecurity Analyst": ["CSC", "MAT", "PHY"],
  "Cloud Engineer": ["CSC", "MAT", "PHY"],
  "DevOps Engineer": ["CSC", "MAT", "PHY", "ETAD"],
  "UX Designer": ["CSC", "ART", "PSY", "COM"],
  "Product Manager": ["CSC", "BUS", "COM", "PSY"],
  "Systems Analyst": ["CSC", "MAT", "BUS", "ECO"],
  "Mechanical Engineer": ["PHY", "MAT", "CSC", "CHM"],
  "Electrical Engineer": ["PHY", "MAT", "CSC"],
  "Civil Engineer": ["PHY", "MAT", "GEO", "SENS"],
  "Chemical Engineer": ["CHM", "BIO", "MAT", "PHY"],
  "Biomedical Engineer": ["BIO", "CHM", "PHY", "MAT", "NUR"],
  "Environmental Engineer": ["SENS", "BIO", "CHM", "GEO", "ANR"],
  "Industrial Designer": ["ART", "PHY", "MAT", "CSC"],
  Physicist: ["PHY", "MAT", "CSC"],
  Mathematician: ["MAT", "PHY", "CSC", "ECO"],
  Statistician: ["MAT", "ECO", "PSY", "CSC", "BIO"],
  "Actuary": ["MAT", "ECO", "BUS", "CSC"],
  Biologist: ["BIO", "CHM", "SENS", "PHY", "MAT"],
  Ecologist: ["BIO", "SENS", "ANR", "GEO", "CHM"],
  "Wildlife Biologist": ["BIO", "ANR", "SENS", "CHM"],
  "Marine Biologist": ["BIO", "CHM", "SENS", "GEO"],
  Geneticist: ["BIO", "CHM", "MAT", "PHY"],
  Neuroscientist: ["BIO", "CHM", "PSY", "PHY"],
  Chemist: ["CHM", "BIO", "MAT", "PHY"],
  Pharmacist: ["CHM", "BIO", "NUR", "PSY", "HLT"],
  "Registered Nurse": ["NUR", "BIO", "CHM", "PSY", "HLT"],
  "Nurse Practitioner": ["NUR", "BIO", "CHM", "PSY", "HLT"],
  "Public Health Worker": ["HLT", "BIO", "SOC", "PSY", "NUR"],
  "Physical Therapist": ["HHP", "BIO", "PSY", "NUR", "HLT"],
  "Occupational Therapist": ["HHP", "PSY", "BIO", "CFS", "HLT"],
  "Health Administrator": ["HLT", "BUS", "SOC", "PSY"],
  Psychologist: ["PSY", "SOC", "BIO", "PHI", "CFS"],
  Counselor: ["PSY", "SOC", "CFS", "PHI", "EDS"],
  "Social Worker": ["SOC", "PSY", "CFS", "PSJ", "HLT"],
  "Therapist": ["PSY", "SOC", "CFS", "PHI", "NUR"],
  "Child Psychologist": ["PSY", "CFS", "SOC", "EDS"],
  Gerontologist: ["PSY", "SOC", "CFS", "HLT", "NUR"],
  Teacher: ["EDS", "PSY", "SOC", "MAT", "ENG"],
  "College Professor": ["ENG", "HIS", "PHI", "BIO", "MAT"],
  "School Counselor": ["PSY", "EDS", "SOC", "CFS"],
  "Instructional Designer": ["EDS", "CSC", "COM", "PSY", "ETAD"],
  Economist: ["ECO", "MAT", "BUS", "PSC", "SOC"],
  "Financial Analyst": ["ECO", "BUS", "MAT", "PSC"],
  "Investment Banker": ["BUS", "ECO", "MAT", "PSC"],
  "Business Analyst": ["BUS", "ECO", "CSC", "MAT"],
  Accountant: ["BUS", "MAT", "ECO"],
  "Marketing Manager": ["BUS", "COM", "PSY", "ECO"],
  "Human Resources Manager": ["BUS", "PSY", "SOC", "COM"],
  "Supply Chain Manager": ["BUS", "ECO", "MAT", "ANR"],
  "Policy Analyst": ["PSC", "ECO", "SOC", "HIS", "PHI"],
  Politician: ["PSC", "HIS", "SOC", "COM", "PHI"],
  Diplomat: ["PSC", "HIS", "SOC", "COM", "AST"],
  Lawyer: ["PSC", "HIS", "PHI", "PSJ", "COM", "ENG"],
  "Law School": ["PSC", "HIS", "PHI", "PSJ", "COM"],
  "Medical School": ["BIO", "CHM", "PHY", "PSY", "NUR"],
  "Graduate School": ["MAT", "PHY", "BIO", "CHM", "ENG", "PSY"],
  "Dental School": ["BIO", "CHM", "PHY", "PSY"],
  "Veterinary School": ["BIO", "CHM", "ANR", "PHY"],
  Historian: ["HIS", "AFR", "APS", "AST", "REL"],
  Archaeologist: ["HIS", "ARH", "GEO", "ANR", "SENS"],
  Journalist: ["COM", "ENG", "HIS", "PSC", "SOC"],
  "Technical Writer": ["ENG", "COM", "CSC", "MAT"],
  Author: ["ENG", "PHI", "HIS", "COM", "AFR"],
  Editor: ["ENG", "COM", "PHI", "HIS"],
  Librarian: ["ENG", "HIS", "PHI", "CSC", "COM"],
  "Museum Curator": ["ARH", "HIS", "ART", "ANR", "SENS"],
  Filmmaker: ["THR", "COM", "ENG", "ART"],
  Actor: ["THR", "MUS", "COM", "ENG"],
  Musician: ["MUS", "ART", "THR", "AFR"],
  Artist: ["ART", "ARH", "COM", "PHI", "MUS"],
  Photographer: ["ART", "COM", "THR"],
  Animator: ["ART", "CSC", "COM", "ETAD"],
  "Graphic Designer": ["ART", "COM", "CSC", "ETAD"],
  Architect: ["ART", "PHY", "MAT", "GEO", "SENS"],
  "Urban Planner": ["GEO", "SOC", "ECO", "PSC", "SENS"],
  "Park Ranger": ["ANR", "BIO", "SENS", "GEO"],
  "Conservation Biologist": ["BIO", "SENS", "ANR", "CHM", "GEO"],
  "Agricultural Scientist": ["ANR", "BIO", "CHM", "SENS", "ECO"],
  "Food Policy Advocate": ["ANR", "ECO", "SOC", "PSJ", "HLT"],
  "International Development": ["ECO", "SOC", "PSC", "HIS", "AFR"],
  "Nonprofit Manager": ["SOC", "PSJ", "ECO", "COM", "PSC"],
  "Community Organizer": ["SOC", "PSJ", "COM", "PSC", "EDS"],
  "Religious Leader": ["REL", "PHI", "SOC", "HIS", "COM"],
  Philosopher: ["PHI", "REL", "ENG", "HIS", "PSC"],
  Theologian: ["REL", "PHI", "HIS", "AFR", "WGS"],
  Linguist: ["ENG", "SPN", "FRN", "COM", "PHI"],
  Translator: ["SPN", "FRN", "GER", "JPN", "CHI", "ENG"],
  Psychotherapist: ["PSY", "PHI", "SOC", "CFS", "NUR"],
  "Sports Coach": ["HHP", "PSY", "EDS", "BIO"],
  "Athletic Trainer": ["HHP", "BIO", "NUR", "PSY"],
  Dietitian: ["ANR", "BIO", "CHM", "HLT", "NUR"],
  "Lab Technician": ["BIO", "CHM", "PHY", "MAT"],
  "Research Scientist": ["BIO", "CHM", "PHY", "MAT", "PSY"],

  // ── New interests covering all Berea majors ──────────────────────────────
  // AFR
  "African American Culture": ["AFR", "HIS", "SOC", "ENG"],
  "African American History": ["AFR", "HIS", "SOC", "APS"],
  "African Studies": ["AFR", "HIS", "SOC", "REL"],
  "Black Literature": ["AFR", "ENG", "HIS", "WGS"],
  "Civil Rights": ["AFR", "HIS", "PSJ", "SOC"],
  "Diaspora Studies": ["AFR", "HIS", "SOC"],
  "Pan-Africanism": ["AFR", "HIS", "PSJ"],
  "Racial Justice": ["AFR", "PSJ", "SOC", "HIS"],
  "Social Activism": ["PSJ", "SOC", "AFR", "WGS"],
  "Social Movements": ["PSJ", "SOC", "HIS", "AFR"],
  // ANR
  "Agricultural Policy": ["ANR", "PSC", "ECO"],
  "Animal Behavior": ["BIO", "PSY", "ANR"],
  "Beekeeping": ["ANR", "BIO", "SENS"],
  "Crop Science": ["ANR", "BIO", "CHM"],
  "Farm Management": ["ANR", "ECO", "BIO"],
  "Food Systems": ["ANR", "BIO", "ECO", "CFS"],
  "Food Policy": ["ANR", "ECO", "SOC", "PSJ"],
  "Horticulture": ["ANR", "BIO", "SENS"],
  "Livestock Management": ["ANR", "BIO", "CHM"],
  "Natural Resource Management": ["ANR", "SENS", "BIO", "GEO"],
  "Range Management": ["ANR", "SENS", "BIO"],
  "Soil Science": ["ANR", "BIO", "SENS"],
  "Sustainable Agriculture": ["ANR", "SENS", "BIO", "ECO"],
  "Water Conservation": ["ANR", "SENS", "BIO"],
  "Wildlife Management": ["ANR", "SENS", "BIO", "GEO"],
  // ART / ARH
  "Acting": ["THR", "MUS", "COM"],
  "Art Criticism": ["ARH", "ART", "ENG"],
  "Art Education": ["ART", "EDS", "ARH"],
  "Ceramics": ["ART", "APS"],
  "Cultural Heritage": ["ARH", "HIS", "APS"],
  "Drawing": ["ART", "COM"],
  "Mixed Media": ["ART", "THR"],
  "Painting": ["ART"],
  "Printmaking": ["ART"],
  "Sculpture": ["ART", "ETAD"],
  "Studio Art": ["ART"],
  "Textile Arts": ["ART", "APS"],
  // AST
  "Asian Cinema": ["AST", "THR", "HIS"],
  "Asian Culture": ["AST", "HIS", "REL"],
  "Asian History": ["AST", "HIS"],
  "Buddhism": ["AST", "REL", "PHI"],
  "Chinese Language": ["CHI", "AST"],
  "East Asian Studies": ["AST", "HIS", "REL"],
  "Japanese Language": ["JPN", "AST", "HIS"],
  "Mandarin": ["CHI", "AST", "ECO"],
  // CHM
  "Analytical Chemistry": ["CHM", "BIO", "MAT"],
  "Biochemistry": ["CHM", "BIO", "MAT"],
  "Organic Chemistry": ["CHM", "BIO", "MAT"],
  // CFS
  "Child Advocacy": ["CFS", "PSY", "PSJ", "SOC"],
  "Early Childhood Education": ["CFS", "EDS", "PSY"],
  "Family Counseling": ["CFS", "PSY", "SOC"],
  "Nutrition": ["ANR", "BIO", "CHM", "HLT", "CFS"],
  "Parenting": ["CFS", "PSY", "SOC"],
  // COM
  "Broadcasting": ["COM", "THR"],
  "Cross-Cultural Communication": ["COM", "AST", "SPN", "FRN"],
  "Digital Media": ["COM", "CSC", "ART", "THR"],
  "Directing": ["THR", "COM"],
  "Grant Writing": ["ENG", "COM", "PSJ"],
  "Intercultural Communication": ["COM", "AST", "SPN"],
  "Media Production": ["COM", "THR", "ART"],
  "Oral History": ["HIS", "SOC", "COM"],
  "Screenwriting": ["THR", "ENG", "COM"],
  "Songwriting": ["MUS", "ENG"],
  "Sports Broadcasting": ["COM", "HHP"],
  // EDS
  "Curriculum Development": ["EDS", "PSY", "ENG"],
  "Special Education": ["EDS", "PSY", "CFS"],
  // ETAD
  "CAD Design": ["ETAD", "PHY", "MAT"],
  "Manufacturing": ["ETAD", "PHY", "CHM", "MAT"],
  "Product Development": ["ETAD", "ART", "CSC"],
  "Sustainable Design": ["ETAD", "SENS", "ART"],
  "Woodworking": ["ETAD", "APS", "ART"],
  // ENG
  "Comparative Literature": ["ENG", "SPN", "FRN", "GER"],
  "Creative Writing": ["ENG", "COM", "THR"],
  "Literary Analysis": ["ENG", "AFR", "WGS"],
  "Poetry": ["ENG", "AFR", "COM"],
  "Prose Fiction": ["ENG", "COM"],
  "Publishing": ["ENG", "COM"],
  "Rhetoric": ["ENG", "COM", "PHI"],
  // HHP
  "Exercise Science": ["HHP", "BIO", "PSY"],
  "Kinesiology": ["HHP", "BIO", "PSY"],
  "Sports Performance": ["HHP", "BIO", "PSY"],
  "Strength & Conditioning": ["HHP", "BIO"],
  // HIS
  "Historical Research": ["HIS", "AFR", "APS"],
  "Military History": ["HIS", "PSC"],
  "Modern History": ["HIS", "PSC", "SOC"],
  "World History": ["HIS", "AST", "AFR"],
  // HLT
  "Community Health": ["HLT", "BIO", "SOC"],
  "Global Health": ["HLT", "BIO", "SOC", "PSJ"],
  "Health Education": ["HLT", "BIO", "EDS"],
  "Health Policy": ["HLT", "PSC", "ECO"],
  // MAT
  "Abstract Algebra": ["MAT", "CSC"],
  "Applied Mathematics": ["MAT", "PHY", "CSC", "ECO"],
  "Graph Theory": ["MAT", "CSC"],
  "Number Theory": ["MAT", "CSC"],
  "Operations Research": ["MAT", "ECO", "BUS", "CSC"],
  "Probability": ["MAT", "PSY", "ECO"],
  "Pure Mathematics": ["MAT", "PHY"],
  // MUS
  "Band": ["MUS"],
  "Choir": ["MUS", "THR"],
  "Composition": ["MUS", "ART"],
  "Music History": ["MUS", "HIS", "AFR"],
  "Music Performance": ["MUS"],
  "Music Production": ["MUS", "CSC", "ETAD"],
  "Music Therapy": ["MUS", "PSY", "HLT"],
  "Musical Theatre": ["MUS", "THR"],
  // PHI
  "Applied Ethics": ["PHI", "BIO", "NUR", "SOC"],
  "Bioethics": ["PHI", "BIO", "NUR"],
  "Logic": ["PHI", "MAT", "CSC"],
  "Philosophy of Mind": ["PHI", "PSY", "CSC"],
  "Political Philosophy": ["PHI", "PSC", "SOC"],
  // PHY
  "Astrophysics": ["PHY", "MAT", "CSC"],
  "Nuclear Physics": ["PHY", "CHM", "MAT"],
  "Quantum Mechanics": ["PHY", "MAT", "CHM"],
  "Thermodynamics": ["PHY", "CHM", "ETAD", "MAT"],
  // PSC
  "American Government": ["PSC", "HIS", "SOC"],
  "Campaign Management": ["PSC", "COM"],
  "Civil Liberties": ["PSC", "PHI", "PSJ"],
  "Comparative Politics": ["PSC", "HIS", "SOC"],
  "Constitutional Law": ["PSC", "HIS", "PHI"],
  "Elections": ["PSC", "SOC", "COM"],
  "Foreign Policy": ["PSC", "HIS", "SOC"],
  "Intelligence Analysis": ["PSC", "SOC", "HIS"],
  "International Law": ["PSC", "PHI"],
  "Public Administration": ["PSC", "SOC", "BUS"],
  // PSJ
  "Conflict Resolution": ["PSJ", "SOC", "PHI", "PSC"],
  "Human Rights": ["PSJ", "SOC", "PHI", "AFR"],
  "Nonviolent Resistance": ["PSJ", "HIS", "PHI"],
  "Peacebuilding": ["PSJ", "SOC", "PHI"],
  "Restorative Justice": ["PSJ", "SOC", "PHI", "PSY"],
  // REL
  "Biblical Studies": ["REL", "HIS", "PHI"],
  "Comparative Religion": ["REL", "PHI", "HIS", "AST"],
  "Faith & Culture": ["REL", "PHI", "SOC", "HIS"],
  "Interfaith Dialogue": ["REL", "PHI", "SOC"],
  "Spirituality": ["REL", "PHI", "SOC"],
  "Theology": ["REL", "PHI", "HIS"],
  "World Religions": ["REL", "PHI", "AST"],
  // SOC
  "Cultural Anthropology": ["SOC", "AFR", "HIS", "REL"],
  "Cultural Studies": ["AFR", "SOC", "ENG", "HIS", "WGS"],
  "Demographics": ["SOC", "MAT", "ECO"],
  "Development Economics": ["ECO", "PSC", "SOC"],
  "Diversity & Inclusion": ["SOC", "AFR", "WGS", "PSJ"],
  "Immigration": ["SOC", "PSJ", "PSC"],
  "Inequality": ["SOC", "AFR", "PSJ", "ECO"],
  "Labor Economics": ["ECO", "SOC", "PSC"],
  "Race & Ethnicity": ["AFR", "SOC", "WGS", "HIS"],
  "Social Theory": ["SOC", "PHI", "AFR"],
  "Urban Studies": ["SOC", "GEO", "PSC", "ECO"],
  // SENS
  "Climate Change": ["SENS", "PHY", "ECO", "PSJ"],
  "Conservation": ["SENS", "BIO", "ANR", "GEO"],
  "Environmental Policy": ["SENS", "PSC", "ECO"],
  "GIS & Mapping": ["GEO", "SENS", "CSC"],
  "Hydrology": ["GEO", "SENS", "BIO"],
  "Watershed Management": ["ANR", "SENS", "BIO", "GEO"],
  // THR
  "Drama": ["THR", "ENG", "MUS"],
  "Film Production": ["THR", "COM", "ART"],
  "Lighting Design": ["THR", "ETAD"],
  "Set Design": ["THR", "ART", "ETAD"],
  "Stage Management": ["THR", "COM"],
  "Voice & Movement": ["THR", "MUS"],
  // WGS
  "Feminist Theory": ["WGS", "PHI", "SOC", "AFR"],
  "Gender & Society": ["WGS", "SOC", "PSJ", "AFR"],
  "Gender Equity": ["WGS", "PSJ", "SOC"],
  "LGBTQ+ Studies": ["WGS", "SOC", "PHI", "AFR"],
  "Women's History": ["WGS", "HIS", "AFR"],
  "Women's Leadership": ["WGS", "SOC", "BUS"],

  // ── New career mappings ──────────────────────────────────────────────────
  "Aerospace Engineer": ["PHY", "ETAD", "MAT", "CHM"],
  "Agronomist": ["ANR", "BIO", "CHM", "SENS"],
  "AI Researcher": ["CSC", "MAT", "PHY"],
  "Animal Scientist": ["ANR", "BIO", "CHM"],
  "Art Conservator": ["ARH", "ART", "CHM"],
  "Art Educator": ["ART", "EDS", "ARH"],
  "Art Historian": ["ARH", "HIS"],
  "Athletic Director": ["HHP", "BUS", "EDS"],
  "Band Director": ["MUS", "EDS"],
  "Beekeeper": ["ANR", "BIO"],
  "Biochemist": ["CHM", "BIO", "MAT"],
  "Bioinformatics Analyst": ["BIO", "CSC", "MAT"],
  "Bioethicist": ["PHI", "BIO", "NUR"],
  "Book Editor": ["ENG", "COM"],
  "Broadcast Journalist": ["COM", "THR"],
  "CAD Technician": ["ETAD", "PHY"],
  "Campaign Manager": ["PSC", "COM"],
  "Ceramicist": ["ART", "APS"],
  "Chaplain": ["REL", "PHI", "SOC"],
  "Child Life Specialist": ["CFS", "PSY", "NUR"],
  "Child Welfare Worker": ["CFS", "PSY", "SOC"],
  "Choir Director": ["MUS", "EDS"],
  "Civil Liberties Lawyer": ["PSC", "PHI", "PSJ"],
  "Civil Rights Advocate": ["AFR", "PSJ", "HIS"],
  "Climate Change Analyst": ["SENS", "PHY", "ECO"],
  "Community Advocate": ["PSJ", "SOC", "AFR"],
  "Community Health Worker": ["HLT", "BIO", "SOC"],
  "Composer": ["MUS", "ART"],
  "Conflict Mediator": ["PSJ", "SOC", "PHI"],
  "Conservation Planner": ["SENS", "ANR", "GEO"],
  "Copywriter": ["ENG", "COM", "BUS"],
  "Corrections Counselor": ["PSY", "SOC", "PSJ"],
  "Costume Designer": ["THR", "ART"],
  "Cultural Attaché": ["AST", "COM", "HIS"],
  "Cultural Heritage Manager": ["ARH", "HIS", "APS"],
  "Curriculum Developer": ["EDS", "PSY", "ENG"],
  "Data Engineer": ["CSC", "MAT", "ECO"],
  "Demographer": ["SOC", "MAT", "ECO"],
  "Development Economist": ["ECO", "PSC", "SOC"],
  "Diversity Officer": ["SOC", "AFR", "WGS", "PSJ"],
  "Diversity & Inclusion Specialist": ["SOC", "AFR", "WGS"],
  "Documentary Filmmaker": ["THR", "COM", "HIS"],
  "Drama Teacher": ["THR", "EDS", "ENG"],
  "Early Childhood Teacher": ["EDS", "CFS", "PSY"],
  "Economic Researcher": ["ECO", "MAT", "SOC"],
  "Elementary Teacher": ["EDS", "CFS", "PSY", "MAT"],
  "Energy Systems Engineer": ["PHY", "ETAD", "MAT"],
  "Engineering Technologist": ["ETAD", "PHY", "MAT"],
  "ESL Teacher": ["ENG", "EDS", "COM"],
  "Ethics Officer": ["PHI", "BUS", "SOC"],
  "Exhibition Designer": ["ARH", "ART", "ETAD"],
  "Exercise Physiologist": ["HHP", "BIO", "PSY"],
  "Faith Community Leader": ["REL", "PHI", "SOC"],
  "Family Services Coordinator": ["CFS", "PSY", "SOC"],
  "Farm Manager": ["ANR", "ECO", "BIO"],
  "Feminist Researcher": ["WGS", "SOC", "PHI"],
  "Film Director": ["THR", "COM", "ART"],
  "Flight Nurse": ["NUR", "BIO"],
  "Food Chemist": ["CHM", "ANR", "BIO"],
  "Food Scientist": ["ANR", "BIO", "CHM", "CFS"],
  "Food Systems Manager": ["ANR", "ECO", "BIO", "CFS"],
  "Forensic Chemist": ["CHM", "BIO", "PSJ"],
  "Forensic Nurse": ["NUR", "PSJ", "BIO"],
  "Forensic Scientist": ["BIO", "CHM", "PHY", "PSJ"],
  "Foreign Language Teacher": ["SPN", "FRN", "GER", "JPN", "EDS"],
  "Foreign Service Officer": ["PSC", "HIS", "AST", "COM"],
  "Gallery Manager": ["ARH", "ART", "BUS"],
  "Gender Equity Consultant": ["WGS", "SOC", "PSJ"],
  "GIS Analyst": ["GEO", "SENS", "CSC"],
  "Government Analyst": ["PSC", "ECO", "SOC"],
  "Grant Writer": ["ENG", "COM", "PSJ"],
  "Health Educator": ["HLT", "BIO", "EDS"],
  "Health Policy Analyst": ["HLT", "PSC", "ECO"],
  "High School Teacher": ["EDS", "PSY"],
  "Historic Preservation Specialist": ["HIS", "ARH", "APS"],
  "History Teacher": ["HIS", "EDS"],
  "Horticulturist": ["ANR", "BIO", "SENS"],
  "Hospital Administrator": ["HLT", "BUS", "NUR"],
  "Hospital Chaplain": ["REL", "NUR", "PSY"],
  "Human Rights Advocate": ["PSJ", "SOC", "PHI", "AFR"],
  "Humanitarian Aid Worker": ["PSJ", "SOC", "ECO"],
  "Hydrologist": ["GEO", "SENS", "BIO"],
  "Illustrator": ["ART", "COM"],
  "Immigration Specialist": ["SOC", "PSJ", "PSC"],
  "Industrial Chemist": ["CHM", "ETAD", "MAT"],
  "Intelligence Analyst": ["PSC", "SOC", "HIS"],
  "Interfaith Minister": ["REL", "PHI", "SOC"],
  "Interpreter": ["SPN", "FRN", "GER", "JPN", "CHI", "COM"],
  "Labor & Delivery Nurse": ["NUR", "BIO"],
  "Labor Economist": ["ECO", "SOC", "PSC"],
  "Lactation Consultant": ["NUR", "CFS", "BIO"],
  "Language Instructor": ["SPN", "FRN", "GER", "JPN", "CHI", "EDS"],
  "LGBTQ+ Advocate": ["WGS", "SOC", "PSJ"],
  "Lighting Designer": ["THR", "ETAD"],
  "Literary Agent": ["ENG", "COM", "BUS"],
  "Lobbyist": ["PSC", "COM", "BUS"],
  "Localization Specialist": ["SPN", "FRN", "GER", "JPN", "CHI", "COM"],
  "Magazine Editor": ["ENG", "COM"],
  "Manufacturing Engineer": ["ETAD", "PHY", "CHM", "MAT"],
  "Market Research Analyst": ["ECO", "BUS", "SOC"],
  "Math Educator": ["MAT", "EDS"],
  "Middle School Teacher": ["EDS", "PSY"],
  "Ministry Coordinator": ["REL", "SOC", "COM"],
  "Music Producer": ["MUS", "CSC", "ETAD"],
  "Music Teacher": ["MUS", "EDS"],
  "Music Therapist": ["MUS", "PSY", "HLT"],
  "Muralist": ["ART", "COM"],
  "Natural Resource Manager": ["ANR", "SENS", "BIO"],
  "Neonatal Nurse": ["NUR", "BIO"],
  "News Anchor": ["COM", "THR"],
  "Nonprofit Director": ["PSJ", "SOC", "BUS"],
  "Nuclear Physicist": ["PHY", "MAT", "CHM"],
  "Nursing Professor": ["NUR", "EDS", "BIO"],
  "Oral Historian": ["HIS", "SOC", "COM"],
  "Peace Corps Volunteer": ["PSJ", "SOC"],
  "Peacebuilder": ["PSJ", "PHI", "SOC"],
  "Pediatric Nurse": ["NUR", "BIO", "CFS"],
  "Pharmaceutical Scientist": ["CHM", "BIO", "MAT"],
  "Photovoltaic Engineer": ["PHY", "ETAD", "CHM"],
  "Philosophy Teacher": ["PHI", "EDS", "REL"],
  "Podcast Producer": ["COM", "MUS", "THR"],
  "Policy Researcher": ["PSC", "ECO", "SOC"],
  "Polymer Scientist": ["CHM", "MAT", "PHY"],
  "PR Specialist": ["COM", "BUS"],
  "Product Designer": ["ART", "ETAD", "CSC"],
  "Public Health Inspector": ["HLT", "BIO", "SOC"],
  "Quality Engineer": ["ETAD", "PHY", "CHM"],
  "Quantum Computing Researcher": ["PHY", "CSC", "MAT"],
  "Recording Artist": ["MUS", "COM"],
  "Recreation Therapist": ["HHP", "PSY"],
  "Refugee Resettlement Specialist": ["PSJ", "SOC", "COM"],
  "Religious Educator": ["REL", "EDS", "PHI"],
  "Research Sociologist": ["SOC", "MAT", "PSY"],
  "Robotics Engineer": ["CSC", "PHY", "ETAD", "MAT"],
  "School Principal": ["EDS", "PSY", "BUS"],
  "Screenwriter": ["THR", "ENG", "COM"],
  "Semiconductor Engineer": ["PHY", "ETAD", "MAT"],
  "Session Musician": ["MUS"],
  "Social Justice Advocate": ["PSJ", "AFR", "SOC", "WGS"],
  "Soil Scientist": ["ANR", "BIO", "SENS"],
  "Songwriter": ["MUS", "ENG"],
  "Sound Engineer": ["MUS", "CSC", "ETAD"],
  "Special Education Teacher": ["EDS", "PSY", "CFS"],
  "Speechwriter": ["ENG", "COM", "PSC"],
  "Sport Psychologist": ["HHP", "PSY", "EDS"],
  "Sports Broadcaster": ["COM", "HHP"],
  "Stage Manager": ["THR", "BUS"],
  "State Representative": ["PSC", "COM", "HIS"],
  "Strength & Conditioning Coach": ["HHP", "BIO"],
  "Studio Artist": ["ART"],
  "Sustainability Manager": ["SENS", "ECO", "BUS"],
  "Teaching Assistant": ["EDS"],
  "Theatre Director": ["THR", "COM"],
  "Title IX Coordinator": ["WGS", "PSC", "HLT"],
  "Trade Analyst": ["ECO", "PSC", "BUS"],
  "Translation Specialist": ["SPN", "FRN", "GER", "JPN", "CHI", "ENG"],
  "Travel Nurse": ["NUR", "BIO"],
  "Video Producer": ["THR", "COM", "CSC"],
  "Voice Actor": ["THR", "COM", "MUS"],
  "Water Quality Specialist": ["ANR", "SENS", "BIO"],
  "Wildlife Conservationist": ["ANR", "SENS", "BIO"],
  "Women's Center Director": ["WGS", "SOC", "EDS"],
  "Women's Rights Advocate": ["WGS", "PSJ", "SOC"],
};

// ── Education-department guard ─────────────────────────────────────────────────
// EDS courses are only suggested when the student has explicitly expressed an
// interest in teaching, education, or a related field.
const EDUCATION_INTEREST_TERMS = new Set<string>([
  "Teaching", "Education", "Elementary Education", "Secondary Education",
  "Music Education", "Art Education", "Health Education",
  "Teacher", "Elementary Teacher", "High School Teacher", "Middle School Teacher",
  "Drama Teacher", "Math Educator", "History Teacher", "Philosophy Teacher",
  "Language Instructor", "Foreign Language Teacher", "ESL Teacher",
  "Early Childhood Teacher", "Early Childhood Education",
  "School Counselor", "Instructional Designer", "Special Education Teacher",
  "Special Education", "Curriculum Development", "Curriculum Developer",
  "Band Director", "Choir Director", "Religious Educator", "Nursing Professor",
  "School Principal", "Athletic Director", "Sports Coach", "Teaching Assistant",
]);

function hasEducationInterest(profile: StudentProfile): boolean {
  const allGoals = [...(profile.interests ?? []), ...profile.careerGoals];
  return allGoals.some(
    g => EDUCATION_INTEREST_TERMS.has(g) || (INTEREST_DEPT_MAP[g] ?? []).includes("EDS")
  );
}

// Extra keyword hints per course code for career matching (supplements name-based scoring)
const COURSE_CAREER_HINTS: Record<string, string[]> = {
  // CSC upper-level
  "CSC 300": ["embedded", "hardware", "iot", "robotics", "electronics"],
  "CSC 301": ["ux", "interface", "frontend", "hci", "product", "design"],
  "CSC 303": ["theory", "formal", "computation", "discrete", "logic"],
  "CSC 328": ["networking", "network", "systems", "internet", "protocol"],
  "CSC 330": ["sql", "backend", "storage", "database", "data"],
  "CSC 335": ["architecture", "low-level", "systems", "assembly"],
  "CSC 336": ["mobile", "android", "ios", "app development"],
  "CSC 410": ["ai", "artificial intelligence", "neural", "machine learning", "deep learning"],
  "CSC 412": ["cloud", "infrastructure", "internet", "networking", "distributed"],
  "CSC 420": ["compiler", "formal", "language", "theory"],
  "CSC 425": ["virtualization", "cloud", "operating systems", "systems"],
  "CSC 426": ["devops", "agile", "collaborative", "open source", "software engineering"],
  "CSC 433": ["numerical", "scientific computing", "simulation", "computational"],
  "CSC 440": ["optimization", "efficiency", "algorithms", "complexity"],
  "CSC 445": ["modeling", "formal", "verification", "theory"],
  "CSC 450": ["cybersecurity", "cryptography", "security", "network security"],
  // PHY courses
  "PHY 120": ["energy", "environment", "climate", "sustainability"],
  "PHY 130": ["engineering", "design", "applied", "mechanical"],
  "PHY 221": ["calculus", "mechanics", "physics", "engineering"],
  "PHY 222": ["electromagnetism", "waves", "optics", "engineering"],
  "PHY 320": ["modern physics", "quantum", "relativity", "atomic"],
  "PHY 340": ["biophysics", "biology", "life sciences", "medical"],
  "PHY 365": ["thermal", "thermodynamics", "statistical mechanics", "materials"],
  "PHY 460": ["electromagnetic", "optics", "waves", "engineering"],
  "PHY 481": ["classical mechanics", "dynamics", "mechanics", "engineering"],
  "PHY 482": ["quantum", "modern", "atomic", "nuclear"],
  "PHY 485": ["materials", "solid state", "condensed matter", "nanoscience"],
  // MAT courses
  "MAT 216": ["discrete", "logic", "proof", "computer science", "theory", "algorithm", "graph theory", "combinatorics", "data structures"],
  "MAT 312": ["optimization", "operations research", "industrial", "management", "linear optimization", "supply chain"],
  "MAT 330": ["multivariable", "calculus", "vector", "engineering"],
  "MAT 337": ["differential equations", "dynamics", "engineering", "mechanical", "modeling"],
  "MAT 415": ["combinatorics", "discrete", "graph theory", "algorithm"],
  "MAT 433": ["numerical", "simulation", "scientific", "computational", "engineering"],
  "MAT 434": ["analysis", "real analysis", "pure math", "proof", "topology"],
  // BIO courses
  "BIO 201": ["anatomy", "physiology", "healthcare", "nursing", "medical"],
  "BIO 202": ["anatomy", "physiology", "healthcare", "nursing", "medical"],
  "BIO 207": ["pathophysiology", "disease", "clinical", "nursing", "healthcare"],
  "BIO 222": ["microbiology", "bacteria", "infection", "healthcare", "laboratory"],
  "BIO 306": ["histology", "tissue", "clinical", "laboratory", "medical"],
  "BIO 310": ["ecology", "environment", "field biology", "conservation"],
  "BIO 323": ["physiology", "organism", "medical", "healthcare", "laboratory"],
  "BIO 325": ["neurobiology", "brain", "neuroscience", "medical", "cognitive"],
  "BIO 330": ["genetics", "dna", "molecular", "biotechnology", "genomics"],
  "BIO 331": ["developmental biology", "embryology", "stem cells", "medical"],
  "BIO 332": ["molecular biology", "genetics", "biotechnology", "genomics"],
  "BIO 338": ["immunology", "immune system", "medical", "clinical", "healthcare"],
  "BIO 342": ["cell biology", "cellular", "molecular", "biochemistry"],
  "BIO 344": ["evolution", "natural selection", "ecology", "systematics"],
  "BIO 346": ["conservation", "wildlife", "ecology", "environmental"],
  "BIO 441": ["biochemistry", "molecular", "chemistry", "metabolism"],
  "BIO 486": ["bioinformatics", "genomics", "computational biology", "data"],
  // CHM courses
  "CHM 311": ["analytical chemistry", "instrumentation", "laboratory", "quantitative"],
  "CHM 340": ["organic chemistry", "synthesis", "reaction mechanism", "pharmaceutical"],
  "CHM 345": ["organic chemistry", "synthesis", "pharmaceutical", "laboratory"],
  "CHM 361": ["physical chemistry", "thermodynamics", "kinetics", "quantum"],
  "CHM 362": ["physical chemistry", "spectroscopy", "thermodynamics"],
  "CHM 370": ["biochemistry", "biological chemistry", "molecular", "metabolism"],
  "CHM 371": ["biochemistry", "protein", "metabolism", "molecular biology"],
  "CHM 440": ["advanced analytical", "spectroscopy", "instrumentation", "research"],
  "CHM 451": ["inorganic chemistry", "transition metals", "materials"],
  "CHM 470": ["advanced biochemistry", "enzymes", "molecular", "research"],
  // PSY courses
  "PSY 207": ["behavioral", "learning", "conditioning", "education", "therapy"],
  "PSY 208": ["cognitive", "cognition", "memory", "perception", "neuropsychology"],
  "PSY 209": ["social psychology", "group behavior", "attitude", "influence"],
  "PSY 210": ["industrial", "organizational", "workplace", "human resources", "management"],
  "PSY 211": ["abnormal", "clinical", "mental health", "therapy", "disorder"],
  "PSY 212": ["neuroscience", "brain", "behavior", "neurobiology", "cognitive"],
  "PSY 217": ["cross-cultural", "diversity", "international", "cultural"],
  "PSY 225": ["statistics", "research methods", "data analysis", "quantitative"],
  "PSY 227": ["health psychology", "wellness", "stress", "behavioral medicine"],
  "PSY 244": ["developmental", "child", "lifespan", "human development"],
  "PSY 323": ["clinical", "counseling", "therapy", "mental health", "assessment"],
  "PSY 325": ["advanced statistics", "research design", "data analysis"],
  // SOC / CFS
  "SOC 200": ["health", "sociology of health", "medical sociology", "public health"],
  "SOC 202": ["crime", "criminal justice", "law", "deviance", "justice"],
  "SOC 220": ["anthropology", "culture", "ethnography", "fieldwork"],
  "SOC 223": ["inequality", "stratification", "social class", "poverty"],
  "SOC 300": ["food", "agriculture", "culture", "society"],
  "SOC 335": ["research methods", "social research", "qualitative", "quantitative"],
  "SOC 340": ["social statistics", "data analysis", "quantitative", "research"],
  "SOC 341": ["development", "social change", "globalization", "international"],
  "SOC 350": ["sociological theory", "classical theory", "contemporary theory"],
  "CFS 313": ["child development", "early childhood", "developmental", "education"],
  "CFS 315": ["family", "parenting", "family systems", "counseling"],
  "CFS 350": ["adolescent", "teenage", "youth development", "counseling"],
  "CFS 353": ["child welfare", "social work", "foster care", "policy"],
  "CFS 362": ["family policy", "advocacy", "social services", "welfare"],
  "CFS 366": ["child care", "early childhood education", "preschool"],
  // ECO / BUS
  "ECO 101": ["microeconomics", "market", "supply", "demand", "economics"],
  "ECO 102": ["macroeconomics", "gdp", "monetary policy", "fiscal", "economics"],
  "ECO 303": ["intermediate microeconomics", "market analysis", "price theory"],
  "ECO 304": ["intermediate macroeconomics", "monetary", "fiscal", "national income"],
  "BUS 315": ["marketing", "advertising", "consumer behavior", "promotion"],
  "BUS 323": ["management", "organizational behavior", "leadership", "strategy"],
  "BUS 324": ["human resources", "personnel", "organizational", "workforce"],
  "BUS 326": ["finance", "investment", "capital", "valuation"],
  "BUS 327": ["operations management", "supply chain", "logistics", "production"],
  "BUS 328": ["accounting", "financial statements", "bookkeeping"],
  "BUS 345": ["entrepreneurship", "startup", "business plan", "innovation"],
  "BUS 346": ["strategic management", "corporate strategy", "competitive"],
  "BUS 363": ["international business", "global", "trade", "multinational"],
  "BUS 437": ["business law", "contracts", "legal", "regulation"],
  // COM / ENG
  "COM 302": ["public relations", "pr", "media", "publicity", "corporate communication"],
  "COM 303": ["organizational communication", "workplace", "management", "leadership"],
  "COM 305": ["persuasion", "rhetoric", "argumentation", "speech"],
  "COM 310": ["media production", "broadcasting", "radio", "television", "audio"],
  "COM 314": ["intercultural communication", "diversity", "global", "cross-cultural"],
  "COM 315": ["journalism", "reporting", "news", "writing", "media"],
  "COM 410": ["digital media", "social media", "online communication", "content creation"],
  "ENG 215": ["writing", "composition", "academic writing", "rhetoric"],
  "ENG 220": ["creative writing", "fiction", "poetry", "narrative"],
  "ENG 230": ["grammar", "linguistics", "language", "usage"],
  "ENG 310": ["literature", "literary analysis", "criticism", "theory"],
  "ENG 350": ["technical writing", "professional writing", "documentation"],
  // HIS
  "HIS 235": ["modern history", "contemporary", "global", "international"],
  "HIS 251": ["american history", "united states", "national", "government"],
  "HIS 310": ["intellectual history", "ideas", "philosophy", "culture"],
  "HIS 325": ["world history", "global", "comparative", "civilizations"],
  "HIS 356": ["social history", "society", "working class", "everyday life"],
  // SENS / ANR / GEO
  "SENS 310": ["ecology", "environment", "biodiversity", "field biology", "conservation"],
  "SENS 320": ["gis", "geographic information systems", "spatial analysis", "mapping"],
  "SENS 345": ["green architecture", "sustainable design", "building", "ecology"],
  "SENS 370": ["environmental policy", "public policy", "regulation", "governance"],
  "ANR 310": ["nutrition", "food science", "dietetics", "health"],
  "ANR 312": ["livestock", "animal production", "agriculture", "farm management"],
  "ANR 325": ["animal science", "reproduction", "breeding", "genetics"],
  "ANR 330": ["crop production", "agronomy", "farming", "field crops"],
  "ANR 342": ["soil science", "conservation", "erosion", "water quality"],
  "ANR 350": ["horticulture", "plants", "garden", "landscape"],
  "ANR 360": ["forestry", "wildlife", "conservation", "natural resources"],
  "ANR 375": ["farm management", "agricultural economics", "business", "resource management"],
  // PSC / PSJ
  "PSC 220": ["comparative politics", "foreign governments", "international"],
  "PSC 250": ["international relations", "global politics", "diplomacy", "foreign policy"],
  "PSC 314": ["constitutional law", "legal", "civil liberties", "supreme court"],
  "PSC 319": ["civic engagement", "participation", "voting", "democracy"],
  "PSC 322": ["american politics", "congress", "presidency", "legislative"],
  "PSC 355": ["foreign policy", "diplomacy", "international security", "defense"],
  "PSC 360": ["political economy", "economics", "trade", "globalization"],
  "PSJ 201": ["restorative justice", "criminal justice", "mediation", "rehabilitation"],
  "PSJ 305": ["peacebuilding", "conflict resolution", "diplomacy", "mediation"],
  // PHI
  "PHI 104": ["ethics", "law", "morality", "justice", "philosophy"],
  "PHI 214": ["ethics", "moral philosophy", "applied ethics", "normative"],
  "PHI 218": ["logic", "formal logic", "reasoning", "proof"],
  "PHI 225": ["medical ethics", "bioethics", "healthcare", "clinical ethics"],
  "PHI 244": ["political philosophy", "justice", "democracy", "liberty"],
  // THR / ART
  "THR 135": ["film", "film production", "video", "cinematography", "camera"],
  "THR 286": ["screenwriting", "script", "film", "narrative", "writing"],
  "THR 300": ["acting", "performance", "theatre", "stage"],
  "THR 308": ["theatre history", "drama", "performance history", "criticism"],
  "THR 317": ["advanced acting", "character", "performance technique"],
  "THR 321": ["theatre management", "arts administration", "production management"],
  "THR 331": ["documentary film", "documentary", "nonfiction film", "journalism"],
  "THR 332": ["feature film", "narrative film", "screenwriting", "directing"],
  "ART 311": ["printmaking", "visual art", "studio art", "graphic"],
  "ART 316": ["drawing", "painting", "visual art", "fine arts"],
  "ART 325": ["fibers", "textile", "design", "craft"],
  "ART 330": ["sculpture", "3d", "installation", "intermedia"],
  "ARH 340": ["art history", "curatorial", "museum", "art criticism"],
  "ARH 450": ["art history research", "museum studies", "curatorial", "advanced research"],
  // NUR / HLT / HHP
  "NUR 301": ["maternity", "women's health", "obstetrics", "maternal"],
  "NUR 350": ["adult health", "medical surgical", "clinical", "nursing"],
  "NUR 351": ["mental health", "psychiatric nursing", "psychology", "behavioral"],
  "NUR 355": ["pediatrics", "child health", "pediatric nursing"],
  "NUR 400": ["advanced nursing", "complex care", "critical care", "clinical"],
  "NUR 448": ["community health", "public health", "population health"],
  "NUR 449": ["nursing leadership", "management", "administration"],
  "HHP 280": ["exercise science", "kinesiology", "biomechanics", "fitness"],
  "HHP 282": ["sport management", "athletics", "administration", "recreation"],
  "HHP 340": ["motor learning", "coaching", "skill acquisition", "athletic"],
  "HHP 345": ["exercise physiology", "fitness", "performance", "health"],
  "HHP 354": ["sport psychology", "mental performance", "coaching", "athlete"],
  // EDS
  "EDS 201": ["educational foundations", "teaching", "school", "curriculum"],
  "EDS 325": ["curriculum", "instruction", "lesson planning", "pedagogy"],
  "EDS 330": ["educational psychology", "learning", "development", "classroom"],
  "EDS 340": ["educational technology", "digital learning", "instructional design"],
  "EDS 420": ["student teaching", "classroom management", "instruction"],
  // REL
  "REL 211": ["gender", "religion", "spirituality", "women", "feminism"],
  "REL 235": ["ethics", "christian ethics", "moral theology", "applied"],
  "REL 480": ["religious studies", "comparative religion", "theory", "theology"],
  // WGS / AFR
  "WGS 310": ["communication", "gender communication", "media", "representation"],
  "AFR 306": ["black studies", "resistance", "activism", "social justice"],
  "AFR 309": ["civil rights", "history", "activism", "social movement"],
  "AFR 450": ["africana studies", "diaspora", "advanced seminar", "research"],
  // AST
  "AST 401": ["asian studies", "interdisciplinary", "area studies", "research"],
};

// Career-goal keyword expansions (maps goal → relevant technical words)
const CAREER_KEYWORDS: Record<string, string[]> = {
  // STEM & Technology
  "Software Engineer": ["software", "programming", "systems", "open source", "engineering", "code", "development"],
  "Full-Stack Developer": ["web", "frontend", "backend", "javascript", "database", "api", "programming"],
  "Front-End Developer": ["ux", "interface", "design", "javascript", "visual", "user experience", "web"],
  "Back-End Developer": ["server", "database", "sql", "api", "backend", "systems", "infrastructure"],
  "Mobile Developer": ["mobile", "app", "android", "ios", "interface", "user experience"],
  "Data Scientist": ["data", "algorithm", "analysis", "mining", "numerical", "statistics", "machine learning", "modeling"],
  "Data Analyst": ["data", "analysis", "statistics", "visualization", "excel", "sql", "reporting"],
  "Machine Learning Engineer": ["machine learning", "neural", "deep learning", "ai", "algorithm", "model", "training"],
  "AI Engineer": ["ai", "artificial intelligence", "neural", "machine learning", "algorithm", "deep learning", "nlp"],
  "Cybersecurity Analyst": ["security", "network", "cryptography", "systems", "vulnerability", "defense", "forensics"],
  "Cloud Engineer": ["cloud", "infrastructure", "distributed", "virtualization", "networking", "devops"],
  "DevOps Engineer": ["devops", "automation", "infrastructure", "deployment", "ci/cd", "agile", "open source"],
  "UX Designer": ["design", "user experience", "interface", "usability", "prototype", "hci", "research"],
  "Product Manager": ["product", "strategy", "roadmap", "agile", "stakeholder", "management", "user"],
  "Systems Analyst": ["systems", "analysis", "design", "process", "requirements", "architecture"],
  "Mechanical Engineer": ["mechanical", "mechanics", "thermal", "dynamics", "materials", "numerical", "classical", "manufacturing", "engineering"],
  "Electrical Engineer": ["electrical", "circuits", "electronics", "signals", "electromagnetism", "engineering"],
  "Civil Engineer": ["civil", "structural", "infrastructure", "construction", "environmental", "materials"],
  "Chemical Engineer": ["chemical", "process", "reaction", "thermodynamics", "materials", "industrial"],
  "Biomedical Engineer": ["biomedical", "medical device", "biomechanics", "tissue", "clinical", "biology", "engineering"],
  "Environmental Engineer": ["environment", "ecology", "sustainability", "environmental", "pollution", "remediation"],
  "Industrial Designer": ["design", "manufacturing", "materials", "production", "prototype", "ergonomics", "industrial"],
  Physicist: ["physics", "quantum", "mechanics", "electromagnetism", "optics", "classical", "modern"],
  Mathematician: ["mathematics", "proof", "analysis", "algebra", "theory", "discrete", "calculus"],
  Statistician: ["statistics", "probability", "data", "inference", "modeling", "quantitative", "analysis"],
  "Actuary": ["actuarial", "risk", "probability", "statistics", "finance", "insurance", "modeling"],
  // Life Sciences & Health
  Biologist: ["biology", "life science", "organism", "ecology", "genetics", "cellular", "molecular"],
  Ecologist: ["ecology", "ecosystem", "biodiversity", "conservation", "environment", "habitat", "field"],
  "Wildlife Biologist": ["wildlife", "animal", "field biology", "conservation", "ecology", "habitat"],
  "Marine Biologist": ["marine", "ocean", "aquatic", "coral reef", "fish", "water", "oceanography"],
  Geneticist: ["genetics", "dna", "gene", "genome", "molecular", "inheritance", "biotechnology"],
  Neuroscientist: ["neuroscience", "brain", "neurobiology", "cognitive", "behavior", "neural", "psychology"],
  Chemist: ["chemistry", "synthesis", "reaction", "molecular", "analytical", "spectroscopy", "compound"],
  Pharmacist: ["pharmacology", "drug", "medication", "clinical", "pharmaceutical", "dosage"],
  "Research Scientist": ["research", "laboratory", "analysis", "experiment", "data", "methodology", "publication"],
  "Lab Technician": ["laboratory", "experiment", "technique", "analysis", "instrument", "procedure"],
  "Registered Nurse": ["nursing", "clinical", "patient care", "healthcare", "assessment", "medication"],
  "Nurse Practitioner": ["advanced nursing", "clinical", "diagnosis", "patient care", "healthcare", "treatment"],
  "Public Health Worker": ["public health", "community health", "epidemiology", "prevention", "health promotion"],
  "Physical Therapist": ["physical therapy", "rehabilitation", "exercise", "musculoskeletal", "movement", "recovery"],
  "Occupational Therapist": ["occupational therapy", "rehabilitation", "daily activities", "disability", "adaptive"],
  "Health Administrator": ["health administration", "healthcare management", "policy", "operations", "finance"],
  Dietitian: ["nutrition", "diet", "food science", "clinical nutrition", "metabolism", "health"],
  Psychologist: ["psychology", "behavior", "mental health", "assessment", "therapy", "cognitive", "research"],
  Counselor: ["counseling", "therapy", "mental health", "guidance", "listening", "support", "clinical"],
  Psychotherapist: ["therapy", "psychotherapy", "mental health", "clinical", "counseling", "cognitive behavioral"],
  "Child Psychologist": ["child psychology", "developmental", "play therapy", "pediatric", "child development"],
  Gerontologist: ["aging", "elderly", "gerontology", "older adult", "lifespan", "geriatric"],
  // Social Sciences
  Economist: ["economics", "market", "policy", "quantitative", "analysis", "financial", "macro", "micro"],
  "Financial Analyst": ["finance", "investment", "portfolio", "valuation", "quantitative", "market"],
  "Investment Banker": ["investment banking", "mergers", "acquisitions", "corporate finance", "capital"],
  "Business Analyst": ["business", "process", "analysis", "data", "strategy", "consulting", "requirements"],
  Accountant: ["accounting", "financial", "audit", "tax", "reporting", "balance sheet", "bookkeeping"],
  "Marketing Manager": ["marketing", "brand", "advertising", "consumer", "strategy", "digital", "campaign"],
  "Human Resources Manager": ["human resources", "hr", "recruitment", "training", "organizational", "employee"],
  "Supply Chain Manager": ["supply chain", "logistics", "operations", "inventory", "procurement", "distribution"],
  "Policy Analyst": ["policy", "analysis", "research", "government", "legislative", "regulation", "public"],
  Politician: ["politics", "government", "legislation", "civic", "public service", "constituent"],
  Diplomat: ["diplomacy", "international", "foreign policy", "negotiation", "relations", "global"],
  // Law, Advocacy, Justice
  Lawyer: ["law", "legal", "litigation", "contract", "advocacy", "justice", "legislation"],
  "Law School": ["law", "legal reasoning", "argumentation", "justice", "constitutional", "ethics"],
  "Social Worker": ["social work", "community", "advocacy", "welfare", "case management", "services"],
  Therapist: ["therapy", "mental health", "counseling", "clinical", "behavioral", "support"],
  "Community Organizer": ["organizing", "advocacy", "community", "grassroots", "activism", "coalition"],
  "Nonprofit Manager": ["nonprofit", "administration", "fundraising", "community", "program management"],
  // Education
  Teacher: ["teaching", "education", "curriculum", "instruction", "classroom", "learning", "pedagogy"],
  "College Professor": ["academic", "research", "teaching", "scholarship", "analysis", "writing", "seminar"],
  "School Counselor": ["counseling", "guidance", "student support", "mental health", "school"],
  "Instructional Designer": ["instructional design", "curriculum", "elearning", "training", "technology", "pedagogy"],
  // Humanities & Arts
  Historian: ["history", "historical", "archive", "research", "primary source", "context", "analysis"],
  Archaeologist: ["archaeology", "excavation", "artifact", "culture", "fieldwork", "material culture"],
  Journalist: ["journalism", "reporting", "news writing", "media", "investigative", "storytelling"],
  "Technical Writer": ["technical writing", "documentation", "manual", "clarity", "procedure", "communication"],
  Author: ["writing", "creative writing", "narrative", "fiction", "storytelling", "prose"],
  Editor: ["editing", "writing", "publication", "grammar", "revision", "publishing"],
  Librarian: ["library", "information science", "research", "cataloging", "archive", "literacy"],
  "Museum Curator": ["museum", "curation", "art history", "collection", "exhibition", "preservation"],
  Linguist: ["linguistics", "language", "syntax", "phonology", "grammar", "semantics", "discourse"],
  Translator: ["translation", "bilingual", "language", "interpretation", "localization", "foreign language"],
  Philosopher: ["philosophy", "ethics", "logic", "critical thinking", "theory", "argument", "reasoning"],
  Theologian: ["theology", "religion", "faith", "sacred text", "doctrine", "spirituality"],
  "Religious Leader": ["religion", "ministry", "spirituality", "community", "service", "theology"],
  // Creative Arts
  Filmmaker: ["film", "cinema", "production", "directing", "cinematography", "editing", "screenplay"],
  Actor: ["acting", "performance", "theatre", "character", "stage", "drama", "audition"],
  Musician: ["music", "performance", "composition", "theory", "instrument", "ensemble", "audio"],
  Artist: ["art", "visual art", "studio", "creative", "design", "medium", "exhibition"],
  Photographer: ["photography", "visual", "camera", "composition", "lighting", "digital imaging"],
  Animator: ["animation", "motion graphics", "digital art", "visual effects", "3d", "rendering"],
  "Graphic Designer": ["graphic design", "visual communication", "typography", "layout", "branding", "digital"],
  Architect: ["architecture", "design", "structure", "space", "building", "sustainability", "drawing"],
  // Environment & Agriculture
  "Urban Planner": ["urban planning", "land use", "zoning", "community", "design", "development", "policy"],
  "Park Ranger": ["natural resources", "conservation", "wildlife", "recreation", "ecology", "outdoor"],
  "Conservation Biologist": ["conservation", "biodiversity", "ecology", "wildlife", "habitat", "restoration"],
  "Agricultural Scientist": ["agriculture", "crop", "soil", "farming", "agronomy", "food production"],
  "Food Policy Advocate": ["food policy", "nutrition", "agriculture", "food security", "advocacy", "public health"],
  // International & Development
  "International Development": ["development", "international", "poverty", "global", "humanitarian", "policy"],
  "Sports Coach": ["coaching", "athletic", "sport", "training", "performance", "team"],
  "Athletic Trainer": ["athletic training", "injury prevention", "rehabilitation", "sport", "exercise"],
  // Graduate/Professional School
  "Medical School": ["biology", "chemistry", "physiology", "clinical", "anatomy", "organic", "biochemistry"],
  "Graduate School": ["research", "analysis", "theory", "methodology", "scholarship", "publication", "advanced"],
  "Dental School": ["biology", "chemistry", "anatomy", "physiology", "clinical", "oral health"],
  "Veterinary School": ["animal", "biology", "physiology", "anatomy", "clinical", "medicine", "laboratory"],
  Research: ["research", "analysis", "laboratory", "numerical", "computational", "experimental", "simulation", "methodology"],
};

// General career fit scorer — works for any course
function scoreCourseFit(code: string, profile: StudentProfile, planType: "A" | "B" | "C" = "A"): number {
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

  // Course name word overlap — whole-word only to prevent e.g. "development"
  // matching "developmental" or "code" matching "encoder".
  for (const word of targetWords) {
    if (word.length > 3 && new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(nameLower)) score += 2;
  }

  // Hint keyword overlap — the hint phrase must be contained inside a target
  // keyword (not the reverse) so that e.g. "family systems" never matches the
  // single-word keyword "systems".
  for (const hint of COURSE_CAREER_HINTS[code] ?? []) {
    if (targetWords.some(w => w.includes(hint))) score += 2;
  }

  if (planType === "B") {
    const hash = code.split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
    score += (hash % 5) - 2;
  } else if (planType === "C") {
    const hash = code.split("").reduce((a: number, b: string) => a * 31 + b.charCodeAt(0), 1);
    score += (hash % 5) - 2;
  }

  return score;
}

// How many direct prerequisites of `code` are not yet satisfied (i.e. not in usedCodes).
// Used to penalise course picks that drag in long prerequisite chains.
function unmetPrereqCount(code: string, usedCodes: Set<string>): number {
  const groups = PREREQUISITES[code] ?? [];
  let unmet = 0;
  for (const orGroup of groups) {
    if (!orGroup.some(p => usedCodes.has(p))) unmet++;
  }
  return unmet;
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
function scoreUpperLevelCourse(code: string, profile: StudentProfile, planType: "A" | "B" | "C" = "A"): number {
  return scoreCourseFit(code, profile, planType);
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

// Prerequisite check using the string[][] format:
//   outer = AND  → every group must be satisfied
//   inner = OR   → any one course in the group, placed before semIdx, satisfies it
function prereqsMet(code: string, semIdx: number, placedMap: Map<string, number>): boolean {
  const prereqs = PREREQUISITES[code] ?? []; // string[][]
  if (prereqs.length === 0) return true;
  const placed = (p: string) => {
    const s = placedMap.get(p);
    return s !== undefined && s < semIdx;
  };
  return prereqs.every(orGroup => orGroup.some(placed));
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

// Count non-placeholder 100-level courses already in a semester's course list.
function count100Level(courses: PlannedCourse[]): number {
  return courses.filter(c => {
    if (c.isPlaceholder) return false;
    const n = parseInt(c.code.match(/\d+/)?.[0] ?? "0");
    return n >= 100 && n < 200;
  }).length;
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

const DEPT_DISPLAY_NAMES: Record<string, string> = {
  CSC: "Computer Science", MAT: "Mathematics", PHY: "Physics",
  BIO: "Biology", CHM: "Chemistry", PSY: "Psychology", ENG: "English",
  HIS: "History", ECO: "Economics", PSC: "Political Science",
  SOC: "Sociology", ART: "Art", MUS: "Music", THR: "Theatre",
  COM: "Communication", EDS: "Education", REL: "Religion", PHI: "Philosophy",
  BUS: "Business", ANR: "Agriculture", SENS: "Environmental Studies",
  NUR: "Nursing", HLT: "Health", HHP: "Health & Human Performance",
  AFR: "African American Studies", WGS: "Women & Gender Studies",
  PSJ: "Peace & Social Justice", GEO: "Geology", ETAD: "Technology",
  CFS: "Child & Family Studies",
};

// Pick a real catalog course that aligns with the student's career/interests.
// Only returns a course if it has positive career-fit score.
// Prefers level-appropriate courses (lower-level in years 1-2, upper in years 3-4).
function findInterestElective(
  semIdx: number,
  placed: Set<string>,
  profile: StudentProfile,
  preferred: string[],
  placedMap: Map<string, number>,
  takenInSem: PlannedCourse[] = [],
  planType: "A" | "B" | "C" = "A"
): PlannedCourse | null {
  const preferredSet = new Set(preferred);

  const deptTaken: Record<string, number> = {};
  for (const c of takenInSem) {
    if (c.isPlaceholder) continue;
    const d = c.code.split(" ")[0];
    deptTaken[d] = (deptTaken[d] ?? 0) + c.credits;
  }

  const scoredCandidates: Array<{ code: string; score: number }> = [];
  const sem100Count = semIdx >= 2 ? count100Level(takenInSem) : 0;

  for (const code of Object.keys(COURSE_CATALOG)) {
    if (placed.has(code)) continue;
    if (isSuperseded(code, placed)) continue;
    if (!isCourseAvailable(code, semIdx)) continue;
    if (isInternshipCode(code)) continue;
    const levelNum = parseInt(code.match(/\d+/)?.[0] ?? "0");
    if (levelNum < 100) continue; // skip developmental courses

    // No 100-level electives from the chosen major or minor
    const dept = code.split(" ")[0];
    const isMajorOrMinorDept = profile.majors.some(m => m.split("_")[0] === dept) || (profile.minors ?? []).some(m => m.split("_")[0] === dept);
    if (levelNum < 200 && isMajorOrMinorDept) continue;
    // No 300+ level courses in semester 0 (Y1 Fall)
    if (semIdx === 0 && levelNum >= 300) continue;
    // Y3 Fall through Y4 Fall: no intro-level electives; Y4 Spring is unconstrained
    if (semIdx >= 4 && semIdx < 7 && levelNum < 200) continue;
    // From sophomore year: no more than 2 intro-level courses per term
    if (semIdx >= 2 && levelNum >= 100 && levelNum < 200 && sem100Count >= 2) continue;
    if ((COURSE_CATALOG[code].credits ?? 1) < 1) continue; // skip fractional-credit
    if (/\d[A-Z]$/.test(code)) continue; // skip letter-suffixed Topics
    // Capstone courses belong exclusively to their home major
    if (isOtherMajorCapstone(code, profile.majors)) continue;
    // At most 2.5 credits from any one department per semester
    const credits = COURSE_CATALOG[code].credits ?? 1;
    if ((deptTaken[dept] ?? 0) + credits > 2.5) continue;

    if (!prereqsMet(code, semIdx, placedMap)) continue;

    // Electives must come exclusively from career/interest-aligned departments.
    if (!preferredSet.has(dept)) continue;
    const score = scoreCourseFit(code, profile, "A");
    if (score > 0) scoredCandidates.push({ code, score });
  }

  scoredCandidates.sort((a, b) => b.score - a.score);
  // Each plan picks a different rank so electives vary across plans.
  const electiveOffset = planTypeOffset(planType);
  const bestCode = scoredCandidates.length > 0
    ? scoredCandidates[Math.min(electiveOffset, scoredCandidates.length - 1)].code
    : null;

  if (!bestCode) return null;
  const cat = COURSE_CATALOG[bestCode];
  const dept = bestCode.split(" ")[0];
  return {
    code: bestCode,
    name: cat.name,
    credits: cat.credits,
    fulfills: [`Elective – ${DEPT_DISPLAY_NAMES[dept] ?? dept}`],
    category: "Elective",
  };
}

// Returns a descriptive placeholder label based on the student's profile.
function electivePlaceholderLabel(_profile: StudentProfile, preferred: string[]): string {
  for (const dept of preferred) {
    if (DEPT_DISPLAY_NAMES[dept]) return DEPT_DISPLAY_NAMES[dept];
  }
  return "Liberal Arts";
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
  preferred: string[],
  placedMap: Map<string, number>,
  userMajors: string[] = [],
  takenInSem: PlannedCourse[] = [],
  profile?: StudentProfile
): PlannedCourse | null {
  if (!hasUnfulfilledGEM(tracker)) return null;

  // Pre-compute credits already used per department this semester
  const deptTaken: Record<string, number> = {};
  for (const c of takenInSem) {
    if (c.isPlaceholder) continue;
    const d = c.code.split(" ")[0];
    deptTaken[d] = (deptTaken[d] ?? 0) + c.credits;
  }

  let bestCode: string | null = null;
  let bestScore = 0;
  let bestIsPreferred = false;

  const preferredSet = new Set(preferred);
  const sem100Count = semIdx >= 2 ? count100Level(takenInSem) : 0;

  for (const code of Object.keys(COURSE_CATALOG)) {
    if (placed.has(code)) continue;
    if (isSuperseded(code, placed)) continue;
    if (!isCourseAvailable(code, semIdx)) continue;
    if (isInternshipCode(code)) continue;
    if ((COURSE_CATALOG[code].credits ?? 1) < 1) continue;
    if (/\d[A-Z]$/.test(code)) continue; // skip letter-suffixed Topics courses

    const dept = code.split(" ")[0];
    // Skip EDS (Education Studies) courses unless the student has an education-related interest
    if (dept === "EDS" && profile && !hasEducationInterest(profile)) continue;
    const levelNum = parseInt(code.match(/\d+/)?.[0] ?? "0");
    // From sophomore year: no more than 2 intro-level courses per term
    if (semIdx >= 2 && levelNum >= 100 && levelNum < 200 && sem100Count >= 2) continue;
    if (profile && levelNum < 200 && levelNum >= 100) {
      const isMajorOrMinorDept = profile.majors.some(m => m.split("_")[0] === dept) || (profile.minors ?? []).some(m => m.split("_")[0] === dept);
      if (isMajorOrMinorDept) continue; // No 100-level electives from the chosen major or minor
    }
    // No 300+ level courses in semester 0 (Y1 Fall)
    if (semIdx === 0 && parseInt(code.match(/\d+/)?.[0] ?? "0") >= 300) continue;
    // Capstone courses belong exclusively to their home major
    if (isOtherMajorCapstone(code, userMajors)) continue;
    // At most 2.5 credits from any one department per semester
    const credits = COURSE_CATALOG[code].credits ?? 1;
    if ((deptTaken[dept] ?? 0) + credits > 2.5) continue;
    if (!prereqsMet(code, semIdx, placedMap)) continue;
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

function collectMajorCourses(profile: StudentProfile, collected: Set<string>, crossReqBonus: Record<string, number> = {}, planType: "A" | "B" | "C" = "A"): CourseToPlace[] {
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
      // Required courses can be placed any semester — prerequisite chains sometimes
      // push them into year 3-4 even for non-upper-level requirements.
      const maxSem = 7;

      // mustInclude courses — always "Major" since they are explicitly required
      for (const code of (req.mustInclude ?? []).filter(c => !isInternshipCode(c))) {
        if (collected.has(code)) continue;
        const data = COURSE_CATALOG[code];
        if (!data) continue;
        const level = parseInt(code.match(/\d+/)?.[0] ?? "100");
        result.push({
          course: {
            code: data.code,
            name: data.name,
            credits: data.credits,
            fulfills: [`${major.name}: ${req.category}`],
            category: "Major",
          },
          minSem: isCapstone ? 6 : isCollateral ? 0 : level >= 300 ? 3 : 0,
          maxSem,
        });
        collected.add(code);
      }

      // selectFromCategories: one course per sub-category, ranked by career/interest fit.
      // After satisfying the per-sub-category minimums, also fill any remaining slots
      // needed to reach coursesRequired (e.g. 4 total but only 3 sub-categories).
      if (req.selectFromCategories) {
        const subPicked = new Set<string>();

        for (const sub of req.selectFromCategories) {
          const candidates = sub.courses
            .filter(c => !collected.has(c) && COURSE_CATALOG[c] && !isInternshipCode(c) && !isOtherMajorCapstone(c, profile.majors))
            .sort((a, b) => {
              // Interest fit minus prereq-chain penalty: prefer courses the student cares
              // about AND whose prerequisites are already satisfied or planned.
              const netA = scoreUpperLevelCourse(a, profile, planType) - unmetPrereqCount(a, collected) * 3;
              const netB = scoreUpperLevelCourse(b, profile, planType) - unmetPrereqCount(b, collected) * 3;
              return netB - netA;
            });

          const subOffset = planTypeOffset(planType);
          const code = candidates.length > 0 ? candidates[Math.min(subOffset, candidates.length - 1)] : undefined;
          if (code) {
            const data = COURSE_CATALOG[code];
            result.push({
              course: {
                code: data.code,
                name: data.name,
                credits: data.credits,
                fulfills: [`${major.name}: ${req.category} (${sub.category})`],
                category: "Major",
                scheduleDisclaimer: true,
              },
              minSem: 3,
              maxSem: 7,
            });
            collected.add(code);
            subPicked.add(code);
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

        // Fill any remaining slots beyond the per-sub-category picks
        const extraNeeded = Math.max(0, req.coursesRequired - req.selectFromCategories.length);
        if (extraNeeded > 0) {
          const extraCandidates = req.courses
            .filter(c => !collected.has(c) && !subPicked.has(c) && COURSE_CATALOG[c] && !isInternshipCode(c))
            .sort((a, b) => scoreUpperLevelCourse(b, profile, planType) - scoreUpperLevelCourse(a, profile, planType));
          for (let i = 0; i < Math.min(extraNeeded, extraCandidates.length); i++) {
            const code = extraCandidates[i];
            const data = COURSE_CATALOG[code];
            result.push({
              course: { code: data.code, name: data.name, credits: data.credits, fulfills: [`${major.name}: ${req.category}`], category: "Major", scheduleDisclaimer: true },
              minSem: 3,
              maxSem: 7,
            });
            collected.add(code);
          }
        }

        continue;
      }

      // Generic fill — only count courses explicitly added by this requirement's own
      // mustInclude list toward the "already satisfied" total. Courses that happen to
      // appear in both this list and another requirement's list (e.g. ETAD 460 in both
      // Exploratory Distribution and Collateral Electronics) must NOT silently satisfy
      // this requirement; they should be placed explicitly with the correct label.
      const already = (req.mustInclude ?? []).filter(c => collected.has(c)).length;
      const needed = Math.max(0, req.coursesRequired - already);
      let count = 0;

      // Sort candidates:
      //   1st key — prefer courses that need NO new prerequisites (prereqs already
      //             collected or course has none). Choosing a course with an uncollected
      //             prereq chain forces additional courses into the plan and risks
      //             creating unfulfillable cascades (e.g. MAT 312 → MAT 135 → Calc I).
      //   2nd key — career/interest fit + cross-requirement bonus.
      function needsNewPrereqs(code: string): boolean {
        const groups = flattenPrereq(COURSE_CATALOG[code]?.prerequisites);
        if (groups.length === 0) return false;
        return groups.some(orGroup => !orGroup.some(p => collected.has(p)));
      }
      const candidates = req.courses
        .filter(c => !collected.has(c) && !req.mustInclude?.includes(c) && COURSE_CATALOG[c] && !isInternshipCode(c) && (isCapstone || !isOtherMajorCapstone(c, profile.majors)))
        .sort((a, b) => {
          const aN = needsNewPrereqs(a) ? 1 : 0;
          const bN = needsNewPrereqs(b) ? 1 : 0;
          if (aN !== bN) return aN - bN; // courses needing no new prereqs come first
          const sa = scoreCourseFit(a, profile, "A") + (crossReqBonus[a] ?? 0) * 2;
          const sb = scoreCourseFit(b, profile, "A") + (crossReqBonus[b] ?? 0) * 2;
          return sb - sa; // tiebreak by career fit
        });

      // Each plan picks a different slice of the sorted candidate list.
      // Plan A takes from rank 0, B from rank 1, C from rank 2, wrapping
      // back to the front when the list is shorter than the offset.
      const majorOffset = planTypeOffset(planType);
      const orderedCandidates = [...candidates.slice(majorOffset), ...candidates.slice(0, majorOffset)];

      for (const code of orderedCandidates) {
        if (count >= needed) break;
        const data = COURSE_CATALOG[code];
        const level = parseInt(code.match(/\d+/)?.[0] ?? "100");
        result.push({
          course: {
            code: data.code,
            name: data.name,
            credits: data.credits,
            fulfills: [`${major.name}: ${req.category}`],
            category: "Major",
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

function collectMinorCourses(profile: StudentProfile, collected: Set<string>, crossReqBonus: Record<string, number> = {}, planType: "A" | "B" | "C" = "A"): CourseToPlace[] {
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
      const mustPlace = (req.mustInclude ?? []).filter(c => !collected.has(c) && COURSE_CATALOG[c] && !isInternshipCode(c));
      const candidates = req.courses
        .filter(c => !collected.has(c) && !(req.mustInclude ?? []).includes(c) && COURSE_CATALOG[c] && !isInternshipCode(c) && !isOtherMajorCapstone(c, profile.majors))
        .sort((a, b) => {
          const sa = scoreCourseFit(a, profile, "A") + (crossReqBonus[a] ?? 0) * 2;
          const sb = scoreCourseFit(b, profile, "A") + (crossReqBonus[b] ?? 0) * 2;
          return sb - sa;
        });

      // Apply rank offset to optional candidates; mustInclude courses are always placed first.
      const minorOffset = planTypeOffset(planType);
      const orderedCandidates = [...candidates.slice(minorOffset), ...candidates.slice(0, minorOffset)];

      let count = 0;
      for (const code of [...mustPlace, ...orderedCandidates]) {
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

function collectMissingPrereqs(
  courses: CourseToPlace[],
  collected: Set<string>
): CourseToPlace[] {
  const extra: CourseToPlace[] = [];
  const toCheck = courses.map(c => c.course.code).filter(c => COURSE_CATALOG[c]);
  const seen = new Set(collected);

  while (toCheck.length > 0) {
    const code = toCheck.pop()!;
    const prereqGroups = PREREQUISITES[code] ?? []; // string[][]
    if (prereqGroups.length === 0) continue;

    for (const orGroup of prereqGroups) {
      // Each orGroup is one AND requirement with OR alternatives.
      // If any option in this group is already covered, the group is satisfied → skip.
      if (orGroup.some(p => seen.has(p))) continue;

      // Pick the best available option from the OR alternatives.
      const best = orGroup.find(p => !seen.has(p) && COURSE_CATALOG[p] && !isInternshipCode(p));
      if (!best) continue;

      seen.add(best);
      collected.add(best);
      const data = COURSE_CATALOG[best];
      const level = parseInt(best.match(/\d+/)?.[0] ?? "100");
      extra.push({
        course: { code: data.code, name: data.name, credits: data.credits, fulfills: ["Prerequisite"], category: "Major" },
        minSem: 0,
        maxSem: level >= 300 ? 6 : 5,
      });
      toCheck.push(best);
    }
  }
  return extra;
}

export interface CompletedSemesterInput {
  year: number;
  semester: "Fall" | "Spring";
  courses: { code: string; name: string; credits: number }[];
}

export interface PlanValidationError {
  type: "LOW_CREDITS_SEMESTER";
  message: string;
  semesterLabel: string;
  creditsEntered: number;
}

/**
 * Validates that every completed semester has at least 3 credits recorded.
 * Returns an array of errors (empty = valid).
 */
export function validateCompletedSemesters(
  completedSems: CompletedSemesterInput[]
): PlanValidationError[] {
  const errors: PlanValidationError[] = [];
  for (const sem of completedSems) {
    const total = sem.courses.reduce((s, c) => s + (c.credits ?? 0), 0);
    if (total < 3) {
      errors.push({
        type: "LOW_CREDITS_SEMESTER",
        message: `${sem.semester} of Year ${sem.year} only has ${total} credit${total !== 1 ? "s" : ""} entered — please add at least 3 credits per completed semester.`,
        semesterLabel: `${sem.semester} – Year ${sem.year}`,
        creditsEntered: total,
      });
    }
  }
  return errors;
}

// GSTR and L&I are fully interchangeable at Berea College.
// If a student completed one, the other is considered satisfied.
const GSTR_LI_EQUIVALENTS: Record<string, string> = {
  "GSTR 110": "L&I 100",
  "GSTR 210": "L&I 200",
  "GSTR 310": "L&I 300",
  "GSTR 410": "L&I 400",
  "L&I 100": "GSTR 110",
  "L&I 200": "GSTR 210",
  "L&I 300": "GSTR 310",
  "L&I 400": "GSTR 410",
};

function markEquivalents(code: string, usedCodes: Set<string>, placedMap: Map<string, number>) {
  const eq = GSTR_LI_EQUIVALENTS[code];
  if (eq && !usedCodes.has(eq)) {
    usedCodes.add(eq);
    placedMap.set(eq, -1);
  }
}

export function generateAcademicPlan(
  profile: StudentProfile,
  options?: {
    planType?: "A" | "B" | "C";
    completedSemesters?: CompletedSemesterInput[];
    /** Custom courses entered by the student that aren't yet in the catalog. */
    customCourses?: CustomCourseEntry[];
  }
): AcademicPlan {
  // Merge any student-submitted custom courses into a local copy of the catalog
  // so GEM credit, prerequisite unlocking, and scheduling all work correctly.
  const customEntries = options?.customCourses ?? [];
  if (customEntries.length > 0) {
    for (const entry of customEntries) {
      if (COURSE_CATALOG[entry.code]) continue; // don't overwrite real catalog data
      // Build a synthetic Course object from the student's answers
      const prereqCodes = entry.prerequisites
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(s => /^[A-Z&]{2,5}\s*\d{3}[A-Z]?$/.test(s));

      COURSE_CATALOG[entry.code] = {
        code: entry.code,
        name: entry.name || entry.code,
        credits: entry.credits,
        ...(prereqCodes.length > 0 && {
          prerequisites: prereqCodes.length === 1
            ? prereqCodes[0]
            : { type: "AND" as const, courses: prereqCodes },
        }),
        ...(entry.wayOfKnowing && { waysOfKnowing: [entry.wayOfKnowing] }),
        ...(entry.richnesses.length > 0 && { richnesses: entry.richnesses }),
        ...(entry.value && { values: [entry.value] }),
        ...(entry.additional.length > 0 && { additional: entry.additional }),
      };
    }
  }
  const semesters: SemesterPlan[] = [];
  const warnings: string[] = [];
  const unfulfilledRequirements: string[] = [];
  const placedMap = new Map<string, number>();
  const waivedCourses = getWaivedCourses(profile);
  const usedCodes = new Set<string>(waivedCourses);
  const gemTracker = freshGEMTracker();
  const pref = preferredDepts(profile);

  const completedSems = options?.completedSemesters ?? [];
  const completedCount = completedSems.length;

  // Validate completed semester credit totals before proceeding
  if (completedSems.length > 0) {
    const semErrors = validateCompletedSemesters(completedSems);
    if (semErrors.length > 0) {
      throw new Error(semErrors[0].message);
    }
  }

  // Mark all courses from completed semesters as already taken
  for (const sem of completedSems) {
    for (const c of sem.courses) {
      const code = c.code.trim();
      if (code) {
        usedCodes.add(code);
        placedMap.set(code, -1);
        markEquivalents(code, usedCodes, placedMap);
      }
    }
  }

  for (const code of waivedCourses) {
    placedMap.set(code, -1);
    markEquivalents(code, usedCodes, placedMap);
  }

  for (let year = 1; year <= 4; year++) {
    for (const semester of ["Fall", "Spring"] as const) {
      semesters.push({ year, semester, courses: [], totalCredits: 0, isOverloaded: false });
    }
  }

  if (profile.majors.length > 2) {
    warnings.push("With more than 2 majors, completing all requirements in 8 semesters may be difficult.");
  }

  // 2. Collect every required course
  const crossReqBonus = buildCrossReqBonus(profile);
  const planType = options?.planType ?? "A";

  // 1. L&I fixed positions
  // For each L&I course: if already taken (in usedCodes), skip it.
  // If its default semIdx falls in a completed semester, push it to the first future semester.
  const liSeq = [
    { semIdx: 0, code: "L&I 100", name: "Explorations",                     fulfills: "L&I: Explorations" },
    { semIdx: 1, code: "L&I 200", name: "Discoveries",                      fulfills: "L&I: Discoveries" },
    { semIdx: planType === "A" ? 3 : planType === "B" ? 4 : 5, code: "L&I 300", name: "Intersectional Justice in U.S.", fulfills: "L&I: Intersectional Justice" },
    { semIdx: 6, code: "L&I 400", name: "Global Issues",                    fulfills: "L&I: Global Issues" },
  ];
  for (const li of liSeq) {
    if (usedCodes.has(li.code)) {
      // Already taken by student; apply GEM credit but don't place in future semesters
      applyGEM(gemTracker, li.code);
      continue;
    }
    // Push semIdx forward if it falls inside a completed semester
    const targetIdx = li.semIdx < completedCount ? completedCount : li.semIdx;
    placeCourse(semesters, { code: li.code, name: li.name, credits: 1, fulfills: [li.fulfills], category: "GEM" }, targetIdx, placedMap);
    usedCodes.add(li.code);
    applyGEM(gemTracker, li.code);
  }
  const majorCourses  = collectMajorCourses(profile, usedCodes, crossReqBonus, planType);
  const minorCourses  = collectMinorCourses(profile, usedCodes, crossReqBonus, planType);
  const missingPrereqs = collectMissingPrereqs([...majorCourses, ...minorCourses], usedCodes);

  // Each required course is tagged so the scheduler knows its budget category.
  interface Slot {
    item: CourseToPlace;
    category: "Major" | "Minor";
    earliest: number; // earliest semester this course can be placed
    latest:   number; // latest semester before dependents can no longer fit
    placed:   boolean;
  }

  const allSlots: Slot[] = [
    ...[...missingPrereqs, ...majorCourses].map(item => ({ item, category: "Major" as const, earliest: 0, latest: 7, placed: false })),
    ...minorCourses.map(item =>                          ({ item, category: "Minor" as const, earliest: 0, latest: 7, placed: false })),
  ];

  // 3. Compute [earliest, latest] windows via dependency graph
  //
  // For each AND group we pick the one option that appears in allSlots (if any).
  // That becomes the canonical dependency edge for window propagation.
  const requiredCodes = new Set(allSlots.filter(s => !s.item.course.isPlaceholder).map(s => s.item.course.code));

  function requiredDeps(code: string): string[] {
    const prereqGroups = PREREQUISITES[code] ?? []; // string[][]
    const deps: string[] = [];
    for (const orGroup of prereqGroups) {
      // Take the first option in the OR group that is in the required set.
      const dep = orGroup.find(p => requiredCodes.has(p));
      if (dep) deps.push(dep);
    }
    return deps;
  }

  // Earliest: DFS longest-chain from roots (memoised, cycle-safe)
  const earliestCache = new Map<string, number>();
  const inProgressE  = new Set<string>();
  function earliest(code: string): number {
    if (earliestCache.has(code)) return earliestCache.get(code)!;
    if (inProgressE.has(code)) return 0;
    inProgressE.add(code);
    const slot = allSlots.find(s => s.item.course.code === code);
    let e = slot?.item.minSem ?? 0;
    for (const dep of requiredDeps(code)) e = Math.max(e, earliest(dep) + 1);
    e = Math.min(e, 7);
    earliestCache.set(code, e);
    inProgressE.delete(code);
    return e;
  }
  for (const s of allSlots) if (!s.item.course.isPlaceholder) earliest(s.item.course.code);

  // Reverse graph for latest computation
  const dependents = new Map<string, string[]>();
  for (const s of allSlots) {
    if (s.item.course.isPlaceholder) continue;
    for (const dep of requiredDeps(s.item.course.code)) {
      if (!dependents.has(dep)) dependents.set(dep, []);
      dependents.get(dep)!.push(s.item.course.code);
    }
  }

  // Latest: DFS on reverse graph (memoised, cycle-safe)
  const latestCache = new Map<string, number>();
  const inProgressL = new Set<string>();
  function latest(code: string): number {
    if (latestCache.has(code)) return latestCache.get(code)!;
    if (inProgressL.has(code)) return 7;
    inProgressL.add(code);
    const slot = allSlots.find(s => s.item.course.code === code);
    let l = Math.min(slot?.item.maxSem ?? 7, 7);
    for (const dep of dependents.get(code) ?? []) l = Math.min(l, latest(dep) - 1);
    l = Math.max(l, earliestCache.get(code) ?? 0); // window must be non-empty
    latestCache.set(code, l);
    inProgressL.delete(code);
    return l;
  }
  for (const s of allSlots) if (!s.item.course.isPlaceholder) latest(s.item.course.code);

  // Bake windows into each slot
  for (const s of allSlots) {
    if (s.item.course.isPlaceholder) { s.earliest = s.item.minSem; s.latest = 7; }
    else { s.earliest = earliestCache.get(s.item.course.code)!; s.latest = latestCache.get(s.item.course.code)!; }
  }

  const placeholderLabel = electivePlaceholderLabel(profile, pref);

  // 4. Semester-by-semester scheduling
  //
  // At each semester we collect all "ready" required courses:
  //   • window includes this semester  (earliest ≤ sem ≤ latest)
  //   • every required prereq is already placed (prereqsMet)
  //   • the course is offered this semester (schedule check)
  //
  // Among ready courses we pick by urgency = tightest deadline first.
  // Budget: up to 2 Major + 1 Minor per semester.
  // Remaining slots go to GEM then interest-aligned electives.

  for (let sem = 0; sem < 8; sem++) {
    const open = () => 4 - semesters[sem].totalCredits;

    function readyForSem(cat: "Major" | "Minor"): Slot[] {
      return allSlots
        .filter(s =>
          !s.placed &&
          s.category === cat &&
          !s.item.course.isPlaceholder &&
          s.earliest <= sem &&
          sem <= s.latest &&
          prereqsMet(s.item.course.code, sem, placedMap) &&
          (s.item.course.scheduleDisclaimer || isCourseAvailable(s.item.course.code, sem))
        )
        .sort((a, b) => {
          // Primary: tightest deadline first (most urgent)
          const urgency = (a.latest - b.latest) || (a.earliest - b.earliest);
          if (urgency !== 0) return urgency;
          // Secondary: courses satisfying more requirement pools first (helps double majors)
          const crossBonus = (crossReqBonus[b.item.course.code] ?? 0) - (crossReqBonus[a.item.course.code] ?? 0);
          if (crossBonus !== 0) return crossBonus;
          // Tertiary: interest/career alignment — pick the course the student cares about
          const interestA = scoreCourseFit(a.item.course.code, profile, planType);
          const interestB = scoreCourseFit(b.item.course.code, profile, planType);
          if (interestA !== interestB) return interestB - interestA;
          // Plan-type variation for diversity
          if (planType === "B") {
            const hashA = a.item.course.code.charCodeAt(0) % 2;
            const hashB = b.item.course.code.charCodeAt(0) % 2;
            return hashA - hashB;
          }
          if (planType === "C") {
            const hashA = a.item.course.code.split("").reduce((s: number, c: string) => s * 31 + c.charCodeAt(0), 1) % 3;
            const hashB = b.item.course.code.split("").reduce((s: number, c: string) => s * 31 + c.charCodeAt(0), 1) % 3;
            return hashA - hashB;
          }
          return 0;
        });
    }

    // Double majors get 3 major slots/semester so all requirements can fit.
    // Single major stays at 2 to preserve room for GEM and electives.
    const maxMajorSlots = profile.majors.length >= 2 ? 3 : 2;
    let majorPlaced = 0;

    // Track credits per department already in this semester
    // (aggregated before we start placing majors this pass).
    const deptCreditsThisSem: Record<string, number> = {};
    for (const c of semesters[sem].courses) {
      if (c.isPlaceholder) continue;
      const d = c.code.split(" ")[0];
      deptCreditsThisSem[d] = (deptCreditsThisSem[d] ?? 0) + (c.credits ?? 1);
    }

    for (const s of readyForSem("Major")) {
      if (majorPlaced >= maxMajorSlots || open() <= 0) break;
      const lvl = parseInt(s.item.course.code.match(/\d+/)?.[0] ?? "0");
      if (sem >= 2 && lvl >= 100 && lvl < 200 && count100Level(semesters[sem].courses) >= 2) continue;
      // Limit to 2.5 credits from the same department per semester so that e.g.
      // a PSY major doesn't end up with 4 PSY courses in one term.
      const dept = s.item.course.code.split(" ")[0];
      const courseCredits = s.item.course.credits ?? 1;
      if ((deptCreditsThisSem[dept] ?? 0) + courseCredits > 2.5) continue;
      placeCourse(semesters, s.item.course, sem, placedMap);
      applyGEM(gemTracker, s.item.course.code);
      s.placed = true;
      majorPlaced++;
      deptCreditsThisSem[dept] = (deptCreditsThisSem[dept] ?? 0) + courseCredits;
    }

    // Minor (up to 1, from semester 2 onward so year-1 is major-focused)
    if (sem >= 2) {
      for (const s of readyForSem("Minor")) {
        if (open() <= 0) break;
        const lvl = parseInt(s.item.course.code.match(/\d+/)?.[0] ?? "0");
        if (lvl >= 100 && lvl < 200 && count100Level(semesters[sem].courses) >= 2) continue;
        placeCourse(semesters, s.item.course, sem, placedMap);
        applyGEM(gemTracker, s.item.course.code);
        s.placed = true;
        break;
      }
    }

    // Placeholders for required courses (no real code, just reserve the slot)
    for (const s of allSlots.filter(s => !s.placed && s.item.course.isPlaceholder && s.category === "Major" && sem >= s.earliest)) {
      if (open() <= 0) break;
      semesters[sem].courses.push(s.item.course);
      semesters[sem].totalCredits += s.item.course.credits;
      s.placed = true;
    }

    // GEM fills remaining (priority over free electives)
    while (open() > 0 && hasUnfulfilledGEM(gemTracker)) {
      const gem = findGEMCourse(gemTracker, sem, usedCodes, pref, placedMap, profile.majors, semesters[sem].courses, profile);
      if (!gem) break;
      placeCourse(semesters, gem, sem, placedMap);
      usedCodes.add(gem.code);
      applyGEM(gemTracker, gem.code);
    }

    // Remaining slots become open placeholders — electives are added only AFTER
    // all requirements are confirmed placed (see step 6 below).
    while (open() > 0) {
      semesters[sem].courses.push({ code: "Elective", name: `${placeholderLabel} Elective`, credits: 1, fulfills: [`${placeholderLabel} Elective`], category: "Elective", isPlaceholder: true, placeholderCategory: placeholderLabel });
      semesters[sem].totalCredits += 1;
    }
  }

  // 5. Rescue pass — any required course still unplaced either missed its window
  //    (schedule conflict) or had too many competitors for its semester slots.
  //    Displaces a placeholder to make room when needed.
  //
  //    CRITICAL: sort by earliest (= topological depth) so prerequisites are always
  //    rescued before the courses that depend on them.
  const rescueOrder = allSlots
    .filter(s => !s.placed)
    .sort((a, b) => a.earliest - b.earliest || a.latest - b.latest);

  for (const s of rescueOrder) {
    s.item.course.scheduleDisclaimer = true; // bypass isCourseAvailable only
    let placed = false;
    const rescueLvl = parseInt(s.item.course.code.match(/\d+/)?.[0] ?? "0");
    const rescueDept = s.item.course.code.split(" ")[0];
    for (let sem = s.earliest; sem < 8 && !placed; sem++) {
      if (!s.item.course.isPlaceholder && !prereqsMet(s.item.course.code, sem, placedMap)) continue;
      if (sem >= 2 && rescueLvl >= 100 && rescueLvl < 200 && count100Level(semesters[sem].courses) >= 2) continue;
      // Enforce per-department credit limit in the rescue pass too (but allow override in last-resort semester 7).
      const deptCreditsRescue = semesters[sem].courses
        .filter(c => !c.isPlaceholder && c.code.split(" ")[0] === rescueDept)
        .reduce((sum, c) => sum + (c.credits ?? 1), 0);
      const rescueCourseCredits = s.item.course.credits ?? 1;
      if (sem < 7 && deptCreditsRescue + rescueCourseCredits > 2.5) continue;
      if (semesters[sem].totalCredits >= 4) {
        const idx = semesters[sem].courses.findIndex(c => c.isPlaceholder || c.category === "Elective");
        if (idx === -1) continue;
        semesters[sem].totalCredits -= semesters[sem].courses[idx].credits;
        semesters[sem].courses.splice(idx, 1);
      }
      if (semesters[sem].totalCredits >= 4) continue;
      placeCourse(semesters, s.item.course, sem, placedMap);
      applyGEM(gemTracker, s.item.course.code);
      placed = true;
    }
    if (!placed) unfulfilledRequirements.push(`${s.item.course.name} (${s.item.course.fulfills.join(", ")})`);
  }

  // 6. Electives — only filled when ALL requirements are successfully placed.
  //    If any requirement is unfulfilled, every open slot stays as a placeholder
  //    so the student can see exactly how many free slots remain and fill them
  //    manually once the schedule conflict is resolved.
  if (unfulfilledRequirements.length === 0) {
    for (let sem = 0; sem < 8; sem++) {
      for (let i = 0; i < semesters[sem].courses.length; i++) {
        const c = semesters[sem].courses[i];
        if (!c.isPlaceholder || c.category !== "Elective") continue;
        const elective = findInterestElective(sem, usedCodes, profile, pref, placedMap, semesters[sem].courses, planType);
        if (elective) {
          semesters[sem].courses[i] = elective;
          // totalCredits unchanged (both 1 credit); update tracking maps
          placedMap.set(elective.code, sem);
          usedCodes.add(elective.code);
        }
        // If no elective found, the placeholder stays as-is
      }
    }
  }

  // 6. Calculate totals
  const totalCredits = semesters.reduce((s, sem) => s + sem.totalCredits, 0);

  // "Inside major" credits = only courses whose dept prefix matches the major's
  // primary department. Collateral courses from other depts (e.g. MAT/CHM for PHY_ENG)
  // count as outside-major even though they are required by the major.
  // For double majors this is applied per-major and the most restrictive result is used.
  const outsideEach = profile.majors.map(majorCode => {
    const prefix = majorCode.split("_")[0]; // "PHY_ENG" → "PHY", "CSC" → "CSC"
    const insideCredits = semesters.reduce(
      (s, sem) => s + sem.courses
        .filter(c => c.category === "Major" && c.code.startsWith(prefix + " "))
        .reduce((cs, c) => cs + c.credits, 0), 0
    );
    return totalCredits - insideCredits;
  });
  const creditsOutsideMajor = profile.majors.length > 0 ? Math.min(...outsideEach) : totalCredits;

  if (totalCredits < MINIMUM_TOTAL_CREDITS) {
    warnings.push(`Total credits (${totalCredits}) is below the minimum of ${MINIMUM_TOTAL_CREDITS}.`);
  }
  if (creditsOutsideMajor < MINIMUM_CREDITS_OUTSIDE_MAJOR) {
    warnings.push(`Credits outside major (${creditsOutsideMajor}) is below the minimum of ${MINIMUM_CREDITS_OUTSIDE_MAJOR}.`);
  }
  if (unfulfilledRequirements.length > 0) {
    warnings.push(`${unfulfilledRequirements.length} requirement(s) could not fit in 8 semesters.`);
  }

  // Replace generated semesters with the student's actual completed semester data
  for (let i = 0; i < completedCount && i < semesters.length; i++) {
    const src = completedSems[i];
    const courses = src.courses
      .filter(c => c.code.trim() || c.name.trim())
      .map(c => ({
        code: c.code.trim() || "—",
        name: c.name.trim() || "Unknown Course",
        credits: c.credits,
        fulfills: [] as string[],
        category: "Elective" as const,
        isPlaceholder: false,
      }));
    const total = courses.reduce((s, c) => s + c.credits, 0);
    semesters[i] = { year: src.year, semester: src.semester, courses, totalCredits: total, isOverloaded: false, isCompleted: true };
  }

  // Post-replacement rescue: required courses the generator placed inside a completed
  // semester got wiped when we swapped in actual student data. Find them and re-place
  // them in the first available future semester (completedCount onward).
  if (completedCount > 0) {
    const actualCompletedCodes = new Set(
      completedSems.flatMap(s => s.courses.map(c => c.code.trim()).filter(Boolean))
    );
    const wipedSlots = allSlots.filter(s => {
      if (s.placed && s.item.course.isPlaceholder) return false;
      const placedSem = placedMap.get(s.item.course.code);
      if (placedSem === undefined || placedSem < 0 || placedSem >= completedCount) return false;
      return !actualCompletedCodes.has(s.item.course.code);
    });

    for (const s of wipedSlots) {
      placedMap.delete(s.item.course.code);
      s.placed = false;
      let rescued = false;
      s.item.course.scheduleDisclaimer = true;
      for (let sem = completedCount; sem < 8 && !rescued; sem++) {
        if (!prereqsMet(s.item.course.code, sem, placedMap)) continue;
        if (semesters[sem].totalCredits >= 4) {
          const idx = semesters[sem].courses.findIndex(c => c.isPlaceholder || c.category === "Elective");
          if (idx === -1) continue;
          semesters[sem].totalCredits -= semesters[sem].courses[idx].credits;
          semesters[sem].courses.splice(idx, 1);
        }
        if (semesters[sem].totalCredits >= 4) continue;
        placeCourse(semesters, s.item.course, sem, placedMap);
        applyGEM(gemTracker, s.item.course.code);
        s.placed = true;
        rescued = true;
      }
      if (!s.placed) {
        unfulfilledRequirements.push(`${s.item.course.name} (${s.item.course.fulfills.join(", ")})`);
      }
    }
  }

  // Recompute totals with completed semesters included
  const finalTotalCredits = semesters.reduce((s, sem) => s + sem.totalCredits, 0);
  const finalCreditsOutsideMajor = semesters.reduce((s, sem) =>
    s + sem.courses.filter(c => c.category !== "Major").reduce((x, c) => x + c.credits, 0), 0);

  return { student: profile, semesters, totalCredits: finalTotalCredits, creditsOutsideMajor: finalCreditsOutsideMajor, unfulfilledRequirements, warnings };
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
