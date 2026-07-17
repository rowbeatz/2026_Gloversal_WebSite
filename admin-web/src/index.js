/* =============================================================
   Gloversal Admin — Cloudflare Worker backend
   -------------------------------------------------------------
   Web port of the local FastAPI admin (admin/backend/*). Same API
   surface, so the admin frontend runs unchanged. Differences:

   - Content lives in GitHub (site/js/content-data.js on GH_REPO),
     edited via the GitHub Contents API. Every save is a commit;
     Cloudflare Pages redeploys the site automatically.
   - "Build & Deploy" triggers the admin-build-deploy.yml GitHub
     Actions workflow, which runs the same Python build chain as
     the local admin and pushes the regenerated site.
   - Settings (AI provider keys) persist in Workers KV.
   - Media uploads are committed to site/assets/images/uploads/.
   ============================================================= */

import { Hono } from 'hono';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const VALID_SECTIONS = new Set(['insights', 'speaking', 'cases']);
const CONTENT_PATH = 'site/js/content-data.js';
const UPLOAD_DIR = 'site/assets/images/uploads';
const ALLOWED_EXTENSIONS = new Set([
  // .svg deliberately excluded: SVGs served from the public origin can carry
  // inline script (stored XSS). Use PNG/WebP for raster art.
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp4', '.webm', '.mov',
]);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);
// GitHub Contents API practical limit; large video should go via
// YouTube or a local git commit instead.
const MAX_UPLOAD_MB = 20;
const TOKEN_EXPIRE_HOURS = 24;

const te = new TextEncoder();
const td = new TextDecoder();

/* ───────────────────────── base64 helpers ───────────────────────── */

function bytesToBase64(bytes) {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function base64ToBytes(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const b64url = (bytes) =>
  bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64urlJson = (obj) => b64url(te.encode(JSON.stringify(obj)));

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return base64ToBytes(s);
}

/* ───────────────────────── JWT (HS256) ───────────────────────── */

async function hmacKey(secret, usages = ['sign', 'verify']) {
  return crypto.subtle.importKey(
    'raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages,
  );
}

async function signToken(username, secret, hours = TOKEN_EXPIRE_HOURS) {
  const header = b64urlJson({ alg: 'HS256', typ: 'JWT' });
  const exp = Math.floor(Date.now() / 1000) + hours * 3600;
  const payload = b64urlJson({ sub: username, exp });
  const data = `${header}.${payload}`;
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, te.encode(data)));
  return `${data}.${b64url(sig)}`;
}

async function verifyToken(token, secret) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const data = `${parts[0]}.${parts[1]}`;
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(parts[2]), te.encode(data));
    if (!ok) return null;
    const payload = JSON.parse(td.decode(b64urlDecode(parts[1])));
    if (!payload.sub) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/** Constant-time-ish string comparison: compare HMAC digests. */
async function safeEqual(a, b, secret) {
  const key = await hmacKey(secret, ['sign']);
  const da = new Uint8Array(await crypto.subtle.sign('HMAC', key, te.encode(`v:${a}`)));
  const db = new Uint8Array(await crypto.subtle.sign('HMAC', key, te.encode(`v:${b}`)));
  let diff = 0;
  for (let i = 0; i < da.length; i++) diff |= da[i] ^ db[i];
  return diff === 0;
}

/* ───────────────────────── GitHub API client ───────────────────────── */

async function ghFetch(env, path, init = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${env.GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gloversal-admin-worker',
      ...(init.headers || {}),
    },
  });
}

async function ghGetFile(env, path) {
  const r = await ghFetch(
    env,
    `/repos/${env.GH_REPO}/contents/${path}?ref=${env.GH_BRANCH}`,
  );
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub read failed (${r.status}): ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return { text: td.decode(base64ToBytes(j.content || '')), sha: j.sha };
}

async function ghPutFile(env, path, bytes, message, sha = undefined) {
  const body = {
    message,
    content: bytesToBase64(bytes),
    branch: env.GH_BRANCH,
  };
  if (sha) body.sha = sha;
  const r = await ghFetch(env, `/repos/${env.GH_REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const detail = (await r.text()).slice(0, 300);
    const err = new Error(`GitHub write failed (${r.status}): ${detail}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

/* ───────────────────────── content store ───────────────────────── */

function parseContentJs(text) {
  const anchor = text.indexOf('__GLV_CONTENT__');
  const start = text.indexOf('{', anchor);
  const end = text.lastIndexOf('}');
  if (anchor === -1 || start === -1 || end <= start) {
    throw new Error('content-data.js: could not locate __GLV_CONTENT__ object');
  }
  return JSON.parse(text.slice(start, end + 1));
}

function serializeContentJs(data) {
  const j = JSON.stringify(data, null, 2);
  return `/* =============================================================
   Gloversal — content-data.js  [managed by admin panel]
   ============================================================= */
window.__GLV_CONTENT__ = ${j};
`;
}

async function readContent(env) {
  const f = await ghGetFile(env, CONTENT_PATH);
  if (!f) throw new Error(`${CONTENT_PATH} not found in ${env.GH_REPO}@${env.GH_BRANCH}`);
  return { data: parseContentJs(f.text), sha: f.sha };
}

class ApiError extends Error {
  constructor(status, detail) {
    super(detail);
    this.apiStatus = status;
    this.detail = detail;
  }
}

/**
 * Read-modify-write with one retry on sha conflict.
 * `mutator(data)` mutates and returns the response payload.
 */
async function mutateContent(env, mutator, message) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, sha } = await readContent(env);
    const result = mutator(data);
    const bytes = te.encode(serializeContentJs(data));
    try {
      await ghPutFile(env, CONTENT_PATH, bytes, message, sha);
      return result;
    } catch (e) {
      lastErr = e;
      if (e.status === 409 || e.status === 422) continue; // stale sha — re-read and retry
      throw e;
    }
  }
  throw lastErr;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ───────────────────────── media helpers ───────────────────────── */

const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/;
const VIMEO_RES = [
  /vimeo\.com\/(?:video\/|channels\/[^/]+\/)?(\d+)/,
  /player\.vimeo\.com\/video\/(\d+)/,
];

