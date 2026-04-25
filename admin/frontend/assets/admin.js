/* =============================================================
   Gloversal Admin Panel — Shared JS helpers
   ============================================================= */

const API = '';  // same origin

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

/** Show a toast notification */
function showToast(message, type = 'success') {
  // Remove any existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/** Highlight active sidebar link based on current page */
function highlightNav() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.includes(page)) {
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

/** Generate sidebar HTML (reusable across pages) */
function renderSidebar() {
  return `
    <div class="sidebar">
      <div class="sidebar-brand">Gloversal Admin</div>
      <nav class="sidebar-nav">
        <a href="/admin/playground.html">
          <span class="icon">&#9889;</span>
          <span>AI Playground</span>
        </a>
        <a href="/admin/dashboard.html">
          <span class="icon">&#9632;</span>
          <span>Dashboard</span>
        </a>
        <a href="/admin/dashboard.html?view=insights">
          <span class="icon">&#9998;</span>
          <span>Insights</span>
        </a>
        <a href="/admin/dashboard.html?view=speaking">
          <span class="icon">&#9733;</span>
          <span>Activities</span>
        </a>
        <a href="/admin/dashboard.html?view=cases">
          <span class="icon">&#9670;</span>
          <span>Case Studies</span>
        </a>
        <a href="/admin/embeds.html">
          <span class="icon">&#9655;</span>
          <span>Embeds</span>
        </a>
        <a href="/admin/settings.html">
          <span class="icon">&#9881;</span>
          <span>Settings</span>
        </a>
        <a href="/admin/dashboard.html?view=deploy">
          <span class="icon">&#9650;</span>
          <span>Deploy</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <button class="btn btn-sm" onclick="logout()" style="width:100%">Logout</button>
      </div>
    </div>
  `;
}
