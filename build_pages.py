"""Generate all inner HTML pages for Gloversal site."""
import pathlib

out = pathlib.Path("site")

# Shared shell parts
HEAD = """<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>{title} | Gloversal, Inc.</title>
  <meta name="description" content="{desc}" />
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
  <link rel="icon" type="image/png" href="assets/images/gloversal-mark.png" />
  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/base.css" />
  <link rel="stylesheet" href="css/main.css" />
  <link rel="stylesheet" href="css/responsive.css" />
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
    <a href="index.html" class="nav__logo" aria-label="Gloversal home"><span class="nav__logo-mark">G</span><span>Gloversal<sup>&trade;</sup></span></a>
    <nav aria-label="Main">
      <ul class="nav__menu" role="list">
        <li><a href="index.html" class="nav__link" data-i18n="nav.home">Home</a></li>
        <li><a href="about.html" class="nav__link" data-i18n="nav.about">About</a></li>
        <li><a href="services.html" class="nav__link" data-i18n="nav.services">Services</a></li>
        <li><a href="case-studies.html" class="nav__link" data-i18n="nav.cases">Case Studies</a></li>
        <li><a href="insights.html" class="nav__link" data-i18n="nav.insights">Insights</a></li>
        <li><a href="speaking.html" class="nav__link" data-i18n="nav.speaking">Activities</a></li>
        <li><a href="contact.html" class="nav__link" data-i18n="nav.contact">Contact</a></li>
      </ul>
    </nav>
    <div class="nav__right">
      <button class="lang-toggle" type="button" aria-label="Toggle language"><span class="lang-toggle__current">JA</span><span>/</span><span class="lang-toggle__alt">EN</span></button>
      <button class="theme-toggle" type="button" aria-label="Toggle theme">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      </button>
      <a href="contact.html" class="btn btn--primary" data-i18n="nav.cta">相談する</a>
      <button class="nav__hamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="nav-overlay" aria-hidden="true">
  <a href="index.html" data-i18n="nav.home">Home</a>
  <a href="about.html" data-i18n="nav.about">About</a>
  <a href="services.html" data-i18n="nav.services">Services</a>
  <a href="case-studies.html" data-i18n="nav.cases">Case Studies</a>
  <a href="insights.html" data-i18n="nav.insights">Insights</a>
  <a href="speaking.html" data-i18n="nav.speaking">Activities</a>
  <a href="contact.html" data-i18n="nav.contact">Contact</a>
  <div class="nav-overlay__footer"><span>Gloversal&trade; 2026</span><span class="email-inline" data-user="inquiry" data-domain="gloversal.com">inquiry [at] gloversal [dot] com</span></div>
</div>
<main>
"""

FOOTER = """
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
          <li><a href="index.html" data-i18n="nav.home">Home</a></li>
          <li><a href="about.html" data-i18n="nav.about">About</a></li>
          <li><a href="services.html" data-i18n="nav.services">Services</a></li>
          <li><a href="case-studies.html" data-i18n="nav.cases">Case Studies</a></li>
          <li><a href="insights.html" data-i18n="nav.insights">Insights</a></li>
          <li><a href="speaking.html" data-i18n="nav.speaking">Activities</a></li>
          <li><a href="contact.html" data-i18n="nav.contact">Contact</a></li>
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
        <a href="legal/privacy.html" data-i18n="footer.legalPrivacy">Privacy Policy</a>
        <a href="legal/cookies.html" data-i18n="footer.legalCookies">Cookie Policy</a>
        <a href="legal/terms.html" data-i18n="footer.legalTerms">Terms of Use</a>
        <a href="legal/disclaimer.html" data-i18n="footer.legalDisclaimer">Disclaimer</a>
        <a href="legal/notice.html" data-i18n="footer.legalNotice">Legal Notice</a>
        <a href="legal/recruitment.html" data-i18n="footer.legalRecruit">Recruitment Privacy</a>
      </div>
    </div>
  </div>
</footer>
<script src="js/i18n.js"></script>
<script src="js/main.js"></script>
</body>
</html>"""

