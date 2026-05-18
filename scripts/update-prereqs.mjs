import { readFileSync, writeFileSync } from 'fs';

// Build prereq map: courseCode -> raw prerequisites string
const prereqData = JSON.parse(readFileSync('lib/prereq.json', 'utf8'));
const prereqMap = new Map();
for (const entry of prereqData) {
  const decoded = entry.course.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const m = decoded.match(/^([A-Z][A-Z&\-]*\s+\d+[A-Z]?)\s/);
  if (m) prereqMap.set(m[1].replace(/\s+/g, ' ').trim(), entry.prerequisites);
}

/**
 * Parse a raw prerequisite string into string[][] where:
 *   - Outer array elements are AND-connected (ALL groups must be satisfied)
 *   - Inner arrays are OR-alternatives (ANY ONE in the group satisfies it)
 *
 * Examples:
 *   "BIO 110 & 113 AND CHM 222; or permission of instructor"
 *     → [["BIO 110"], ["BIO 113"], ["CHM 222"]]  (all three required)
 *
 *   "CSC 110, CSC 111, CSC 121, or PHY 221, or permission of instructor"
 *     → [["CSC 110","CSC 111","CSC 121","PHY 221"]]  (any one suffices)
 *
 *   "BIO 201, PSY 100, CHM 113, and NUR 110 with grade C+"
 *     → [["BIO 201"],["PSY 100"],["CHM 113"],["NUR 110"]]  (all four AND)
 */
function parsePrereqStructure(raw) {
  if (!raw) return [];

  let text = raw;

  // ── Strip non-trackable clauses ───────────────────────────────────────
  // "or permission of instructor" (with optional "the")
  text = text.replace(/,?\s*(?:or\s+)?permission\s+of\s+(?:the\s+)?instructor/gi, '');
  // Grade conditions: "with a [final] grade of X or higher" / "with a grade of ≥X"
  text = text.replace(/\s+with\s+a\s+(?:final\s+)?grade\s+of\s+\w[\w+]*/gi, '');
  text = text.replace(/\s+or\s+higher/gi, '');
  // "(or waiver)" and "or waiver"
  text = text.replace(/\(\s*or\s+waiver\s*\)/gi, '');
  text = text.replace(/\s+or\s+waiver/gi, '');
  // Co-requisite clauses ("Pre or co-requisite: X", "Co-requisite: X")
  text = text.replace(/\.?\s*(?:Pre\s+or\s+)?[Cc]o-?requisite[s]?:.*$/gi, '');
  // Standing requirements (e.g. "sophomore standing", "junior status")
  text = text.replace(
    /,?\s*(?:and\s+)?(?:sophomore|junior|senior|freshman|first|second|third|fourth)[-\s]?(?:year|standing|status|level)[^;,]*/gi,
    ''
  );
  // Trailing level descriptions after semicolons ("a junior-level course")
  text = text.replace(/;\s*(?:a\s+)?[^;]*(?:level|year)\s+course[^;]*/gi, '');
  // Developmental math — remove the course code only, not what follows it
  // e.g. "Completion of MAT 012 (or wavier) AND CSC 110" → " AND CSC 110"
  text = text.replace(/\(?[Cc]ompletion\s+(?:or\s+waiver\s+of\s+)?MAT\s+0\d+[A-Z]?[^)]*\)?/gi, '');
  text = text.replace(/\bMAT\s+0\d+[A-Z]?\b/gi, '');

  // Take only the first clause (before ';')
  text = text.split(';')[0];

  // Remove leading logical connectors ("AND foo" at the start)
  text = text.replace(/^\s*(?:AND|and)\s+/, '');

  // Clean up stray punctuation
  text = text.replace(/\(\s*\)/g, '').replace(/,\s*,/g, ',').trim();
  text = text.replace(/[,\s]+$/, '').trim();

  if (!text || text.length < 3) return [];

  // ── Detect OR vs AND ──────────────────────────────────────────────────
  // If "or" appears in the remaining text, the whole thing is a list of
  // OR-alternatives.  Otherwise every code is AND-required.
  const hasOr = /\bor\b/i.test(text);

  // ── Extract course codes (with implicit dept continuation) ────────────
  const codes = [];
  let lastDept = '';

  // Tokenise by AND/& and OR separators, keeping the separator character
  // so we know the connector type.
  // We work left-to-right scanning for full codes and implicit continuations.
  const codeRe = /\b([A-Z][A-Z&\/\-]*)\s+(\d{3}[A-Z]?)\b|[&]\s*(\d{3}[A-Z]?)\b/g;
  let m;
  while ((m = codeRe.exec(text)) !== null) {
    if (m[1] && m[2]) {
      // Full code: "BIO 110", "HIS/AFR 165", "L&I 100"
      const num = m[2];
      if (num.startsWith('0')) { lastDept = ''; continue; } // skip 0xx
      const depts = m[1].split('/');
      lastDept = depts[depts.length - 1]; // last dept in cross-listed "HIS/AFR"
      codes.push(`${lastDept} ${num}`);
    } else if (m[3] && lastDept) {
      // Implicit dept: "& 113" following "BIO 110" → "BIO 113"
      const num = m[3];
      if (!num.startsWith('0')) codes.push(`${lastDept} ${num}`);
    }
  }

  const unique = [...new Set(codes)];
  if (unique.length === 0) return null;

  if (unique.length === 1) return unique[0]; // bare string for a single prereq

  if (hasOr) {
    return { type: "OR", courses: unique };
  } else {
    return { type: "AND", courses: unique };
  }
}

/** Serialize a PrereqNode to TypeScript literal syntax (for course-catalog.ts). */
function fmtNode(node) {
  if (node === null || node === undefined) return 'undefined';
  if (typeof node === 'string') return `"${node}"`;
  const courses = Array.isArray(node.courses) ? node.courses : [];
  const inner = courses.map(c => fmtNode(c)).join(', ');
  return `{ type: "${node.type}", courses: [${inner}] }`;
}

// ── Patch course-catalog.ts ───────────────────────────────────────────────

const raw = readFileSync('lib/course-catalog.ts', 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(eol);

const courseStartRe = /^  "([^"]+)": \{$/;
const courseEndRe   = /^  \},$/;
// Matches any existing prerequisites line regardless of format
const prereqLineRe  = /^    prerequisites:.*,?$/;

const output = [];
let inCourse = false;
let currentCode = '';
let blockLines = [];
let stats = { updated: 0, commentedOut: 0 };

function flushBlock(inPrereq) {
  if (!inPrereq) {
    for (const l of blockLines) output.push('// ' + l);
    stats.commentedOut++;
    return;
  }

  const prereqStr = prereqMap.get(currentCode);
  const node = parsePrereqStructure(prereqStr);

  for (const l of blockLines) {
    if (prereqLineRe.test(l)) {
      // When there are no prerequisites, omit the field entirely (it's optional in TypeScript).
      // When there are prerequisites, write the tree structure.
      if (node !== null && node !== undefined) {
        output.push(`    prerequisites: ${fmtNode(node)},`);
      }
      // null → drop the line; previously-absent fields stay absent
      stats.updated++;
    } else {
      output.push(l);
    }
  }
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
console.log(`Updated ${stats.updated} courses, commented out ${stats.commentedOut}.`);
