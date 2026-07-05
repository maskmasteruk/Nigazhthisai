-- ========================================================
-- NIGAZHTHISAI MASTER DATABASE SCHEMA
-- ========================================================

-- Enable required extensions
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- 2. ROUTES TABLE
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

-- 3. BUSES TABLE
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

-- 4. TRIPS TABLE
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

-- 5. TICKETS TABLE
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

-- 6. BOOKINGS TABLE
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

-- 7. COMPLAINTS TABLE
create table if not exists public.complaints (
  id serial primary key,
  bus_id text references public.buses(id) on delete cascade,
  type text not null,
  description text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. ALERTS TABLE
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

-- 9. STOPS TABLE
create table if not exists public.stops (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  district text,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. AUDIT LOGS TABLE
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