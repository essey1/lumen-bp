// Reads all CSV files in data/ and builds lib/course-schedule-data.ts.
// Each CSV may cover a different date range with varying columns.
// Strategy:
//   1. For each semester that IS in the CSV, use the exact value.
//   2. For semesters NOT in the CSV, detect the offering pattern from same-season
//      historical data and extrapolate:
//      - "always"  → offered every semester of that season
//      - "never"   → never offered
//      - "even"    → offered in even-year semesters only  (e.g. Fall 26, Fall 28)
//      - "odd"     → offered in odd-year semesters only   (e.g. Fall 27, Fall 29)
//      - "majority"→ majority of historical semesters (fallback)
// Run: npx tsx scripts/csv-to-schedule.ts
import * as fs from "fs";
import * as path from "path";

const dataDir = path.resolve("data");
const outPath = path.resolve("lib/course-schedule-data.ts");

// Target output semesters: name → [season, year]
const TARGET: Array<{ label: string; season: "fall" | "spring"; year: number }> = [
  { label: "Fall 26", season: "fall",   year: 26 },
  { label: "Spr 27",  season: "spring", year: 27 },
  { label: "Fall 27", season: "fall",   year: 27 },
  { label: "Spr 28",  season: "spring", year: 28 },
  { label: "Fall 28", season: "fall",   year: 28 },
  { label: "Spr 29",  season: "spring", year: 29 },
  { label: "Fall 29", season: "fall",   year: 29 },
  { label: "Spr 30",  season: "spring", year: 30 },
];

// Normalize column header to canonical form: "Fall 26", "Spr 27", etc.
function normalizeHeader(h: string): { label: string; season: "fall" | "spring"; year: number } | null {
  const s = h.trim().replace(/\s+/g, " ").replace(/[^\x20-\x7E]/g, "");
  const m = s.match(/^(Fall|Spr(?:ing)?)\s+(\d{2})$/i);
  if (!m) return null;
  const season = m[1].toLowerCase().startsWith("fall") ? "fall" : "spring";
  const year = parseInt(m[2]);
  const label = season === "fall" ? `Fall ${m[2]}` : `Spr ${m[2]}`;
  return { label, season, year };
}

type Pattern = "always" | "never" | "even" | "odd" | "majority0" | "majority1";

// Given { year → value } map for one season, detect the offering pattern
function detectPattern(data: Map<number, number>): Pattern {
  if (data.size === 0) return "majority0";
  const entries = [...data.entries()];
  const vals = entries.map(([, v]) => v);
  if (vals.every(v => v === 1)) return "always";
  if (vals.every(v => v === 0)) return "never";

  // Check even/odd-year pattern
  const on  = entries.filter(([, v]) => v === 1).map(([y]) => y);
  const off = entries.filter(([, v]) => v === 0).map(([y]) => y);
  if (on.length > 0 && off.length > 0) {
    if (on.every(y => y % 2 === 0) && off.every(y => y % 2 === 1)) return "even";
    if (on.every(y => y % 2 === 1) && off.every(y => y % 2 === 0)) return "odd";
  }

  // Majority fallback
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum * 2 >= vals.length ? "majority1" : "majority0";
}

function applyPattern(pattern: Pattern, year: number): number {
  switch (pattern) {
    case "always":    return 1;
    case "never":     return 0;
    case "even":      return year % 2 === 0 ? 1 : 0;
    case "odd":       return year % 2 === 1 ? 1 : 0;
    case "majority1": return 1;
    case "majority0": return 0;
  }
}

// Clean a course code: strip cross-listing "(DEPT)", asterisks, non-ASCII, trailing space
function cleanCode(raw: string): string {
  return raw
    .replace(/[^\x20-\x7E]/g, "")   // strip non-ASCII (e.g. "Â")
    .replace(/\s*\([^)]+\)\s*$/, "") // strip trailing "(BUS)", "(HIS)", etc.
    .replace(/\*+$/, "")             // strip trailing asterisks
    .trim();
}

// A valid course code looks like "AAA 000" — dept letters + space + digits
function isValidCode(code: string): boolean {
  return /^[A-Z&]{2,5}\s+\d+[A-Z]?$/.test(code);
}

// Accumulated per-course data across all CSV files:
// courseData[code][season] = Map<year, value>
const courseData: Record<string, { fall: Map<number, number>; spring: Map<number, number> }> = {};
// exactData[code] = Map<"Fall 26" | "Spr 27" | ..., value> for target semesters present in any CSV
const exactData: Record<string, Map<string, number>> = {};

const csvFiles = fs.readdirSync(dataDir).filter(f => f.endsWith(".csv")).sort();
console.log(`Processing ${csvFiles.length} CSV files...\n`);

