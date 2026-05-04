import { COURSE_CATALOG } from "../lib/course-catalog";
const courses = ["MAT 216", "CSC 226", "CSC 493", "CSC 440", "ETAD 265", "BIO 330"];
for (const c of courses) {
  const d = COURSE_CATALOG[c];
  if (d) console.log(c + ":", d.prerequisites);
}
