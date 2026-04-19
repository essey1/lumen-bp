#!/usr/bin/env node
/**
 * Banner Course Importer
 *
 * Usage:
 *   node scripts/import-banner-courses.mjs <path-to-banner-html-file>
 *
 * Steps:
 *   1. Go to the Berea Banner class listing page in your browser
 *   2. Save the page as HTML (Ctrl+S → "Webpage, HTML Only")
 *   3. Run: node scripts/import-banner-courses.mjs ~/Downloads/banner-courses.html
 *
 * The script will parse all courses, skip duplicates already in the catalog,
 * and append new entries to lib/course-catalog.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = resolve(__dirname, "../lib/course-catalog.ts");

// ─── Attribute mapping ────────────────────────────────────────────────────────
// Maps Banner attribute text → Course type fields
// Attributes from the old curriculum (not in GEM) are ignored.

const WOK_MAP = {
  "applied disciplines-wok":        ["Applied Studies"],
  "applied studies-wok":            ["Applied Studies"],
  "creative arts-wok":              ["Creative Arts"],
  "cultural & ethnic studies-wok":  ["Cultural & Ethnic Studies"],
  "cultural and ethnic studies-wok":["Cultural & Ethnic Studies"],
  "humanities-wok":                 ["Humanities"],
  "quantitative reasoning-wok":     ["Quantitative Reasoning"],
  "natural sciences-wok":           ["Natural Science"],
  "natural science-wok":            ["Natural Science"],
  "social sciences-wok":            ["Social Science"],
  "social science-wok":             ["Social Science"],
};

const RICHNESS_MAP = {
  "internationally rich":           ["Internationally Rich"],
  "quantitatively rich":            ["Quantitatively Rich"],
  "writing rich":                   ["Writing"],
  "writing-rich":                   ["Writing"],
};

const VALUE_MAP = {
  "beyond the borders":             ["Beyond the Borders"],
  "holistic wellness":              ["Holistic Wellness"],
  "power & equity":                 ["Power & Equity"],
  "power and equity":               ["Power & Equity"],
  "seeking meaning":                ["Seeking Meaning"],
  "sustainability":                 ["Sustainability"],
};

const ADDITIONAL_MAP = {
  "ale":                            ["ALE"],
  "academic life experience":       ["ALE"],
  "physical activity":              ["Physical Activity"],
};

// Old curriculum labels to silently ignore
const IGNORED_ATTRS = new Set([
  "afr amer,appal,women perspect",
  "world cultural area req",
  "international-non-western pers",
  "labor/service learning perspective",
  "scientific/empirical persp",
  "religious/philosophical persp",
  "social systemic analysis persp",
  "humanities perspective",
  "scientific perspective",
  "labor perspective",
  "quantitative perspective",
  "written communication perspect",
  "arts & literature perspective",
  "appalachian perspective",
  "gender perspective",
]);

// L&I courses — tracked separately, not added as regular WoK
const LI_ATTRS = new Set([
  "l&i 100: explorations",
  "l&i 200: discoveries",
  "l&i 300: intersectional justice in u.s.",
  "l&i 400: global issues",
  "explorations",
  "discoveries",
  "intersectional justice in u.s.",
  "global issues",
]);

// ─── HTML parser ──────────────────────────────────────────────────────────────

/**
 * Minimal HTML tag stripper — no external deps needed.
 * Also decodes common HTML entities.
 */
function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Parse Banner class listing HTML.
 *
 * Banner renders a <table> where each row contains:
 *   Select | CRN | Subj | Crse | Sec | ... | Title | ... | Credit | ... | Attribute
 *
 * We look for <tr> rows with class "dddefault" or "ddaltrow" containing
 * course data, then extract Subject + Course Number + Title + Credits + Attributes.
 *
 * Multiple sections of the same course are deduplicated.
 */
