"""
Generate one static HTML file per content slug.

URL layout:
  /insights/<slug>.html
  /case-studies/<slug>.html
  /speaking/<slug>.html

Each page is fully self-contained:
  * Title / description / OG / Twitter / canonical / hreflang point to the
    slug-specific URL — every detail URL has unique SEO metadata, no JS
    rendering required for crawlers and SNS preview cards.
  * Article body is inlined into .detail-body (no JS hydration needed).
  * JSON-LD Article + BreadcrumbList graph included.
  * Existing insight-detail.html / case-detail.html / speaking-detail.html
    templates remain in place as a JS-rendered fallback for legacy links.

Source of truth: site/js/content-data.js. Loaded into Python via Node.js
so we never reimplement JS object literal parsing.

Run: python tools/build_detail_pages.py
"""
import json
import pathlib
import subprocess
import sys

ORIGIN = "https://gloversal.com"
SITE_NAME = "Gloversal, Inc."
DEFAULT_OG = f"{ORIGIN}/assets/images/gloversal-og.png"
DEFAULT_OG_W, DEFAULT_OG_H = 1200, 630
GA_ID = "G-TDS1K2TNZJ"

SITE = pathlib.Path("site")

# Per-slug image overrides for insights. Cases/speaking fall through to
# the brand OG card.
INSIGHT_IMAGES = {
    "medical-ai-accuracy-gap": "1_medical_ai.png",
    "global-healthtech-japan-stalls": "2_market_entry.png",
    "poc-stall-hospital-business": "3_business_dev.png",
    "remote-healthcare-imaging-business": "4_remote_health.png",
    "invisible-translation-cost": "5_health_data.png",
    "hospital-startup-alliance-failures": "6_alliance.png",
}

# Section → URL prefix + label + breadcrumb-list-page label.
SECTIONS = {
    "insights": {
        "dir": "insights",
        "list_path": "/insights.html",
        "list_label": "Insights",
        "list_label_ja": "見解 / Insights",
        "back_label": "Insights 一覧へ",
        "schema_type": "Article",
    },
    "speaking": {
        "dir": "speaking",
        "list_path": "/speaking.html",
        "list_label": "Activities",
        "list_label_ja": "活動 / Activities",
        "back_label": "Activities 一覧へ",
        "schema_type": "Event",
    },
    "cases": {
        "dir": "case-studies",
        "list_path": "/case-studies.html",
        "list_label": "Case Studies",
        "list_label_ja": "支援事例 / Case Studies",
        "back_label": "Case Studies 一覧へ",
        "schema_type": "CreativeWork",
    },
}


def load_content():
    """Use Node.js to evaluate content-data.js and dump JSON."""
    js = """
const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('site/js/content-data.js', 'utf-8');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(code, ctx);
process.stdout.write(JSON.stringify(ctx.window.__GLV_CONTENT__));
"""
    res = subprocess.run(
        ["node", "-e", js],
        capture_output=True,
        text=True,
        check=True,
        encoding="utf-8",
    )
    return json.loads(res.stdout)


def slug_image(section, slug):
    if section == "insights" and slug in INSIGHT_IMAGES:
        rel = f"assets/images/insights/{INSIGHT_IMAGES[slug]}"
        return (f"{ORIGIN}/{rel}", 1200, 900)
    return (DEFAULT_OG, DEFAULT_OG_W, DEFAULT_OG_H)


def build_jsonld(section, slug, item, canonical, og_image_url):
    info = SECTIONS[section]
    title_ja = item["title"]["ja"]
    excerpt_ja = item.get("excerpt", {}).get("ja", "")
    date_published = item.get("date", "")

    article_node = {
        "@type": info["schema_type"],
        "@id": f"{canonical}#main",
        "headline": title_ja,
        "name": title_ja,
        "description": excerpt_ja,
        "url": canonical,
        "image": og_image_url,
        "inLanguage": "ja",
        "isPartOf": {"@id": f"{ORIGIN}/#website"},
        "publisher": {"@id": f"{ORIGIN}/#organization"},
        "author": {"@id": f"{ORIGIN}/#founder"},
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
    }
    if date_published:
        article_node["datePublished"] = date_published
        article_node["dateModified"] = date_published

    breadcrumb = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{ORIGIN}/"},
            {
                "@type": "ListItem",
                "position": 2,
                "name": info["list_label"],
                "item": f"{ORIGIN}{info['list_path']}",
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title_ja,
                "item": canonical,
            },
        ],
    }
    return {"@context": "https://schema.org", "@graph": [article_node, breadcrumb]}