CTA_BAND = """
<section class="cta-band" aria-labelledby="cta-title-page">
  <div class="container container-wide cta-band__grid">
    <div class="reveal">
      <span class="edge-label cta-band__eyebrow" data-i18n="ctaBand.eyebrow">Let's Talk</span>
      <h2 id="cta-title-page" data-i18n="ctaBand.title">次の一手を、<br><em>一緒に言語化する。</em></h2>
    </div>
    <div class="cta-band__cta reveal reveal--d1">
      <a href="contact.html" class="btn btn--on-dark btn--lg">
        <span data-i18n="ctaBand.ctaPrimary">お問い合わせ</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
      </a>
      <a href="services.html" class="btn btn--ghost btn--lg" style="border-color:rgba(255,255,255,.3);color:#fff" data-i18n="ctaBand.ctaSecondary">支援領域を見る</a>
    </div>
  </div>
</section>"""

ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>'

# =================================================================
# ABOUT PAGE
# =================================================================
about_body = f"""
<section class="page-hero">
  <div class="page-hero__grid-bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <div>
      <span class="edge-label page-hero__eyebrow" data-i18n="aboutPage.eyebrow">About / Profile</span>
      <h1 data-i18n="aboutPage.h1">現場と実装の、<br><em>あいだをつなぐ。</em></h1>
    </div>
    <div class="page-hero__crumbs" data-i18n="aboutPage.crumbs">Home / About</div>
  </div>
  <p class="container page-hero__lead reveal" data-i18n="aboutPage.lead">
    医療・ヘルスケア領域において、事業開発、アドバイザリー、アライアンス、プロダクト構想、導入設計を横断的に支援しています。現場の実情、制度や業界構造、テクノロジーの可能性、その間にある実装の難しさ。その全部を見ながら、構想を現実へ落とし込むことを専門としています。
  </p>
</section>

<section class="section">
  <div class="container container-wide">
    <div class="about-hero">
      <div class="reveal">
        <span class="edge-label" style="margin-bottom:1.5rem;display:block" data-i18n="aboutPage.valueTitle">私が提供する価値</span>
        <h2 class="t-headline" data-i18n="aboutPage.valueTitle">私が提供する価値</h2>
        <p class="t-body" style="margin-top:2rem" data-i18n="aboutPage.valueBody">
          単なるアイデア出しや助言にとどまらず、「何をやるべきか」を整理し、「どう進めるか」を設計し、「どう伝えるか」まで言語化します。そのため、経営層、事業責任者、開発チーム、医療専門職のあいだを横断しながら、それぞれの視点を接続して前に進める役割を果たします。
        </p>
      </div>
      <div class="about-portrait reveal reveal--d1">
        <span class="about-portrait__label" data-i18n="aboutPage.portraitLabel">[ YOSHI FURUSAWA &mdash; FOUNDER ]</span>
        <img src="assets/images/calactor.png" alt="Yoshi Furusawa" loading="lazy" />
      </div>
    </div>
  </div>
</section>

<section class="section section--alt">
  <div class="container container-wide">
    <div class="profile-blocks">
      <div class="reveal">
        <h3 data-i18n="aboutPage.specTitle">専門領域</h3>
        <ul>
          <li data-i18n="aboutPage.spec1">医療・ヘルスケア事業戦略</li>
          <li data-i18n="aboutPage.spec2">遠隔医療・画像診断・医療AI</li>
          <li data-i18n="aboutPage.spec3">海外ヘルステック企業の日本展開</li>
          <li data-i18n="aboutPage.spec4">医療機関・企業間の提携設計</li>
          <li data-i18n="aboutPage.spec5">医療DXの実装支援</li>
          <li data-i18n="aboutPage.spec6">ホワイトペーパー・提案書・説明資料の設計</li>
        </ul>
      </div>
      <div class="reveal reveal--d1">
        <h3 data-i18n="aboutPage.forTitle">こんな方に向いています</h3>
        <ul>
          <li data-i18n="aboutPage.for1">医療領域で新規事業を立ち上げたい</li>
          <li data-i18n="aboutPage.for2">医療現場に通じる外部アドバイザーがほしい</li>
          <li data-i18n="aboutPage.for3">海外サービスを日本市場向けに翻訳したい</li>
          <li data-i18n="aboutPage.for4">医療AIやSaaSを&ldquo;導入できる形&rdquo;まで落としたい</li>
          <li data-i18n="aboutPage.for5">提案資料や事業ストーリーを強くしたい</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container container-wide">
    <div class="stance reveal">
      <div class="stance__label" data-i18n="aboutPage.stanceLabel">[ STANCE ]</div>
      <div class="stance__body" data-i18n="aboutPage.stanceBody">
        医療は、人の命と生活に近い領域です。だからこそ、派手な言葉よりも、実装できる現実性。机上の理想よりも、現場と事業の両方に耐える設計。その姿勢を大切にしています。
      </div>
    </div>
  </div>
</section>

<section class="section section--alt">
  <div class="container container-wide">
    <div class="s-head reveal">
      <div class="s-head__body">
        <span class="edge-label s-head__eyebrow" data-i18n="aboutPage.roleTitle">肩書き・対応範囲</span>
        <h2 class="t-headline" data-i18n="aboutPage.roleTitle">肩書き・対応範囲</h2>
      </div>
    </div>
    <ul class="what-grid__list reveal">
      <li class="what-grid__item"><span class="what-grid__num">R1</span><span class="what-grid__text" data-i18n="aboutPage.role1">Healthcare Strategy / Medical Technology Advisor</span></li>
      <li class="what-grid__item"><span class="what-grid__num">R2</span><span class="what-grid__text" data-i18n="aboutPage.role2">対応言語: 日本語 / English</span></li>
      <li class="what-grid__item"><span class="what-grid__num">R3</span><span class="what-grid__text" data-i18n="aboutPage.role3">関与形態: 顧問・伴走・壁打ち・プロジェクト単位</span></li>
      <li class="what-grid__item"><span class="what-grid__num">R4</span><span class="what-grid__text" data-i18n="aboutPage.role4">対象地域: 日本 / 北米 / その他</span></li>
      <li class="what-grid__item"><span class="what-grid__num">R5</span><span class="what-grid__text" data-i18n="aboutPage.role5">対応チャネル: オンライン面談・東京オフィス</span></li>
    </ul>
  </div>
</section>
{CTA_BAND}
"""

