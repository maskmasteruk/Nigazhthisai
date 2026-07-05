-- ==========================================
-- NIGAZHTHISAI SUPABASE RLS POLICIES FIX
-- ==========================================
-- Copy and run this in your Supabase SQL Editor to resolve the
-- "infinite recursion detected in policy for relation profiles" error.

-- 1. Drop existing policies to prevent conflicts


drop policy if exists "Allow read routes" on public.routes;
drop policy if exists "Admins modify routes" on public.routes;

drop policy if exists "Allow read buses" on public.buses;
drop policy if exists "Admins modify buses" on public.buses;
drop policy if exists "Conductors update bus position" on public.buses;

drop policy if exists "Allow read trips" on public.trips;
drop policy if exists "Admins and conductors modify trips" on public.trips;

drop policy if exists "Passengers read own tickets" on public.tickets;
drop policy if exists "Admins and conductors read all tickets" on public.tickets;
drop policy if exists "Book own tickets" on public.tickets;
drop policy if exists "Update ticket status" on public.tickets;

drop policy if exists "Read own bookings" on public.bookings;
drop policy if exists "Admins read all bookings" on public.bookings;
drop policy if exists "Create own bookings" on public.bookings;
drop policy if exists "Update own bookings" on public.bookings;

drop policy if exists "Allow read seat segments" on public.seat_segments;
drop policy if exists "Admins and conductors update seat segments" on public.seat_segments;

drop policy if exists "Create complaints" on public.complaints;
drop policy if exists "Admins manage complaints" on public.complaints;

drop policy if exists "Admins read and acknowledge alerts" on public.alerts;
drop policy if exists "Conductors create alerts" on public.alerts;

drop policy if exists "Read shops" on public.shops;
drop policy if exists "Admins manage shops" on public.shops;

drop policy if exists "Read stops" on public.stops;
drop policy if exists "Admins manage stops" on public.stops;


-- 2. Create optimized, non-recursive RLS policies using auth.jwt() metadata role verification



-- ROUTES
create policy "Allow read routes" on public.routes for select using (true);
create policy "Admins modify routes" on public.routes for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'OPERATIONS')
);

-- BUSES
create policy "Allow read buses" on public.buses for select using (true);
create policy "Admins modify buses" on public.buses for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'OPERATIONS')
);
create policy "Conductors update bus position" on public.buses for update using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR'
);

-- TRIPS
create policy "Allow read trips" on public.trips for select using (true);
create policy "Admins and conductors modify trips" on public.trips for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'OPERATIONS', 'CONDUCTOR')
);

-- TICKETS
create policy "Passengers read own tickets" on public.tickets for select using (user_id = auth.uid());
create policy "Admins and conductors read all tickets" on public.tickets for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR')
);
create policy "Book own tickets" on public.tickets for insert with check (
  user_id = auth.uid() or 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR'
);
create policy "Update ticket status" on public.tickets for update using (
  user_id = auth.uid() or 
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR')
);

-- BOOKINGS
create policy "Read own bookings" on public.bookings for select using (user_id = auth.uid());
create policy "Admins read all bookings" on public.bookings for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);
create policy "Create own bookings" on public.bookings for insert with check (user_id = auth.uid());
create policy "Update own bookings" on public.bookings for update using (user_id = auth.uid());

-- SEAT SEGMENTS
create policy "Allow read seat segments" on public.seat_segments for select using (true);
create policy "Admins and conductors update seat segments" on public.seat_segments for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR')
);

-- COMPLAINTS
create policy "Create complaints" on public.complaints for insert with check (true);
create policy "Admins manage complaints" on public.complaints for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

-- ALERTS
create policy "Admins read and acknowledge alerts" on public.alerts for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'OPERATIONS')
);
create policy "Conductors create alerts" on public.alerts for insert with check (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR'
);

-- SHOPS
create policy "Read shops" on public.shops for select using (true);
create policy "Admins manage shops" on public.shops for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

-- STOPS
create policy "Read stops" on public.stops for select using (true);
create policy "Admins manage stops" on public.stops for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);
