-- ========================================================
-- NIGAZHTHISAI SUPABASE RPC FUNCTIONS
-- ========================================================

-- rpc_get_profile_by_id: Fetch the profile of a user by their user id
create or replace function public.rpc_get_profile_by_id(user_uuid uuid)
returns public.profiles
language plpgsql
security definer
as $$
declare
  result public.profiles;
begin
  select * into result from public.profiles where id = user_uuid;
  return result;
end;
$$;

-- rpc_get_all_trips: Get all trips filtered by district/zone
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

-- rpc_get_all_tickets: Get all tickets filtered by bus name
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

-- rpc_get_routes: Fetch all routes
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

-- rpc_get_buses: Fetch all buses
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

-- rpc_get_trips_detailed: Get detailed trips for dashboard/conductor
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
    t.occupancy,
    t.district,
    t.zone,
    t.current_segment,
    t.last_gps_time,
    t.delay_minutes,
    t.onboard_passengers,
    t.occupancy_percent,
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

-- rpc_get_live_trips_detailed: Get detailed live trips
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
    coalesce(t.occupancy_percent, 50) as occupancy,
    case when t.delay_minutes > 10 then 'DELAYED'::text else 'ON_TIME'::text end as status,
    false as is_idle,
    0 as idle_minutes,
    t.district,
    t.zone,
    t.delay_minutes,
    t.occupancy_percent,
    b.eta,
    b.capacity,
    b.current_occupancy,
    b.fare
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  where t.status = 'RUNNING';
end;
$$;

-- rpc_acknowledge_alert: Acknowledge operational alert
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

-- rpc_get_users: Get all users
create or replace function public.rpc_get_users()
returns setof public.profiles
language plpgsql
security definer
as $$
begin
  return query
  select * from public.profiles order by created_at desc;
end;
$$;

-- rpc_get_stops: Get all stops
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

-- rpc_get_shops: Get all shops
create or replace function public.rpc_get_shops()
returns setof public.shops
language plpgsql
security definer
as $$
begin
  return query
  select * from public.shops order by name asc;
end;
$$;

-- rpc_add_bus: Add a new bus
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

-- rpc_add_route: Add a new route
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

-- rpc_add_trip: Add a new trip
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

-- rpc_add_shop: Add a new shop
create or replace function public.rpc_add_shop(shop_id text, shop_name text, shop_description text, shop_lat numeric, shop_lng numeric, shop_status text)
returns public.shops
language plpgsql
security definer
as $$
declare
  inserted_shop public.shops;
begin
  insert into public.shops (id, name, description, lat, lng, status)
  values (shop_id, shop_name, shop_description, shop_lat, shop_lng, shop_status)
  returning * into inserted_shop;
  return inserted_shop;
end;
$$;

-- rpc_update_bus: Update existing bus details
create or replace function public.rpc_update_bus(bus_id text, reg_no text, route_id integer, capacity integer, fare numeric, district text, zone text, bus_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.buses
  set 
    registration_number = reg_no,
    route_id = route_id,
    capacity = capacity,
    fare = fare,
    district = district,
    zone = zone,
    status = bus_status
  where id = bus_id;
end;
$$;

-- rpc_update_route: Update existing route details
create or replace function public.rpc_update_route(route_id integer, code text, name text, stops jsonb)
returns void
language plpgsql
security definer
as $$
begin
  update public.routes
  set 
    code = code,
    name = name,
    stops = stops
  where id = route_id;
end;
$$;

-- rpc_update_trip: Update existing trip details
create or replace function public.rpc_update_trip(trip_id text, driver_name text, conductor_name text, trip_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    driver_name = driver_name,
    conductor_name = conductor_name,
    status = trip_status
  where id = trip_id;
end;
$$;

-- rpc_update_shop: Update existing shop details
create or replace function public.rpc_update_shop(shop_id text, name text, description text, lat numeric, lng numeric, status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.shops
  set 
    name = name,
    description = description,
    lat = lat,
    lng = lng,
    status = status
  where id = shop_id;
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

-- rpc_delete_shop: Delete shop
create or replace function public.rpc_delete_shop(shop_id text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.shops where id = shop_id;
end;
$$;

-- rpc_start_trip: Start running a trip
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

-- rpc_get_trip_detailed_by_id: Fetch detailed single trip details
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

-- rpc_insert_ticket: Book or issue a ticket
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

-- rpc_get_ticket_detailed_by_id: Fetch detailed passenger ticket
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
    coalesce(p.name, 'Passenger') as passenger_name
  from public.tickets t
  left join public.profiles p on t.user_id = p.id
  where t.id = ticket_id;
end;
$$;

-- rpc_update_ticket_status: Update status of ticket (e.g. BOARDED)
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

-- rpc_update_gps: Update active trip bus location and GPS timestamp
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

-- rpc_end_trip: Mark running trip as completed
create or replace function public.rpc_end_trip(trip_id text)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set status = 'COMPLETED'
  where id = trip_id;
end;
$$;

-- rpc_get_stops_by_district: Fetch stop names in a district
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

-- rpc_get_trips_by_district: Fetch trips with detailed nested relations inside a district
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
    coalesce(b.current_occupancy, 0) as bus_current_occupancy,
    coalesce(b.fare, 14.0) as bus_fare
  from public.trips t
  left join public.routes r on t.route_id = r.id
  left join public.buses b on t.bus_id = b.id
  where t.district = district_name;
end;
$$;

-- rpc_get_tickets_by_user_id: Get tickets of a passenger
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

-- rpc_get_buses_with_routes: Fetch buses list formatted with route names and stops
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

-- rpc_get_bus_by_id: Fetch a bus profile by id
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

