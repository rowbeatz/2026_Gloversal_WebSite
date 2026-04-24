"""Quick verification that every HTML page has the expected SEO tags."""
import pathlib, re, sys, json

SITE = pathlib.Path("site")
CHECKS = [
    ("canonical", r'<link\s+rel=["\']canonical["\']'),
    ("hreflang ja", r'<link\s+rel=["\']alternate["\']\s+hreflang=["\']ja["\']'),
    ("hreflang x-default", r'hreflang=["\']x-default["\']'),
    ("meta robots", r'<meta\s+name=["\']robots["\']'),
    ("meta author", r'<meta\s+name=["\']author["\']'),
    ("og:type", r'property=["\']og:type["\']'),
    ("og:url", r'property=["\']og:url["\']'),
    ("og:title", r'property=["\']og:title["\']'),
    ("og:description", r'property=["\']og:description["\']'),
    ("og:image", r'property=["\']og:image["\']'),
    ("twitter:card", r'name=["\']twitter:card["\']'),
    ("twitter:title", r'name=["\']twitter:title["\']'),
    ("twitter:image", r'name=["\']twitter:image["\']'),
    ("JSON-LD", r'application/ld\+json'),
    ("GA gtag", r'G-TDS1K2TNZJ'),
]

ROOT_FILES = [
    ("robots.txt", "Sitemap: https://gloversal.com/sitemap.xml"),
    ("sitemap.xml", "<loc>https://gloversal.com/"),
    ("llms.txt", "# Gloversal"),
]

fail = 0
for rel, needle in ROOT_FILES:
    p = SITE / rel
    if not p.exists():
        print(f"[FAIL] {rel}: missing")
        fail += 1
        continue
    if needle not in p.read_text(encoding="utf-8"):
        print(f"[FAIL] {rel}: expected content '{needle}' not found")
        fail += 1
    else:
        print(f"[OK]   {rel}")

html_files = (
    list(SITE.glob("*.html"))
    + list(SITE.glob("legal/*.html"))
    + list(SITE.glob("insights/*.html"))
    + list(SITE.glob("case-studies/*.html"))
    + list(SITE.glob("speaking/*.html"))
)
for html_path in sorted(html_files):
    rel = html_path.relative_to(SITE).as_posix()
    txt = html_path.read_text(encoding="utf-8")
    missing = []
    for name, pat in CHECKS:
        if not re.search(pat, txt):
            # legal pages don't get JSON-LD (empty graph), skip that one
            if rel.startswith("legal/") and name == "JSON-LD":
                continue
            missing.append(name)
    # Also validate JSON-LD is parseable
    ld_blocks = re.findall(
        r'<script\s+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        txt,
        flags=re.DOTALL,
    )
    for i, block in enumerate(ld_blocks):
        try:
            json.loads(block.strip())
        except json.JSONDecodeError as e:
            missing.append(f"JSON-LD#{i} invalid: {e}")
    if missing:
        print(f"[FAIL] {rel}: missing {missing}")
        fail += 1
    else:
        print(f"[OK]   {rel}")

print(f"\n{'PASS' if fail == 0 else 'FAIL'}: {fail} failures.")
sys.exit(0 if fail == 0 else 1)
