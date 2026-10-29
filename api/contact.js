const { json, method, body, db, sendEmail, escapeHtml, fail } = require('../lib/api-helpers');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const data = await body(req);
    const name = String(data.name || '').trim().slice(0, 120);
    const email = String(data.email || '').trim().toLowerCase();
    const topic = String(data.topic || 'Sonstiges').trim().slice(0, 120);
    const message = String(data.message || '').trim().slice(0, 5000);
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 3) return json(res, 400, { error: 'Bitte fülle Name, gültige E-Mail und Nachricht aus.' });
    const inquiry = (await db('inquiries', { method: 'POST', body: { name, email, topic, message, artwork_id: String(data.artworkId || '').slice(0, 80), status: 'new' } }))[0];
    const safeName = escapeHtml(name), safeEmail = escapeHtml(email), safeTopic = escapeHtml(topic), safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
    const artistPromise = sendEmail({ to: process.env.MORENA_CONTACT_EMAIL || 'morenadenigro@gmail.com', subject: 'Neue Website-Anfrage: ' + topic, html: '<h2>Neue Anfrage</h2><p><b>Name:</b> '+safeName+'</p><p><b>E-Mail:</b> '+safeEmail+'</p><p><b>Thema:</b> '+safeTopic+'</p><p>'+safeMessage+'</p>', text: 'Neue Anfrage\nName: '+name+'\nE-Mail: '+email+'\nThema: '+topic+'\n\n'+message });
    const customerPromise = sendEmail({ to: email, subject: 'Deine Nachricht an Morena Denigro', html: '<p>Hallo '+safeName+',</p><p>danke für deine Nachricht. Sie ist bei Morena eingegangen und wird persönlich beantwortet.</p><p>Deine Nachricht:</p><blockquote>'+safeMessage+'</blockquote><p>Morena Denigro</p>', text: 'Hallo '+name+',\n\ndanke für deine Nachricht. Sie ist bei Morena eingegangen und wird persönlich beantwortet.\n\n'+message+'\n\nMorena Denigro' });
    const [artistResult, customerResult] = await Promise.allSettled([artistPromise, customerPromise]);
    const artistSent = artistResult.status === 'fulfilled' && artistResult.value.sent;
    const customerSent = customerResult.status === 'fulfilled' && customerResult.value.sent;
    return json(res, 200, { ok: true, inquiryId: inquiry?.id, emailConfirmationSent: customerSent, artistNotificationSent: artistSent });
  } catch (error) { return fail(res, error); }
};
