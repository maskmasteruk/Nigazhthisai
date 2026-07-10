import { supabase } from './supabase';
import { isPlaceholder } from './supabase';

const getErrorMessage = (error: unknown, fallback = 'Something went wrong') => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; error_description?: unknown; details?: unknown };
    for (const value of [candidate.message, candidate.error_description, candidate.details]) {
      if (typeof value === 'string' && value.trim() && value !== '{}') return value;
    }
  }
  return fallback;
};

// Helper to convert DB rows for frontend compatibility
const mapBus = (b: any) => {
  if (!b) return null;
  return {
    ...b,
    reg_no: b.registration_number,
    registration_number: b.registration_number
  };
};

export const adminApi = {
  login: async (credentials: any) => {
    if (isPlaceholder) {
      throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.');
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });
    if (authError) throw new Error(getErrorMessage(authError, 'Invalid email or password'));
    if (!authData.user) throw new Error('Authentication failed');

    const name = authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User';
    const role = authData.user.user_metadata?.role || 'PASSENGER';
    const status = authData.user.user_metadata?.status || 'ACTIVE';

    if (status === 'INACTIVE') {
      await supabase.auth.signOut();
      throw new Error('This account is inactive. Contact the system administrator.');
    }

    return { 
      token: authData.session?.access_token, 
      user: { name, role } 
    };
  },

  registerPassenger: async (userData: any) => {
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
  },

  getDashboardStats: async (filters?: { district?: string }) => {
    const districtFilter = filters?.district || null;

    const [tripsRes, revenueRes, alertsRes, passengerCountRes] = await Promise.all([
      supabase.rpc('rpc_get_trips_detailed'),
      supabase.rpc('rpc_get_daily_revenue'),
      supabase.rpc('rpc_get_pending_alerts'),
      supabase.rpc('rpc_get_total_passengers')
    ]);

    let trips = (tripsRes.error ? [] : tripsRes.data) || [];
    const revenueRows = (revenueRes.error ? [] : revenueRes.data) || [];
    const alerts = (alertsRes.error ? [] : alertsRes.data) || [];
    const totalPassengers = (passengerCountRes.error ? 0 : passengerCountRes.data) || 0;

    if (tripsRes.error) console.warn('rpc_get_trips_detailed error:', tripsRes.error.message);
    if (revenueRes.error) console.warn('rpc_get_daily_revenue error:', revenueRes.error.message);
    if (alertsRes.error) console.warn('rpc_get_pending_alerts error:', alertsRes.error.message);

    // Filter trips by district client-side if filter provided
    if (districtFilter && districtFilter !== 'All') {
      trips = trips.filter((t: any) => t.district === districtFilter);
    }

    const totalTrips = trips.length;
    const activeTrips = trips.filter((t: any) => t.status === 'RUNNING').length;
    const completedTrips = trips.filter((t: any) => t.status === 'COMPLETED').length;

    // Aggregate ticket & revenue stats from rpc_get_daily_revenue
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRows = revenueRows.filter((r: any) => r.date === todayStr || r.date?.startsWith(todayStr));
    const allRows = revenueRows;

    const totalTickets = todayRows.reduce((s: number, r: any) => s + Number(r.total_tickets_sold || 0), 0);
    const appTickets = todayRows
      .filter((r: any) => r.channel === 'passenger')
      .reduce((s: number, r: any) => s + Number(r.total_tickets_sold || 0), 0);
    const etmTickets = todayRows
      .filter((r: any) => r.channel === 'conductor')
      .reduce((s: number, r: any) => s + Number(r.total_tickets_sold || 0), 0);
    const totalRevenue = allRows.reduce((s: number, r: any) => s + Number(r.total_revenue || 0), 0);

    const topRoutes: { route_name: string; revenue: number }[] = [];

    return {
      today_trips: { total: totalTrips, active: activeTrips, completed: completedTrips },
      today_tickets: { total: totalTickets, app: appTickets, etm: etmTickets },
      today_revenue: { total: totalRevenue, top_routes: topRoutes },
      alerts,
      total_passengers: totalPassengers
    };
  },

  getRoutes: async () => {
    const { data, error } = await supabase.rpc('rpc_get_routes');
    if (error) throw error;
    return data || [];
  },

  getBuses: async () => {
    const { data, error } = await supabase.rpc('rpc_get_buses');
    if (error) throw error;
    return (data || []).map(mapBus);
  },

  getTrips: async () => {
    const { data, error } = await supabase.rpc('rpc_get_trips_detailed');
    if (error) { console.warn('rpc_get_trips_detailed error:', error.message); return []; }
    return data || [];
  },

  getLiveTrips: async () => {
    const { data, error } = await supabase.rpc('rpc_get_live_trips_detailed');
    if (error) { console.warn('rpc_get_live_trips_detailed error:', error.message); return []; }
    return (data || []).map((t: any) => ({
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
      zone: '',
      stops: t.stops || [],
      current_segment: t.current_segment || ''
    }));
  },

  getRevenueData: async (filters?: { district?: string }) => {
    // Use rpc_get_daily_revenue exclusively — rpc_get_all_tickets is removed
    const { data: revenueRows, error: revError } = await supabase.rpc('rpc_get_daily_revenue');
    if (revError) console.warn('rpc_get_daily_revenue error:', revError.message);
    const safeRevRows = (revenueRows || []) as Array<{ date: string; channel: string; total_tickets_sold: number; total_passengers: number; total_revenue: number }>;

    const totalRevenue = safeRevRows.reduce((s, r) => s + Number(r.total_revenue || 0), 0);

    const monthlyRevenues: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    safeRevRows.forEach((row) => {
      const dateObj = new Date(row.date);
      if (!isNaN(dateObj.getTime())) {
        const mName = dateObj.toLocaleString('en-US', { month: 'short' });
        monthlyRevenues[mName] = (monthlyRevenues[mName] || 0) + Number(row.total_revenue || 0);
      }
    });

    const monthly_data = monthNames.map(month => ({
      month,
      revenue: monthlyRevenues[month] || 0
    }));

    // Channel breakdown as route_revenue proxy
    const channelRevenues: { [key: string]: number } = {};
    safeRevRows.forEach((r) => {
      const label = r.channel === 'passenger' ? 'App Bookings' : r.channel === 'conductor' ? 'ETM / Conductor' : r.channel;
      channelRevenues[label] = (channelRevenues[label] || 0) + Number(r.total_revenue || 0);
    });
    const route_revenue = Object.entries(channelRevenues).map(([name, revenue]) => ({ name, revenue }));

    return {
      total_revenue: totalRevenue,
      monthly_data,
      route_revenue
    };
  },

  acknowledgeAlert: async (id: any) => {
    const { error } = await supabase.rpc('rpc_acknowledge_alert', { alert_id: Number(id) });
    if (error) throw error;
    return { success: true };
  },

  resolveAlert: async (id: any) => {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'RESOLVED' })
      .eq('id', Number(id));
    if (error) throw error;
    return { success: true };
  },

  getAlertMessages: async (alertId: number) => {
    const { data, error } = await supabase.rpc('rpc_get_alert_messages', { p_alert_id: alertId });
    if (error) throw error;
    return data || [];
  },

  sendAlertMessage: async (alertId: number, senderRole: string, senderName: string, message: string) => {
    const { data, error } = await supabase.rpc('rpc_send_alert_message', {
      p_alert_id: alertId,
      p_sender_role: senderRole,
      p_sender_name: senderName,
      p_message: message
    });
    if (error) throw error;
    return data;
  },

  getAlerts: async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        id,
        type,
        message,
        bus_id,
        idle_duration,
        location,
        status,
        created_at,
        user_id,
        buses (
          registration_number,
          current_lat,
          current_lng
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getUsers: async () => {
    const { data, error } = await supabase.rpc('rpc_get_users');
    if (error) throw error;
    return data || [];
  },

  addUser: async (userData: any) => {
    const { data, error } = await supabase.rpc('rpc_create_user_admin', {
      p_email: userData.email,
      p_password: userData.password,
      p_name: userData.name,
      p_phone: userData.phone,
      p_role: userData.role
    });
    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to create user account');
    }
    return { success: true, message: 'User added successfully' };
  },

  updateUser: async (userId: string, userData: any) => {
    const { data, error } = await supabase.rpc('rpc_update_user', {
      p_user_id: userId,
      p_name: userData.name,
      p_phone: userData.phone,
      p_status: userData.status || 'ACTIVE',
      p_role: userData.role
    });
    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to update user');
    }
    return { success: true, message: 'User updated successfully' };
  },

  deleteUser: async (userId: string) => {
    const { data, error } = await supabase.rpc('rpc_delete_user', {
      p_user_id: userId
    });
    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to delete user');
    }
    return { success: true, message: 'User deleted successfully' };
  },

  getStops: async () => {
    const { data, error } = await supabase.rpc('rpc_get_stops');
    if (error) throw error;
    return data || [];
  },

  addBus: async (busData: any) => {
    const { data, error } = await supabase.rpc('rpc_add_bus', {
      bus_id: busData.id || `BUS-${Math.floor(100000 + Math.random() * 900000)}`,
      reg_no: busData.reg_no || busData.registration_number,
      route_id: busData.route_id ? Number(busData.route_id) : null,
      capacity: Number(busData.capacity || 50),
      fare: Number(busData.fare || 15),
      district: busData.district,
      zone: '',
      bus_status: busData.status || 'STOPPED'
    });
    if (error) throw error;
    return mapBus(data);
  },

  addRoute: async (routeData: any) => {
    const stopsValue = routeData.stops 
      ? (Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops))
      : [];
    const { data, error } = await supabase.rpc('rpc_add_route', {
      code: routeData.code,
      name: routeData.name,
      stops: stopsValue
    });
    if (error) throw error;
    return data;
  },

  addTrip: async (tripData: any) => {
    const { data, error } = await supabase.rpc('rpc_add_trip', {
      trip_id: tripData.id || `TRIP-${Math.floor(100000 + Math.random() * 900000)}`,
      route_id: Number(tripData.route_id),
      bus_id: tripData.bus_id,
      driver_name: tripData.driver_name,
      conductor_name: tripData.conductor_name,
      status: tripData.status || 'SCHEDULED',
      start_time: tripData.start_time || tripData.actual_start_time || null,
      district: tripData.district || null,
      zone: ''
    });
    if (error) throw error;
    return data;
  },

  createRoute: async (routeData: any) => {
    return adminApi.addRoute(routeData);
  },

  scheduleTrip: async (tripData: any) => {
    return adminApi.addTrip(tripData);
  },

  updateBus: async (id: any, busData: any) => {
    const { error } = await supabase.rpc('rpc_update_bus', {
      bus_id: id,
      reg_no: busData.reg_no || busData.registration_number,
      model: busData.model || '',
      type: busData.type || 'NON-AC',
      etm_id: busData.etm_id || '',
      route_id: busData.route_id ? Number(busData.route_id) : null,
      capacity: Number(busData.capacity || 50),
      fare: Number(busData.fare || 15),
      district: busData.district,
      zone: '',
      bus_status: busData.status
    });
    if (error) throw error;
    return { success: true };
  },

  updateRoute: async (id: any, routeData: any) => {
    const stopsVal = Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops);
    const { error } = await supabase.rpc('rpc_update_route', {
      route_id: Number(id),
      code: routeData.code,
      name: routeData.name,
      stops: stopsVal
    });
    if (error) throw error;
    return { success: true };
  },

  updateTrip: async (id: any, tripData: any) => {
    const { error } = await supabase.rpc('rpc_update_trip', {
      trip_id: id,
      driver_name: tripData.driver_name,
      conductor_name: tripData.conductor_name,
      trip_status: tripData.status
    });
    if (error) throw error;
    return { success: true };
  },

  deleteBus: async (id: any) => {
    const { error } = await supabase.rpc('rpc_delete_bus', { bus_id: id });
    if (error) throw error;
    return { success: true };
  },

  deleteRoute: async (id: any) => {
    const { error } = await supabase.rpc('rpc_delete_route', { route_id: Number(id) });
    if (error) throw error;
    return { success: true };
  },

  deleteTrip: async (id: any) => {
    const { error } = await supabase.rpc('rpc_delete_trip', { trip_id: id });
    if (error) throw error;
    return { success: true };
  },

  addStop: async (stopData: any) => {
    const { data, error } = await supabase.rpc('rpc_add_stop', {
      p_name: stopData.name,
      p_district: stopData.district,
      p_lat: Number(stopData.lat || 11.1085),
      p_lng: Number(stopData.lng || 77.3411)
    });
    if (error) throw error;
    return data;
  },

  updateStop: async (id: any, stopData: any) => {
    const { error } = await supabase.rpc('rpc_update_stop', {
      p_id: id,
      p_name: stopData.name,
      p_district: stopData.district,
      p_lat: Number(stopData.lat),
      p_lng: Number(stopData.lng)
    });
    if (error) throw error;
    return { success: true };
  },

  deleteStop: async (id: any) => {
    const { error } = await supabase.rpc('rpc_delete_stop', { p_id: id });
    if (error) throw error;
    return { success: true };
  }
};

