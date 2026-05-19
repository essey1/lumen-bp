import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { generateAcademicPlan } from "../lib/plan-generator";
import type { StudentProfile } from "../lib/types";

const prisma = new PrismaClient();

async function main() {
  // ── Demo student ──────────────────────────────────────────────────
  const hashedPassword = await hash("demo1234", 12);

  const maya = await prisma.user.upsert({
    where: { email: "maya.johnson@berea.edu" },
    update: {
      name: "Maya Johnson",
      major: "Computer and Information Science: Computer Science Concentration",
      year: 2,
      bio: "Sophomore CS student interested in software engineering and AI. I'm a first-generation college student from Eastern Kentucky, passionate about using technology to solve community problems. Outside of class I play guitar in the Berea Jazz Ensemble and volunteer at the student tech help desk.",
    },
    create: {
      email: "maya.johnson@berea.edu",
      name: "Maya Johnson",
      password: hashedPassword,
      otpEnabled: true,
      major: "Computer and Information Science: Computer Science Concentration",
      year: 2,
      bio: "Sophomore CS student interested in software engineering and AI. I'm a first-generation college student from Eastern Kentucky, passionate about using technology to solve community problems. Outside of class I play guitar in the Berea Jazz Ensemble and volunteer at the student tech help desk.",
    },
  });

  console.log("✓ Demo user:", maya.email);

  // ── Seed Plan A – CS / Software Engineering track ────────────────
  const profileCS: StudentProfile = {
    majors: ["CSC"],
    minors: [],
    interests: ["Software Engineering", "Artificial Intelligence", "Web Development"],
    hobbies: ["Music", "Volunteering"],
    careerGoals: ["Software Engineer", "Full-Stack Developer"],
    mathPlacement: "MAT 135",
    waivedCourses: [],
  };

  const planA = generateAcademicPlan(profileCS, { planType: "A" });

  await prisma.plan.upsert({
    where: { id: "seed-plan-cs-a" },
    update: {
      semesters: JSON.stringify(planA.semesters),
    },
    create: {
      id: "seed-plan-cs-a",
      userId: maya.id,
      name: "CS / Software Engineering — Plan A",
      majors: JSON.stringify(["CSC"]),
      minors: JSON.stringify([]),
      interests: JSON.stringify(["Software Engineering", "Artificial Intelligence", "Web Development"]),
      careerGoals: JSON.stringify(["Software Engineer", "Full-Stack Developer"]),
      mathPlacement: "MAT 135",
      waivedCourses: JSON.stringify([]),
      planType: "A",
      semesters: JSON.stringify(planA.semesters),
    },
  });

  console.log("✓ Seeded Plan A (CS/Software Engineering)");

  // ── Seed Plan B – CS / Data Science track ────────────────────────
  const profileDS: StudentProfile = {
    majors: ["CSC"],
    minors: [],
    interests: ["Data Science", "Machine Learning", "Research"],
    hobbies: ["Music", "Writing"],
    careerGoals: ["Data Scientist", "ML Engineer"],
    mathPlacement: "MAT 135",
    waivedCourses: [],
  };

  const planB = generateAcademicPlan(profileDS, { planType: "B" });

  await prisma.plan.upsert({
    where: { id: "seed-plan-cs-b" },
    update: {
      semesters: JSON.stringify(planB.semesters),
    },
    create: {
      id: "seed-plan-cs-b",
      userId: maya.id,
      name: "CS / Data Science — Plan B",
      majors: JSON.stringify(["CSC"]),
      minors: JSON.stringify([]),
      interests: JSON.stringify(["Data Science", "Machine Learning", "Research"]),
      careerGoals: JSON.stringify(["Data Scientist", "ML Engineer"]),
      mathPlacement: "MAT 135",
      waivedCourses: JSON.stringify([]),
      planType: "B",
      semesters: JSON.stringify(planB.semesters),
    },
  });

  console.log("✓ Seeded Plan B (CS/Data Science)");

  // ── Keep old test user ────────────────────────────────────────────
  const testPw = await hash("bereacollege", 12);
  await prisma.user.upsert({
    where: { email: "mountaineer@berea.edu" },
    update: {},
    create: {
      email: "mountaineer@berea.edu",
      name: "Test Mountaineer",
      password: testPw,
      otpEnabled: false,
    },
  });

  console.log("✓ Test user: mountaineer@berea.edu / bereacollege");
  console.log("\nDemo login: maya.johnson@berea.edu / demo1234  (OTP required)");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
