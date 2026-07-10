-- ========================================================
-- NIGAZHTHISAI ROW LEVEL SECURITY POLICIES V2
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
alter table public.etm enable row level security;
alter table public.districts enable row level security;
alter table public.codes enable row level security;
alter table public.transactions enable row level security;

-- Drop existing policies to avoid duplicates
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
drop policy if exists "Public read etm" on public.etm;
drop policy if exists "Admins modify etm" on public.etm;
drop policy if exists "Public read districts" on public.districts;
drop policy if exists "Admins modify districts" on public.districts;
drop policy if exists "Public read codes" on public.codes;
drop policy if exists "Admins modify codes" on public.codes;
drop policy if exists "Read own bookings" on public.bookings;
drop policy if exists "Admins read all bookings" on public.bookings;
drop policy if exists "Create own bookings" on public.bookings;
drop policy if exists "Update own bookings" on public.bookings;

-- Routes
create policy "Public read routes" on public.routes for select using (true);
create policy "Admins modify routes" on public.routes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

-- Buses
create policy "Public read buses" on public.buses for select using (true);
create policy "Admins modify buses" on public.buses for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

-- Trips
create policy "Public read trips" on public.trips for select using (true);
create policy "Admins/Conductors modify trips" on public.trips for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));

-- Tickets
create policy "Passengers view own tickets" on public.tickets for select using (user_id = auth.uid());
create policy "Admins/Conductors view tickets" on public.tickets for select using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));
create policy "Create tickets" on public.tickets for insert with check (user_id = auth.uid() or (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR');

-- Alerts
create policy "Public view alerts" on public.alerts for select using (true);

-- Stops
create policy "Public read stops" on public.stops for select using (true);

-- Audit Logs
create policy "Admins view audit logs" on public.audit_logs for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'MASTER_ADMIN');

-- ETM
create policy "Public read etm" on public.etm for select using (true);
create policy "Admins modify etm" on public.etm for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

-- Bookings
create policy "Read own bookings" on public.bookings for select using (user_id = auth.uid());
create policy "Admins read all bookings" on public.bookings for select using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));
create policy "Create own bookings" on public.bookings for insert with check (user_id = auth.uid());
create policy "Update own bookings" on public.bookings for update using (user_id = auth.uid());

-- Districts
create policy "Public read districts" on public.districts for select using (true);
create policy "Admins modify districts" on public.districts for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

-- Codes
create policy "Public read codes" on public.codes for select using (true);
create policy "Admins modify codes" on public.codes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));
