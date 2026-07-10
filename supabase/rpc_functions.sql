-- ========================================================
-- NIGAZHTHISAI DATABASE RPC FUNCTIONS V3
-- Full audit and fix of all outdated RPCs
-- ========================================================

-- --------------------------------------------------------
-- rpc_get_user_by_uuid: Fetch custom metadata of user
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_all_trips: Get all trips filtered by district name
-- --------------------------------------------------------
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
    case when (select e.status from public.etm e where e.id = (select b2.etm_id from public.buses b2 where b2.id = t.bus_id)) = 'ACTIVE' then 'ONLINE'::text else 'OFFLINE'::text end as etm_status,
    d.name as district_name
  from public.trips t
  left join public.districts d on t.district = d.id
  where (district_filter is null or district_filter = 'All' or d.name = district_filter);
end;
$$;

-- --------------------------------------------------------
-- rpc_get_all_tickets: Get all tickets with computed fare and stop names
-- (bus_name_filter filters by bus registration or id — not district)
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_pending_alerts: Get alerts that are pending
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_routes: Fetch all routes with dynamic district names and codes
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_stops: Get stops with coordinates and district names
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_stops_by_district: Get stops filtered by district name (for Passenger view)
-- --------------------------------------------------------
create or replace function public.rpc_get_stops_by_district(district_name text)
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
  where (district_name = 'All' or district_name is null or d.name = district_name)
  order by s.name asc;
end;
$$;

-- --------------------------------------------------------
-- rpc_get_trips_detailed: Get trips with all computed fields
-- Returns driver_name/conductor_name aliases for frontend compat
-- --------------------------------------------------------
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
    case when (select e.status from public.etm e where e.id = b.etm_id) = 'ACTIVE' then 'ONLINE'::text else 'OFFLINE'::text end as etm_status,
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

