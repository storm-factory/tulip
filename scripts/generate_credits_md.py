#!/usr/bin/env python3
"""
generate_credits_md.py

Converts credits.json → Markdown with proper attribution

- Flaticon → original style
- Wikimedia → [File:NAME](URL) by Author, [License](URL)
- Others → • Title – Author – License
"""

import json
from pathlib import Path
import re

INPUT = Path("src/credits.json")
OUTPUT = Path("GLYPHS.md")


def load_credits():
    if not INPUT.exists():
        print(f"Error: {INPUT} not found")
        return []
    with open(INPUT, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def is_flaticon(entry):
    return entry.get("license", "").strip() == "Flaticon License"


def is_wikimedia(entry):
    page = entry.get("page", "").lower()
    return "https://commons.wikimedia.org" in page


def wikimedia_md(entry):
    filename = entry["title"]
    author = entry["author"]
    page = entry["page"]
    license_name = shorten_license(entry["license"])
    license_url = entry["licenseUrl"]

    return (
        f"- [File:{filename}]({page}) by {author}, "
        f"[{license_name}]({license_url})"
    )


def flaticon_md(entry):
    title = entry["title"].replace(".svg", "")
    name = title.replace("-", " ").replace("_", " ").title()
    author = entry["author"]
    url = entry["page"]
    return f"- [{name} icons created by {author} - Flaticon]({url})"


def other_md(entry):
    return f"- **{entry['title']}** – {entry['author']} – [{entry['license']}]({entry['licenseUrl']})"


def main():
    entries = load_credits()
    if not entries:
        print("No entries found.")
        return

    flaticon = [e for e in entries if is_flaticon(e)]
    wikimedia = [e for e in entries if is_wikimedia(e) and not is_flaticon(e)]
    others = [e for e in entries if not is_flaticon(e) and not is_wikimedia(e)]

    lines = ["# Icon Credits\n"]

    if flaticon:
        lines.append("## Flaticon\n")
        lines.extend(flaticon_md(e) for e in flaticon)
        lines.append("")

    if wikimedia:
        lines.append("## Wikimedia Commons\n")
        lines.extend(wikimedia_md(e) for e in wikimedia)
        lines.append("")

    if others:
        lines.append("## Other\n")
        lines.extend(other_md(e) for e in others)
        lines.append("")

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Generated {OUTPUT}")
    print(f"  • {len(flaticon)} Flaticon")
    print(f"  • {len(wikimedia)} Wikimedia")
    print(f"  • {len(others)} Other")


def shorten_license(license_name: str) -> str:
    if "Creative Commons" not in license_name:
        return license_name

    if "Attribution" in license_name and "Share Alike" in license_name:
        # Keep version + suffix (Unported, International, etc.)
        suffix_match = re.search(r"(\d+\.\d+(?:\s+\w+)*)", license_name)
        if suffix_match:
            suffix = suffix_match.group(1).strip()
            return f"CC BY-SA {suffix}"
        return "CC BY-SA"
    return license_name


if __name__ == "__main__":
    main()