# =================================================================
# SERVICES PAGE
# =================================================================
def svc_block(num, label_key, title_key, body_key, for_key, out_key, for_label, out_label, label_txt, title_txt, body_txt, for_txt, out_txt):
    return f"""
    <div class="service-block reveal">
      <div class="service-block__label" data-i18n="servicesPage.{label_key}">{label_txt}</div>
      <div class="service-block__content">
        <h3 data-i18n="servicesPage.{title_key}">{title_txt}</h3>
        <p data-i18n="servicesPage.{body_key}">{body_txt}</p>
        <dl class="service-block__detail">
          <dt data-i18n="servicesPage.labelFor">{for_label}</dt>
          <dd data-i18n="servicesPage.{for_key}">{for_txt}</dd>
          <dt data-i18n="servicesPage.labelOut">{out_label}</dt>
          <dd data-i18n="servicesPage.{out_key}">{out_txt}</dd>
        </dl>
      </div>
    </div>"""

services_body = f"""
<section class="page-hero">
  <div class="page-hero__grid-bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <div>
      <span class="edge-label page-hero__eyebrow" data-i18n="servicesPage.eyebrow">Services</span>
      <h1 data-i18n="servicesPage.h1">提供サービス。</h1>
    </div>
    <div class="page-hero__crumbs" data-i18n="servicesPage.crumbs">Home / Services</div>
  </div>
  <p class="container page-hero__lead reveal" data-i18n="servicesPage.lead">
    ご相談内容に応じて、スポットの助言から、プロジェクト伴走、事業構想、提携支援、資料設計まで柔軟に対応しています。
  </p>
</section>

<section class="section">
  <div class="container container-wide">
{svc_block('01','s1Label','s1Title','s1Body','s1For','s1Out','想定顧客','成果物例',
  '[ 01 / Strategic Advisory ]','医療・ヘルスケア事業アドバイザリー',
  '医療・ヘルスケア領域における新規事業、成長戦略、提携方針、ポジショニング設計を支援します。複雑な市場や制度環境を踏まえ、意思決定しやすい形に整理します。さらに、最新のAIコーディングツール(Claude Code、Cursor 等)や汎用AIエージェント(Manus、Skywork 等)の中から、業務に最適なツールの選定・導入もあわせて提案します。',
  '経営者 / 事業責任者 / 医療系企業',
  '戦略壁打ち、論点整理、市場整理メモ、提携仮説、Go-to-market 整理、AI ツール導入提案')}
{svc_block('02','s2Label','s2Title','s2Body','s2For','s2Out','想定顧客','成果物例',
  '[ 02 / Business Development ]','事業開発・アライアンス支援',
  '国内外の企業、医療機関、専門家との連携構築を支援します。単なる紹介ではなく、相互に成立する座組みや価値交換の設計まで行います。',
  '新規事業担当 / 海外企業 / アライアンス担当',
  '面談設計、提携ストーリー、候補先整理、紹介後の論点整理')}
{svc_block('03','s3Label','s3Title','s3Body','s3For','s3Out','想定顧客','成果物例',
  '[ 03 / Medical DX / AI ]','医療DX・AI導入支援',
  'AIやデジタル技術の導入可能性を、現場運用や制度、実装負荷まで含めて検討します。&ldquo;使えそう&rdquo;ではなく、&ldquo;使える形&rdquo;に落とし込む支援を行います。また、LangGraph や CrewAI、Ollama 等を組み合わせ、開発からマーケティングまで自律的にタスクを遂行する AI 組織の設計・実装まで踏み込みます。',
  '医療AIスタートアップ / 医療機関 / SaaS企業',
  'PoC 設計、要件整理、導入フロー、業務オペレーション設計、AI エージェント組織設計')}
{svc_block('04','s4Label','s4Title','s4Body','s4For','s4Out','想定顧客','成果物例',
  '[ 04 / Remote Healthcare &amp; Imaging ]','遠隔医療・画像診断・医療データ領域支援',
  '遠隔医療、画像診断支援、医療画像ワークフロー、医療データ連携など、専門性が高く構造の複雑なテーマに対応します。技術・制度・運用の接点を意識して設計します。',
  '遠隔画像診断関連企業 / 医療機関 / DX部門',
  'サービス設計、ワークフロー整理、制度論点整理、資料化')}
{svc_block('05','s5Label','s5Title','s5Body','s5For','s5Out','想定顧客','成果物例',
  '[ 05 / Market Entry Support ]','海外ヘルステック企業の日本展開支援',
  '海外企業にとって日本の医療市場は魅力的である一方、制度、商習慣、導入プロセス、信頼形成が独特です。日本市場向けの翻訳、再設計、対話支援を行います。',
  '海外ヘルステック企業 / グローバルBD',
  '市場適合メッセージ、提携仮説、日本向け訴求の再設計、候補先開拓')}
{svc_block('06','s6Label','s6Title','s6Body','s6For','s6Out','想定顧客','成果物例',
  '[ 06 / Content &amp; Messaging ]','資料設計・メッセージング支援',
  '事業説明、営業提案、ホワイトペーパー、ウェブコピー、サービス紹介など、伝えるべき価値を整理し、相手に伝わる構造へ設計します。',
  '提案営業組織 / 代表者 / マーケ担当',
  '提案資料、Web 原稿、ストーリーライン、説明用 Q&amp;A')}
  </div>
</section>
{CTA_BAND}
"""

