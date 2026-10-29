const { json, method, db, fail } = require('../lib/api-helpers');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  const session = String(req.query?.session_id || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(session)) return json(res, 400, { error: 'Ungültige Checkout-Referenz.' });
  try {
    const rows = await db('orders?select=status&stripe_session_id=eq.' + encodeURIComponent(session) + '&limit=1');
    if (!rows.length) return json(res, 404, { error: 'Bestellung noch nicht gefunden.' });
    return json(res, 200, { status: rows[0].status });
  } catch (error) { return fail(res, error); }
};
