const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const exists = file => assert.ok(fs.existsSync(path.join(__dirname, '..', file)), 'Missing required file: ' + file);
[
  'index.html','galerie.html','shop.html','artwork.html','artwork-detail.js','artist-dashboard.html',
  'artist-dashboard.js','lib/api-helpers.js','api/catalogue.js','api/checkout.js','api/contact.js',
  'api/newsletter.js','api/newsletter-confirm.js','api/newsletter-unsubscribe.js','api/events.js',
  'api/admin.js','api/webhook.js','api/order-status.js','api/status.js','newsletter-status.html',
  'newsletter-status.js','order-success.html','order-success.js',
  'supabase/migrations/20261029000000_morena_store.sql','BACKEND_SETUP.md'
].forEach(exists);
const checkout = read('api/checkout.js');
assert.match(checkout, /STRIPE_SECRET_KEY/);
assert.match(checkout, /SUPABASE_SERVICE_ROLE_KEY/);
assert.match(checkout, /allow_promotion_codes/);
const webhook = read('api/webhook.js');
assert.match(webhook, /timingSafeEqual/);
assert.match(webhook, /bodyParser: false/);
const admin = read('api/admin.js');
assert.match(admin, /admin\(req\)/);
assert.match(admin, /resource === 'artwork'/);
assert.match(read('api/newsletter.js'), /randomBytes/);
assert.match(read('api/newsletter-confirm.js'), /confirmation_token_hash/);
assert.match(read('api/newsletter-unsubscribe.js'), /unsubscribed_at/);
const helpers = read('lib/api-helpers.js');
assert.match(helpers, /timingSafeEqual/);
assert.match(helpers, /Cache-Control/);
const sql = read('supabase/migrations/20261029000000_morena_store.sql');
assert.match(sql, /enable row level security/);
assert.match(sql, /create table if not exists public.orders/);
assert.match(sql, /confirmation_email_sent_at/);
assert.match(sql, /confirmation_token_hash/);
const app = read('app.js');
assert.match(app, /fetch\('\/api\/checkout'/);
assert.match(app, /fetch\('\/api\/contact'/);
assert.match(app, /fetch\('\/api\/newsletter'/);
assert.doesNotMatch(app, /Dein Code: MORENA10/);
const imagePaths = [...app.matchAll(/img:'(bilder\/[^']+)'/g)].map(m => m[1]);
const missing = imagePaths.filter(image => !fs.existsSync(path.join(__dirname, '..', image)));
assert.deepEqual(missing, [], 'Catalogue image references missing from repository');
console.log('Smoke tests passed: website assets, catalogue images, server routes, admin auth, Stripe webhook verification, newsletter opt-in and RLS schema.');