# =================================================================
# CASE STUDIES PAGE
# =================================================================
cases_body = f"""
<section class="page-hero">
  <div class="page-hero__grid-bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <div>
      <span class="edge-label page-hero__eyebrow" data-i18n="casesPage.eyebrow">Case Studies</span>
      <h1 data-i18n="casesPage.h1">支援事例。</h1>
    </div>
    <div class="page-hero__crumbs" data-i18n="casesPage.crumbs">Home / Case Studies</div>
  </div>
  <p class="container page-hero__lead reveal" data-i18n="casesPage.lead">
    実名公開が難しい案件については、匿名化ケースとして「課題 → 支援内容 → 成果」の三段構成で統一しています。個別案件のご相談は Contact からお寄せください。
  </p>
</section>
<section class="section">
  <div class="container container-wide">
    <div class="case-grid">
      <article class="case-card reveal">
        <span class="case-card__tag" data-i18n="cases.c1Tag">Market Entry</span>
        <span class="case-card__num" data-i18n="cases.c1Num">Case 01</span>
        <h3 class="case-card__title" data-i18n="cases.c1Title">海外ヘルステック企業の<br>日本市場展開支援</h3>
        <dl class="case-card__meta">
          <dt data-i18n="cases.labelIssue">課題</dt><dd data-i18n="cases.c1Issue">日本市場の導入ハードルが高く、訴求先と価値提案が曖昧。</dd>
          <dt data-i18n="cases.labelWork">支援内容</dt><dd data-i18n="cases.c1Work">市場整理、提携仮説設計、訴求再定義、面談論点整理。</dd>
          <dt data-i18n="cases.labelResult">成果</dt><dd data-i18n="cases.c1Result">営業ストーリーの明確化、提携候補との対話前進、初期商談の質向上。</dd>
        </dl>
      </article>
      <article class="case-card reveal reveal--d1">
        <span class="case-card__tag" data-i18n="cases.c2Tag">Business Development</span>
        <span class="case-card__num" data-i18n="cases.c2Num">Case 02</span>
        <h3 class="case-card__title" data-i18n="cases.c2Title">医療画像関連サービスの<br>事業整理と提案設計</h3>
        <dl class="case-card__meta">
          <dt data-i18n="cases.labelIssue">課題</dt><dd data-i18n="cases.c2Issue">サービスの価値が伝わりにくく、説明資料が分散していた。</dd>
          <dt data-i18n="cases.labelWork">支援内容</dt><dd data-i18n="cases.c2Work">構造整理、訴求軸再設計、資料ストーリー化、導入メリットの言語化。</dd>
          <dt data-i18n="cases.labelResult">成果</dt><dd data-i18n="cases.c2Result">顧客説明の一貫性向上、営業会話の短縮、説明時の迷い減少。</dd>
        </dl>
      </article>
      <article class="case-card reveal reveal--d2">
        <span class="case-card__tag" data-i18n="cases.c3Tag">Medical AI</span>
        <span class="case-card__num" data-i18n="cases.c3Num">Case 03</span>
        <h3 class="case-card__title" data-i18n="cases.c3Title">医療AIプロダクトの<br>導入構想支援</h3>
        <dl class="case-card__meta">
          <dt data-i18n="cases.labelIssue">課題</dt><dd data-i18n="cases.c3Issue">技術はあるが、導入現場のフローと役割分担が見えない。</dd>
          <dt data-i18n="cases.labelWork">支援内容</dt><dd data-i18n="cases.c3Work">運用整理、PoC設計、導入論点の可視化、現場向け説明整理。</dd>
          <dt data-i18n="cases.labelResult">成果</dt><dd data-i18n="cases.c3Result">検討フェーズから実装フェーズへの移行を支援し、社内合意形成を加速。</dd>
        </dl>
      </article>
    </div>
    <p class="t-body-sm reveal" style="margin-top:3rem;padding:1.5rem;background:var(--bg-surface-alt);border-left:3px solid var(--brand-accent)" data-i18n="cases.note">
      実名公開が難しい案件については、匿名化ケースとして「課題 → 支援内容 → 成果」の三段構成で統一しています。個別案件のご相談は Contact からお寄せください。
    </p>
  </div>
</section>
{CTA_BAND}
"""

