import { generateAcademicPlan } from "../lib/plan-generator";

const tests = [
  { interests: ["Technology"],       goals: ["Software Engineer"] },
  { interests: ["Mathematics"],      goals: ["Supply Chain Manager"] },
];

for (const t of tests) {
  const plan = generateAcademicPlan({ majors: ["CSC"], minors: [], interests: t.interests, hobbies: [], careerGoals: t.goals });
  const matches = plan.semesters.flatMap((s, i) =>
    s.courses
      .filter(c => ["MAT 216","MAT 312","MAT 415","MAT 135"].includes(c.code))
      .map(c => `sem${i} ${c.code} [${c.fulfills[0]}]`)
  );
  console.log(`\n${t.interests[0]} / ${t.goals[0]}`);
  console.log("  MAT courses:", matches.join("  |  ") || "NONE");
  console.log("  Warnings:", plan.warnings);
  console.log("  Unfulfilled:", plan.unfulfilledRequirements);
}
