-- ========================================================
-- NIGAZHTHISAI MONOLITHIC SQL DATABASE CONFIG V2
-- ========================================================

-- Enable extensions
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ========================================================
-- 1. TABLE DEFINITIONS
-- ========================================================

-- DISTRICTS TABLE
create table if not exists public.districts (
  id serial primary key,
  name text not null unique,
  lat numeric not null,
  lon numeric not null
);

-- CODES TABLE
create table if not exists public.codes (
  code text primary key,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROUTES TABLE
create table if not exists public.routes (
  id serial primary key,
  name text not null,
  from_code text references public.codes(code) on delete set null,
  to_code text references public.codes(code) on delete set null,
  num_stops integer default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  district integer references public.districts(id) on delete set null,
  stops jsonb default '[]'::jsonb, -- jsonb array of UUIDs
  day_schedules jsonb default '{}'::jsonb,
  special_overrides jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ETM TABLE
create table if not exists public.etm (
  id text primary key,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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
  district integer references public.districts(id) on delete set null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'MAINTENANCE')),
  model text,
  type text not null default 'NON-AC' check (type in ('AC', 'NON-AC')),
  etm_id text references public.etm(id) on delete set null,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRIPS TABLE
create table if not exists public.trips (
  id text primary key,
  route_id integer references public.routes(id) on delete cascade not null,
  bus_id text references public.buses(id) on delete set null,
  driver_id text,
  conductor_id text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  actual_start_time timestamp with time zone,
  status text not null default 'PLANNED' check (status in ('PLANNED', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED')),
  district integer references public.districts(id) on delete set null,
  last_gps_time timestamp with time zone,
  driver_ended boolean default false,
  conductor_ended boolean default false,
  trip_start_lat numeric,
  trip_start_lng numeric,
  trip_end_lat numeric,
  trip_end_lng numeric,
  gps_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RAZORPAY ORDERS TABLE
create table if not exists public.razorpay_orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'CREATED' check (status in ('CREATED', 'PAID', 'FAILED')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RAZORPAY PAYMENTS TABLE
create table if not exists public.razorpay_payments (
  id text primary key,
  order_id text references public.razorpay_orders(id) on delete cascade,
  signature text not null,
  status text not null default 'VERIFIED',
  created_at timestamp with time zone default now()
);

-- TRANSACTIONS TABLE
create table if not exists public.transactions (
  id text primary key,
  amount numeric not null,
  status text not null default 'SUCCESS',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STOPS TABLE
create table if not exists public.stops (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  district integer references public.districts(id) on delete set null,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TICKETS TABLE
create table if not exists public.tickets (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  bus_id text references public.buses(id) on delete set null,
  order_id text references public.razorpay_orders(id) on delete set null,
  origin_stop_id uuid references public.stops(id) on delete set null,
  destination_stop_id uuid references public.stops(id) on delete set null,
  channel text not null default 'passenger' check (channel in ('passenger', 'conductor')),
  status text not null default 'CONFIRMED' check (status in ('PENDING_PAYMENT', 'CONFIRMED', 'BOARDED', 'EXPIRED', 'CANCELLED')),
  seats integer not null default 1,
  date date not null default current_date,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BOOKINGS TABLE
create table if not exists public.bookings (
  id text primary key,
  bus_id text references public.buses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  from_stop uuid references public.stops(id) on delete set null,
  to_stop uuid references public.stops(id) on delete set null,
  seats integer not null default 1,
  amount numeric not null,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Failed')),
  transaction_id text references public.transactions(id) on delete set null,
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
  message text,
  bus_id text references public.buses(id) on delete cascade,
  idle_duration integer,
  location jsonb,
  status text not null default 'PENDING' check (status in ('PENDING', 'RESOLVED', 'ACKNOWLEDGED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete set null
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

-- Trigger function for SOS alerts
create or replace function public.trg_construct_alert_message()
returns trigger
language plpgsql
security definer
as $$
declare
  v_user_name text;
begin
  if new.type = 'SOS' and new.message is null then
    select coalesce(raw_user_meta_data->>'name', 'Unknown') into v_user_name from auth.users where id = new.user_id;
    new.message := 'CRITICAL: SOS triggered by citizen ' || coalesce(v_user_name, 'Unknown') || ' at lat: ' || coalesce((new.location->>'lat'), 'N/A') || ', lng: ' || coalesce((new.location->>'lng'), 'N/A');
  end if;
  return new;
end;
$$;

create or replace trigger trg_alerts_message_insert
before insert on public.alerts
for each row
execute function public.trg_construct_alert_message();

-- ========================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

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
alter table public.audit_logs enable row level security;

create policy "Public read districts" on public.districts for select using (true);
create policy "Admins modify districts" on public.districts for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read codes" on public.codes for select using (true);
create policy "Admins modify codes" on public.codes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read routes" on public.routes for select using (true);
create policy "Admins modify routes" on public.routes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read buses" on public.buses for select using (true);
create policy "Admins modify buses" on public.buses for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read trips" on public.trips for select using (true);
create policy "Admins/Conductors modify trips" on public.trips for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));

create policy "Passengers view own tickets" on public.tickets for select using (user_id = auth.uid());
create policy "Admins/Conductors view tickets" on public.tickets for select using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));
create policy "Create tickets" on public.tickets for insert with check (user_id = auth.uid() or (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR');

create policy "Read own bookings" on public.bookings for select using (user_id = auth.uid());
create policy "Create own bookings" on public.bookings for insert with check (user_id = auth.uid());
create policy "Update own bookings" on public.bookings for update using (user_id = auth.uid());
create policy "Admins read all bookings" on public.bookings for select using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Create complaints" on public.complaints for insert with check (true);
create policy "Admins manage complaints" on public.complaints for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Admins read and acknowledge alerts" on public.alerts for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'OPERATIONS'));
create policy "Conductors create alerts" on public.alerts for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR');
create policy "Passengers read own alerts" on public.alerts for select using (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-000000000000');

create policy "Read stops" on public.stops for select using (true);
create policy "Admins manage stops" on public.stops for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read etm" on public.etm for select using (true);
create policy "Admins modify etm" on public.etm for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

-- ========================================================
-- 3. INDEXES
-- ========================================================
create index if not exists idx_tickets_user_id on public.tickets(user_id);
create index if not exists idx_tickets_date on public.tickets(date);
create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_rzp_orders_user_id on public.razorpay_orders(user_id);
create index if not exists idx_rzp_payments_order_id on public.razorpay_payments(order_id);

-- ========================================================
-- 4. RPC FUNCTIONS
-- ========================================================

-- rpc_get_user_by_uuid: Fetch custom metadata of user
create or replace function public.rpc_get_user_by_uuid(user_uuid uuid)
returns table (
  id uuid,
  email text,
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
    u.email::text,
    coalesce(u.raw_user_meta_data->>'name', 'Passenger')::text as name,
    coalesce(u.raw_user_meta_data->>'phone', '')::text as phone,
    coalesce(u.raw_user_meta_data->>'role', 'PASSENGER')::text as role,
    coalesce(u.raw_user_meta_data->>'status', 'ACTIVE')::text as status,
    u.created_at,
    u.updated_at
  from auth.users u
  where u.id = user_uuid;
end;
$$;

-- rpc_get_all_trips: Get all trips filtered by district
create or replace function public.rpc_get_all_trips(district_filter text default null)
returns table(
  id text,
  route_id integer,
  bus_id text,
  driver_id text,
  conductor_id text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  actual_start_time timestamp with time zone,
  status text,
  district integer,
  last_gps_time timestamp with time zone,
  driver_ended boolean,
  conductor_ended boolean,
  trip_start_lat numeric,
  trip_start_lng numeric,
  trip_end_lat numeric,
  trip_end_lng numeric,
  gps_verified boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  occupancy integer,
  onboard_passengers integer,
  occupancy_percent integer,
  etm_status text,
  district_name text
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
    t.driver_id,
    t.conductor_id,
    t.start_time,
    t.end_time,
    t.actual_start_time,
    t.status,
    t.district,
    t.last_gps_time,
    t.driver_ended,
    t.conductor_ended,
    t.trip_start_lat,
    t.trip_start_lng,
    t.trip_end_lat,
    t.trip_end_lng,
    t.gps_verified,
    t.created_at,
    t.updated_at,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as occupancy,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as onboard_passengers,
    coalesce(((select coalesce(sum(tk.seats), 0) from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date) * 100) / nullif((select b.capacity from public.buses b where b.id = t.bus_id), 0), 0)::integer as occupancy_percent,
    case when (select status from public.etm where id = (select etm_id from public.buses where id = t.bus_id)) = 'ACTIVE' then 'ONLINE'::text else 'OFFLINE'::text end as etm_status,
    d.name as district_name
  from public.trips t
  left join public.districts d on t.district = d.id
  where (district_filter is null or district_filter = 'All' or d.name = district_filter);
end;
$$;

-- rpc_get_all_tickets: Get all tickets filtered by bus name
create or replace function public.rpc_get_all_tickets(bus_name_filter text default null)
returns table(
  id text,
  user_id uuid,
  bus_id text,
  order_id text,
  origin_stop_id uuid,
  destination_stop_id uuid,
  channel text,
  status text,
  seats integer,
  date date,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  fare numeric,
  bus_name text,
  from_stop text,
  to_stop text
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.user_id,
    t.bus_id,
    t.order_id,
    t.origin_stop_id,
    t.destination_stop_id,
    t.channel,
    t.status,
    t.seats,
    t.date,
    t.created_at,
    t.updated_at,
    public.fn_calculate_fare(t.origin_stop_id, t.destination_stop_id) as fare,
    coalesce(b.registration_number, t.bus_id) as bus_name,
    coalesce(s1.name, 'Unknown') as from_stop,
    coalesce(s2.name, 'Unknown') as to_stop
  from public.tickets t
  left join public.buses b on t.bus_id = b.id
  left join public.stops s1 on t.origin_stop_id = s1.id
  left join public.stops s2 on t.destination_stop_id = s2.id
  where (bus_name_filter is null or bus_name_filter = 'All' or b.registration_number = bus_name_filter or b.id = bus_name_filter);
end;
$$;

-- rpc_get_pending_alerts: Get alerts that are pending
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

-- rpc_get_routes: Fetch all routes with dynamic district names and codes
create or replace function public.rpc_get_routes()
returns table(
  id integer,
  name text,
  code text,
  num_stops integer,
  status text,
  district text,
  stops jsonb,
  day_schedules jsonb,
  special_overrides jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    r.id,
    r.name,
    (coalesce(r.from_code, 'Unknown') || '-' || coalesce(r.to_code, 'Unknown'))::text as code,
    r.num_stops,
    r.status,
    coalesce(d.name, 'Unknown')::text as district,
    r.stops,
    r.day_schedules,
    r.special_overrides,
    r.created_at,
    r.updated_at
  from public.routes r
  left join public.districts d on r.district = d.id
  order by r.id asc;
end;
$$;

-- rpc_get_stops: Get stops with coordinates and district names
create or replace function public.rpc_get_stops()
returns table(
  id uuid,
  name text,
  district text,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    s.id,
    s.name,
    coalesce(d.name, 'Unknown')::text as district,
    s.lat,
    s.lng,
    s.created_at
  from public.stops s
  left join public.districts d on s.district = d.id
  order by s.name asc;
end;
$$;

-- rpc_get_trips_detailed: Get trips with detailed parameters computed dynamically
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
    t.driver_id as driver_name,
    t.conductor_id as conductor_name,
    coalesce(to_char(t.start_time, 'YYYY-MM-DD HH24:MI:SS'), '')::text as start_time,
    coalesce(to_char(t.end_time, 'YYYY-MM-DD HH24:MI:SS'), '')::text as end_time,
    t.status,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as occupancy,
    coalesce((select name from public.districts where id = t.district), 'Unknown')::text as district,
    ''::text as zone,
    ''::text as current_segment,
    t.last_gps_time,
    0 as delay_minutes,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as onboard_passengers,
    coalesce(((select coalesce(sum(tk.seats), 0) from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date) * 100) / nullif(b.capacity, 0), 0)::integer as occupancy_percent,
    case when (select status from public.etm where id = b.etm_id) = 'ACTIVE' then 'ONLINE'::text else 'OFFLINE'::text end as etm_status,
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

-- rpc_get_live_trips_detailed: Get detailed active trips calculated dynamically
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
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as occupancy,
    t.status as status,
    false as is_idle,
    0 as idle_minutes,
    coalesce((select name from public.districts where id = t.district), 'Unknown')::text as district,
    ''::text as zone,
    0 as delay_minutes,
    coalesce(((select coalesce(sum(tk.seats), 0) from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date) * 100) / nullif(b.capacity, 0), 0)::integer as occupancy_percent,
    5 as eta,
    b.capacity,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as current_occupancy,
    public.fn_calculate_route_fare(t.route_id) as fare
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  where t.status = 'RUNNING';
end;
$$;

-- rpc_acknowledge_alert: Acknowledge alert
create or replace function public.rpc_acknowledge_alert(alert_id integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.alerts set status = 'ACKNOWLEDGED' where id = alert_id;
end;
$$;

-- rpc_trigger_sos: Create an SOS alert
create or replace function public.rpc_trigger_sos(p_user_id uuid, p_location jsonb)
returns public.alerts
language plpgsql
security definer
as $$
declare
  v_inserted public.alerts;
begin
  insert into public.alerts (type, message, location, status, user_id)
  values ('SOS', null, p_location, 'PENDING', p_user_id)
  returning * into v_inserted;
  return v_inserted;
end;
$$;

-- rpc_resolve_alert: Resolve real-time alert
create or replace function public.rpc_resolve_alert(p_alert_id integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.alerts
  set status = 'RESOLVED'
  where id = p_alert_id;
end;
$$;

-- rpc_add_bus: Add a new bus with district lookup
create or replace function public.rpc_add_bus(
  bus_id text, 
  reg_no text, 
  route_id integer, 
  capacity integer, 
  fare numeric, 
  district text, 
  zone text, 
  bus_status text default 'STOPPED'
)
returns public.buses
language plpgsql
security definer
as $$
declare
  v_district_id integer;
  inserted_bus public.buses;
begin
  select id into v_district_id from public.districts where name = district limit 1;
  insert into public.buses (id, registration_number, route_id, capacity, district, status)
  values (bus_id, reg_no, route_id, capacity, v_district_id, bus_status)
  returning * into inserted_bus;
  return inserted_bus;
end;
$$;

-- rpc_add_route: Add route and parse from_code/to_code
create or replace function public.rpc_add_route(code text, name text, stops jsonb)
returns public.routes
language plpgsql
security definer
as $$
declare
  v_from_code text;
  v_to_code text;
  v_parts text[];
  inserted_route public.routes;
begin
  v_parts := string_to_array(code, '-');
  if array_length(v_parts, 1) >= 2 then
    v_from_code := v_parts[1];
    v_to_code := v_parts[2];
  else
    v_parts := string_to_array(code, '_');
    if array_length(v_parts, 1) >= 2 then
      v_from_code := v_parts[1];
      v_to_code := v_parts[2];
    else
      v_from_code := code;
      v_to_code := '001';
    end if;
  end if;

  insert into public.codes (code, description) values (v_from_code, 'Auto-generated') on conflict (code) do nothing;
  insert into public.codes (code, description) values (v_to_code, 'Auto-generated') on conflict (code) do nothing;

  insert into public.routes (from_code, to_code, name, stops)
  values (v_from_code, v_to_code, name, stops)
  returning * into inserted_route;
  return inserted_route;
end;
$$;

-- rpc_add_trip: Add trip with district lookup and start_time conversion
create or replace function public.rpc_add_trip(
  trip_id text, 
  route_id integer, 
  bus_id text, 
  driver_name text, 
  conductor_name text, 
  status text, 
  start_time text, 
  district text, 
  zone text
)
returns public.trips
language plpgsql
security definer
as $$
declare
  v_district_id integer;
  v_start timestamp with time zone;
  v_end timestamp with time zone;
  inserted_trip public.trips;
begin
  select id into v_district_id from public.districts where name = district limit 1;
  
  if start_time is not null and start_time <> '' then
    v_start := to_timestamp(to_char(current_date, 'YYYY-MM-DD') || ' ' || start_time, 'YYYY-MM-DD HH24:MI');
  else
    v_start := now();
  end if;
  
  v_end := v_start + interval '2 hours';
  
  insert into public.trips (id, route_id, bus_id, driver_id, conductor_id, start_time, end_time, status, district)
  values (trip_id, route_id, bus_id, driver_name, conductor_name, v_start, v_end, status, v_district_id)
  returning * into inserted_trip;
  return inserted_trip;
end;
$$;

-- rpc_update_bus: Update bus details
create or replace function public.rpc_update_bus(
  bus_id text, 
  reg_no text, 
  route_id integer, 
  capacity integer, 
  fare numeric, 
  district text, 
  zone text, 
  bus_status text
)
returns void
language plpgsql
security definer
as $$
declare
  v_district_id integer;
begin
  select id into v_district_id from public.districts where name = district limit 1;
  update public.buses
  set 
    registration_number = rpc_update_bus.reg_no,
    route_id = rpc_update_bus.route_id,
    capacity = rpc_update_bus.capacity,
    district = v_district_id,
    status = rpc_update_bus.bus_status
  where id = rpc_update_bus.bus_id;
end;
$$;

-- rpc_update_route: Update route and map codes
create or replace function public.rpc_update_route(route_id integer, code text, name text, stops jsonb)
returns void
language plpgsql
security definer
as $$
declare
  v_from_code text;
  v_to_code text;
  v_parts text[];
begin
  v_parts := string_to_array(code, '-');
  if array_length(v_parts, 1) >= 2 then
    v_from_code := v_parts[1];
    v_to_code := v_parts[2];
  else
    v_parts := string_to_array(code, '_');
    if array_length(v_parts, 1) >= 2 then
      v_from_code := v_parts[1];
      v_to_code := v_parts[2];
    else
      v_from_code := code;
      v_to_code := '001';
    end if;
  end if;

  insert into public.codes (code, description) values (v_from_code, 'Auto-generated') on conflict (code) do nothing;
  insert into public.codes (code, description) values (v_to_code, 'Auto-generated') on conflict (code) do nothing;

  update public.routes
  set 
    from_code = v_from_code,
    to_code = v_to_code,
    name = rpc_update_route.name,
    stops = rpc_update_route.stops
  where id = rpc_update_route.route_id;
end;
$$;

-- rpc_update_trip: Update duty allocation
create or replace function public.rpc_update_trip(trip_id text, driver_name text, conductor_name text, trip_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    driver_id = rpc_update_trip.driver_name,
    conductor_id = rpc_update_trip.conductor_name,
    status = rpc_update_trip.trip_status
  where id = rpc_update_trip.trip_id;
end;
$$;

-- rpc_delete_bus: Delete bus
create or replace function public.rpc_delete_bus(bus_id text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.buses where id = bus_id;
end;
$$;

-- rpc_delete_route: Delete route
create or replace function public.rpc_delete_route(route_id integer)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.routes where id = route_id;
end;
$$;

-- rpc_delete_trip: Delete trip
create or replace function public.rpc_delete_trip(trip_id text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.trips where id = trip_id;
end;
$$;

-- rpc_get_alert_messages: Fetch messages for alerts
create or replace function public.rpc_get_alert_messages(p_alert_id integer)
returns setof public.alert_messages
language plpgsql
security definer
as $$
begin
  return query
  select * from public.alert_messages m
  where m.alert_id = p_alert_id
  order by m.created_at asc;
end;
$$;

-- rpc_send_alert_message: Insert alert message
create or replace function public.rpc_send_alert_message(
  p_alert_id integer,
  p_sender_role text,
  p_sender_name text,
  p_message text
)
returns public.alert_messages
language plpgsql
security definer
as $$
declare
  v_inserted public.alert_messages;
begin
  insert into public.alert_messages (alert_id, sender_role, sender_name, message)
  values (p_alert_id, p_sender_role, p_sender_name, p_message)
  returning * into v_inserted;
  return v_inserted;
end;
$$;

-- rpc_insert_ticket: Issue or book tickets mapping from_stop/to_stop text values to UUIDs
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
  v_origin_id uuid;
  v_dest_id uuid;
  v_inserted public.tickets;
begin
  select id into v_origin_id from public.stops where name = from_stop limit 1;
  select id into v_dest_id from public.stops where name = to_stop limit 1;

  insert into public.tickets (id, user_id, bus_id, order_id, origin_stop_id, destination_stop_id, channel, status, seats, date)
  values (
    ticket_id, 
    user_id, 
    bus_id, 
    null, 
    v_origin_id, 
    v_dest_id, 
    case when lower(channel) = 'etm' then 'conductor'::text else 'passenger'::text end, 
    status, 
    seats, 
    coalesce(to_date(ticket_date, 'YYYY-MM-DD'), current_date)
  )
  returning * into v_inserted;
  return v_inserted;
end;
$$;

-- rpc_get_ticket_detailed_by_id: Fetch detailed ticket mapped dynamically
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
    ''::text as trip_id,
    t.bus_id,
    coalesce(b.registration_number, t.bus_id) as bus_name,
    coalesce(s1.name, 'Unknown') as from_stop,
    coalesce(s2.name, 'Unknown') as to_stop,
    t.seats,
    public.fn_calculate_fare(t.origin_stop_id, t.destination_stop_id) as fare,
    t.channel,
    t.status,
    ('TICKET|' || t.id || '|' || coalesce(b.registration_number, t.bus_id) || '|' || t.seats::text)::text as qr_payload,
    t.date::text as date,
    coalesce(u.raw_user_meta_data->>'name', 'Passenger') as passenger_name
  from public.tickets t
  left join auth.users u on t.user_id = u.id
  left join public.buses b on t.bus_id = b.id
  left join public.stops s1 on t.origin_stop_id = s1.id
  left join public.stops s2 on t.destination_stop_id = s2.id
  where t.id = ticket_id;
end;
$$;

-- rpc_update_ticket_status: Update ticket status
create or replace function public.rpc_update_ticket_status(ticket_id text, ticket_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.tickets set status = ticket_status where id = ticket_id;
end;
$$;

-- rpc_get_tickets_by_user_id: Get tickets of a passenger
create or replace function public.rpc_get_tickets_by_user_id(passenger_user_id uuid)
returns table(
  id text,
  user_id uuid,
  bus_id text,
  order_id text,
  origin_stop_id uuid,
  destination_stop_id uuid,
  channel text,
  status text,
  seats integer,
  date date,
  timestamp timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  fare numeric,
  bus_name text,
  from_stop text,
  to_stop text
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.user_id,
    t.bus_id,
    t.order_id,
    t.origin_stop_id,
    t.destination_stop_id,
    t.channel,
    t.status,
    t.seats,
    t.date,
    t.timestamp,
    t.created_at,
    t.updated_at,
    public.fn_calculate_fare(t.origin_stop_id, t.destination_stop_id) as fare,
    coalesce(b.registration_number, t.bus_id) as bus_name,
    coalesce(s1.name, 'Unknown') as from_stop,
    coalesce(s2.name, 'Unknown') as to_stop
  from public.tickets t
  left join public.buses b on t.bus_id = b.id
  left join public.stops s1 on t.origin_stop_id = s1.id
  left join public.stops s2 on t.destination_stop_id = s2.id
  where t.user_id = passenger_user_id 
  order by t.timestamp desc;
end;
$$;

-- rpc_insert_complaint: Insert a complaint
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

-- rpc_get_complaints: Fetch complaints list
create or replace function public.rpc_get_complaints()
returns table(
  id integer,
  bus_id text,
  bus_no text,
  type text,
  description text,
  user_id uuid,
  passenger_name text,
  created_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    c.id,
    c.bus_id,
    coalesce(b.registration_number, c.bus_id) as bus_no,
    c.type,
    c.description,
    c.user_id,
    coalesce(u.raw_user_meta_data->>'name', 'Passenger')::text as passenger_name,
    c.created_at
  from public.complaints c
  left join public.buses b on c.bus_id = b.id
  left join auth.users u on c.user_id = u.id
  order by c.created_at desc;
end;
$$;

-- rpc_get_trips_by_district: Get trips inside district mapped dynamically
create or replace function public.rpc_get_trips_by_district(district_name text)
returns table(
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
    t.driver_id as driver_name,
    t.conductor_id as conductor_name,
    coalesce(to_char(t.start_time, 'YYYY-MM-DD HH24:MI:SS'), '')::text as start_time,
    t.status,
    coalesce((select name from public.districts where id = t.district), 'Unknown')::text as district,
    ''::text as zone,
    (coalesce(r.from_code, 'Unknown') || '-' || coalesce(r.to_code, 'Unknown'))::text as route_code,
    coalesce(r.name, 'Unknown Route') as route_name,
    coalesce(r.stops, '[]'::jsonb) as stops,
    coalesce(b.registration_number, 'Unknown Bus') as bus_registration_number,
    5 as bus_eta,
    coalesce(b.capacity, 50) as bus_capacity,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = t.bus_id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as bus_current_occupancy,
    public.fn_calculate_route_fare(t.route_id) as bus_fare
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  left join public.districts d on t.district = d.id
  where (district_name = 'All' or d.name = district_name);
end;
$$;

-- rpc_add_stop: Add stop with district lookup
create or replace function public.rpc_add_stop(p_name text, p_district text, p_lat numeric, p_lng numeric)
returns public.stops
language plpgsql
security definer
as $$
declare
  v_district_id integer;
  inserted_stop public.stops;
begin
  select id into v_district_id from public.districts where name = p_district limit 1;
  insert into public.stops (name, district, lat, lng)
  values (p_name, v_district_id, p_lat, p_lng)
  returning * into inserted_stop;
  return inserted_stop;
end;
$$;

-- rpc_update_stop: Update stop details
create or replace function public.rpc_update_stop(p_id uuid, p_name text, p_district text, p_lat numeric, p_lng numeric)
returns void
language plpgsql
security definer
as $$
declare
  v_district_id integer;
begin
  select id into v_district_id from public.districts where name = p_district limit 1;
  update public.stops
  set
    name = p_name,
    district = v_district_id,
    lat = p_lat,
    lng = p_lng
  where id = p_id;
end;
$$;

-- rpc_delete_stop: Delete stop
create or replace function public.rpc_delete_stop(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.stops where id = p_id;
end;
$$;

-- rpc_get_districts: Fetch all districts
create or replace function public.rpc_get_districts()
returns setof public.districts
language plpgsql
security definer
as $$
begin
  return query
  select * from public.districts order by name asc;
end;
$$;

-- rpc_get_daily_revenue: Compute daily revenue dynamically from tickets
create or replace function public.rpc_get_daily_revenue()
returns table(
  date date,
  channel text,
  total_tickets_sold bigint,
  total_passengers numeric,
  total_revenue numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.date,
    t.channel,
    count(t.id) as total_tickets_sold,
    coalesce(sum(t.seats), 0)::numeric as total_passengers,
    coalesce(sum(public.fn_calculate_fare(t.origin_stop_id, t.destination_stop_id) * t.seats), 0)::numeric as total_revenue
  from public.tickets t
  group by t.date, t.channel;
end;
$$;

-- rpc_create_razorpay_order: Create Razorpay order
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
  perform 1 from auth.users where id = user_uuid;
  if not found then
    raise exception 'User not found.';
  end if;

  v_order_id := 'order_' || substring(lower(md5(random()::text)) from 1 for 12);

  insert into public.razorpay_orders (id, user_id, amount, status)
  values (v_order_id, user_uuid, order_amount, 'CREATED');

  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'amount', order_amount,
    'key_id', 'rzp_test_nigazhthisai2026',
    'currency', 'INR',
    'status', 'CREATED'
  );

  return v_result;
end;
$$;

-- rpc_verify_razorpay_payment: Verify payment status
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
  select amount into v_amount 
  from public.razorpay_orders 
  where id = rzp_order_id and user_id = user_uuid and status = 'CREATED';

  if v_amount is null then
    raise exception 'Invalid or already processed Razorpay order.';
  end if;

  insert into public.razorpay_payments (id, order_id, signature, status)
  values (rzp_payment_id, rzp_order_id, rzp_signature, 'VERIFIED');

  update public.razorpay_orders
  set status = 'PAID', updated_at = now()
  where id = rzp_order_id;

  v_result := jsonb_build_object(
    'success', true,
    'payment_id', rzp_payment_id,
    'order_id', rzp_order_id,
    'amount_credited', v_amount
  );

  return v_result;
end;
$$;

-- fn_calculate_fare: Compute distance-based fare between stops
create or replace function public.fn_calculate_fare(from_stop_id uuid, to_stop_id uuid)
returns numeric
language plpgsql
as $$
declare
  v_lat1 numeric;
  v_lng1 numeric;
  v_lat2 numeric;
  v_lng2 numeric;
  v_dist numeric;
  v_min_fare numeric := 10.0;
  v_extra_cost numeric := 2.0;
begin
  select lat, lng into v_lat1, v_lng1 from public.stops where id = from_stop_id;
  select lat, lng into v_lat2, v_lng2 from public.stops where id = to_stop_id;
  
  if v_lat1 is null or v_lng1 is null or v_lat2 is null or v_lng2 is null then
    return 15.0;
  end if;
  
  v_dist := sqrt(power(v_lat1 - v_lat2, 2) + power(v_lng1 - v_lng2, 2)) * 111.0;
  return coalesce(round(v_min_fare + (v_dist * v_extra_cost), 2), v_min_fare);
end;
$$;

create or replace function public.fn_calculate_fare_by_name(from_stop_name text, to_stop_name text)
returns numeric
language plpgsql
as $$
declare
  v_id1 uuid;
  v_id2 uuid;
begin
  select id into v_id1 from public.stops where name = from_stop_name limit 1;
  select id into v_id2 from public.stops where name = to_stop_name limit 1;
  return public.fn_calculate_fare(v_id1, v_id2);
end;
$$;

create or replace function public.fn_calculate_route_fare(p_route_id integer)
returns numeric
language plpgsql
as $$
declare
  v_stops jsonb;
  v_stops_len integer;
  v_first text;
  v_last text;
begin
  select stops into v_stops from public.routes where id = p_route_id;
  if v_stops is null then
    return 15.0;
  end if;
  v_stops_len := jsonb_array_length(v_stops);
  if v_stops_len < 2 then
    return 15.0;
  end if;
  v_first := v_stops->>0;
  v_last := v_stops->>(v_stops_len - 1);
  return public.fn_calculate_fare_by_name(v_first, v_last);
end;
$$;

-- ========================================================
-- 5. SEED DATA
-- ========================================================

-- Seed districts
insert into public.districts (id, name, lat, lon) values
  (1, 'Tiruppur', 11.1085, 77.3411),
  (2, 'Chennai', 13.0827, 80.2707),
  (3, 'Madurai', 9.9252, 78.1198),
  (4, 'Coimbatore', 11.0168, 76.9558),
  (5, 'Salem', 11.6643, 78.1460),
  (6, 'Trichy', 10.7905, 78.7047),
  (7, 'Erode', 11.3410, 77.7172)
on conflict (id) do nothing;

-- Seed codes
insert into public.codes (code, description) values
  ('TPR', 'Tiruppur region'),
  ('CHE', 'Chennai region'),
  ('MAD', 'Madurai region'),
  ('CBE', 'Coimbatore region'),
  ('001', '001 index'),
  ('102', '102 index'),
  ('405', '405 index'),
  ('PER', 'Periyar index')
on conflict (code) do nothing;

-- Seed routes
insert into public.routes (id, name, from_code, to_code, num_stops, status, district, stops, day_schedules)
values 
  (1, 'Tiruppur Old to New Bus Stand', 'TPR', '001', 4, 'ACTIVE', 1, 
   '["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14"]'::jsonb, '{}'::jsonb),
  (2, 'Tambaram to Velachery', 'CHE', '102', 4, 'ACTIVE', 2, 
   '["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24"]'::jsonb, '{}'::jsonb),
  (3, 'Gandhipuram to Town Hall', 'CBE', '405', 4, 'ACTIVE', 4, 
   '["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a34"]'::jsonb, '{}'::jsonb),
  (4, 'Madurai – Periyar', 'MAD', 'PER', 4, 'ACTIVE', 3, 
   '["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a43", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44"]'::jsonb, '{}'::jsonb)
on conflict (id) do update 
set name = excluded.name, from_code = excluded.from_code, to_code = excluded.to_code, stops = excluded.stops;

-- Seed ETM
insert into public.etm (id, status)
values
  ('ETM-001', 'ACTIVE'),
  ('ETM-002', 'ACTIVE'),
  ('ETM-003', 'ACTIVE'),
  ('ETM-004', 'ACTIVE')
on conflict (id) do nothing;

-- Seed buses
insert into public.buses (id, registration_number, route_id, capacity, current_lat, current_lng, occupancy, district, status, model, type, etm_id)
values 
  ('32', 'TN 39 AB 1234', 1, 50, 11.1085, 77.3411, 'medium', 1, 'ACTIVE', 'Leyland Viking', 'AC', 'ETM-001'),
  ('12', 'TN 01 CD 5678', 2, 50, 12.9229, 80.1275, 'high', 2, 'ACTIVE', 'Volvo 9400', 'NON-AC', 'ETM-002'),
  ('45', 'TN 66 GH 3456', 3, 50, 11.0168, 76.9558, 'low', 4, 'ACTIVE', 'Eicher Pro', 'AC', 'ETM-003'),
  ('102', 'TN 43 GH 9012', 4, 50, 9.9168, 78.1128, 'low', 3, 'ACTIVE', 'Leyland Viking', 'NON-AC', 'ETM-004')
on conflict (id) do update
set registration_number = excluded.registration_number, route_id = excluded.route_id, current_lat = excluded.current_lat, current_lng = excluded.current_lng;

-- Seed stops
insert into public.stops (id, name, district, lat, lng)
values 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Old Bus Stand', 1, 11.1085, 77.3411),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Pushpa Theatre', 1, 11.1120, 77.3450),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Kumar Nagar', 1, 11.1210, 77.3510),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'New Bus Stand', 1, 11.1310, 77.3590),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Tambaram', 2, 12.9229, 80.1275),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Chromepet', 2, 12.9516, 80.1411),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Pallavaram', 2, 12.9675, 80.1492),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'Velachery', 2, 12.9796, 80.2196),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'Gandhipuram', 4, 11.0168, 76.9558),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'Railway Station', 4, 10.9990, 76.9631),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Ukkadam', 4, 10.9870, 76.9610),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'Town Hall', 4, 10.9950, 76.9510),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41', 'Mattuthavani', 3, 9.9252, 78.1198),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42', 'Anna Nagar', 3, 9.9180, 78.1320),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a43', 'Goripalayam', 3, 9.9320, 78.1240),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Periyar Bus Stand', 3, 9.9160, 78.1150)
on conflict (id) do update 
set name = excluded.name, district = excluded.district, lat = excluded.lat, lng = excluded.lng;

-- Seed auth users if not exists
DO $$
DECLARE
  v_dummy_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01';
  v_email text := 'test@nigazhthisai.com';
  v_password_hash text := crypt('test1234', gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
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
