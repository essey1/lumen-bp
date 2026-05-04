import { generateAcademicPlan } from "../lib/plan-generator";

const plan = generateAcademicPlan({
  majors: ["CSC", "BIO"], minors: [], interests: ["Technology", "Biology"],
  hobbies: [], careerGoals: ["Research Scientist"],
});

const courses = plan.semesters.flatMap(s => s.courses);
const cscCredits = courses.filter(c => c.category === "Major" && c.code.startsWith("CSC ")).reduce((s,c)=>s+c.credits,0);
const bioCredits = courses.filter(c => c.category === "Major" && c.code.startsWith("BIO ")).reduce((s,c)=>s+c.credits,0);
const allMajor  = courses.filter(c => c.category === "Major").reduce((s,c)=>s+c.credits,0);
const T = plan.totalCredits;

console.log(`Total credits:              ${T}`);
console.log(`CSC dept credits:           ${cscCredits}  → outside CSC = ${T - cscCredits}`);
console.log(`BIO dept credits:           ${bioCredits}  → outside BIO = ${T - bioCredits}`);
console.log(`All major credits (old):    ${allMajor}  → old outside  = ${T - allMajor}`);
console.log(`creditsOutsideMajor (new):  ${plan.creditsOutsideMajor}  (min of per-major)`);
console.log(`Warnings:`, plan.warnings);
console.log(`Unfulfilled:`, plan.unfulfilledRequirements);
