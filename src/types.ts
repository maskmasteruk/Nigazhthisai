export type Occupancy = 'low' | 'medium' | 'high';
export type UserRole = 'PASSENGER' | 'CONDUCTOR' | 'ADMIN';
export type TripStatus = 'PLANNED' | 'RUNNING' | 'COMPLETED';
export type TicketStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'BOARDED' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Stop {
  id?: string;
  route_id?: number;
  name: string;
  lat: number;
  lng: number;
  order_index?: number;
  district?: string;
}

export interface Route {
  id: number;
  name: string;
  stops: Stop[];
  created_at: string;
}

export interface Bus {
  id: string;
  route_id: number;
  registration_number: string;
  capacity: number;
  current_lat: number;
  current_lng: number;
  last_updated: string;
  district?: string;
  fare?: number;
}

export interface Trip {
  id: string;
  bus_id: string;
  bus_name?: string;
  route_id: number;
  start_time: string;
  end_time: string | null;
  status: TripStatus;
}

export interface Ticket {
  id: string;
  user_id: string | null;
  trip_id: string;
  bus_name: string;
  origin_stop_id: string;
  destination_stop_id: string;
  from_stop: string;
  to_stop: string;
  channel: 'APP' | 'ETM';
  status: TicketStatus;
  fare: number;
  seats: number;
  qr_payload: string;
  date: string;
  timestamp: string;
}

export interface GPSLog {
  id: string;
  trip_id: string;
  bus_id: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface Complaint {
  id: number;
  bus_id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface TripRecord {
  id: string;
  bus_name: string;
  start_time: string;
  end_time: string;
  stops: string[];
}

export type ViewMode = 'passenger' | 'driver' | 'admin';
export type AppState = 
  | 'splash' 
  | 'login' 
  | 'main' 
  | 'search' 
  | 'booking' 
  | 'ticket_detail' 
  | 'scanner' 
  | 'history' 
  | 'bus_detail' 
  | 'complaint' 
  | 'settings'
  | 'conductor_trips'
  | 'conductor_trip_detail'
  | 'admin_dashboard'
  | 'admin_live'
  | 'admin_master';
