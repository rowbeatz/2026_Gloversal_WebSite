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

  /* ---------- MARQUEE duplication (seamless) ---------- */
  const Marquee = (() => ({
    init() {
      document.querySelectorAll('.marquee__track').forEach(track => {
        track.innerHTML += track.innerHTML; // duplicate for loop
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

  /* ---------- Contact form (no-op validation) ---------- */
  const ContactForm = (() => ({
    init() {
      const form = document.querySelector('.form');
      if (!form) return;
      form.addEventListener('submit', e => {
        e.preventDefault();
        const lang = document.documentElement.getAttribute('lang') || 'ja';
        const msg = lang === 'ja'
          ? 'お問い合わせを受け付けました。実運用では送信先と連携します。'
          : 'Your message has been received. Production will wire this to the live endpoint.';
        alert(msg);
      });
    }
  }))();

  /* ---------- Boot ---------- */
  const boot = () => {
    Nav.init();
    Reveal.init();
    Cursor.init();
    Theme.init();
    Marquee.init();
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
