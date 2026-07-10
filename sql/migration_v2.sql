-- ========================================================
-- NIGAZHTHISAI DATABASE SCHEMA MIGRATION V2
-- ========================================================

-- 1. Drop views that depend on modified tables
drop view if exists public.view_active_trips cascade;
drop view if exists public.view_daily_revenue cascade;

-- 2. Drop unused tables
drop table if exists public.seat_segments cascade;
drop table if exists public.shops cascade;

-- 3. Create new master tables: districts, codes, transactions
create table if not exists public.districts (
  id serial primary key,
  name text not null unique,
  lat numeric not null,
  lon numeric not null
);

create table if not exists public.codes (
  code text primary key,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.transactions (
  id text primary key,
  amount numeric not null,
  status text not null default 'SUCCESS',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed districts
insert into public.districts (name, lat, lon) values
  ('Tiruppur', 11.1085, 77.3411),
  ('Chennai', 13.0827, 80.2707),
  ('Madurai', 9.9252, 78.1198),
  ('Coimbatore', 11.0168, 76.9558),
  ('Salem', 11.6643, 78.1460),
  ('Trichy', 10.7905, 78.7047),
  ('Erode', 11.3410, 77.7172)
on conflict (name) do nothing;

-- 4. Alter public.bookings Table
alter table public.bookings
  drop constraint if exists bookings_transaction_id_fkey,
  add constraint fk_bookings_transaction foreign key (transaction_id) references public.transactions(id) on delete set null;

-- 5. Alter public.routes Table
alter table public.routes drop column if exists code cascade;
alter table public.routes 
  add column from_code text references public.codes(code) on delete set null,
  add column to_code text references public.codes(code) on delete set null;

alter table public.routes 
  drop column if exists zone cascade;

alter table public.routes alter column stops set default '[]'::jsonb;

-- 6. Alter public.stops Table
alter table public.stops drop column if exists district cascade;
alter table public.stops add column district integer references public.districts(id) on delete set null;

-- 7. Alter public.buses Table
alter table public.buses 
  drop column if exists zone cascade,
  drop column if exists depot cascade,
  drop column if exists eta cascade,
  drop column if exists district cascade;

alter table public.buses 
  add column district integer references public.districts(id) on delete set null;

-- 8. Alter public.trips Table
alter table public.trips 
  rename column driver_name to driver_id;
alter table public.trips 
  rename column conductor_name to conductor_id;

alter table public.trips 
  drop column if exists start_time cascade,
  drop column if exists end_time cascade,
  drop column if exists occupancy cascade,
  drop column if exists district cascade,
  drop column if exists zone cascade,
  drop column if exists current_segment cascade,
  drop column if exists delay_minutes cascade,
  drop column if exists onboard_passengers cascade,
  drop column if exists occupancy_percent cascade,
  drop column if exists etm_status cascade;

alter table public.trips
  add column start_time timestamp with time zone,
  add column end_time timestamp with time zone,
  add column district integer references public.districts(id) on delete set null;

alter table public.trips rename column driver_start_lat to trip_start_lat;
alter table public.trips rename column driver_start_lng to trip_start_lng;
alter table public.trips rename column driver_end_lat to trip_end_lat;
alter table public.trips rename column driver_end_lng to trip_end_lng;

-- 9. Alter public.tickets Table
alter table public.tickets
  drop column if exists trip_id cascade,
  drop column if exists from_stop cascade,
  drop column if exists to_stop cascade,
  drop column if exists bus_name cascade,
  drop column if exists qr_payload cascade,
  drop column if exists fare cascade,
  drop column if exists origin_stop_id cascade,
  drop column if exists destination_stop_id cascade,
  drop column if exists channel cascade;

alter table public.tickets
  add column order_id text references public.razorpay_orders(id) on delete set null,
  add column origin_stop_id uuid references public.stops(id) on delete set null,
  add column destination_stop_id uuid references public.stops(id) on delete set null,
  add column channel text not null default 'passenger' check (channel in ('passenger', 'conductor'));

-- 10. Enable RLS on new tables
alter table public.districts enable row level security;
alter table public.codes enable row level security;
alter table public.transactions enable row level security;

create policy "Public read districts" on public.districts for select using (true);
create policy "Admins modify districts" on public.districts for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read codes" on public.codes for select using (true);
create policy "Admins modify codes" on public.codes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Read own transactions" on public.transactions for select using (true);
create policy "Admins modify transactions" on public.transactions for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));
