const crypto = require('node:crypto');
const { json, db, sendEmail, escapeHtml } = require('./_lib');
function verify(raw, header, secret) {
  const parts = Object.fromEntries(String(header || '').split(',').map(part => part.split('=').map(v => v.trim())));
  if (!parts.t || !parts.v1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (age > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(parts.t + '.' + raw).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return json(res, 503, { error: 'Webhook not configured.' });
  const chunks = [];
  try {
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!verify(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) return json(res, 400, { error: 'Invalid signature.' });
    const event = JSON.parse(raw);
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        const rows = await db('orders?id=eq.' + encodeURIComponent(session.client_reference_id || session.metadata?.order_id));
        const order = rows[0];
        if (order && order.status !== 'paid') {
          await db('orders?id=eq.' + encodeURIComponent(order.id), { method: 'PATCH', body: { status: 'paid', stripe_session_id: session.id, paid_at: new Date().toISOString() } });
          const lines = (order.items || []).map(i => escapeHtml(i.title + ' · ' + i.size.toUpperCase() + ' × ' + i.qty)).join('<br>');
          await sendEmail({ to: order.customer_email, subject: 'Bestellbestätigung — Morena Denigro', html: '<p>Hallo '+escapeHtml(order.customer_name)+',</p><p>deine Zahlung ist eingegangen. Hier ist deine Bestellübersicht:</p><p>'+lines+'</p><p>Gesamt: '+(order.total_cents/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'})+'</p><p>Morena Denigro</p>', text: 'Hallo '+order.customer_name+',\n\ndeine Zahlung ist eingegangen.\n'+(order.items||[]).map(i=>i.title+' '+i.size+' × '+i.qty).join('\n')+'\nGesamt: '+(order.total_cents/100)+' EUR\nMorena Denigro' });
        }
      }
    }
    return json(res, 200, { received: true });
  } catch (_) { return json(res, 500, { error: 'Webhook processing failed.' }); }
};
