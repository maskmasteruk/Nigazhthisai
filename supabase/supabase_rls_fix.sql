-- ========================================================
-- NIGAZHTHISAI SUPABASE RLS POLICIES FIX V2
-- ========================================================
-- Run this script in your Supabase SQL Editor to refresh RLS policies.

-- 1. Drop existing policies to prevent conflicts
drop policy if exists "Public read routes" on public.routes;
drop policy if exists "Admins modify routes" on public.routes;
drop policy if exists "Public read buses" on public.buses;
drop policy if exists "Admins modify buses" on public.buses;
drop policy if exists "Public read trips" on public.trips;
drop policy if exists "Admins/Conductors modify trips" on public.trips;
drop policy if exists "Passengers view own tickets" on public.tickets;
drop policy if exists "Admins/Conductors view tickets" on public.tickets;
drop policy if exists "Create tickets" on public.tickets;
drop policy if exists "Read own bookings" on public.bookings;
drop policy if exists "Admins read all bookings" on public.bookings;
drop policy if exists "Create own bookings" on public.bookings;
drop policy if exists "Update own bookings" on public.bookings;
drop policy if exists "Create complaints" on public.complaints;
drop policy if exists "Admins manage complaints" on public.complaints;
drop policy if exists "Admins read and acknowledge alerts" on public.alerts;
drop policy if exists "Conductors create alerts" on public.alerts;
drop policy if exists "Passengers read own alerts" on public.alerts;
drop policy if exists "Read stops" on public.stops;
drop policy if exists "Admins manage stops" on public.stops;
drop policy if exists "Public read etm" on public.etm;
drop policy if exists "Admins modify etm" on public.etm;
drop policy if exists "Public read districts" on public.districts;
drop policy if exists "Admins modify districts" on public.districts;
drop policy if exists "Public read codes" on public.codes;
drop policy if exists "Admins modify codes" on public.codes;

-- Enable RLS on all tables
alter table public.districts enable row level security;
alter table public.codes enable row level security;
alter table public.routes enable row level security;
alter table public.etm enable row level security;
alter table public.buses enable row level security;
alter table public.trips enable row level security;
alter table public.tickets enable row level security;
alter table public.bookings enable row level security;
alter table public.complaints enable row level security;
alter table public.alerts enable row level security;
alter table public.stops enable row level security;

-- Create policies using JWT claims for roles (prevents profile table recursive lookups)
create policy "Public read districts" on public.districts for select using (true);
create policy "Admins modify districts" on public.districts for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

create policy "Public read codes" on public.codes for select using (true);
create policy "Admins modify codes" on public.codes for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

create policy "Public read routes" on public.routes for select using (true);
create policy "Admins modify routes" on public.routes for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

create policy "Public read buses" on public.buses for select using (true);
create policy "Admins modify buses" on public.buses for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

create policy "Public read trips" on public.trips for select using (true);
create policy "Admins/Conductors modify trips" on public.trips for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR')
);

create policy "Passengers view own tickets" on public.tickets for select using (user_id = auth.uid());
create policy "Admins/Conductors view tickets" on public.tickets for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR')
);
create policy "Create tickets" on public.tickets for insert with check (
  user_id = auth.uid() or (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR'
);

create policy "Read own bookings" on public.bookings for select using (user_id = auth.uid());
create policy "Create own bookings" on public.bookings for insert with check (user_id = auth.uid());
create policy "Update own bookings" on public.bookings for update using (user_id = auth.uid());
create policy "Admins read all bookings" on public.bookings for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

create policy "Create complaints" on public.complaints for insert with check (true);
create policy "Admins manage complaints" on public.complaints for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

create policy "Admins read and acknowledge alerts" on public.alerts for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'OPERATIONS')
);
create policy "Conductors create alerts" on public.alerts for insert with check (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR'
);
create policy "Passengers read own alerts" on public.alerts for select using (
  user_id = auth.uid() or user_id = '00000000-0000-0000-0000-000000000000'
);

create policy "Read stops" on public.stops for select using (true);
create policy "Admins manage stops" on public.stops for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

create policy "Public read etm" on public.etm for select using (true);
create policy "Admins modify etm" on public.etm for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);
