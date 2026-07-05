-- ========================================================
-- NIGAZHTHISAI COMBINED MONOLITHIC DATABASE SETUP SCRIPT
-- ========================================================

-- ========================================================
-- 1. MASTER SCHEMA (FROM master_schema.sql)
-- ========================================================

-- Enable required extensions
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;


-- ROUTES TABLE
create table if not exists public.routes (
  id serial primary key,
  name text not null,
  code text not null unique,
  num_stops integer default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  district text,
  zone text,
  stops jsonb default '[]'::jsonb,
  day_schedules jsonb default '{}'::jsonb,
  special_overrides jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BUSES TABLE
create table if not exists public.buses (
  id text primary key,
  registration_number text not null unique,
  route_id integer references public.routes(id) on delete set null,
  capacity integer not null default 50,
  current_lat numeric not null default 11.1085,
  current_lng numeric not null default 77.3411,
  occupancy text not null default 'low' check (occupancy in ('low', 'medium', 'high')),
  current_occupancy integer not null default 0,
  fare numeric not null default 14.0,
  eta integer not null default 5,
  depot text,
  district text,
  zone text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'MAINTENANCE')),
  model text,
  type text not null default 'NON-AC' check (type in ('AC', 'NON-AC')),
  etm_id text,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRIPS TABLE