function detectMediaType(url) {
  if (!url) return { type: 'image', id: '', src: '', poster: '', alt: '', title: '' };
  const ym = url.match(YOUTUBE_RE);
  if (ym) {
    return {
      type: 'youtube', id: ym[1], src: '',
      poster: `https://i.ytimg.com/vi/${ym[1]}/maxresdefault.jpg`,
      alt: '', title: '',
    };
  }
  for (const re of VIMEO_RES) {
    const vm = url.match(re);
    if (vm) return { type: 'vimeo', id: vm[1], src: '', poster: '', alt: '', title: '' };
  }
  const lower = url.toLowerCase();
  if (['.mp4', '.webm', '.mov'].some((e) => lower.endsWith(e))) {
    return { type: 'video', id: '', src: url, poster: '', alt: '', title: '' };
  }
  return { type: 'image', id: '', src: url, poster: '', alt: '', title: '' };
}

/* ───────────────────────── settings (KV) ───────────────────────── */

const DEFAULT_SETTINGS = {
  providers: {
    anthropic:  { api_key: '', enabled: false },
    openai:     { api_key: '', enabled: false },
    google:     { api_key: '', enabled: false },
    mistral:    { api_key: '', enabled: false },
    groq:       { api_key: '', enabled: false },
    together:   { api_key: '', enabled: false },
    perplexity: { api_key: '', enabled: false },
    cohere:     { api_key: '', enabled: false },
    deepseek:   { api_key: '', enabled: false },
    // Local runtimes are unreachable from a cloud Worker unless the
    // user points base_url at a public tunnel — kept for parity.
    ollama:     { base_url: '', enabled: false },
    lmstudio:   { base_url: '', enabled: false },
    custom:     { api_key: '', base_url: '', model_ids: '', enabled: false },
  },
  default_provider: 'anthropic',
  default_model: 'claude-sonnet-4-6',
};

async function loadSettings(env) {
  let data = null;
  try {
    data = await env.SETTINGS.get('settings', 'json');
  } catch { /* corrupt — fall through */ }
  if (!data || typeof data !== 'object') data = {};
  const providers = (data.providers = data.providers || {});
  for (const [pid, cfg] of Object.entries(DEFAULT_SETTINGS.providers)) {
    if (!providers[pid]) providers[pid] = { ...cfg };
    else for (const [k, v] of Object.entries(cfg)) {
      if (!(k in providers[pid])) providers[pid][k] = v;
    }
  }
  if (!data.default_provider) data.default_provider = DEFAULT_SETTINGS.default_provider;
  if (data.default_model === undefined) data.default_model = DEFAULT_SETTINGS.default_model;
  return data;
}

async function saveSettings(env, data) {
  await env.SETTINGS.put('settings', JSON.stringify(data));
}

/* ───────────────────────── AI providers ───────────────────────── */