function parseBannerHTML(html) {
  const courses = new Map(); // key: "SUBJ NNN" → course object

  // Find all table rows
  const rowPattern = /<tr[^>]*class=["']dd(?:default|altrow)["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHTML = rowMatch[1];

    // Extract all <td> cells
    const cells = [];
    const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowHTML)) !== null) {
      cells.push(stripTags(cellMatch[1]).replace(/\s+/g, " ").trim());
    }

    if (cells.length < 7) continue;

    // Banner column layout (0-indexed after the checkbox column):
    // 0: select checkbox  1: CRN  2: Subj  3: Crse  4: Sec  5: Cmp
    // 6: Bas  7: Credits  8: Days  9: Time  10: Cap  11: Act  12: Rem
    // 13: WL Cap  14: WL Act  15: WL Rem  16: XL Cap  17: XL Act  18: XL Rem
    // 19: Instructor  20: Date  21: Location  22: Attribute
    //
    // Positions can shift slightly depending on the term/settings.
    // We detect by looking for a 2-3 letter subject code in a cell.

    let subj = "", crse = "", title = "", credits = "1", attrText = "";

    // Try to find subject (2-4 uppercase letters), course number (3 digits)
    // and title from the row. Banner puts subject in col 2, course in col 3,
    // title in a separate cell that's often a link.

    // Detect subject column: first cell that looks like a dept code
    let subjIdx = -1;
    for (let i = 0; i < Math.min(cells.length, 6); i++) {
      if (/^[A-Z]{2,6}$/.test(cells[i])) {
        subjIdx = i;
        break;
      }
    }
    if (subjIdx === -1) continue;

    subj = cells[subjIdx];
    crse = cells[subjIdx + 1] || "";
    if (!/^\d{3}[A-Z]?$/.test(crse)) continue; // not a valid course number

    // Title: look for a cell that contains a <a> tag (the course title link)
    // After stripping tags it'll just be the title text. We search after crse index.
    // In practice Banner puts it a few cells after the section info.
    // We scan forward for the first non-numeric, non-single-char cell.
    for (let i = subjIdx + 2; i < cells.length; i++) {
      const c = cells[i];
      // Skip section letters, campus codes, credit hours (numbers)
      if (c.length === 0) continue;
      if (/^\d+(\.\d+)?$/.test(c)) {
        // This is likely credits
        const v = parseFloat(c);
        if (v >= 0.25 && v <= 4) credits = c;
        continue;
      }
      if (c.length <= 2) continue;
      // Skip day/time patterns
      if (/^[MTWRFSU ]+$/.test(c)) continue;
      if (/\d{4}-\d{4}/.test(c)) continue;
      // This looks like the title
      if (title === "") {
        title = c;
        break;
      }
    }

    if (!title) continue;

    // Attribute: usually the LAST non-empty cell, or look for known keywords
    // Multiple attributes are often in one cell separated by newlines or commas,
    // or in separate rows following the main row.
    for (let i = cells.length - 1; i >= subjIdx + 3; i--) {
      const c = cells[i];
      if (c.length < 3) continue;
      // Check if it looks like an attribute (contains known keywords)
      const lower = c.toLowerCase();
      if (
        lower.includes("wok") ||
        lower.includes("rich") ||
        lower.includes("borders") ||
        lower.includes("wellness") ||
        lower.includes("equity") ||
        lower.includes("meaning") ||
        lower.includes("sustainability") ||
        lower.includes("ale") ||
        lower.includes("physical activity") ||
        lower.includes("perspective") ||
        lower.includes("l&i") ||
        lower.includes("explorations") ||
        lower.includes("discoveries")
      ) {
        attrText = c;
        break;
      }
    }

    const key = `${subj} ${crse}`;
    if (courses.has(key)) {
      // Merge attributes from different sections
      const existing = courses.get(key);
      if (attrText && !existing.attrText.includes(attrText)) {
        existing.attrText += "\n" + attrText;
      }
    } else {
      courses.set(key, {
        subj, crse, title,
        credits: parseFloat(credits) || 1,
        attrText,
      });
    }
  }

  return courses;
}

/**
 * Alternative parser for Banner HTML that uses a different row format.
 * Some Banner versions use a table with headers and then data rows where
 * each course section gets its own row including the title.
 */
function parseBannerHTMLAlternative(html) {
  const courses = new Map();

  // Look for patterns like:
  // <td ...>SUBJ</td><td ...>NNN</td> ... <td ...>Title</td>
  // This regex is more lenient
  const pattern = /\b([A-Z]{2,6})\s+(\d{3}[A-Z]?)\b/g;
  let match;
  const seen = new Set();

  while ((match = pattern.exec(html)) !== null) {
    const subj = match[1];
    const crse = match[2];
    const key = `${subj} ${crse}`;

    if (seen.has(key)) continue;
    seen.add(key);

    // Extract surrounding context (500 chars) to find title and attributes
    const start = Math.max(0, match.index - 100);
    const end = Math.min(html.length, match.index + 800);
    const context = html.slice(start, end);

    // Try to find title in nearby <a> tags or table cells
    const titleMatch = context.match(/<a[^>]*>([^<]{3,80})<\/a>/i) ||
                       context.match(/<td[^>]*>\s*([A-Z][^<]{3,60})\s*<\/td>/i);
    const title = titleMatch ? stripTags(titleMatch[1]).trim() : "";
    if (!title || title === subj) continue;

    // Extract attributes
    let attrText = "";
    const attrMatches = [...context.matchAll(/(?:WoK|Rich|Borders|Wellness|Equity|Meaning|Sustainability|ALE|Physical Activity)[^<]*/gi)];
    if (attrMatches.length > 0) {
      attrText = attrMatches.map(m => m[0].trim()).join("\n");
    }

    courses.set(key, {
      subj, crse, title,
      credits: 1,
      attrText,
    });
  }

  return courses;
}

// ─── Attribute mapper ─────────────────────────────────────────────────────────

