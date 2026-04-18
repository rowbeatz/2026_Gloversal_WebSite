/**
 * Cloudflare Pages Function — POST /api/contact
 * Receives form data and sends notification email via Resend API.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

    // Validate required fields
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

    // Build email
    const RESEND_API_KEY = env.RESEND_API_KEY;
    const TO_EMAIL = env.CONTACT_TO_EMAIL || 'info@gloversal.com';

    if (!RESEND_API_KEY) {
      // In development / without API key, return success to indicate structure is correct
      console.log('[contact] RESEND_API_KEY not set — logging form data');
      console.log(JSON.stringify({ name, company, email, topic, mode, url, body: body.substring(0, 200) }));
      return json({ ok: true, dev: true });
    }

    const emailBody = [
      `Name: ${name.trim()}`,
      company ? `Company: ${company.trim()}` : null,
      `Email: ${email.trim()}`,
      topic ? `Topic: ${topic}` : null,
      mode ? `Mode: ${mode}` : null,
      url ? `URL: ${url.trim()}` : null,
      '',
      '--- Message ---',
      body.trim(),
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
        reply_to: email.trim(),
        subject: `[Gloversal Contact] ${name.trim()} — ${topic || 'General inquiry'}`,
        text: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[contact] Resend error:', err);
      return json({ ok: false, error: 'Failed to send email. Please try again later.' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
}
