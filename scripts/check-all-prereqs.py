"""
Audit every course in prereq.json:
  - show raw text alongside parsed result
  - flag cases where the parse looks suspicious
"""
import json, re, sys

with open('lib/prereq.json', 'r', encoding='utf-8') as f:
    prereq_data = json.load(f)

# Build the same parser from fix-catalog.py (inline)
_CLEAN = [
    (re.compile(r',?\s*(?:or\s+)?permission\s+of\s+(?:the\s+)?instructor', re.I), ''),
    (re.compile(r'\s+with\s+a\s+(?:final\s+)?grade\s+of\s+\w[\w+]*', re.I), ''),
    (re.compile(r'\s+or\s+(?:higher|better)', re.I), ''),
    (re.compile(r'\(\s*or\s+waiver\s*\)', re.I), ''),
    (re.compile(r'\s+or\s+waiver', re.I), ''),
    (re.compile(r',?\s*(?:and\s+)?(?:sophomore|junior|senior|freshman|first|second|third|fourth)[-\s]?(?:year|standing|status|level)[^;,]*', re.I), ''),
    (re.compile(r'\(?Completion\s+(?:or\s+waiver\s+of\s+)?MAT\s+0\d+[A-Z]?\)?', re.I), ''),
    (re.compile(r'\bMAT\s+0\d+[A-Z]?\b', re.I), ''),
    (re.compile(r'(?:one\s+course\s+)?chosen\s+from\b', re.I), ''),
    (re.compile(r'one\s+of\s+the\s+following\s*:', re.I), ''),
    (re.compile(r'any\s+one\s+of\b', re.I), ''),
    (re.compile(r'any\s+of\b', re.I), ''),
    (re.compile(r'one\s+course\s+from\b', re.I), ''),
    (re.compile(r'(?:or\s+)?higher[-\s]?numbered\s+\w+\s+course[s]?', re.I), ''),
    (re.compile(r'or\s+(?:equivalent|above)\b', re.I), ''),
    (re.compile(r'^\s*(?:AND|and)\s+'), ''),
    (re.compile(r'\(\s*\)'), ''),
    (re.compile(r',\s*,'), ','),
    (re.compile(r'\s+'), ' '),
]
_ONE_OF_RE = re.compile(
    r'one\s+(?:course\s+)?(?:chosen\s+from|of\b)|any\s+one\s+of\b|any\s+of\b|chosen\s+from\b', re.I)

def clean_clause(t):
    for p, r in _CLEAN:
        t = p.sub(r, t)
    return t.strip().rstrip(',').strip()

def extract_codes(text):
    codes, last_dept = [], ''
    for m in re.finditer(
        r'\b([A-Z][A-Z&/\-]*)\s+(\d{3}[A-Z]?)\b|(?:[&,]\s*|\bor\s+)(\d{3}[A-Z]?)\b', text):
        if m.group(1) and m.group(2):
            num = m.group(2)
            if num.startswith('0'): last_dept = ''; continue
            last_dept = m.group(1).split('/')[-1]
            codes.append(f'{last_dept} {num}')
        elif m.group(3) and last_dept:
            num = m.group(3)
            if not num.startswith('0'): codes.append(f'{last_dept} {num}')
    return list(dict.fromkeys(codes))

def parse_clause(clause):
    has_one_of = bool(_ONE_OF_RE.search(clause))
    t = clean_clause(clause)
    if not t or len(t) < 2: return []
    codes = extract_codes(t)
    if not codes: return []
    has_or  = bool(re.search(r'\bor\b', t, re.I))
    has_and = bool(re.search(r'\s+and\s+', t, re.I))
    if len(codes) == 1: return [codes[0]]
    if has_or and not has_and: return [{'type': 'OR', 'courses': codes}]
    if not has_or:
        return [{'type': 'OR', 'courses': codes}] if has_one_of else codes
    nodes = []
    for sub in re.split(r'\s+and\s+', t, flags=re.I):
        sub = sub.strip()
        sub_codes = extract_codes(sub)
        if not sub_codes: continue
        sub_has_or = bool(re.search(r'\bor\b', sub, re.I))
        if len(sub_codes) == 1: nodes.append(sub_codes[0])
        elif sub_has_or: nodes.append({'type': 'OR', 'courses': sub_codes})
        else: nodes.extend(sub_codes)
    return nodes

def parse_prereqs(raw):
    if not raw: return None
    text = re.sub(r'\.?\s*(?:Pre\s+or\s+)?co-?requisite[s]?:.*$', '', raw, flags=re.I)
    text = re.sub(r';\s*(?:a\s+)?[^;]*(?:level|year)\s+course[^;]*$', '', text, flags=re.I)
    all_nodes = []
    for clause in text.split(';'):
        all_nodes.extend(parse_clause(clause))
    if not all_nodes: return None
    if len(all_nodes) == 1: return all_nodes[0]
    return {'type': 'AND', 'courses': all_nodes}

def fmt(node, depth=0):
    if node is None: return 'None'
    if isinstance(node, str): return node
    courses = [fmt(c, depth+1) for c in node['courses']]
    if node['type'] == 'OR': return f"OR({', '.join(courses)})"
    return f"AND({', '.join(courses)})"

# Check every entry that has a non-null prerequisite
issues = []
for entry in prereq_data:
    raw = entry['prerequisites']
    if not raw: continue
    decoded = entry['course'].replace('&amp;', '&')
    m = re.match(r'^([A-Z][A-Z&\-]*\s+\d+[A-Z]?)\s', decoded)
    if not m: continue
    code = re.sub(r'\s+', ' ', m.group(1)).strip()
    node = parse_prereqs(raw)
    parsed = fmt(node)

    # Flag suspicious parses:
    # 1. Raw text has codes but parsed is None
    raw_codes = re.findall(r'\b[A-Z]{2,5}\s+\d{3}[A-Z]?\b', raw)
    raw_codes = [c for c in raw_codes if not re.match(r'\d{3}', c.split()[-1]) or True]
    if node is None and raw_codes:
        issues.append((code, 'NULL_WITH_CODES', raw[:80], parsed))
    # 2. OR list of codes from multiple departments with no "or" in raw (might be AND)
    # 3. AND list where raw has "or" between them (might be OR)

print(f"Entries with prerequisites: {sum(1 for e in prereq_data if e['prerequisites'])}")
print(f"Issues flagged: {len(issues)}")
if issues:
    print("\n── Courses with prerequisites in raw text but parsed as None ──")
    for code, kind, raw, parsed in issues[:30]:
        print(f"  {code}: {raw}")

# Sample 20 courses with complex prereqs to verify
print("\n── Sample of complex prerequisites ──")
samples = [e for e in prereq_data if e['prerequisites'] and
           ('and' in (e['prerequisites'] or '').lower() or 'or' in (e['prerequisites'] or '').lower())]
# Show ones from varied departments
shown_depts = set()
shown = 0
for entry in samples:
    decoded = entry['course'].replace('&amp;', '&')
    m = re.match(r'^([A-Z][A-Z&\-]*\s+\d+[A-Z]?)\s', decoded)
    if not m: continue
    code = re.sub(r'\s+', ' ', m.group(1)).strip()
    dept = code.split()[0]
    if dept in shown_depts: continue
    shown_depts.add(dept)
    node = parse_prereqs(entry['prerequisites'])
    print(f"  {code}: {entry['prerequisites'][:70]}")
    print(f"    → {fmt(node)}")
    shown += 1
    if shown >= 25: break
