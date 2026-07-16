/* =============================================================
   Gloversal Admin Panel — Shared JS helpers
   ============================================================= */

const API = '';  // same origin

/* ─── Toast container init ─── */
(function initToastContainer() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('.toast-container')) return;
  const c = document.createElement('div');
  c.className = 'toast-container';
  c.setAttribute('role', 'status');
  c.setAttribute('aria-live', 'polite');
  // Defer until body exists
  if (document.body) document.body.appendChild(c);
  else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(c));
})();

function authHeaders() {
  const token = localStorage.getItem('glv_admin_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

function requireAuth() {
  if (!localStorage.getItem('glv_admin_token')) {
    window.location.href = '/admin/login.html';
  }
}

function logout() {
  localStorage.removeItem('glv_admin_token');
  window.location.href = '/admin/login.html';
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  if (res.status === 401) {
    logout();
    return null;
  }
  return res;
}

/** Show a toast notification (NHP-inspired stacked toast container) */
function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  const icons = {
    success: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>',
    error: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>',
    warning: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98L8.257 3.1zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/></svg>',
    info: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>',
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/** Promise-based confirm dialog. Returns true for confirm, false for cancel. */
function showConfirm(title, message, danger = false) {
  return new Promise((resolve) => {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h3>${escapeHtml(title)}</h3></div>
        <div class="modal-body"><p>${escapeHtml(message)}</p></div>
        <div class="modal-footer">
          <button class="btn" id="modal-cancel">キャンセル</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">確認</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    const close = (result) => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };
    overlay.querySelector('#modal-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('#modal-confirm').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', handler); }
    });
    overlay.querySelector('#modal-confirm').focus();
  });
}

/* ─── Universal helpers ─── */
function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text == null ? '' : String(text);
  return d.innerHTML;
}
function formatDate(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit' }); }
  catch { return s; }
}
function formatDateTime(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }); }
  catch { return s; }
}
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes/Math.pow(k,i)).toFixed(1)) + ' ' + sizes[i];
}
function statusBadge(status) {
  const labels = { published:'公開', draft:'下書き', archived:'アーカイブ' };
  return `<span class="badge badge-${status||'draft'}">${labels[status]||status||'下書き'}</span>`;
}
function sectionBadge(section) {
  const colors = { insights:'info', speaking:'success', cases:'warning' };
  return `<span class="badge badge-${colors[section]||'neutral'}">${escapeHtml(sectionLabel(section))}</span>`;
}

/** Highlight active sidebar link based on current page + ?view=. Picks the most specific match. */
function highlightNav() {
  const page = window.location.pathname.split('/').pop() || 'dashboard.html';
  const view = new URLSearchParams(window.location.search).get('view') || '';
  const links = Array.from(document.querySelectorAll('.sidebar-nav a'));
  // First pass: exact match including ?view= query.
  const here = page + (view ? `?view=${view}` : '');
  let exact = links.find(a => {
    const href = a.getAttribute('href') || '';
    return href.endsWith(here);
  });
  if (exact) {
    exact.classList.add('active');
    return;
  }
  // Second pass: same page, but ignore links that pin a specific ?view=.
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    const linkPage = (href.split('?')[0].split('/').pop()) || '';
    const linkView = (href.match(/[?&]view=([^&]+)/) || [])[1] || '';
    if (linkPage === page && !linkView && !view) {
      a.classList.add('active');
    }
  });
}

/** Get URL search params */
function getParams() {
  return new URLSearchParams(window.location.search);
}

/** Format section name for display */
function sectionLabel(section) {
  const labels = {
    insights: 'Insights',
    speaking: 'Activities',
    cases: 'Case Studies'
  };
  return labels[section] || section;
}

/* =============================================================
   PROVIDER_ICONS — inline SVG monogram-style brand icons.
   Used by settings.html and playground.html. Trusted, hardcoded
   markup; safe to inject via innerHTML.
   ============================================================= */
