-- Ayam Potong Segar — Supabase schema
-- Run in Supabase SQL editor. Mode: tanpa login, anti-fiktif via kode unik + blacklist.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.daily_stock (
  date date primary key,
  stock_ekor int not null default 0,
  note text,
  updated_at timestamptz default now()
);

do $$ begin
  create type order_status as enum ('menunggu_pembayaran','diproses','dikirim','selesai','ditolak');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  address text not null,
  area text not null check (area in ('dalam','dekat')),
  delivery_method text not null,
  items jsonb not null,
  total int not null,
  unique_code int,
  notes text,
  payment_proof_url text,
  payment_type text check (payment_type in ('dp','full')) default 'full',
  status order_status not null default 'menunggu_pembayaran',
  created_at timestamptz default now(),
  scheduled_for date
);

alter table public.orders add column if not exists unique_code int;
alter table public.orders add column if not exists shipping jsonb;
alter table public.orders add column if not exists shipping_cost int default 0;
alter table public.orders add column if not exists tracking_id text;
alter table public.orders add column if not exists waybill_id text;

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_phone_idx on public.orders(phone);

-- BLACKLIST: nomor WA yang sudah pernah kirim bukti palsu / order fiktif
create table if not exists public.blacklist (
  phone text primary key,
  reason text,
  order_id uuid,
  created_at timestamptz default now()
);

-- Reject orders from blacklisted phones automatically
create or replace function public.reject_blacklisted_orders()
returns trigger as $$
begin
  if exists (select 1 from public.blacklist where phone = new.phone) then
    raise exception 'Nomor ini diblokir karena order fiktif sebelumnya. Hubungi admin.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_reject_blacklisted on public.orders;
create trigger trg_reject_blacklisted
  before insert on public.orders
  for each row execute function public.reject_blacklisted_orders();

-- Storage bucket untuk bukti transfer (public read agar admin & customer bisa lihat)
insert into storage.buckets (id, name, public) values ('payment-proofs','payment-proofs', true)
  on conflict (id) do update set public = true;

-- =============== ROW LEVEL SECURITY ===============
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.daily_stock enable row level security;
alter table public.blacklist enable row level security;

-- profiles (kalau nanti pakai auth)
drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ORDERS: siapa saja boleh insert (anon) — sesuai mode tanpa login
drop policy if exists "orders public insert" on public.orders;
create policy "orders public insert" on public.orders
  for insert with check (true);

-- ORDERS: hanya admin yang boleh read/update/delete
drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all" on public.orders
  for all using (coalesce(auth.jwt() ->> 'role','') = 'admin')
  with check (true);

-- STOCK: publik bisa baca (untuk tampil stok terbatas), admin bisa edit
drop policy if exists "stock read" on public.daily_stock;
create policy "stock read" on public.daily_stock for select using (true);

drop policy if exists "stock admin write" on public.daily_stock;
create policy "stock admin write" on public.daily_stock
  for all using (coalesce(auth.jwt() ->> 'role','') = 'admin')
  with check (true);

-- BLACKLIST: hanya admin
drop policy if exists "blacklist admin" on public.blacklist;
create policy "blacklist admin" on public.blacklist
  for all using (coalesce(auth.jwt() ->> 'role','') = 'admin')
  with check (true);

-- Storage policies: izinkan anon upload ke folder "public/"
drop policy if exists "payment proofs anon upload" on storage.objects;
create policy "payment proofs anon upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs');

drop policy if exists "payment proofs public read" on storage.objects;
create policy "payment proofs public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'payment-proofs');
