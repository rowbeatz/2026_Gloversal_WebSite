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