# =================================================================
# INSIGHTS PAGE
# =================================================================
def insight(num, date_key, label_key, title_key, excerpt_key, date_txt, label_txt, title_txt, excerpt_txt, delay=""):
    dc = f' reveal--d{delay}' if delay else ''
    return f"""
      <article class="insight-card reveal{dc}">
        <div class="insight-card__image" data-label="{label_txt}"></div>
        <span class="insight-card__date" data-i18n="insightsPage.{date_key}">{date_txt}</span>
        <h3 class="insight-card__title" data-i18n="insightsPage.{title_key}">{title_txt}</h3>
        <p class="insight-card__excerpt" data-i18n="insightsPage.{excerpt_key}">{excerpt_txt}</p>
      </article>"""

insights_body = f"""
<section class="page-hero">
  <div class="page-hero__grid-bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <div>
      <span class="edge-label page-hero__eyebrow" data-i18n="insightsPage.eyebrow">Insights</span>
      <h1 data-i18n="insightsPage.h1">見解・ナレッジ。</h1>
    </div>
    <div class="page-hero__crumbs" data-i18n="insightsPage.crumbs">Home / Insights</div>
  </div>
  <p class="container page-hero__lead reveal" data-i18n="insightsPage.lead">
    医療 AI、遠隔医療、ヘルステックの日本展開、医療機関とスタートアップの協業など、現場と事業のあいだで生まれる気づきを整理して公開しています。
  </p>
</section>
<section class="section">
  <div class="container container-wide">
    <div class="insights-grid">
{insight('1','a1Date','a1Label','a1Title','a1Excerpt','2026 &middot; 04','Medical AI','医療AIは<br>「精度」だけでは導入されない','導入現場で起きる&ldquo;精度と運用のズレ&rdquo;を整理し、PoCを本番運用に橋渡しするためのチェックポイントを解説します。')}
{insight('2','a2Date','a2Label','a2Title','a2Excerpt','2026 &middot; 03','Market Entry','海外ヘルステック企業が<br>日本でつまずく5つの論点','価格設計、商習慣、医療機関との関係性、制度理解、現場運用。海外発サービスが日本で詰まりやすい5つの論点を整理。','1')}
{insight('3','a3Date','a3Label','a3Title','a3Excerpt','2026 &middot; 03','Business Development','医療機関向け新規事業は、<br>なぜPoC止まりになるのか','PoCを事業化に進めるには、検討主体、評価指標、現場合意形成の3点を初期から設計する必要があります。','2')}
{insight('4','a4Date','a4Label','a4Title','a4Excerpt','2026 &middot; 02','Remote Healthcare','遠隔医療・画像診断領域で<br>事業を作るときに最初に整理すべきこと','読影フロー、医療機関側の導入責任、保険・費用構造、画像データ連携の4つの軸で事業仮説を組むアプローチ。')}
{insight('5','a5Date','a5Label','a5Title','a5Excerpt','2026 &middot; 01','Healthcare Data','医療現場と開発チームのあいだにある<br>&ldquo;見えない翻訳コスト&rdquo;','要件定義で見落とされやすい臨床ワークフロー・業務フロー・制度前提を、翻訳者として埋めるための視点。','1')}
{insight('6','a6Date','a6Label','a6Title','a6Excerpt','2025 &middot; 12','Alliance','医療機関とスタートアップの<br>協業で起きる典型的な3つの失敗','意思決定の主体、成果物の責任、関係者合意の順序。協業初期で最も躓きやすい論点を整理します。','2')}
    </div>
  </div>
</section>
{CTA_BAND}
"""

