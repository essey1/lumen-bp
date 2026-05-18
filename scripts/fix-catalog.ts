// Applies JSON data to lib/course-catalog.ts, fixing name, credits, waysOfKnowing,
// values, richnesses, and additional for every mismatched course.
// Prerequisites are deliberately left untouched.
// Run: npx tsx scripts/fix-catalog.ts
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
const ADDITIONAL_CODES = new Set([
  "ALE","ALES","NSL","AAWP","ARTP","INTN","INTP","RELP","PED2",
  "WHP","PR","PRQ","SKI","CGI","CHUN","IART","APPA","BLAC",
  "WISS","SHRT","LABR","DANC","PSLB","EAUT","ECUL","EGEN",
]);

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ── Load & merge JSON files ──────────────────────────────────────────────────
interface JsonEntry {
  title: string;
  credits: number;
  wok: string[];
  values: string[];
  richnesses: string[];
  additional: string[];
}

const JSON_FILES = [
  "data/course-catalog/berea_spring2025_courses.json",
  "data/course-catalog/berea_fall2025_courses.json",
  "data/course-catalog/berea_spring2026_courses.json",
  "data/course-catalog/berea_courses_with_perspectives-fall-26.json",
];

const jsonCatalog: Record<string, JsonEntry> = {};

for (const file of JSON_FILES) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  for (const c of raw) {
    const code = `${c.subject} ${c.courseNumber}`;
    const title = decodeHtmlEntities(c.courseTitle);
    const perspectives: string[] = (c.perspectives ?? []).map((p: any) => p.code);

    if (!jsonCatalog[code]) {
      const wok = [...new Set(perspectives.filter(p => WOK_MAP[p]).map(p => WOK_MAP[p]))];
      const vals = [...new Set(perspectives.filter(p => VALUE_MAP[p]).map(p => VALUE_MAP[p]))];
      const rich = [...new Set(perspectives.filter(p => RICHNESS_MAP[p]).map(p => RICHNESS_MAP[p]))];
      const add  = [...new Set(perspectives.filter(p => ADDITIONAL_CODES.has(p)))];
      jsonCatalog[code] = { title, credits: c.credits, wok, values: vals, richnesses: rich, additional: add };
    } else {
      // Merge perspectives (union across semesters)
      const entry = jsonCatalog[code];
      for (const p of perspectives) {
        if (WOK_MAP[p] && !entry.wok.includes(WOK_MAP[p])) entry.wok.push(WOK_MAP[p]);
        if (VALUE_MAP[p] && !entry.values.includes(VALUE_MAP[p])) entry.values.push(VALUE_MAP[p]);
        if (RICHNESS_MAP[p] && !entry.richnesses.includes(RICHNESS_MAP[p])) entry.richnesses.push(RICHNESS_MAP[p]);
        if (ADDITIONAL_CODES.has(p) && !entry.additional.includes(p)) entry.additional.push(p);
      }
    }
  }
}

// ── Read lib/course-catalog.ts ───────────────────────────────────────────────
const catalogPath = path.resolve("lib/course-catalog.ts");
let src = fs.readFileSync(catalogPath, "utf8");

// ── Helpers ───────────────────────────────────────────────────────────────────
function tsArray(items: string[]): string {
  if (items.length === 0) return "[]";
  return `[${items.map(i => JSON.stringify(i)).join(", ")}]`;
}

// Find the start of an entry block for courseCode and return its start/end indices
function findEntryBounds(source: string, courseCode: string): [number, number] | null {
  const key = JSON.stringify(courseCode);
  const searchStr = `  ${key}: {`;
  const start = source.indexOf(searchStr);
  if (start === -1) return null;

  // Find the matching closing brace
  let depth = 0;
  let i = start;
  while (i < source.length) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) {
        // include trailing comma + newline if present
        let end = i + 1;
        if (source[end] === ",") end++;
        if (source[end] === "\n") end++;
        return [start, end];
      }
    }
    i++;
  }
  return null;
}

// Replace a single named field inside an entry block
function replaceField(block: string, fieldName: string, newValue: string): string {
  const regex = new RegExp(`(    ${fieldName}:)([^\\n]+)(\\n)`, "m");
  if (!regex.test(block)) return block;
  return block.replace(regex, `$1 ${newValue},$3`);
}

// ── Apply fixes ───────────────────────────────────────────────────────────────
let fixCount = 0;
let skipCount = 0;

for (const [code, jc] of Object.entries(jsonCatalog)) {
  const bounds = findEntryBounds(src, code);
  if (!bounds) { skipCount++; continue; }

  const [start, end] = bounds;
  let block = src.slice(start, end);

  // Extract current values from block
  const nameMatch = block.match(/    name: "([^"]*)",/);
  const creditsMatch = block.match(/    credits: ([^,\n]+),/);
  const wokMatch = block.match(/    waysOfKnowing: (\[[^\]]*\]),/);
  const valMatch = block.match(/    values: (\[[^\]]*\]),/);
  const richMatch = block.match(/    richnesses: (\[[^\]]*\]),/);
  const addMatch = block.match(/    additional: (\[[^\]]*\]),/);

  let changed = false;
  const newName = jc.title.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  if (nameMatch && nameMatch[1] !== jc.title) {
    block = block.replace(/    name: "[^"]*",/, `    name: "${newName}",`);
    changed = true;
  }
  if (creditsMatch && parseFloat(creditsMatch[1]) !== jc.credits) {
    block = block.replace(/    credits: [^,\n]+,/, `    credits: ${jc.credits},`);
    changed = true;
  }
  if (wokMatch && wokMatch[1] !== tsArray(jc.wok)) {
    block = block.replace(/    waysOfKnowing: \[[^\]]*\],/, `    waysOfKnowing: ${tsArray(jc.wok)},`);
    changed = true;
  }
  if (valMatch && valMatch[1] !== tsArray(jc.values)) {
    block = block.replace(/    values: \[[^\]]*\],/, `    values: ${tsArray(jc.values)},`);
    changed = true;
  }
  if (richMatch && richMatch[1] !== tsArray(jc.richnesses)) {
    block = block.replace(/    richnesses: \[[^\]]*\],/, `    richnesses: ${tsArray(jc.richnesses)},`);
    changed = true;
  }
  if (addMatch && addMatch[1] !== tsArray(jc.additional)) {
    block = block.replace(/    additional: \[[^\]]*\],/, `    additional: ${tsArray(jc.additional)},`);
    changed = true;
  }

  if (changed) {
    src = src.slice(0, start) + block + src.slice(end);
    fixCount++;
  }
}

fs.writeFileSync(catalogPath, src, "utf8");
console.log(`\nDone. Fixed ${fixCount} entries. Skipped ${skipCount} (not in lib).`);
