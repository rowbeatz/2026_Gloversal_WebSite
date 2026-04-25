"""
Generate site/sitemap.xml from a single source of truth.

Includes:
  - Top-level public pages (home + 8 sections)
  - Per-slug detail URLs for insights / speaking / cases, harvested from
    site/js/content-data.js so adding a new card automatically extends
    the sitemap on the next build.

Run: python tools/build_sitemap.py
"""
import datetime
import pathlib
import re

ORIGIN = "https://gloversal.com"
TODAY = datetime.date.today().isoformat()
SITE = pathlib.Path("site")
DATA = SITE / "js" / "content-data.js"

# ---------------------------------------------------------------------------
# Top-level pages (loc, changefreq, priority)
# ---------------------------------------------------------------------------
TOP_PAGES = [
    ("/", "weekly", "1.0"),
    ("/about.html", "monthly", "0.9"),
    ("/services.html", "monthly", "0.9"),
    ("/case-studies.html", "monthly", "0.8"),
    ("/insights.html", "weekly", "0.8"),
    ("/speaking.html", "monthly", "0.7"),
    ("/partner-solutions.html", "monthly", "0.7"),
    ("/contact.html", "monthly", "0.8"),
]

# Detail directory layout (static per-slug pages live under these prefixes).
DETAIL_DIRS = {
    "insights": ("/insights", "monthly", "0.6"),
    "speaking": ("/speaking", "monthly", "0.5"),
    "cases": ("/case-studies", "monthly", "0.6"),
}


def harvest_slugs():
    if not DATA.exists():
        return {}
    text = DATA.read_text(encoding="utf-8")
    out = {}
    for section in DETAIL_DIRS:
        m = re.search(rf'"?{section}"?\s*:\s*\[(.*?)\n\s*\]', text, flags=re.DOTALL)
        out[section] = re.findall(r'"?slug"?\s*:\s*"([^"]+)"', m.group(1)) if m else []
    return out


def url_entry(loc, changefreq, priority, lastmod=TODAY):
    return (
        f"  <url>\n"
        f"    <loc>{ORIGIN}{loc}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        f"  </url>"
    )


def main():
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, freq, prio in TOP_PAGES:
        parts.append(url_entry(loc, freq, prio))
    slugs = harvest_slugs()
    for section, (prefix, freq, prio) in DETAIL_DIRS.items():
        for s in slugs.get(section, []):
            parts.append(url_entry(f"{prefix}/{s}.html", freq, prio))
    parts.append("</urlset>")
    out = SITE / "sitemap.xml"
    out.write_text("\n".join(parts) + "\n", encoding="utf-8")
    total_detail = sum(len(v) for v in slugs.values())
    print(f"  [+] Wrote {out}: {len(TOP_PAGES)} top pages + {total_detail} detail URLs")


if __name__ == "__main__":
    main()