# =================================================================
# SPEAKING PAGE
# =================================================================
def activity(date_key, title_key, body_key, tag_key, date_txt, title_txt, body_txt, tag_txt):
    return f"""
    <div class="activity-item reveal">
      <span class="activity-item__date" data-i18n="speakingPage.{date_key}">{date_txt}</span>
      <div class="activity-item__body">
        <h3 data-i18n="speakingPage.{title_key}">{title_txt}</h3>
        <p data-i18n="speakingPage.{body_key}">{body_txt}</p>
      </div>
      <span class="activity-item__tag" data-i18n="speakingPage.{tag_key}">{tag_txt}</span>
    </div>"""

speaking_body = f"""
<section class="page-hero">
  <div class="page-hero__grid-bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <div>
      <span class="edge-label page-hero__eyebrow" data-i18n="speakingPage.eyebrow">Speaking / Media / Activities</span>
      <h1 data-i18n="speakingPage.h1">登壇・寄稿・活動。</h1>
    </div>
    <div class="page-hero__crumbs" data-i18n="speakingPage.crumbs">Home / Activities</div>
  </div>
  <p class="container page-hero__lead reveal" data-i18n="speakingPage.lead">
    講演、執筆、メディア出演、委員・顧問活動など、対外的な発信・活動を掲載します。掲載は順次更新予定です。
  </p>
</section>
<section class="section">
  <div class="container container-wide">
    <div class="activity-list">
{activity('i1Date','i1Title','i1Body','i1Tag','2026 &middot; 04','医療AIのビジネス実装カンファレンス 基調講演','医療AIの社会実装に向けた論点整理と、PoCから事業化へのステップを講演。','Keynote')}
{activity('i2Date','i2Title','i2Body','i2Tag','2026 &middot; 03','グローバル医療機器事業の日本展開ウェビナー','海外ヘルステック企業向けに、日本市場の特殊性と参入戦略を解説。','Webinar')}
{activity('i3Date','i3Title','i3Body','i3Tag','2026 &middot; 02','ヘルステック業界誌 インタビュー寄稿','医療とテクノロジーの翻訳者としての役割、アライアンス設計の実例を紹介。','Article')}
{activity('i4Date','i4Title','i4Body','i4Tag','2026 &middot; 01','大学病院&times;スタートアップ 合同ワークショップ','臨床現場の課題からプロダクト要件を抽出するセッションを設計・ファシリテート。','Workshop')}
{activity('i5Date','i5Title','i5Body','i5Tag','2025 &middot; 12','経営者向けAIエージェント活用セミナー','LangGraph/CrewAI等を用いた自律型AI組織の可能性と実装上の論点を共有。','Seminar')}
{activity('i6Date','i6Title','i6Body','i6Tag','2025 &middot; 11','海外スタートアップ向けメンター活動','日本進出を検討する海外ヘルステック企業のピッチ支援と戦略アドバイザリー。','Mentor')}
    </div>
    <p class="t-body-sm reveal" style="margin-top:2rem;padding:1.5rem;background:var(--bg-surface-alt);border-left:3px solid var(--brand-accent)" data-i18n="speakingPage.note">
      ※ 現在公開できる範囲での抜粋です。個別の登壇・取材・寄稿のご相談は Contact よりお寄せください。
    </p>
  </div>
</section>
{CTA_BAND}
"""

