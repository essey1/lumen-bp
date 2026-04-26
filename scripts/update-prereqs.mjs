import { readFileSync, writeFileSync } from 'fs';

// Build prereq map: courseCode -> prerequisites string or null
const prereqData = JSON.parse(readFileSync('lib/prereq.json', 'utf8'));
const prereqMap = new Map();
for (const entry of prereqData) {
  // Decode HTML entities before extracting the code
  const decoded = entry.course.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const m = decoded.match(/^([A-Z][A-Z&\-]*\s+\d+[A-Z]?)\s/);
  if (m) prereqMap.set(m[1].replace(/\s+/g, ' ').trim(), entry.prerequisites);
}

// Extract course codes from a prerequisites string.
// Skips codes whose number starts with 0 (e.g. MAT 010, MAT 012).
// Handles "DEPT/DEPT2 NNN" cross-listed format by taking the last dept.
function parsePrereqCodes(str) {
  if (!str) return [];
  const codes = new Set();

  // Match patterns like "BIO 110", "L&I 100", "HIS/AFR 165", "SOC/AFR 132"
  // Dept part: uppercase letters + & - /
  const re = /\b([A-Z][A-Z&\-]*(?:\/[A-Z][A-Z&\-]*)*)\s+(\d{3}[A-Z]?)\b/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    const num = m[2];
    if (num.startsWith('0')) continue; // ignore MAT 010, MAT 011, MAT 012, etc.
    // For cross-listed like "HIS/AFR", take the last dept code
    const depts = m[1].split('/');
    const dept = depts[depts.length - 1];
    codes.add(`${dept} ${num}`);
  }

  return [...codes];
}

// Process course-catalog.ts line by line (handle both CRLF and LF)
const raw = readFileSync('lib/course-catalog.ts', 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(eol);

const courseStartRe = /^  "([^"]+)": \{$/;
const courseEndRe = /^  \},$/;
const prereqLineRe = /^    prerequisites: \[.*\],?$/;

const output = [];
let inCourse = false;
let currentCode = '';
let blockLines = [];
let stats = { updated: 0, commentedOut: 0, unchanged: 0, notInPrereq: [] };

function flushBlock(inPrereq) {
  if (!inPrereq) {
    // Course not in prereq.json — comment out entire block
    for (const l of blockLines) output.push('// ' + l);
    stats.commentedOut++;
    stats.notInPrereq.push(currentCode);
    return;
  }

  const prereqStr = prereqMap.get(currentCode);
  const codes = parsePrereqCodes(prereqStr);

  let hadUpdate = false;
  for (const l of blockLines) {
    if (prereqLineRe.test(l)) {
      const indent = '    ';
      if (codes.length === 0) {
        output.push(`${indent}prerequisites: [],`);
      } else {
        const items = codes.map(c => `"${c}"`).join(', ');
        output.push(`${indent}prerequisites: [${items}],`);
      }
      hadUpdate = true;
    } else {
      output.push(l);
    }
  }
  if (hadUpdate) stats.updated++;
  else stats.unchanged++;
}

for (const line of lines) {
  const startMatch = line.match(courseStartRe);

  if (!inCourse && startMatch) {
    inCourse = true;
    currentCode = startMatch[1];
    blockLines = [line];
    continue;
  }

  if (inCourse) {
    blockLines.push(line);
    if (courseEndRe.test(line)) {
      inCourse = false;
      const inPrereq = prereqMap.has(currentCode);
      flushBlock(inPrereq);
      blockLines = [];
      currentCode = '';
    }
    continue;
  }

  output.push(line);
}

writeFileSync('lib/course-catalog.ts', output.join(eol));

console.log(`Updated:      ${stats.updated} courses`);
console.log(`Commented:    ${stats.commentedOut} courses`);
console.log(`\nCommented-out codes (not found in prereq.json):`);
for (const c of stats.notInPrereq) console.log(`  ${c}`);
