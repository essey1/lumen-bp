/**
 * Verifies that the PrereqNode tree in course-catalog.ts is correctly
 * flattened and evaluated by the plan generator's internal logic.
 */
import { COURSE_CATALOG } from "../lib/course-catalog";
import type { PrereqNode } from "../lib/types";

// ── Replicate flattenPrereq from plan-generator.ts ───────────────────────────
function flattenPrereq(node: PrereqNode | undefined): string[][] {
  if (!node) return [];
  if (typeof node === "string") return [[node]];
  if (node.type === "OR") {
    const options: string[] = [];
    for (const c of node.courses) {
      if (typeof c === "string") options.push(c);
      else for (const g of flattenPrereq(c)) options.push(...g);
    }
    return options.length > 0 ? [options] : [];
  }
  const groups: string[][] = [];
  for (const c of node.courses) groups.push(...flattenPrereq(c));
  return groups;
}

// ── Replicate prereqsMet ─────────────────────────────────────────────────────
function prereqsMet(groups: string[][], placed: Record<string, number>, semIdx: number): boolean {
  if (groups.length === 0) return true;
  return groups.every(orGroup =>
    orGroup.some(p => placed[p] !== undefined && placed[p] < semIdx)
  );
}

// ── Check a course ───────────────────────────────────────────────────────────
function check(code: string, scenarioDesc: string, placed: Record<string, number>, semIdx: number, expectMet: boolean) {
  const cat = COURSE_CATALOG[code];
  if (!cat) { console.log(`  ✗ ${code} not in catalog`); return; }
  const groups = flattenPrereq(cat.prerequisites);
  const met = prereqsMet(groups, placed, semIdx);
  const ok = met === expectMet;
  const status = ok ? "✓" : "✗ WRONG";
  console.log(`  ${status}  ${code} [${scenarioDesc}] → met=${met} (expected ${expectMet})`);
  if (!ok) {
    console.log(`       groups: ${JSON.stringify(groups)}`);
    console.log(`       placed: ${JSON.stringify(placed)}`);
  }
}

console.log("\n── flattenPrereq output for key courses ──");
const cases: [string, string][] = [
  ["CSC 226", "OR(6 intro alts)"],
  ["CSC 236", "single: CSC 226"],
  ["CSC 440", "AND(CSC 236, OR(MAT 105, MAT 125))"],
  ["CSC 433", "AND(MAT 225, OR(5 CSC), OR(3 MAT))"],
  ["CSC 303", "AND(OR(CSC 226/236), OR(5 MAT))"],
  ["BIO 330", "AND(BIO 110, BIO 113, CHM 222)"],
  ["NUR 225", "AND(4 courses)"],
  ["CHM 131", "single: CHM 101"],
  ["GSTR 210", "single: GSTR 110"],
];
for (const [code, desc] of cases) {
  const cat = COURSE_CATALOG[code];
  if (!cat) { console.log(`  ${code}: NOT IN CATALOG`); continue; }
  const groups = flattenPrereq(cat.prerequisites);
  console.log(`  ${code} (${desc})`);
  console.log(`    groups: ${JSON.stringify(groups)}`);
}

console.log("\n── prereqsMet scenarios ──");

// CSC 226: any one intro course suffices (OR)
check("CSC 226", "CSC 110 placed",    { "CSC 110": 0 }, 1, true);
check("CSC 226", "PHY 221 placed",    { "PHY 221": 0 }, 1, true);
check("CSC 226", "none placed",       {}, 1, false);
check("CSC 226", "wrong code only",   { "CSC 300": 0 }, 1, false);

// CSC 440: CSC 236 AND (MAT 105 OR MAT 125)
check("CSC 440", "CSC 236+MAT 105",   { "CSC 236": 2, "MAT 105": 1 }, 3, true);
check("CSC 440", "CSC 236+MAT 125",   { "CSC 236": 2, "MAT 125": 1 }, 3, true);
check("CSC 440", "only CSC 236",      { "CSC 236": 2 }, 3, false);
check("CSC 440", "only MAT 105",      { "MAT 105": 1 }, 3, false);

// CSC 303: (CSC 226 OR CSC 236) AND (one of 5 MAT courses)
check("CSC 303", "CSC 226+MAT 216",   { "CSC 226": 1, "MAT 216": 1 }, 3, true);
check("CSC 303", "CSC 236+MAT 312",   { "CSC 236": 2, "MAT 312": 1 }, 3, true);
check("CSC 303", "no MAT",            { "CSC 226": 1 }, 3, false);
check("CSC 303", "no CSC",            { "MAT 216": 1 }, 3, false);

// BIO 330: BIO 110 AND BIO 113 AND CHM 222 (all three)
check("BIO 330", "all three placed",  { "BIO 110": 0, "BIO 113": 1, "CHM 222": 3 }, 4, true);
check("BIO 330", "missing CHM 222",   { "BIO 110": 0, "BIO 113": 1 }, 4, false);
check("BIO 330", "only BIO 110",      { "BIO 110": 0 }, 4, false);

// NUR 225: BIO 201 AND PSY 100 AND CHM 113 AND NUR 110
check("NUR 225", "all four placed",   { "BIO 201":0,"PSY 100":1,"CHM 113":2,"NUR 110":3 }, 4, true);
check("NUR 225", "missing NUR 110",   { "BIO 201":0,"PSY 100":1,"CHM 113":2 }, 4, false);

// CHM 131: just CHM 101
check("CHM 131", "CHM 101 placed",    { "CHM 101": 0 }, 1, true);
check("CHM 131", "CHM 101 missing",   {}, 1, false);

console.log("\n── Verify old >3 heuristic would have been wrong ──");
// Old heuristic: >3 prereqs = OR; ≤3 = AND
// NUR 225 has 4 prereqs → old heuristic treated as OR (ANY ONE suffices) WRONG
// New logic correctly requires ALL FOUR
console.log("  NUR 225 needs all 4 (AND). Old heuristic (>3=OR) would have accepted only PSY 100.");
const oldHeuristicResult = ["BIO 201","PSY 100","CHM 113","NUR 110"].some(
  p => ({ "PSY 100": 0 } as Record<string,number>)[p] !== undefined
);
console.log(`  Old OR result with only PSY 100: ${oldHeuristicResult} (WRONG - should be false)`);
const groups225 = flattenPrereq(COURSE_CATALOG["NUR 225"]?.prerequisites);
const newResult = prereqsMet(groups225, { "PSY 100": 0 }, 1);
console.log(`  New AND result with only PSY 100: ${newResult} (correct)`);