function mapAttributes(attrText) {
  const waysOfKnowing = [];
  const values = [];
  const richnesses = [];
  const additional = [];

  if (!attrText) return { waysOfKnowing, values, richnesses, additional };

  // Split on common delimiters: newline, comma, semicolon, pipe
  const parts = attrText.split(/[\n,;|]+/).map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    const lower = part.toLowerCase().trim();

    if (IGNORED_ATTRS.has(lower)) continue;
    if (LI_ATTRS.has(lower)) continue;

    const wok = WOK_MAP[lower];
    if (wok) {
      for (const w of wok) {
        if (!waysOfKnowing.includes(w)) waysOfKnowing.push(w);
      }
      continue;
    }

    const richness = RICHNESS_MAP[lower];
    if (richness) {
      for (const r of richness) {
        if (!richnesses.includes(r)) richnesses.push(r);
      }
      continue;
    }

    const value = VALUE_MAP[lower];
    if (value) {
      for (const v of value) {
        if (!values.includes(v)) values.push(v);
      }
      continue;
    }

    const add = ADDITIONAL_MAP[lower];
    if (add) {
      for (const a of add) {
        if (!additional.includes(a)) additional.push(a);
      }
      continue;
    }

    // Fuzzy match: check if the part contains known keywords
    for (const [key, mapped] of Object.entries(WOK_MAP)) {
      if (lower.includes(key.replace("-wok", "")) && lower.includes("wok")) {
        for (const w of mapped) {
          if (!waysOfKnowing.includes(w)) waysOfKnowing.push(w);
        }
      }
    }
  }

  return { waysOfKnowing, values, richnesses, additional };
}

// ─── TypeScript generator ─────────────────────────────────────────────────────

function tsList(arr) {
  if (arr.length === 0) return "[]";
  return `[${arr.map(s => `"${s}"`).join(", ")}]`;
}

function generateEntry(key, course) {
  const { waysOfKnowing, values, richnesses, additional } = mapAttributes(course.attrText);
  return `  "${key}": {
    code: "${key}",
    name: "${course.title.replace(/"/g, '\\"')}",
    credits: ${course.credits},
    prerequisites: [],
    waysOfKnowing: ${tsList(waysOfKnowing)},
    values: ${tsList(values)},
    richnesses: ${tsList(richnesses)},
    additional: ${tsList(additional)},
  },`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(`
Usage: node scripts/import-banner-courses.mjs <html-file>

Steps:
  1. Open the Banner class listing in your browser
     (select All subjects, your term, hit "Class Search")
  2. Save the page: Ctrl+S → "Webpage, HTML Only" (saves a .html file)
  3. Run this script pointing at that file:
     node scripts/import-banner-courses.mjs ~/Downloads/banner.html

The script will:
  - Parse all courses and their GEM attributes
  - Skip courses already in lib/course-catalog.ts
  - Append new courses grouped by department
`);
  process.exit(1);
}

const htmlFile = resolve(args[0]);
console.log(`Reading: ${htmlFile}`);

let html;
try {
  html = readFileSync(htmlFile, "utf8");
} catch (e) {
  console.error(`Cannot read file: ${e.message}`);
  process.exit(1);
}

// Read existing catalog to find duplicates
const catalogSource = readFileSync(CATALOG_PATH, "utf8");
const existingKeys = new Set(
  [...catalogSource.matchAll(/"([A-Z]{2,6} \d{3}[A-Z]?)"\s*:/g)].map(m => m[1])
);
console.log(`Existing catalog entries: ${existingKeys.size}`);

// Parse Banner HTML
let parsed = parseBannerHTML(html);
console.log(`Parsed (primary method): ${parsed.size} unique courses`);

if (parsed.size < 5) {
  console.log("Low results — trying alternative parser...");
  parsed = parseBannerHTMLAlternative(html);
  console.log(`Parsed (alternative method): ${parsed.size} unique courses`);
}

// Filter out duplicates
const newCourses = new Map();
for (const [key, course] of parsed) {
  if (!existingKeys.has(key)) {
    newCourses.set(key, course);
  }
}

console.log(`New courses to add: ${newCourses.size}`);

if (newCourses.size === 0) {
  console.log("Nothing new to add. All parsed courses are already in the catalog.");
  process.exit(0);
}

// Group by department
const byDept = new Map();
for (const [key, course] of newCourses) {
  const dept = course.subj;
  if (!byDept.has(dept)) byDept.set(dept, []);
  byDept.get(dept).push([key, course]);
}

// Sort departments and courses within each dept
const sortedDepts = [...byDept.keys()].sort();

// Build the TypeScript block to insert
let insertBlock = "\n";
for (const dept of sortedDepts) {
  const deptCourses = byDept.get(dept).sort((a, b) => a[0].localeCompare(b[0]));
  insertBlock += `\n  // ${dept} Courses\n`;
  for (const [key, course] of deptCourses) {
    insertBlock += generateEntry(key, course) + "\n";
    console.log(`  + ${key}: ${course.title}`);
  }
}

// Insert before the closing `};` of COURSE_CATALOG
const insertPoint = catalogSource.lastIndexOf("\n};");
if (insertPoint === -1) {
  console.error("Could not find insertion point in course-catalog.ts");
  process.exit(1);
}

const newCatalog =
  catalogSource.slice(0, insertPoint) +
  insertBlock +
  catalogSource.slice(insertPoint);

writeFileSync(CATALOG_PATH, newCatalog, "utf8");
console.log(`\nDone. Added ${newCourses.size} courses to lib/course-catalog.ts`);
console.log("Run `npx tsc --noEmit` to verify no type errors.");