const PROVIDER_MODELS = {
  anthropic: [
    { id: 'claude-opus-4-7',   label: 'Claude Opus 4.7' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5' },
  ],
  openai: [
    { id: 'gpt-4o',      label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini (低コスト)' },
    { id: 'o1-preview',  label: 'o1-preview (推論特化)' },
    { id: 'o1-mini',     label: 'o1-mini' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  google: [
    { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro',       label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash',     label: 'Gemini 1.5 Flash (高速)' },
  ],
  mistral: [
    { id: 'mistral-large-latest',  label: 'Mistral Large' },
    { id: 'mistral-medium-latest', label: 'Mistral Medium' },
    { id: 'open-mistral-nemo',     label: 'Mistral Nemo (軽量)' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (超高速)' },
    { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B Instant' },
    { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it',            label: 'Gemma2 9B' },
  ],
  together: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Turbo' },
    { id: 'deepseek-ai/DeepSeek-V3',                 label: 'DeepSeek V3' },
    { id: 'Qwen/QwQ-32B-Preview',                    label: 'QwQ 32B' },
  ],
  perplexity: [
    { id: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro' },
    { id: 'sonar-reasoning',     label: 'Sonar Reasoning' },
    { id: 'sonar-pro',           label: 'Sonar Pro' },
    { id: 'sonar',               label: 'Sonar' },
  ],
  cohere: [
    { id: 'command-r-plus', label: 'Command R+' },
    { id: 'command-r',      label: 'Command R' },
  ],
  deepseek: [
    { id: 'deepseek-chat',     label: 'DeepSeek V3' },
    { id: 'deepseek-reasoner', label: 'DeepSeek R1 (推論特化)' },
  ],
  ollama:   [],
  lmstudio: [],
  custom:   [],
};

const OPENAI_COMPAT_BASES = {
  openai:     'https://api.openai.com/v1',
  mistral:    'https://api.mistral.ai/v1',
  groq:       'https://api.groq.com/openai/v1',
  together:   'https://api.together.xyz/v1',
  perplexity: 'https://api.perplexity.ai',
  deepseek:   'https://api.deepseek.com/v1',
  lmstudio:   '',
  custom:     '',
};

const JSON_MODE_PROVIDERS = new Set(['openai', 'groq', 'together', 'deepseek', 'mistral']);

function knownProviders() {
  return [
    'anthropic', 'openai', 'google', 'mistral', 'groq', 'together',
    'perplexity', 'cohere', 'deepseek', 'ollama', 'lmstudio', 'custom',
  ];
}

function scoreModel(providerId, modelId) {
  if (!modelId) return 0;
  const m = modelId.toLowerCase();
  let score = 50;

  if (['deprecated', 'legacy', '0301', '0613', '0314', '1106', 'vision-preview', 'instruct-0914']
    .some((x) => m.includes(x))) score -= 30;

  if (['embed', 'embedding', 'tts', 'whisper', 'audio', 'voice', 'speech',
    'dall-e', 'stable-diffusion', 'imagen', 'image-generation',
    'flash-image', 'flash-image-preview', 'veo', 'lyria',
    'guard', 'moderation', 'safety', 'rerank', 'live-']
    .some((x) => m.includes(x))) return 0;

  if (providerId === 'anthropic') {
    if (m.includes('opus-4')) score = 100;
    else if (m.includes('sonnet-4')) score = 90;
    else if (m.includes('haiku-4')) score = 80;
    else if (m.includes('opus-3')) score = 70;
    else if (m.includes('sonnet-3.5') || m.includes('sonnet-3-5')) score = 65;
    else if (m.includes('haiku-3.5') || m.includes('haiku-3-5')) score = 60;
    else if (m.includes('opus')) score = 55;
    else if (m.includes('sonnet')) score = 50;
    else if (m.includes('haiku')) score = 45;
  } else if (providerId === 'openai') {
    if (m.startsWith('gpt-5')) score = 100;
    else if (m.startsWith('o3') || m.startsWith('o4')) score = 95;
    else if (m.includes('gpt-4.5') || m.includes('gpt-4-5')) score = 92;
    else if (m.startsWith('o1') && !m.includes('mini')) score = 88;
    else if (m.includes('gpt-4o') && !m.includes('mini')) score = 85;
    else if (m.includes('o3-mini') || m.includes('o4-mini')) score = 80;
    else if (m.includes('o1-mini')) score = 75;
    else if (m.includes('gpt-4o-mini')) score = 70;
    else if (m.includes('gpt-4-turbo')) score = 65;
    else if (m.includes('gpt-4')) score = 55;
    else if (m.includes('gpt-3.5')) score = 30;
  } else if (providerId === 'google') {
    if (m.includes('flash-lite') || m.includes('flash-8b')) score = 50;
    else if (m.includes('2.5') && m.includes('flash')) score = 100;
    else if (m.includes('2.0') && m.includes('flash')) score = 92;
    else if (m.includes('1.5') && m.includes('flash')) score = 80;
    else if (m.includes('2.5') && m.includes('pro')) score = 75;
    else if (m.includes('2.0') && m.includes('pro')) score = 70;
    else if (m.includes('1.5') && m.includes('pro')) score = 65;
  } else if (providerId === 'mistral') {
    if (m.includes('large')) score = 90;
    else if (m.includes('medium')) score = 75;
    else if (m.includes('small')) score = 60;
    else if (m.includes('nemo')) score = 55;
    else if (m.includes('ministral')) score = 50;
  } else if (providerId === 'groq') {
    if (m.includes('llama-3.3-70b') || m.includes('llama-3.1-70b') || m.includes('llama-4')) score = 90;
    else if (m.includes('llama-3.3') || m.includes('llama-3.1')) score = 80;
    else if (m.includes('deepseek')) score = 85;
    else if (m.includes('qwen')) score = 78;
    else if (m.includes('mixtral')) score = 75;
    else if (m.includes('8b') || m.includes('7b')) score = 50;
  } else if (providerId === 'deepseek') {
    if (m.includes('reasoner') || m.includes('r1')) score = 95;
    else if (m.includes('chat') || m.includes('v3')) score = 85;
  } else if (providerId === 'cohere') {
    if (m.includes('command-r-plus')) score = 90;
    else if (m.includes('command-r')) score = 75;
    else if (m.includes('command-light')) score = 50;
  } else if (providerId === 'perplexity') {
    if (m.includes('reasoning-pro')) score = 95;
    else if (m.includes('reasoning')) score = 88;
    else if (m.includes('sonar-pro')) score = 85;
    else if (m.includes('sonar')) score = 75;
  } else if (providerId === 'together') {
    if (m.includes('405b') || m.includes('405')) score = 95;
    else if (m.includes('llama-3.3-70b') || m.includes('llama-4')) score = 90;
    else if (m.includes('deepseek-v3') || m.includes('deepseek-r1')) score = 88;
    else if (m.includes('qwen') && m.includes('72b')) score = 85;
    else if (m.includes('70b')) score = 80;
  } else if (providerId === 'ollama' || providerId === 'lmstudio') {
    if (m.includes('70b') || m.includes('72b')) score = 85;
    else if (m.includes('32b') || m.includes('34b')) score = 75;
    else if (m.includes('13b') || m.includes('14b')) score = 65;
    else if (m.includes('7b') || m.includes('8b')) score = 55;
    else if (m.includes('3b') || m.includes('1b')) score = 35;
  }

  return Math.max(0, Math.min(100, score));
}

function bestModel(providerId, models) {
  if (!models || !models.length) return '';
  const id = (m) => (typeof m === 'object' ? m.id : m);
  const sorted = [...models].sort(
    (a, b) => scoreModel(providerId, id(b)) - scoreModel(providerId, id(a)),
  );
  return id(sorted[0]);
}

function providerConfig(settings, pid) {
  return (settings.providers || {})[pid] || {};
}

async function postJson(pid, url, payload, headers, timeoutMs = 90000) {
  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      // Don't follow redirects — an attacker-controlled base_url could 3xx to
      // another host and Workers would replay the Authorization header there.
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    throw new Error(`${pid}: ${e.name || 'FetchError'}: ${e.message}`);
  }
  if (!r.ok) {
    const body = (await r.text().catch(() => '')).slice(0, 500);
    const err = new Error(`${pid}: HTTP ${r.status} — ${body}`);
    err.httpStatus = r.status;
    throw err;
  }
  return r.json();
}

async function providerGenerate(env, pid, system, user, model) {
  const settings = await loadSettings(env);
  const cfg = providerConfig(settings, pid);

  if (pid === 'anthropic') {
    const key = (cfg.api_key || '').trim();
    if (!key) throw new Error('anthropic: API key is not configured');
    const data = await postJson('anthropic', 'https://api.anthropic.com/v1/messages', {
      model, max_tokens: 4096, system,
      messages: [{ role: 'user', content: user }],
    }, { 'x-api-key': key, 'anthropic-version': '2023-06-01' });
    const text = data?.content?.[0]?.text;
    if (typeof text !== 'string') throw new Error('anthropic: unexpected response shape');
    return text;
  }

  if (pid === 'google') {
    const key = (cfg.api_key || '').trim();
    if (!key) throw new Error('google: API key is not configured');
    const data = await postJson('google',
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096 },
      }, {});
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) throw new Error('google: unexpected response shape');
    return parts.map((p) => p.text || '').join('');
  }

  if (pid === 'cohere') {
    const key = (cfg.api_key || '').trim();
    if (!key) throw new Error('cohere: API key is not configured');
    const data = await postJson('cohere', 'https://api.cohere.com/v2/chat', {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }, { Authorization: `Bearer ${key}` });
    const text = data?.message?.content?.[0]?.text;
    if (typeof text !== 'string') throw new Error('cohere: unexpected response shape');
    return text;
  }

  if (pid === 'ollama') {
    const base = (cfg.base_url || '').replace(/\/+$/, '');
    if (!base) throw new Error('ollama: base URL is not configured (local runtimes need a public tunnel from the web admin)');
    const data = await postJson('ollama', `${base}/api/chat`, {
      model, stream: false, format: 'json',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }, {}, 180000);
    const text = data?.message?.content;
    if (typeof text !== 'string') throw new Error('ollama: unexpected response shape');
    return text;
  }

  // OpenAI-compatible family
  if (pid in OPENAI_COMPAT_BASES) {
    const key = (cfg.api_key || '').trim();
    const base = ((cfg.base_url || '') || OPENAI_COMPAT_BASES[pid] || '').replace(/\/+$/, '');
    if (!base) throw new Error(`${pid}: base URL is not configured`);
    const headers = {};
    if (key) headers.Authorization = `Bearer ${key}`;
    const payload = {
      model, max_tokens: 4096,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    };
    if (JSON_MODE_PROVIDERS.has(pid)) payload.response_format = { type: 'json_object' };
    let data;
    try {
      data = await postJson(pid, `${base}/chat/completions`, payload, headers);
    } catch (e) {
      if (payload.response_format && e.httpStatus === 400) {
        delete payload.response_format;
        data = await postJson(pid, `${base}/chat/completions`, payload, headers);
      } else throw e;
    }
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') throw new Error(`${pid}: unexpected response shape`);
    return text;
  }

  throw new Error(`Unknown provider: ${pid}`);
}

async function listModelsLive(env, pid) {
  const settings = await loadSettings(env);
  const cfg = providerConfig(settings, pid);
  const getJson = async (url, headers = {}) => {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'gloversal-admin-worker', ...headers },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    return r.json();
  };

  try {
    if (pid === 'anthropic') {
      const key = (cfg.api_key || '').trim();
      if (!key) return [];
      const j = await getJson('https://api.anthropic.com/v1/models', {
        'x-api-key': key, 'anthropic-version': '2023-06-01',
      });
      if (!j) return [];
      return (j.data || [])
        .map((m) => ({ id: m.id || '', label: m.display_name || m.id, score: scoreModel(pid, m.id || '') }))
        .filter((m) => m.id && m.score > 0);
    }

    if (pid === 'google') {
      const key = (cfg.api_key || '').trim();
      if (!key) return [];
      const j = await getJson(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (!j) return [];
      const out = [];
      for (const m of j.models || []) {
        const name = (m.name || '').replace('models/', '');
        if (!name) continue;
        if (!(m.supportedGenerationMethods || []).includes('generateContent')) continue;
        if (['embed', 'aqa', 'vision-latest'].some((x) => name.includes(x))) continue;
        const s = scoreModel('google', name);
        if (s > 0) out.push({ id: name, label: m.displayName || name, score: s });
      }
      return out;
    }

    if (pid === 'cohere') {
      const key = (cfg.api_key || '').trim();
      if (!key) return [];
      const j = await getJson('https://api.cohere.com/v1/models?endpoint=chat&page_size=100', {
        Authorization: `Bearer ${key}`,
      });
      if (!j) return [];
      const out = [];
      for (const m of j.models || []) {
        const name = m.name || '';
        if (!name) continue;
        const endpoints = m.endpoints || [];
        if (endpoints.length && !endpoints.includes('chat')) continue;
        const s = scoreModel('cohere', name);
        if (s > 0) out.push({ id: name, label: name, score: s });
      }
      return out;
    }

    if (pid === 'ollama') {
      const base = (cfg.base_url || '').replace(/\/+$/, '');
      if (!base) return [];
      const j = await getJson(`${base}/api/tags`);
      if (!j) return [];
      return (j.models || [])
        .filter((m) => m.name)
        .map((m) => ({ id: m.name, label: m.name, score: scoreModel('ollama', m.name) }));
    }

    if (pid === 'perplexity') return []; // no /models endpoint

    if (pid === 'custom') {
      const ids = (cfg.model_ids || '').trim();
      if (!ids) return [];
      return ids.split(',').map((s) => s.trim()).filter(Boolean)
        .map((id) => ({ id, label: id, score: 50 }));
    }

    if (pid in OPENAI_COMPAT_BASES) {
      const key = (cfg.api_key || '').trim();
      const base = ((cfg.base_url || '') || OPENAI_COMPAT_BASES[pid] || '').replace(/\/+$/, '');
      if (!base) return [];
      if (pid !== 'lmstudio' && !key) return [];
      const headers = key ? { Authorization: `Bearer ${key}` } : {};
      const j = await getJson(`${base}/models`, headers);
      if (!j) return [];
      const items = j.data || j.models || [];
      const out = [];
      for (const m of items) {
        const mid = typeof m === 'object' ? m.id : String(m);
        if (!mid) continue;
        const s = scoreModel(pid, mid);
        if (s <= 0) continue;
        const label = typeof m === 'object' ? (m.display_name || m.name || mid) : mid;
        out.push({ id: mid, label, score: s });
      }
      return out;
    }
  } catch {
    return [];
  }
  return [];
}

async function getAvailableModels(env, pid) {
  const live = await listModelsLive(env, pid);
  if (live.length) return live.sort((a, b) => (b.score || 0) - (a.score || 0));
  const catalog = PROVIDER_MODELS[pid] || [];
  return catalog
    .map((m) => ({ id: m.id, label: m.label || m.id, score: scoreModel(pid, m.id) }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

/* ───────────────────────── AI playground ───────────────────────── */

const SYSTEM_PROMPT = `You are an expert content strategist for Gloversal, Inc. — a healthcare strategy consulting firm based in Tokyo, Japan, with US and European reach. Gloversal bridges medical AI, healthtech, and hospital business development.

Your task: transform rough input (notes, transcripts, ideas, any language) into structured, publication-ready content.

Content quality principles to apply (Princeton GEO methods):
1. Include specific statistics and data points (+29% AEO lift)
2. Include expert-level analysis or quotable insights (+41% AI citation lift)
3. Reference or imply credible industry sources (+28% AI citation lift)
4. Structure with clear H2/H3 sections for scannability
5. Use concrete examples from Japan healthcare market context
6. Body: 400-600 words in each language

Output ONLY valid JSON, no markdown fences. Schema:
{
  "suggested_section": "insights|speaking|cases",
  "reasoning": "one sentence why this section",
  "slug": "kebab-case-max-5-words",
  "tag": "Short Tag (2-3 words)",
  "date": "YYYY-MM",
  "dateLabel": {"ja": "YYYY年M月", "en": "Month YYYY"},
  "title": {"ja": "日本語タイトル", "en": "English Title"},
  "excerpt": {"ja": "日本語要約2文", "en": "English excerpt 2 sentences"},
  "body": {"ja": "<h2>...</h2><p>...</p>", "en": "<h2>...</h2><p>...</p>"},
  "seo_keywords": ["kw1", "kw2", "kw3"],
  "seo_description": "155-char meta description in English",
  "share_text": "SNS share copy in English (under 280 chars)",
  "sources": []
}`;

function stripFences(text) {
  let cleaned = String(text || '').trim();
  if (cleaned.startsWith('```')) {
    const firstNl = cleaned.indexOf('\n');
    if (firstNl !== -1) cleaned = cleaned.slice(firstNl + 1);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();
  }
  return cleaned;
}

function extractJsonObject(text) {
  if (!text) return text;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

async function generateContent(env, userInput, sectionHint, providerId, modelId) {
  const s = await loadSettings(env);
  const pid = (providerId || s.default_provider || 'anthropic').trim();
  let mid = (modelId || s.default_model || '').trim();
  if (!mid) {
    const models = await getAvailableModels(env, pid);
    mid = bestModel(pid, models);
  }
  if (!mid) throw new ApiError(400, `No model selected for provider '${pid}'`);

  const hint = sectionHint ? `\n\nSection hint from user: ${sectionHint}` : '';
  const userMessage = `Transform this into Gloversal content:${hint}\n\n---\n${userInput}\n---`;
  const raw = await providerGenerate(env, pid, SYSTEM_PROMPT, userMessage, mid);
  const cleaned = stripFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(extractJsonObject(cleaned));
    } catch (e) {
      const preview = cleaned.slice(0, 300).replace(/\n/g, ' ');
      throw new Error(`${pid}: model did not return valid JSON. Preview: ${JSON.stringify(preview)} (${e.message})`);
    }
  }
}

/* ─── oEmbed SNS import ─── */

const OEMBED_ENDPOINTS = {
  'youtube.com':   (u) => `https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json`,
  'youtu.be':      (u) => `https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json`,
  'twitter.com':   (u) => `https://publish.twitter.com/oembed?url=${encodeURIComponent(u)}`,
  'x.com':         (u) => `https://publish.twitter.com/oembed?url=${encodeURIComponent(u)}`,
  'instagram.com': (u) => `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(u)}`,
  'bsky.app':      (u) => `https://embed.bsky.app/oembed?url=${encodeURIComponent(u)}`,
  'linkedin.com':  null,
  'threads.net':   null,
  'substack.com':  null,
  'note.com':      null,
};

function escapeHtmlAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildManualEmbed(rawUrl, platform) {
  // The URL is embedded into iframe/blockquote markup that the admin — and
  // ultimately the public site — renders as HTML. Escape it so a crafted
  // import URL can't break out into active markup.
  const url = escapeHtmlAttr(rawUrl);
  if (platform === 'linkedin') {
    return `<iframe src="https://www.linkedin.com/embed/feed/update/${url.split('/').pop()}" height="399" width="504" frameborder="0" allowfullscreen></iframe>`;
  }
  if (platform === 'substack') {
    const embedUrl = url.includes('/p/') ? url.replace('/p/', '/p/embed/') : url;
    return `<iframe src="${embedUrl}" width="100%" height="320" style="border:none;background:white;" frameborder="0"></iframe>`;
  }
  if (platform === 'note') {
    return `<iframe class="note-embed" src="${url}/embed" style="border:0;display:block;max-width:99%;width:494px;height:400px;margin:10px auto;" loading="lazy" frameborder="0" scrolling="no"></iframe><script async src="https://note.com/scripts/embed.js" charset="utf-8"></script>`;
  }
  if (platform === 'threads') {
    return `<blockquote class="text-post-media" data-text-post-permalink="${url}" data-text-post-version="0" id="ig-tp-embed"><a href="${url}">View on Threads</a></blockquote><script async src="https://www.threads.net/embed/postEmbed.js"></script>`;
  }
  return `<iframe src="${url}" width="100%" height="400" frameborder="0"></iframe>`;
}

async function importUrl(url) {
  const lower = url.toLowerCase();
  const result = { embed: '', thumbnail: '', title: '', platform: 'unknown', url };
  for (const [domain, endpointFn] of Object.entries(OEMBED_ENDPOINTS)) {
    if (!lower.includes(domain)) continue;
    result.platform = domain.split('.')[0];
    if (endpointFn) {
      try {
        const r = await fetch(endpointFn(url), {
          headers: { 'User-Agent': 'Gloversal/1.0' },
          signal: AbortSignal.timeout(15000),
        });
        if (r.ok) {
          const data = await r.json();
          result.embed = data.html || '';
          result.thumbnail = data.thumbnail_url || '';
          result.title = data.title || '';
        }
      } catch { /* fall through to manual iframe */ }
    }
    if (!result.embed) result.embed = buildManualEmbed(url, result.platform);
    break;
  }
  return result;
}

/* ───────────────────────── GitHub Actions (build & deploy) ───────────────────────── */

async function dispatchWorkflow(env, commitMessage) {
  const r = await ghFetch(
    env,
    `/repos/${env.GH_REPO}/actions/workflows/${env.GH_WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      body: JSON.stringify({
        ref: env.GH_BRANCH,
        inputs: commitMessage ? { commit_message: commitMessage } : {},
      }),
    },
  );
  if (r.status !== 204) {
    throw new Error(`workflow_dispatch failed (${r.status}): ${(await r.text()).slice(0, 300)}`);
  }
}

async function latestWorkflowRun(env) {
  const r = await ghFetch(
    env,
    `/repos/${env.GH_REPO}/actions/workflows/${env.GH_WORKFLOW_FILE}/runs?per_page=1`,
  );
  if (!r.ok) return null;
  const j = await r.json();
  return (j.workflow_runs || [])[0] || null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ───────────────────────── field-preserving item merge ─────────────────────────
   The editor UI posts the known schema fields. Some items carry extra fields
   the UI doesn't know about (cases: num/issue/work/result). Merging instead
   of replacing prevents silent data loss on edit. */

function mergeItem(existing, incoming, slug) {
  const merged = { ...existing, ...incoming };
  merged.slug = slug;
  return merged;
}

/* ───────────────────────── HTTP app ───────────────────────── */

const app = new Hono();

const jsonError = (c, status, detail) => c.json({ detail }, status);

app.onError((err, c) => {
  if (err instanceof ApiError) return jsonError(c, err.apiStatus, err.detail);
  console.error('unhandled:', err.stack || err.message);
  return jsonError(c, 500, err.message || 'Internal error');
});

/* ─── Security headers on every Worker response ───
   `public/_headers` only decorates static-asset responses; API JSON and the
   redirect routes are emitted by this Worker, so set the same protections here. */
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Cache-Control', 'no-store');
  c.header('X-Robots-Tag', 'noindex, nofollow');
});

/* ─── Cloudflare Access JWT validation (defense-in-depth) ───
   When Access is enabled on the workers.dev route, Cloudflare's edge already
   authenticates every request and injects a signed JWT. Validating it here
   means the Worker also rejects any request that somehow reaches it without a
   valid Access assertion. No-op until CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD
   are configured (keeps local dev and the pre-Access state working). */
let _accessJWKS = null;
function accessJWKS(teamDomain) {
  if (!_accessJWKS) {
    _accessJWKS = createRemoteJWKSet(new URL(`${teamDomain.replace(/\/+$/, '')}/cdn-cgi/access/certs`));
  }
  return _accessJWKS;
}

app.use('*', async (c, next) => {
  const team = c.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = c.env.CF_ACCESS_AUD;
  if (!team || !aud) return next(); // Access not configured — edge gate absent, skip.

  const token =
    c.req.header('Cf-Access-Jwt-Assertion') ||
    (c.req.header('Cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1];
  if (!token) return jsonError(c, 403, 'Cloudflare Access authentication required');
  try {
    await jwtVerify(token, accessJWKS(team), {
      issuer: team.replace(/\/+$/, ''),
      audience: aud,
    });
  } catch {
    return jsonError(c, 403, 'Invalid Cloudflare Access token');
  }
  return next();
});

/* Root convenience redirects (static assets handle everything else). */
app.get('/', (c) => c.redirect('/admin/login.html'));
app.get('/admin', (c) => c.redirect('/admin/login.html'));
app.get('/admin/', (c) => c.redirect('/admin/login.html'));

/* ─── auth ─── */

const MAX_LOGIN_FAILURES = 8;
const LOGIN_WINDOW_SECONDS = 900;

app.post('/api/auth/login', async (c) => {
  const env = c.env;

  // Fail closed if the deployment is misconfigured — never let empty/absent
  // credential bindings authenticate an empty request body.
  if (!env.ADMIN_USER || !env.ADMIN_PASS || !env.JWT_SECRET) {
    console.error('login blocked: ADMIN_USER/ADMIN_PASS/JWT_SECRET not fully configured');
    return jsonError(c, 503, 'Admin is not configured. Set ADMIN_USER, ADMIN_PASS, JWT_SECRET.');
  }

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown';
  const rlKey = `rl:login:${ip}`;

  const failures = parseInt((await env.SETTINGS.get(rlKey)) || '0', 10);
  if (failures >= MAX_LOGIN_FAILURES) {
    return jsonError(c, 429, 'Too many failed attempts. Try again later.');
  }

  let body;
  try {
    body = await c.req.json();
  } catch {
    return jsonError(c, 400, 'Invalid JSON body');
  }
  const { username = '', password = '' } = body || {};

  const userOk = await safeEqual(String(username), env.ADMIN_USER || '', env.JWT_SECRET);
  const passOk = await safeEqual(String(password), env.ADMIN_PASS || '', env.JWT_SECRET);
  if (!userOk || !passOk) {
    await env.SETTINGS.put(rlKey, String(failures + 1), { expirationTtl: LOGIN_WINDOW_SECONDS });
    return jsonError(c, 401, 'Invalid credentials');
  }

  const token = await signToken(String(username), env.JWT_SECRET);
  return c.json({ access_token: token, token_type: 'bearer' });
});

/* ─── auth middleware for everything else under /api ─── */

app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/auth/login') return next();
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const user = await verifyToken(token, c.env.JWT_SECRET);
  // Bind the token to the current admin username — rotating ADMIN_USER
  // invalidates every previously issued token.
  if (!user || user !== c.env.ADMIN_USER) return jsonError(c, 401, 'Invalid or expired token');
  c.set('user', user);
  return next();
});

/* ─── content CRUD ─── */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Shape-check an item before it enters content-data.js. The static build
 *  (build_pages.py / build_detail_pages.py) assumes these types, so one
 *  malformed payload would otherwise break every future deployment. */
function validateItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new ApiError(400, 'Body must be a JSON object');
  }
  const bilingual = (v, name) => {
    if (v === undefined) return;
    if (typeof v === 'string') return;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      for (const k of Object.keys(v)) {
        if (typeof v[k] !== 'string') throw new ApiError(400, `${name}.${k} must be a string`);
      }
      return;
    }
    throw new ApiError(400, `${name} must be a string or {ja,en} object`);
  };
  for (const f of ['title', 'excerpt', 'body', 'dateLabel']) bilingual(item[f], f);
  for (const f of ['tag', 'date', 'slug', 'seo_title', 'seo_description', 'og_image', 'thumbnail', 'embed', 'video', 'share_text']) {
    if (item[f] !== undefined && typeof item[f] !== 'string') {
      throw new ApiError(400, `${f} must be a string`);
    }
  }
  for (const f of ['media', 'images', 'seo_keywords', 'sources']) {
    if (item[f] !== undefined && !Array.isArray(item[f])) {
      throw new ApiError(400, `${f} must be an array`);
    }
  }
  if (Array.isArray(item.media)) {
    for (const m of item.media) {
      if (!m || typeof m !== 'object' || Array.isArray(m)) throw new ApiError(400, 'each media entry must be an object');
    }
  }
}

function validateSection(section) {
  if (!VALID_SECTIONS.has(section)) {
    throw new ApiError(400, `Invalid section '${section}'. Must be one of: cases, insights, speaking`);
  }
}

app.get('/api/content/:section', async (c) => {
  const section = c.req.param('section');
  validateSection(section);
  const { data } = await readContent(c.env);
  return c.json({ section, items: data[section] || [] });
});

app.post('/api/content/:section', async (c) => {
  const section = c.req.param('section');
  validateSection(section);
  const item = await c.req.json();
  validateItem(item);

  // Always normalize the slug — it becomes a static filename in build_pages.py
  // and a URL on the public site, so it must be safe kebab-case regardless of
  // what the client sent.
  const rawSlug = item.slug || item.title?.en || '';
  item.slug = slugify(rawSlug);
  if (!item.slug || !SLUG_RE.test(item.slug)) {
    throw new ApiError(400, 'A valid kebab-case slug (or English title) is required');
  }

  const slug = item.slug;
  await mutateContent(c.env, (data) => {
    const items = data[section] || (data[section] = []);
    if (items.some((x) => x.slug === slug)) {
      throw new ApiError(409, `Slug '${slug}' already exists in ${section}`);
    }
    items.unshift(item); // newest first
    return null;
  }, `chore(admin-web): add ${section}/${slug}`);

  return c.json({ status: 'created', slug });
});

app.put('/api/content/:section/:slug', async (c) => {
  const section = c.req.param('section');
  const slug = c.req.param('slug');
  validateSection(section);
  const incoming = await c.req.json();
  validateItem(incoming);

  await mutateContent(c.env, (data) => {
    const items = data[section] || [];
    const i = items.findIndex((x) => x.slug === slug);
    if (i === -1) throw new ApiError(404, `Item '${slug}' not found in ${section}`);
    items[i] = mergeItem(items[i], incoming, slug);
    return null;
  }, `chore(admin-web): update ${section}/${slug}`);

  return c.json({ status: 'updated', slug });
});

app.delete('/api/content/:section/:slug', async (c) => {
  const section = c.req.param('section');
  const slug = c.req.param('slug');
  validateSection(section);

  await mutateContent(c.env, (data) => {
    const items = data[section] || [];
    const i = items.findIndex((x) => x.slug === slug);
    if (i === -1) throw new ApiError(404, `Item '${slug}' not found in ${section}`);
    items.splice(i, 1);
    return null;
  }, `chore(admin-web): delete ${section}/${slug}`);

  return c.json({ status: 'deleted', slug });
});

/* ─── build / deploy (GitHub Actions) ─── */

app.post('/api/build', async (c) => {
  await dispatchWorkflow(c.env, 'chore(admin-web): build');
  await sleep(2500);
  const run = await latestWorkflowRun(c.env);
  const url = run?.html_url || `https://github.com/${c.env.GH_REPO}/actions`;
  return c.json({
    returncode: 0,
    stdout:
      'GitHub Actions build started.\n' +
      `Run: ${url}\n` +
      'The workflow runs build_pages.py (detail pages, sitemap, SEO) and\n' +
      'pushes to main if anything changed — Cloudflare Pages then deploys.\n',
    stderr: '',
    run_url: url,
  });
});

app.post('/api/deploy', async (c) => {
  let commitMsg = 'chore(admin): content update';
  try {
    const body = await c.req.json();
    if (body?.commit_msg) commitMsg = String(body.commit_msg).slice(0, 200);
  } catch { /* default */ }

  await dispatchWorkflow(c.env, commitMsg);
  await sleep(2500);
  const run = await latestWorkflowRun(c.env);
  const url = run?.html_url || `https://github.com/${c.env.GH_REPO}/actions`;
  return c.json({
    build: {
      returncode: 0,
      stdout: `GitHub Actions build & deploy started.\nRun: ${url}\n`,
      stderr: '',
    },
    deploy: {
      steps: [{
        cmd: `workflow_dispatch ${c.env.GH_WORKFLOW_FILE} (ref: ${c.env.GH_BRANCH})`,
        returncode: 0,
        out: `queued — commit message: "${commitMsg}"\nProgress: ${url}`,
      }],
    },
    run_url: url,
  });
});

app.get('/api/build/status', async (c) => {
  const run = await latestWorkflowRun(c.env);
  if (!run) return c.json({ status: 'none' });
  return c.json({
    status: run.status,                 // queued | in_progress | completed
    conclusion: run.conclusion,         // success | failure | ... (null until completed)
    html_url: run.html_url,
    run_number: run.run_number,
    display_title: run.display_title,
    created_at: run.created_at,
    updated_at: run.updated_at,
  });
});

/* ─── AI playground ─── */

app.post('/api/playground/generate', async (c) => {
  const req = await c.req.json();
  const input = req?.input || '';
  if (!input.trim()) throw new ApiError(400, 'Input is required');
  const s = await loadSettings(c.env);
  try {
    const result = await generateContent(
      c.env, input, req?.section_hint || '', req?.provider || '', req?.model || '',
    );
    return c.json({
      status: 'ok',
      content: result,
      provider: req?.provider || s.default_provider || '',
      model: req?.model || s.default_model || '',
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(502, `AI API error: ${e.message}`);
  }
});

app.post('/api/playground/import-url', async (c) => {
  const req = await c.req.json();
  const url = (req?.url || '').trim();
  if (!url) throw new ApiError(400, 'URL required');
  return c.json(await importUrl(url));
});

/* ─── media ─── */

app.post('/api/media/upload', async (c) => {
  const form = await c.req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new ApiError(400, 'file field is required');

  const dot = file.name.lastIndexOf('.');
  const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) throw new ApiError(400, `File type ${ext} not allowed`);

  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_UPLOAD_MB) {
    throw new ApiError(400, `File too large (${sizeMb.toFixed(1)}MB, max ${MAX_UPLOAD_MB}MB on the web admin — use YouTube for large video)`);
  }

  const uniqueName = `${crypto.randomUUID().replace(/-/g, '')}${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await ghPutFile(
    c.env,
    `${UPLOAD_DIR}/${uniqueName}`,
    bytes,
    `chore(admin-web): upload media ${uniqueName}`,
  );

  return c.json({
    url: `/assets/images/uploads/${uniqueName}`,
    filename: uniqueName,
    original: file.name,
    size_mb: Math.round(sizeMb * 100) / 100,
    type: VIDEO_EXTENSIONS.has(ext) ? 'video' : 'image',
  });
});

app.get('/api/media/list', async (c) => {
  const r = await ghFetch(
    c.env,
    `/repos/${c.env.GH_REPO}/contents/${UPLOAD_DIR}?ref=${c.env.GH_BRANCH}`,
  );
  if (r.status === 404) return c.json({ files: [] });
  if (!r.ok) throw new Error(`GitHub list failed (${r.status})`);
  const entries = await r.json();
  const files = (Array.isArray(entries) ? entries : [])
    .filter((e) => e.type === 'file')
    .filter((e) => {
      const dot = e.name.lastIndexOf('.');
      return dot !== -1 && ALLOWED_EXTENSIONS.has(e.name.slice(dot).toLowerCase());
    })
    .map((e) => {
      const ext = e.name.slice(e.name.lastIndexOf('.')).toLowerCase();
      return {
        url: `/assets/images/uploads/${e.name}`,
        filename: e.name,
        size_mb: Math.round((e.size / (1024 * 1024)) * 100) / 100,
        type: VIDEO_EXTENSIONS.has(ext) ? 'video' : 'image',
      };
    });
  return c.json({ files });
});

app.post('/api/media/extract', async (c) => {
  const data = await c.req.json();
  const url = typeof data?.url === 'string' ? data.url.trim() : '';
  if (!url) throw new ApiError(400, 'URL required');
  return c.json(detectMediaType(url));
});

/* ─── settings ─── */

const KEY_FIELDS = new Set(['api_key']);

function maskSecret(value) {
  if (typeof value !== 'string' || !value) return '';
  return value.length > 4 ? `••••${value.slice(-4)}` : '••••';
}

app.get('/api/settings', async (c) => {
  const s = await loadSettings(c.env);
  const masked = JSON.parse(JSON.stringify(s));
  for (const cfg of Object.values(masked.providers || {})) {
    for (const field of KEY_FIELDS) {
      if (cfg[field]) cfg[field] = maskSecret(cfg[field]);
    }
  }
  return c.json(masked);
});

app.post('/api/settings', async (c) => {
  const data = await c.req.json();
  const current = await loadSettings(c.env);
  const incomingProviders = data?.providers || {};

  // base_url is only writable for providers that legitimately need a custom
  // endpoint. Freezing it for cloud providers stops a stolen token from
  // redirecting e.g. OpenAI's key to an attacker host (SSRF / key exfil).
  const BASE_URL_EDITABLE = new Set(['custom', 'ollama', 'lmstudio']);
  const ALLOWED_FIELDS = new Set(['api_key', 'base_url', 'model_ids', 'enabled']);

  for (const [prov, cfg] of Object.entries(incomingProviders)) {
    if (typeof cfg !== 'object' || cfg === null) continue;
    // Only known provider ids — blocks prototype pollution via crafted keys.
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.providers, prov)) continue;
    const bucket = current.providers[prov] || (current.providers[prov] = {});
    for (const [k, v] of Object.entries(cfg)) {
      if (!ALLOWED_FIELDS.has(k)) continue;
      if (k === 'base_url' && !BASE_URL_EDITABLE.has(prov)) continue;
      // Preserve the existing key if the UI sent back the masked placeholder.
      if (KEY_FIELDS.has(k) && typeof v === 'string' && v.startsWith('••••')) continue;
      bucket[k] = v;
    }
  }
  if (data && 'default_provider' in data) current.default_provider = data.default_provider;
  if (data && 'default_model' in data) current.default_model = data.default_model;

  await saveSettings(c.env, current);
  return c.json({ status: 'saved' });
});

/* ─── AI provider / model discovery ─── */

app.get('/api/ai/providers', async (c) => {
  const s = await loadSettings(c.env);
  const result = knownProviders().map((pid) => {
    const cfg = (s.providers || {})[pid] || {};
    const hasKey = Boolean((cfg.api_key || '').trim());
    const hasUrl = Boolean((cfg.base_url || '').trim());
    return {
      id: pid,
      enabled: Boolean(cfg.enabled),
      configured: hasKey || hasUrl,
      has_key: hasKey,
      has_base_url: hasUrl,
      models: PROVIDER_MODELS[pid] || [],
      dynamic_models: ['ollama', 'lmstudio', 'custom'].includes(pid),
    };
  });
  return c.json({
    providers: result,
    default_provider: s.default_provider || '',
    default_model: s.default_model || '',
  });
});

app.get('/api/ai/models/:pid', async (c) => {
  const pid = c.req.param('pid');
  if (!(pid in PROVIDER_MODELS)) throw new ApiError(404, `Unknown provider: ${pid}`);
  const models = await getAvailableModels(c.env, pid);
  return c.json({ provider: pid, models, best: bestModel(pid, models) });
});

app.get('/api/ai/best_model/:pid', async (c) => {
  const pid = c.req.param('pid');
  if (!(pid in PROVIDER_MODELS)) throw new ApiError(404, `Unknown provider: ${pid}`);
  const models = await getAvailableModels(c.env, pid);
  return c.json({ provider: pid, best: bestModel(pid, models), all: models });
});

app.post('/api/ai/test', async (c) => {
  const req = await c.req.json();
  const pid = (req?.provider || '').trim();
  if (!knownProviders().includes(pid)) throw new ApiError(400, `Unknown provider: ${pid}`);

  let model = (req?.model || '').trim();
  if (!model) {
    const models = await getAvailableModels(c.env, pid);
    model = bestModel(pid, models);
  }
  if (!model) {
    return c.json({
      status: 'error',
      error: `No model available for ${pid}. Check the API key, base URL, or pull a model locally.`,
    });
  }

  try {
    const text = await providerGenerate(
      c.env, pid,
      'You are a test assistant. Reply with valid JSON only.',
      'Say hello in JSON: {"message": "..."}',
      model,
    );
    return c.json({ status: 'ok', model, response: (text || '').slice(0, 300) });
  } catch (e) {
    return c.json({ status: 'error', model, error: e.message });
  }
});

export default app;
