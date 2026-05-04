#!/usr/bin/env python3
"""
Berea College Course Prerequisites Scraper

Scrapes:
  https://berea.smartcatalogiq.com/en/current/catalog/course-descriptions

Modes:
  1. Generate a standalone JS file with just prerequisites
     python scrape_prerequisites.py --output prerequisites.js

  2. Patch prerequisites directly into an existing JS/TS data file
     python scrape_prerequisites.py --merge lib/course-catalog.ts

  3. Get raw JSON if you'd rather process it yourself
     python scrape_prerequisites.py --json --output prereqs.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing dependencies. Run:\n  pip install requests beautifulsoup4")
    sys.exit(1)


BASE_URL = "https://berea.smartcatalogiq.com"
ROOT_URL = f"{BASE_URL}/en/current/catalog/course-descriptions"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; BereaCatalogPrereqScraper/1.0; "
        "+https://github.com/your-repo)"
    )
}

# Match course codes like FRN 101, GSTR 210, MAT012, BIO 201P, etc.
COURSE_CODE_RE = re.compile(r"\b([A-Z]{2,5})\s?(\d{3}[A-Z]?)\b")


def get_soup(url: str, session: requests.Session, delay: float) -> BeautifulSoup:
    """Fetch a URL and return a BeautifulSoup document."""
    attempts = 4
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        time.sleep(delay if attempt == 1 else max(delay, 1.5) * attempt)
        try:
            response = session.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.text, "html.parser")
        except requests.RequestException as exc:
            last_error = exc
            if attempt < attempts:
                print(
                    f"  Retry {attempt}/{attempts - 1} for {url} after error: {exc}",
                    file=sys.stderr,
                )
            else:
                break

    assert last_error is not None
    raise last_error


def normalize_course_code(raw: str) -> str | None:
    match = COURSE_CODE_RE.search(raw)
    if not match:
        return None
    return f"{match.group(1)} {match.group(2)}"


def extract_course_links_from_dept(
    dept_url: str, session: requests.Session, delay: float
) -> list[str]:
    """
    Follow a department page down to individual course pages.

    The catalog typically nests:
      department -> level pages (100/200/300/400) -> individual course pages
    """
    soup = get_soup(dept_url, session, delay)
    main = soup.find("div", id="main") or soup.find("main") or soup

    links: list[str] = []
    for anchor in main.find_all("a", href=True):
        href = anchor["href"]
        full = href if href.startswith("http") else urljoin(BASE_URL, href)
        if full.startswith(dept_url) and full.rstrip("/") != dept_url.rstrip("/"):
            links.append(full)

    expanded: list[str] = []
    for link in dict.fromkeys(links):
        segment = link.rstrip("/").split("/")[-1]
        if segment.isdigit():
            try:
                sub_soup = get_soup(link, session, delay)
                sub_main = sub_soup.find("div", id="main") or sub_soup.find("main") or sub_soup
                for anchor in sub_main.find_all("a", href=True):
                    href = anchor["href"]
                    full = href if href.startswith("http") else urljoin(BASE_URL, href)
                    if full.startswith(link) and full.rstrip("/") != link.rstrip("/"):
                        expanded.append(full)
            except Exception as exc:
                print(f"  Warning: could not fetch level page {link}: {exc}", file=sys.stderr)
        else:
            expanded.append(link)

    # Keep only URLs that look like individual course pages.
    course_links = []
    for link in dict.fromkeys(expanded):
        segment = link.rstrip("/").split("/")[-1]
        if re.search(r"-\d{3}[a-z]?$", segment):
            course_links.append(link)

    return course_links


def parse_prerequisites(text: str) -> list[str]:
    """Extract normalized course codes from a prerequisite sentence."""
    codes: list[str] = []
    seen: set[str] = set()

    for match in COURSE_CODE_RE.finditer(text):
        code = f"{match.group(1)} {match.group(2)}"
        if code not in seen:
            seen.add(code)
            codes.append(code)

    return codes


def scrape_course_page(
    url: str, session: requests.Session, delay: float
) -> dict[str, Any] | None:
    """
    Scrape a single course page.

    Returns:
      {
        "code": "FRN 102",
        "prerequisites": ["FRN 101"],
        "rawPrerequisiteText": "Prerequisite: FRN 101 with C or higher.",
        "url": "..."
      }
    """
    try:
        soup = get_soup(url, session, delay)
    except Exception as exc:
        print(f"  Error fetching {url}: {exc}", file=sys.stderr)
        return None

    main = soup.find("div", id="main") or soup.find("main") or soup
    heading = main.find("h1")
    if not heading:
        return None

    code = normalize_course_code(heading.get_text(" ", strip=True))
    if not code:
        return None

    body_text = main.get_text(separator="\n")
    raw_line = ""
    prerequisites: list[str] = []

    for line in body_text.splitlines():
        text = " ".join(line.strip().split())
        if re.match(r"prerequisites?\s*:", text, re.IGNORECASE):
            raw_line = text
            prerequisites = parse_prerequisites(text)
            break

    return {
        "code": code,
        "prerequisites": prerequisites,
        "rawPrerequisiteText": raw_line,
        "url": url,
    }


def get_department_urls(
    session: requests.Session, delay: float
) -> list[tuple[str, str]]:
    """Return department index URLs from the root course descriptions page."""
    soup = get_soup(ROOT_URL, session, delay)
    main = soup.find("div", id="main") or soup.find("main") or soup

    departments: list[tuple[str, str]] = []
    for anchor in main.find_all("a", href=True):
        href = anchor["href"]
        full = href if href.startswith("http") else urljoin(BASE_URL, href)
        if (
            full.startswith(ROOT_URL)
            and full.rstrip("/") != ROOT_URL.rstrip("/")
            and full.count("/") == ROOT_URL.count("/") + 1
        ):
            departments.append((anchor.get_text(strip=True), full))

    return list(dict.fromkeys(departments))


def scrape_all(delay: float = 0.8) -> dict[str, dict[str, Any]]:
    """Scrape the full catalog prerequisite dataset."""
    session = requests.Session()
    results: dict[str, dict[str, Any]] = {}

    print("Fetching department list...")
    departments = get_department_urls(session, delay)
    print(f"Found {len(departments)} departments.\n")

    for dept_name, dept_url in departments:
        print(f"[{dept_name}] {dept_url}")
        try:
            course_links = extract_course_links_from_dept(dept_url, session, delay)
        except Exception as exc:
            print(f"  Skipping department after repeated failures: {exc}", file=sys.stderr)
            continue
        print(f"  -> {len(course_links)} course pages found")

        for course_url in course_links:
            data = scrape_course_page(course_url, session, delay)
            if not data:
                continue

            results[data["code"]] = data
            if data["prerequisites"]:
                print(f"     {data['code']:12s} prereqs: {data['prerequisites']}")

    return results


def to_js_object(results: dict[str, dict[str, Any]]) -> str:
    """Render results as an ES module export with prerequisites only."""
    lines = [
        "// Auto-generated by scrape_prerequisites.py",
        "// Source: https://berea.smartcatalogiq.com/en/current/catalog/course-descriptions",
        "",
        "export const coursePrerequisites = {",
    ]

    for code, info in sorted(results.items()):
        prereqs_js = json.dumps(info["prerequisites"])
        raw = info["rawPrerequisiteText"].replace('"', '\\"')
        lines.append(f'  "{code}": {{')
        lines.append(f"    prerequisites: {prereqs_js},")
        if raw:
            lines.append(f"    // {raw}")
        lines.append("  },")

    lines.append("};")
    return "\n".join(lines)


def merge_into_existing_js(
    existing_text: str, results: dict[str, dict[str, Any]]
) -> tuple[str, int]:
    """
    Patch prerequisites arrays inside an existing JS/TS catalog file.

    Only replaces the `prerequisites: [...]` value inside matching course blocks.
    All other fields remain untouched.
    """
    updated = existing_text
    changes = 0

    for code, info in results.items():
        prereqs_js = json.dumps(info["prerequisites"])
        pattern = re.compile(
            r'("' + re.escape(code) + r'"\s*:\s*\{[\s\S]*?\bprerequisites\s*:\s*)\[[^\]]*\]',
            re.MULTILINE,
        )
        replacement = r"\1" + prereqs_js
        updated, count = pattern.subn(replacement, updated, count=1)
        changes += count

    return updated, changes


def write_output(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Berea College course prerequisites")
    parser.add_argument(
        "--output",
        "-o",
        default="-",
        help="Output file path (default: stdout, or merge target when --merge is used)",
    )
    parser.add_argument("--json", action="store_true", help="Output raw JSON instead of JS")
    parser.add_argument(
        "--delay", type=float, default=0.8, help="Seconds between requests (default 0.8)"
    )
    parser.add_argument(
        "--merge",
        metavar="EXISTING_FILE",
        help="Patch prerequisites directly into an existing JS/TS catalog file",
    )
    args = parser.parse_args()

    results = scrape_all(delay=args.delay)
    print(f"\nScraped {len(results)} courses total.")

    if args.merge:
        merge_path = Path(args.merge)
        existing_text = merge_path.read_text(encoding="utf-8")
        output_text, patched_count = merge_into_existing_js(existing_text, results)

        output_target = merge_path if args.output == "-" else Path(args.output)
        write_output(output_target, output_text)
        if output_target == merge_path:
            print(f"Patched prerequisites in place: {merge_path} ({patched_count} courses updated)")
        else:
            print(f"Wrote merged output to {output_target} ({patched_count} courses updated)")
        return

    if args.json:
        clean = {
            code: {
                "prerequisites": value["prerequisites"],
                "rawText": value["rawPrerequisiteText"],
                "url": value["url"],
            }
            for code, value in sorted(results.items())
        }
        output_text = json.dumps(clean, indent=2)
    else:
        output_text = to_js_object(results)

    if args.output == "-":
        print(output_text)
    else:
        output_path = Path(args.output)
        write_output(output_path, output_text)
        print(f"Written to {output_path}")


if __name__ == "__main__":
    main()
