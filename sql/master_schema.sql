-- ========================================================
-- NIGAZHTHISAI MASTER DATABASE SCHEMA V2
-- ========================================================

-- Enable required extensions
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- 1. DISTRICTS TABLE
create table if not exists public.districts (
  id serial primary key,
  name text not null unique,
  lat numeric not null,
  lon numeric not null
);

-- 2. CODES TABLE
create table if not exists public.codes (
  code text primary key,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ROUTES TABLE
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

-- 4. ETM TABLE
create table if not exists public.etm (
  id text primary key,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. BUSES TABLE
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

-- 6. TRIPS TABLE
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

-- 7. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id text primary key,
  amount numeric not null,
  status text not null default 'SUCCESS',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TICKETS TABLE
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

-- 9. BOOKINGS TABLE
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

-- 10. COMPLAINTS TABLE
create table if not exists public.complaints (
  id serial primary key,
  bus_id text references public.buses(id) on delete cascade,
  type text not null,
  description text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. ALERTS TABLE
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

-- Trigger to construct alert message dynamically from user_id and location on insert
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

-- 12. STOPS TABLE
create table if not exists public.stops (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  district integer references public.districts(id) on delete set null,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. AUDIT LOGS TABLE
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