def render_page(section, slug, item, prev_item, next_item):
    info = SECTIONS[section]
    canonical = f"{ORIGIN}/{info['dir']}/{slug}.html"
    og_image_url, og_w, og_h = slug_image(section, slug)
    title_ja = item["title"]["ja"]
    excerpt_ja = item.get("excerpt", {}).get("ja", "")
    body_ja = item.get("body", {}).get("ja", "")
    tag = item.get("tag", "")
    date_label = item.get("dateLabel", {}).get("ja") or item.get("date", "")

    full_title = f"{title_ja} | {SITE_NAME}"
    desc = excerpt_ja.replace('"', "&quot;")
    title_attr = title_ja.replace('"', "&quot;")
    twitter_card = "summary_large_image" if (og_w / max(og_h, 1)) >= 1.5 else "summary"

    jsonld = json.dumps(
        build_jsonld(section, slug, item, canonical, og_image_url),
        ensure_ascii=False,
        indent=2,
    )

    # Detail pages live one directory deep, so static asset paths use ../
    asset_prefix = "../"

    nav_links = [
        ("index.html", "nav.home", "Home"),
        ("about.html", "nav.about", "About"),
        ("services.html", "nav.services", "Services"),
        ("case-studies.html", "nav.cases", "Case Studies"),
        ("insights.html", "nav.insights", "Insights"),
        ("speaking.html", "nav.speaking", "Activities"),
        ("contact.html", "nav.contact", "Contact"),
    ]
    nav_menu = "\n        ".join(
        f'<li><a href="{asset_prefix}{href}" class="nav__link" data-i18n="{i18n}">{label}</a></li>'
        for href, i18n, label in nav_links
    )
    nav_overlay = "\n  ".join(
        f'<a href="{asset_prefix}{href}" data-i18n="{i18n}">{label}</a>'
        for href, i18n, label in nav_links
    )

    prev_html = (
        f'<a class="detail-nav__prev" href="{prev_item["slug"]}.html"><small data-i18n="detail.prev">&larr; 前の記事</small><span>{prev_item["title"]["ja"]}</span></a>'
        if prev_item
        else '<span class="detail-nav__prev" aria-hidden="true" style="visibility:hidden"></span>'
    )
    next_html = (
        f'<a class="detail-nav__next" href="{next_item["slug"]}.html"><small data-i18n="detail.next">次の記事 &rarr;</small><span>{next_item["title"]["ja"]}</span></a>'
        if next_item
        else '<span class="detail-nav__next" aria-hidden="true" style="visibility:hidden"></span>'
    )

    return f"""<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>{full_title}</title>
  <meta name="description" content="{desc}" />
  <meta name="theme-color" content="#0A165E" />
  <!-- SEO: canonical, indexing, language -->
  <link rel="canonical" href="{canonical}" />
  <link rel="alternate" hreflang="ja" href="{canonical}" />
  <link rel="alternate" hreflang="x-default" href="{canonical}" />
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
  <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
  <meta name="author" content="{SITE_NAME}" />
  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:site_name" content="{SITE_NAME}" />
  <meta property="og:locale" content="ja_JP" />
  <meta property="og:locale:alternate" content="en_US" />
  <meta property="og:title" content="{title_attr}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:image" content="{og_image_url}" />
  <meta property="og:image:width" content="{og_w}" />
  <meta property="og:image:height" content="{og_h}" />
  <meta property="og:image:alt" content="{title_attr}" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="{twitter_card}" />
  <meta name="twitter:title" content="{title_attr}" />
  <meta name="twitter:description" content="{desc}" />
  <meta name="twitter:image" content="{og_image_url}" />
  <!-- /Gloversal SEO -->
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', '{GA_ID}');
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=BIZ+UDPGothic:wght@400;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/png" href="{asset_prefix}assets/images/gloversal-mark.png" />
  <link rel="stylesheet" href="{asset_prefix}css/tokens.css" />
  <link rel="stylesheet" href="{asset_prefix}css/base.css" />
  <link rel="stylesheet" href="{asset_prefix}css/main.css" />
  <link rel="stylesheet" href="{asset_prefix}css/responsive.css" />
  <!-- Gloversal JSON-LD -->
  <script type="application/ld+json">
{jsonld}
  </script>
  <!-- /Gloversal JSON-LD -->
</head>
<body data-content-type="{section}" data-slug="{slug}">
<div class="cursor-dot" aria-hidden="true"></div>
<div class="cursor-ring" aria-hidden="true"></div>
<div class="sysbar" role="status" aria-label="System status">
  <div class="sysbar__left"><span>GLOVERSAL_CORE_v2026</span><span class="sysbar__sep">|</span><span>HEALTHCARE_STRATEGY // ACTIVE</span></div>
  <div class="sysbar__right"><span>TOKYO / GLOBAL</span><span class="sysbar__sep">|</span><span class="sysbar__blink">● LIVE</span></div>
</div>
<header class="nav" role="banner">
  <div class="nav__inner">
    <a href="{asset_prefix}index.html" class="nav__logo" aria-label="Gloversal home"><span class="nav__logo-mark">G</span><span>Gloversal<sup>&trade;</sup></span></a>
    <nav aria-label="Main">
      <ul class="nav__menu" role="list">
        {nav_menu}
      </ul>
    </nav>
    <div class="nav__right">
      <button class="lang-toggle" type="button" aria-label="Toggle language"><span class="lang-toggle__current">JA</span><span>/</span><span class="lang-toggle__alt">EN</span></button>
      <button class="theme-toggle" type="button" aria-label="Toggle theme">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      </button>
      <a href="{asset_prefix}contact.html" class="btn btn--primary" data-i18n="nav.cta">相談する</a>
      <button class="nav__hamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="nav-overlay" aria-hidden="true">
  {nav_overlay}
  <div class="nav-overlay__footer"><span>Gloversal&trade; 2026</span><span class="email-inline" data-user="inquiry" data-domain="gloversal.com">inquiry [at] gloversal [dot] com</span></div>
</div>
<main>

<section class="detail-hero">
  <div class="detail-hero__mesh" aria-hidden="true"></div>
  <div class="container">
    <a href="{asset_prefix}{info['list_path'].lstrip('/')}" class="detail-back">&larr; {info['back_label']}</a>
    <span class="detail-tag edge-label">{tag}</span>
    <h1 class="detail-title">{title_ja}</h1>
    <div class="detail-meta">
      <span class="detail-date">{date_label}</span>
    </div>
    <p class="detail-lead">{excerpt_ja}</p>
  </div>
</section>

<article class="section">
  <div class="container detail-body">
{body_ja}
  </div>
</article>

<nav class="detail-nav" aria-label="Article navigation">
  <div class="container detail-nav__inner">
    {prev_html}
    {next_html}
  </div>
</nav>

<section class="cta-band" aria-labelledby="cta-title-detail">
  <div class="container container-wide cta-band__grid">
    <div class="reveal">
      <span class="edge-label cta-band__eyebrow" data-i18n="ctaBand.eyebrow">Let's Talk</span>
      <h2 id="cta-title-detail" data-i18n="ctaBand.title">次の一手を、<br><em>一緒に言語化する。</em></h2>
    </div>
    <div class="cta-band__cta reveal reveal--d1">
      <a href="{asset_prefix}contact.html" class="btn btn--on-dark btn--lg">
        <span data-i18n="ctaBand.ctaPrimary">お問い合わせ</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
      </a>
      <a href="{asset_prefix}services.html" class="btn btn--ghost btn--lg" style="border-color:rgba(255,255,255,.3);color:#fff" data-i18n="ctaBand.ctaSecondary">支援領域を見る</a>
    </div>
  </div>
</section>

</main>
<footer class="footer" role="contentinfo">
  <div class="container container-wide">
    <div class="footer__grid">
      <div class="footer__brand">
        <h3 data-i18n="footer.brandTitle">Gloversal, Inc.</h3>
        <p data-i18n="footer.brandBody">医療・ヘルスケアの構想を、事業と実装へ。Healthcare strategy, medical technology, and business development.</p>
      </div>
      <div class="footer__col">
        <h4 data-i18n="footer.navTitle">Navigation</h4>
        <ul>
          <li><a href="{asset_prefix}index.html" data-i18n="nav.home">Home</a></li>
          <li><a href="{asset_prefix}about.html" data-i18n="nav.about">About</a></li>
          <li><a href="{asset_prefix}services.html" data-i18n="nav.services">Services</a></li>
          <li><a href="{asset_prefix}case-studies.html" data-i18n="nav.cases">Case Studies</a></li>
          <li><a href="{asset_prefix}insights.html" data-i18n="nav.insights">Insights</a></li>
          <li><a href="{asset_prefix}speaking.html" data-i18n="nav.speaking">Activities</a></li>
          <li><a href="{asset_prefix}contact.html" data-i18n="nav.contact">Contact</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4 data-i18n="footer.contactTitle">Contact</h4>
        <ul>
          <li><a class="email-link" href="#" data-user="inquiry" data-domain="gloversal.com"><span class="email-link__text">inquiry&nbsp;[at]&nbsp;gloversal&nbsp;[dot]&nbsp;com</span></a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4 data-i18n="footer.addressTitle">Offices</h4>
        <address>
          <strong data-i18n="footer.hqLabel">HQ</strong><br>
          <span data-i18n="footer.hqBody">113 Barksdale Professional Center<br>City of Newark, County of New Castle<br>Delaware 19711, USA</span><br><br>
          <strong data-i18n="footer.jpLabel">Tokyo</strong><br>
          <span data-i18n="footer.jpBody">&lang;150-0043<br>東京都渋谷区道玄坂一丁目10番8号<br>渋谷道玄坂東急ビル 2F-C</span>
        </address>
      </div>
    </div>
    <div class="footer__bottom">
      <span data-i18n="footer.copyright">&copy; 2026 Gloversal, Inc. &mdash; STRATEGIC ADVISORY &amp; EXECUTION</span>
      <div class="footer__legal">
        <a href="{asset_prefix}legal/privacy.html" data-i18n="footer.legalPrivacy">Privacy Policy</a>
        <a href="{asset_prefix}legal/cookies.html" data-i18n="footer.legalCookies">Cookie Policy</a>
        <a href="{asset_prefix}legal/terms.html" data-i18n="footer.legalTerms">Terms of Use</a>
        <a href="{asset_prefix}legal/disclaimer.html" data-i18n="footer.legalDisclaimer">Disclaimer</a>
        <a href="{asset_prefix}legal/notice.html" data-i18n="footer.legalNotice">Legal Notice</a>
        <a href="{asset_prefix}legal/recruitment.html" data-i18n="footer.legalRecruit">Recruitment Privacy</a>
      </div>
    </div>
  </div>
</footer>
<script src="{asset_prefix}js/i18n.js"></script>
<script src="{asset_prefix}js/main.js"></script>
<script src="{asset_prefix}js/content.js"></script>
</body>
</html>
"""


def main():
    data = load_content()
    total = 0
    for section, items in data.items():
        if section not in SECTIONS:
            continue
        info = SECTIONS[section]
        out_dir = SITE / info["dir"]
        out_dir.mkdir(parents=True, exist_ok=True)
        for i, item in enumerate(items):
            slug = item["slug"]
            prev_item = items[i - 1] if i > 0 else None
            next_item = items[i + 1] if i + 1 < len(items) else None
            html = render_page(section, slug, item, prev_item, next_item)
            (out_dir / f"{slug}.html").write_text(html, encoding="utf-8")
            total += 1
        print(f"  [+] {section}: {len(items)} pages -> site/{info['dir']}/")
    print(f"\n  Total: {total} static detail pages.")


if __name__ == "__main__":
    main()
