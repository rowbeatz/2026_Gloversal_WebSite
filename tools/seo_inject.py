"""
SEO / AEO injector for Gloversal site.

Processes every .html file under site/, reads its existing <title> and
<meta name="description">, and injects a complete SEO head block
(canonical, hreflang, robots, OG, Twitter Card, author) plus page-type-appropriate
JSON-LD schema.

Idempotent: if a <link rel="canonical"> already exists, the page's SEO block
is replaced rather than duplicated.

Run: python tools/seo_inject.py
"""
import pathlib
import re
import json

SITE_ROOT = pathlib.Path("site")
ORIGIN = "https://gloversal.com"
OG_IMAGE = f"{ORIGIN}/assets/images/gloversal-og.png"
SITE_NAME = "Gloversal, Inc."

# ---------------------------------------------------------------------------
# Page registry — maps filename to (path, schema_type, is_legal).
# ---------------------------------------------------------------------------
PAGES = {
    "index.html": ("/", "home", False),
    "about.html": ("/about.html", "about", False),
    "services.html": ("/services.html", "services", False),
    "case-studies.html": ("/case-studies.html", "case-studies", False),
    "case-detail.html": ("/case-detail.html", "case-detail", False),
    "insights.html": ("/insights.html", "insights", False),
    "insight-detail.html": ("/insight-detail.html", "insight-detail", False),
    "speaking.html": ("/speaking.html", "speaking", False),
    "speaking-detail.html": ("/speaking-detail.html", "speaking-detail", False),
    "partner-solutions.html": ("/partner-solutions.html", "partner", False),
    "contact.html": ("/contact.html", "contact", False),
    "legal/privacy.html": ("/legal/privacy.html", "legal", True),
    "legal/cookies.html": ("/legal/cookies.html", "legal", True),
    "legal/terms.html": ("/legal/terms.html", "legal", True),
    "legal/disclaimer.html": ("/legal/disclaimer.html", "legal", True),
    "legal/notice.html": ("/legal/notice.html", "legal", True),
    "legal/recruitment.html": ("/legal/recruitment.html", "legal", True),
}

# ---------------------------------------------------------------------------
# Shared JSON-LD building blocks.
# ---------------------------------------------------------------------------
ORGANIZATION = {
    "@type": "Organization",
    "@id": f"{ORIGIN}/#organization",
    "name": "Gloversal, Inc.",
    "alternateName": "Gloversal",
    "url": ORIGIN,
    "logo": {
        "@type": "ImageObject",
        "url": f"{ORIGIN}/assets/images/gloversal-logo.png",
        "width": 512,
        "height": 512,
    },
    "description": (
        "Healthcare strategy advisory, medical technology consulting, and "
        "business development firm founded in 2004. Specializes in medical "
        "AI, digital health, and cross-border healthtech commercialization."
    ),
    "foundingDate": "2004",
    "founder": {"@id": f"{ORIGIN}/#founder"},
    "knowsLanguage": ["ja", "en"],
    "areaServed": [
        {"@type": "Country", "name": "Japan"},
        {"@type": "Place", "name": "Global"},
    ],
    "address": [
        {
            "@type": "PostalAddress",
            "streetAddress": "113 Barksdale Professional Center",
            "addressLocality": "Newark",
            "addressRegion": "DE",
            "postalCode": "19711",
            "addressCountry": "US",
        },
        {
            "@type": "PostalAddress",
            "streetAddress": "1-10-8 Dogenzaka, Shibuya Dogenzaka Tokyu Bldg. 2F-C",
            "addressLocality": "Shibuya",
            "addressRegion": "Tokyo",
            "postalCode": "150-0043",
            "addressCountry": "JP",
        },
    ],
    "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer inquiry",
        "email": "inquiry@gloversal.com",
        "availableLanguage": ["ja", "en"],
    },
}

PERSON = {
    "@type": "Person",
    "@id": f"{ORIGIN}/#founder",
    "name": "Yoshitomo Furusawa",
    "givenName": "Yoshitomo",
    "familyName": "Furusawa",
    "alternateName": "古澤 良智",
    "jobTitle": "Founder & Principal Advisor",
    "worksFor": {"@id": f"{ORIGIN}/#organization"},
    "image": f"{ORIGIN}/assets/images/yoshitomo-furusawa.jpg",
    "knowsLanguage": ["ja", "en"],
    "knowsAbout": [
        "Healthcare strategy",
        "Medical AI",
        "Digital health",
        "Telemedicine",
        "Diagnostic imaging",
        "Cross-border healthtech commercialization",
        "Hospital-enterprise alliance design",
        "Medical DX (digital transformation)",
    ],
    "url": f"{ORIGIN}/about.html",
}

WEBSITE = {
    "@type": "WebSite",
    "@id": f"{ORIGIN}/#website",
    "url": ORIGIN,
    "name": "Gloversal, Inc.",
    "publisher": {"@id": f"{ORIGIN}/#organization"},
    "inLanguage": "ja",
}