const PROVIDER_ICONS = {
  anthropic: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#D97757" d="M16.84 5.06h-3.05l5.55 13.88h3.05L16.84 5.06zM7.16 5.06L1.61 18.94h3.11l1.13-2.93h5.81l1.13 2.93h3.11L10.34 5.06H7.16zm-.34 8.27l1.93-5.01 1.93 5.01H6.82z"/></svg>`,

  openai: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#10A37F" d="M22.28 9.82a5.96 5.96 0 0 0-.51-4.91A6.04 6.04 0 0 0 15.27 2a6.06 6.06 0 0 0-4.94-2.06A6.05 6.05 0 0 0 5.4 4.5a6.04 6.04 0 0 0-4.04 2.93A6.06 6.06 0 0 0 2.1 14.51a5.96 5.96 0 0 0 .51 4.91 6.04 6.04 0 0 0 6.5 2.91 6.05 6.05 0 0 0 4.93 2.06 6.05 6.05 0 0 0 5.79-4.46 6.04 6.04 0 0 0 4.04-2.93 6.06 6.06 0 0 0-.59-7.18zM13.04 22.4a4.49 4.49 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zM3.4 18.27a4.5 4.5 0 0 1-.54-3.03l.14.08 4.78 2.76a.78.78 0 0 0 .79 0l5.84-3.37v2.33a.07.07 0 0 1-.03.06l-4.83 2.79a4.5 4.5 0 0 1-6.15-1.62zM2.13 8.13a4.49 4.49 0 0 1 2.34-1.97v5.69a.78.78 0 0 0 .39.68l5.81 3.35-2.02 1.17a.07.07 0 0 1-.07 0L3.75 14.27a4.5 4.5 0 0 1-1.62-6.14zm16.59 3.86l-5.84-3.38 2.02-1.17a.07.07 0 0 1 .07 0l4.83 2.79a4.5 4.5 0 0 1-.68 8.11v-5.69a.79.79 0 0 0-.4-.68zm2.01-3.03l-.14-.08-4.78-2.77a.78.78 0 0 0-.79 0L9.18 9.48V7.15a.07.07 0 0 1 .03-.06l4.83-2.78a4.5 4.5 0 0 1 6.69 4.66zM8.08 13.13l-2.02-1.17a.07.07 0 0 1-.04-.06V6.32a4.5 4.5 0 0 1 7.38-3.46l-.14.08L8.48 5.7a.78.78 0 0 0-.39.68zm1.1-2.36l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z"/></svg>`,

  google: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#4285F4" d="M12 2L2 12l10 10 10-10L12 2zm0 4.5L17.5 12 12 17.5 6.5 12 12 6.5z"/><circle fill="#EA4335" cx="12" cy="12" r="2.5"/></svg>`,

  mistral: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect fill="#FF7000" x="2" y="3" width="4" height="4"/><rect fill="#FF7000" x="2" y="10" width="4" height="4"/><rect fill="#FF7000" x="2" y="17" width="4" height="4"/><rect fill="#F5A623" x="9" y="3" width="4" height="4"/><rect fill="#F5A623" x="9" y="17" width="4" height="4"/><rect fill="#F8E71C" x="16" y="3" width="6" height="4"/><rect fill="#F8E71C" x="9" y="10" width="13" height="4"/><rect fill="#F8E71C" x="16" y="17" width="6" height="4"/></svg>`,

  groq: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#F55036" d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>`,

  together: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle fill="#0F6FFF" cx="8" cy="12" r="5"/><circle fill="#0F6FFF" fill-opacity="0.6" cx="16" cy="12" r="5"/></svg>`,

  perplexity: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#20808D" d="M3 3h18v18H3V3zm2 2v14h6v-7h2v7h6V5h-6v6h-2V5H5z"/></svg>`,

  cohere: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle fill="#39594D" cx="6" cy="12" r="3"/><circle fill="#39594D" fill-opacity="0.7" cx="13" cy="12" r="3"/><circle fill="#39594D" fill-opacity="0.4" cx="20" cy="12" r="3"/></svg>`,

  deepseek: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#4D6BFE" d="M19.5 6c-1.4-.5-2.6.7-3.4 1.7-1.5-.9-3.1-1.4-4.6-1.4-2.7 0-5 1.3-6.5 3.4-1 1.4-1.5 3-1.5 4.7 0 4.1 3.3 7.4 7.4 7.4 2.4 0 4.5-1.1 5.9-2.9.5.4 1.1.6 1.7.6 1.5 0 2.7-1.2 2.7-2.7 0-.5-.1-.9-.3-1.3.4-.5.6-1.1.6-1.7 0-1.5-1.2-2.7-2.7-2.7-.2 0-.4 0-.6.1.7-1.6.9-3.4.3-5.2zM10.9 16.5c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z"/></svg>`,

  ollama: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M12 2C8 2 6 5 6 8v3c-1.5.5-2.5 2-2.5 3.5 0 1 .4 1.9 1 2.5v2C4.5 20 5.5 21 7 21h2v-3h6v3h2c1.5 0 2.5-1 2.5-2v-2c.6-.6 1-1.5 1-2.5 0-1.5-1-3-2.5-3.5V8c0-3-2-6-6-6zm-2 6.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5S8.5 10.8 8.5 10s.7-1.5 1.5-1.5zm4 0c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5.7-1.5 1.5-1.5z"/></svg>`,

  lmstudio: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect fill="#7C3AED" x="2" y="4" width="20" height="14" rx="2"/><path fill="#fff" d="M6 8h2v6H6V8zm3 0h2l1 3 1-3h2v6h-1.5v-3.5L13 13h-1l-1-2.5V14H9.5V8z"/></svg>`,

  custom: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#8B949E" d="M19.4 13c.04-.33.06-.66.06-1s-.02-.67-.06-1l2.11-1.65a.5.5 0 00.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1a7.4 7.4 0 00-1.73-1l-.38-2.65A.5.5 0 0014 2h-4a.5.5 0 00-.5.42l-.38 2.65a7.4 7.4 0 00-1.73 1l-2.49-1a.5.5 0 00-.61.22l-2 3.46a.5.5 0 00.12.64L4.52 11c-.04.33-.06.66-.06 1s.02.67.06 1l-2.11 1.65a.5.5 0 00-.12.64l2 3.46a.5.5 0 00.61.22l2.49-1a7.4 7.4 0 001.73 1l.38 2.65A.5.5 0 0010 22h4a.5.5 0 00.5-.42l.38-2.65a7.4 7.4 0 001.73-1l2.49 1a.5.5 0 00.61-.22l2-3.46a.5.5 0 00-.12-.64L19.4 13zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg>`,
};