# =================================================================
# CONTACT PAGE
# =================================================================
contact_body = """
<section class="page-hero">
  <div class="page-hero__grid-bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <div>
      <span class="edge-label page-hero__eyebrow" data-i18n="contactPage.eyebrow">Contact</span>
      <h1 data-i18n="contactPage.h1">ご相談・<br><em>お問い合わせ。</em></h1>
    </div>
    <div class="page-hero__crumbs" data-i18n="contactPage.crumbs">Home / Contact</div>
  </div>
  <p class="container page-hero__lead reveal" data-i18n="contactPage.lead">
    以下のようなテーマのご相談を歓迎しています。初回のご相談では、課題の整理段階でも問題ありません。内容を確認のうえ、対応可能な進め方をご案内します。
  </p>
</section>
<section class="section">
  <div class="container container-wide">
    <div class="contact-grid">
      <div class="contact-intro reveal">
        <ul>
          <li data-i18n="contactPage.t1">医療・ヘルスケア領域の新規事業</li>
          <li data-i18n="contactPage.t2">海外ソリューションの日本市場展開</li>
          <li data-i18n="contactPage.t3">医療AI・DX・遠隔医療の構想整理</li>
          <li data-i18n="contactPage.t4">提携や事業開発の壁打ち</li>
          <li data-i18n="contactPage.t5">提案資料、サービス説明、事業ストーリーの整理</li>
        </ul>
        <div class="contact-channels">
          <dl class="contact-channel">
            <dt data-i18n="contactPage.inquiryLabel">Inquiry</dt>
            <dd><a class="email-link" href="#" data-user="inquiry" data-domain="gloversal.com"><span class="email-link__text">inquiry&nbsp;[at]&nbsp;gloversal&nbsp;[dot]&nbsp;com</span></a></dd>
          </dl>
          <dl class="contact-channel">
            <dt data-i18n="contactPage.officeLabel">Office</dt>
            <dd data-i18n="contactPage.officeBody">東京都渋谷区道玄坂一丁目10番8号<br>渋谷道玄坂東急ビル 2F-C</dd>
          </dl>
        </div>
      </div>
      <form action="#" method="POST" class="form reveal reveal--d1">
        <div class="form__group">
          <label class="form__label" data-i18n="contactPage.labelName">お名前 <span>*</span></label>
          <input class="form__input" type="text" name="name" required />
        </div>
        <div class="form__group">
          <label class="form__label" data-i18n="contactPage.labelCompany">会社名 / 所属</label>
          <input class="form__input" type="text" name="company" />
        </div>
        <div class="form__group form__group--full">
          <label class="form__label" data-i18n="contactPage.labelEmail">メールアドレス <span>*</span></label>
          <input class="form__input" type="email" name="email" required />
        </div>
        <div class="form__group">
          <label class="form__label" data-i18n="contactPage.labelTopic">ご相談テーマ</label>
          <select class="form__select" name="topic">
            <option value="" data-i18n="contactPage.topic0">選択してください</option>
            <option value="newbiz" data-i18n="contactPage.topic1">新規事業開発</option>
            <option value="entry" data-i18n="contactPage.topic2">海外展開・Market Entry</option>
            <option value="dxai" data-i18n="contactPage.topic3">医療DX / AI導入</option>
            <option value="remote" data-i18n="contactPage.topic4">遠隔医療 / 画像診断</option>
            <option value="content" data-i18n="contactPage.topic5">資料設計・メッセージング</option>
            <option value="other" data-i18n="contactPage.topic6">その他</option>
          </select>
        </div>
        <div class="form__group">
          <label class="form__label" data-i18n="contactPage.labelMode">希望する進め方</label>
          <select class="form__select" name="mode">
            <option value="" data-i18n="contactPage.mode0">選択してください</option>
            <option value="talk" data-i18n="contactPage.mode1">まずは相談したい</option>
            <option value="project" data-i18n="contactPage.mode2">プロジェクト伴走を検討したい</option>
            <option value="alliance" data-i18n="contactPage.mode3">提携・アライアンスを相談したい</option>
            <option value="other" data-i18n="contactPage.mode4">その他</option>
          </select>
        </div>
        <div class="form__group form__group--full">
          <label class="form__label" data-i18n="contactPage.labelUrl">参考URL / 資料URL</label>
          <input class="form__input" type="url" name="url" />
        </div>
        <div class="form__group form__group--full">
          <label class="form__label" data-i18n="contactPage.labelBody">ご相談内容 <span>*</span></label>
          <textarea class="form__textarea" name="body" required></textarea>
        </div>
        <div class="form__notice" data-i18n="contactPage.formNotice">
          お問い合わせフォーム送信時は、秘密性の高い情報、患者情報、機微情報、法令上特別の配慮を要する情報を、事前合意なく送信しないでください。必要に応じて、別途秘密保持契約その他の適切な手続をご案内します。
        </div>
        <button type="submit" class="btn btn--primary btn--lg form__submit" data-i18n="contactPage.submit">送信する</button>
      </form>
    </div>
  </div>
</section>
"""

# =================================================================
# WRITE FILES
# =================================================================
pages_to_write = {
    "about.html": ("About | プロフィール", "プロフィール — 医療×テクノロジー×事業開発をつなぐアドバイザー | Gloversal, Inc.", about_body),
    "services.html": ("Services | 提供サービス", "提供サービス — 医療事業戦略・海外展開・医療AI導入支援 | Gloversal, Inc.", services_body),
    "case-studies.html": ("Case Studies | 支援事例", "支援事例 — 医療・ヘルスケア領域の事業開発と実装支援 | Gloversal, Inc.", cases_body),
    "insights.html": ("Insights | 見解", "医療DX・医療AI・ヘルステック実装の知見 | Gloversal, Inc.", insights_body),
    "speaking.html": ("Activities | 登壇・活動", "登壇・寄稿・活動 — Gloversal, Inc.", speaking_body),
    "contact.html": ("Contact | お問い合わせ", "ご相談・お問い合わせ — Gloversal, Inc.", contact_body),
}

for filename, (title, desc, body) in pages_to_write.items():
    html = HEAD.format(title=title, desc=desc) + body + FOOTER
    (out / filename).write_text(html, encoding="utf-8")
    print(f"  Created {filename}")

print("\nAll 6 inner pages created.")
