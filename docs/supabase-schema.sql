-- Peak Sport complete Supabase schema
-- Paste this into the Supabase SQL Editor and run it.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null default 'Peak Sport',
  category text not null default 'Conjuntos deportivos',
  subcategory text not null default 'General',
  price numeric(12,2) not null default 0,
  offer_price numeric(12,2),
  short_description text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  stock integer not null default 0,
  status text not null default 'Nuevo',
  image1 text,
  image2 text,
  image3 text,
  image4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  price_snapshot numeric(12,2) not null default 0,
  size text not null default '',
  color text not null default '',
  short_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id, size, color)
);

alter table public.cart_items add column if not exists size text default '' not null;
alter table public.cart_items add column if not exists color text default '' not null;
alter table public.cart_items add column if not exists short_description text default '' not null;
update public.cart_items set size = '' where size is null;
update public.cart_items set color = '' where color is null;
update public.cart_items set short_description = '' where short_description is null;
-- Deduplicate rows that were previously allowed by NULL semantics in the unique constraint
delete from public.cart_items a
using public.cart_items b
where a.id > b.id
  and a.user_id = b.user_id
  and a.product_id = b.product_id
  and coalesce(a.size, '') = coalesce(b.size, '')
  and coalesce(a.color, '') = coalesce(b.color, '');
alter table public.cart_items alter column size set default '';
alter table public.cart_items alter column color set default '';
alter table public.cart_items alter column short_description set default '';
alter table public.cart_items alter column size set not null;
alter table public.cart_items alter column color set not null;
alter table public.cart_items alter column short_description set not null;

-- Ensure legacy unique constraints do not block variant-aware cart items
alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_key;
alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_size_color_key;
create unique index if not exists cart_items_user_id_product_id_size_color_idx on public.cart_items(user_id, product_id, size, color);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  total numeric(12,2) not null default 0,
  shipping_address jsonb not null default '{}'::jsonb,
  payment_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  price_at_purchase numeric(12,2) not null default 0,
  size text not null default '',
  color text not null default '',
  short_description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.order_items add column if not exists size text default '' not null;
alter table public.order_items add column if not exists color text default '' not null;
alter table public.order_items add column if not exists short_description text default '' not null;
update public.order_items set size = '' where size is null;
update public.order_items set color = '' where color is null;
update public.order_items set short_description = '' where short_description is null;
alter table public.order_items alter column size set default '';
alter table public.order_items alter column color set default '';
alter table public.order_items alter column short_description set default '';
alter table public.order_items alter column size set not null;
alter table public.order_items alter column color set not null;
alter table public.order_items alter column short_description set not null;

