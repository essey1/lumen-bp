import { generateAcademicPlan } from "../lib/plan-generator";

function testPlan(label: string, majors: string[], minors: string[], interests: string[], careerGoals: string[]) {
  console.log(`\n${"=".repeat(56)}\nTEST: ${label}\n${"=".repeat(56)}`);
  const plan = generateAcademicPlan({ majors, minors, interests, hobbies: [], careerGoals });
  for (const sem of plan.semesters) {
    const semLabel = `Y${sem.year} ${sem.semester}`;
    const cats = sem.courses.map(c => `[${c.category[0]}]${c.code}`).join("  ");
    console.log(`  ${semLabel.padEnd(11)} ${cats}`);
  }
  const majorC = plan.semesters.flatMap(s => s.courses.filter(c => c.category === "Major")).length;
  const gemC   = plan.semesters.flatMap(s => s.courses.filter(c => c.category === "GEM")).length;
  const elecC  = plan.semesters.flatMap(s => s.courses.filter(c => c.category === "Elective")).length;
  console.log(`  [M]=${majorC} [G]=${gemC} [E]=${elecC}  outside-major=${plan.creditsOutsideMajor}`);
  if (plan.warnings.length) console.log("  WARNINGS:", plan.warnings);
  if (plan.unfulfilledRequirements.length) console.log("  UNFULFILLED:", plan.unfulfilledRequirements);
}

testPlan("CSC, no minor",        ["CSC"], [],      ["Computer Science"], ["Software Engineer"]);
testPlan("BIO, no minor",        ["BIO"], [],      ["Biology"],          ["Research Scientist"]);
testPlan("CSC + MAT minor",      ["CSC"], ["MAT"], ["Computer Science", "Mathematics"], ["Data Scientist"]);
testPlan("PSY, no minor",        ["PSY"], [],      ["Psychology"],       ["Counselor"]);
