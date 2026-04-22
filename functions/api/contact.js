/**
 * Cloudflare Pages Function — POST /api/contact
 * Receives form data, forwards a copy to Google Forms (Google Sheets backend)
 * and sends a notification email via Resend.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Google Forms — HP_Gloversal.com_Inquiry
const GFORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSdmCHnwP4nviPY7uulga33_D9MPixLjBwKfveHMeiK_BE4Wew/formResponse';
const GFORM_FIELDS = {
  name:    'entry.1612910629',
  company: 'entry.625800518',
  email:   'entry.240604762',
  topic:   'entry.404643856',
  mode:    'entry.1151100041',
  url:     'entry.300341744',
  body:    'entry.2132782855',
};
const TOPIC_LABELS = {
  newbiz:  '新規事業開発',
  entry:   '海外展開・Market Entry',
  dxai:    '医療DX / AI導入',
  remote:  '遠隔医療 / 画像診断',
  content: '資料設計・メッセージング',
  other:   'その他',
};
const MODE_LABELS = {
  talk:     'まずは相談したい',
  project:  'プロジェクト伴走を検討したい',
  alliance: '提携・アライアンスを相談したい',
  other:    'その他',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function forwardToGoogleForm(fields) {
  const params = new URLSearchParams();
  params.set(GFORM_FIELDS.name,    fields.name    || '');
  params.set(GFORM_FIELDS.company, fields.company || '');
  params.set(GFORM_FIELDS.email,   fields.email   || '');
  params.set(GFORM_FIELDS.topic,   TOPIC_LABELS[fields.topic] || fields.topic || '');
  params.set(GFORM_FIELDS.mode,    MODE_LABELS[fields.mode]   || fields.mode  || '');
  params.set(GFORM_FIELDS.url,     fields.url     || '');
  params.set(GFORM_FIELDS.body,    fields.body    || '');

  try {
    const res = await fetch(GFORM_ACTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; GloversalContactProxy/1.0)',
      },
      body: params.toString(),
    });
    if (!res.ok) {
      console.error('[contact] Google Form responded', res.status);
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('[contact] Google Form forward failed:', err);
    return { ok: false, status: 0, error: String(err?.message || err) };
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const contentType = request.headers.get('Content-Type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    } else {
      return json({ ok: false, error: 'Unsupported Content-Type' }, 400);
    }

    const { name, company, email, topic, mode, url, body } = data;

    const errors = [];
    if (!name || !name.trim()) errors.push('name');
    if (!email || !email.trim()) errors.push('email');
    if (!body || !body.trim()) errors.push('body');

    if (errors.length > 0) {
      return json({ ok: false, error: `Missing required fields: ${errors.join(', ')}` }, 400);
    }

    if (!isValidEmail(email.trim())) {
      return json({ ok: false, error: 'Invalid email address' }, 400);
    }

    const clean = {
      name:    name.trim(),
      company: company?.trim() || '',
      email:   email.trim(),
      topic:   topic || '',
      mode:    mode  || '',
      url:     url?.trim() || '',
      body:    body.trim(),
    };

    // Await the Google Form forward so its result can be surfaced in the response
    // (diagnostic-friendly; round-trip to docs.google.com is ~200–500ms).
    const gformResult = await forwardToGoogleForm(clean);

    const RESEND_API_KEY = env.RESEND_API_KEY;
    const TO_EMAIL = env.CONTACT_TO_EMAIL || 'inquiry@gloversal.com';

    if (!RESEND_API_KEY) {
      console.log('[contact] RESEND_API_KEY not set — relying on Google Form forwarding only');
      console.log(JSON.stringify({ ...clean, body: clean.body.substring(0, 200) }));
      return json({ ok: true, dev: true, gform: gformResult });
    }

    const emailBody = [
      `Name: ${clean.name}`,
      clean.company ? `Company: ${clean.company}` : null,
      `Email: ${clean.email}`,
      clean.topic ? `Topic: ${TOPIC_LABELS[clean.topic] || clean.topic}` : null,
      clean.mode  ? `Mode: ${MODE_LABELS[clean.mode]   || clean.mode}`  : null,
      clean.url   ? `URL: ${clean.url}` : null,
      '',
      '--- Message ---',
      clean.body,
    ].filter(Boolean).join('\n');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gloversal Contact <noreply@gloversal.com>',
        to: [TO_EMAIL],
        reply_to: clean.email,
        subject: `[Gloversal Contact] ${clean.name} — ${TOPIC_LABELS[clean.topic] || clean.topic || 'General inquiry'}`,
        text: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[contact] Resend error:', err);
      return json({ ok: false, error: 'Failed to send email. Please try again later.', gform: gformResult }, 502);
    }

    return json({ ok: true, gform: gformResult });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
}
