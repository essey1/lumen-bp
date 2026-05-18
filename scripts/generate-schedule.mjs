import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../data');
const outputFile = join(__dirname, '../lib/course-schedule-data.ts');

// Index mapping: 0=Fall25, 1=Spr26, 2=Fall26, 3=Spr27, 4=Fall27, 5=Spr28
// Indices 6 and 7 (Fall28, Spr29) are extrapolated from 2 and 3
const SEMESTER_LABEL_TO_IDX = {
  'Fall 25': 0, 'Spr 26': 1, 'Fall 26': 2,
  'Spr 27': 3, 'Fall 27': 4, 'Spr 28': 5,
};

const courseSchedule = {};

const csvFiles = readdirSync(dataDir).filter(f => f.endsWith('.csv'));

for (const file of csvFiles) {
  let content;
  try {
    content = readFileSync(join(dataDir, file), 'utf-8');
  } catch (e) {
    console.warn(`Could not read ${file}: ${e.message}`);
    continue;
  }

  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) continue;

  const header = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));

  const colToSemIdx = {};
  for (let col = 1; col < header.length; col++) {
    const label = header[col];
    if (label in SEMESTER_LABEL_TO_IDX) colToSemIdx[col] = SEMESTER_LABEL_TO_IDX[label];
  }

  if (Object.keys(colToSemIdx).length === 0) continue;

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/\r/g, ''));
    if (!parts[0]) continue;

    // Strip cross-listing suffixes like "(BUS)", "(CFS)"
    const courseCode = parts[0].replace(/\s*\([^)]+\)\s*$/, '').trim();

    // Only process real course codes (e.g. "PSY 100", "CSC 226")
    if (!/^[A-Z]{2,6}\s+\d{3}[A-Z]?$/.test(courseCode)) continue;

    if (!courseSchedule[courseCode]) courseSchedule[courseCode] = [0, 0, 0, 0, 0, 0, 0, 0];

    for (const [col, semIdx] of Object.entries(colToSemIdx)) {
      if (parseInt(parts[parseInt(col)] || '0') === 1) {
        courseSchedule[courseCode][parseInt(semIdx)] = 1;
      }
    }
  }
}

// Extrapolate Year 4 semesters from Year 2 (2-year repeating cycle)
for (const avail of Object.values(courseSchedule)) {
  avail[6] = avail[2]; // Fall 28 ≈ Fall 26
  avail[7] = avail[3]; // Spr 29 ≈ Spr 27
}

const entries = Object.entries(courseSchedule)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([code, avail]) => `  "${code}": [${avail.join(', ')}]`)
  .join(',\n');

const output = `// Auto-generated from data/*.csv — do not edit manually
// Index: 0=Fall25, 1=Spr26, 2=Fall26, 3=Spr27, 4=Fall27, 5=Spr28, 6=Fall28, 7=Spr29
// 1 = offered, 0 = not offered

export const COURSE_SCHEDULE: Record<string, number[]> = {
${entries}
};

export function isCourseAvailable(courseCode: string, semesterIndex: number): boolean {
  const s = COURSE_SCHEDULE[courseCode];
  if (!s) return true; // no data → assume available
  return s[semesterIndex] === 1;
}

export function nextAvailableSemester(courseCode: string, fromIndex: number): number {
  const s = COURSE_SCHEDULE[courseCode];
  if (!s) return fromIndex;
  for (let i = fromIndex; i < 8; i++) {
    if (s[i] === 1) return i;
  }
  return -1;
}
`;

writeFileSync(outputFile, output, 'utf-8');
console.log(`Generated ${Object.keys(courseSchedule).length} courses → lib/course-schedule-data.ts`);
