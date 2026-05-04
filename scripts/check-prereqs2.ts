import { COURSE_CATALOG } from "../lib/course-catalog";
import prereqData from "../lib/prereq.json";

const show = ["CSC 226","CSC 493","BIO 330","CHM 221","PSY 207","MAT 312","NUR 225","GSTR 210"];
for (const code of show) {
  const cat = COURSE_CATALOG[code];
  const entry = (prereqData as any[]).find((x: any) => x.course.startsWith(code));
  console.log(`\n${code}:`);
  console.log("  catalog prereqs:", cat?.prerequisites);
  console.log("  raw text:", entry?.prerequisites);
}