/** Generate sidebar HTML (reusable across pages, NHP-inspired with SVG icons + brand mark + user block) */
function renderSidebar() {
  const navItems = [
    { href: '/admin/playground.html',     label: 'AI Playground', icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/></svg>' },
    { href: '/admin/dashboard.html',      label: 'Dashboard',     icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>' },
    { href: '/admin/dashboard.html?view=insights', label: 'Insights', icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"/></svg>' },
    { href: '/admin/dashboard.html?view=speaking', label: 'Activities', icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>' },
    { href: '/admin/dashboard.html?view=cases', label: 'Case Studies', icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5z"/></svg>' },
    { href: '/admin/embeds.html',         label: 'Embeds',        icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/></svg>' },
    { href: '/admin/settings.html',       label: 'Settings',      icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/></svg>' },
    { href: '/admin/dashboard.html?view=deploy', label: 'Deploy', icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"/></svg>' },
  ];
  const navHtml = navItems.map(item => `
    <a href="${item.href}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>`).join('');
  return `
    <aside class="sidebar" role="navigation" aria-label="管理メニュー">
      <div class="sidebar-brand">
        <div class="sidebar-brand-mark">G</div>
        <div class="sidebar-brand-text">
          <span class="sidebar-brand-name">Gloversal Admin</span>
          <span class="sidebar-brand-sub">Content + AI</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${navHtml}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar" id="sidebar-avatar">U</div>
          <div class="sidebar-user-meta">
            <span class="sidebar-user-name" id="sidebar-username">Loading…</span>
            <span class="sidebar-user-role">Admin</span>
          </div>
        </div>
        <button class="btn btn-sm" onclick="logout()" style="width:100%">Logout</button>
      </div>
    </aside>
  `;
}

/** Inject sidebar, highlight active nav, populate user info. Bearer-token-aware. */
async function initPage(activePage) {
  const app = document.getElementById('app');
  if (app && !document.querySelector('.sidebar')) {
    app.insertAdjacentHTML('afterbegin', renderSidebar());
  }
  highlightNav();
  // Decode JWT 'sub' (no signature check; UI display only)
  const token = localStorage.getItem('glv_admin_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      const username = payload.sub || 'Admin';
      const av = document.getElementById('sidebar-avatar');
      const nm = document.getElementById('sidebar-username');
      if (av) av.textContent = username.charAt(0).toUpperCase();
      if (nm) nm.textContent = username;
    } catch (e) { /* ignore — show defaults */ }
  }
}
