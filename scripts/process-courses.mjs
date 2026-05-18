import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Perspective code → field mapping
const WOK_MAP = {
  HUM: "Humanities",
  APPD: "Applied Studies",
  APST: "Applied Studies",
  CRTA: "Creative Arts",
  NSR: "Natural Science",
  NS: "Natural Science",
  NATS: "Natural Science",
  SOC: "Social Science",
  SOCP: "Social Science",
  SOCS: "Social Science",
  CES: "Cultural & Ethnic Studies",
  QUAN: "Quantitative Reasoning",
  HUMS: "Humanities",
  ARTS: "Creative Arts",
};

const VALUE_MAP = {
  BEYB: "Beyond the Borders",
  PEQ: "Power & Equity",
  HOW: "Holistic Wellness",
  SKM: "Seeking Meaning",
  SUS: "Sustainability",
};

const RICHNESS_MAP = {
  QUAR: "Quantitatively Rich",
  INTR: "Internationally Rich",
  WTR: "Writing",
  WR: "Writing",
};

function mapPerspectives(perspectives) {
  const waysOfKnowing = [];
  const values = [];
  const richnesses = [];
  const additional = [];

  for (const p of perspectives) {
    const code = p.code;
    if (WOK_MAP[code]) {
      const val = WOK_MAP[code];
      if (!waysOfKnowing.includes(val)) waysOfKnowing.push(val);
    } else if (VALUE_MAP[code]) {
      const val = VALUE_MAP[code];
      if (!values.includes(val)) values.push(val);
    } else if (RICHNESS_MAP[code]) {
      const val = RICHNESS_MAP[code];
      if (!richnesses.includes(val)) richnesses.push(val);
    } else if (code !== "WORL") {
      // WORL is just a world area requirement, skip it; add everything else
      if (!additional.includes(code)) additional.push(code);
    }
  }

  return { waysOfKnowing, values, richnesses, additional };
}

// Load all 4 JSON files
const files = [
  "berea_spring2025_courses.json",
  "berea_fall2025_courses.json",
  "berea_spring2026_courses.json",
  "berea_courses_with_perspectives-fall-26.json",
];

const allCourses = new Map(); // key: "SUBJ NUM"

for (const file of files) {
  const data = JSON.parse(readFileSync(join(root, "data/course-catalog", file), "utf8"));
  for (const course of data) {
    const key = `${course.subject} ${course.courseNumber}`;
    if (!allCourses.has(key)) {
      allCourses.set(key, course);
    }
  }
}

// Get existing keys from course-catalog.ts
const catalogContent = readFileSync(join(root, "lib/course-catalog.ts"), "utf8");
const existingKeys = new Set();
const keyRegex = /"([A-Z][A-Z&]*\s+[\dA-Z]+[A-Z]*)"\s*:/g;
let m;
while ((m = keyRegex.exec(catalogContent)) !== null) {
  existingKeys.add(m[1]);
}

console.log(`Existing courses: ${existingKeys.size}`);
console.log(`Total from JSON files: ${allCourses.size}`);

// Generate TypeScript entries for new courses
const newEntries = [];
for (const [key, course] of allCourses) {
  if (existingKeys.has(key)) continue;

  const { waysOfKnowing, values, richnesses, additional } = mapPerspectives(course.perspectives || []);
  const name = course.courseTitle
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/"/g, '\\"');

  const entry = `  "${key}": {
    code: "${key}",
    name: "${name}",
    credits: ${course.credits},
    prerequisites: [],
    waysOfKnowing: ${JSON.stringify(waysOfKnowing)},
    values: ${JSON.stringify(values)},
    richnesses: ${JSON.stringify(richnesses)},
    additional: ${JSON.stringify(additional)},
  },`;
  newEntries.push(entry);
}

console.log(`New courses to add: ${newEntries.length}`);
writeFileSync(join(root, "scripts/new-courses.txt"), newEntries.join("\n"), "utf8");
console.log("Written to scripts/new-courses.txt");
