// Sorts all entries in lib/course-catalog.ts alphabetically by course code.
// Run: npx tsx scripts/sort-catalog.ts
import * as fs from "fs";
import * as path from "path";

const catalogPath = path.resolve("lib/course-catalog.ts");
const src = fs.readFileSync(catalogPath, "utf8");

// Find the opening brace of the COURSE_CATALOG object
const catalogStart = src.indexOf("export const COURSE_CATALOG");
const openBrace = src.indexOf("{", catalogStart);
const closeBrace = src.lastIndexOf("};");

const header = src.slice(0, openBrace + 1); // everything up to and including the `{`
const footer = src.slice(closeBrace);        // `};` and anything after

const body = src.slice(openBrace + 1, closeBrace);

// Extract individual course entries.
// Each entry looks like:  "CODE": {\n    ...\n  },
// Strategy: scan char by char tracking brace depth; collect each top-level key-value pair.
const entries: { code: string; text: string }[] = [];

let i = 0;
while (i < body.length) {
  // Skip whitespace and comments
  const commentMatch = body.slice(i).match(/^(\s*\/\/[^\n]*\n)/);
  if (commentMatch) { i += commentMatch[0].length; continue; }

  // Look for a quoted key
  const keyMatch = body.slice(i).match(/^(\s*"([^"]+)":\s*\{)/);
  if (!keyMatch) { i++; continue; }

  const code = keyMatch[2];
  const entryStart = i;
  i += keyMatch[0].length;

  // Now find the matching closing brace (depth started at 1 for the `{` we just passed)
  let depth = 1;
  while (i < body.length && depth > 0) {
    if (body[i] === "{") depth++;
    else if (body[i] === "}") depth--;
    i++;
  }
  // Consume optional comma + newline
  if (body[i] === ",") i++;
  if (body[i] === "\n") i++;

  const text = body.slice(entryStart, i).trimStart();
  entries.push({ code, text });
}

// Sort alphabetically by course code
entries.sort((a, b) => {
  // Split into dept prefix and number, e.g. "CSC 236" → ["CSC", 236]
  const parse = (code: string) => {
    const m = code.match(/^([A-Z&]+(?:\s+[A-Z]+)?)\s+(.+)$/);
    if (!m) return [code, ""];
    return [m[1], m[2]];
  };
  const [deptA, numA] = parse(a.code);
  const [deptB, numB] = parse(b.code);
  if (deptA !== deptB) return (deptA as string).localeCompare(deptB as string);
  return (numA as string).localeCompare(numB as string, undefined, { numeric: true });
});

const newBody = entries.map(e => "  " + e.text.replace(/\n/g, "\n")).join("\n");
const result = header + "\n" + newBody + "\n" + footer;

fs.writeFileSync(catalogPath, result, "utf8");
console.log(`Sorted ${entries.length} entries alphabetically.`);
