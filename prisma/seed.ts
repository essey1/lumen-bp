import { PrismaClient } from "../.prisma-seed";
import { hash } from "bcryptjs";
import { generateAcademicPlan } from "../lib/plan-generator";
import type { StudentProfile } from "../lib/types";

const prisma = new PrismaClient();
const PASSWORD = "demo1234";

// ── helpers ───────────────────────────────────────────────────────────────────
async function pw() { return hash(PASSWORD, 12); }

function sem(
  year: 1 | 2 | 3 | 4,
  semester: "Fall" | "Spring",
  courses: { code: string; name: string; credits: number }[]
) {
  return { year, semester, courses };
}

// ── PROFILE 1: Maya Johnson — CS sophomore, no completed semesters ─────────
// Good for: testing plan generation from scratch, clean state
async function seedMaya() {
  const user = await prisma.user.upsert({
    where: { email: "maya.johnson@berea.edu" },
    update: {
      name: "Maya Johnson",
      major: "Computer and Information Science: Computer Science Concentration",
      minor: null,
      year: 2,
      mathPlacement: "MAT 135",
      waivedCourses: JSON.stringify([]),
      completedSemesters: JSON.stringify([]),
      bio: "Sophomore CS student from Eastern Kentucky. First-gen college student passionate about building tools that help communities. Plays guitar in the Berea Jazz Ensemble.",
      otpEnabled: false,
    },
    create: {
      email: "maya.johnson@berea.edu",
      name: "Maya Johnson",
      password: await pw(),
      otpEnabled: false,
      major: "Computer and Information Science: Computer Science Concentration",
      year: 2,
      mathPlacement: "MAT 135",
      waivedCourses: JSON.stringify([]),
      completedSemesters: JSON.stringify([]),
      bio: "Sophomore CS student from Eastern Kentucky. First-gen college student passionate about building tools that help communities. Plays guitar in the Berea Jazz Ensemble.",
    },
  });

  const profile: StudentProfile = {
    majors: ["CSC_CS"],
    minors: [],
    interests: ["Software Engineering", "Artificial Intelligence", "Web Development", "Human-Computer Interaction"],
    hobbies: ["Music", "Volunteering"],
    careerGoals: ["Software Engineer", "Full-Stack Developer"],
    mathPlacement: "MAT 135",
    waivedCourses: [],
  };

  const plan = generateAcademicPlan(profile, { planType: "A" });

  await prisma.plan.upsert({
    where: { id: "demo-maya-plan-a" },
    update: { semesters: JSON.stringify(plan.semesters) },
    create: {
      id: "demo-maya-plan-a",
      userId: user.id,
      name: "CS (Software Engineering) — Plan A",
      majors: JSON.stringify(["CSC_CS"]),
      minors: JSON.stringify([]),
      interests: JSON.stringify(profile.interests),
      careerGoals: JSON.stringify(profile.careerGoals),
      mathPlacement: "MAT 135",
      waivedCourses: JSON.stringify([]),
      planType: "A",
      semesters: JSON.stringify(plan.semesters),
    },
  });

  console.log("✓ Maya Johnson  (maya.johnson@berea.edu) — CS sophomore, no history");
}

// ── PROFILE 2: Aaliyah Williams — Biology/Pre-Med freshman ───────────────────
// Good for: plan generation from scratch, healthcare interests, no math placement
async function seedAaliyah() {
  const user = await prisma.user.upsert({
    where: { email: "aaliyah.williams@berea.edu" },
    update: {
      name: "Aaliyah Williams",
      major: "Biology",
      minor: null,
      year: 1,
      mathPlacement: "none",
      waivedCourses: JSON.stringify([]),
      completedSemesters: JSON.stringify([]),
      bio: "Freshman pre-med student from Louisville, KY. Passionate about community health and increasing healthcare access in underserved regions. Volunteer EMT.",
      otpEnabled: false,
    },
    create: {
      email: "aaliyah.williams@berea.edu",
      name: "Aaliyah Williams",
      password: await pw(),
      otpEnabled: false,
      major: "Biology",
      year: 1,
      mathPlacement: "none",
      waivedCourses: JSON.stringify([]),
      completedSemesters: JSON.stringify([]),
      bio: "Freshman pre-med student from Louisville, KY. Passionate about community health and increasing healthcare access in underserved regions. Volunteer EMT.",
    },
  });

  const profile: StudentProfile = {
    majors: ["BIO"],
    minors: [],
    interests: ["Biology", "Chemistry", "Community Health", "Epidemiology", "Public Health"],
    hobbies: ["Volunteering", "Community Service"],
    careerGoals: ["Physician", "Public Health Officer", "Epidemiologist"],
    mathPlacement: "none",
    waivedCourses: [],
  };

  const plan = generateAcademicPlan(profile, { planType: "A" });

  await prisma.plan.upsert({
    where: { id: "demo-aaliyah-plan-a" },
    update: { semesters: JSON.stringify(plan.semesters) },
    create: {
      id: "demo-aaliyah-plan-a",
      userId: user.id,
      name: "Biology (Pre-Med) — Plan A",
      majors: JSON.stringify(["BIO"]),
      minors: JSON.stringify([]),
      interests: JSON.stringify(profile.interests),
      careerGoals: JSON.stringify(profile.careerGoals),
      mathPlacement: "none",
      waivedCourses: JSON.stringify([]),
      planType: "A",
      semesters: JSON.stringify(plan.semesters),
    },
  });

  console.log("✓ Aaliyah Williams  (aaliyah.williams@berea.edu) — Biology freshman, pre-med");
}

