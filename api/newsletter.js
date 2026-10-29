const { json, method, body, db, sendEmail, escapeHtml, fail } = require('./_lib');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const data = await body(req);
    const email = String(data.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email) || data.consent !== true) return json(res, 400, { error: 'Bitte gib eine gültige E-Mail-Adresse ein und bestätige die Anmeldung.' });
    await db('newsletter_subscribers?on_conflict=email', { method: 'POST', body: { email, consent_at: new Date().toISOString(), source: String(data.source || 'website').slice(0, 80) }, prefer: 'resolution=merge-duplicates,return=minimal' });
    const greeting = escapeHtml(email);
    let sent = { sent: false };\n    try { sent = await sendEmail({ to: email, subject: 'Dein Atelier-Gutschein — Morena Denigro', html: '<p>Danke für deine Anmeldung zum Atelier-Newsletter.</p><p>Dein Code <strong>MORENA10</strong> ist für 10 % auf Fine-Art-Prints vorgesehen. Der Rabatt wird im Checkout nur angewendet, wenn der entsprechende Gutscheincode im Shop aktiviert ist.</p><p>Morena Denigro</p>', text: 'Danke für deine Anmeldung. Dein Code MORENA10 ist für 10 % auf Fine-Art-Prints vorgesehen. Der Rabatt wird im Checkout nur angewendet, wenn der entsprechende Gutscheincode im Shop aktiviert ist.\nMorena Denigro' });
    }); } catch (_) { sent = { sent: false }; }\n    return json(res, 200, { ok: true, emailConfirmationSent: sent.sent });
  } catch (error) { return fail(res, error); }
};
