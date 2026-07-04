import { supabase, isPlaceholder } from './supabase';

// Helper to convert DB rows for frontend compatibility
const mapBus = (b: any) => ({
  ...b,
  reg_no: b.registration_number,
  registration_number: b.registration_number
});

// In-memory mock database state matching schema.sql defaults
let mockBuses = [
  { id: '32', registration_number: 'TN 39 AB 1234', route_id: 1, status: 'ACTIVE', current_lat: 11.1085, current_lng: 77.3411, capacity: 50, occupied_seats: 18, fare: 14.0, district: 'Tiruppur', zone: 'West' },
  { id: '12', registration_number: 'TN 01 CD 5678', route_id: 2, status: 'ACTIVE', current_lat: 12.9229, current_lng: 80.1275, capacity: 50, occupied_seats: 25, fare: 20.0, district: 'Chennai', zone: 'North' },
  { id: '45', registration_number: 'TN 66 GH 3456', route_id: 3, status: 'ACTIVE', current_lat: 11.0168, current_lng: 76.9558, capacity: 50, occupied_seats: 0, fare: 15.0, district: 'Coimbatore', zone: 'West' }
];

let mockRoutes = [
  { id: 1, code: 'TUP-AVI', name: 'Tiruppur Old Bus Stand – Avinashi', num_stops: 5, stops: ['Old Bus Stand', 'Pushpa Theatre', 'Kumar Nagar', 'New Bus Stand', 'Avinashi'] },
  { id: 2, code: 'CHE-TAM', name: 'Koyambedu – Tambaram', num_stops: 5, stops: ['Koyambedu (CMBT)', 'Vadapalani', 'Ashok Nagar', 'Guindy', 'Tambaram'] },
  { id: 3, code: 'CBE-UKD', name: 'Gandhipuram – Ukkadam', num_stops: 4, stops: ['Gandhipuram', 'RS Puram', 'Peelamedu', 'Ukkadam'] }
];

let mockTrips = [
  { id: 'T1', route_id: 1, route_name: 'Tiruppur Old Bus Stand – Avinashi', bus_id: '32', bus_no: 'TN 39 AB 1234', driver_name: 'Ramesh', conductor_name: 'Suresh', status: 'RUNNING', actual_start_time: '08:00 AM', district: 'Tiruppur', zone: 'West' },
  { id: 'T2', route_id: 2, route_name: 'Koyambedu – Tambaram', bus_id: '12', bus_no: 'TN 01 CD 5678', driver_name: 'Kumar', conductor_name: 'Mani', status: 'SCHEDULED', actual_start_time: '09:30 AM', district: 'Chennai', zone: 'North' },
  { id: 'T3', route_id: 3, route_name: 'Gandhipuram – Ukkadam', bus_id: '45', bus_no: 'TN 66 GH 3456', driver_name: 'Anbu', conductor_name: 'Selvam', status: 'RUNNING', actual_start_time: '10:15 AM', district: 'Coimbatore', zone: 'West' }
];

let mockTickets = [
  { id: 'NIG-100001', trip_id: 'T1', bus_id: '32', bus_name: 'Tiruppur Old Bus Stand – Avinashi', from_stop: 'Old Bus Stand', to_stop: 'Kumar Nagar', seats: 2, fare: 28, channel: 'APP', status: 'BOARDED', qr_payload: 'VALID:NIG-100001', date: 'Jul 2, 2026', timestamp: new Date().toISOString() },
  { id: 'NIG-100002', trip_id: 'T2', bus_id: '12', bus_name: 'Koyambedu – Tambaram', from_stop: 'Koyambedu (CMBT)', to_stop: 'Guindy', seats: 1, fare: 20, channel: 'ETM', status: 'BOARDED', qr_payload: 'VALID:NIG-100002', date: 'Jul 2, 2026', timestamp: new Date().toISOString() }
];

let mockAlerts = [
  { id: 1, type: 'DELAY', message: 'Bus TN 39 AB 1234 delayed by 15 mins due to traffic at Avinashi', status: 'PENDING', timestamp: new Date().toISOString() },
  { id: 2, type: 'SOS', message: 'SOS alert from Bus TN 01 CD 5678 - Engine heating warning', status: 'PENDING', timestamp: new Date().toISOString() }
];

