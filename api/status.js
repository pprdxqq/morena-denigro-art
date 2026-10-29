const { json, method } = require('./_lib');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  const database = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  return json(res, 200, {
    checkoutEnabled: database && Boolean(process.env.STRIPE_SECRET_KEY && process.env.PUBLIC_SITE_URL),
    inquiryEnabled: database,
    newsletterEnabled: database && Boolean(process.env.PUBLIC_SITE_URL),
    emailEnabled: Boolean(process.env.RESEND_API_KEY && process.env.MORENA_FROM_EMAIL),
    couponEnabled: process.env.MORENA_COUPON_ACTIVE === 'true'
  });
};
