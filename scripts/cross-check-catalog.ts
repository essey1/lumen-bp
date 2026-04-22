// Cross-checks lib/course-catalog.ts against the 4 JSON data files.
// Run: npx tsx scripts/cross-check-catalog.ts
import { COURSE_CATALOG } from "../lib/course-catalog";
import * as fs from "fs";
import * as path from "path";

// ── Perspective code → catalog field mapping ────────────────────────────────
const WOK_MAP: Record<string, string> = {
  HUM:  "Humanities",
  CRTA: "Creative Arts",
  CES:  "Cultural & Ethnic Studies",
  QUAN: "Quantitative Reasoning",
  NS:   "Natural Science",
  NSR:  "Natural Science",
  SOC:  "Social Science",
  SOCP: "Social Science",
  APPD: "Applied Studies",
};

const VALUE_MAP: Record<string, string> = {
  BEYB: "Beyond the Borders",
  HOW:  "Holistic Wellness",
  PEQ:  "Power & Equity",
  SKM:  "Seeking Meaning",
  SUS:  "Sustainability",
};

const RICHNESS_MAP: Record<string, string> = {
  INTR: "Internationally Rich",
  QUAR: "Quantitatively Rich",
  WTR:  "Writing",
};

// These map 1-to-1 to the Additional type strings in types.ts
const ADDITIONAL_CODES = new Set([
  "ALE","ALES","NSL","AAWP","ARTP","INTN","INTP","RELP","PED2",
  "WHP","PR","PRQ","SKI","CGI","CHUN","IART","APPA","BLAC",
  "WISS","SHRT","LABR","DANC","PSLB","EAUT","ECUL","EGEN",
]);

// ── Load & merge JSON files ──────────────────────────────────────────────────
const JSON_FILES = [
  "data/course-catalog/berea_spring2025_courses.json",
  "data/course-catalog/berea_fall2025_courses.json",
  "data/course-catalog/berea_spring2026_courses.json",
  "data/course-catalog/berea_courses_with_perspectives-fall-26.json",
];

interface JsonCourse {
  title: string;
  credits: number;
  perspectives: Set<string>;
}

const jsonCatalog: Record<string, JsonCourse> = {};

for (const file of JSON_FILES) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  for (const c of raw) {
    const code = `${c.subject} ${c.courseNumber}`;
    if (!jsonCatalog[code]) {
      jsonCatalog[code] = { title: c.courseTitle, credits: c.credits, perspectives: new Set() };
    }
    for (const p of c.perspectives ?? []) jsonCatalog[code].perspectives.add(p.code);
  }
}

// ── Comparison ───────────────────────────────────────────────────────────────
const discrepancies: string[] = [];
let checked = 0;
let missingInLib = 0;
let missingInJson = 0;

// 1. Every JSON course should exist in lib catalog with matching data
for (const [code, jc] of Object.entries(jsonCatalog)) {
  const lc = COURSE_CATALOG[code];
  if (!lc) {
    missingInLib++;
    discrepancies.push(`MISSING IN LIB: ${code} — "${jc.title}" (${jc.credits} cr)`);
    continue;
  }
  checked++;

  const issues: string[] = [];

  // Title
  if (lc.name !== jc.title) {
    issues.push(`  title: lib="${lc.name}" | json="${jc.title}"`);
  }

  // Credits
  if (lc.credits !== jc.credits) {
    issues.push(`  credits: lib=${lc.credits} | json=${jc.credits}`);
  }

  // WoK
  const expectedWoK = new Set<string>();
  for (const code of jc.perspectives) if (WOK_MAP[code]) expectedWoK.add(WOK_MAP[code]);
  const libWoK = new Set(lc.waysOfKnowing ?? []);
  for (const w of expectedWoK) if (!libWoK.has(w as any)) issues.push(`  WoK MISSING: "${w}"`);
  for (const w of libWoK)      if (!expectedWoK.has(w))  issues.push(`  WoK EXTRA:   "${w}"`);

  // Values
  const expectedVals = new Set<string>();
  for (const code of jc.perspectives) if (VALUE_MAP[code]) expectedVals.add(VALUE_MAP[code]);
  const libVals = new Set(lc.values ?? []);
  for (const v of expectedVals) if (!libVals.has(v as any)) issues.push(`  Value MISSING: "${v}"`);
  for (const v of libVals)      if (!expectedVals.has(v))   issues.push(`  Value EXTRA:   "${v}"`);

  // Richnesses
  const expectedRich = new Set<string>();
  for (const code of jc.perspectives) if (RICHNESS_MAP[code]) expectedRich.add(RICHNESS_MAP[code]);
  const libRich = new Set(lc.richnesses ?? []);
  for (const r of expectedRich) if (!libRich.has(r as any)) issues.push(`  Richness MISSING: "${r}"`);
  for (const r of libRich)      if (!expectedRich.has(r))   issues.push(`  Richness EXTRA:   "${r}"`);

  // Additional
  const expectedAdd = new Set<string>();
  for (const code of jc.perspectives) if (ADDITIONAL_CODES.has(code)) expectedAdd.add(code);
  const libAdd = new Set(lc.additional ?? []);
  for (const a of expectedAdd) if (!libAdd.has(a as any)) issues.push(`  Additional MISSING: "${a}"`);
  for (const a of libAdd)      if (!expectedAdd.has(a))   issues.push(`  Additional EXTRA:   "${a}"`);

  if (issues.length > 0) {
    discrepancies.push(`MISMATCH: ${code} — "${lc.name}"\n${issues.join("\n")}`);
  }
}

// 2. Lib courses not in any JSON file
for (const code of Object.keys(COURSE_CATALOG)) {
  if (!jsonCatalog[code]) {
    missingInJson++;
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log(`\n=== CROSS-CHECK REPORT ===`);
console.log(`JSON unique courses: ${Object.keys(jsonCatalog).length}`);
console.log(`Lib courses:         ${Object.keys(COURSE_CATALOG).length}`);
console.log(`Courses checked:     ${checked}`);
console.log(`Missing in lib:      ${missingInLib}`);
console.log(`Lib-only (not in JSON): ${missingInJson}`);
console.log(`Total discrepancies: ${discrepancies.length}\n`);

if (discrepancies.length === 0) {
  console.log("✓ All matched courses are consistent.");
} else {
  for (const d of discrepancies) console.log(d + "\n");
}