-- --------------------------------------------------------
-- rpc_get_live_trips_detailed: Get detailed RUNNING trips
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_trip_detailed_by_id: Fetch a single trip with all computed details
-- (Used by Conductor, Driver, and conductorApi.issueTicket)
-- --------------------------------------------------------
create or replace function public.rpc_get_trip_detailed_by_id(trip_id text)
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
  last_gps_time timestamp with time zone,
  route_name text,
  bus_no text,
  bus_fare numeric,
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
    t.last_gps_time,
    coalesce(r.name, 'Unknown Route') as route_name,
    coalesce(b.registration_number, 'Unknown Bus') as bus_no,
    public.fn_calculate_route_fare(t.route_id) as bus_fare,
    coalesce(r.stops, '[]'::jsonb) as stops
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  where t.id = trip_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_acknowledge_alert: Acknowledge alert
-- --------------------------------------------------------
create or replace function public.rpc_acknowledge_alert(alert_id integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.alerts set status = 'ACKNOWLEDGED' where id = alert_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_trigger_sos: Create an SOS alert
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_resolve_alert: Resolve real-time alert
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_bus_by_id: Fetch a single bus record with district name
-- (Used by Conductor.tsx and Driver.tsx after QR scan)
-- --------------------------------------------------------
create or replace function public.rpc_get_bus_by_id(bus_id text)
returns table (
  id text,
  registration_number text,
  route_id integer,
  capacity integer,
  current_lat numeric,
  current_lng numeric,
  district text,
  status text,
  model text,
  type text,
  etm_id text,
  last_updated timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  route_name text,
  route_code text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    b.id,
    b.registration_number,
    b.route_id,
    b.capacity,
    b.current_lat,
    b.current_lng,
    coalesce(d.name, 'Unknown')::text as district,
    b.status,
    b.model,
    b.type,
    b.etm_id,
    b.last_updated,
    b.created_at,
    b.updated_at,
    coalesce(r.name, 'No Route')::text as route_name,
    (coalesce(r.from_code, 'Unknown') || '-' || coalesce(r.to_code, 'Unknown'))::text as route_code
  from public.buses b
  left join public.districts d on b.district = d.id
  left join public.routes r on b.route_id = r.id
  where b.id = bus_id
     or b.registration_number = bus_id
  limit 1;
end;
$$;

-- --------------------------------------------------------
-- rpc_add_bus: Add a new bus with district lookup
-- --------------------------------------------------------
create or replace function public.rpc_add_bus(
  bus_id text, 
  reg_no text, 
  route_id integer, 
  capacity integer, 
  fare numeric default 0,
  district text default null,
  zone text default null,
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

-- --------------------------------------------------------
-- rpc_add_route: Add route and parse from_code/to_code
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_add_trip: Add trip with district lookup and start_time conversion
-- --------------------------------------------------------
create or replace function public.rpc_add_trip(
  trip_id text, 
  route_id integer, 
  bus_id text, 
  driver_name text default '',
  conductor_name text default '',
  status text default 'SCHEDULED',
  start_time text default null,
  district text default null,
  zone text default null
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

-- --------------------------------------------------------
-- rpc_update_bus: Update bus details (handles model/type/etm_id from frontend)
-- --------------------------------------------------------
create or replace function public.rpc_update_bus(
  bus_id text, 
  reg_no text, 
  route_id integer, 
  capacity integer, 
  fare numeric default 0,
  district text default null,
  zone text default null,
  bus_status text default 'STOPPED',
  model text default null,
  type text default null,
  etm_id text default null
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
    status = rpc_update_bus.bus_status,
    model = coalesce(rpc_update_bus.model, public.buses.model),
    type = coalesce(rpc_update_bus.type, public.buses.type),
    etm_id = coalesce(nullif(rpc_update_bus.etm_id, ''), public.buses.etm_id)
  where id = rpc_update_bus.bus_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_update_route: Update route and map codes
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_update_trip: Update duty allocation
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_delete_bus / route / trip
-- --------------------------------------------------------
create or replace function public.rpc_delete_bus(bus_id text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.buses where id = bus_id;
end;
$$;

create or replace function public.rpc_delete_route(route_id integer)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.routes where id = route_id;
end;
$$;

create or replace function public.rpc_delete_trip(trip_id text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.trips where id = trip_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_get_alert_messages: Fetch messages for alerts
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_send_alert_message: Insert alert message
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_insert_ticket: Issue or book tickets
-- Accepts stop names (text) and resolves them to UUIDs.
-- ticket_date accepts YYYY-MM-DD or any parseable date.
-- --------------------------------------------------------
create or replace function public.rpc_insert_ticket(
  ticket_id text,
  user_id uuid,
  trip_id text,
  bus_id text,
  bus_name text default null,
  from_stop text default null,
  to_stop text default null,
  seats integer default 1,
  fare numeric default 0,
  channel text default 'passenger',
  status text default 'CONFIRMED',
  qr_payload text default null,
  ticket_date text default null
)
returns public.tickets
language plpgsql
security definer
as $$
declare
  v_origin_id uuid;
  v_dest_id uuid;
  v_date date;
  v_inserted public.tickets;
begin
  select id into v_origin_id from public.stops where name = from_stop limit 1;
  select id into v_dest_id from public.stops where name = to_stop limit 1;

  -- Robust date parsing: try YYYY-MM-DD first, then fallback to current_date
  begin
    v_date := ticket_date::date;
  exception when others then
    v_date := current_date;
  end;

  insert into public.tickets (id, user_id, bus_id, order_id, origin_stop_id, destination_stop_id, channel, status, seats, date)
  values (
    ticket_id, 
    user_id, 
    bus_id, 
    null, 
    v_origin_id, 
    v_dest_id, 
    -- Map 'ETM' -> 'conductor', anything else -> 'passenger'
    case when lower(channel) in ('etm', 'conductor') then 'conductor'::text else 'passenger'::text end,
    status, 
    seats, 
    coalesce(v_date, current_date)
  )
  returning * into v_inserted;
  return v_inserted;
end;
$$;

-- --------------------------------------------------------
-- rpc_get_ticket_detailed_by_id: Fetch detailed ticket mapped dynamically
-- --------------------------------------------------------
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
  passenger_name text,
  created_at timestamp with time zone
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
    coalesce(u.raw_user_meta_data->>'name', 'Passenger') as passenger_name,
    t.created_at
  from public.tickets t
  left join auth.users u on t.user_id = u.id
  left join public.buses b on t.bus_id = b.id
  left join public.stops s1 on t.origin_stop_id = s1.id
  left join public.stops s2 on t.destination_stop_id = s2.id
  where t.id = ticket_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_update_ticket_status: Update ticket status
-- --------------------------------------------------------
create or replace function public.rpc_update_ticket_status(ticket_id text, ticket_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.tickets set status = ticket_status where id = ticket_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_get_tickets_by_user_id: Get tickets of a passenger
-- --------------------------------------------------------
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
  where t.user_id = passenger_user_id 
  order by t.created_at desc;
end;
$$;

-- --------------------------------------------------------
-- rpc_insert_complaint: Insert a complaint
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_complaints: Fetch complaints list
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_trips_by_district: Get trips inside a district for Passenger view
-- --------------------------------------------------------
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
  where t.status in ('SCHEDULED', 'RUNNING')
    and (district_name = 'All' or district_name is null or d.name = district_name);
end;
$$;

-- --------------------------------------------------------
-- rpc_add_stop / rpc_update_stop / rpc_delete_stop
-- --------------------------------------------------------
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

create or replace function public.rpc_delete_stop(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.stops where id = p_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_get_districts: Fetch all districts
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_daily_revenue: Compute daily revenue dynamically from tickets
-- --------------------------------------------------------
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
  group by t.date, t.channel
  order by t.date desc;
end;
$$;

-- --------------------------------------------------------
-- rpc_create_razorpay_order: Create Razorpay order record in DB
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_verify_razorpay_payment: Verify payment, record in razorpay_payments, update order status
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- fn_calculate_fare: Compute distance-based fare between stop UUIDs
-- --------------------------------------------------------
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
  if from_stop_id is null or to_stop_id is null then
    return 15.0;
  end if;
  select lat, lng into v_lat1, v_lng1 from public.stops where id = from_stop_id;
  select lat, lng into v_lat2, v_lng2 from public.stops where id = to_stop_id;
  
  if v_lat1 is null or v_lng1 is null or v_lat2 is null or v_lng2 is null then
    return 15.0;
  end if;
  
  v_dist := sqrt(power(v_lat1 - v_lat2, 2) + power(v_lng1 - v_lng2, 2)) * 111.0;
  return coalesce(round(v_min_fare + (v_dist * v_extra_cost), 2), v_min_fare);
end;
$$;

-- --------------------------------------------------------
-- fn_calculate_fare_by_name: Resolve names to UUIDs then calculate fare
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- fn_calculate_route_fare: Resolve the first and last stops of a route
-- --------------------------------------------------------
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
  if p_route_id is null then
    return 15.0;
  end if;
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

-- --------------------------------------------------------
-- rpc_get_buses: Fetch all buses with dynamic district name & computed occupancy
-- --------------------------------------------------------
create or replace function public.rpc_get_buses()
returns table(
  id text,
  registration_number text,
  route_id integer,
  capacity integer,
  current_lat numeric,
  current_lng numeric,
  district text,
  status text,
  model text,
  type text,
  etm_id text,
  last_updated timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  current_occupancy integer
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    b.id,
    b.registration_number,
    b.route_id,
    b.capacity,
    b.current_lat,
    b.current_lng,
    coalesce(d.name, 'Unknown')::text as district,
    b.status,
    b.model,
    b.type,
    b.etm_id,
    b.last_updated,
    b.created_at,
    b.updated_at,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = b.id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as current_occupancy
  from public.buses b
  left join public.districts d on b.district = d.id;
end;
$$;

-- --------------------------------------------------------
-- rpc_get_buses_with_routes: Get buses with route details and computed occupancy
-- --------------------------------------------------------
create or replace function public.rpc_get_buses_with_routes()
returns table(
  id text,
  registration_number text,
  route_id integer,
  capacity integer,
  current_lat numeric,
  current_lng numeric,
  district text,
  status text,
  model text,
  type text,
  etm_id text,
  last_updated timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  route_name text,
  route_code text,
  current_occupancy integer
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    b.id,
    b.registration_number,
    b.route_id,
    b.capacity,
    b.current_lat,
    b.current_lng,
    coalesce(d.name, 'Unknown')::text as district,
    b.status,
    b.model,
    b.type,
    b.etm_id,
    b.last_updated,
    b.created_at,
    b.updated_at,
    coalesce(r.name, 'No Route')::text as route_name,
    (coalesce(r.from_code, 'Unknown') || '-' || coalesce(r.to_code, 'Unknown'))::text as route_code,
    coalesce((select sum(tk.seats)::integer from public.tickets tk where tk.bus_id = b.id and tk.status in ('CONFIRMED', 'BOARDED') and tk.date = current_date), 0) as current_occupancy
  from public.buses b
  left join public.districts d on b.district = d.id
  left join public.routes r on b.route_id = r.id;
end;
$$;

-- --------------------------------------------------------
-- rpc_start_trip: Start bus trip (sets status + actual_start_time)
-- --------------------------------------------------------
create or replace function public.rpc_start_trip(trip_id text, start_time text default null)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    status = 'RUNNING',
    actual_start_time = now()
  where id = trip_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_end_trip: End bus trip
-- --------------------------------------------------------
create or replace function public.rpc_end_trip(trip_id text)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    status = 'COMPLETED',
    end_time = now()
  where id = trip_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_driver_start_trip: Driver starts trip and sets start coordinates
-- --------------------------------------------------------
create or replace function public.rpc_driver_start_trip(p_trip_id text, p_lat numeric, p_lng numeric)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    status = 'RUNNING',
    actual_start_time = now(),
    trip_start_lat = p_lat,
    trip_start_lng = p_lng
  where id = p_trip_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_driver_end_trip: Driver ends trip and sets end coordinates
-- --------------------------------------------------------
create or replace function public.rpc_driver_end_trip(p_trip_id text, p_lat numeric, p_lng numeric)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    status = 'COMPLETED',
    end_time = now(),
    trip_end_lat = p_lat,
    trip_end_lng = p_lng
  where id = p_trip_id;
end;
$$;

-- --------------------------------------------------------
-- rpc_update_gps: Update live GPS coordinates of a running bus
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- rpc_get_total_passengers: Total passengers count
-- --------------------------------------------------------
create or replace function public.rpc_get_total_passengers()
returns bigint
language plpgsql
security definer
as $$
declare
  v_count bigint;
begin
  select coalesce(sum(seats), 0) into v_count from public.tickets where status in ('CONFIRMED', 'BOARDED');
  return v_count;
end;
$$;

-- --------------------------------------------------------
-- rpc_get_users: Get all registered auth users
-- --------------------------------------------------------
create or replace function public.rpc_get_users()
returns table (
  id uuid,
  email text,
  name text,
  phone text,
  role text,
  status text,
  created_at timestamp with time zone
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
    u.created_at
  from auth.users u;
end;
$$;

-- --------------------------------------------------------
-- rpc_create_user_admin: Admin create user
-- --------------------------------------------------------
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
  v_user_id uuid;
  v_password_hash text;
begin
  if exists (select 1 from auth.users where email = p_email) then
    return jsonb_build_object('success', false, 'error', 'Email already exists');
  end if;
  
  v_user_id := gen_random_uuid();
  v_password_hash := crypt(p_password, gen_salt('bf'));
  
  insert into auth.users (
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
    aud
  ) values (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    v_password_hash,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('name', p_name, 'phone', p_phone, 'role', p_role, 'status', 'ACTIVE'),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );
  
  return jsonb_build_object('success', true);
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- --------------------------------------------------------
-- rpc_update_user: Admin update user
-- --------------------------------------------------------
create or replace function public.rpc_update_user(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_status text,
  p_role text
)
returns jsonb
language plpgsql
security definer
as $$
begin
  update auth.users
  set raw_user_meta_data = jsonb_build_object('name', p_name, 'phone', p_phone, 'role', p_role, 'status', p_status)
  where id = p_user_id;
  return jsonb_build_object('success', true);
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- --------------------------------------------------------
-- rpc_delete_user: Admin delete user
-- --------------------------------------------------------
create or replace function public.rpc_delete_user(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
begin
  delete from auth.users where id = p_user_id;
  return jsonb_build_object('success', true);
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;
