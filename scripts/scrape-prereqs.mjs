import { writeFileSync } from 'fs';

const BASE = 'https://berea.smartcatalogiq.com';

const DEPARTMENTS = [
  'afr-african-amer-studies',
  'anr-agriculture-natural-resource',
  'aps-appalachian-studies',
  'arh-art-history',
  'art-art',
  'ast-asian-studies',
  'bio-biology',
  'bus-business',
  'cfs-child-and-family-studies',
  'chi-chinese',
  'chm-chemistry',
  'cls-classical-studies',
  'com-communication',
  'csc-computer-science',
  'eco-economics',
  'eds-education-studies',
  'eng-english',
  'etad-engr-tech-applied-design',
  'frn-french',
  'geo',
  'ger-german',
  'grk-greek',
  'gst-general-studies',
  'gstr-general-studies-required',
  'heb-hebrew',
  'hhp-health-and-human-performance',
  'his-history',
  'hlt-health',
  'jpn-japanese',
  'l-i-learning-inquiry',
  'lat-latin',
  'les-law-ethics-and-society',
  'mat-math',
  'mus-music',
  'nur-nursing',
  'phi-philosophy',
  'phy-physics',
  'psc-political-science',
  'psj-peace-social-justice',
  'psy-psychology',
  'rel-religion',
  'sens-sustainability-env-studies',
  'soc-sociology',
  'spn-spanish',
  'thr-theatre',
  'well-wellness',
  'wgs-women-gender-sexuality-studies',
];

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractCourseLinks(html, deptSlug) {
  const escaped = deptSlug.replace(/[-]/g, '\\-');
  const pattern = new RegExp(
    `href="(\\/en\\/current\\/catalog\\/course-descriptions\\/${escaped}\\/[^"]+)"`,
    'g'
  );
  const links = new Set();
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const path = m[1];
    if (path.split('/').length >= 8) {
      links.add(BASE + path);
    }
  }
  return [...links];
}

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractData(html) {
  // Course title from <h1><span>CODE</span> Title</h1>
  const h1Match = html.match(/<h1[^>]*>\s*<span>([^<]+)<\/span>\s*([\s\S]*?)<\/h1>/);
  let courseCode = '', courseName = '';
  if (h1Match) {
    courseCode = h1Match[1].trim();
    courseName = stripTags(h1Match[2]);
  } else {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (h1) courseName = stripTags(h1[1]);
  }
  const course = courseCode ? `${courseCode} ${courseName}` : courseName;

  // Prerequisites: everything after "Prerequisite(s):" up to <br /><br />
  const prereqMatch = html.match(/[Pp]rerequisites?:\s*([\s\S]*?)<br\s*\/>\s*<br\s*\/>/);
  let prerequisites = null;
  if (prereqMatch) {
    const text = stripTags(prereqMatch[1]);
    if (text.length > 0) prerequisites = text;
  }

  return { course, prerequisites };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function processCourse(url) {
  try {
    const html = await fetchHtml(url);
    return extractData(html);
  } catch (e) {
    console.error(`  Error ${url}: ${e.message}`);
    return null;
  }
}

async function processDept(deptSlug) {
  const deptUrl = `${BASE}/en/current/catalog/course-descriptions/${deptSlug}`;
  process.stdout.write(`\nDept: ${deptSlug} ... `);
  let html;
  try {
    html = await fetchHtml(deptUrl);
  } catch (e) {
    console.error(`Failed: ${e.message}`);
    return [];
  }

  const courseLinks = extractCourseLinks(html, deptSlug);
  process.stdout.write(`${courseLinks.length} courses\n`);

  const results = [];
  for (let i = 0; i < courseLinks.length; i += 8) {
    const batch = courseLinks.slice(i, i + 8);
    const batchResults = await Promise.all(batch.map(url => processCourse(url)));
    for (const r of batchResults) {
      if (r && r.course) results.push(r);
    }
    if (i + 8 < courseLinks.length) await sleep(100);
  }
  return results;
}

async function main() {
  console.log('Scraping Berea College course prerequisites...');
  const allCourses = [];

  for (const dept of DEPARTMENTS) {
    const courses = await processDept(dept);
    allCourses.push(...courses);
    await sleep(200);
  }

  allCourses.sort((a, b) => a.course.localeCompare(b.course));

  writeFileSync('lib/prereq.json', JSON.stringify(allCourses, null, 2));
  console.log(`\nDone! ${allCourses.length} courses written to lib/prereq.json`);
}

main().catch(console.error);