create table if not exists public.trips (
  id text primary key,
  route_id integer references public.routes(id) on delete cascade,
  bus_id text references public.buses(id) on delete set null,
  driver_name text,
  conductor_name text,
  start_time text,
  end_time text,
  actual_start_time text,
  status text not null default 'PLANNED' check (status in ('PLANNED', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED')),
  occupancy integer not null default 0,
  district text,
  zone text,
  current_segment text,
  last_gps_time timestamp with time zone,
  delay_minutes integer not null default 0,
  onboard_passengers integer not null default 0,
  occupancy_percent integer not null default 0,
  etm_status text not null default 'OFFLINE' check (etm_status in ('ONLINE', 'OFFLINE')),
  driver_ended boolean default false,
  conductor_ended boolean default false,
  driver_start_lat numeric,
  driver_start_lng numeric,
  driver_end_lat numeric,
  driver_end_lng numeric,
  gps_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TICKETS TABLE
create table if not exists public.tickets (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  trip_id text references public.trips(id) on delete cascade,
  bus_id text references public.buses(id) on delete set null,
  bus_name text,
  origin_stop_id text,
  destination_stop_id text,
  from_stop text not null,
  to_stop text not null,
  channel text not null default 'APP' check (channel in ('APP', 'ETM')),
  status text not null default 'CONFIRMED' check (status in ('PENDING_PAYMENT', 'CONFIRMED', 'BOARDED', 'EXPIRED', 'CANCELLED')),
  fare numeric not null,
  seats integer not null default 1,
  qr_payload text,
  date text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BOOKINGS TABLE
create table if not exists public.bookings (
  id text primary key,
  bus_id text references public.buses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  from_stop text not null,
  to_stop text not null,
  seats integer not null default 1,
  amount numeric not null,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMPLAINTS TABLE
create table if not exists public.complaints (
  id serial primary key,
  bus_id text references public.buses(id) on delete cascade,
  type text not null,
  description text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ALERTS TABLE
create table if not exists public.alerts (
  id serial primary key,
  type text not null check (type in ('GPS_OFFLINE', 'HIGH_LOAD', 'LATE_TRIP', 'IDLE_BUS', 'SOS')),
  message text not null,
  bus_id text references public.buses(id) on delete cascade,
  idle_duration integer,
  location jsonb,
  status text not null default 'PENDING' check (status in ('PENDING', 'RESOLVED', 'ACKNOWLEDGED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STOPS TABLE
create table if not exists public.stops (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  district text,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AUDIT LOGS TABLE
create table if not exists public.audit_logs (
  id serial primary key,
  user_uuid uuid,
  action text not null,
  table_name text,
  record_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ========================================================
-- 2. DATABASE VIEWS (FROM views.sql)
-- ========================================================

-- View of Active Trips with details
create or replace view public.view_active_trips as
select 
  t.id as trip_id,
  t.status as trip_status,
  t.start_time,
  t.driver_name,
  t.conductor_name,
  t.delay_minutes,
  t.district,
  t.zone,
  r.code as route_code,
  r.name as route_name,
  r.stops as route_stops,
  b.id as bus_id,
  b.registration_number as bus_reg_no,
  b.type as bus_type,
  b.current_occupancy,
  b.capacity as bus_capacity,
  b.fare as ticket_fare
from public.trips t
left join public.routes r on t.route_id = r.id
left join public.buses b on t.bus_id = b.id
where t.status = 'RUNNING';

-- View of Daily Ticket Collection
create or replace view public.view_daily_revenue as
select 
  date,
  channel,
  count(id) as total_tickets_sold,
  sum(seats) as total_passengers,
  sum(fare) as total_revenue
from public.tickets
group by date, channel;


-- ========================================================
-- 3. ROW LEVEL SECURITY POLICIES (FROM policies.sql)
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

-- Transit Policies (Public Read)
create policy "Public read routes" on public.routes for select using (true);
create policy "Admins modify routes" on public.routes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read buses" on public.buses for select using (true);
create policy "Admins modify buses" on public.buses for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read trips" on public.trips for select using (true);
create policy "Admins/Conductors modify trips" on public.trips for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));

-- Ticket Policies
create policy "Passengers view own tickets" on public.tickets for select using (user_id = auth.uid());
create policy "Admins/Conductors view tickets" on public.tickets for select using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));
create policy "Create tickets" on public.tickets for insert with check (user_id = auth.uid() or (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR');

-- Alerts
create policy "Public view alerts" on public.alerts for select using (true);

-- Stops
create policy "Public read stops" on public.stops for select using (true);

-- Audit Logs (Protected)
create policy "Admins view audit logs" on public.audit_logs for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'MASTER_ADMIN');


-- ========================================================
-- 4. PERFORMANCE INDEXES (FROM indexes.sql)
-- ========================================================

-- Buses index
create index if not exists idx_buses_route_id on public.buses(route_id);
create index if not exists idx_buses_district on public.buses(district);

-- Trips index
create index if not exists idx_trips_bus_id on public.trips(bus_id);
create index if not exists idx_trips_route_id on public.trips(route_id);
create index if not exists idx_trips_district on public.trips(district);
create index if not exists idx_trips_status on public.trips(status);

-- Tickets index
create index if not exists idx_tickets_user_id on public.tickets(user_id);
create index if not exists idx_tickets_trip_id on public.tickets(trip_id);
create index if not exists idx_tickets_date on public.tickets(date);

-- Bookings index
create index if not exists idx_bookings_user_id on public.bookings(user_id);

-- Audit log index
create index if not exists idx_audit_logs_user_uuid on public.audit_logs(user_uuid);
create index if not exists idx_audit_logs_action on public.audit_logs(action);


-- ========================================================
-- 5. COMBINED DATABASE RPCs (FROM functions.sql)
-- ========================================================

-- 1. rpc_get_profile_by_id: Fetch the profile of a user by their user id
create or replace function public.rpc_get_profile_by_id(user_uuid uuid)
returns table (
  id uuid,
  email varchar(255),
  name text,
  phone text,
  role text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'name', 'User'),
    coalesce(u.raw_user_meta_data->>'phone', ''),
    coalesce(u.raw_user_meta_data->>'role', 'PASSENGER'),
    coalesce(u.raw_user_meta_data->>'status', 'ACTIVE'),
    u.created_at,
    u.updated_at
  from auth.users u
  where u.id = user_uuid;
end;
$$;

-- 2. rpc_get_all_trips: Get all trips filtered by district/zone
create or replace function public.rpc_get_all_trips(district_filter text default null, zone_filter text default null)
returns setof public.trips
language plpgsql
security definer
as $$
begin
  return query
  select * from public.trips
  where (district_filter is null or district_filter = 'All' or district = district_filter)
    and (zone_filter is null or zone_filter = 'All' or zone = zone_filter);
end;
$$;

-- 3. rpc_get_all_tickets: Get all tickets filtered by bus name
create or replace function public.rpc_get_all_tickets(bus_name_filter text default null)
returns setof public.tickets
language plpgsql
security definer
as $$
begin
  return query
  select * from public.tickets
  where (bus_name_filter is null or bus_name_filter = 'All' or bus_name = bus_name_filter);
end;
$$;

-- 4. rpc_get_pending_alerts: Get alerts that are pending
create or replace function public.rpc_get_pending_alerts()
returns setof public.alerts
language plpgsql
security definer
as $$
begin
  return query
  select * from public.alerts where status = 'PENDING';
end;
$$;

-- 5. rpc_get_routes: Fetch all routes
create or replace function public.rpc_get_routes()
returns setof public.routes
language plpgsql
security definer
as $$
begin
  return query
  select * from public.routes order by id asc;
end;
$$;

-- 6. rpc_get_buses: Fetch all buses
create or replace function public.rpc_get_buses()
returns setof public.buses
language plpgsql
security definer
as $$
begin
  return query
  select * from public.buses order by id asc;
end;
$$;

-- 7. rpc_get_trips_detailed: Get detailed trips for dashboard/conductor
create or replace function public.rpc_get_trips_detailed()
returns table (
  id text,
  route_id integer,
  bus_id text,
  driver_name text,
  conductor_name text,
  start_time text,
  end_time text,
  status text,
  occupancy integer,
  district text,
  zone text,
  current_segment text,
  last_gps_time timestamp with time zone,
  delay_minutes integer,
  onboard_passengers integer,
  occupancy_percent integer,
  etm_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  route_name text,
  bus_no text,
  stops jsonb
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.route_id,
    t.bus_id,
    t.driver_name,
    t.conductor_name,
    t.start_time,
    t.end_time,
    t.status,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.trip_id = t.id and tk.status in ('CONFIRMED', 'BOARDED')), 0) as occupancy,
    t.district,
    t.zone,
    t.current_segment,
    t.last_gps_time,
    t.delay_minutes,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.trip_id = t.id and tk.status in ('CONFIRMED', 'BOARDED')), 0) as onboard_passengers,
    coalesce(((select coalesce(sum(tk.seats), 0) from public.tickets tk where tk.trip_id = t.id and tk.status in ('CONFIRMED', 'BOARDED')) * 100) / nullif(b.capacity, 0), 0)::integer as occupancy_percent,
    t.etm_status,
    t.created_at,
    t.updated_at,
    coalesce(r.name, 'Unknown Route') as route_name,
    coalesce(b.registration_number, 'Unknown Bus') as bus_no,
    coalesce(r.stops, '[]'::jsonb) as stops
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  order by t.created_at desc;
end;
$$;

-- 8. rpc_get_live_trips_detailed: Get detailed live trips
create or replace function public.rpc_get_live_trips_detailed()
returns table (
  id text,
  bus_id text,
  bus_no text,
  route_name text,
  current_lat numeric,
  current_lng numeric,
  speed integer,
  occupancy integer,
  status text,
  is_idle boolean,
  idle_minutes integer,
  district text,
  zone text,
  delay_minutes integer,
  occupancy_percent integer,
  eta integer,
  capacity integer,
  current_occupancy integer,
  fare numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.bus_id,
    coalesce(b.registration_number, t.bus_id) as bus_no,
    coalesce(r.name, 'Unknown Route') as route_name,
    coalesce(b.current_lat, 11.1085) as current_lat,
    coalesce(b.current_lng, 77.3411) as current_lng,
    case when t.status = 'RUNNING' then 40 else 0 end as speed,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.trip_id = t.id and tk.status in ('CONFIRMED', 'BOARDED')), 0) as occupancy,
    case when t.delay_minutes > 10 then 'DELAYED'::text else 'ON_TIME'::text end as status,
    false as is_idle,
    0 as idle_minutes,
    t.district,
    t.zone,
    t.delay_minutes,
    coalesce(((select coalesce(sum(tk.seats), 0) from public.tickets tk where tk.trip_id = t.id and tk.status in ('CONFIRMED', 'BOARDED')) * 100) / nullif(b.capacity, 0), 0)::integer as occupancy_percent,
    b.eta,
    b.capacity,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.trip_id = t.id and tk.status in ('CONFIRMED', 'BOARDED')), 0) as current_occupancy,
    b.fare
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  where t.status = 'RUNNING';
end;
$$;

-- 9. rpc_acknowledge_alert: Acknowledge operational alert
create or replace function public.rpc_acknowledge_alert(alert_id integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.alerts
  set status = 'ACKNOWLEDGED'
  where id = alert_id;
end;
$$;

-- 10. rpc_get_users: Get all users
create or replace function public.rpc_get_users()
returns table (
  id uuid,
  email varchar(255),
  name text,
  phone text,
  role text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'name', 'User'),
    coalesce(u.raw_user_meta_data->>'phone', ''),
    coalesce(u.raw_user_meta_data->>'role', 'PASSENGER'),
    coalesce(u.raw_user_meta_data->>'status', 'ACTIVE'),
    u.created_at,
    u.updated_at
  from auth.users u
  order by u.created_at desc;
end;
$$;

-- 10b. rpc_get_total_passengers: Get total passenger count
create or replace function public.rpc_get_total_passengers()
returns integer
language plpgsql
security definer
as $$
declare
  cnt integer;
begin
  select count(*)::integer into cnt
  from auth.users
  where coalesce(raw_user_meta_data->>'role', 'PASSENGER') = 'PASSENGER';
  return cnt;
end;
$$;

-- 11. rpc_get_stops: Get all stops
create or replace function public.rpc_get_stops()
returns setof public.stops
language plpgsql
security definer
as $$
begin
  return query
  select * from public.stops order by name asc;
end;
$$;

-- 13. rpc_add_bus: Add a new bus
create or replace function public.rpc_add_bus(bus_id text, reg_no text, route_id integer, capacity integer, fare numeric, district text, zone text, bus_status text default 'STOPPED')
returns public.buses
language plpgsql
security definer
as $$
declare
  inserted_bus public.buses;
begin
  insert into public.buses (id, registration_number, route_id, capacity, fare, district, zone, status)
  values (bus_id, reg_no, route_id, capacity, fare, district, zone, bus_status)
  returning * into inserted_bus;
  return inserted_bus;
end;
$$;

-- 14. rpc_add_route: Add a new route
create or replace function public.rpc_add_route(code text, name text, stops jsonb)
returns public.routes
language plpgsql
security definer
as $$
declare
  inserted_route public.routes;
begin
  insert into public.routes (code, name, stops)
  values (code, name, stops)
  returning * into inserted_route;
  return inserted_route;
end;
$$;

-- 15. rpc_add_trip: Add a new trip
create or replace function public.rpc_add_trip(trip_id text, route_id integer, bus_id text, driver_name text, conductor_name text, status text, start_time text, district text, zone text)
returns public.trips
language plpgsql
security definer
as $$
declare
  inserted_trip public.trips;
begin
  insert into public.trips (id, route_id, bus_id, driver_name, conductor_name, status, start_time, district, zone)
  values (trip_id, route_id, bus_id, driver_name, conductor_name, status, start_time, district, zone)
  returning * into inserted_trip;
  return inserted_trip;
end;
$$;

-- 17. rpc_update_bus: Update existing bus details
create or replace function public.rpc_update_bus(bus_id text, reg_no text, route_id integer, capacity integer, fare numeric, district text, zone text, bus_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.buses
  set 
    registration_number = rpc_update_bus.reg_no,
    route_id = rpc_update_bus.route_id,
    capacity = rpc_update_bus.capacity,
    fare = rpc_update_bus.fare,
    district = rpc_update_bus.district,
    zone = rpc_update_bus.zone,
    status = rpc_update_bus.bus_status
  where id = rpc_update_bus.bus_id;
end;
$$;

-- 18. rpc_update_route: Update existing route details
create or replace function public.rpc_update_route(route_id integer, code text, name text, stops jsonb)
returns void
language plpgsql
security definer
as $$
begin
  update public.routes
  set 
    code = rpc_update_route.code,
    name = rpc_update_route.name,
    stops = rpc_update_route.stops
  where id = rpc_update_route.route_id;
end;
$$;

-- 19. rpc_update_trip: Update existing trip details
create or replace function public.rpc_update_trip(trip_id text, driver_name text, conductor_name text, trip_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    driver_name = rpc_update_trip.driver_name,
    conductor_name = rpc_update_trip.conductor_name,
    status = rpc_update_trip.trip_status
  where id = rpc_update_trip.trip_id;
end;
$$;

-- 21. rpc_delete_bus: Delete bus
create or replace function public.rpc_delete_bus(bus_id text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.buses where id = bus_id;
end;
$$;

-- 22. rpc_delete_route: Delete route
create or replace function public.rpc_delete_route(route_id integer)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.routes where id = route_id;
end;
$$;

-- 23. rpc_delete_trip: Delete trip
create or replace function public.rpc_delete_trip(trip_id text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.trips where id = trip_id;
end;
$$;

-- 25. rpc_start_trip: Start running a trip
create or replace function public.rpc_start_trip(trip_id text, start_time text)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set status = 'RUNNING', actual_start_time = start_time
  where id = trip_id;
end;
$$;

-- 26. rpc_get_trip_detailed_by_id: Fetch detailed single trip details
create or replace function public.rpc_get_trip_detailed_by_id(trip_id text)
returns table (
  id text,
  route_id integer,
  bus_id text,
  driver_name text,
  conductor_name text,
  start_time text,
  status text,
  district text,
  zone text,
  route_name text,
  stops jsonb,
  bus_fare numeric,
  capacity integer
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.route_id,
    t.bus_id,
    t.driver_name,
    t.conductor_name,
    t.start_time,
    t.status,
    t.district,
    t.zone,
    coalesce(r.name, 'Unknown Route') as route_name,
    coalesce(r.stops, '[]'::jsonb) as stops,
    coalesce(b.fare, 14.0) as bus_fare,
    coalesce(b.capacity, 50) as capacity
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  where t.id = trip_id;
end;
$$;

-- 27. rpc_insert_ticket: Book or issue a ticket
create or replace function public.rpc_insert_ticket(
  ticket_id text,
  user_id uuid,
  trip_id text,
  bus_id text,
  bus_name text,
  from_stop text,
  to_stop text,
  seats integer,
  fare numeric,
  channel text,
  status text,
  qr_payload text,
  ticket_date text
)
returns public.tickets
language plpgsql
security definer
as $$
declare
  inserted_ticket public.tickets;
begin
  insert into public.tickets (id, user_id, trip_id, bus_id, bus_name, from_stop, to_stop, seats, fare, channel, status, qr_payload, date)
  values (ticket_id, user_id, trip_id, bus_id, bus_name, from_stop, to_stop, seats, fare, channel, status, qr_payload, ticket_date)
  returning * into inserted_ticket;
  return inserted_ticket;
end;
$$;

-- 28. rpc_get_ticket_detailed_by_id: Fetch detailed passenger ticket
create or replace function public.rpc_get_ticket_detailed_by_id(ticket_id text)
returns table (
  id text,
  user_id uuid,
  trip_id text,
  bus_id text,
  bus_name text,
  from_stop text,
  to_stop text,
  seats integer,
  fare numeric,
  channel text,
  status text,
  qr_payload text,
  date text,
  passenger_name text
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.user_id,
    t.trip_id,
    t.bus_id,
    t.bus_name,
    t.from_stop,
    t.to_stop,
    t.seats,
    t.fare,
    t.channel,
    t.status,
    t.qr_payload,
    t.date,
    coalesce(u.raw_user_meta_data->>'name', 'Passenger') as passenger_name
  from public.tickets t
  left join auth.users u on t.user_id = u.id
  where t.id = ticket_id;
end;
$$;

-- 29. rpc_update_ticket_status: Update status of ticket
create or replace function public.rpc_update_ticket_status(ticket_id text, ticket_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.tickets
  set status = ticket_status
  where id = ticket_id;
end;
$$;

-- 30. rpc_update_gps: Update active trip bus location
create or replace function public.rpc_update_gps(trip_id text, lat numeric, lng numeric)
returns void
language plpgsql
security definer
as $$
declare
  v_bus_id text;
begin
  select bus_id into v_bus_id from public.trips where id = trip_id;
  
  if v_bus_id is not null then
    update public.buses
    set 
      current_lat = lat,
      current_lng = lng,
      last_updated = now()
    where id = v_bus_id;
  end if;
  
  update public.trips
  set last_gps_time = now()
  where id = trip_id;
end;
$$;

-- 31. rpc_end_trip: Mark running trip as completed (Conductor)
create or replace function public.rpc_end_trip(trip_id text)
returns void
language plpgsql
security definer
as $$
declare
  v_driver_ended boolean;
begin
  select coalesce(driver_ended, false) into v_driver_ended
  from public.trips where id = trip_id;

  update public.trips
  set 
    conductor_ended = true,
    status = case when v_driver_ended = true then 'COMPLETED'::text else status end
  where id = trip_id;
end;
$$;

-- 31a. rpc_driver_start_trip: Start running a trip from driver's device
create or replace function public.rpc_driver_start_trip(
  p_trip_id text,
  p_lat numeric,
  p_lng numeric
)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    status = 'RUNNING',
    actual_start_time = to_char(now(), 'HH:MI AM'),
    driver_start_lat = p_lat,
    driver_start_lng = p_lng
  where id = p_trip_id;
  
  update public.buses
  set 
    current_lat = p_lat,
    current_lng = p_lng,
    last_updated = now()
  where id = (select bus_id from public.trips where id = p_trip_id);
end;
$$;

-- 31b. rpc_driver_end_trip: End trip and verify GPS arrived at final stop
create or replace function public.rpc_driver_end_trip(
  p_trip_id text,
  p_lat numeric,
  p_lng numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_route_id integer;
  v_stops jsonb;
  v_final_stop_name text;
  v_final_lat numeric;
  v_final_lng numeric;
  v_dist numeric;
  v_gps_verified boolean := false;
  v_conductor_ended boolean;
  v_result jsonb;
begin
  -- Get route and conductor status
  select route_id, coalesce(conductor_ended, false) into v_route_id, v_conductor_ended
  from public.trips where id = p_trip_id;

  -- Verify GPS reached final stop if route exists
  if v_route_id is not null then
    select stops into v_stops from public.routes where id = v_route_id;
    
    if jsonb_array_length(v_stops) > 0 then
      -- Get final stop name (last element of array)
      v_final_stop_name := jsonb_extract_path_text(v_stops, (jsonb_array_length(v_stops) - 1)::text);
      
      -- Query stop coordinates
      select lat, lng into v_final_lat, v_final_lng
      from public.stops
      where name = v_final_stop_name;
      
      -- Simple Euclidean distance check as approximation (within ~1km, or 0.01 degrees)
      if v_final_lat is not null and v_final_lng is not null then
        v_dist := sqrt(power(p_lat - v_final_lat, 2) + power(p_lng - v_final_lng, 2));
        if v_dist <= 0.01 then
          v_gps_verified := true;
        end if;
      else
        -- If stop coordinates are not defined, fallback to verified
        v_gps_verified := true;
      end if;
    else
      v_gps_verified := true;
    end if;
  else
    v_gps_verified := true;
  end if;

  -- Update trip
  update public.trips
  set 
    driver_ended = true,
    driver_end_lat = p_lat,
    driver_end_lng = p_lng,
    gps_verified = v_gps_verified,
    end_time = to_char(now(), 'HH:MI AM'),
    status = case when v_conductor_ended = true then 'COMPLETED'::text else status end
  where id = p_trip_id;

  v_result := jsonb_build_object(
    'success', true,
    'gps_verified', v_gps_verified,
    'message', case when v_gps_verified then 'GPS verification successful: Reached final stop.' else 'GPS verification warning: Driver is not near the final stop.' end
  );
  
  return v_result;
end;
$$;

-- 32. rpc_get_stops_by_district: Fetch stops in district
create or replace function public.rpc_get_stops_by_district(district_name text)
returns table (
  name text
)
language plpgsql
security definer
as $$
begin
  return query
  select s.name from public.stops s where s.district = district_name;
end;
$$;

-- 33. rpc_get_trips_by_district: Fetch trips in district
create or replace function public.rpc_get_trips_by_district(district_name text)
returns table (
  id text,
  route_id integer,
  bus_id text,
  driver_name text,
  conductor_name text,
  start_time text,
  status text,
  district text,
  zone text,
  route_code text,
  route_name text,
  stops jsonb,
  bus_registration_number text,
  bus_eta integer,
  bus_capacity integer,
  bus_current_occupancy integer,
  bus_fare numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.route_id,
    t.bus_id,
    t.driver_name,
    t.conductor_name,
    t.start_time,
    t.status,
    t.district,
    t.zone,
    r.code as route_code,
    coalesce(r.name, 'Unknown Route') as route_name,
    coalesce(r.stops, '[]'::jsonb) as stops,
    coalesce(b.registration_number, 'Unknown Bus') as bus_registration_number,
    coalesce(b.eta, 5) as bus_eta,
    coalesce(b.capacity, 50) as bus_capacity,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.trip_id = t.id and tk.status in ('CONFIRMED', 'BOARDED')), 0) as bus_current_occupancy,
    coalesce(b.fare, 14.0) as bus_fare
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  where t.district = district_name;
end;
$$;

-- 34. rpc_get_tickets_by_user_id: Fetch tickets of passenger
create or replace function public.rpc_get_tickets_by_user_id(passenger_user_id uuid)
returns setof public.tickets
language plpgsql
security definer
as $$
begin
  return query
  select * from public.tickets 
  where user_id = passenger_user_id 
  order by timestamp desc;
end;
$$;

-- 35. rpc_insert_complaint: File a complaint
create or replace function public.rpc_insert_complaint(bus_id text, type text, description text, user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.complaints (bus_id, type, description, user_id)
  values (bus_id, type, description, user_id);
end;
$$;

-- 36. rpc_get_buses_with_routes: Fetch buses list formatted
create or replace function public.rpc_get_buses_with_routes()
returns table (
  bus_id text,
  number_plate text,
  route_name text,
  stops jsonb
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    b.id as bus_id,
    b.registration_number as number_plate,
    coalesce('Route ' || r.code || ': ' || r.name, 'General Route') as route_name,
    coalesce(r.stops, '[]'::jsonb) as stops
  from public.buses b
  left join public.routes r on b.route_id = r.id
  order by b.id asc;
end;
$$;

-- 37. rpc_get_bus_by_id: Fetch a bus profile
create or replace function public.rpc_get_bus_by_id(bus_id text)
returns public.buses
language plpgsql
security definer
as $$
declare
  result public.buses;
begin
  select * into result from public.buses where id = bus_id;
  return result;
end;
$$;

-- 53. rpc_trigger_sos: Raise critical alert
create or replace function public.rpc_trigger_sos(user_uuid uuid, lat numeric, lng numeric)
returns void
language plpgsql
security definer
as $$
declare
  v_user_name text;
begin
  select coalesce(raw_user_meta_data->>'name', 'Unknown') into v_user_name from auth.users where id = user_uuid;
  
  insert into public.alerts (type, message, location, status)
  values (
    'SOS',
    'CRITICAL: SOS triggered by citizen ' || coalesce(v_user_name, 'Unknown') || ' at lat: ' || lat || ', lng: ' || lng,
    json_build_object('lat', lat, 'lng', lng)::jsonb,
    'PENDING'
  );
end;
$$;

-- 56. rpc_create_user_admin: Admin function to create user accounts safely
create or replace function public.rpc_create_user_admin(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_role text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  new_user_id uuid := extensions.gen_random_uuid();
  v_password_hash text;
  v_actor_role text;
  response jsonb;
begin
  select coalesce(u.raw_user_meta_data->>'role', p.role)
  into v_actor_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid();

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_actor_role <> 'MASTER_ADMIN' then
    raise exception 'Only Master Admin can create users.';
  end if;

  -- Validate inputs
  if p_email is null or p_email = '' then
    raise exception 'Email is required';
  end if;
  if p_password is null or p_password = '' then
    raise exception 'Password is required';
  end if;
  if p_role is null or p_role = '' then
    raise exception 'Role is required';
  end if;
  if p_role not in ('MASTER_ADMIN', 'ADMIN', 'DRIVER', 'CONDUCTOR', 'PASSENGER') then
    raise exception 'Invalid role: %', p_role;
  end if;

  -- Hash the password using bcrypt
  v_password_hash := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Check if user already exists
  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'A user with this email already exists.';
  end if;

  -- 1. Insert into auth.users
  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    lower(p_email),
    v_password_hash,
    now(),
    now(),
    json_build_object('provider', 'email', 'providers', array['email'])::jsonb,
    json_build_object('name', p_name, 'role', p_role, 'phone', p_phone, 'status', 'ACTIVE')::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  );

  insert into public.profiles (id, email, name, phone, role, status)
  values (new_user_id, lower(p_email), p_name, p_phone, p_role, 'ACTIVE')
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    phone = excluded.phone,
    role = excluded.role,
    status = excluded.status,
    updated_at = now();

  response := json_build_object(
    'success', true,
    'user_id', new_user_id,
    'message', 'User successfully created'
  );

  return response;
exception
  when others then
    return json_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

-- 50. rpc_add_stop: Add a new master stop
create or replace function public.rpc_add_stop(p_name text, p_district text, p_lat numeric, p_lng numeric)
returns public.stops
language plpgsql
security definer
as $$
declare
  inserted_stop public.stops;
begin
  insert into public.stops (name, district, lat, lng)
  values (p_name, p_district, p_lat, p_lng)
  returning * into inserted_stop;
  return inserted_stop;
end;
$$;

-- 51. rpc_update_stop: Update existing stop
create or replace function public.rpc_update_stop(p_id uuid, p_name text, p_district text, p_lat numeric, p_lng numeric)
returns void
language plpgsql
security definer
as $$
begin
  update public.stops
  set
    name = p_name,
    district = p_district,
    lat = p_lat,
    lng = p_lng
  where id = p_id;
end;
$$;

-- 52. rpc_delete_stop: Delete a stop
create or replace function public.rpc_delete_stop(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.stops where id = p_id;
end;
$$;

-- 53. rpc_delete_user: Delete user from auth.users
create or replace function public.rpc_delete_user(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_actor_role text;
begin
  select coalesce(u.raw_user_meta_data->>'role', p.role)
  into v_actor_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid();

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_actor_role <> 'MASTER_ADMIN' then
    raise exception 'Only Master Admin can delete users.';
  end if;

  -- Delete from auth.users
  delete from auth.users where id = p_user_id;
  
  return json_build_object('success', true);
exception
  when others then
    return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- 54. rpc_update_user: Update user auth metadata
create or replace function public.rpc_update_user(p_user_id uuid, p_name text, p_phone text, p_status text, p_role text)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_actor_role text;
  v_email text;
begin
  select coalesce(u.raw_user_meta_data->>'role', p.role)
  into v_actor_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid();

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_actor_role <> 'MASTER_ADMIN' then
    raise exception 'Only Master Admin can update users.';
  end if;

  if p_role not in ('MASTER_ADMIN', 'ADMIN', 'DRIVER', 'CONDUCTOR', 'PASSENGER') then
    raise exception 'Invalid role: %', p_role;
  end if;

  if p_status not in ('ACTIVE', 'INACTIVE') then
    raise exception 'Invalid status: %', p_status;
  end if;

  update auth.users
  set
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', p_name, 'phone', p_phone, 'role', p_role, 'status', p_status),
    updated_at = now()
  where id = p_user_id
  returning email into v_email;

  if v_email is null then
    raise exception 'User not found';
  end if;

  insert into public.profiles (id, email, name, phone, role, status)
  values (p_user_id, v_email, p_name, p_phone, p_role, p_status)
  on conflict (id) do update
  set
    name = excluded.name,
    phone = excluded.phone,
    role = excluded.role,
    status = excluded.status,
    updated_at = now();

  return json_build_object('success', true);
exception
  when others then
    return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- 55. rpc_init_passenger_profile: Safe function to initialize a passenger profile if missing on login/signup
create or replace function public.rpc_init_passenger_profile(p_name text, p_phone text)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select email into v_email from auth.users where id = v_user_id;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'name', coalesce(p_name, raw_user_meta_data->>'name', 'Passenger'),
    'phone', coalesce(p_phone, raw_user_meta_data->>'phone', ''),
    'role', coalesce(raw_user_meta_data->>'role', 'PASSENGER'),
    'status', coalesce(raw_user_meta_data->>'status', 'ACTIVE')
  )
  where id = v_user_id;

  return json_build_object('success', true);
exception
  when others then
    return json_build_object('success', false, 'error', sqlerrm);
end;
$$;


-- ========================================================
-- 6. RAZORPAY INTEGRATION SCHEMA & RPCs (FROM razorpay.sql)
-- ========================================================

-- Create Razorpay Orders Table
create table if not exists public.razorpay_orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'CREATED' check (status in ('CREATED', 'PAID', 'FAILED')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Razorpay Payments Table
create table if not exists public.razorpay_payments (
  id text primary key,
  order_id text references public.razorpay_orders(id) on delete cascade,
  signature text not null,
  status text not null default 'VERIFIED' check (status in ('VERIFIED', 'FAILED')),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.razorpay_orders enable row level security;
alter table public.razorpay_payments enable row level security;

-- RLS Policies
drop policy if exists "Users view own razorpay orders" on public.razorpay_orders;
create policy "Users view own razorpay orders" on public.razorpay_orders
  for select using (user_id = auth.uid());

drop policy if exists "Users view own razorpay payments" on public.razorpay_payments;
create policy "Users view own razorpay payments" on public.razorpay_payments
  for select using (
    exists (
      select 1 from public.razorpay_orders o 
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists idx_rzp_orders_user_id on public.razorpay_orders(user_id);
create index if not exists idx_rzp_payments_order_id on public.razorpay_payments(order_id);

-- RPC: Create Razorpay Order
create or replace function public.rpc_create_razorpay_order(
  user_uuid uuid,
  order_amount numeric
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id text;
  v_result jsonb;
begin
  -- Enforce user exists
  perform 1 from auth.users where id = user_uuid;
  if not found then
    raise exception 'User not found.';
  end if;

  -- Generate order ID
  v_order_id := 'order_' || substring(lower(md5(random()::text)) from 1 for 12);

  -- Insert order record
  insert into public.razorpay_orders (id, user_id, amount, status)
  values (v_order_id, user_uuid, order_amount, 'CREATED');

  -- Build response payload
  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'amount', order_amount,
    'key_id', 'rzp_test_nigazhthisai2026', -- Sandbox/Test key identifier
    'currency', 'INR',
    'status', 'CREATED'
  );

  return v_result;
end;
$$;

-- RPC: Verify Razorpay Payment and Complete Transaction
create or replace function public.rpc_verify_razorpay_payment(
  user_uuid uuid,
  rzp_payment_id text,
  rzp_order_id text,
  rzp_signature text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_amount numeric;
  v_result jsonb;
begin
  -- Retrieve order details
  select amount into v_amount 
  from public.razorpay_orders 
  where id = rzp_order_id and user_id = user_uuid and status = 'CREATED';

  if v_amount is null then
    raise exception 'Invalid or already processed Razorpay order.';
  end if;

  -- Insert payment verification record
  insert into public.razorpay_payments (id, order_id, signature, status)
  values (rzp_payment_id, rzp_order_id, rzp_signature, 'VERIFIED');

  -- Update order status to paid
  update public.razorpay_orders
  set status = 'PAID', updated_at = now()
  where id = rzp_order_id;

  -- Return success status
  v_result := jsonb_build_object(
    'success', true,
    'payment_id', rzp_payment_id,
    'order_id', rzp_order_id,
    'amount_credited', v_amount
  );

  return v_result;
end;
$$;


-- ========================================================
-- 7. SEED DATA & DUMMY USER (FROM seed.sql)
-- ========================================================

-- Seed Dummy Test User for Integration Tests
DO $$
DECLARE
  v_dummy_id uuid := '00000000-0000-0000-0000-000000000000';
  v_email text := 'testuser@nigazhthisai.tn.gov.in';
  v_password_hash text := crypt('testpassword123', gen_salt('bf'));
BEGIN
  -- Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_dummy_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      v_dummy_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      v_password_hash,
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "Nigazhthisai Test User", "role": "PASSENGER"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    );
  END IF;

END;
$$;
