import * as fs from 'fs';

let content = fs.readFileSync('lib/plan-generator.ts', 'utf-8');

content = content.replace(
  /function scoreCourseFit\(code: string, profile: StudentProfile\): number \{/g,
  'function scoreCourseFit(code: string, profile: StudentProfile, planType: "A" | "B" = "A"): number {'
);

content = content.replace(
  /  return score;\n\}/g,
  '  if (planType === "B") {\n    const hash = code.split("").reduce((a, b) => a + b.charCodeAt(0), 0);\n    score += (hash % 5) - 2;\n  }\n\n  return score;\n}'
);

content = content.replace(
  /function scoreUpperLevelCourse\(code: string, profile: StudentProfile\): number \{/g,
  'function scoreUpperLevelCourse(code: string, profile: StudentProfile, planType: "A" | "B" = "A"): number {'
);

content = content.replace(
  /return scoreCourseFit\(code, profile\);/g,
  'return scoreCourseFit(code, profile, planType);'
);

content = content.replace(
  /export function generateAcademicPlan\(profile: StudentProfile\): AcademicPlan \{/g,
  'export function generateAcademicPlan(profile: StudentProfile, options?: { planType?: "A" | "B" }): AcademicPlan {'
);

content = content.replace(
  /function collectMajorCourses\(profile: StudentProfile, collected: Set<string>, crossReqBonus: Record<string, number> = \{\}\): CourseToPlace\[\] \{/g,
  'function collectMajorCourses(profile: StudentProfile, collected: Set<string>, crossReqBonus: Record<string, number> = {}, planType: "A" | "B" = "A"): CourseToPlace[] {'
);

content = content.replace(
  /function collectMinorCourses\(profile: StudentProfile, collected: Set<string>, crossReqBonus: Record<string, number> = \{\}\): CourseToPlace\[\] \{/g,
  'function collectMinorCourses(profile: StudentProfile, collected: Set<string>, crossReqBonus: Record<string, number> = {}, planType: "A" | "B" = "A"): CourseToPlace[] {'
);

content = content.replace(
  /scoreUpperLevelCourse\(b, profile\) - scoreUpperLevelCourse\(a, profile\)/g,
  'scoreUpperLevelCourse(b, profile, planType) - scoreUpperLevelCourse(a, profile, planType)'
);

content = content.replace(
  /const sa = scoreCourseFit\(a, profile\) \+ \(crossReqBonus\[a\] \?\? 0\) \* 2;/g,
  'const sa = scoreCourseFit(a, profile, planType) + (crossReqBonus[a] ?? 0) * 2;'
);

content = content.replace(
  /const sb = scoreCourseFit\(b, profile\) \+ \(crossReqBonus\[b\] \?\? 0\) \* 2;/g,
  'const sb = scoreCourseFit(b, profile, planType) + (crossReqBonus[b] ?? 0) * 2;'
);

content = content.replace(
  /const majorCourses  = collectMajorCourses\(profile, usedCodes, crossReqBonus\);/g,
  'const planType = options?.planType ?? "A";\n  const majorCourses  = collectMajorCourses(profile, usedCodes, crossReqBonus, planType);'
);

content = content.replace(
  /const minorCourses  = collectMinorCourses\(profile, usedCodes, crossReqBonus\);/g,
  'const minorCourses  = collectMinorCourses(profile, usedCodes, crossReqBonus, planType);'
);

content = content.replace(
  /function findInterestElective\(\n  semIdx: number,\n  placed: Set<string>,\n  profile: StudentProfile,\n  preferred: string\[\],\n  placedMap: Map<string, number>,\n  takenInSem: PlannedCourse\[\] = \[\]\n\): PlannedCourse \| null \{/g,
  'function findInterestElective(\n  semIdx: number,\n  placed: Set<string>,\n  profile: StudentProfile,\n  preferred: string[],\n  placedMap: Map<string, number>,\n  takenInSem: PlannedCourse[] = [],\n  planType: "A" | "B" = "A"\n): PlannedCourse | null {'
);

content = content.replace(
  /let score = scoreCourseFit\(code, profile\);/g,
  'let score = scoreCourseFit(code, profile, planType);'
);

content = content.replace(
  /const elective = findInterestElective\(sem, usedCodes, profile, pref, placedMap, semesters\[sem\].courses\);/g,
  'const elective = findInterestElective(sem, usedCodes, profile, pref, placedMap, semesters[sem].courses, planType);'
);

content = content.replace(
  /\.sort\(\(a, b\) => a\.latest \- b\.latest \|\| a\.earliest \- b\.earliest\);/g,
  `.sort((a, b) => {
          if (planType === "B") {
             const hashA = a.item.course.code.charCodeAt(0) % 2;
             const hashB = b.item.course.code.charCodeAt(0) % 2;
             return (a.latest - b.latest) || (a.earliest - b.earliest) || (hashA - hashB);
          }
          return a.latest - b.latest || a.earliest - b.earliest;
        });`
);

fs.writeFileSync('lib/plan-generator.ts', content);
