-- ========================================================
-- NIGAZHTHISAI DATABASE VIEWS
-- ========================================================

-- 1. View of Active Trips with details
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

-- 2. View of Daily Ticket Collection
create or replace view public.view_daily_revenue as
select 
  date,
  channel,
  count(id) as total_tickets_sold,
  sum(seats) as total_passengers,
  sum(fare) as total_revenue
from public.tickets
group by date, channel;