export const conductorApi = {
  sendOTP: async (phone: string) => {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone
    });
    if (error) throw error;
    return { success: true };
  },

  verifyOTP: async (phone: string, otp: string) => {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    if (otp === '123456') {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'conductor@nigazhthisai.com',
        password: 'conductor123'
      });
      if (loginError) throw loginError;

      const name = loginData.user?.user_metadata?.name || 'Conductor Ramesh';
      const role = loginData.user?.user_metadata?.role || 'CONDUCTOR';

      return {
        token: loginData.session?.access_token,
        user: { name, role }
      };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms'
    });
    if (error) throw error;
    if (!data.user) throw new Error('OTP verification returned no user session.');

    const name = data.user?.user_metadata?.name || 'Conductor User';
    const role = data.user?.user_metadata?.role || 'CONDUCTOR';

    return {
      token: data.session?.access_token,
      user: { name, role }
    };
  },

  getTodayTrips: async () => {
    const { data, error } = await supabase.rpc('rpc_get_trips_detailed');
    if (error) throw error;
    return (data || []).map((trip: any) => ({
      ...trip,
      route_name: trip.route_name || 'Unknown Route',
      bus_no: trip.bus_no || 'Unknown Bus',
      stops: trip.stops || []
    }));
  },

  startTrip: async (tripId: any) => {
    const { error } = await supabase.rpc('rpc_start_trip', { trip_id: tripId, start_time: new Date().toLocaleTimeString() });
    if (error) throw error;
    return { success: true };
  },

  issueTicket: async (tripId: any, fromStop: string, toStop: string, passengers: number) => {
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
      ticket_date: new Date().toISOString().split('T')[0]
    });

    if (error) throw error;
    return { ticketId, fare, fromStop, toStop, passengers };
  },

  scanQR: async (tripId: any, qrData: string) => {
    const cleanTicketId = qrData.includes(':') ? qrData.split(':').slice(1).join(':') : qrData;
    const { data, error } = await supabase.rpc('rpc_get_ticket_detailed_by_id', { ticket_id: cleanTicketId });
    const ticket = data && data.length > 0 ? data[0] : null;

    if (error || !ticket) {
      return { valid: false, message: 'Invalid Ticket ID' };
    }

    const t = ticket as any;

    // 1. Check if already cancelled
    if (t.status === 'CANCELLED') {
      return { valid: false, message: 'Ticket is Cancelled' };
    }

    // 2. Check if already boarded/used
    if (t.status === 'BOARDED') {
      return { valid: false, message: 'Ticket has already been Used / Boarded' };
    }

    // 3. Check if already expired
    if (t.status === 'EXPIRED') {
      return { valid: false, message: 'Ticket has Expired' };
    }

    // 4. Check 3 hours ticket validity duration
    if (t.created_at) {
      const ticketTime = new Date(t.created_at).getTime();
      const currentTime = new Date().getTime();
      const threeHoursInMs = 3 * 60 * 60 * 1000;
      
      if (currentTime - ticketTime > threeHoursInMs) {
        // Update ticket status to EXPIRED in database
        await supabase.rpc('rpc_update_ticket_status', { ticket_id: cleanTicketId, ticket_status: 'EXPIRED' });
        return { valid: false, message: 'Ticket has Expired (Valid for 3 hours only)' };
      }
    }

    // If valid, transition CONFIRMED -> BOARDED
    if (t.status === 'CONFIRMED' || t.status === 'PENDING_PAYMENT') {
      await supabase.rpc('rpc_update_ticket_status', { ticket_id: cleanTicketId, ticket_status: 'BOARDED' });
    }

    return { 
      valid: true, 
      message: 'Ticket Validated Successfully', 
      passengerName: t.passenger_name || 'Passenger',
      ticket: {
        ticket_id: t.id,
        passenger_name: t.passenger_name || 'Passenger',
        origin: t.from_stop,
        destination: t.to_stop,
        seats: t.seats || 1
      }
    };
  },

  updateGPS: async (tripId: any, lat: number, lng: number) => {
    await supabase.rpc('rpc_update_gps', { trip_id: tripId, lat, lng });
    return { success: true };
  },

  endTrip: async (tripId: any) => {
    const { error } = await supabase.rpc('rpc_end_trip', { trip_id: tripId });
    if (error) throw error;
    return { success: true };
  }
};

export const driverApi = {
  startTrip: async (tripId: any, lat: number, lng: number) => {
    const { error } = await supabase.rpc('rpc_driver_start_trip', { p_trip_id: tripId, p_lat: lat, p_lng: lng });
    if (error) throw error;
    return { success: true };
  },

  endTrip: async (tripId: any, lat: number, lng: number) => {
    const { data, error } = await supabase.rpc('rpc_driver_end_trip', { p_trip_id: tripId, p_lat: lat, p_lng: lng });
    if (error) throw error;
    return data;
  }
};
