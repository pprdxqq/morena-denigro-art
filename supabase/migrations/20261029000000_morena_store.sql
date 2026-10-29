-- Morena Denigro Art store schema. Run only in a dedicated Morena Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.artworks (
  id text primary key,
  title text not null,
  year text not null,
  medium text not null,
  series text not null,
  image_path text not null,
  price_eur numeric(10,2),
  status text not null default 'Verfügbarkeit auf Anfrage',
  available boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  story text not null default '',
  updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_email text not null,
  status text not null default 'pending' check (status in ('pending','paid','processing','shipped','refunded','cancelled')),
  currency text not null default 'eur',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  insurance_cents integer not null default 0 check (insurance_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  shipping_zone text not null check (shipping_zone in ('lu','eu')),
  items jsonb not null,
  consent_at timestamptz not null,
  stripe_session_id text unique,
  stripe_customer_id text,
  shipping_address jsonb,
  confirmation_email_sent_at timestamptz,
  paid_at timestamptz
);
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  artwork_id text,
  status text not null default 'new' check (status in ('new','in_progress','answered','archived'))
);
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  consent_at timestamptz not null,
  confirmed_at timestamptz,
  confirmation_token_hash text,
  unsubscribe_token_hash text,
  unsubscribed_at timestamptz,
  source text not null default 'website'
);
create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_name text not null,
  artwork_id text,
  page_path text not null default '/'
);

alter table public.artworks enable row level security;
alter table public.orders enable row level security;
alter table public.inquiries enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.site_events enable row level security;
-- No anon/authenticated policies: all writes and admin reads go through the server-only service-role API.

insert into public.artworks (id,title,year,medium,series,price_eur,status,available,stock,image_path,story) values
('daikoku-1','Daikoku PA 1','2025','Öl auf Leinwand · 65 × 65 cm','daikoku',null,'Nicht verkäuflich',false,0,'bilder/daikoku-1.jpg','Ein flüchtiger Blick auf Daikoku PA: Nacht, Architektur und Reflexion verschmelzen in der glänzenden Oberfläche.'),
('daikoku-2','Daikoku PA 2','2025','Öl auf Leinwand · 65 × 65 cm','daikoku',850,'Original verfügbar',true,1,'bilder/daikoku-2.jpg','Aus derselben Serie, aber ein anderer Augenblick: Die Linien des Autos halten die Bewegung fest, während das Bild selbst ganz still bleibt.'),
('daikoku-3','Daikoku PA 3','2025','Öl auf Leinwand · 65 × 65 cm','daikoku',null,'Verkauft',false,0,'bilder/daikoku-3.jpg','Die dunkle Karosserie wird zur Bühne für einzelne Lichtspuren; jeder Reflex wirkt wie eine kleine Erinnerung an die Fahrt.'),
('ginza-1','Ginza 1','2025','Buntstift auf Papier · 15 × 15 cm','ginza',350,'Original verfügbar',true,1,'bilder/ginza-1.jpg','Im dichten Rhythmus Tokios wird die Oberfläche des Autos zum Spiegel der Stadt.'),
('ginza-2','Ginza 2','2025','Öl auf Leinwand · 65 × 65 cm','ginza',600,'Original verfügbar',true,1,'bilder/ginza-2.jpg','Warme Farbtöne und klare Konturen übersetzen eine urbane Begegnung in einen stillen Bildmoment.'),
('ginza-3','Ginza 3','2026','Öl auf Leinwand · 65 × 65 cm','ginza',950,'Original verfügbar',true,1,'bilder/ginza-3.jpg','Ein Ausschnitt aus Ginza, gesehen durch Licht, Farbe und die vielen Schichten einer Spiegelung.'),
('singen-1','Singen 1','2026','Öl auf Leinwand · 65 × 65 cm','singen',950,'Original verfügbar',true,1,'bilder/singen-1.jpg','Die Serie Singen richtet den Blick auf Alltagsmomente, in denen sich Umgebung und Lack begegnen.'),
('singen-2','Singen 2','2026','Öl auf Leinwand · 65 × 65 cm','singen',850,'Original verfügbar',true,1,'bilder/singen-2.jpg','Ein Bild über Geduld: Schicht für Schicht entsteht die Reflexion auf der Leinwand.'),
('singen-3','Singen 3','2026','Öl auf Leinwand · 65 × 65 cm','singen',950,'Original verfügbar',true,1,'bilder/singen-3.jpg','Zwischen Bewegung und Ruhe zeigt sich, wie eine Oberfläche Stimmung tragen kann.'),
('dessau-1','Dessau-Roßlau 1','2026','Öl auf Leinwand · 65 × 65 cm','dessau',950,'Original verfügbar',true,1,'bilder/dessau-1.jpg','Dessau-Roßlau bildet den Ausgangspunkt; im Zentrum steht das Licht auf der Karosserie.')
on conflict (id) do nothing;
