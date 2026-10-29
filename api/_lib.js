const crypto = require('node:crypto');

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};
const method = (req, res, allowed) => {
  if (!allowed.includes(req.method)) { res.setHeader('Allow', allowed.join(', ')); json(res, 405, { error: 'Method not allowed.' }); return false; }
  return true;
};
const body = async req => {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) { chunks.push(Buffer.from(chunk)); if (Buffer.concat(chunks).length > 1024 * 64) throw new Error('Request too large'); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};
const configured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
async function db(path, options = {}) {
  if (!configured()) { const e = new Error('Store backend is not configured.'); e.status = 503; throw e; }
  const url = process.env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json', Prefer: options.prefer || 'return=representation', ...(options.headers || {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  if (!response.ok) { const e = new Error('Store request failed (' + response.status + ').'); e.status = 502; e.detail = text.slice(0, 500); throw e; }
  return text ? JSON.parse(text) : null;
}
function admin(req) {
  const expected = process.env.ARTIST_ADMIN_TOKEN || '';
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (expected.length < 32 || provided.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return false;
  return true;
}
async function sendEmail({to, subject, html, text}) {
  if (!process.env.RESEND_API_KEY || !process.env.MORENA_FROM_EMAIL) return { sent: false, reason: 'email_not_configured' };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MORENA_FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html, text })
  });
  if (!response.ok) throw new Error('Email provider rejected the message (' + response.status + ').');
  return { sent: true };
}
const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
const fail = (res, error) => json(res, error.status || 500, { error: error.status === 503 ? 'Der Shop-Server ist noch nicht vollständig eingerichtet.' : 'Die Anfrage konnte gerade nicht verarbeitet werden.', code: error.status === 503 ? 'BACKEND_NOT_CONFIGURED' : 'REQUEST_FAILED' });
module.exports = { json, method, body, db, admin, sendEmail, escapeHtml, fail, configured };
