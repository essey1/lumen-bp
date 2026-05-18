"""
Parses prerequisite text from prereq.json into PrereqNode tree format
and writes it to course-catalog.ts.

PrereqNode:
  string                            → single required course
  { type: "OR",  courses: [...] }  → any one suffices
  { type: "AND", courses: [...] }  → all must be satisfied (can nest OR nodes)

Semicolons in the raw text separate AND groups (each is a separate requirement).
Within each group "or" marks alternatives; comma-lists without "or" may be either
all-OR or all-AND depending on context.
"""
import json, re

with open('lib/prereq.json', 'r', encoding='utf-8') as f:
    prereq_data = json.load(f)

prereq_map = {}
for entry in prereq_data:
    decoded = entry['course'].replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    m = re.match(r'^([A-Z][A-Z&\-]*\s+\d+[A-Z]?)\s', decoded)
    if m:
        key = re.sub(r'\s+', ' ', m.group(1)).strip()
        prereq_map[key] = entry['prerequisites']


# ── Patterns stripped from every clause ─────────────────────────────────────
_CLEAN = [
    (re.compile(r',?\s*(?:or\s+)?permission\s+of\s+(?:the\s+)?instructor', re.I), ''),
    (re.compile(r'\s+with\s+a\s+(?:final\s+)?grade\s+of\s+\w[\w+]*', re.I), ''),
    (re.compile(r'\s+or\s+(?:higher|better)', re.I), ''),
    (re.compile(r'\(\s*or\s+waiver\s*\)', re.I), ''),
    (re.compile(r'\s+or\s+waiver', re.I), ''),
    (re.compile(r',?\s*(?:and\s+)?(?:sophomore|junior|senior|freshman|first|second|third|fourth)[-\s]?(?:year|standing|status|level)[^;,]*', re.I), ''),
    # Developmental math — remove ONLY the code, not what follows
    (re.compile(r'\(?Completion\s+(?:or\s+waiver\s+of\s+)?MAT\s+0\d+[A-Z]?\)?', re.I), ''),
    (re.compile(r'\bMAT\s+0\d+[A-Z]?\b', re.I), ''),
    # Introductory listing phrases
    (re.compile(r'(?:one\s+course\s+)?chosen\s+from\b', re.I), ''),
    (re.compile(r'one\s+of\s+the\s+following\s*:', re.I), ''),
    (re.compile(r'any\s+one\s+of\b', re.I), ''),
    (re.compile(r'any\s+of\b', re.I), ''),
    (re.compile(r'one\s+course\s+from\b', re.I), ''),
    (re.compile(r'(?:or\s+)?higher[-\s]?numbered\s+\w+\s+course[s]?', re.I), ''),
    (re.compile(r'or\s+(?:equivalent|above)\b', re.I), ''),
    # Leading AND connector
    (re.compile(r'^\s*(?:AND|and)\s+'), ''),
    # Debris
    (re.compile(r'\(\s*\)'), ''),
    (re.compile(r',\s*,'), ','),
    (re.compile(r'\s+'), ' '),
]


def clean_clause(t):
    for pattern, repl in _CLEAN:
        t = pattern.sub(repl, t)
    return t.strip().rstrip(',').strip()


def extract_codes(text):
    """
    Extract course codes with implicit dept continuation.
    Handles: full codes ("BIO 110"), & continuation ("& 113"),
    comma continuation ("CSC 111, 114, 125"), and or continuation ("MAT 214 or 315").
    E.g. "CSC 111 , 114, 125, 126, 226" → ["CSC 111","CSC 114","CSC 125","CSC 126","CSC 226"]
    """
    codes, last_dept = [], ''
    for m in re.finditer(
        r'\b([A-Z][A-Z&/\-]*)\s+(\d{3}[A-Z]?)\b'      # full code: "BIO 110"
        r'|(?:[&,]\s*|\bor\s+)(\d{3}[A-Z]?)\b',         # continuation after & , or
        text
    ):
        if m.group(1) and m.group(2):
            num = m.group(2)
            if num.startswith('0'):
                last_dept = ''
                continue
            last_dept = m.group(1).split('/')[-1]
            codes.append(f'{last_dept} {num}')
        elif m.group(3) and last_dept:
            num = m.group(3)
            if not num.startswith('0'):
                codes.append(f'{last_dept} {num}')
    return list(dict.fromkeys(codes))


_ONE_OF_RE = re.compile(
    r'one\s+(?:course\s+)?(?:chosen\s+from|of\b)'
    r'|any\s+one\s+of\b'
    r'|any\s+of\b'
    r'|chosen\s+from\b',
    re.I
)


