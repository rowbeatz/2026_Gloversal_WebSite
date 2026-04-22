"""Generate legal HTML pages from markdown sources."""
import pathlib, re

md_dir = pathlib.Path("gloversal_legal_docs_markdown_2026-04-16")
out_dir = pathlib.Path("site/legal")
out_dir.mkdir(exist_ok=True)

pages = [
    ("01_privacy_policy_ja.md", "privacy.html", "Privacy Policy", "プライバシーポリシー"),
    ("02_cookie_policy_ja.md", "cookies.html", "Cookie Policy", "クッキーポリシー"),
    ("03_terms_of_use_ja.md", "terms.html", "Terms of Use", "サイト利用規約"),
    ("04_disclaimer_ja.md", "disclaimer.html", "Disclaimer", "免責事項・医療情報に関する注意"),
    ("05_legal_notice_company_info_ja.md", "notice.html", "Legal Notice", "会社情報・法定表示"),
    ("06_recruitment_privacy_notice_ja.md", "recruitment.html", "Recruitment Privacy", "採用応募者向け個人情報取扱い通知"),
]

def md_to_html(md):
    lines = md.split("\n")
    html_parts = []
    in_list = False
    for line in lines:
        s = line.strip()
        is_li = s.startswith("- ")
        if is_li and not in_list:
            html_parts.append("<ul>")
            in_list = True
        elif not is_li and in_list:
            html_parts.append("</ul>")
            in_list = False

        if s.startswith("# "):
            pass  # skip h1 — we use page-hero
        elif s.startswith("## "):
            html_parts.append(f"<h2>{s[3:]}</h2>")
        elif s.startswith("### "):
            html_parts.append(f"<h3>{s[4:]}</h3>")
        elif is_li:
            txt = re.sub(r"<([^>]+@[^>]+)>", r'<a href="mailto:\1">\1</a>', s[2:])
            html_parts.append(f"<li>{txt}</li>")
        elif s == "":
            continue
        elif s.startswith("# "):
            continue
        else:
            txt = re.sub(r"<([^>]+@[^>]+)>", r'<a href="mailto:\1">\1</a>', s)
            html_parts.append(f"<p>{txt}</p>")
    if in_list:
        html_parts.append("</ul>")
    return "\n".join(html_parts)

