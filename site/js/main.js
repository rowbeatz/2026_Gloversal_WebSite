/* =============================================================
   Gloversal — main.js
   Navigation, reveal, cursor, theme, i18n bindings
   ============================================================= */
(() => {
  'use strict';

  /* ---------- NAV: scroll state + mobile overlay ---------- */
  const Nav = (() => {
    const nav = document.querySelector('.nav');
    const burger = document.querySelector('.nav__hamburger');
    const overlay = document.querySelector('.nav-overlay');
    if (!nav) return {init(){}};

    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };

    const toggleMenu = (force) => {
      const open = force ?? !burger.classList.contains('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open);
      overlay?.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    return {
      init() {
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        burger?.addEventListener('click', () => toggleMenu());
        overlay?.querySelectorAll('a').forEach(a =>
          a.addEventListener('click', () => toggleMenu(false))
        );
        // Highlight current page
        const path = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav__link,.nav-overlay a').forEach(a => {
          const href = a.getAttribute('href');
          if (href === path || (path === '' && href === 'index.html')) {
            a.classList.add('is-current');
          }
        });
      }
    };
  })();

  /* ---------- REVEAL on scroll ---------- */
  const Reveal = (() => {
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io.unobserve(e.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' })
      : null;

    return {
      init() {
        const els = document.querySelectorAll('.reveal');
        if (!io) { els.forEach(el => el.classList.add('is-visible')); return; }
        els.forEach(el => io.observe(el));
      }
    };
  })();

  /* ---------- CURSOR (desktop only) ---------- */
  const Cursor = (() => {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return { init(){} };
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover) return { init(){} };

    let mx = 0, my = 0, rx = 0, ry = 0;

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };

    return {
      init() {
        window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        document.querySelectorAll('a,button,.btn,.case-card,.insight-card,.service-tile')
          .forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
            el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
          });
        requestAnimationFrame(loop);
      }
    };
  })();

  /* ---------- THEME toggle ---------- */
  const Theme = (() => {
    const KEY = 'glv-theme';
    const apply = t => {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(KEY, t);
    };
    return {
      init() {
        const stored = localStorage.getItem(KEY);
        const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        apply(stored || 'light'); // Light-first per brand spec; respect explicit user choice
        document.querySelectorAll('.theme-toggle').forEach(btn => {
          btn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme') || 'light';
            apply(cur === 'dark' ? 'light' : 'dark');
          });
        });
      }
    };
  })();

  /* ---------- I18N ---------- */
  const I18n = (() => {
    const KEY = 'glv-lang';
    let dict = {};
    let current = 'ja';

    const detect = () => {
      const stored = localStorage.getItem(KEY);
      if (stored) return stored;
      const nav = (navigator.language || 'ja').toLowerCase();
      return nav.startsWith('ja') ? 'ja' : 'en';
    };

    const apply = (lang) => {
      current = lang;
      document.documentElement.setAttribute('lang', lang);
      localStorage.setItem(KEY, lang);
      // text bindings
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = key.split('.').reduce((a, k) => a && a[k], dict[lang]);
        if (val != null) el.innerHTML = val;
      });
      // attribute bindings (e.g. data-i18n-attr="placeholder:form.name")
      document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
          const [attr, key] = pair.split(':');
          if (!attr || !key) return;
          const val = key.split('.').reduce((a, k) => a && a[k], dict[lang]);
          if (val != null) el.setAttribute(attr.trim(), val);
        });
      });
      // Dual-language block visibility.
      // Elements with [data-lang="ja"] or [data-lang="en"] are shown only
      // when the current language matches. Used on long-form legal pages
      // where putting every paragraph in the i18n dictionary is unwieldy.
      document.querySelectorAll('[data-lang]').forEach(el => {
        const want = el.getAttribute('data-lang');
        if (want === 'ja' || want === 'en') el.hidden = (want !== lang);
      });
      // Toggle current indicator
      document.querySelectorAll('.lang-toggle__current').forEach(el => {
        el.textContent = lang.toUpperCase();
      });
      document.querySelectorAll('.lang-toggle__alt').forEach(el => {
        el.textContent = (lang === 'ja' ? 'EN' : 'JA');
      });
    };

    return {
      init(dictionary) {
        dict = dictionary || {};
        current = detect();
        apply(current);
        document.querySelectorAll('.lang-toggle').forEach(btn => {
          btn.addEventListener('click', () => apply(current === 'ja' ? 'en' : 'ja'));
        });
      },
      get current(){ return current; }
    };
  })();

  /* ---------- DECRYPT BANNER (React Bits "Decrypted Text" style) ---------- */
  const DecryptBanner = (() => {
    const ITEMS = [
      'Humanizing Healthcare',
      '技術の進化を、人にやさしい医療の流れへ',
      'Strategy → Execution',
      'Bridging clinical reality and technology',
    ];
    const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?<>/\\=+-';
    const KANA  = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    // Detect CJK / full-width glyphs so we can scramble with an appropriate pool.
    const isJP = c => /[　-〿぀-ゟ゠-ヿ㐀-䶿一-鿿＀-￯]/.test(c);
    const pick = pool => pool.charAt((Math.random() * pool.length) | 0);
    const scrambleChar = c => {
      if (c === ' ' || c === ' ' || c === '　') return c;
      return isJP(c) ? pick(KANA) : pick(LATIN);
    };
    const escapeHTML = s => s.replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));

    const render = (target, chars, revealed, scrambled) => {
      let html = '';
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (ch === ' ' || ch === ' ' || ch === '　') {
          html += ch;
          continue;
        }
        if (revealed[i]) {
          html += '<span class="decrypt-banner__char">' + escapeHTML(ch) + '</span>';
        } else {
          html += '<span class="decrypt-banner__char decrypt-banner__char--scrambled">'
                + escapeHTML(scrambled[i]) + '</span>';
        }
      }
      target.innerHTML = html;
    };

    const cycleOne = (target, text, opts, state) => new Promise(resolve => {
      const chars = Array.from(text);
      const n = chars.length;
      const revealed = new Array(n).fill(false);
      const scrambled = chars.map(scrambleChar);
      render(target, chars, revealed, scrambled);

      const scrambleMs = opts.scrambleMs || 55;
      const perChar = Math.max(32, (opts.revealMs || 1400) / Math.max(1, n));
      let revealIdx = 0;
      const timerIds = new Set();
      const track = id => { timerIds.add(id); return id; };
      const clearAll = () => {
        timerIds.forEach(id => { clearTimeout(id); clearInterval(id); });
        timerIds.clear();
      };

      // In "reduced motion" mode, the scrambled glyphs are chosen once at
      // the start and then left alone — only the reveal progresses. No
      // continuous flicker, but the Decrypted Text aesthetic is preserved.
      if (!opts.staticScramble) {
        const scrambleTimer = setInterval(() => {
          if (!state.running) return;
          for (let i = 0; i < n; i++) {
            if (!revealed[i]) scrambled[i] = scrambleChar(chars[i]);
          }
          render(target, chars, revealed, scrambled);
        }, scrambleMs);
        track(scrambleTimer);
      }

      const revealNext = () => {
        if (!state.running) { track(setTimeout(revealNext, 120)); return; }
        if (revealIdx >= n) {
          for (let i = 0; i < n; i++) revealed[i] = true;
          render(target, chars, revealed, scrambled);
          track(setTimeout(() => { clearAll(); resolve(); }, opts.holdMs || 2200));
          return;
        }
        revealed[revealIdx++] = true;
        render(target, chars, revealed, scrambled);
        track(setTimeout(revealNext, perChar));
      };
      track(setTimeout(revealNext, opts.initialHoldMs || 420));
    });

    const loop = async (target, state) => {
      let i = 0;
      while (state.alive) {
        const text = ITEMS[i % ITEMS.length];
        const n = Array.from(text).length;
        await cycleOne(target, text, {
          initialHoldMs: 420,
          revealMs: Math.min(1500, Math.max(700, n * 55)),
          holdMs: 2200,
          scrambleMs: 55,
        }, state);
        i++;
      }
    };

    return {
      init() {
        const target = document.querySelector('.decrypt-banner__text');
        if (!target) return;

        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const state = { running: !document.hidden, alive: true };
        document.addEventListener('visibilitychange', () => {
          state.running = !document.hidden;
        });

        // Both modes still show the "Decrypted Text" reveal. Reduced-motion
        // users get a single static scramble (no flicker) with a slower
        // reveal cadence — the effect is preserved, the rapid glyph churn
        // is not.
        const gentleLoop = async () => {
          let i = 0;
          while (state.alive) {
            const text = ITEMS[i % ITEMS.length];
            const n = Array.from(text).length;
            await cycleOne(target, text, {
              initialHoldMs: 260,
              revealMs: Math.min(2200, Math.max(900, n * 80)),
              holdMs: 2800,
              staticScramble: true,
            }, state);
            i++;
          }
        };

        if (reduced) {
          gentleLoop();
        } else {
          loop(target, state);
        }
      }
    };
  })();

  /* ---------- EMAIL OBFUSCATION (bot-resistant) ----------
     Markup stores user + domain in data-* attributes, with a
     human-readable "[at]/[dot]" fallback in the text. This module
     rewrites the visible text and href at runtime so the raw address
     never appears in the HTML source that bots crawl. */
  const EmailObfuscator = (() => ({
    init() {
      document.querySelectorAll('a.email-link').forEach(a => {
        const u = a.dataset.user;
        const d = a.dataset.domain;
        if (!u || !d) return;
        const addr = u + '@' + d;
        a.setAttribute('href', 'mailto:' + addr);
        a.setAttribute('rel', 'nofollow');
        const slot = a.querySelector('.email-link__text');
        (slot || a).textContent = addr;
      });
      document.querySelectorAll('span.email-inline').forEach(s => {
        const u = s.dataset.user;
        const d = s.dataset.domain;
        if (!u || !d) return;
        s.textContent = u + '@' + d;
      });
    }
  }))();

  /* ---------- Smooth anchor scrolling ---------- */
  const SmoothAnchors = (() => ({
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
          const id = a.getAttribute('href');
          if (id.length < 2) return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          const offset = document.querySelector('.nav')?.offsetHeight || 0;
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - offset - 16,
            behavior: 'smooth'
          });
        });
      });
    }
  }))();

  /* ---------- Contact form — POST /api/contact ---------- */
  const ContactForm = (() => ({
    init() {
      const form = document.querySelector('.form');
      if (!form) return;
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('.form__submit');
        const lang = document.documentElement.getAttribute('lang') || 'ja';
        btn.disabled = true;
        btn.textContent = lang === 'ja' ? '送信中…' : 'Sending…';
        try {
          const data = Object.fromEntries(new FormData(form).entries());
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();
          if (json.ok) {
            window.Toast?.show(lang === 'ja' ? 'お問い合わせを送信しました。' : 'Message sent successfully.', 'success');
            form.reset();
          } else {
            window.Toast?.show(json.error || (lang === 'ja' ? '送信に失敗しました。' : 'Failed to send.'), 'error');
          }
        } catch {
          window.Toast?.show(lang === 'ja' ? '通信エラーが発生しました。' : 'Network error occurred.', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = lang === 'ja' ? '送信する' : 'Send';
        }
      });
    }
  }))();

  /* ---------- Boot ---------- */
  const boot = () => {
    Nav.init();
    Reveal.init();
    Cursor.init();
    Theme.init();
    DecryptBanner.init();
    EmailObfuscator.init();
    SmoothAnchors.init();
    ContactForm.init();
    if (window.__GLV_I18N__) I18n.init(window.__GLV_I18N__);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