PROFESSIONAL_SERVICE = {
    "@type": "ProfessionalService",
    "@id": f"{ORIGIN}/#service",
    "name": "Gloversal Healthcare Strategy Advisory",
    "provider": {"@id": f"{ORIGIN}/#organization"},
    "areaServed": [
        {"@type": "Country", "name": "Japan"},
        {"@type": "Place", "name": "Global"},
    ],
    "serviceType": [
        "Healthcare business strategy",
        "Medical AI adoption advisory",
        "Cross-border market entry (Japan healthtech)",
        "Hospital-enterprise alliance design",
        "Telemedicine and diagnostic imaging implementation",
        "Medical DX execution support",
        "AI agent and organizational design for healthcare",
        "Interactive AI avatar solutions for clinical workflows",
    ],
    "url": f"{ORIGIN}/services.html",
}


def breadcrumb(items):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": name,
                "item": f"{ORIGIN}{path}" if path else None,
            }
            for i, (name, path) in enumerate(items)
        ],
    }


def schema_for(page_type):
    """Return the list of JSON-LD nodes for a given page type."""
    graph = []
    if page_type == "home":
        graph = [ORGANIZATION, PERSON, WEBSITE, PROFESSIONAL_SERVICE]
    elif page_type == "about":
        graph = [
            PERSON,
            {
                "@type": "AboutPage",
                "@id": f"{ORIGIN}/about.html#webpage",
                "url": f"{ORIGIN}/about.html",
                "name": "About Gloversal",
                "about": {"@id": f"{ORIGIN}/#organization"},
                "mainEntity": {"@id": f"{ORIGIN}/#founder"},
                "inLanguage": "ja",
            },
            breadcrumb([("Home", "/"), ("About", "/about.html")]),
        ]
    elif page_type == "services":
        graph = [
            PROFESSIONAL_SERVICE,
            breadcrumb([("Home", "/"), ("Services", "/services.html")]),
        ]
    elif page_type == "case-studies":
        graph = [
            {
                "@type": "CollectionPage",
                "@id": f"{ORIGIN}/case-studies.html#webpage",
                "url": f"{ORIGIN}/case-studies.html",
                "name": "Case Studies",
                "about": {"@id": f"{ORIGIN}/#organization"},
                "inLanguage": "ja",
            },
            breadcrumb([("Home", "/"), ("Case Studies", "/case-studies.html")]),
        ]
    elif page_type == "case-detail":
        graph = [
            breadcrumb([
                ("Home", "/"),
                ("Case Studies", "/case-studies.html"),
                ("Detail", "/case-detail.html"),
            ]),
        ]
    elif page_type == "insights":
        graph = [
            {
                "@type": "Blog",
                "@id": f"{ORIGIN}/insights.html#blog",
                "url": f"{ORIGIN}/insights.html",
                "name": "Gloversal Insights",
                "publisher": {"@id": f"{ORIGIN}/#organization"},
                "inLanguage": "ja",
            },
            breadcrumb([("Home", "/"), ("Insights", "/insights.html")]),
        ]
    elif page_type == "insight-detail":
        graph = [
            breadcrumb([
                ("Home", "/"),
                ("Insights", "/insights.html"),
                ("Detail", "/insight-detail.html"),
            ]),
        ]
    elif page_type == "speaking":
        graph = [
            {
                "@type": "CollectionPage",
                "@id": f"{ORIGIN}/speaking.html#webpage",
                "url": f"{ORIGIN}/speaking.html",
                "name": "Activities & Speaking",
                "about": {"@id": f"{ORIGIN}/#founder"},
                "inLanguage": "ja",
            },
            breadcrumb([("Home", "/"), ("Activities", "/speaking.html")]),
        ]
    elif page_type == "speaking-detail":
        graph = [
            breadcrumb([
                ("Home", "/"),
                ("Activities", "/speaking.html"),
                ("Detail", "/speaking-detail.html"),
            ]),
        ]
    elif page_type == "partner":
        graph = [
            {
                "@type": "WebPage",
                "@id": f"{ORIGIN}/partner-solutions.html#webpage",
                "url": f"{ORIGIN}/partner-solutions.html",
                "name": "Partner Solutions",
                "about": {"@id": f"{ORIGIN}/#organization"},
                "inLanguage": "ja",
            },
            breadcrumb([("Home", "/"), ("Partner Solutions", "/partner-solutions.html")]),
        ]
    elif page_type == "contact":
        graph = [
            {
                "@type": "ContactPage",
                "@id": f"{ORIGIN}/contact.html#webpage",
                "url": f"{ORIGIN}/contact.html",
                "name": "Contact Gloversal",
                "mainEntity": {"@id": f"{ORIGIN}/#organization"},
                "inLanguage": "ja",
            },
            breadcrumb([("Home", "/"), ("Contact", "/contact.html")]),
        ]
    elif page_type == "legal":
        # legal pages get a minimal WebPage + BreadcrumbList
        graph = []
    return graph


