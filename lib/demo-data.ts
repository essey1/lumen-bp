import { generateAcademicPlan } from "./plan-generator";
import type { StudentProfile } from "./types";

export const DEMO_USERNAME = "abcd";
export const DEMO_PASSWORD = "1234";
export const DEMO_EMAIL = "abcd@berea.edu";

const waivedCourseList = ["MAT 010", "MAT 011", "MAT 012", "MAT 115", "MAT 125"] as const;

export const DEMO_USER = {
  id: "demo-recruiter-user",
  name: "Demo Recruiter",
  email: DEMO_EMAIL,
};

export const DEMO_PROFILE = {
  name: "Demo Recruiter",
  email: DEMO_EMAIL,
  major: "Computer and Information Science: Computational Mathematics Concentration",
  minor: "Child and Family Studies",
  year: 1,
  bio: "Freshman demo student for recruiter walkthrough. Developmental math is waived through trig.",
  completedSemesters: "[]",
  mathPlacement: "MAT 125",
  waivedCourses: JSON.stringify([...waivedCourseList]),
} as const;

function buildDemoPlans() {
  const csMathProfile: StudentProfile = {
    majors: ["CSC_MATH"],
    minors: [],
    interests: ["Computer Science", "Mathematics", "Algorithms", "Research", "Problem Solving"],
    hobbies: [],
    careerGoals: ["Software Engineer", "Data Scientist", "Mathematician"],
    mathPlacement: "MAT 125",
    waivedCourses: [...waivedCourseList],
  };

  const psychProfile: StudentProfile = {
    majors: ["PSY"],
    minors: ["CFS"],
    interests: ["Psychology", "Child Development", "Family Studies", "Mental Health", "Research"],
    hobbies: [],
    careerGoals: ["School Psychologist", "Family Counselor", "Child Services Advocate"],
    mathPlacement: "MAT 125",
    waivedCourses: [...waivedCourseList],
  };

  const csPlan = generateAcademicPlan(csMathProfile, { planType: "A" });
  const psychPlan = generateAcademicPlan(psychProfile, { planType: "A" });

  return [
    {
      id: "demo-cs-math-plan",
      name: "Computer Science + Math — Freshman Demo",
      majors: ["CSC_MATH"],
      minors: [],
      interests: csMathProfile.interests,
      careerGoals: csMathProfile.careerGoals,
      mathPlacement: "MAT 125",
      waivedCourses: [...waivedCourseList],
      planType: "A",
      semesters: csPlan.semesters,
      createdAt: new Date("2026-08-15T09:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-08-15T09:00:00.000Z").toISOString(),
    },
    {
      id: "demo-psychology-plan",
      name: "Psychology + Child and Family Studies — Freshman Demo",
      majors: ["PSY"],
      minors: ["CFS"],
      interests: psychProfile.interests,
      careerGoals: psychProfile.careerGoals,
      mathPlacement: "MAT 125",
      waivedCourses: [...waivedCourseList],
      planType: "A",
      semesters: psychPlan.semesters,
      createdAt: new Date("2026-08-15T09:10:00.000Z").toISOString(),
      updatedAt: new Date("2026-08-15T09:10:00.000Z").toISOString(),
    },
  ];
}

let demoPlans = buildDemoPlans();

export function isDemoUserEmail(email?: string | null) {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized === DEMO_USERNAME || normalized === DEMO_EMAIL;
}

export function isDemoCredentials(email?: string | null, password?: string | null) {
  return isDemoUserEmail(email) && (password ?? "") === DEMO_PASSWORD;
}

export function isDemoSession(email?: string | null) {
  return (email ?? "").trim().toLowerCase() === DEMO_EMAIL;
}

export function getDemoProfile() {
  return {
    ...DEMO_PROFILE,
    waivedCourses: JSON.stringify([...waivedCourseList]),
  };
}

export function getDemoPlans() {
  return demoPlans.map(plan => ({
    ...plan,
    majors: [...plan.majors],
    minors: [...plan.minors],
    interests: [...plan.interests],
    careerGoals: [...plan.careerGoals],
    waivedCourses: [...plan.waivedCourses],
    semesters: JSON.parse(JSON.stringify(plan.semesters)),
  }));
}

export function getDemoPlanById(id: string) {
  const found = demoPlans.find(plan => plan.id === id);
  if (!found) return null;
  return {
    ...found,
    majors: [...found.majors],
    minors: [...found.minors],
    interests: [...found.interests],
    careerGoals: [...found.careerGoals],
    waivedCourses: [...found.waivedCourses],
    semesters: JSON.parse(JSON.stringify(found.semesters)),
  };
}

export function setDemoPlanById(id: string, updates: Partial<(typeof demoPlans)[number]>) {
  demoPlans = demoPlans.map(plan => plan.id === id ? { ...plan, ...updates, updatedAt: new Date().toISOString() } : plan);
}

export function deleteDemoPlanById(id: string) {
  demoPlans = demoPlans.filter(plan => plan.id !== id);
}

export function addDemoPlan(plan: (typeof demoPlans)[number]) {
  demoPlans = [plan, ...demoPlans];
}
