// Shifts COURSE_SCHEDULE from Fall25-start to Fall26-start and infers F29/S30
// Old: [F25, S26, F26, S27, F27, S28, F28, S29]  (indices 0-7)
// New: [F26, S27, F27, S28, F28, S29, F29, S30]  (indices 0-7)
// Run: npx tsx scripts/shift-schedule.ts
import * as fs from "fs";
import * as path from "path";

const filePath = path.resolve("lib/course-schedule-data.ts");
const src = fs.readFileSync(filePath, "utf8");

// Parse COURSE_SCHEDULE entries
const entries: Array<{ code: string; arr: number[] }> = [];
const regex = /  "([^"]+)":\s*\[([^\]]+)\]/g;
let m: RegExpExecArray | null;
while ((m = regex.exec(src)) !== null) {
  const code = m[1];
  const arr = m[2].split(",").map(s => parseInt(s.trim()));
  entries.push({ code, arr });
}

// Infer a single slot from a 3-value pattern (majority rule, tie → use last value)
function infer(a: number, b: number, c: number): number {
  const sum = a + b + c;
  if (sum >= 2) return 1;
  if (sum <= 1) return 0;
  return c; // shouldn't reach here
}

const shifted = entries.map(({ code, arr }) => {
  // old indices: 0=F25, 1=S26, 2=F26, 3=S27, 4=F27, 5=S28, 6=F28, 7=S29
  const newArr = [
    arr[2], // F26
    arr[3], // S27
    arr[4], // F27
    arr[5], // S28
    arr[6], // F28
    arr[7], // S29
    infer(arr[2], arr[4], arr[6]), // F29 — inferred from F26, F27, F28
    infer(arr[3], arr[5], arr[7]), // S30 — inferred from S27, S28, S29
  ];
  return { code, arr: newArr };
});

// Reconstruct the file
const header = `// Auto-generated from data/*.csv — do not edit manually
// Index: 0=Fall26, 1=Spr27, 2=Fall27, 3=Spr28, 4=Fall28, 5=Spr29, 6=Fall29, 7=Spr30
// Plan runs Fall 2026 → Spring 2030
// 1 = offered, 0 = not offered

export const COURSE_SCHEDULE: Record<string, number[]> = {
`;

const body = shifted
  .map(({ code, arr }) => `  "${code}": [${arr.join(", ")}],`)
  .join("\n");

// Preserve the isCourseAvailable and nextAvailableSemester functions
const funcStart = src.indexOf("\nexport function isCourseAvailable");
const functions = src.slice(funcStart);

const result = header + body + "\n};\n" + functions;
fs.writeFileSync(filePath, result, "utf8");
console.log(`Shifted ${shifted.length} course schedule entries to Fall26\u2013Spr30.`);
