# Morena Denigro Art — production backend setup

The public website remains a static site. The `api/` routes add server-side checkout, inquiries, newsletter signups, Stripe payment confirmation, private artist tools and privacy-minimal conversion events. They fail closed and do not pretend a payment or message succeeded when the backend is missing.

## Required isolated services

Do **not** reuse another brand's database. Create a dedicated Supabase project for Morena Denigro Art in the correct owner organization, then run `supabase/migrations/20261029000000_morena_store.sql` in its SQL editor. The migration seeds only artwork facts already present in the catalogue. RLS is enabled and no public policies are granted.

Add these Vercel environment variables for **Production** (and Preview separately if needed):
- `SUPABASE_URL` — dedicated Morena project's API URL.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service-role key. Never prefix with `NEXT_PUBLIC_` and never expose to browser code.
- `ARTIST_ADMIN_TOKEN` — generate a random secret of at least 32 characters and share only with the artist.
- `STRIPE_SECRET_KEY` — Stripe secret API key.
- `STRIPE_WEBHOOK_SECRET` — endpoint signing secret for `/api/webhook`.
- `PUBLIC_SITE_URL` — canonical HTTPS URL, e.g. `https://morena-denigro-art.vercel.app`.
- `RESEND_API_KEY` and `MORENA_FROM_EMAIL` — optional until verified email sending is ready. Newsletter signups use double opt-in and include an unsubscribe link.\n- `MORENA_COUPON_ACTIVE=true` — set only after the `MORENA10` promotion code is actually created and tested in Stripe; otherwise the newsletter does not promise a redeemable code. `MORENA_FROM_EMAIL` must be a verified sender/domain in Resend.
- `MORENA_CONTACT_EMAIL` — optional, defaults to the contact address already published on the site.

## Stripe configuration

Create a Stripe webhook endpoint at `https://morena-denigro-art.vercel.app/api/webhook` subscribed to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Add its signing secret as `STRIPE_WEBHOOK_SECRET`. Checkout currently supports the print SKUs already listed on the website (A6 €12, A5 €20), Luxembourg shipping (€3), EU shipping (€5), and optional insurance (€7.99). Original paintings remain enquiry-only. Create and test the `MORENA10` promotion code in Stripe if the newsletter discount should be redeemable at checkout; Checkout permits promotion codes but does not create the discount automatically. Only then set `MORENA_COUPON_ACTIVE=true`.

## Private artist dashboard

Open `/artist-dashboard.html`, enter the `ARTIST_ADMIN_TOKEN` value, and keep it private. The token is sent only to `/api/admin` over HTTPS and is compared server-side. Rotate it in Vercel if it is ever exposed. Do not share a dashboard URL plus token publicly.

## Operational launch checklist

1. Complete the service setup above and deploy the migration.
2. Configure Vercel environment variables and redeploy production.
3. Configure the Stripe webhook and run Stripe test-mode purchases before enabling live payments.
4. Verify a customer confirmation email and an artist notification email using a verified sender.
5. Have the artist review legal identity, privacy, returns, shipping and discount terms before taking live orders.
6. Keep Stripe in test mode until all end-to-end tests pass.

Until these secrets and services are configured, API calls return a clear `503` and the site must not claim checkout, email delivery or server-backed admin storage is active.
