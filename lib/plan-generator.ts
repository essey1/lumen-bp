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
};

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
  "MAT 216": ["discrete", "logic", "proof", "computer science", "theory"],
  "MAT 312": ["optimization", "operations research", "industrial", "management", "linear programming"],
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
  placedMap: Map<string, number>
): PlannedCourse | null {
  const preferredSet = new Set(preferred);
  const isUpperYears = semIdx >= 4;

  let bestCode: string | null = null;
  let bestScore = 0;

  for (const code of Object.keys(COURSE_CATALOG)) {
    if (placed.has(code)) continue;
    if (isSuperseded(code, placed)) continue;
    if (!isCourseAvailable(code, semIdx)) continue;
    // Skip "Topics in X" courses — letter-suffixed codes (e.g. CSC 390B) have
    // variable content each semester and must not be auto-selected.
    if (/\d[A-Z]$/.test(code)) continue;

    const prereqs = PREREQUISITES[code] ?? [];
    if (!prereqs.every(p => (placedMap.get(p) ?? Infinity) < semIdx)) continue;

    const dept = code.split(" ")[0];
    const level = parseInt(code.match(/\d+/)?.[0] ?? "100");

    let score = scoreCourseFit(code, profile);
    if (score <= 0) continue;

    if (isUpperYears && level >= 300) score += 1;
    if (!isUpperYears && level < 300) score += 1;
    if (preferredSet.has(dept)) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestCode = code;
    }
  }

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
function electivePlaceholderLabel(profile: StudentProfile, preferred: string[]): string {
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
  placedMap: Map<string, number>
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
    if (/\d[A-Z]$/.test(code)) continue; // skip letter-suffixed Topics courses
    const prereqs = PREREQUISITES[code] ?? [];
if (!prereqs.every(p => (placedMap.get(p) ?? Infinity) < semIdx)) continue;
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

function collectMissingPrereqs(
  courses: CourseToPlace[],
  collected: Set<string>
): CourseToPlace[] {
  const extra: CourseToPlace[] = [];
  const toCheck = courses.map(c => c.course.code).filter(c => COURSE_CATALOG[c]);
  const seen = new Set(collected);

  while (toCheck.length > 0) {
    const code = toCheck.pop()!;
    for (const prereq of PREREQUISITES[code] ?? []) {
      if (seen.has(prereq) || !COURSE_CATALOG[prereq]) continue;
      seen.add(prereq);
      collected.add(prereq);
      const data = COURSE_CATALOG[prereq];
      const level = parseInt(prereq.match(/\d+/)?.[0] ?? "100");
      extra.push({
        course: {
          code: data.code,
          name: data.name,
          credits: data.credits,
          fulfills: ["Prerequisite"],
          category: "Major",
        },
        minSem: 0,
        maxSem: level >= 300 ? 6 : 5,
      });
      toCheck.push(prereq);
    }
  }
  return extra;
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

  // 2. Collect required courses — major and minor kept separate for priority ordering
  const crossReqBonus = buildCrossReqBonus(profile);
  const majorCourses = collectMajorCourses(profile, usedCodes, crossReqBonus);
  const minorCourses = collectMinorCourses(profile, usedCodes, crossReqBonus);

  function sortBySequence(list: CourseToPlace[]): CourseToPlace[] {
    return [...list].sort((a, b) => {
      if (a.minSem !== b.minSem) return a.minSem - b.minSem;
      const aNum = parseInt(a.course.code.match(/\d+/)?.[0] ?? "0");
      const bNum = parseInt(b.course.code.match(/\d+/)?.[0] ?? "0");
      return aNum - bNum;
    });
  }

  function runPlacementPasses(items: CourseToPlace[]): CourseToPlace[] {
    let queue = sortBySequence(items);
    for (let pass = 0; pass < 8; pass++) {
      const retry: CourseToPlace[] = [];
      for (const item of queue) {
        const semIdx = findSemester(semesters, item.course, item.minSem, item.maxSem, placedMap);
        if (semIdx !== -1) {
          placeCourse(semesters, item.course, semIdx, placedMap);
          applyGEM(gemTracker, item.course.code);
        } else {
          retry.push(item);
        }
      }
      queue = retry;
      if (queue.length === 0) break;
    }

    return queue;
  }

  // 3. Place required courses: major and minor combined, sorted by sequence.
  // Major courses come first in the array so they get first pick when two courses
  // compete for the same semester slot during the multi-pass sweep.
  const missingPrereqs = collectMissingPrereqs([...majorCourses, ...minorCourses], usedCodes);
const allRequired = sortBySequence([...majorCourses, ...minorCourses, ...missingPrereqs]);
  const unplacedRequired = runPlacementPasses(allRequired);

  // Rescue pass: force-place still-unplaced required courses schedule-blind
  // before GEM/electives can claim those slots.
  const trulyUnplaced: CourseToPlace[] = [];
  for (const item of unplacedRequired) {
    item.course.scheduleDisclaimer = true; // bypass isCourseAvailable
    const semIdx = findSemester(semesters, item.course, item.minSem, item.maxSem, placedMap);
    if (semIdx !== -1) {
      placeCourse(semesters, item.course, semIdx, placedMap);
      applyGEM(gemTracker, item.course.code);
    } else {
      trulyUnplaced.push(item);
    }
  }
  for (const item of trulyUnplaced) {
    unfulfilledRequirements.push(`${item.course.name} (${item.course.fulfills.join(", ")})`);
  }

// 4. GEM courses fill remaining gaps

  // 4. GEM courses fill remaining gaps (schedule-gated, spread across semesters).
  for (let semIdx = 0; semIdx < 8; semIdx++) {
    while (semesters[semIdx].totalCredits < 4 && hasUnfulfilledGEM(gemTracker)) {
      const gemCourse = findGEMCourse(gemTracker, semIdx, usedCodes, pref, placedMap);
      if (!gemCourse) break;
      placeCourse(semesters, gemCourse, semIdx, placedMap);
      usedCodes.add(gemCourse.code);
      applyGEM(gemTracker, gemCourse.code);
    }
  }

  // 5. Fill every remaining open slot: try a real interest-aligned course first;
  // only fall back to a named placeholder when no matching course is available.
  // This ensures every semester always has exactly 4 courses (= 4 credits at Berea).
  const placeholderLabel = electivePlaceholderLabel(profile, pref);
  for (let semIdx = 0; semIdx < 8; semIdx++) {
    while (semesters[semIdx].totalCredits < 4) {
      const elective = findInterestElective(semIdx, usedCodes, profile, pref, placedMap);
      if (elective) {
        placeCourse(semesters, elective, semIdx, placedMap);
        usedCodes.add(elective.code);
      } else {
        semesters[semIdx].courses.push({
          code: "Elective",
          name: `${placeholderLabel} Elective`,
          credits: 1,
          fulfills: [`${placeholderLabel} Elective`],
          category: "Elective",
          isPlaceholder: true,
          placeholderCategory: placeholderLabel,
        });
        semesters[semIdx].totalCredits += 1;
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
