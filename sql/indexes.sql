-- ========================================================
-- NIGAZHTHISAI PERFORMANCE INDEXES
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
