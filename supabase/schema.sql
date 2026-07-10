-- ========================================================
-- NIGAZHTHISAI DATABASE SCHEMA V2
-- ========================================================

-- Enable required extensions
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- 1. DISTRICTS TABLE
create table public.districts (
  id serial primary key,
  name text not null unique,
  lat numeric not null,
  lon numeric not null
);

-- 2. CODES TABLE
create table public.codes (
  code text primary key,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ROUTES TABLE
create table public.routes (
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

-- 4. ETM TABLE
create table public.etm (
  id text primary key,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. BUSES TABLE
create table public.buses (
  id text primary key, -- Support custom IDs like '32', '40C', 'bus-1'
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

-- 6. TRIPS TABLE
create table public.trips (
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

-- 7. RAZORPAY ORDERS TABLE
create table public.razorpay_orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'CREATED' check (status in ('CREATED', 'PAID', 'FAILED')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 8. RAZORPAY PAYMENTS TABLE
create table public.razorpay_payments (
  id text primary key,
  order_id text references public.razorpay_orders(id) on delete cascade,
  signature text not null,
  status text not null default 'VERIFIED',
  created_at timestamp with time zone default now()
);

-- 9. TRANSACTIONS TABLE
create table public.transactions (
  id text primary key,
  amount numeric not null,
  status text not null default 'SUCCESS',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. TICKETS TABLE
create table public.tickets (
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

-- 11. BOOKINGS TABLE
create table public.bookings (
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

-- 12. COMPLAINTS TABLE
create table public.complaints (
  id serial primary key,
  bus_id text references public.buses(id) on delete cascade,
  type text not null,
  description text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. ALERTS TABLE
create table public.alerts (
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

-- Trigger function to construct SOS messages dynamically
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

-- 14. STOPS TABLE
create table public.stops (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  district integer references public.districts(id) on delete set null,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.districts enable row level security;
alter table public.codes enable row level security;
alter table public.routes enable row level security;
alter table public.etm enable row level security;
alter table public.buses enable row level security;
alter table public.trips enable row level security;
alter table public.razorpay_orders enable row level security;
alter table public.razorpay_payments enable row level security;
alter table public.transactions enable row level security;
alter table public.tickets enable row level security;
alter table public.bookings enable row level security;
alter table public.complaints enable row level security;
alter table public.alerts enable row level security;
alter table public.stops enable row level security;

-- 15. RLS POLICIES
create policy "Public read districts" on public.districts for select using (true);
create policy "Admins modify districts" on public.districts for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read codes" on public.codes for select using (true);
create policy "Admins modify codes" on public.codes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Read own bookings" on public.bookings for select using (user_id = auth.uid());
create policy "Create own bookings" on public.bookings for insert with check (user_id = auth.uid());
create policy "Update own bookings" on public.bookings for update using (user_id = auth.uid());
create policy "Admins read all bookings" on public.bookings for select using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read routes" on public.routes for select using (true);
create policy "Admins modify routes" on public.routes for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read buses" on public.buses for select using (true);
create policy "Admins modify buses" on public.buses for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read trips" on public.trips for select using (true);
create policy "Admins/Conductors modify trips" on public.trips for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));

create policy "Passengers view own tickets" on public.tickets for select using (user_id = auth.uid());
create policy "Admins/Conductors view tickets" on public.tickets for select using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'CONDUCTOR'));
create policy "Create tickets" on public.tickets for insert with check (user_id = auth.uid() or (auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR');

create policy "Create complaints" on public.complaints for insert with check (true);
create policy "Admins manage complaints" on public.complaints for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Admins read and acknowledge alerts" on public.alerts for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN', 'OPERATIONS'));
create policy "Conductors create alerts" on public.alerts for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'CONDUCTOR');
create policy "Passengers read own alerts" on public.alerts for select using (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-000000000000');

create policy "Read stops" on public.stops for select using (true);
create policy "Admins manage stops" on public.stops for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

create policy "Public read etm" on public.etm for select using (true);
create policy "Admins modify etm" on public.etm for all using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('MASTER_ADMIN', 'ADMIN'));

-- 16. SEED DATA
-- Districts Seeds
insert into public.districts (id, name, lat, lon) values
  (1, 'Tiruppur', 11.1085, 77.3411),
  (2, 'Chennai', 13.0827, 80.2707),
  (3, 'Madurai', 9.9252, 78.1198),
  (4, 'Coimbatore', 11.0168, 76.9558),
  (5, 'Salem', 11.6643, 78.1460),
  (6, 'Trichy', 10.7905, 78.7047),
  (7, 'Erode', 11.3410, 77.7172)
on conflict (id) do nothing;

-- Codes Seeds
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

-- Route Seeds
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

-- ETM Seeds
insert into public.etm (id, status)
values
  ('ETM-001', 'ACTIVE'),
  ('ETM-002', 'ACTIVE'),
  ('ETM-003', 'ACTIVE'),
  ('ETM-004', 'ACTIVE')
on conflict (id) do nothing;

-- Bus Seeds
insert into public.buses (id, registration_number, route_id, capacity, current_lat, current_lng, occupancy, district, status, model, type, etm_id)
values 
  ('32', 'TN 39 AB 1234', 1, 50, 11.1085, 77.3411, 'medium', 1, 'ACTIVE', 'Leyland Viking', 'AC', 'ETM-001'),
  ('12', 'TN 01 CD 5678', 2, 50, 12.9229, 80.1275, 'high', 2, 'ACTIVE', 'Volvo 9400', 'NON-AC', 'ETM-002'),
  ('45', 'TN 66 GH 3456', 3, 50, 11.0168, 76.9558, 'low', 4, 'ACTIVE', 'Eicher Pro', 'AC', 'ETM-003'),
  ('102', 'TN 43 GH 9012', 4, 50, 9.9168, 78.1128, 'low', 3, 'ACTIVE', 'Leyland Viking', 'NON-AC', 'ETM-004')
on conflict (id) do update
set registration_number = excluded.registration_number, route_id = excluded.route_id, current_lat = excluded.current_lat, current_lng = excluded.current_lng;

-- Stops Seeds
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