def seo_block(path, title, desc, is_legal):
    """Return the SEO head block (OG, Twitter, canonical, robots, hreflang)."""
    canonical = f"{ORIGIN}{path}"
    robots_val = (
        "noindex,follow"
        if is_legal
        else "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
    )
    og_type = "website" if path == "/" else ("article" if "-detail" in path or "insights" in path else "website")
    # Escape " in strings for attribute safety
    t_esc = title.replace('"', "&quot;")
    d_esc = desc.replace('"', "&quot;")
    return f"""  <!-- SEO: canonical, indexing, language -->
  <link rel="canonical" href="{canonical}" />
  <link rel="alternate" hreflang="ja" href="{canonical}" />
  <link rel="alternate" hreflang="x-default" href="{canonical}" />
  <meta name="robots" content="{robots_val}" />
  <meta name="googlebot" content="{robots_val}" />
  <meta name="author" content="Gloversal, Inc." />
  <!-- Open Graph -->
  <meta property="og:type" content="{og_type}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:site_name" content="{SITE_NAME}" />
  <meta property="og:locale" content="ja_JP" />
  <meta property="og:locale:alternate" content="en_US" />
  <meta property="og:title" content="{t_esc}" />
  <meta property="og:description" content="{d_esc}" />
  <meta property="og:image" content="{OG_IMAGE}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Gloversal, Inc. logo" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{t_esc}" />
  <meta name="twitter:description" content="{d_esc}" />
  <meta name="twitter:image" content="{OG_IMAGE}" />"""


def extract_title_desc(html):
    """Pull the existing <title> and <meta name="description"> from the page."""
    t_match = re.search(r"<title>(.*?)</title>", html, flags=re.IGNORECASE | re.DOTALL)
    d_match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>',
        html,
        flags=re.IGNORECASE,
    )
    title = t_match.group(1).strip() if t_match else "Gloversal, Inc."
    desc = d_match.group(1).strip() if d_match else "Gloversal, Inc."
    return title, desc


def patch_html(html, path, page_type, is_legal):
    """Return an updated HTML string with SEO head + JSON-LD injected."""
    title, desc = extract_title_desc(html)

    # --- Remove any previous SEO block this script may have inserted. ---
    html = re.sub(
        r"\s*<!-- SEO: canonical, indexing, language -->.*?<!-- /Gloversal SEO -->\n?",
        "\n",
        html,
        flags=re.DOTALL,
    )
    # Remove any stale partial OG left over from before this refactor
    html = re.sub(
        r'\s*<meta\s+property=["\']og:[^"\']+["\']\s+content=["\'][^"\']*["\']\s*/?>\s*',
        "",
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'\s*<meta\s+name=["\']twitter:[^"\']+["\']\s+content=["\'][^"\']*["\']\s*/?>\s*',
        "",
        html,
        flags=re.IGNORECASE,
    )
    # Remove any existing canonical/hreflang/robots (we re-add from scratch)
    html = re.sub(
        r'\s*<link\s+rel=["\'](?:canonical|alternate)["\'][^>]*>\s*',
        "",
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'\s*<meta\s+name=["\'](?:robots|googlebot|author)["\'][^>]*>\s*',
        "",
        html,
        flags=re.IGNORECASE,
    )
    # Remove previously-injected JSON-LD block so we can regenerate.
    html = re.sub(
        r"\s*<!-- Gloversal JSON-LD -->.*?<!-- /Gloversal JSON-LD -->\n?",
        "\n",
        html,
        flags=re.DOTALL,
    )

    # --- Inject the SEO block right after the theme-color meta. ---
    seo = seo_block(path, title, desc, is_legal)
    seo_marker = "\n  <!-- /Gloversal SEO -->"
    if re.search(r'<meta\s+name=["\']theme-color["\'][^>]*>', html):
        html = re.sub(
            r'(<meta\s+name=["\']theme-color["\'][^>]*>)',
            r"\1\n" + seo + seo_marker,
            html,
            count=1,
        )
    else:
        # Fallback: inject after <meta name="description">
        html = re.sub(
            r'(<meta\s+name=["\']description["\'][^>]*>)',
            r"\1\n" + seo + seo_marker,
            html,
            count=1,
        )

    # --- Inject JSON-LD graph right before </head>. ---
    graph = schema_for(page_type)
    if graph:
        ld = {
            "@context": "https://schema.org",
            "@graph": graph,
        }
        ld_block = (
            "  <!-- Gloversal JSON-LD -->\n"
            '  <script type="application/ld+json">\n'
            + json.dumps(ld, ensure_ascii=False, indent=2)
            + "\n  </script>\n"
            "  <!-- /Gloversal JSON-LD -->"
        )
        html = re.sub(
            r"</head>",
            ld_block + "\n</head>",
            html,
            count=1,
        )

    return html


def main():
    for fname, (path, page_type, is_legal) in PAGES.items():
        fpath = SITE_ROOT / fname
        if not fpath.exists():
            print(f"  SKIP (missing): {fname}")
            continue
        original = fpath.read_text(encoding="utf-8")
        patched = patch_html(original, path, page_type, is_legal)
        fpath.write_text(patched, encoding="utf-8")
        print(f"  [+] {fname}")
    print("\nDone.")


if __name__ == "__main__":
    main()