for (const file of csvFiles) {
  const raw = fs.readFileSync(path.join(dataDir, file), "utf8");
  const rows = raw.split(/\r?\n/);

  // Parse header row
  const headerCols = rows[0].split(",");
  // Build column info: colIndex → { season, year, label, isTarget }
  interface ColInfo { season: "fall" | "spring"; year: number; label: string; isTarget: boolean }
  const colInfo: Array<ColInfo | null> = headerCols.map((h, i) => {
    if (i === 0) return null;
    const parsed = normalizeHeader(h);
    if (!parsed) return null;
    const isTarget = TARGET.some(t => t.label === parsed.label);
    return { ...parsed, isTarget };
  });

  let courseCount = 0;
  for (let r = 1; r < rows.length; r++) {
    const line = rows[r].trim();
    if (!line) continue;
    const cols = line.split(",");
    const rawCode = cols[0];
    const code = cleanCode(rawCode);
    if (!isValidCode(code)) continue; // skip category headers, empty rows

    if (!courseData[code]) {
      courseData[code] = { fall: new Map(), spring: new Map() };
      exactData[code] = new Map();
    }

    for (let c = 1; c < colInfo.length; c++) {
      const ci = colInfo[c];
      if (!ci) continue;
      const v = parseInt(cols[c]?.trim() ?? "");
      const val = isNaN(v) ? 0 : (v ? 1 : 0);

      // Accumulate historical data
      if (ci.season === "fall") {
        // If we already have a value, OR it to accumulate (a course offered in ANY file is offered)
        const existing = courseData[code].fall.get(ci.year);
        courseData[code].fall.set(ci.year, existing !== undefined ? Math.max(existing, val) : val);
      } else {
        const existing = courseData[code].spring.get(ci.year);
        courseData[code].spring.set(ci.year, existing !== undefined ? Math.max(existing, val) : val);
      }

      // Record exact value for target semesters
      if (ci.isTarget) {
        const existing = exactData[code].get(ci.label);
        // Take max (if two CSVs both cover this exact semester, prefer 1)
        exactData[code].set(ci.label, existing !== undefined ? Math.max(existing, val) : val);
      }
    }
    courseCount++;
  }
  console.log(`  ${file.padEnd(22)} → ${courseCount} courses, ${colInfo.filter(Boolean).length} semester cols`);
}

// Now build the final schedule
const schedule: Record<string, number[]> = {};

for (const [code, data] of Object.entries(courseData)) {
  const fallPattern   = detectPattern(data.fall);
  const springPattern = detectPattern(data.spring);

  const arr = TARGET.map(({ label, season, year }) => {
    // If we have an exact value for this target semester, use it
    const exact = exactData[code]?.get(label);
    if (exact !== undefined) return exact;
    // Otherwise extrapolate from pattern
    return applyPattern(season === "fall" ? fallPattern : springPattern, year);
  });

  schedule[code] = arr;
}

const sorted = Object.entries(schedule).sort(([a], [b]) => a.localeCompare(b));
console.log(`\nTotal unique courses: ${sorted.length}`);

// Count patterns for summary
let summary = { always: 0, never: 0, even: 0, odd: 0, mixed: 0 };
for (const [, arr] of sorted) {
  const s = arr.join("");
  if (s === "11111111") summary.always++;
  else if (s === "00000000") summary.never++;
  else if (s === "10101010") summary.even++;
  else if (s === "01010101") summary.odd++;
  else summary.mixed++;
}
console.log(`  always=${summary.always} never=${summary.never} fall-only=${summary.even} spring-only=${summary.odd} mixed=${summary.mixed}`);

const lines = sorted.map(([code, arr]) => `  "${code}": [${arr.join(", ")}],`);

const output = `// Auto-generated by scripts/csv-to-schedule.ts — do not edit manually
// Source: data/*.csv (one file per department)
// Index: 0=Fall26, 1=Spr27, 2=Fall27, 3=Spr28, 4=Fall28, 5=Spr29, 6=Fall29, 7=Spr30
// 1 = offered, 0 = not offered
// Values are exact where the CSV covers that semester; otherwise inferred by pattern
// (always / never / even-years / odd-years / majority).

export const COURSE_SCHEDULE: Record<string, number[]> = {
${lines.join("\n")}
};

export function isCourseAvailable(code: string, semesterIndex: number): boolean {
  const schedule = COURSE_SCHEDULE[code];
  if (!schedule) return true; // assume available if no data
  return schedule[semesterIndex] === 1;
}

export function nextAvailableSemester(code: string, fromIndex: number): number {
  const schedule = COURSE_SCHEDULE[code];
  if (!schedule) return fromIndex;
  for (let i = fromIndex; i < schedule.length; i++) {
    if (schedule[i] === 1) return i;
  }
  return -1; // not available in remaining semesters
}
`;

fs.writeFileSync(outPath, output, "utf8");
console.log(`\nWritten to lib/course-schedule-data.ts`);
