/**
 * Cloudflare Pages Function — GET /api/notion
 * Proxies content from Notion databases for Insights, Speaking, and Cases.
 *
 * Query params:
 *   type  = insights | speaking | cases  (required)
 *   slug  = specific item slug           (optional — single-item fetch)
 *
 * Environment variables:
 *   NOTION_API_KEY        — Notion integration token
 *   NOTION_DB_INSIGHTS    — Database ID for Insights
 *   NOTION_DB_SPEAKING    — Database ID for Speaking / Activities
 *   NOTION_DB_CASES       — Database ID for Case Studies
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const DB_MAP = {
  insights: 'NOTION_DB_INSIGHTS',
  speaking: 'NOTION_DB_SPEAKING',
  cases: 'NOTION_DB_CASES',
};

const NOTION_VERSION = '2022-06-28';

/**
 * Convert Notion rich-text blocks into simple HTML.
 */
function richTextToHTML(richTexts) {
  if (!richTexts || !Array.isArray(richTexts)) return '';
  return richTexts.map(rt => {
    let text = rt.plain_text || '';
    if (rt.annotations) {
      if (rt.annotations.bold) text = `<strong>${text}</strong>`;
      if (rt.annotations.italic) text = `<em>${text}</em>`;
      if (rt.annotations.code) text = `<code>${text}</code>`;
    }
    if (rt.href) text = `<a href="${rt.href}" target="_blank" rel="noopener">${text}</a>`;
    return text;
  }).join('');
}

/**
 * Fetch blocks for a page and convert to HTML string.
 */
async function fetchBlocksAsHTML(pageId, apiKey) {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
    },
  });
  if (!res.ok) return '';
  const data = await res.json();
  const blocks = data.results || [];

  return blocks.map(block => {
    const type = block.type;
    const content = block[type];
    if (!content) return '';

    switch (type) {
      case 'paragraph':
        return `<p>${richTextToHTML(content.rich_text)}</p>`;
      case 'heading_1':
        return `<h1>${richTextToHTML(content.rich_text)}</h1>`;
      case 'heading_2':
        return `<h2>${richTextToHTML(content.rich_text)}</h2>`;
      case 'heading_3':
        return `<h3>${richTextToHTML(content.rich_text)}</h3>`;
      case 'bulleted_list_item':
        return `<li>${richTextToHTML(content.rich_text)}</li>`;
      case 'numbered_list_item':
        return `<li>${richTextToHTML(content.rich_text)}</li>`;
      case 'quote':
        return `<blockquote>${richTextToHTML(content.rich_text)}</blockquote>`;
      case 'divider':
        return '<hr>';
      default:
        return '';
    }
  }).join('\n');
}

/**
 * Extract standard properties from a Notion page object.
 */
function extractProps(page) {
  const props = page.properties || {};
  const get = (name) => {
    const p = props[name];
    if (!p) return '';
    if (p.type === 'title') return richTextToHTML(p.title);
    if (p.type === 'rich_text') return richTextToHTML(p.rich_text);
    if (p.type === 'select') return p.select?.name || '';
    if (p.type === 'date') return p.date?.start || '';
    if (p.type === 'url') return p.url || '';
    if (p.type === 'number') return p.number ?? '';
    return '';
  };

  return {
    id: page.id,
    slug: get('Slug') || page.id,
    title: get('Title') || get('Name'),
    date: get('Date'),
    tag: get('Tag') || get('Category'),
    excerpt: get('Excerpt') || get('Summary'),
    num: get('Num'),
    issue: get('Issue') || get('Challenge'),
    work: get('Work') || get('Engagement'),
    result: get('Result') || get('Outcome'),
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const slug = url.searchParams.get('slug');

  if (!type || !DB_MAP[type]) {
    return json({ ok: false, error: 'Invalid type. Use: insights, speaking, or cases' }, 400);
  }

  const apiKey = env.NOTION_API_KEY;
  if (!apiKey) {
    return json({ ok: false, fallback: true, message: 'NOTION_API_KEY not configured — use embedded data' });
  }

  const dbEnvVar = DB_MAP[type];
  const dbId = env[dbEnvVar];
  if (!dbId) {
    return json({ ok: false, fallback: true, message: `${dbEnvVar} not configured` });
  }

  try {
    // Query the database
    const queryBody = {
      sorts: [{ property: 'Date', direction: 'descending' }],
    };

    if (slug) {
      queryBody.filter = {
        property: 'Slug',
        rich_text: { equals: slug },
      };
    }

    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[notion] Query error:', err);
      return json({ ok: false, error: 'Notion API error' }, 502);
    }

    const data = await res.json();
    const pages = data.results || [];

    const items = await Promise.all(pages.map(async (page) => {
      const item = extractProps(page);
      if (slug) {
        item.body = await fetchBlocksAsHTML(page.id, apiKey);
      }
      return item;
    }));

    return json({ ok: true, items });
  } catch (err) {
    console.error('[notion] Unexpected error:', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
}
