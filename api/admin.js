const { json, method, body, db, admin, fail } = require('./_lib');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET','PATCH'])) return;
  if (!admin(req)) return json(res, 401, { error: 'Nicht autorisiert.' });
  try {
    if (req.method === 'GET') {
      const [artworks, orders, inquiries, events, subscribers] = await Promise.all([
        db('artworks?select=*&order=title.asc'),
        db('orders?select=id,created_at,customer_name,customer_email,status,total_cents,currency,items,shipping_zone&order=created_at.desc&limit=100'),
        db('inquiries?select=id,created_at,name,email,topic,message,status,artwork_id&order=created_at.desc&limit=100'),
        db('site_events?select=event_name,artwork_id,created_at&order=created_at.desc&limit=1000'),
        db('newsletter_subscribers?select=id,email,created_at&order=created_at.desc&limit=500')
      ]);
      const counts = events.reduce((a, e) => { a[e.event_name] = (a[e.event_name] || 0) + 1; return a; }, {});
      return json(res, 200, { artworks, orders, inquiries, events: counts, subscribers });
    }
    const data = await body(req);
    if (data.resource === 'artwork') {
      const id = String(data.id || '');
      const patch = {};
      if (typeof data.available === 'boolean') patch.available = data.available;
      if (typeof data.status === 'string') patch.status = data.status.slice(0, 80);
      if (typeof data.price_eur === 'number' && data.price_eur >= 0 && data.price_eur <= 100000) patch.price_eur = data.price_eur;
      if (typeof data.story === 'string') patch.story = data.story.slice(0, 2500);
      if (typeof data.stock === 'number' && Number.isInteger(data.stock) && data.stock >= 0 && data.stock <= 10000) patch.stock = data.stock;
      if (!id || !Object.keys(patch).length) return json(res, 400, { error: 'Keine gültigen Änderungen.' });
      await db('artworks?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: patch });
      return json(res, 200, { ok: true });
    }
    if (data.resource === 'inquiry') {
      const id = String(data.id || '');
      const status = ['new','in_progress','answered','archived'].includes(data.status) ? data.status : '';
      if (!id || !status) return json(res, 400, { error: 'Ungültiger Anfrage-Status.' });
      await db('inquiries?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { status } });
      return json(res, 200, { ok: true });
    }
    if (data.resource === 'order') {
      const id = String(data.id || '');
      const status = ['pending','paid','processing','shipped','refunded','cancelled'].includes(data.status) ? data.status : '';
      if (!id || !status) return json(res, 400, { error: 'Ungültiger Bestellstatus.' });
      await db('orders?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { status } });
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: 'Unbekannte Aktion.' });
  } catch (error) { return fail(res, error); }
};
