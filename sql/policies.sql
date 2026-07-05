-- ========================================================
-- NIGAZHTHISAI ROW LEVEL SECURITY POLICIES
-- ========================================================

-- Enable RLS on all active tables
alter table public.routes enable row level security;
alter table public.buses enable row level security;
alter table public.trips enable row level security;
alter table public.tickets enable row level security;
alter table public.bookings enable row level security;
alter table public.complaints enable row level security;
alter table public.alerts enable row level security;
alter table public.stops enable row level security;
alter table public.audit_logs enable row level security;

-- Drop existing policies to avoid duplicates
drop policy if exists "Routes policies" on public.routes;
drop policy if exists "Buses policies" on public.buses;
drop policy if exists "Trips policies" on public.trips;
drop policy if exists "Tickets policies" on public.tickets;
drop policy if exists "Bookings policies" on public.bookings;
drop policy if exists "Public read routes" on public.routes;
drop policy if exists "Admins modify routes" on public.routes;
drop policy if exists "Public read buses" on public.buses;
drop policy if exists "Admins modify buses" on public.buses;
drop policy if exists "Public read trips" on public.trips;
drop policy if exists "Admins/Conductors modify trips" on public.trips;
drop policy if exists "Passengers view own tickets" on public.tickets;
drop policy if exists "Admins/Conductors view tickets" on public.tickets;
drop policy if exists "Create tickets" on public.tickets;
drop policy if exists "Public view alerts" on public.alerts;
drop policy if exists "Admins view audit logs" on public.audit_logs;
drop policy if exists "Public read stops" on public.stops;

-- 2. Transit Policies (Public Read)
create policy "Public read routes" on public.routes for select using (true);
create policy "Admins modify routes" on public.routes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read buses" on public.buses for select using (true);
create policy "Admins modify buses" on public.buses for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read trips" on public.trips for select using (true);
create policy "Admins/Conductors modify trips" on public.trips for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));

-- 3. Ticket Policies
create policy "Passengers view own tickets" on public.tickets for select using (user_id = auth.uid());
create policy "Admins/Conductors view tickets" on public.tickets for select using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));
create policy "Create tickets" on public.tickets for insert with check (user_id = auth.uid() or (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR');

-- 4. Alerts
create policy "Public view alerts" on public.alerts for select using (true);

-- 5. Stops
create policy "Public read stops" on public.stops for select using (true);

-- 6. Audit Logs (Protected)
create policy "Admins view audit logs" on public.audit_logs for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'MASTER_ADMIN');
