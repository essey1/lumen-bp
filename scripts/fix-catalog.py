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

def parse_prereqs(raw):
    if not raw:
        return None
    text = raw
    text = re.sub(r',?\s*(?:or\s+)?permission\s+of\s+(?:the\s+)?instructor', '', text, flags=re.I)
    text = re.sub(r'\s+with\s+a\s+(?:final\s+)?grade\s+of\s+\w[\w+]*', '', text, flags=re.I)
    text = re.sub(r'\s+or\s+higher', '', text, flags=re.I)
    text = re.sub(r'\(\s*or\s+waiver\s*\)', '', text, flags=re.I)
    text = re.sub(r'\s+or\s+waiver', '', text, flags=re.I)
    text = re.sub(r'\.?\s*(?:Pre\s+or\s+)?co-?requisite[s]?:.*$', '', text, flags=re.I)
    text = re.sub(r',?\s*(?:and\s+)?(?:sophomore|junior|senior|freshman|first|second|third|fourth)[-\s]?(?:year|standing|status|level)[^;,]*', '', text, flags=re.I)
    text = re.sub(r';\s*(?:a\s+)?[^;]*(?:level|year)\s+course[^;]*', '', text, flags=re.I)
    text = re.sub(r'\(?(?:Completion\s+(?:or\s+waiver\s+of\s+)?)?MAT\s+0\d+[A-Z]?[^)]*\)?', '', text, flags=re.I)
    text = text.split(';')[0]
    text = re.sub(r'^\s*(?:AND|and)\s+', '', text)
    text = re.sub(r'[,\s]+$', '', text).strip()
    if not text or len(text) < 3:
        return None
    has_or = bool(re.search(r'\bor\b', text, re.I))
    codes, last_dept = [], ''
    for m in re.finditer(r'\b([A-Z][A-Z&/\-]*)\s+(\d{3}[A-Z]?)\b|[&]\s*(\d{3}[A-Z]?)\b', text):
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
    unique = list(dict.fromkeys(codes))
    if not unique:
        return None
    if len(unique) == 1:
        return unique[0]
    return {'type': 'OR' if has_or else 'AND', 'courses': unique}

def fmt_node(node):
    if node is None:
        return None
    if isinstance(node, str):
        return '"' + node + '"'
    inner = ', '.join(fmt_node(c) for c in node['courses'])
    return '{ type: "' + node['type'] + '", courses: [' + inner + '] }'

with open('lib/course-catalog.ts', 'r', encoding='utf-8') as f:
    content = f.read()

eol = '\r\n' if '\r\n' in content else '\n'
lines = content.split(eol)

COURSE_START = re.compile(r'^  "([^"]+)": \{$')
COURSE_END   = re.compile(r'^  \},$')
PREREQ_LINE  = re.compile(r'^    prerequisites:')

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
    for l in block:
        if PREREQ_LINE.match(l):
            if fmt is not None:
                output.append('    prerequisites: ' + fmt + ',')
            # else omit line (no prerequisites)
            updated += 1
        else:
            output.append(l)

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

# Spot check
for code in ['CSC 226', 'BIO 330', 'CHM 221', 'NUR 225', 'AFR 100', 'GSTR 210']:
    node = parse_prereqs(prereq_map.get(code))
    print(f"  {code}: {fmt_node(node)}")