create table if not exists public.order_histories (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  old_status text not null,
  new_status text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hero_config (
  config_key text primary key,
  hero_1_url text not null default '',
  hero_2_url text not null default '',
  hero_3_url text not null default '',
  left_card_images jsonb not null default '[]'::jsonb,
  right_card_images jsonb not null default '[]'::jsonb,
  carousel_enabled boolean not null default false,
  autoplay boolean not null default true,
  loop boolean not null default true,
  pause_on_hover boolean not null default true,
  transition_type text not null default 'fade',
  transition_interval integer not null default 5,
  transition_ms integer not null default 3000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null unique default 'default',
  store_name text not null default 'Peak Sport',
  support_email text not null default 'support@peak-sport.example',
  support_phone text not null default '+598 0000 0000',
  shipping_message text not null default 'Envíos rápidos en 24/48h y cambios fáciles.',
  currency text not null default 'UYU',
  categories jsonb not null default '[]'::jsonb,
  brands jsonb not null default '[]'::jsonb,
  featured_note text not null default 'Colecciones premium pensadas para entrenamiento y uso urbano.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.featured_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  image_url text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id text primary key,
  code text not null unique,
  label text not null,
  discount numeric(5,2) not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id text primary key,
  title text not null,
  subtitle text not null,
  image_url text not null,
  href text not null default '/catalog',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      avatar_url = excluded.avatar_url,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_hero_config_updated_at on public.hero_config;
create trigger set_hero_config_updated_at
before update on public.hero_config
for each row execute function public.set_updated_at();

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_coupons_updated_at on public.coupons;
create trigger set_coupons_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

drop trigger if exists set_banners_updated_at on public.banners;
create trigger set_banners_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.favorites enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_histories enable row level security;
alter table public.hero_config enable row level security;
alter table public.store_settings enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin_user());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin_user())
  with check (auth.uid() = id or public.is_admin_user());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin_user());

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories for select
  using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  using (true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Users can manage own favorites" on public.favorites;
create policy "Users can manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own cart" on public.cart_items;
create policy "Users can manage own cart"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id or public.is_admin_user())
  with check (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "Users can view own order items" on public.order_items;
create policy "Users can view own order items"
  on public.order_items for select
  using (
    public.is_admin_user()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create own order items" on public.order_items;
create policy "Users can create own order items"
  on public.order_items for insert
  with check (
    public.is_admin_user()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can read order histories" on public.order_histories;
create policy "Admins can read order histories"
  on public.order_histories for select
  using (public.is_admin_user());

drop policy if exists "Admins can insert order histories" on public.order_histories;
create policy "Admins can insert order histories"
  on public.order_histories for insert
  with check (public.is_admin_user());

drop policy if exists "Admins can update order histories" on public.order_histories;
create policy "Admins can update order histories"
  on public.order_histories for update
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Admins can delete order histories" on public.order_histories;
create policy "Admins can delete order histories"
  on public.order_histories for delete
  using (public.is_admin_user());

drop policy if exists "Admins can manage hero config" on public.hero_config;
create policy "Admins can manage hero config"
  on public.hero_config for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Public can read hero config" on public.hero_config;
create policy "Public can read hero config"
  on public.hero_config for select
  using (true);

drop policy if exists "Admins can manage store settings" on public.store_settings;
create policy "Admins can manage store settings"
  on public.store_settings for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Public can read active coupons" on public.coupons;
create policy "Public can read active coupons"
  on public.coupons for select
  using (active = true or public.is_admin_user());

drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
  on public.coupons for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners"
  on public.banners for select
  using (active = true or public.is_admin_user());

drop policy if exists "Admins can manage banners" on public.banners;
create policy "Admins can manage banners"
  on public.banners for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

insert into public.coupons (id, code, label, discount, active)
values
  ('peak10', 'PEAK10', '10% off', 10, true),
  ('welcome20', 'WELCOME20', '20% off', 20, true)
on conflict (id) do update
set code = excluded.code,
    label = excluded.label,
    discount = excluded.discount,
    active = excluded.active,
    updated_at = now();

insert into public.banners (id, title, subtitle, image_url, href, active)
values
  ('hero-collection', 'Nueva colección performance', 'Texturas premium y cortes pensados para moverse con intención.', '/peak.png', '/catalog', true)
on conflict (id) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    image_url = excluded.image_url,
    href = excluded.href,
    active = excluded.active,
    updated_at = now();

insert into public.store_settings (
  singleton_key,
  store_name,
  support_email,
  support_phone,
  shipping_message,
  currency,
  categories,
  brands,
  featured_note
)
values (
  'default',
  'Peak Sport',
  'support@peak-sport.example',
  '+598 0000 0000',
  'Envíos rápidos en 24/48h y cambios fáciles.',
  'UYU',
  '["Conjuntos deportivos","Buzos","Medias anti deslizante","Camperas"]'::jsonb,
  '["Peak Sport"]'::jsonb,
  'Colecciones premium pensadas para entrenamiento y uso urbano.'
)
on conflict (singleton_key) do update
set store_name = excluded.store_name,
    support_email = excluded.support_email,
    support_phone = excluded.support_phone,
    shipping_message = excluded.shipping_message,
    currency = excluded.currency,
    categories = excluded.categories,
    brands = excluded.brands,
    featured_note = excluded.featured_note,
    updated_at = now();

insert into public.hero_config (config_key, left_card_images, right_card_images, carousel_enabled, transition_ms)
values (
  'default',
  '["/peak.png","",""]'::jsonb,
  '["/peak.png","",""]'::jsonb,
  false,
  3000
)
on conflict (config_key) do update
set left_card_images = excluded.left_card_images,
    right_card_images = excluded.right_card_images,
    carousel_enabled = excluded.carousel_enabled,
    transition_ms = excluded.transition_ms,
    updated_at = now();
