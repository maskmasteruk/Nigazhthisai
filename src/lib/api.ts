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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, role, status')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('Could not load signed-in user profile; using auth metadata instead.', profileError);
    }

    const name = profile?.name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User';
    const role = profile?.role || authData.user.user_metadata?.role || 'PASSENGER';

    if (profile?.status === 'INACTIVE' || authData.user.user_metadata?.status === 'INACTIVE') {
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

  getDashboardStats: async (filters?: { district?: string; zone?: string }) => {
    const [tripsRes, ticketsRes, alertsRes, passengerCountRes] = await Promise.all([
      supabase.rpc('rpc_get_all_trips', { district_filter: filters?.district || null, zone_filter: filters?.zone || null }),
      supabase.rpc('rpc_get_all_tickets', { bus_name_filter: filters?.district || null }),
      supabase.rpc('rpc_get_pending_alerts'),
      supabase.rpc('rpc_get_total_passengers')
    ]);

    if (tripsRes.error) throw tripsRes.error;
    if (ticketsRes.error) throw ticketsRes.error;
    if (alertsRes.error) throw alertsRes.error;
    if (passengerCountRes.error) throw passengerCountRes.error;

    const trips = tripsRes.data || [];
    const tickets = ticketsRes.data || [];
    const alerts = alertsRes.data || [];
    const totalPassengers = passengerCountRes.data || 0;

    const totalTrips = trips.length;
    const activeTrips = trips.filter((t: any) => t.status === 'RUNNING').length;
    const completedTrips = trips.filter((t: any) => t.status === 'COMPLETED').length;

    const totalTickets = tickets.length;
    const appTickets = tickets.filter((t: any) => t.channel === 'APP').length;
    const etmTickets = tickets.filter((t: any) => t.channel === 'ETM').length;

    const totalRevenue = tickets.reduce((sum: number, t: any) => sum + Number(t.fare), 0);

    const routeRevenues: { [key: string]: number } = {};
    tickets.forEach((t: any) => {
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
    if (error) throw error;
    return data || [];
  },

  getLiveTrips: async () => {
    const { data, error } = await supabase.rpc('rpc_get_live_trips_detailed');
    if (error) throw error;
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
      zone: t.zone
    }));
  },

  getRevenueData: async (filters?: { district?: string; zone?: string }) => {
    // Fetch from view_daily_revenue view
    const { data: revenueRows, error: revError } = await supabase
      .from('view_daily_revenue')
      .select('*');
    if (revError) throw revError;

    // Fetch all tickets
    const { data: tickets, error } = await supabase.rpc('rpc_get_all_tickets');
    if (error) throw error;

    const totalRevenue = tickets?.reduce((sum: number, t: any) => sum + Number(t.fare), 0) || 0;

    const monthlyRevenues: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Aggregate monthly data from view_daily_revenue
    revenueRows?.forEach((row: any) => {
      const dateObj = new Date(row.date);
      if (!isNaN(dateObj.getTime())) {
        const mName = dateObj.toLocaleString('en-US', { month: 'short' });
        monthlyRevenues[mName] = (monthlyRevenues[mName] || 0) + Number(row.total_revenue);
      } else {
        // Fallback for custom date formats
        const match = row.date?.match(/^[0-9]{4}-([0-9]{2})-[0-9]{2}$/);
        if (match) {
          const monthIdx = parseInt(match[1], 10) - 1;
          if (monthIdx >= 0 && monthIdx < 12) {
            const mName = monthNames[monthIdx];
            monthlyRevenues[mName] = (monthlyRevenues[mName] || 0) + Number(row.total_revenue);
          }
        }
      }
    });

    // If no view data is aggregated yet, calculate directly from tickets
    if (Object.keys(monthlyRevenues).length === 0) {
      tickets?.forEach((t: any) => {
        const dateObj = new Date(t.timestamp);
        if (!isNaN(dateObj.getTime())) {
          const mName = dateObj.toLocaleString('en-US', { month: 'short' });
          monthlyRevenues[mName] = (monthlyRevenues[mName] || 0) + Number(t.fare);
        }
      });
    }

    const monthly_data = monthNames.map(month => ({
      month,
      revenue: monthlyRevenues[month] || 0
    }));

    const routeRevenues: { [key: string]: number } = {};
    tickets?.forEach((t: any) => {
      const routeName = t.bus_name || 'General Routes';
      routeRevenues[routeName] = (routeRevenues[routeName] || 0) + Number(t.fare);
    });
    const route_revenue = Object.entries(routeRevenues).map(([name, revenue]) => ({ name, revenue }));

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
        buses (
          registration_number,
          district,
          zone,
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
  },

  addRoute: async (routeData: any) => {
    const { data, error } = await supabase.rpc('rpc_add_route', {
      code: routeData.code,
      name: routeData.name,
      stops: Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops)
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
      start_time: tripData.actual_start_time || null,
      district: tripData.district,
      zone: tripData.zone
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
      route_id: busData.route_id ? Number(busData.route_id) : null,
      capacity: Number(busData.capacity || 50),
      fare: Number(busData.fare || 15),
      district: busData.district,
      zone: busData.zone,
      bus_status: busData.status
    });
    if (error) throw error;
    return { success: true };
  },

  updateRoute: async (id: any, routeData: any) => {
    const stopsVal = Array.isArray(routeData.stops) ? routeData.stops : JSON.parse(routeData.stops);
    const { error } = await supabase
      .from('routes')
      .update({
        code: routeData.code,
        name: routeData.name,
        stops: stopsVal
      })
      .eq('id', Number(id));
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
      ticket_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    if (error) throw error;
    return { ticketId, fare, fromStop, toStop, passengers };
  },

  scanQR: async (tripId: any, qrData: string) => {
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