// ── PROFILE 3: Jordan Kim — CS + Math double major junior, 4 semesters done ──
// Good for: completed-semester validation, double major scheduling, advanced placement
async function seedJordan() {
  const completedSemesters = [
    sem(1, "Fall", [
      { code: "CSC 226", name: "Discrete Structures", credits: 1 },
      { code: "MAT 135", name: "Calculus I", credits: 1 },
      { code: "GSTR 110", name: "Great Questions of Life & Learning I", credits: 1 },
      { code: "ENG 100", name: "Writing and Inquiry", credits: 1 },
    ]),
    sem(1, "Spring", [
      { code: "CSC 236", name: "Object-Oriented Programming", credits: 1 },
      { code: "MAT 136", name: "Calculus II", credits: 1 },
      { code: "GSTR 210", name: "Great Questions of Life & Learning II", credits: 1 },
      { code: "PHY 221", name: "General Physics I", credits: 1 },
    ]),
    sem(2, "Fall", [
      { code: "CSC 335", name: "Computer Architecture", credits: 1 },
      { code: "MAT 235", name: "Calculus III", credits: 1 },
      { code: "GSTR 310", name: "Great Questions of Life & Learning III", credits: 1 },
      { code: "MAT 216", name: "Discrete Mathematics", credits: 1 },
    ]),
    sem(2, "Spring", [
      { code: "CSC 340", name: "Data Structures and Algorithms", credits: 1 },
      { code: "MAT 335", name: "Linear Algebra", credits: 1 },
      { code: "PHY 222", name: "General Physics II", credits: 1 },
      { code: "CSC 328", name: "Computer Networking", credits: 1 },
    ]),
  ];

  const waivedCourses = ["MAT 011", "MAT 012"];

  const user = await prisma.user.upsert({
    where: { email: "jordan.kim@berea.edu" },
    update: {
      name: "Jordan Kim",
      major: "Computer and Information Science: Computational Mathematics Concentration",
      minor: null,
      year: 3,
      mathPlacement: "MAT 330",
      waivedCourses: JSON.stringify(waivedCourses),
      completedSemesters: JSON.stringify(completedSemesters),
      bio: "Junior double-tracking CS and Math. From Chicago, IL. Interested in algorithms and machine learning research. Works in the lab as a data assistant.",
      otpEnabled: false,
    },
    create: {
      email: "jordan.kim@berea.edu",
      name: "Jordan Kim",
      password: await pw(),
      otpEnabled: false,
      major: "Computer and Information Science: Computational Mathematics Concentration",
      year: 3,
      mathPlacement: "MAT 330",
      waivedCourses: JSON.stringify(waivedCourses),
      completedSemesters: JSON.stringify(completedSemesters),
      bio: "Junior double-tracking CS and Math. From Chicago, IL. Interested in algorithms and machine learning research. Works in the lab as a data assistant.",
    },
  });

  const profile: StudentProfile = {
    majors: ["CSC_MATH"],
    minors: [],
    interests: ["Data Science", "Machine Learning", "Applied Mathematics", "Algorithms", "Research"],
    hobbies: ["Chess", "Hiking"],
    careerGoals: ["Data Scientist", "ML Engineer", "Research Scientist"],
    mathPlacement: "MAT 330",
    waivedCourses: waivedCourses,
  };

  const plan = generateAcademicPlan(profile, {
    planType: "A",
    completedSemesters,
  });

  await prisma.plan.upsert({
    where: { id: "demo-jordan-plan-a" },
    update: { semesters: JSON.stringify(plan.semesters) },
    create: {
      id: "demo-jordan-plan-a",
      userId: user.id,
      name: "CS (Computational Math) — Plan A",
      majors: JSON.stringify(["CSC_MATH"]),
      minors: JSON.stringify([]),
      interests: JSON.stringify(profile.interests),
      careerGoals: JSON.stringify(profile.careerGoals),
      mathPlacement: "MAT 330",
      waivedCourses: JSON.stringify(waivedCourses),
      planType: "A",
      semesters: JSON.stringify(plan.semesters),
    },
  });

  console.log("✓ Jordan Kim  (jordan.kim@berea.edu) — CS/Math junior, 4 semesters complete");
}