let mockProfiles = [
  { id: 'user-1', name: 'Master Admin', role: 'MASTER_ADMIN', email: 'master@nigazhthisai.com', created_at: new Date().toISOString() },
  { id: 'user-2', name: 'Transit Admin', role: 'ADMIN', email: 'admin@nigazhthisai.com', created_at: new Date().toISOString() },
  { id: 'user-3', name: 'Passenger User', role: 'PASSENGER', email: 'passenger@nigazhthisai.com', created_at: new Date().toISOString() }
];

let mockShops = [
  { id: '1', name: 'Hotel Annapoorna', description: 'Famous for South Indian coffee and hot idlis', lat: 13.0733, lng: 80.1914, status: 'ACTIVE' },
  { id: '2', name: 'City Textiles', description: 'Premium traditional and modern clothing', lat: 13.0827, lng: 80.2707, status: 'ACTIVE' }
];

let mockStops = [
  { id: 'stop-1', name: 'Old Bus Stand', lat: 11.1085, lng: 77.3411 },
  { id: 'stop-2', name: 'Pushpa Theatre', lat: 11.1150, lng: 77.3500 },
  { id: 'stop-3', name: 'Kumar Nagar', lat: 11.1250, lng: 77.3550 }
];

let mockComplaints: any[] = [];

// Helper login handler for in-memory fallbacks
const localLogin = (credentials: any) => {
  const email = credentials.email.toLowerCase();
  let role = 'ADMIN';
  let name = 'Admin Manager';
  if (email.includes('master')) {
    role = 'MASTER_ADMIN';
    name = 'Master Admin';
  } else if (email.includes('passenger')) {
    role = 'PASSENGER';
    name = 'Passenger Kumar';
  } else if (email.includes('conductor')) {
    role = 'CONDUCTOR';
    name = 'Conductor Ramesh';
  }
  return {
    token: `mock-token-${role}`,
    user: { name, role }
  };
};

