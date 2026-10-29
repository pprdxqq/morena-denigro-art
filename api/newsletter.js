const crypto = require('node:crypto');
const { json, method, body, db, sendEmail, escapeHtml, fail } = require('./_lib');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const data = await body(req);
    const email = String(data.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email) || data.consent !== true) return json(res, 400, { error: 'Bitte gib eine gültige E-Mail-Adresse ein und bestätige die Anmeldung.' });
    const token = crypto.randomBytes(32).toString('hex');
    const unsubscribe = crypto.randomBytes(32).toString('hex');
    const hash = value => crypto.createHash('sha256').update(value).digest('hex');
    await db('newsletter_subscribers?on_conflict=email', {
      method: 'POST',
      body: { email, consent_at: new Date().toISOString(), confirmed_at: null, confirmation_token_hash: hash(token), unsubscribe_token_hash: hash(unsubscribe), unsubscribed_at: null, source: String(data.source || 'website').slice(0, 80) },
      prefer: 'resolution=merge-duplicates,return=minimal'
    });
    const base = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
    if (!base) return json(res, 200, { ok: true, confirmationEmailSent: false, code: 'PUBLIC_SITE_URL_MISSING' });\n    const confirmationUrl = base + '/newsletter-status.html?action=confirm&token=' + token;
    const unsubscribeUrl = base + '/newsletter-status.html?action=unsubscribe&token=' + unsubscribe;
    const couponReady = process.env.MORENA_COUPON_ACTIVE === 'true';
    let sent = { sent: false };
    try {
      sent = await sendEmail({
        to: email,
        subject: 'Bitte bestätige deine Atelier-Post — Morena Denigro',
        html: '<p>Danke für dein Interesse an Atelier-Post von Morena Denigro.</p><p>Bitte bestätige deine Anmeldung über diesen Link:</p><p><a href="'+confirmationUrl+'">Anmeldung bestätigen</a></p>' + (couponReady ? '<p>Dein Gutscheincode <strong>MORENA10</strong> ist für 10 % auf Fine-Art-Prints vorgesehen.</p>' : '<p>Ein möglicher 10%-Gutschein wird erst zugesendet, sobald er im Shop aktiviert ist.</p>') + '<p>Falls du dich nicht angemeldet hast, ignoriere diese Nachricht oder <a href="'+unsubscribeUrl+'">melde die Adresse ab</a>.</p>',
        text: 'Danke für dein Interesse an Atelier-Post. Bitte bestätige deine Anmeldung: '+confirmationUrl+'\n' + (couponReady ? 'Gutscheincode: MORENA10 (10 % auf Fine-Art-Prints).\n' : 'Ein möglicher 10%-Gutschein wird erst zugesendet, sobald er im Shop aktiviert ist.\n') + 'Abmelden: '+unsubscribeUrl
      });
    } catch (_) { sent = { sent: false }; }
    return json(res, 200, { ok: true, confirmationEmailSent: sent.sent });
  } catch (error) { return fail(res, error); }
};
