const crypto = require('node:crypto');
const { json, method, db, fail } = require('./_lib');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  const token = String(req.query?.token || '');
  if (!/^[a-f0-9]{64}$/.test(token)) return json(res, 400, { error: 'Ungültiger Bestätigungslink.' });
  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const rows = await db('newsletter_subscribers?select=email,confirmation_token_hash,unsubscribed_at&confirmation_token_hash=eq.' + hash + '&limit=1');
    if (!rows.length || rows[0].unsubscribed_at) return json(res, 410, { error: 'Dieser Bestätigungslink ist nicht mehr gültig.' });
    await db('newsletter_subscribers?confirmation_token_hash=eq.' + hash, { method: 'PATCH', body: { confirmed_at: new Date().toISOString(), confirmation_token_hash: null }, prefer: 'return=minimal' });
    return json(res, 200, { ok: true, message: 'Deine Anmeldung ist bestätigt.' });
  } catch (error) { return fail(res, error); }
};
