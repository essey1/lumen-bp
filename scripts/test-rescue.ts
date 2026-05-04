import { COURSE_CATALOG } from "../lib/course-catalog";
import { MINORS } from "../lib/minors-data";

for (const code of ["MAT 105","MAT 110","MAT 125","MAT 315","MAT 330","MAT 135"]) {
  const d = COURSE_CATALOG[code];
  if (d) console.log(code, `"${d.name}"`, "prereqs:", d.prerequisites);
  else console.log(code, "NOT IN CATALOG");
}

console.log("\nMAT minor:");
const mat = MINORS["MAT"];
if (mat) for (const r of mat.requirements) console.log(" ", r.category, r.mustInclude ?? r.courses.slice(0,4));
