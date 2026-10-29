const crypto = require('node:crypto');
const { json, db, sendEmail, escapeHtml } = require('../lib/api-helpers');
function verify(raw, header, secret) {
  const pieces = String(header || '').split(',').map(part => part.trim().split('='));
  const timestamp = pieces.find(p => p[0] === 't')?.[1];
  const signatures = pieces.filter(p => p[0] === 'v1').map(p => p[1]);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(timestamp + '.' + raw).digest();
  return signatures.some(signature => {
    const candidate = Buffer.from(signature, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  });
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
        const orderId = session.client_reference_id || session.metadata?.order_id;
        if (!orderId) return json(res, 400, { error: 'Missing order reference.' });
        const rows = await db('orders?id=eq.' + encodeURIComponent(orderId));
        const order = rows[0];
        if (order) {
          const shippingAddress = session.shipping_details || session.collected_information?.shipping_details || null;
          if (order.status !== 'paid') {
            await db('orders?id=eq.' + encodeURIComponent(order.id), { method: 'PATCH', body: { status: 'paid', stripe_session_id: session.id, paid_at: new Date().toISOString(), shipping_address: shippingAddress, stripe_customer_id: session.customer || null }, prefer: 'return=minimal' });
          }
          if (!order.confirmation_email_sent_at) {
            const lines = (order.items || []).map(i => escapeHtml(i.title + ' · ' + i.size.toUpperCase() + ' × ' + i.qty)).join('<br>');
            const total = (order.total_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
            const customerMail = await sendEmail({ to: order.customer_email, subject: 'Bestellbestätigung — Morena Denigro', html: '<p>Hallo '+escapeHtml(order.customer_name)+',</p><p>deine Zahlung ist eingegangen. Hier ist deine Bestellübersicht:</p><p>'+lines+'</p><p>Gesamt: '+total+'</p><p>Morena Denigro</p>', text: 'Hallo '+order.customer_name+',\n\ndeine Zahlung ist eingegangen.\n'+(order.items||[]).map(i=>i.title+' '+i.size+' × '+i.qty).join('\n')+'\nGesamt: '+total+'\nMorena Denigro' });
            const artistMail = await sendEmail({ to: process.env.MORENA_CONTACT_EMAIL || 'morenadenigro@gmail.com', subject: 'Neue bezahlte Bestellung — ' + order.id, html: '<p>Neue bezahlte Bestellung.</p><p>Bestellung: '+escapeHtml(order.id)+'</p><p>Kundschaft: '+escapeHtml(order.customer_name)+' · '+escapeHtml(order.customer_email)+'</p><p>Gesamt: '+total+'</p><p>Lieferadresse: '+escapeHtml(JSON.stringify(shippingAddress || {}))+'</p>', text: 'Neue bezahlte Bestellung '+order.id+'\nKundschaft: '+order.customer_name+' · '+order.customer_email+'\nGesamt: '+total+'\nLieferadresse: '+JSON.stringify(shippingAddress || {}) });
            if (!customerMail.sent || !artistMail.sent) return json(res, 500, { error: 'Confirmation email delivery is not configured.' });
            await db('orders?id=eq.' + encodeURIComponent(order.id), { method: 'PATCH', body: { confirmation_email_sent_at: new Date().toISOString() }, prefer: 'return=minimal' });
          }
        }
      }
    }
    return json(res, 200, { received: true });
  } catch (_) { return json(res, 500, { error: 'Webhook processing failed.' }); }
};
module.exports.config = { api: { bodyParser: false } };
