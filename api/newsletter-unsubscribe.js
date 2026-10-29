const crypto = require('node:crypto');
const { json, method, db, fail } = require('../lib/api-helpers');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  const token = String(req.query?.token || '');
  if (!/^[a-f0-9]{64}$/.test(token)) return json(res, 400, { error: 'Ungültiger Abmeldelink.' });
  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const rows = await db('newsletter_subscribers?select=email&unsubscribe_token_hash=eq.' + hash + '&limit=1');
    if (!rows.length) return json(res, 410, { error: 'Dieser Abmeldelink ist nicht mehr gültig.' });
    await db('newsletter_subscribers?unsubscribe_token_hash=eq.' + hash, { method: 'PATCH', body: { unsubscribed_at: new Date().toISOString(), unsubscribe_token_hash: null, confirmation_token_hash: null }, prefer: 'return=minimal' });
    return json(res, 200, { ok: true, message: 'Deine E-Mail-Adresse wurde abgemeldet.' });
  } catch (error) { return fail(res, error); }
};