// ── PROFILE 4: Sofia Ramirez — Business sophomore, 2 completed semesters ─────
// Good for: economics/business track, non-STEM path, minor attached
async function seedSofia() {
  const completedSemesters = [
    sem(1, "Fall", [
      { code: "BUS 100", name: "Introduction to Business", credits: 1 },
      { code: "ECO 100", name: "Principles of Economics", credits: 1 },
      { code: "GSTR 110", name: "Great Questions of Life & Learning I", credits: 1 },
      { code: "ENG 100", name: "Writing and Inquiry", credits: 1 },
    ]),
    sem(1, "Spring", [
      { code: "BUS 150", name: "Financial Accounting", credits: 1 },
      { code: "MAT 011", name: "Applied Mathematics I", credits: 1 },
      { code: "GSTR 210", name: "Great Questions of Life & Learning II", credits: 1 },
      { code: "COM 100", name: "Introduction to Communication", credits: 1 },
    ]),
  ];

  const user = await prisma.user.upsert({
    where: { email: "sofia.ramirez@berea.edu" },
    update: {
      name: "Sofia Ramirez",
      major: "Business Administration",
      minor: "Entrepreneurship",
      year: 2,
      mathPlacement: "MAT 011",
      waivedCourses: JSON.stringify([]),
      completedSemesters: JSON.stringify(completedSemesters),
      bio: "Sophomore Business major from San Antonio, TX. Wants to start a social enterprise after graduation. Current treasurer of the Student Entrepreneurs Club.",
      otpEnabled: false,
    },
    create: {
      email: "sofia.ramirez@berea.edu",
      name: "Sofia Ramirez",
      password: await pw(),
      otpEnabled: false,
      major: "Business Administration",
      minor: "Entrepreneurship",
      year: 2,
      mathPlacement: "MAT 011",
      waivedCourses: JSON.stringify([]),
      completedSemesters: JSON.stringify(completedSemesters),
      bio: "Sophomore Business major from San Antonio, TX. Wants to start a social enterprise after graduation. Current treasurer of the Student Entrepreneurs Club.",
    },
  });

  const profile: StudentProfile = {
    majors: ["BUS"],
    minors: ["Entrepreneurship"],
    interests: ["Finance", "Entrepreneurship", "Behavioral Economics", "Marketing", "Business"],
    hobbies: ["Cooking", "Travel"],
    careerGoals: ["Business Analyst", "Entrepreneur", "Financial Analyst"],
    mathPlacement: "MAT 011",
    waivedCourses: [],
  };

  const plan = generateAcademicPlan(profile, {
    planType: "A",
    completedSemesters,
  });

  await prisma.plan.upsert({
    where: { id: "demo-sofia-plan-a" },
    update: { semesters: JSON.stringify(plan.semesters) },
    create: {
      id: "demo-sofia-plan-a",
      userId: user.id,
      name: "Business Administration — Plan A",
      majors: JSON.stringify(["BUS"]),
      minors: JSON.stringify(["Entrepreneurship"]),
      interests: JSON.stringify(profile.interests),
      careerGoals: JSON.stringify(profile.careerGoals),
      mathPlacement: "MAT 011",
      waivedCourses: JSON.stringify([]),
      planType: "A",
      semesters: JSON.stringify(plan.semesters),
    },
  });

  console.log("✓ Sofia Ramirez  (sofia.ramirez@berea.edu) — Business sophomore, 2 semesters complete");
}

