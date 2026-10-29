const { json, method, body, db, fail } = require('./_lib');
const allowed = new Set(['view_artwork','view_shop','add_to_cart','begin_checkout','checkout_cancelled','checkout_success','inquiry_submitted','newsletter_submitted']);
module.exports = async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const data = await body(req);
    const event = String(data.event || '');
    if (!allowed.has(event)) return json(res, 400, { error: 'Ungültiges Ereignis.' });
    await db('site_events', { method: 'POST', body: { event_name: event, artwork_id: String(data.artworkId || '').slice(0, 80) || null, page_path: String(data.path || '/').slice(0, 180) } , prefer: 'return=minimal' });
    return json(res, 202, { ok: true });
  } catch (error) { return fail(res, error); }
};
