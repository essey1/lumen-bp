import type { Minor } from "./types";

export const MINORS: Record<string, Minor> = {
  AFR: {
    code: "AFR",
    name: "African and African American Studies",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Required foundational courses",
        coursesRequired: 2,
        courses: ["AFR 103", "AFR 167"],
        mustInclude: ["AFR 103", "AFR 167"],
      },
      {
        category: "Distribution",
        description: "Three additional AFR courses at various levels",
        coursesRequired: 3,
        courses: ["AFR 100", "AFR 132", "AFR 135", "AFR 165", "AFR 166", "AFR 200", "AFR 201", "AFR 202", "AFR 222", "AFR 225", "AFR 230", "AFR 306", "AFR 309", "AFR 350", "AFR 356"],
      },
    ],
  },
  ART: {
    code: "ART",
    name: "Art",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Foundation studio course",
        coursesRequired: 1,
        courses: ["ART 110", "ART 111"],
      },
      {
        category: "Distribution",
        description: "Four additional ART courses",
        coursesRequired: 4,
        courses: ["ART 120", "ART 121", "ART 130", "ART 210", "ART 220", "ART 230", "ART 310", "ART 320", "ART 330", "ART 410"],
      },
    ],
  },
  BIO: {
    code: "BIO",
    name: "Biology",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Core biology sequence",
        coursesRequired: 2,
        courses: ["BIO 110", "BIO 113"],
        mustInclude: ["BIO 110", "BIO 113"],
      },
      {
        category: "Distribution",
        description: "Three additional BIO courses",
        coursesRequired: 3,
        courses: ["BIO 114", "BIO 207", "BIO 220", "BIO 222", "BIO 306", "BIO 323", "BIO 324", "BIO 325", "BIO 327", "BIO 330", "BIO 331", "BIO 332", "BIO 338"],
      },
    ],
  },
  BUS: {
    code: "BUS",
    name: "Business Administration",
    totalMinorCredits: 6,
    requirements: [
      {
        category: "Required Core",
        description: "Core business courses",
        coursesRequired: 3,
        courses: ["BUS 100", "BUS 200", "BUS 210"],
        mustInclude: ["BUS 100", "BUS 200", "BUS 210"],
      },
      {
        category: "Distribution",
        description: "Three additional BUS courses",
        coursesRequired: 3,
        courses: ["BUS 220", "BUS 230", "BUS 300", "BUS 310", "BUS 320", "BUS 400", "BUS 410", "ECO 200", "ECO 201"],
      },
    ],
  },
  CHM: {
    code: "CHM",
    name: "Chemistry",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Sequence",
        description: "General chemistry sequence",
        coursesRequired: 3,
        courses: ["CHM 131", "CHM 221", "CHM 222"],
        mustInclude: ["CHM 131", "CHM 221", "CHM 222"],
      },
      {
        category: "Upper Level",
        description: "Two upper-level chemistry courses",
        coursesRequired: 2,
        courses: ["CHM 340", "CHM 345", "CHM 440"],
      },
    ],
  },
  COM: {
    code: "COM",
    name: "Communication",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to communication",
        coursesRequired: 1,
        courses: ["COM 100", "COM 110"],
      },
      {
        category: "Distribution",
        description: "Four additional COM courses",
        coursesRequired: 4,
        courses: ["COM 200", "COM 210", "COM 220", "COM 230", "COM 300", "COM 310", "COM 320", "COM 330", "COM 400", "COM 410"],
      },
    ],
  },
  CSC: {
    code: "CSC",
    name: "Computer Science",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Core programming sequence",
        coursesRequired: 2,
        courses: ["CSC 226", "CSC 236"],
        mustInclude: ["CSC 226", "CSC 236"],
      },
      {
        category: "Upper Level",
        description: "Three upper-level CSC courses",
        coursesRequired: 3,
        courses: ["CSC 246", "CSC 300", "CSC 301", "CSC 303", "CSC 330", "CSC 335", "CSC 410", "CSC 412", "CSC 420", "CSC 425", "CSC 440", "CSC 445", "CSC 450"],
      },
    ],
  },
  ECO: {
    code: "ECO",
    name: "Economics",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Principles of economics",
        coursesRequired: 2,
        courses: ["ECO 100", "ECO 101"],
        mustInclude: ["ECO 100", "ECO 101"],
      },
      {
        category: "Distribution",
        description: "Three additional ECO courses",
        coursesRequired: 3,
        courses: ["ECO 200", "ECO 201", "ECO 210", "ECO 300", "ECO 310", "ECO 320", "ECO 400", "ECO 410"],
      },
    ],
  },
  EDS: {
    code: "EDS",
    name: "Education Studies",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Foundations of education",
        coursesRequired: 2,
        courses: ["EDS 100", "EDS 200"],
      },
      {
        category: "Distribution",
        description: "Three additional EDS courses",
        coursesRequired: 3,
        courses: ["EDS 210", "EDS 220", "EDS 300", "EDS 310", "EDS 320", "EDS 400", "EDS 410"],
      },
    ],
  },
  ENG: {
    code: "ENG",
    name: "English",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to literary study",
        coursesRequired: 1,
        courses: ["ENG 110", "ENG 120"],
      },
      {
        category: "Distribution",
        description: "Four additional ENG courses across periods/genres",
        coursesRequired: 4,
        courses: ["ENG 200", "ENG 210", "ENG 220", "ENG 230", "ENG 300", "ENG 310", "ENG 320", "ENG 330", "ENG 400", "ENG 410"],
      },
    ],
  },
  ETAD: {
    code: "ETAD",
    name: "Technology and Applied Design",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Foundations of engineering technology",
        coursesRequired: 2,
        courses: ["ETAD 100", "ETAD 110"],
      },
      {
        category: "Distribution",
        description: "Three additional ETAD courses",
        coursesRequired: 3,
        courses: ["ETAD 200", "ETAD 210", "ETAD 220", "ETAD 300", "ETAD 310", "ETAD 320", "ETAD 400"],
      },
    ],
  },
  HHP: {
    code: "HHP",
    name: "Health and Human Performance",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Foundations of health and performance",
        coursesRequired: 2,
        courses: ["HHP 100", "HHP 200"],
      },
      {
        category: "Distribution",
        description: "Three additional HHP courses",
        coursesRequired: 3,
        courses: ["HHP 210", "HHP 220", "HHP 300", "HHP 310", "HHP 320", "HHP 400", "HHP 410"],
      },
    ],
  },
  HIS: {
    code: "HIS",
    name: "History",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Historical methods and survey",
        coursesRequired: 1,
        courses: ["HIS 100", "HIS 110"],
      },
      {
        category: "Distribution",
        description: "Four HIS courses spanning different eras/regions",
        coursesRequired: 4,
        courses: ["HIS 200", "HIS 210", "HIS 220", "HIS 230", "HIS 300", "HIS 310", "HIS 320", "HIS 330", "HIS 400", "HIS 410"],
      },
    ],
  },
  HLT: {
    code: "HLT",
    name: "Health Studies",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to health studies",
        coursesRequired: 2,
        courses: ["HLT 100", "HLT 200"],
      },
      {
        category: "Distribution",
        description: "Three additional HLT courses",
        coursesRequired: 3,
        courses: ["HLT 210", "HLT 220", "HLT 300", "HLT 310", "HLT 400", "NUR 200", "HHP 300"],
      },
    ],
  },
  MAT: {
    code: "MAT",
    name: "Mathematics",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Calculus sequence",
        coursesRequired: 2,
        courses: ["MAT 115", "MAT 135"],
        mustInclude: ["MAT 115", "MAT 135"],
      },
      {
        category: "Upper Level",
        description: "Three upper-level math courses",
        coursesRequired: 3,
        courses: ["MAT 216", "MAT 225", "MAT 312", "MAT 415"],
      },
    ],
  },
  MUS: {
    code: "MUS",
    name: "Music",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Music theory and applied music",
        coursesRequired: 2,
        courses: ["MUS 100", "MUS 110"],
      },
      {
        category: "Distribution",
        description: "Three additional MUS courses",
        coursesRequired: 3,
        courses: ["MUS 200", "MUS 210", "MUS 220", "MUS 300", "MUS 310", "MUS 400", "MUS 410"],
      },
    ],
  },
  PHI: {
    code: "PHI",
    name: "Philosophy",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to philosophy",
        coursesRequired: 1,
        courses: ["PHI 100", "PHI 110"],
      },
      {
        category: "Distribution",
        description: "Four additional PHI courses",
        coursesRequired: 4,
        courses: ["PHI 200", "PHI 210", "PHI 220", "PHI 230", "PHI 300", "PHI 310", "PHI 320", "PHI 400", "PHI 410"],
      },
    ],
  },
  PSC: {
    code: "PSC",
    name: "Political Science",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to political science",
        coursesRequired: 1,
        courses: ["PSC 100", "PSC 110"],
      },
      {
        category: "Distribution",
        description: "Four PSC courses at various levels",
        coursesRequired: 4,
        courses: ["PSC 200", "PSC 210", "PSC 220", "PSC 230", "PSC 300", "PSC 310", "PSC 320", "PSC 400", "PSC 410"],
      },
    ],
  },
  PSJ: {
    code: "PSJ",
    name: "Peace and Social Justice Studies",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Foundations of peace and justice",
        coursesRequired: 2,
        courses: ["PSJ 100", "PSJ 200"],
      },
      {
        category: "Distribution",
        description: "Three courses from PSJ or approved list",
        coursesRequired: 3,
        courses: ["PSJ 210", "PSJ 220", "PSJ 300", "PSJ 310", "PSJ 400", "SOC 200", "AFR 103", "WGS 200"],
      },
    ],
  },
  PSY: {
    code: "PSY",
    name: "Psychology",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Core psychology courses",
        coursesRequired: 2,
        courses: ["PSY 100", "PSY 225"],
        mustInclude: ["PSY 100", "PSY 225"],
      },
      {
        category: "Distribution",
        description: "Three additional PSY courses",
        coursesRequired: 3,
        courses: ["PSY 207", "PSY 208", "PSY 209", "PSY 212", "PSY 214", "PSY 217", "PSY 244", "PSY 257", "PSY 323", "PSY 325"],
      },
    ],
  },
  REL: {
    code: "REL",
    name: "Religion",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to religious studies",
        coursesRequired: 1,
        courses: ["REL 100", "REL 110"],
      },
      {
        category: "Distribution",
        description: "Four REL courses across traditions",
        coursesRequired: 4,
        courses: ["REL 200", "REL 210", "REL 220", "REL 230", "REL 300", "REL 310", "REL 320", "REL 400", "REL 410"],
      },
    ],
  },
  SENS: {
    code: "SENS",
    name: "Environmental Studies",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Foundations of environmental science",
        coursesRequired: 2,
        courses: ["SENS 100", "SENS 200"],
      },
      {
        category: "Distribution",
        description: "Three SENS or approved science courses",
        coursesRequired: 3,
        courses: ["SENS 220", "SENS 226", "SENS 300", "SENS 310", "SENS 320", "SENS 400", "BIO 330", "CHM 340"],
      },
    ],
  },
  SOC: {
    code: "SOC",
    name: "Sociology",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to sociology",
        coursesRequired: 1,
        courses: ["SOC 100", "SOC 110"],
      },
      {
        category: "Distribution",
        description: "Four additional SOC courses",
        coursesRequired: 4,
        courses: ["SOC 200", "SOC 210", "SOC 220", "SOC 230", "SOC 300", "SOC 310", "SOC 320", "SOC 330", "SOC 400", "SOC 410"],
      },
    ],
  },
  SPN: {
    code: "SPN",
    name: "Spanish",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Language Sequence",
        description: "Intermediate Spanish sequence",
        coursesRequired: 2,
        courses: ["SPN 200", "SPN 210"],
        mustInclude: ["SPN 200", "SPN 210"],
      },
      {
        category: "Upper Level",
        description: "Three upper-level Spanish courses",
        coursesRequired: 3,
        courses: ["SPN 300", "SPN 310", "SPN 320", "SPN 330", "SPN 400", "SPN 410"],
      },
    ],
  },
  THR: {
    code: "THR",
    name: "Theatre",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to theatre",
        coursesRequired: 1,
        courses: ["THR 100", "THR 110"],
      },
      {
        category: "Distribution",
        description: "Four additional THR courses",
        coursesRequired: 4,
        courses: ["THR 200", "THR 210", "THR 220", "THR 300", "THR 310", "THR 320", "THR 400", "THR 410"],
      },
    ],
  },
  WGS: {
    code: "WGS",
    name: "Women's, Gender, and Sexuality Studies",
    totalMinorCredits: 5,
    requirements: [
      {
        category: "Required Core",
        description: "Introduction to women's and gender studies",
        coursesRequired: 1,
        courses: ["WGS 100", "WGS 110"],
      },
      {
        category: "Distribution",
        description: "Four WGS or approved courses",
        coursesRequired: 4,
        courses: ["WGS 200", "WGS 210", "WGS 220", "WGS 300", "WGS 310", "WGS 320", "WGS 400", "SOC 230", "AFR 225", "PSY 244"],
      },
    ],
  },
};

export const AVAILABLE_MINORS = Object.values(MINORS).sort((a, b) => a.name.localeCompare(b.name));