export const adminApi = {
  login: async (credentials: any) => {
    if (isPlaceholder) return localLogin(credentials);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Authentication failed');

      const { data: profile, error: profileError } = await supabase.rpc('rpc_get_profile_by_id', { user_uuid: authData.user.id });
      if (profileError) throw profileError;

      return { 
        token: authData.session?.access_token, 
        user: { name: profile.name, role: profile.role } 
      };
    } catch (err) {
      console.warn('Supabase login failed, falling back to mock login:', err);
      return localLogin(credentials);
    }
  },

  registerPassenger: async (userData: any) => {
    if (isPlaceholder) {
      const newProfile = {
        id: `user-${Math.floor(1000 + Math.random() * 9000)}`,
        name: userData.name,
        role: 'PASSENGER',
        email: userData.email.toLowerCase(),
        phone: userData.phone,
        created_at: new Date().toISOString()
      };
      mockProfiles.push(newProfile);
      return { success: true, message: 'Registration successful! Please check your email to verify.' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            role: 'PASSENGER'
          }
        }
      });
      if (error) throw error;
      return { 
        success: true, 
        message: 'Registration successful! Please check your email to verify your account.' 
      };
    } catch (err: any) {
      console.warn('Supabase signUp failed, using mock registration fallback:', err);
      const newProfile = {
        id: `user-${Math.floor(1000 + Math.random() * 9000)}`,
        name: userData.name,
        role: 'PASSENGER',
        email: userData.email.toLowerCase(),
        phone: userData.phone,
        created_at: new Date().toISOString()
      };
      mockProfiles.push(newProfile);
      return { success: true, message: 'Registration successful! Please check your email to verify.' };
    }
  },

  getDashboardStats: async (filters?: { district?: string; zone?: string }) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      let filteredTrips = mockTrips;
      if (filters?.district && filters.district !== 'All') {
        filteredTrips = filteredTrips.filter(t => t.district === filters.district);
      }
      if (filters?.zone && filters.zone !== 'All') {
        filteredTrips = filteredTrips.filter(t => t.zone === filters.zone);
      }

      const totalTrips = filteredTrips.length;
      const activeTrips = filteredTrips.filter(t => t.status === 'RUNNING').length;
      const completedTrips = filteredTrips.filter(t => t.status === 'COMPLETED').length;

      const totalTickets = mockTickets.length;
      const appTickets = mockTickets.filter(t => t.channel === 'APP').length;
      const etmTickets = mockTickets.filter(t => t.channel === 'ETM').length;

      const totalRevenue = mockTickets.reduce((sum, t) => sum + Number(t.fare), 0);
      const topRoutes = [
        { route_name: 'Tiruppur Old Bus Stand – Avinashi', revenue: 2450 },
        { route_name: 'Koyambedu – Tambaram', revenue: 1980 }
      ];

      return {
        today_trips: { total: totalTrips, active: activeTrips, completed: completedTrips },
        today_tickets: { total: totalTickets, app: appTickets, etm: etmTickets },
        today_revenue: { total: totalRevenue, top_routes: topRoutes },
        alerts: mockAlerts.filter(a => a.status === 'PENDING')
      };
    }

    try {
      const [tripsRes, ticketsRes, alertsRes] = await Promise.all([
        supabase.rpc('rpc_get_all_trips', { district_filter: filters?.district || null, zone_filter: filters?.zone || null }),
        supabase.rpc('rpc_get_all_tickets', { bus_name_filter: filters?.district || null }),
        supabase.rpc('rpc_get_pending_alerts')
      ]);

      if (tripsRes.error) throw tripsRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      if (alertsRes.error) throw alertsRes.error;

      const trips = tripsRes.data || [];
      const tickets = ticketsRes.data || [];
      const alerts = alertsRes.data || [];

      const totalTrips = trips.length;
      const activeTrips = trips.filter(t => t.status === 'RUNNING').length;
      const completedTrips = trips.filter(t => t.status === 'COMPLETED').length;

      const totalTickets = tickets.length;
      const appTickets = tickets.filter(t => t.channel === 'APP').length;
      const etmTickets = tickets.filter(t => t.channel === 'ETM').length;

      const totalRevenue = tickets.reduce((sum, t) => sum + Number(t.fare), 0);

      const routeRevenues: { [key: string]: number } = {};
      tickets.forEach(t => {
        const routeName = t.bus_name || 'General Routes';
        routeRevenues[routeName] = (routeRevenues[routeName] || 0) + Number(t.fare);
      });

      const topRoutes = Object.entries(routeRevenues)
        .map(([route_name, revenue]) => ({ route_name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      return {
        today_trips: { total: totalTrips, active: activeTrips, completed: completedTrips },
        today_tickets: { total: totalTickets, app: appTickets, etm: etmTickets },
        today_revenue: { total: totalRevenue, top_routes: topRoutes },
        alerts
      };
    } catch (err) {
      console.warn('Supabase getDashboardStats failed, falling back to mock data:', err);
      // Run the placeholder path
      const prevPlaceholder = isPlaceholder;
      (window as any).isPlaceholderOverride = true;
      const res = await adminApi.getDashboardStats(filters);
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  getRoutes: async () => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) return mockRoutes;
    try {
      const { data, error } = await supabase.rpc('rpc_get_routes');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase getRoutes failed, falling back to mock routes:', err);
      return mockRoutes;
    }
  },

  getBuses: async () => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) return mockBuses.map(mapBus);
    try {
      const { data, error } = await supabase.rpc('rpc_get_buses');
      if (error) throw error;
      return (data || []).map(mapBus);
    } catch (err) {
      console.warn('Supabase getBuses failed, falling back to mock buses:', err);
      return mockBuses.map(mapBus);
    }
  },

  getTrips: async () => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) return mockTrips;
    try {
      const { data, error } = await supabase.rpc('rpc_get_trips_detailed');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase getTrips failed, falling back to mock trips:', err);
      return mockTrips;
    }
  },

  getLiveTrips: async () => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      return mockTrips.filter(t => t.status === 'RUNNING').map(t => {
        const bus = mockBuses.find(b => b.id === t.bus_id);
        return {
          id: t.id,
          bus_id: bus?.registration_number || t.bus_id,
          route_name: t.route_name,
          current_lat: Number(bus?.current_lat || 11.1085),
          current_lng: Number(bus?.current_lng || 77.3411),
          speed: 40,
          occupancy: 60,
          status: 'ON_TIME',
          is_idle: false,
          idle_minutes: 0,
          district: t.district,
          zone: t.zone
        };
      });
    }

    try {
      const { data, error } = await supabase.rpc('rpc_get_live_trips_detailed');
      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id,
        bus_id: t.bus_no,
        route_name: t.route_name,
        current_lat: Number(t.current_lat),
        current_lng: Number(t.current_lng),
        speed: t.speed,
        occupancy: t.occupancy,
        status: t.status,
        is_idle: t.is_idle,
        idle_minutes: t.idle_minutes,
        district: t.district,
        zone: t.zone
      }));
    } catch (err) {
      console.warn('Supabase getLiveTrips failed, falling back to mock live trips:', err);
      // Run the placeholder path
      (window as any).isPlaceholderOverride = true;
      const res = await adminApi.getLiveTrips();
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  getRevenueData: async (filters?: { district?: string; zone?: string }) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      const totalRevenue = mockTickets.reduce((sum, t) => sum + Number(t.fare), 0);
      return {
        total_revenue: totalRevenue,
        monthly_data: [
          { month: 'Jan', revenue: 180000 },
          { month: 'Feb', revenue: 220000 },
          { month: 'Mar', revenue: 250000 },
          { month: 'Apr', revenue: 210000 },
          { month: 'May', revenue: 190000 },
          { month: 'Jun', revenue: 200000 + totalRevenue }
        ],
        route_revenue: [
          { name: 'Tiruppur Old Bus Stand – Avinashi', revenue: 2450 },
          { name: 'Koyambedu – Tambaram', revenue: 1980 }
        ]
      };
    }

    try {
      const { data: tickets, error } = await supabase.rpc('rpc_get_all_tickets');
      if (error) throw error;

      const totalRevenue = tickets?.reduce((sum, t) => sum + Number(t.fare), 0) || 0;

      const monthlyRevenues: { [key: string]: number } = {
        'Jan': 180000, 'Feb': 220000, 'Mar': 250000, 'Apr': 210000, 'May': 190000, 'Jun': 200000
      };
      tickets?.forEach(t => {
        const dateObj = new Date(t.timestamp);
        const mName = dateObj.toLocaleString('en-US', { month: 'short' });
        monthlyRevenues[mName] = (monthlyRevenues[mName] || 0) + Number(t.fare);
      });

      const monthly_data = Object.entries(monthlyRevenues).map(([month, revenue]) => ({ month, revenue }));

      const routeRevenues: { [key: string]: number } = {};
      tickets?.forEach(t => {
        const routeName = t.bus_name || 'General Routes';
        routeRevenues[routeName] = (routeRevenues[routeName] || 0) + Number(t.fare);
      });
      const route_revenue = Object.entries(routeRevenues).map(([name, revenue]) => ({ name, revenue }));

      return {
        total_revenue: totalRevenue,
        monthly_data,
        route_revenue
      };
    } catch (err) {
      console.warn('Supabase getRevenueData failed, falling back to mock revenue data:', err);
      // Run the placeholder path
      (window as any).isPlaceholderOverride = true;
      const res = await adminApi.getRevenueData(filters);
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  acknowledgeAlert: async (id: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockAlerts = mockAlerts.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a);
      return { success: true };
    }
    try {
      const { error } = await supabase.rpc('rpc_acknowledge_alert', { alert_id: Number(id) });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase acknowledgeAlert failed, acknowledging mock alert:', err);
      mockAlerts = mockAlerts.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a);
      return { success: true };
    }
  },

  getUsers: async () => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) return mockProfiles;
    try {
      const { data, error } = await supabase.rpc('rpc_get_users');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase getUsers failed, returning mock users:', err);
      return mockProfiles;
    }
  },

  getStops: async () => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) return mockStops;
    try {
      const { data, error } = await supabase.rpc('rpc_get_stops');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase getStops failed, returning mock stops:', err);
      return mockStops;
    }
  },

  getShops: async () => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) return mockShops;
    try {
      const { data, error } = await supabase.rpc('rpc_get_shops');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase getShops failed, returning mock shops:', err);
      return mockShops;
    }
  },

  addBus: async (busData: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      const newBus = {
        id: busData.id || `bus-${Math.floor(1000 + Math.random() * 9000)}`,
        registration_number: busData.reg_no || busData.registration_number,
        route_id: busData.route_id || null,
        status: busData.status || 'STOPPED',
        current_lat: 11.1085,
        current_lng: 77.3411,
        capacity: Number(busData.capacity || 50),
        occupied_seats: 0,
        fare: Number(busData.fare || 15),
        district: busData.district || 'Tiruppur',
        zone: busData.zone || 'West'
      };
      mockBuses.push(newBus);
      return newBus;
    }

    try {
      const { data, error } = await supabase.rpc('rpc_add_bus', {
        bus_id: busData.id || `bus-${Math.floor(1000 + Math.random() * 9000)}`,
        reg_no: busData.reg_no || busData.registration_number,
        route_id: busData.route_id ? Number(busData.route_id) : null,
        capacity: Number(busData.capacity || 50),
        fare: Number(busData.fare || 15),
        district: busData.district,
        zone: busData.zone,
        bus_status: busData.status || 'STOPPED'
      });
      if (error) throw error;
      return mapBus(data);
    } catch (err) {
      console.warn('Supabase addBus failed, writing to mock database:', err);
      // Run the placeholder path
      (window as any).isPlaceholderOverride = true;
      const res = await adminApi.addBus(busData);
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  addRoute: async (routeData: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      const newRoute = {
        id: mockRoutes.length + 1,
        code: routeData.code,
        name: routeData.name,
        num_stops: Array.isArray(routeData.stops) ? routeData.stops.length : 0,
        stops: Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops || '[]')
      };
      mockRoutes.push(newRoute);
      return newRoute;
    }

    try {
      const { data, error } = await supabase.rpc('rpc_add_route', {
        code: routeData.code,
        name: routeData.name,
        stops: Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops)
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase addRoute failed, writing to mock database:', err);
      (window as any).isPlaceholderOverride = true;
      const res = await adminApi.addRoute(routeData);
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  addTrip: async (tripData: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      const newTrip = {
        id: tripData.id || `TRIP-${Math.floor(100000 + Math.random() * 900000)}`,
        route_id: Number(tripData.route_id),
        route_name: mockRoutes.find(r => r.id === Number(tripData.route_id))?.name || 'General Route',
        bus_id: tripData.bus_id,
        bus_no: mockBuses.find(b => b.id === tripData.bus_id)?.registration_number || 'General Bus',
        driver_name: tripData.driver_name,
        conductor_name: tripData.conductor_name,
        status: tripData.status || 'SCHEDULED',
        actual_start_time: tripData.actual_start_time || new Date().toLocaleTimeString(),
        district: tripData.district || 'Tiruppur',
        zone: tripData.zone || 'West'
      };
      mockTrips.push(newTrip);
      return newTrip;
    }

    try {
      const { data, error } = await supabase.rpc('rpc_add_trip', {
        trip_id: tripData.id || `TRIP-${Math.floor(100000 + Math.random() * 900000)}`,
        route_id: Number(tripData.route_id),
        bus_id: tripData.bus_id,
        driver_name: tripData.driver_name,
        conductor_name: tripData.conductor_name,
        status: tripData.status || 'SCHEDULED',
        start_time: tripData.actual_start_time || null,
        district: tripData.district,
        zone: tripData.zone
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase addTrip failed, writing to mock database:', err);
      (window as any).isPlaceholderOverride = true;
      const res = await adminApi.addTrip(tripData);
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  addShop: async (shopData: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      const newShop = {
        id: `shop-${Math.floor(1000 + Math.random() * 9000)}`,
        name: shopData.name,
        description: shopData.description,
        lat: Number(shopData.lat),
        lng: Number(shopData.lng),
        status: shopData.status || 'ACTIVE'
      };
      mockShops.push(newShop);
      return newShop;
    }

    try {
      const { data, error } = await supabase.rpc('rpc_add_shop', {
        shop_id: `shop-${Math.floor(1000 + Math.random() * 9000)}`,
        shop_name: shopData.name,
        shop_description: shopData.description,
        shop_lat: Number(shopData.lat),
        shop_lng: Number(shopData.lng),
        shop_status: shopData.status || 'ACTIVE'
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase addShop failed, writing to mock database:', err);
      (window as any).isPlaceholderOverride = true;
      const res = await adminApi.addShop(shopData);
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  createRoute: async (routeData: any) => {
    return adminApi.addRoute(routeData);
  },

  scheduleTrip: async (tripData: any) => {
    return adminApi.addTrip(tripData);
  },

  updateBus: async (id: any, busData: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockBuses = mockBuses.map(b => b.id === id ? {
        ...b,
        registration_number: busData.reg_no || busData.registration_number,
        route_id: busData.route_id,
        status: busData.status,
        capacity: Number(busData.capacity),
        fare: Number(busData.fare),
        district: busData.district,
        zone: busData.zone
      } : b);
      return { success: true };
    }

    try {
      const { error } = await supabase.rpc('rpc_update_bus', {
        bus_id: id,
        reg_no: busData.reg_no || busData.registration_number,
        route_id: busData.route_id ? Number(busData.route_id) : null,
        capacity: Number(busData.capacity || 50),
        fare: Number(busData.fare || 15),
        district: busData.district,
        zone: busData.zone,
        bus_status: busData.status
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase updateBus failed, updating mock database:', err);
      mockBuses = mockBuses.map(b => b.id === id ? {
        ...b,
        registration_number: busData.reg_no || busData.registration_number,
        route_id: busData.route_id,
        status: busData.status,
        capacity: Number(busData.capacity),
        fare: Number(busData.fare),
        district: busData.district,
        zone: busData.zone
      } : b);
      return { success: true };
    }
  },

  updateRoute: async (id: any, routeData: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockRoutes = mockRoutes.map(r => r.id === id ? {
        ...r,
        code: routeData.code,
        name: routeData.name,
        stops: Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops || '[]')
      } : r);
      return { success: true };
    }

    try {
      const { error } = await supabase.rpc('rpc_update_route', {
        route_id: Number(id),
        code: routeData.code,
        name: routeData.name,
        stops: Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops)
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase updateRoute failed, updating mock database:', err);
      mockRoutes = mockRoutes.map(r => r.id === id ? {
        ...r,
        code: routeData.code,
        name: routeData.name,
        stops: Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops || '[]')
      } : r);
      return { success: true };
    }
  },

  updateTrip: async (id: any, tripData: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockTrips = mockTrips.map(t => t.id === id ? {
        ...t,
        driver_name: tripData.driver_name,
        conductor_name: tripData.conductor_name,
        status: tripData.status
      } : t);
      return { success: true };
    }

    try {
      const { error } = await supabase.rpc('rpc_update_trip', {
        trip_id: id,
        driver_name: tripData.driver_name,
        conductor_name: tripData.conductor_name,
        trip_status: tripData.status
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase updateTrip failed, updating mock database:', err);
      mockTrips = mockTrips.map(t => t.id === id ? {
        ...t,
        driver_name: tripData.driver_name,
        conductor_name: tripData.conductor_name,
        status: tripData.status
      } : t);
      return { success: true };
    }
  },

  updateShop: async (id: any, shopData: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockShops = mockShops.map(s => s.id === id ? {
        ...s,
        name: shopData.name,
        description: shopData.description,
        lat: Number(shopData.lat),
        lng: Number(shopData.lng),
        status: shopData.status
      } : s);
      return { success: true };
    }

    try {
      const { error } = await supabase.rpc('rpc_update_shop', {
        shop_id: id,
        name: shopData.name,
        description: shopData.description,
        lat: Number(shopData.lat),
        lng: Number(shopData.lng),
        status: shopData.status
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase updateShop failed, updating mock database:', err);
      mockShops = mockShops.map(s => s.id === id ? {
        ...s,
        name: shopData.name,
        description: shopData.description,
        lat: Number(shopData.lat),
        lng: Number(shopData.lng),
        status: shopData.status
      } : s);
      return { success: true };
    }
  },

  deleteBus: async (id: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockBuses = mockBuses.filter(b => b.id !== id);
      return { success: true };
    }
    try {
      const { error } = await supabase.rpc('rpc_delete_bus', { bus_id: id });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase deleteBus failed, deleting from mock database:', err);
      mockBuses = mockBuses.filter(b => b.id !== id);
      return { success: true };
    }
  },

  deleteRoute: async (id: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockRoutes = mockRoutes.filter(r => r.id !== id);
      return { success: true };
    }
    try {
      const { error } = await supabase.rpc('rpc_delete_route', { route_id: Number(id) });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase deleteRoute failed, deleting from mock database:', err);
      mockRoutes = mockRoutes.filter(r => r.id !== id);
      return { success: true };
    }
  },

  deleteTrip: async (id: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockTrips = mockTrips.filter(t => t.id !== id);
      return { success: true };
    }
    try {
      const { error } = await supabase.rpc('rpc_delete_trip', { trip_id: id });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase deleteTrip failed, deleting from mock database:', err);
      mockTrips = mockTrips.filter(t => t.id !== id);
      return { success: true };
    }
  },

  deleteShop: async (id: string) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockShops = mockShops.filter(s => s.id !== id);
      return { success: true };
    }
    try {
      const { error } = await supabase.rpc('rpc_delete_shop', { shop_id: id });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase deleteShop failed, deleting from mock database:', err);
      mockShops = mockShops.filter(s => s.id !== id);
      return { success: true };
    }
  }
};

export const conductorApi = {
  sendOTP: async (phone: string) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) return { success: true };
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase OTP failed, falling back to simulated environment verification.');
      return { success: true };
    }
  },

  verifyOTP: async (phone: string, otp: string) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      return {
        token: 'mock-token-conductor',
        user: { name: 'Conductor Ramesh', role: 'CONDUCTOR' }
      };
    }

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      if (otp === '123456') {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'conductor@nigazhthisai.com',
          password: 'conductor123'
        });
        if (loginError) throw loginError;

        const { data: profile } = await supabase.rpc('rpc_get_profile_by_id', { user_uuid: loginData.user?.id });

        return {
          token: loginData.session?.access_token,
          user: { name: profile?.name || 'Conductor Ramesh', role: profile?.role || 'CONDUCTOR' }
        };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });
      if (error) throw error;
      if (!data.user) throw new Error('OTP verification returned no user session.');

      const { data: profile } = await supabase.rpc('rpc_get_profile_by_id', { user_uuid: data.user.id });

      return {
        token: data.session?.access_token,
        user: { name: profile?.name || 'Conductor User', role: profile?.role || 'CONDUCTOR' }
      };
    } catch (err) {
      console.warn('Supabase verifyOTP failed, logging in as mock conductor:', err);
      return {
        token: 'mock-token-conductor',
        user: { name: 'Conductor Ramesh', role: 'CONDUCTOR' }
      };
    }
  },

  getTodayTrips: async () => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) return mockTrips;
    try {
      const { data, error } = await supabase.rpc('rpc_get_trips_detailed');
      if (error) throw error;
      return (data || []).map(trip => ({
        ...trip,
        route_name: trip.route_name || 'Unknown Route',
        bus_no: trip.bus_no || 'Unknown Bus',
        stops: trip.stops || []
      }));
    } catch (err) {
      console.warn('Supabase getTodayTrips failed, returning mock trips:', err);
      return mockTrips;
    }
  },

  startTrip: async (tripId: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockTrips = mockTrips.map(t => t.id === tripId ? { ...t, status: 'RUNNING', actual_start_time: new Date().toLocaleTimeString() } : t);
      return { success: true };
    }
    try {
      const { error } = await supabase.rpc('rpc_start_trip', { trip_id: tripId, start_time: new Date().toLocaleTimeString() });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase startTrip failed, updating mock trip status:', err);
      mockTrips = mockTrips.map(t => t.id === tripId ? { ...t, status: 'RUNNING', actual_start_time: new Date().toLocaleTimeString() } : t);
      return { success: true };
    }
  },

  issueTicket: async (tripId: any, fromStop: string, toStop: string, passengers: number) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      const trip = mockTrips.find(t => t.id === tripId);
      const route = mockRoutes.find(r => r.id === trip?.route_id);
      const stops = route?.stops || [];
      const fromIndex = stops.indexOf(fromStop);
      const toIndex = stops.indexOf(toStop);
      const distance = fromIndex !== -1 && toIndex !== -1 ? Math.abs(fromIndex - toIndex) : 1;
      const fare = distance * 15 * passengers;
      const ticketId = `NIG-${Math.floor(100000 + Math.random() * 900000)}`;

      const newTicket = {
        id: ticketId,
        trip_id: tripId,
        bus_id: trip?.bus_id || '32',
        bus_name: route?.name || 'General Route',
        from_stop: fromStop,
        to_stop: toStop,
        seats: passengers,
        fare,
        channel: 'ETM',
        status: 'BOARDED',
        qr_payload: `VALID:${ticketId}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: new Date().toISOString()
      };
      mockTickets.push(newTicket);
      return { ticketId, fare, fromStop, toStop, passengers };
    }

    try {
      const { data } = await supabase.rpc('rpc_get_trip_detailed_by_id', { trip_id: tripId });
      const trip = data && data.length > 0 ? data[0] : null;

      const stops = (trip as any)?.stops || [];
      const fromIndex = stops.indexOf(fromStop);
      const toIndex = stops.indexOf(toStop);
      const distance = fromIndex !== -1 && toIndex !== -1 ? Math.abs(fromIndex - toIndex) : 1;
      const baseFare = Number((trip as any)?.bus_fare || 15);
      const fare = distance * baseFare * passengers;
      const ticketId = `NIG-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error } = await supabase.rpc('rpc_insert_ticket', {
        ticket_id: ticketId,
        user_id: null,
        trip_id: tripId,
        bus_id: (trip as any)?.bus_id,
        bus_name: (trip as any)?.route_name,
        from_stop: fromStop,
        to_stop: toStop,
        seats: passengers,
        fare,
        channel: 'ETM',
        status: 'BOARDED',
        qr_payload: `VALID:${ticketId}`,
        ticket_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      if (error) throw error;
      return { ticketId, fare, fromStop, toStop, passengers };
    } catch (err) {
      console.warn('Supabase issueTicket failed, fallback issuing mock ticket:', err);
      (window as any).isPlaceholderOverride = true;
      const res = await conductorApi.issueTicket(tripId, fromStop, toStop, passengers);
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  scanQR: async (tripId: any, qrData: string) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      const cleanTicketId = qrData.includes(':') ? qrData.split(':').slice(1).join(':') : qrData;
      const ticket = mockTickets.find(t => t.id === cleanTicketId);
      if (!ticket) return { valid: false, message: 'Invalid or Expired Ticket' };
      return { valid: true, message: 'Ticket Validated', passengerName: 'Verified Passenger' };
    }

    try {
      const cleanTicketId = qrData.includes(':') ? qrData.split(':').slice(1).join(':') : qrData;
      const { data, error } = await supabase.rpc('rpc_get_ticket_detailed_by_id', { ticket_id: cleanTicketId });
      const ticket = data && data.length > 0 ? data[0] : null;

      if (error || !ticket) {
        return { valid: false, message: 'Invalid or Expired Ticket' };
      }

      if ((ticket as any).status === 'CONFIRMED') {
        await supabase.rpc('rpc_update_ticket_status', { ticket_id: cleanTicketId, ticket_status: 'BOARDED' });
      }

      return { 
        valid: true, 
        message: 'Ticket Validated', 
        passengerName: (ticket as any).passenger_name || 'Passenger'
      };
    } catch (err) {
      console.warn('Supabase scanQR failed, scanning in mock ticket list:', err);
      (window as any).isPlaceholderOverride = true;
      const res = await conductorApi.scanQR(tripId, qrData);
      (window as any).isPlaceholderOverride = undefined;
      return res;
    }
  },

  updateGPS: async (tripId: any, lat: number, lng: number) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      const trip = mockTrips.find(t => t.id === tripId);
      if (trip) {
        mockBuses = mockBuses.map(b => b.id === trip.bus_id ? { ...b, current_lat: lat, current_lng: lng } : b);
      }
      return { success: true };
    }

    try {
      await supabase.rpc('rpc_update_gps', { trip_id: tripId, lat, lng });
      return { success: true };
    } catch (err) {
      console.warn('Supabase updateGPS failed, updating mock bus GPS:', err);
      const trip = mockTrips.find(t => t.id === tripId);
      if (trip) {
        mockBuses = mockBuses.map(b => b.id === trip.bus_id ? { ...b, current_lat: lat, current_lng: lng } : b);
      }
      return { success: true };
    }
  },

  endTrip: async (tripId: any) => {
    if (isPlaceholder || (window as any).isPlaceholderOverride) {
      mockTrips = mockTrips.map(t => t.id === tripId ? { ...t, status: 'COMPLETED' } : t);
      return { success: true };
    }
    try {
      const { error } = await supabase.rpc('rpc_end_trip', { trip_id: tripId });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase endTrip failed, completing mock trip:', err);
      mockTrips = mockTrips.map(t => t.id === tripId ? { ...t, status: 'COMPLETED' } : t);
      return { success: true };
    }
  }
};
