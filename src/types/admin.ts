import { UserRole, TripStatus, TicketStatus } from '../types';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'MASTER_ADMIN' | 'ADMIN' | 'OPERATIONS' | 'FINANCE' | 'SUPPORT' | 'CONDUCTOR';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AdminRoute {
  id: number;
  name: string;
  code: string;
  num_stops: number;
  status: 'ACTIVE' | 'INACTIVE';
  district: string;
  zone: string;
  stops?: string[]; // Default stops
  day_schedules?: {
    [key: string]: string[]; // key: 'MONDAY', 'TUESDAY', etc. value: list of stops
  };
  special_overrides?: {
    [date: string]: string[]; // ISO date string: list of specific stops
  };
}

export interface AdminStop {
  id: string;
  route_id: number;
  name: string;
  lat: number;
  lng: number;
  order_index: number;
}

export interface AdminBus {
  id: string;
  reg_no?: string; // Adding reg_no for consistency with mock data
  registration_number: string;
  route_id: number;
  route_name: string;
  capacity: number;
  depot: string;
  status: 'ACTIVE' | 'MAINTENANCE';
  district: string;
  zone: string;
}

export interface ETMDevice {
  id: string;
  assigned_bus_id: string | null;
  last_seen: string;
  status: 'ONLINE' | 'OFFLINE';
}

export interface AdminTrip {
  id: string;
  route_id: number;
  route_name: string;
  bus_id: string;
  bus_number: string;
  planned_start_time: string;
  actual_start_time: string | null;
  status: 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  district: string;
  zone: string;
}

export interface LiveTrip extends AdminTrip {
  current_segment: string;
  last_gps_time: string;
  delay_minutes: number;
  onboard_passengers: number;
  occupancy_percent: number;
  etm_status: 'ONLINE' | 'OFFLINE';
}

export interface AdminTicket {
  id: string;
  trip_id: string;
  channel: 'APP' | 'ETM';
  passenger_phone: string | null;
  origin_stop: string;
  destination_stop: string;
  seats: number;
  fare: number;
  status: TicketStatus;
  created_at: string;
}

export interface RevenueSummary {
  total_revenue: number;
  total_tickets: number;
  avg_fare: number;
  revenue_by_route: { route_name: string; revenue: number }[];
  revenue_by_channel: { channel: string; revenue: number }[];
  top_buses: { bus_number: string; revenue: number }[];
}

export interface IdleAlert {
  id: string;
  bus_id: string;
  bus_number: string;
  lat: number;
  lng: number;
  idle_duration_minutes: number;
  timestamp: string;
  status: 'PENDING' | 'RESOLVED' | 'ACKNOWLEDGED';
}

export interface DashboardStats {
  today_trips: {
    total: number;
    active: number;
    completed: number;
  };
  today_tickets: {
    total: number;
    app: number;
    etm: number;
  };
  today_revenue: {
    total: number;
    top_routes: { route_name: string; revenue: number }[];
  };
  alerts: {
    id: string;
    type: 'GPS_OFFLINE' | 'HIGH_LOAD' | 'LATE_TRIP' | 'IDLE_BUS';
    message: string;
    timestamp: string;
    bus_id?: string;
    idle_duration?: number;
    location?: { lat: number; lng: number };
  }[];
  total_passengers: number;
}
