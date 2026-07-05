-- Create Nigazhthisai database schema for Supabase

-- Enable required extensions
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- PROFILES TABLE (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  phone text,
  role text not null default 'PASSENGER' check (role in ('MASTER_ADMIN', 'ADMIN', 'DRIVER', 'CONDUCTOR', 'PASSENGER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROUTES TABLE
create table public.routes (
  id serial primary key,
  name text not null,
  code text not null unique,
  num_stops integer default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  district text,
  zone text,
  stops jsonb default '[]'::jsonb, -- Array of stop names or objects
  day_schedules jsonb default '{}'::jsonb, -- Weekly day schedules
  special_overrides jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BUSES TABLE
create table public.buses (
  id text primary key, -- Support custom IDs like '32', '40C', 'bus-1'
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

-- TRIPS TABLE (running or scheduled bus schedules)
create table public.trips (
  id text primary key, -- Custom ID like 'TRIP-123456'
  route_id integer references public.routes(id) on delete cascade,
  bus_id text references public.buses(id) on delete set null,
  driver_name text,
  conductor_name text,
  start_time text, -- e.g., '08:00 AM'
  end_time text,
  status text not null default 'PLANNED' check (status in ('PLANNED', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED')),
  occupancy integer not null default 0,
  district text,
  zone text,
  
  -- Live metrics
  current_segment text,
  last_gps_time timestamp with time zone,
  delay_minutes integer not null default 0,
  onboard_passengers integer not null default 0,
  occupancy_percent integer not null default 0,
  etm_status text not null default 'OFFLINE' check (etm_status in ('ONLINE', 'OFFLINE')),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TICKETS TABLE
create table public.tickets (
  id text primary key, -- Custom ID like 'NIG-123456' or 'TK6FQRGO'
  user_id uuid references public.profiles(id) on delete set null,
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

-- BOOKINGS TABLE (temporary booking requests)
create table public.bookings (
  id text primary key, -- Custom ID like 'BK-123456'
  bus_id text references public.buses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  from_stop text not null,
  to_stop text not null,
  seats integer not null default 1,
  amount numeric not null,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SEAT SEGMENTS (bus capacity tracker per stop segment)
create table public.seat_segments (
  bus_id text references public.buses(id) on delete cascade,
  from_stop text not null,
  to_stop text not null,
  occupied_seats integer not null default 0,
  primary key (bus_id, from_stop, to_stop)
);

-- COMPLAINTS TABLE
create table public.complaints (
  id serial primary key,
  bus_id text references public.buses(id) on delete cascade,
  type text not null,
  description text not null,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ALERTS TABLE
create table public.alerts (
  id serial primary key,
  type text not null check (type in ('GPS_OFFLINE', 'HIGH_LOAD', 'LATE_TRIP', 'IDLE_BUS')),
  message text not null,
  bus_id text references public.buses(id) on delete cascade,
  idle_duration integer,
  location jsonb, -- {lat, lng}
  status text not null default 'PENDING' check (status in ('PENDING', 'RESOLVED', 'ACKNOWLEDGED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SHOPS TABLE (stop amenities / local deals)
create table public.shops (
  id text primary key,
  stop_id text,
  name text not null,
  description text,
  deal text,
  lat numeric,
  lng numeric,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STOPS TABLE (master stop locations)
create table public.stops (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  district text,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INDEXES FOR PERFORMANCE
create index idx_buses_route_id on public.buses(route_id);
create index idx_trips_bus_id on public.trips(bus_id);
create index idx_trips_route_id on public.trips(route_id);
create index idx_tickets_user_id on public.tickets(user_id);
create index idx_tickets_trip_id on public.tickets(trip_id);
create index idx_bookings_user_id on public.bookings(user_id);
create index idx_complaints_bus_id on public.complaints(bus_id);
create index idx_alerts_bus_id on public.alerts(bus_id);

-- AUTOMATIC UPDATED_AT TRIGGER
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at_column();
create trigger update_routes_updated_at before update on public.routes for each row execute procedure public.update_updated_at_column();
create trigger update_buses_updated_at before update on public.buses for each row execute procedure public.update_updated_at_column();
create trigger update_trips_updated_at before update on public.trips for each row execute procedure public.update_updated_at_column();
create trigger update_tickets_updated_at before update on public.tickets for each row execute procedure public.update_updated_at_column();
create trigger update_bookings_updated_at before update on public.bookings for each row execute procedure public.update_updated_at_column();

-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role text;
  default_name text;
begin
  default_role := coalesce(new.raw_user_meta_data->>'role', 'PASSENGER');
  default_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  
  insert into public.profiles (id, email, name, phone, role, status)
  values (
    new.id,
    new.email,
    default_name,
    new.phone,
    default_role,
    'ACTIVE'
  )
  on conflict (id) do update
  set email = excluded.email,
      phone = coalesce(excluded.phone, public.profiles.phone),
      name = coalesce(excluded.name, public.profiles.name);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ENABLE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.buses enable row level security;
alter table public.trips enable row level security;
alter table public.tickets enable row level security;
alter table public.bookings enable row level security;
alter table public.seat_segments enable row level security;
alter table public.complaints enable row level security;
alter table public.alerts enable row level security;
alter table public.shops enable row level security;
alter table public.stops enable row level security;

-- RLS POLICIES

-- PROFILES
create policy "Read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'OPERATIONS')
);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins update any profile" on public.profiles for update using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);
create policy "Admins delete profiles" on public.profiles for delete using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN')
);

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


-- SEED DEFAULT USERS (Uses pgcrypto to hash passwords if executing via fresh project script)
-- Password for master@nigazhthisai.com is 'master123'
-- Password for admin@nigazhthisai.com is 'admin123'
-- Password for conductor@nigazhthisai.com is 'conductor123'
-- Password for passenger@nigazhthisai.com is 'passenger123'

insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '00000000-0000-0000-0000-000000000000', 'master@nigazhthisai.com', extensions.crypt('master123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Master Admin","role":"MASTER_ADMIN"}', 'authenticated', 'authenticated'),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', '00000000-0000-0000-0000-000000000000', 'admin@nigazhthisai.com', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Admin Manager","role":"ADMIN"}', 'authenticated', 'authenticated'),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', '00000000-0000-0000-0000-000000000000', 'conductor@nigazhthisai.com', extensions.crypt('conductor123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Conductor Ramesh","role":"CONDUCTOR"}', 'authenticated', 'authenticated'),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', '00000000-0000-0000-0000-000000000000', 'passenger@nigazhthisai.com', extensions.crypt('passenger123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Passenger Kumar","role":"PASSENGER"}', 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- SEED MASTER STOPS
insert into public.stops (name, district, lat, lng)
values 
  ('Koyambedu (CMBT)', 'Chennai', 13.0733, 80.1914),
  ('Central Railway Station', 'Chennai', 13.0827, 80.2707),
  ('Vadapalani', 'Chennai', 13.0500, 80.2120),
  ('Ashok Nagar', 'Chennai', 13.0354, 80.2111),
  ('Guindy', 'Chennai', 13.0067, 80.2206),
  ('Tambaram', 'Chennai', 12.9229, 80.1275),
  ('Mattuthavani', 'Madurai', 9.9400, 78.1500),
  ('Periyar Bus Stand', 'Madurai', 9.9168, 78.1128),
  ('Gandhipuram', 'Coimbatore', 11.0183, 76.9686),
  ('Ukkadam', 'Coimbatore', 10.9950, 76.9620),
  ('Old Bus Stand', 'Tiruppur', 11.1085, 77.3411),
  ('New Bus Stand', 'Tiruppur', 11.1200, 77.3600),
  ('Pushpa Theatre', 'Tiruppur', 11.1150, 77.3500),
  ('Kumar Nagar', 'Tiruppur', 11.1250, 77.3550),
  ('Avinashi', 'Tiruppur', 11.1930, 77.2688)
on conflict (name) do nothing;

-- SEED MASTER ROUTES
insert into public.routes (id, name, code, num_stops, status, district, zone, stops, day_schedules)
values 
  (1, 'Tiruppur Old Bus Stand – Avinashi', 'TUP-AVI', 5, 'ACTIVE', 'Tiruppur', 'West', 
   '["Old Bus Stand", "Pushpa Theatre", "Kumar Nagar", "New Bus Stand", "Avinashi"]'::jsonb, 
   '{"FRIDAY": ["Old Bus Stand", "Pushpa Theatre", "Kumar Nagar", "New Bus Stand", "Thendral Nagar", "Avinashi"]}'::jsonb),
  (2, 'Koyambedu – Tambaram', 'CHE-TAM', 5, 'ACTIVE', 'Chennai', 'North', 
   '["Koyambedu (CMBT)", "Vadapalani", "Ashok Nagar", "Guindy", "Tambaram"]'::jsonb, 
   '{"SUNDAY": ["Koyambedu (CMBT)", "Vadapalani", "Ashok Nagar", "Guindy", "Vandalur Zoo", "Tambaram"]}'::jsonb),
  (3, 'Gandhipuram – Ukkadam', 'CBE-UKD', 4, 'ACTIVE', 'Coimbatore', 'West', 
   '["Gandhipuram", "RS Puram", "Peelamedu", "Ukkadam"]'::jsonb, '{}'::jsonb),
  (4, 'Madurai – Periyar', 'MAD-PER', 4, 'ACTIVE', 'Madurai', 'South', 
   '["Mattuthavani", "Anna Nagar", "Goripalayam", "Periyar Bus Stand"]'::jsonb, '{}'::jsonb)
on conflict (id) do update 
set name = excluded.name, code = excluded.code, stops = excluded.stops, day_schedules = excluded.day_schedules;

-- SEED MASTER BUSES
insert into public.buses (id, registration_number, route_id, capacity, current_lat, current_lng, occupancy, current_occupancy, fare, eta, district, zone, status, model, type, etm_id)
values 
  ('32', 'TN 39 AB 1234', 1, 50, 11.1085, 77.3411, 'medium', 18, 14.0, 5, 'Tiruppur', 'West', 'ACTIVE', 'Leyland Viking', 'AC', 'ETM-001'),
  ('12', 'TN 01 CD 5678', 2, 50, 12.9229, 80.1275, 'high', 42, 20.0, 7, 'Chennai', 'North', 'ACTIVE', 'Volvo 9400', 'NON-AC', 'ETM-002'),
  ('45', 'TN 66 GH 3456', 3, 50, 11.0168, 76.9558, 'low', 10, 15.0, 10, 'Coimbatore', 'West', 'ACTIVE', 'Eicher Pro', 'AC', 'ETM-003'),
  ('102', 'TN 43 GH 9012', 4, 50, 9.9168, 78.1128, 'low', 0, 12.0, 3, 'Madurai', 'South', 'ACTIVE', 'Leyland Viking', 'NON-AC', 'ETM-004')
on conflict (id) do update
set registration_number = excluded.registration_number, route_id = excluded.route_id, current_lat = excluded.current_lat, current_lng = excluded.current_lng;

-- SEED SEAT SEGMENTS
insert into public.seat_segments (bus_id, from_stop, to_stop, occupied_seats)
values 
  ('32', 'Old Bus Stand', 'Pushpa Theatre', 5),
  ('32', 'Pushpa Theatre', 'Kumar Nagar', 12),
  ('32', 'Kumar Nagar', 'New Bus Stand', 18),
  ('32', 'New Bus Stand', 'Avinashi', 18),
  ('12', 'Koyambedu (CMBT)', 'Vadapalani', 10),
  ('12', 'Vadapalani', 'Ashok Nagar', 25),
  ('12', 'Ashok Nagar', 'Guindy', 40),
  ('12', 'Guindy', 'Tambaram', 42)
on conflict (bus_id, from_stop, to_stop) do update
set occupied_seats = excluded.occupied_seats;

-- SEED MASTER TRIPS
insert into public.trips (id, route_id, bus_id, driver_name, conductor_name, start_time, status, occupancy, district, zone)
values 
  ('T1', 1, '32', 'Ramesh', 'Suresh', '08:00 AM', 'RUNNING', 18, 'Tiruppur', 'West'),
  ('T2', 2, '12', 'Kumar', 'Mani', '09:30 AM', 'SCHEDULED', 0, 'Chennai', 'North'),
  ('T3', 3, '45', 'Anbu', 'Selvam', '10:15 AM', 'RUNNING', 10, 'Coimbatore', 'West')
on conflict (id) do update
set status = excluded.status, occupancy = excluded.occupancy;

-- SEED AMENITY SHOPS
insert into public.shops (id, stop_id, name, description, deal, lat, lng, status)
values 
  ('1', 'Koyambedu (CMBT)', 'Hotel Annapoorna', 'Famous for South Indian coffee and hot idlis', 'Free Coffee with Main Meal', 13.0733, 80.1914, 'ACTIVE'),
  ('2', 'Central Railway Station', 'City Textiles', 'Premium traditional and modern clothing', '10% Discount on bills above ₹1000', 13.0827, 80.2707, 'ACTIVE'),
  ('3', 'Mattuthavani', 'Famous Jigarthanda', 'Iconic sweet milk beverage of Madurai', 'Buy 1 Get 1 Free on Mini Cup', 9.9400, 78.1500, 'ACTIVE')
on conflict (id) do update
set name = excluded.name, description = excluded.description, deal = excluded.deal;