// ── PROFILE 5: Marcus Thompson — Education Studies junior, teaching career ───
// Good for: EDS filter (Marcus HAS education interest → EDS courses appear),
//           later-stage student with 4 completed semesters
async function seedMarcus() {
  const completedSemesters = [
    sem(1, "Fall", [
      { code: "EDS 101", name: "Introduction to Education", credits: 1 },
      { code: "PSY 100", name: "General Psychology", credits: 1 },
      { code: "GSTR 110", name: "Great Questions of Life & Learning I", credits: 1 },
      { code: "ENG 100", name: "Writing and Inquiry", credits: 1 },
    ]),
    sem(1, "Spring", [
      { code: "EDS 200", name: "Child Development and Learning", credits: 1 },
      { code: "SOC 100", name: "Introduction to Sociology", credits: 1 },
      { code: "GSTR 210", name: "Great Questions of Life & Learning II", credits: 1 },
      { code: "ENG 110", name: "Literature and Writing", credits: 1 },
    ]),
    sem(2, "Fall", [
      { code: "EDS 301", name: "Curriculum and Instruction", credits: 1 },
      { code: "PSY 250", name: "Developmental Psychology", credits: 1 },
      { code: "GSTR 310", name: "Great Questions of Life & Learning III", credits: 1 },
      { code: "HIS 100", name: "World History", credits: 1 },
    ]),
    sem(2, "Spring", [
      { code: "EDS 320", name: "Classroom Management", credits: 1 },
      { code: "PSY 310", name: "Educational Psychology", credits: 1 },
      { code: "SOC 201", name: "Social Stratification", credits: 1 },
      { code: "ENG 200", name: "Advanced Writing", credits: 1 },
    ]),
  ];

  const user = await prisma.user.upsert({
    where: { email: "marcus.thompson@berea.edu" },
    update: {
      name: "Marcus Thompson",
      major: "Education Studies",
      minor: null,
      year: 3,
      mathPlacement: "none",
      waivedCourses: JSON.stringify([]),
      completedSemesters: JSON.stringify(completedSemesters),
      bio: "Junior Education Studies major from rural Tennessee. Aspires to teach high school history and coach soccer. Worked as a teaching assistant in his hometown school district before college.",
      otpEnabled: false,
    },
    create: {
      email: "marcus.thompson@berea.edu",
      name: "Marcus Thompson",
      password: await pw(),
      otpEnabled: false,
      major: "Education Studies",
      year: 3,
      mathPlacement: "none",
      waivedCourses: JSON.stringify([]),
      completedSemesters: JSON.stringify(completedSemesters),
      bio: "Junior Education Studies major from rural Tennessee. Aspires to teach high school history and coach soccer. Worked as a teaching assistant in his hometown school district before college.",
    },
  });

  const profile: StudentProfile = {
    majors: ["EDS"],
    minors: [],
    interests: ["Education", "Teaching", "Elementary Education", "Curriculum Development", "History"],
    hobbies: ["Soccer", "Mentoring"],
    careerGoals: ["High School Teacher", "Teaching Assistant", "School Principal"],
    mathPlacement: "none",
    waivedCourses: [],
  };

  const plan = generateAcademicPlan(profile, {
    planType: "A",
    completedSemesters,
  });

  await prisma.plan.upsert({
    where: { id: "demo-marcus-plan-a" },
    update: { semesters: JSON.stringify(plan.semesters) },
    create: {
      id: "demo-marcus-plan-a",
      userId: user.id,
      name: "Education Studies — Plan A",
      majors: JSON.stringify(["EDS"]),
      minors: JSON.stringify([]),
      interests: JSON.stringify(profile.interests),
      careerGoals: JSON.stringify(profile.careerGoals),
      mathPlacement: "none",
      waivedCourses: JSON.stringify([]),
      planType: "A",
      semesters: JSON.stringify(plan.semesters),
    },
  });

  console.log("✓ Marcus Thompson  (marcus.thompson@berea.edu) — Education Studies junior, teaching career");
}

// ── PROFILE 6: Test account (no OTP, blank profile) ─────────────────────────
// Good for: quick login to explore any feature without a seeded plan
async function seedTestAccount() {
  await prisma.user.upsert({
    where: { email: "mountaineer@berea.edu" },
    update: { otpEnabled: false },
    create: {
      email: "mountaineer@berea.edu",
      name: "Test Mountaineer",
      password: await hash("bereacollege", 12),
      otpEnabled: false,
    },
  });
  console.log("✓ Test account    (mountaineer@berea.edu) — blank profile, password: bereacollege");
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌲 Seeding demo profiles…\n");

  await seedMaya();
  await seedAaliyah();
  await seedJordan();
  await seedSofia();
  await seedMarcus();
  await seedTestAccount();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Demo accounts  (all passwords: ${PASSWORD})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 maya.johnson@berea.edu   CS sophomore, no history
 aaliyah.williams@berea.edu  Biology freshman, pre-med
 jordan.kim@berea.edu    CS/Math junior, 4 sems done
 sofia.ramirez@berea.edu  Business sophomore, 2 sems done
 marcus.thompson@berea.edu  Education Studies, teaching track

 mountaineer@berea.edu   Blank account (pw: bereacollege)

 OTP is disabled on all accounts — login is email + password only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