SHELL_TOP = """<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>{en} | Gloversal, Inc.</title>
  <meta name="description" content="{ja} — Gloversal, Inc." />
  <meta name="robots" content="noindex,follow" />
  <meta name="theme-color" content="#0A165E" />
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-TDS1K2TNZJ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-TDS1K2TNZJ');
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+JP:wght@400&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/png" href="../assets/images/gloversal-mark.png" />
  <link rel="stylesheet" href="../css/tokens.css" />
  <link rel="stylesheet" href="../css/base.css" />
  <link rel="stylesheet" href="../css/main.css" />
  <link rel="stylesheet" href="../css/responsive.css" />
</head>
<body>
<div class="cursor-dot" aria-hidden="true"></div>
<div class="cursor-ring" aria-hidden="true"></div>
<div class="sysbar" role="status" aria-label="System status">
  <div class="sysbar__left"><span>GLOVERSAL_CORE_v2026</span><span class="sysbar__sep">|</span><span>HEALTHCARE_STRATEGY // ACTIVE</span></div>
  <div class="sysbar__right"><span>TOKYO / GLOBAL</span><span class="sysbar__sep">|</span><span class="sysbar__blink">● LIVE</span></div>
</div>
<header class="nav" role="banner">
  <div class="nav__inner">
    <a href="../index.html" class="nav__logo" aria-label="Gloversal home"><span class="nav__logo-mark">G</span><span>Gloversal<sup>&trade;</sup></span></a>
    <nav aria-label="Main">
      <ul class="nav__menu" role="list">
        <li><a href="../index.html" class="nav__link" data-i18n="nav.home">Home</a></li>
        <li><a href="../about.html" class="nav__link" data-i18n="nav.about">About</a></li>
        <li><a href="../services.html" class="nav__link" data-i18n="nav.services">Services</a></li>
        <li><a href="../case-studies.html" class="nav__link" data-i18n="nav.cases">Case Studies</a></li>
        <li><a href="../insights.html" class="nav__link" data-i18n="nav.insights">Insights</a></li>
        <li><a href="../speaking.html" class="nav__link" data-i18n="nav.speaking">Activities</a></li>
        <li><a href="../contact.html" class="nav__link" data-i18n="nav.contact">Contact</a></li>
      </ul>
    </nav>
    <div class="nav__right">
      <button class="lang-toggle" type="button" aria-label="Toggle language"><span class="lang-toggle__current">JA</span><span>/</span><span class="lang-toggle__alt">EN</span></button>
      <button class="theme-toggle" type="button" aria-label="Toggle theme">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      </button>
      <a href="../contact.html" class="btn btn--primary" data-i18n="nav.cta">相談する</a>
      <button class="nav__hamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="nav-overlay" aria-hidden="true">
  <a href="../index.html" data-i18n="nav.home">Home</a>
  <a href="../about.html" data-i18n="nav.about">About</a>
  <a href="../services.html" data-i18n="nav.services">Services</a>
  <a href="../case-studies.html" data-i18n="nav.cases">Case Studies</a>
  <a href="../insights.html" data-i18n="nav.insights">Insights</a>
  <a href="../speaking.html" data-i18n="nav.speaking">Activities</a>
  <a href="../contact.html" data-i18n="nav.contact">Contact</a>
  <div class="nav-overlay__footer"><span>Gloversal&trade; 2026</span><span class="email-inline" data-user="inquiry" data-domain="gloversal.com">inquiry [at] gloversal [dot] com</span></div>
</div>
<main>
  <section class="page-hero">
    <div class="page-hero__grid-bg" aria-hidden="true"></div>
    <div class="container page-hero__inner">
      <div>
        <span class="edge-label page-hero__eyebrow">{en}</span>
        <h1>{ja}</h1>
      </div>
      <div class="page-hero__crumbs"><a href="../index.html">Home</a> / {en}</div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="legal-doc">
        <div class="legal-doc__meta">Gloversal, Inc. | {en} | Effective 2026-04-16</div>
"""

SHELL_BOTTOM = """
      </div>
    </div>
  </section>
</main>
<footer class="footer" role="contentinfo">
  <div class="container container-wide">
    <div class="footer__grid">
      <div class="footer__brand"><h3>Gloversal, Inc.</h3><p>Healthcare strategy, medical technology, and business development.</p></div>
      <div class="footer__col"><h4>Navigation</h4>
        <ul><li><a href="../index.html">Home</a></li><li><a href="../about.html">About</a></li><li><a href="../services.html">Services</a></li><li><a href="../contact.html">Contact</a></li></ul>
      </div>
      <div class="footer__col"><h4>Legal</h4>
        <ul><li><a href="privacy.html">Privacy Policy</a></li><li><a href="cookies.html">Cookie Policy</a></li><li><a href="terms.html">Terms of Use</a></li><li><a href="disclaimer.html">Disclaimer</a></li><li><a href="notice.html">Legal Notice</a></li><li><a href="recruitment.html">Recruitment Privacy</a></li></ul>
      </div>
      <div class="footer__col"><h4>Offices</h4>
        <address><strong>HQ</strong><br>113 Barksdale Professional Center<br>Newark, DE 19711, USA<br><br><strong>Tokyo</strong><br>150-0043 Shibuya Dogenzaka Tokyu Bldg. 2F-C</address>
      </div>
    </div>
    <div class="footer__bottom">
      <span>&copy; 2026 Gloversal, Inc.</span>
      <div class="footer__legal"><a href="privacy.html">Privacy</a><a href="cookies.html">Cookies</a><a href="terms.html">Terms</a><a href="disclaimer.html">Disclaimer</a><a href="notice.html">Notice</a><a href="recruitment.html">Recruitment</a></div>
    </div>
  </div>
</footer>
<script src="../js/i18n.js"></script>
<script src="../js/main.js"></script>
</body>
</html>"""

for src, out_name, en, ja in pages:
    md = (md_dir / src).read_text(encoding="utf-8")
    body = md_to_html(md)
    html = SHELL_TOP.format(en=en, ja=ja) + body + SHELL_BOTTOM
    (out_dir / out_name).write_text(html, encoding="utf-8")
    print(f"  Created {out_name}")

print("All 6 legal pages created.")