def parse_clause(clause):
    """
    Parse one semicolon-separated clause into a list of AND-combined nodes.
    Within the clause, "and" word splits into sub-clauses; "or" marks alternatives.
    A "one of / chosen from" phrase before cleaning forces OR semantics.
    """
    # Detect "one of" before cleaning removes the phrase
    has_one_of = bool(_ONE_OF_RE.search(clause))

    t = clean_clause(clause)
    if not t or len(t) < 2:
        return []

    codes = extract_codes(t)
    if not codes:
        return []

    has_or  = bool(re.search(r'\bor\b', t, re.I))
    has_and = bool(re.search(r'\s+and\s+', t, re.I))

    if len(codes) == 1:
        return [codes[0]]

    if has_or and not has_and:
        return [{'type': 'OR', 'courses': codes}]

    if not has_or:
        # "one of A, B, C" → OR even without explicit "or" keyword
        if has_one_of:
            return [{'type': 'OR', 'courses': codes}]
        # No "or", no "one of" → all AND-required
        return codes

    # Mixed: split on word "and", parse each sub-clause
    nodes = []
    for sub in re.split(r'\s+and\s+', t, flags=re.I):
        sub = sub.strip()
        sub_codes = extract_codes(sub)
        if not sub_codes:
            continue
        sub_has_or = bool(re.search(r'\bor\b', sub, re.I))
        if len(sub_codes) == 1:
            nodes.append(sub_codes[0])
        elif sub_has_or:
            nodes.append({'type': 'OR', 'courses': sub_codes})
        else:
            nodes.extend(sub_codes)
    return nodes


def parse_prereqs(raw):
    """Parse a full raw prerequisite string into a PrereqNode tree."""
    if not raw:
        return None

    # Strip co-requisite clauses (these are concurrent, not pre-required)
    text = re.sub(r'\.?\s*(?:Pre\s+or\s+)?co-?requisite[s]?:.*$', '', raw, flags=re.I)
    # Strip trailing level-description clauses ("a junior-level course")
    text = re.sub(r';\s*(?:a\s+)?[^;]*(?:level|year)\s+course[^;]*$', '', text, flags=re.I)

    # Each semicolon-separated clause is an AND requirement
    all_nodes = []
    for clause in text.split(';'):
        all_nodes.extend(parse_clause(clause))

    if not all_nodes:
        return None
    if len(all_nodes) == 1:
        return all_nodes[0]
    return {'type': 'AND', 'courses': all_nodes}


def fmt_node(node):
    """Serialise a PrereqNode to TypeScript literal syntax."""
    if node is None:
        return None
    if isinstance(node, str):
        return '"' + node + '"'
    inner = ', '.join(fmt_node(c) for c in node['courses'])
    return '{ type: "' + node['type'] + '", courses: [' + inner + '] }'


# ── Patch course-catalog.ts ──────────────────────────────────────────────────

with open('lib/course-catalog.ts', 'r', encoding='utf-8') as f:
    content = f.read()

eol = '\r\n' if '\r\n' in content else '\n'
lines = content.split(eol)

COURSE_START = re.compile(r'^  "([^"]+)": \{$')
COURSE_END   = re.compile(r'^  \},$')
PREREQ_LINE  = re.compile(r'^    prerequisites:')
CREDITS_LINE = re.compile(r'^    credits:')

output, block = [], []
in_course = False
current_code = ''
updated = 0


def flush(in_prereq):
    global updated
    if not in_prereq:
        for l in block:
            output.append('// ' + l)
        return

    raw  = prereq_map.get(current_code)
    node = parse_prereqs(raw)
    fmt  = fmt_node(node)
    has_prereq_line = any(PREREQ_LINE.match(l) for l in block)

    for l in block:
        if PREREQ_LINE.match(l):
            if fmt is not None:
                output.append('    prerequisites: ' + fmt + ',')
            # else omit (no prerequisites)
            updated += 1
        else:
            output.append(l)
            # Insert missing prerequisites line after credits: if needed
            if not has_prereq_line and CREDITS_LINE.match(l) and fmt is not None:
                output.append('    prerequisites: ' + fmt + ',')
                updated += 1


for line in lines:
    sm = COURSE_START.match(line)
    if not in_course and sm:
        in_course = True; current_code = sm.group(1); block = [line]; continue
    if in_course:
        block.append(line)
        if COURSE_END.match(line):
            in_course = False
            flush(current_code in prereq_map)
            block = []; current_code = ''
        continue
    output.append(line)

result = eol.join(output)
with open('lib/course-catalog.ts', 'w', encoding='utf-8') as f:
    f.write(result)

undef_count = result.count('type: "undefined"')
print(f"Processed {updated} prerequisite lines")
print(f"type:undefined remaining: {undef_count}")

# Spot checks
checks = ['CSC 226', 'CSC 440', 'CSC 303', 'CSC 433', 'BIO 330',
          'CHM 221', 'CHM 131', 'NUR 225', 'GSTR 210', 'AFR 100']
for code in checks:
    node = parse_prereqs(prereq_map.get(code))
    print(f"  {code}: {fmt_node(node)}")
