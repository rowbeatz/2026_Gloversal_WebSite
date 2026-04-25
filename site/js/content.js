/* =============================================================
   Gloversal — content.js
   Detail page renderer + toast system + scroll progress
   ============================================================= */
(() => {
  'use strict';
  const data = window.__GLV_CONTENT__ || {};
  const getLang = () => document.documentElement.getAttribute('lang') || 'ja';
  const t = (obj) => (typeof obj === 'object' && obj !== null) ? (obj[getLang()] || obj.ja || '') : (obj || '');

  /* ---------- Toast ---------- */
  window.Toast = {
    show(msg, type = 'success') {
      let c = document.querySelector('.toast-container');
      if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
      const el = document.createElement('div');
      el.className = `toast toast--${type}`;
      el.textContent = msg;
      c.appendChild(el);
      requestAnimationFrame(() => el.classList.add('is-visible'));
      setTimeout(() => { el.classList.remove('is-visible'); setTimeout(() => el.remove(), 400); }, 4000);
    }
  };

  /* ---------- Scroll Progress ---------- */
  const ScrollProgress = {
    init() {
      const bar = document.createElement('div');
      bar.className = 'scroll-progress';
      document.body.prepend(bar);
      const update = () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
      };
      window.addEventListener('scroll', update, { passive: true });
      update();
    }
  };

  /* ---------- CountUp ---------- */
  const CountUp = {
    init() {
      const els = document.querySelectorAll('.hero__stat-value');
      if (!els.length) return;
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const raw = el.textContent.trim();
          const match = raw.match(/^(\d+)/);
          if (!match) return;
          const target = parseInt(match[1], 10);
          const suffix = raw.replace(/^\d+/, '');
          let cur = 0;
          const step = Math.max(1, Math.ceil(target / 40));
          const tick = () => {
            cur = Math.min(cur + step, target);
            el.textContent = (cur < 10 && target >= 10 ? '0' : '') + cur + suffix;
            if (cur < target) requestAnimationFrame(tick);
          };
          el.textContent = '0' + suffix;
          requestAnimationFrame(tick);
          io.unobserve(el);
        });
      }, { threshold: 0.5 });
      els.forEach(el => io.observe(el));
    }
  };

  /* ---------- Detail Renderer ---------- */
  const ContentRenderer = {
    init() {
      const body = document.querySelector('.detail-body');
      if (!body) return;
      const params = new URLSearchParams(location.search);
      // Static pre-rendered pages use a clean URL (no ?slug=); fall back to data-slug attr.
      const slug = params.get('slug') || document.body.dataset.slug || null;
      const type = document.body.dataset.contentType;
      if (!slug || !type || !data[type]) {
        // If body already has pre-rendered content (static page), don't clobber it.
        if (body.children.length > 0) return;
        return this.notFound(body);
      }

      const items = data[type];
      const item = items.find(i => i.slug === slug);
      if (!item) return this.notFound(body);

      const lang = getLang();
      document.querySelector('.detail-tag').textContent = item.tag || '';
      document.querySelector('.detail-date').textContent = t(item.dateLabel) || item.date || '';
      const titleEl = document.querySelector('.detail-title');
      titleEl.innerHTML = t(item.title);
      const fullTitle = titleEl.textContent + ' | Gloversal, Inc.';
      document.title = fullTitle;

      if (item.excerpt) {
        const lead = document.querySelector('.detail-lead');
        if (lead) lead.innerHTML = t(item.excerpt);
      }

      body.innerHTML = t(item.body);

      // Update SEO meta to reflect this specific slug (canonical, OG, Twitter)
      // so each detail URL has unique metadata even though it shares an HTML template.
      const url = `${location.origin}${location.pathname}?slug=${slug}`;
      const plainExcerpt = (t(item.excerpt) || '').replace(/<[^>]+>/g, '').trim();
      const setMeta = (selector, attr, value) => {
        const el = document.querySelector(selector);
        if (el && value) el.setAttribute(attr, value);
      };
      setMeta('link[rel="canonical"]', 'href', url);
      setMeta('link[rel="alternate"][hreflang="ja"]', 'href', url);
      setMeta('link[rel="alternate"][hreflang="x-default"]', 'href', url);
      setMeta('meta[property="og:url"]', 'content', url);
      setMeta('meta[property="og:title"]', 'content', fullTitle);
      setMeta('meta[property="og:description"]', 'content', plainExcerpt);
      setMeta('meta[name="twitter:title"]', 'content', fullTitle);
      setMeta('meta[name="twitter:description"]', 'content', plainExcerpt);

      // nav prev/next
      const idx = items.indexOf(item);
      const prevItem = items[idx - 1];
      const nextItem = items[idx + 1];
      const nav = document.querySelector('.detail-nav');
      if (nav) {
        const base = location.pathname;
        if (prevItem) {
          nav.querySelector('.detail-nav__prev').href = `${base}?slug=${prevItem.slug}`;
          nav.querySelector('.detail-nav__prev span').innerHTML = t(prevItem.title);
        } else {
          nav.querySelector('.detail-nav__prev').style.visibility = 'hidden';
        }
        if (nextItem) {
          nav.querySelector('.detail-nav__next').href = `${base}?slug=${nextItem.slug}`;
          nav.querySelector('.detail-nav__next span').innerHTML = t(nextItem.title);
        } else {
          nav.querySelector('.detail-nav__next').style.visibility = 'hidden';
        }
      }
    },
    notFound(body) {
      body.innerHTML = '<p style="text-align:center;padding:4rem 0;color:var(--text-muted)">Content not found.</p>';
    }
  };

  /* ---------- Boot additions ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  function boot() {
    ScrollProgress.init();
    CountUp.init();
    ContentRenderer.init();
  }
})();
