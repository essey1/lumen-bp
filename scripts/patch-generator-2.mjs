import * as fs from 'fs';

let content = fs.readFileSync('lib/plan-generator.ts', 'utf-8');

content = content.replace(
  /if \(levelNum < 100\) continue; \/\/ skip developmental courses/g,
  `if (levelNum < 100) continue; // skip developmental courses

    // No 100-level electives from the chosen major or minor
    const dept = code.split(" ")[0];
    const isMajorOrMinorDept = profile.majors.some(m => m.startsWith(dept)) || (profile.minors ?? []).some(m => m.startsWith(dept));
    if (levelNum < 200 && isMajorOrMinorDept) continue;`
);

// Update findGEMCourse signature
content = content.replace(
  /userMajors: string\[\] = \[\],\n  takenInSem: PlannedCourse\[\] = \[\]\n\): PlannedCourse \| null \{/g,
  `userMajors: string[] = [],
  takenInSem: PlannedCourse[] = [],
  profile?: StudentProfile
): PlannedCourse | null {`
);

content = content.replace(
  /if \(\/\\d\[A-Z\]\$\/\.test\(code\)\) continue; \/\/ skip letter-suffixed Topics courses/g,
  `if (/\\d[A-Z]$/.test(code)) continue; // skip letter-suffixed Topics courses

    const dept = code.split(" ")[0];
    const levelNum = parseInt(code.match(/\\d+/)?.[0] ?? "0");
    if (profile && levelNum < 200 && levelNum >= 100) {
      const isMajorOrMinorDept = profile.majors.some(m => m.startsWith(dept)) || (profile.minors ?? []).some(m => m.startsWith(dept));
      if (isMajorOrMinorDept) continue; // No 100-level electives from the chosen major or minor
    }`
);

// Update calls to findGEMCourse
content = content.replace(
  /const gem = findGEMCourse\(gemTracker, sem, usedCodes, pref, placedMap, profile\.majors, semesters\[sem\]\.courses\);/g,
  'const gem = findGEMCourse(gemTracker, sem, usedCodes, pref, placedMap, profile.majors, semesters[sem].courses, profile);'
);

fs.writeFileSync('lib/plan-generator.ts', content);
