const crypto = require('node:crypto');
const { json, method, body, db, fail } = require('../lib/api-helpers');
const works = {
  'daikoku-1': { title: 'Daikoku PA 1', status: 'Nicht verkäuflich', price: null },
  'daikoku-2': { title: 'Daikoku PA 2', status: 'Original verfügbar', price: 850 },
  'daikoku-3': { title: 'Daikoku PA 3', status: 'Verkauft', price: null },
  'ginza-1': { title: 'Ginza 1', status: 'Original verfügbar', price: 350 },
  'ginza-2': { title: 'Ginza 2', status: 'Original verfügbar', price: 600 },
  'ginza-3': { title: 'Ginza 3', status: 'Original verfügbar', price: 950 },
  'singen-1': { title: 'Singen 1', status: 'Original verfügbar', price: 950 },
  'singen-2': { title: 'Singen 2', status: 'Original verfügbar', price: 850 },
  'singen-3': { title: 'Singen 3', status: 'Original verfügbar', price: 950 },
  'dessau-1': { title: 'Dessau-Roßlau 1', status: 'Original verfügbar', price: 950 }
};
const eu = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
module.exports = async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.PUBLIC_SITE_URL || !process.env.RESEND_API_KEY || !process.env.MORENA_FROM_EMAIL) return json(res, 503, { error: 'Onlinekauf ist noch nicht aktiviert. Bitte frage den Print direkt an.', code: 'CHECKOUT_NOT_CONFIGURED' });
  try {
    const data = await body(req);
    const email = String(data.email || '').trim().toLowerCase();
    const name = String(data.name || '').trim().slice(0, 120);
    const zone = data.zone === 'lu' ? 'lu' : data.zone === 'eu' ? 'eu' : '';
    if (!/^\S+@\S+\.\S+$/.test(email) || !name || !zone || data.acceptTerms !== true) return json(res, 400, { error: 'Bitte prüfe Name, E-Mail, Versandregion und die Zustimmung zu den Kaufbedingungen.' });
    if (!Array.isArray(data.items) || !data.items.length || data.items.length > 20) return json(res, 400, { error: 'Der Warenkorb ist leer oder ungültig.' });
    const items = data.items.map(item => {
      const work = works[String(item.id)];
      const size = item.size === 'a5' ? 'a5' : item.size === 'a6' ? 'a6' : '';
      const qty = Number(item.qty);
      if (!work || !size || !Number.isInteger(qty) || qty < 1 || qty > 10) throw Object.assign(new Error('Invalid cart'), { status: 400 });
      return { id: item.id, title: work.title, size, qty, unit: size === 'a5' ? 2000 : 1200 };
    });
    const subtotal = items.reduce((sum, item) => sum + item.unit * item.qty, 0);
    const shipping = zone === 'lu' ? 300 : 500;
    const insurance = data.insured === true ? 799 : 0;
    const orderId = crypto.randomUUID();
    const order = { id: orderId, customer_name: name, customer_email: email, status: 'pending', currency: 'eur', subtotal_cents: subtotal, shipping_cents: shipping, insurance_cents: insurance, total_cents: subtotal + shipping + insurance, shipping_zone: zone, items, consent_at: new Date().toISOString() };
    await db('orders', { method: 'POST', body: order, prefer: 'return=minimal' });
    const lineItems = items.map(item => ({ price_data: { currency: 'eur', unit_amount: item.unit, product_data: { name: item.title + ' · Fine-Art-Print ' + item.size.toUpperCase() } }, quantity: item.qty }));
    lineItems.push({ price_data: { currency: 'eur', unit_amount: shipping, product_data: { name: zone === 'lu' ? 'Versand Luxemburg' : 'Versand EU' } }, quantity: 1 });
    if (insurance) lineItems.push({ price_data: { currency: 'eur', unit_amount: insurance, product_data: { name: 'Versandversicherung (optional)' } }, quantity: 1 });
    const params = new URLSearchParams();
    params.set('mode', 'payment'); params.set('success_url', process.env.PUBLIC_SITE_URL + '/order-success.html?session_id={CHECKOUT_SESSION_ID}');
    params.set('cancel_url', process.env.PUBLIC_SITE_URL + '/shop.html?checkout=cancelled');
    params.set('customer_email', email); params.set('client_reference_id', orderId);
    params.set('shipping_address_collection[allowed_countries][0]', zone === 'lu' ? 'LU' : 'DE');
    if (zone === 'eu') eu.filter(c => c !== 'LU' && c !== 'DE').forEach((c, i) => params.set('shipping_address_collection[allowed_countries][' + (i + 1) + ']', c));
    lineItems.forEach((item, i) => { params.set('line_items[' + i + '][price_data][currency]', item.price_data.currency); params.set('line_items[' + i + '][price_data][unit_amount]', String(item.price_data.unit_amount)); params.set('line_items[' + i + '][price_data][product_data][name]', item.price_data.product_data.name); params.set('line_items[' + i + '][quantity]', String(item.quantity)); });
    params.set('metadata[order_id]', orderId);
    params.set('allow_promotion_codes', 'true');
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const session = await response.json();
    if (!response.ok || !session.url) throw new Error('Stripe checkout session creation failed.');
    await db('orders?id=eq.' + encodeURIComponent(orderId), { method: 'PATCH', body: { stripe_session_id: session.id }, prefer: 'return=minimal' });
    return json(res, 200, { url: session.url });
  } catch (error) { return fail(res, error); }
};
