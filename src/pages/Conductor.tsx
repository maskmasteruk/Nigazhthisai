import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Bus as BusIcon, 
  Navigation, 
  Ticket, 
  User, 
  LogOut, 
  QrCode, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Loader2, 
  ChevronRight, 
  ArrowLeft, 
  Info, 
  Globe, 
  ChevronDown, 
  Check, 
  Search, 
  Phone, 
  Mail,
  Lock, 
  Printer, 
  History,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { conductorApi, adminApi } from '../lib/api';
import { eraseCookie } from '../utils/cookies';
import { NigazhthisaiIcon } from '../components/NigazhthisaiLogo';

// Real-world bus fleet for Nigazhthisai
const BUS_FLEET = [
  { bus_id: 'bus-1', number_plate: 'TN 38 AB 1234', route_name: 'Route 32: Tiruppur - Avinashi', stops: ['Tiruppur Old Bus Stand', 'Pushpa Theatre', 'Kumar Nagar', 'Thendral Nagar', 'Avinashi'] },
  { bus_id: 'bus-2', number_plate: 'TN 01 CD 5678', route_name: 'Route 12: Chennai - Tambaram', stops: ['Koyambedu (CMBT)', 'Vadapalani', 'Ashok Nagar', 'Guindy', 'Tambaram'] },
  { bus_id: 'bus-3', number_plate: 'TN 66 GH 3456', route_name: 'Route 45: Coimbatore - Ukkadam', stops: ['Gandhipuram', 'RS Puram', 'Peelamedu', 'Ukkadam'] },
  { bus_id: 'bus-4', number_plate: 'TN 43 GH 9012', route_name: 'Route 102: Madurai - Periyar', stops: ['Mattuthavani', 'Anna Nagar', 'Goripalayam', 'Periyar Bus Stand'] }
];

export const ConductorPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  // Navigation states
  const [currentView, setCurrentView] = useState<string>('LOGIN');

  // Conductor authentication & session states
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem('conductor_jwt') || localStorage.getItem('admin_token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Bus selection states
  const [buses, setBuses] = useState<any[]>([]);
  const [searchBusQuery, setSearchBusQuery] = useState('');
  const [tempSelectedBus, setTempSelectedBus] = useState<any | null>(null);
  const [selectBusLoading, setSelectBusLoading] = useState(false);

  // Conductor Details state
  const [conductorIdInput, setConductorIdInput] = useState(() => localStorage.getItem('conductor_id') || '');
  const [startDutyLoading, setStartDutyLoading] = useState(false);

  // Active Session states (saved in localStorage to persist across refreshes)
  const [activeBusId, setActiveBusId] = useState<string | null>(() => localStorage.getItem('conductor_bus_id'));
  const [activeConductorId, setActiveConductorId] = useState<string | null>(() => localStorage.getItem('conductor_id'));
  const [activeTripId, setActiveTripId] = useState<string | null>(() => localStorage.getItem('conductor_trip_id'));
  const [activeRouteName, setActiveRouteName] = useState<string | null>(() => localStorage.getItem('conductor_route_name'));
  const [activeNumberPlate, setActiveNumberPlate] = useState<string | null>(() => localStorage.getItem('conductor_number_plate'));

  // Scheduled trips self-allocation states
  const [scheduledTrips, setScheduledTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  // Geo-tiling states
  const [allStopsWithCoords, setAllStopsWithCoords] = useState<any[]>([]);
  const [hasAutoFilledNearest, setHasAutoFilledNearest] = useState(false);

  // Bus Camera QR Scan states
  const [isBusCameraActive, setIsBusCameraActive] = useState(false);
  const [busHtml5QrCode, setBusHtml5QrCode] = useState<Html5Qrcode | null>(null);

  // Tickets list & stats
  const [ticketsToday, setTicketsToday] = useState<any[]>(() => {
    const saved = localStorage.getItem('conductor_tickets_list');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Issue Ticket Form state
  const [boardingStop, setBoardingStop] = useState('');
  const [destinationStop, setDestinationStop] = useState('');
  const [passengersCount, setPassengersCount] = useState(1);
  const [ticketType, setTicketType] = useState('REGULAR');
  const [farePreview, setFarePreview] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [lastIssuedTicket, setLastIssuedTicket] = useState<any | null>(null);

  // Scan QR flow states
  const [scanPayload, setScanPayload] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);

  // Cleanup camera stream on unmount or view change
  useEffect(() => {
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [html5QrCode]);

  useEffect(() => {
    if (currentView !== 'SCAN_QR' && html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then(() => {
        setIsCameraActive(false);
      }).catch(console.error);
    }
  }, [currentView, html5QrCode]);

  // Language Picker dropdown state
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Fetch real buses on load
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const { data } = await supabase.rpc('rpc_get_buses_with_routes');
        if (data && data.length > 0) {
          setBuses((data as any[]).map(b => ({
            bus_id: b.bus_id,
            number_plate: b.number_plate,
            route_name: b.route_name,
            stops: b.stops || ['Old Bus Stand', 'Pushpa Theatre', 'Kumar Nagar', 'Avinashi']
          })));
        }
      } catch (err) {
        console.error('Error fetching buses:', err);
      }
    };
    if (jwt) {
      fetchBuses();
    }
  }, [jwt]);

  // Resolve current active bus & stops
  const activeBus = (buses.length > 0 ? buses : BUS_FLEET).find(b => b.bus_id === activeBusId);
  const activeBusStops = activeBus ? activeBus.stops : [];

  // Fetch scheduled trips for selected bus
  useEffect(() => {
    const fetchScheduledTrips = async () => {
      if (!activeBusId) return;
      setLoadingTrips(true);
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*, routes(name, stops)')
          .eq('bus_id', activeBusId)
          .in('status', ['SCHEDULED', 'PLANNED']);
        if (!error && data) {
          setScheduledTrips(data);
        } else {
          setScheduledTrips([]);
        }
      } catch (err) {
        console.error('Error fetching scheduled trips:', err);
        setScheduledTrips([]);
      } finally {
        setLoadingTrips(false);
      }
    };
    fetchScheduledTrips();
  }, [activeBusId]);

  // Fetch logged in profile metadata to default Conductor ID
  useEffect(() => {
    const fetchProfile = async () => {
      if (!jwt) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const emailPrefix = user.email ? user.email.split('@')[0] : '';
          const name = user.user_metadata?.name || user.user_metadata?.fullName || emailPrefix;
          if (!localStorage.getItem('conductor_id') && name) {
            setConductorIdInput(name.toUpperCase());
          }
        }
      } catch (err) {
        console.error('Failed to retrieve user metadata:', err);
      }
    };
    fetchProfile();
  }, [jwt]);

  // Fetch stops with coordinates for geo-tiling
  useEffect(() => {
    const fetchStopsWithCoords = async () => {
      try {
        const { data, error } = await supabase.from('stops').select('*');
        if (!error && data) {
          setAllStopsWithCoords(data);
        }
      } catch (err) {
        console.error('Failed to load stops coordinates:', err);
      }
    };
    fetchStopsWithCoords();
  }, []);

  // Identify nearest stop on startup
  useEffect(() => {
    if (allStopsWithCoords.length === 0 || hasAutoFilledNearest || activeBusStops.length === 0) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          let closestStop = null;
          let minDistance = Infinity;
          const activeStopNamesLower = activeBusStops.map((s: string) => s.toLowerCase());

          allStopsWithCoords.forEach(stop => {
            if (stop.lat && stop.lng && activeStopNamesLower.includes(stop.name.toLowerCase())) {
              const lat1 = Number(stop.lat);
              const lng1 = Number(stop.lng);
              const R = 6371; // km
              const dLat = (latitude - lat1) * Math.PI / 180;
              const dLon = (longitude - lng1) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const dist = R * c;

              if (dist < minDistance) {
                minDistance = dist;
                closestStop = stop;
              }
            }
          });

          if (closestStop) {
            setBoardingStop((closestStop as any).name);
            setHasAutoFilledNearest(true);
            toast.info(`Auto-detected nearest boarding stop: ${(closestStop as any).name}`);
          }
        },
        (error) => {
          console.warn("Could not retrieve geolocation for nearest stop:", error);
        }
      );
    }
  }, [allStopsWithCoords, hasAutoFilledNearest, activeBusStops]);

  // Background offline tickets sync hook
  useEffect(() => {
    let syncInterval: any = null;
    
    const syncOfflineTickets = async () => {
      if (!navigator.onLine || ticketsToday.length === 0) return;
      
      const unsyncedTickets = ticketsToday.filter(t => t.synced === false);
      if (unsyncedTickets.length === 0) return;

      console.log(`Syncing ${unsyncedTickets.length} offline tickets...`);
      let hasUpdates = false;
      const updatedTickets = [...ticketsToday];

      for (let i = 0; i < updatedTickets.length; i++) {
        const ticket = updatedTickets[i];
        if (ticket.synced === false) {
          try {
            const { error } = await supabase.rpc('rpc_insert_ticket', {
              ticket_id: ticket.ticket_id,
              user_id: null,
              trip_id: ticket.trip_id,
              bus_id: activeBusId,
              bus_name: activeRouteName || 'Bus Route',
              from_stop: ticket.origin_name,
              to_stop: ticket.destination_name,
              seats: ticket.seats,
              fare: ticket.fare,
              channel: 'ETM',
              status: 'BOARDED',
              qr_payload: `VALID:${ticket.ticket_id}`,
              ticket_date: ticket.date
            });

            if (!error) {
              updatedTickets[i] = { ...ticket, synced: true };
              hasUpdates = true;
              toast.info(`Offline ticket ${ticket.ticket_id} successfully synced!`);
            }
          } catch (err) {
            console.error(`Failed to sync ticket ${ticket.ticket_id}:`, err);
          }
        }
      }

      if (hasUpdates) {
        setTicketsToday(updatedTickets);
        localStorage.setItem('conductor_tickets_list', JSON.stringify(updatedTickets));
      }
    };

    syncInterval = setInterval(syncOfflineTickets, 12000);
    window.addEventListener('online', syncOfflineTickets);

    return () => {
      if (syncInterval) clearInterval(syncInterval);
      window.removeEventListener('online', syncOfflineTickets);
    };
  }, [ticketsToday, activeBusId, activeRouteName]);

  // Pre-fill boarding/destination stops when stops are loaded or changed
  useEffect(() => {
    if (activeBusStops && activeBusStops.length >= 2) {
      if (!boardingStop) setBoardingStop(activeBusStops[0]);
      if (!destinationStop) setDestinationStop(activeBusStops[1]);
    }
  }, [activeBusStops, boardingStop, destinationStop]);

  // Determine initial view based on saved credentials
  useEffect(() => {
    if (!jwt) {
      setCurrentView('LOGIN');
    } else if (!activeBusId) {
      setCurrentView('SELECT_BUS');
    } else if (!activeTripId) {
      setCurrentView('CONDUCTOR_DETAILS');
    } else {
      setCurrentView('TRIP_HOME');
    }
  }, [jwt, activeBusId, activeTripId]);

  // Persist tickets helper
  const saveTicketsToStorage = (updatedTickets: any[]) => {
    setTicketsToday(updatedTickets);
    localStorage.setItem('conductor_tickets_list', JSON.stringify(updatedTickets));
  };

  // Stats calculation
  const totalTicketsCount = ticketsToday.length;
  const totalRevenueSum = ticketsToday.reduce((sum, t) => sum + t.fare, 0);

  // Live GPS Tracking Loop (rpc_update_gps every 60 seconds)
  useEffect(() => {
    let gpsInterval: any = null;
    
    if (currentView === 'TRIP_HOME' && activeTripId && activeBusId) {
      const sendGPSLocation = () => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              conductorApi.updateGPS(activeTripId, latitude, longitude)
                .then(() => console.log("GPS Updated successfully in DB:", latitude, longitude))
                .catch(err => console.error("GPS Update DB failed:", err));
            },
            (error) => {
              // Fallback simulated GPS coordinates in case of blocked browser permissions
              const simulatedLat = 11.1085 + (Math.random() - 0.5) * 0.01;
              const simulatedLng = 77.3411 + (Math.random() - 0.5) * 0.01;
              conductorApi.updateGPS(activeTripId, simulatedLat, simulatedLng)
                .then(() => console.log("GPS Updated successfully in DB (Simulated):", simulatedLat, simulatedLng))
                .catch(err => console.error("GPS Update DB failed (Simulated):", err));
            }
          );
        }
      };

      // Send initial GPS update instantly
      sendGPSLocation();

      // Send update every 60 seconds (1 minute)
      gpsInterval = setInterval(sendGPSLocation, 60000);
    }

    return () => {
      if (gpsInterval) {
        clearInterval(gpsInterval);
      }
    };
  }, [currentView, activeTripId, activeBusId]);

  // Automatic estimation of ticket fare (POST /conductor/tickets/preview preview)
  useEffect(() => {
    if (boardingStop && destinationStop && boardingStop !== destinationStop) {
      setPreviewLoading(true);
      const timer = setTimeout(() => {
        const boardingIndex = activeBusStops.indexOf(boardingStop);
        const destinationIndex = activeBusStops.indexOf(destinationStop);
        if (boardingIndex !== -1 && destinationIndex !== -1) {
          const distance = Math.abs(boardingIndex - destinationIndex);
          let baseFare = distance * 15; // 15 INR per stop
          if (ticketType === 'STUDENT') {
            baseFare = Math.ceil(baseFare * 0.5); // 50% Student discount
          } else if (ticketType === 'CONCESSION') {
            baseFare = Math.ceil(baseFare * 0.3); // 70% Concession discount
          }
          setFarePreview(baseFare * passengersCount);
        } else {
          setFarePreview(null);
        }
        setPreviewLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFarePreview(null);
    }
  }, [boardingStop, destinationStop, passengersCount, ticketType, activeBusStops]);

  // 1.1 Login Action Flow
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await adminApi.login({ email, password });
      
      if (response.user.role !== 'CONDUCTOR') {
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error('Failed to sign out after role mismatch:', signOutErr);
        }
        localStorage.removeItem('conductor_jwt');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('user_role');
        setJwt(null);
        throw new Error("Unauthorized: Your account does not have the specified role 'CONDUCTOR'");
      }

      localStorage.setItem('conductor_jwt', response.token || 'mock-token');
      localStorage.setItem('admin_token', response.token || 'mock-token');
      localStorage.setItem('user_role', 'CONDUCTOR');
      setJwt(response.token || 'mock-token');
      
      setCurrentView('SELECT_BUS');
      toast.success('Log in successful');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 1.2 Select Bus Action Flow (Auto-identify bus from scanned QR payload)
  const handleBusScanned = async (payload: string) => {
    const cleanPayload = payload.trim().toUpperCase();
    
    // Find matched bus from buses list or local FLEET
    const matchedBus = (buses.length > 0 ? buses : BUS_FLEET).find(
      b => b.bus_id.toUpperCase() === cleanPayload || b.number_plate.toUpperCase() === cleanPayload
    );

    if (!matchedBus) {
      toast.error(`No bus registered with ID/plate "${payload}"`);
      return;
    }

    setSelectBusLoading(true);
    try {
      localStorage.setItem('conductor_bus_id', matchedBus.bus_id);
      localStorage.setItem('conductor_route_name', matchedBus.route_name);
      localStorage.setItem('conductor_number_plate', matchedBus.number_plate);
      
      setActiveBusId(matchedBus.bus_id);
      setActiveRouteName(matchedBus.route_name);
      setActiveNumberPlate(matchedBus.number_plate);

      // Pre-fill stops
      if (matchedBus.stops && matchedBus.stops.length >= 2) {
        setBoardingStop(matchedBus.stops[0]);
        setDestinationStop(matchedBus.stops[1]);
      }

      setCurrentView('CONDUCTOR_DETAILS');
      toast.success(`Bus ${matchedBus.number_plate} selected via QR!`);
    } catch (err) {
      toast.error('Failed to select bus.');
    } finally {
      setSelectBusLoading(false);
    }
  };

  // 1.3 Conductor Details & Start Duty Flow (Self-allocation)
  const handleStartDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conductorIdInput.trim()) {
      toast.error('Please enter a Conductor employee ID to start');
      return;
    }

    setStartDutyLoading(true);
    try {
      let tripId = selectedTripId;
      
      // Fallback: If no scheduled trip was selected, let's create a custom one!
      if (!tripId) {
        tripId = `TRIP-${Math.floor(100000 + Math.random() * 900000)}`;
        
        let routeId = null;
        let bus = null;
        try {
          const { data } = await supabase.rpc('rpc_get_bus_by_id', { bus_id: activeBusId });
          bus = data;
          routeId = (bus as any)?.route_id || null;
        } catch (err) {
          console.warn('Failed to query bus info from Supabase:', err);
        }

        try {
          const { error } = await supabase.rpc('rpc_add_trip', {
            trip_id: tripId,
            route_id: routeId,
            bus_id: activeBusId,
            driver_name: '',
            conductor_name: conductorIdInput, // Use Employee ID
            status: 'RUNNING',
            start_time: new Date().toLocaleTimeString(),
            district: (bus as any)?.district || 'Tiruppur',
            zone: ''
          });
          if (error) throw error;
        } catch (err) {
          console.warn('Supabase trips insert threw error, using local fallback:', err);
        }
      } else {
        // A scheduled trip was selected! Let's allocate the conductor and set status to RUNNING
        const { error } = await supabase
          .from('trips')
          .update({
            conductor_id: conductorIdInput, // Allocate conductor ID
            status: 'RUNNING',
            actual_start_time: new Date().toISOString()
          })
          .eq('id', tripId);
        
        if (error) throw error;
      }

      localStorage.setItem('conductor_id', conductorIdInput);
      localStorage.setItem('conductor_trip_id', tripId);
      localStorage.removeItem('conductor_tickets_list');
      
      setActiveConductorId(conductorIdInput);
      setActiveTripId(tripId);
      setTicketsToday([]);
      setCurrentView('TRIP_HOME');
      toast.success('Duty started. Real-time GPS tracking is now active.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start duty.');
    } finally {
      setStartDutyLoading(false);
    }
  };

  // 3. Issue Ticket Flow Action
  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardingStop || !destinationStop) {
      toast.error('Select valid boarding and destination stops');
      return;
    }
    if (boardingStop === destinationStop) {
      toast.error('Boarding and destination stops cannot be identical');
      return;
    }

    setIssueLoading(true);
    try {
      const boardingIndex = activeBusStops.indexOf(boardingStop);
      const destinationIndex = activeBusStops.indexOf(destinationStop);
      const distance = Math.abs(boardingIndex - destinationIndex);
      let calculatedSingleFare = distance * 15;
      if (ticketType === 'STUDENT') {
        calculatedSingleFare = Math.ceil(calculatedSingleFare * 0.5);
      } else if (ticketType === 'CONCESSION') {
        calculatedSingleFare = Math.ceil(calculatedSingleFare * 0.3);
      }
      const totalCalculatedFare = calculatedSingleFare * passengersCount;

      const generatedTicketId = `NIG-${Math.floor(100000 + Math.random() * 900000)}`;
      
      let isSynced = false;
      try {
        if (navigator.onLine) {
          const { error } = await supabase.rpc('rpc_insert_ticket', {
            ticket_id: generatedTicketId,
            user_id: null,
            trip_id: activeTripId,
            bus_id: activeBusId,
            bus_name: activeRouteName || 'Bus Route',
            from_stop: boardingStop,
            to_stop: destinationStop,
            seats: passengersCount,
            fare: totalCalculatedFare,
            channel: 'ETM',
            status: 'BOARDED',
            qr_payload: `VALID:${generatedTicketId}`,
            ticket_date: new Date().toISOString().split('T')[0]
          });

          if (!error) {
            isSynced = true;
          } else {
            console.warn('Supabase ticket insert returned error, saving offline:', error);
          }
        } else {
          console.warn('Network offline, saving ticket locally for later sync.');
        }
      } catch (err) {
        console.warn('Supabase ticket insert threw exception, saving offline:', err);
      }

      const newTicket = {
        ticket_id: generatedTicketId,
        trip_id: activeTripId,
        origin_stop_id: `stop-${boardingIndex}`,
        destination_stop_id: `stop-${destinationIndex}`,
        origin_name: boardingStop,
        destination_name: destinationStop,
        seats: passengersCount,
        ticket_type: ticketType,
        fare: totalCalculatedFare,
        issued_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        synced: isSynced
      };

      const updatedList = [newTicket, ...ticketsToday];
      saveTicketsToStorage(updatedList);

      setLastIssuedTicket(newTicket);
      setCurrentView('TICKET_CONFIRMATION');
      if (isSynced) {
        toast.success(`Ticket ${generatedTicketId} Issued & Synced!`);
      } else {
        toast.warning(`Ticket ${generatedTicketId} Issued Offline! (Will sync when online)`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue ticket.');
    } finally {
      setIssueLoading(false);
    }
  };

  // 4. Scan QR Code Action
  const handleScanQRDirect = async (payload: string) => {
    setScanLoading(true);
    try {
      const response = await conductorApi.scanQR(0, payload);
      if (response.valid) {
        setScanResult({
          valid: true,
          ticket_info: {
            ticket_id: response.ticket?.ticket_id || (payload.includes(':') ? payload.split(':').slice(1).join(':') : payload),
            origin: response.ticket?.origin || boardingStop || 'Boarding Stop',
            destination: response.ticket?.destination || destinationStop || 'Destination Stop',
            seats: response.ticket?.seats || 1,
            status: 'BOARDED',
            passenger_name: response.ticket?.passenger_name || response.passengerName || 'Verified Passenger'
          }
        });
        toast.success(response.message || 'Ticket Scanned & Validated!');
      } else {
        setScanResult({
          valid: false,
          reason: response.message || 'Ticket invalid or expired'
        });
        toast.error(response.message || 'Invalid Ticket');
      }
      setCurrentView('SCAN_RESULT');
    } catch (err: any) {
      toast.error(err.message || 'Verification scan failed.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanPayload.trim()) {
      toast.error('Please input a passenger ticket QR string or tap a simulator shortcut below');
      return;
    }
    await handleScanQRDirect(scanPayload);
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      // Wait for DOM to render the container
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode("reader");
          setHtml5QrCode(scanner);
          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              setScanPayload(decodedText);
              toast.success("QR Code Decoded!");
              scanner.stop().then(() => {
                setIsCameraActive(false);
              }).catch(console.error);
              handleScanQRDirect(decodedText);
            },
            () => {
              // Silent scan failure
            }
          );
        } catch (err: any) {
          toast.error("Failed to start camera device: " + err.message);
          setIsCameraActive(false);
        }
      }, 100);
    } catch (err: any) {
      toast.error("Failed to initialize camera: " + err.message);
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCode && html5QrCode.isScanning) {
      try {
        await html5QrCode.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error("Error stopping camera", err);
      }
    }
  };

  // 5. End Trip Action Flow
  const handleEndTrip = async () => {
    const confirmEnd = (window as any).bypassConfirm || window.confirm('Are you sure you want to end this duty trip? This stops GPS telemetry.');
    if (!confirmEnd) return;

    try {
      if (activeTripId) {
        await conductorApi.endTrip(activeTripId);
      }
      toast.info('Closing session and resetting GPS loop...');
      
      localStorage.removeItem('conductor_trip_id');
      localStorage.removeItem('conductor_tickets_list');
      setActiveTripId(null);
      setTicketsToday([]);

      toast.success('Trip successfully completed. You can now start a new trip.');
      setCurrentView('CONDUCTOR_DETAILS');
    } catch (err: any) {
      toast.error(err.message || 'Failed to close active session.');
    }
  };

  // Complete Logout Action
  const handleLogout = async () => {
    const confirmLogout = (window as any).bypassConfirm || window.confirm('Log out from Conductor Terminal? All active duty data will be cleared.');
    if (!confirmLogout) return;

    localStorage.clear();
    eraseCookie('sb-access-token');
    eraseCookie('sb-refresh-token');

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out from Supabase:', e);
    }

    setJwt(null);
    setActiveBusId(null);
    setActiveRouteName(null);
    setActiveNumberPlate(null);
    setActiveTripId(null);
    setActiveConductorId(null);
    setTicketsToday([]);
    setTempSelectedBus(null);
    setEmail('');
    setPassword('');

    toast.success('Successfully logged out.');
    setCurrentView('LOGIN');
  };

  // Filtered bus list based on plate or route name search query
  const filteredBuses = (buses.length > 0 ? buses : BUS_FLEET).filter(bus => 
    bus.number_plate.toLowerCase().includes(searchBusQuery.toLowerCase()) || 
    bus.route_name.toLowerCase().includes(searchBusQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-slate-800">
      
      {/* HEADER NAV */}
      <header className="bg-gradient-to-r from-[#0D2A5D] to-[#0a2149] text-white py-5 px-5 shadow-lg shrink-0 sticky top-0 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <NigazhthisaiIcon size={38} className="rounded-xl" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight leading-none flex items-center gap-2">
                {t('app.name')} 
                <span className="text-[10px] font-black tracking-widest text-white bg-orange-950/40 border border-[#D97F00]/50 px-2 py-0.5 rounded-md">
                  CON
                </span>
              </h1>
              <p className="text-xs text-slate-300 font-extrabold tracking-wider uppercase mt-1">
                {activeNumberPlate ? activeNumberPlate : 'Conductor Terminal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Lang Dropdown Toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 py-2 px-3 bg-slate-800 text-slate-200 font-extrabold text-xs rounded-xl hover:text-white hover:bg-slate-700 transition-all border border-slate-700 shadow-sm"
              >
                <Globe size={13} />
                <span>{language}</span>
                <ChevronDown size={12} className={`transition-transform duration-250 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 bg-slate-900 border border-slate-700 shadow-2xl z-50 w-32 overflow-hidden rounded-xl"
                  >
                    {[
                      { id: 'EN', name: 'English' },
                      { id: 'TA', name: 'தமிழ்' },
                      { id: 'TE', name: 'తెలుగు' },
                      { id: 'KN', name: 'ಕನ್ನಡ' },
                      { id: 'ML', name: 'മലയാളം' }
                    ].map((lang) => (
                      <button 
                        key={lang.id}
                        onClick={() => {
                          setLanguage(lang.id as any);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left py-2.5 px-4 text-xs font-bold ${language === lang.id ? 'bg-[#D97F00] text-white font-black' : 'text-slate-300 hover:bg-slate-800 hover:text-white'} transition-colors`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout button */}
            {jwt && (
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-slate-800/80 hover:bg-rose-950 hover:text-rose-400 text-slate-300 border border-slate-700 rounded-xl transition-all shadow-sm"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CORE MOBILE CONTAINER FRAME */}
      <main className="flex-1 w-full max-w-md mx-auto p-5 flex flex-col justify-start">
        
        {/* STEPS TIMELINE FOR SETUP */}
        {['LOGIN', 'SELECT_BUS', 'CONDUCTOR_DETAILS'].includes(currentView) && (
          <div className="mb-6 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between">
              {[
                { key: 'LOGIN', label: 'Auth' },
                { key: 'SELECT_BUS', label: 'Assign Bus' },
                { key: 'CONDUCTOR_DETAILS', label: 'Duty Code' }
              ].map((step, idx, arr) => {
                const viewOrder = ['LOGIN', 'SELECT_BUS', 'CONDUCTOR_DETAILS', 'TRIP_HOME'];
                const currentIdx = viewOrder.indexOf(currentView);
                const stepIdx = viewOrder.indexOf(step.key);
                const isCompleted = stepIdx < currentIdx;
                const isActive = step.key === currentView;

                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : isActive 
                            ? 'bg-[#D97F00] text-white ring-4 ring-orange-100 shadow-md scale-110' 
                            : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider mt-2 transition-colors duration-300 ${
                        isActive ? 'text-[#D97F00]' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`h-[2px] flex-1 -mt-5 transition-colors duration-300 ${
                        stepIdx < currentIdx ? 'bg-emerald-600' : 'bg-slate-100'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {currentView === 'LOGIN' && 'Please authenticate to access the Conductor Terminal'}
                {currentView === 'SELECT_BUS' && 'Search and register your current assigned vehicle'}
                {currentView === 'CONDUCTOR_DETAILS' && 'Enter your employee identity code to activate GPS tracking'}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* 1.1 LOGIN SCREEN */}
          {currentView === 'LOGIN' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full bg-white border border-slate-150 p-8 rounded-3xl shadow-md flex flex-col gap-6"
            >
              <div className="text-center space-y-2 pb-3 border-b border-slate-100">
                <div className="w-14 h-14 bg-emerald-50 text-[#0D2A5D] border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <Lock size={28} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Secure Login</h2>
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Nigazhthisai Conductor Portal</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} className="text-[#0D2A5D]" /> Email Address
                  </label>
                  <input 
                    type="email"
                    placeholder="conductor@nigazhthisai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-bold focus:outline-none focus:border-[#0D2A5D] focus:bg-white rounded-xl focus:ring-4 focus:ring-[#0D2A5D]/5 transition-all"
                    required
                    disabled={loginLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Lock size={14} className="text-[#0D2A5D]" /> Password
                  </label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-bold focus:outline-none focus:border-[#0D2A5D] focus:bg-white rounded-xl focus:ring-4 focus:ring-[#0D2A5D]/5 transition-all"
                    required
                    disabled={loginLoading}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-4 bg-[#0D2A5D] hover:bg-[#0a2149] disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest transition-all rounded-xl shadow-md flex items-center justify-center gap-2.5 active:scale-[0.98]"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* 1.2 SELECT BUS SCREEN */}
          {currentView === 'SELECT_BUS' && (
            <motion.div
              key="select-bus"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full bg-white border border-slate-150 p-8 rounded-3xl shadow-md flex flex-col gap-6"
            >
              <div className="text-center space-y-2 pb-3 border-b border-slate-100">
                <div className="w-14 h-14 bg-emerald-50 text-[#0D2A5D] border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <BusIcon size={28} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Scan Bus QR</h2>
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Identify your duty vehicle</p>
              </div>

              {isBusCameraActive ? (
                <div className="space-y-4">
                  <div id="bus-reader" className="w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50" />
                  <button
                    onClick={stopBusCamera}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
                  >
                    Cancel Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <button
                    onClick={startBusCamera}
                    className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white transition-all font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-md"
                  >
                    <QrCode size={22} />
                    Open QR Scanner
                  </button>

                  <div className="relative flex items-center my-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-wider text-slate-400">OR</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Manual Input Fallback */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Enter plate number manually</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. TN 38 AB 1234"
                        className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl focus:outline-none focus:border-[#D97F00] uppercase"
                        id="manual-bus-plate"
                      />
                      <button
                        onClick={() => {
                          const val = (document.getElementById('manual-bus-plate') as HTMLInputElement)?.value;
                          if (val) handleBusScanned(val);
                        }}
                        className="px-5 py-3.5 bg-[#0D2A5D] hover:bg-[#0a2149] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                      >
                        Submit
                      </button>
                    </div>
                  </div>

                  {/* Testing simulator panel */}
                  <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl space-y-2 mt-4">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Simulator Shortcuts (Test QR)</span>
                    <div className="flex flex-wrap gap-2">
                      {(buses.length > 0 ? buses : BUS_FLEET).map(bus => (
                        <button
                          key={bus.bus_id}
                          onClick={() => handleBusScanned(bus.number_plate)}
                          className="px-3 py-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-[10px] font-black uppercase text-slate-700 hover:text-[#D97F00] transition-all rounded-lg"
                        >
                          Scan {bus.number_plate.split(' ').slice(2).join(' ') || bus.number_plate}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 1.3 CONDUCTOR DETAILS & START DUTY SCREEN */}
          {currentView === 'CONDUCTOR_DETAILS' && (
            <motion.div
              key="conductor-details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full bg-white border border-slate-150 p-8 rounded-3xl shadow-md flex flex-col gap-6"
            >
              <div className="text-center space-y-2 pb-3 border-b border-slate-100">
                <div className="w-14 h-14 bg-emerald-50 text-[#0D2A5D] border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <User size={28} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Trip Setup</h2>
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Verify run details and allocate yourself</p>
              </div>

              {/* Registered session badge */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3 shadow-xs">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Selected Vehicle</p>
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-[#0D2A5D] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-xs">
                    {activeNumberPlate}
                  </span>
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    VEHICLE READY
                  </span>
                </div>
                <p className="text-xs font-extrabold text-slate-800 uppercase tracking-tight leading-snug">
                  {activeRouteName}
                </p>
              </div>

              <form onSubmit={handleStartDuty} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} className="text-[#0D2A5D]" /> Conductor Employee ID
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. COND-38491"
                    value={conductorIdInput}
                    onChange={(e) => setConductorIdInput(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-base font-black focus:outline-none focus:border-[#D97F00] rounded-xl transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-[#0D2A5D]" /> Select Scheduled Trip
                  </label>
                  
                  {loadingTrips ? (
                    <div className="flex items-center gap-2 text-slate-500 py-3 text-xs font-bold">
                      <Loader2 className="animate-spin" size={14} />
                      <span>Fetching route schedules...</span>
                    </div>
                  ) : scheduledTrips.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs font-bold space-y-2">
                      <p>No scheduled trips found for this bus today.</p>
                      <button
                        type="button"
                        onClick={() => setSelectedTripId('')}
                        className={`w-full py-3.5 border-2 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all ${
                          selectedTripId === '' ? 'bg-[#D97F00] text-white border-orange-600' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Create Custom Run (Fallback)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto p-1 bg-slate-50 border border-slate-100 rounded-2xl">
                      {scheduledTrips.map(trip => {
                        const isSelected = selectedTripId === trip.id;
                        return (
                          <button
                            type="button"
                            key={trip.id}
                            onClick={() => setSelectedTripId(trip.id)}
                            className={`w-full p-4.5 text-left transition-all border-2 rounded-xl flex items-center justify-between ${
                              isSelected 
                                ? 'bg-amber-50/60 border-[#D97F00] text-slate-900' 
                                : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-black text-slate-900">Trip ID: #{trip.id}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Start Time: {trip.start_time || 'N/A'}</p>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#D97F00] text-white flex items-center justify-center shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedTripId('')}
                        className={`w-full p-4.5 text-left transition-all border-2 rounded-xl flex items-center justify-between ${
                          selectedTripId === '' 
                            ? 'bg-amber-50/60 border-[#D97F00] text-slate-900 font-black' 
                            : 'bg-white border-slate-200 hover:border-slate-350 text-slate-750'
                        }`}
                      >
                        <span>Create Custom Run (Fallback)</span>
                        {selectedTripId === '' && (
                          <div className="w-5 h-5 rounded-full bg-[#D97F00] text-white flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4.5 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('conductor_bus_id');
                      setActiveBusId(null);
                      setCurrentView('SELECT_BUS');
                    }}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest transition-all rounded-xl border border-slate-200 flex items-center justify-center gap-2"
                  >
                    Rescan Bus
                  </button>

                  <button 
                    type="submit"
                    disabled={startDutyLoading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest transition-all rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {startDutyLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Starting...
                      </>
                    ) : (
                      'Start Duty'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* 2. TRIP HOME SCREEN (MAIN CONDUCTOR TERMINAL) */}
          {currentView === 'TRIP_HOME' && (
            <motion.div
              key="trip-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5 w-full"
            >
              {/* HEADER TRIP BOARD */}
              <div className="bg-gradient-to-br from-[#0D2A5D] to-[#06132b] text-white p-6 rounded-3xl shadow-lg space-y-4 relative overflow-hidden border border-slate-800">
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                  <Navigation size={140} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <span className="px-3 py-1 bg-[#D97F00] text-white text-xs font-extrabold uppercase tracking-widest rounded-lg border border-orange-500 shadow-sm">
                    {activeNumberPlate}
                  </span>
                  <span className="text-xs font-mono font-black text-orange-400 bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-900/30">
                    TRIP: {activeTripId}
                  </span>
                </div>
                <div className="space-y-1 relative z-10 pt-2">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">ACTIVE ROUTE RUN</p>
                  <h2 className="text-lg font-black uppercase tracking-tight text-white leading-snug">{activeRouteName}</h2>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-300 border-t border-white/10 pt-4 relative z-10 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <User size={13} className="text-[#D97F00]" /> Conductor {activeConductorId}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    GPS TELEMETRY ACTIVE
                  </span>
                </div>
              </div>

              {/* STATS SMALL CARDS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between min-h-[110px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Ticket size={12} className="text-[#D97F00]" /> Tickets Today
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-3">
                    <span className="text-3xl font-black text-slate-900">{totalTicketsCount}</span>
                    <span className="text-xs text-slate-400 font-extrabold uppercase">Issued</span>
                  </div>
                </div>
                
                <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between min-h-[110px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-600" /> Revenue Today
                  </p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-sm text-slate-500 font-extrabold">₹</span>
                    <span className="text-3xl font-black text-slate-900">{totalRevenueSum}</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase ml-1.5 bg-emerald-50 px-1.5 py-0.5 rounded-md">Cash</span>
                  </div>
                </div>
              </div>

              {/* PRIMARY ACTION BUTTONS */}
              <div className="grid grid-cols-1 gap-4 pt-2">
                <button 
                  onClick={() => setCurrentView('ISSUE_TICKET')}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-md transition-all border border-emerald-500"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  Issue Ticket
                </button>

                <button 
                  onClick={() => {
                    setScanPayload('');
                    setCurrentView('SCAN_QR');
                  }}
                  className="w-full py-5 bg-[#0D2A5D] hover:bg-[#0a2149] active:scale-[0.98] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-md transition-all"
                >
                  <QrCode size={18} />
                  Scan QR Ticket
                </button>
              </div>

              {/* TRIP HISTORY & END TRIP PANEL */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <button 
                  onClick={() => setCurrentView('TRIP_HISTORY')}
                  className="w-full py-3.5 bg-white border border-slate-200 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl shadow-xs transition-all"
                >
                  <History size={15} />
                  Trip History
                </button>

                <button 
                  onClick={handleEndTrip}
                  className="w-full py-3.5 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 active:scale-[0.98] text-rose-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl shadow-xs transition-all"
                >
                  <XCircle size={15} />
                  End Trip
                </button>
              </div>
            </motion.div>
          )}

          {/* 3.1 ISSUE TICKET FORM */}
          {currentView === 'ISSUE_TICKET' && (
            <motion.div
              key="issue-ticket"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-white border border-slate-150 p-6 shadow-md rounded-3xl flex flex-col gap-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button 
                  onClick={() => setCurrentView('TRIP_HOME')}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-[#0D2A5D]">
                  New Ticket
                </span>
              </div>

              <form onSubmit={handleIssueTicket} className="space-y-4">
                {/* Boarding Stop Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={13} className="text-[#0D2A5D]" /> Boarding Stop
                  </label>
                  <div className="relative">
                    <select
                      value={boardingStop}
                      onChange={(e) => setBoardingStop(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#D97F00] focus:bg-white cursor-pointer rounded-xl transition-all"
                    >
                      {activeBusStops.map((stop, idx) => (
                        <option key={idx} value={stop}>{stop}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination Stop Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={13} className="text-[#D97F00] animate-bounce" /> Destination Stop
                  </label>
                  <div className="relative">
                    <select
                      value={destinationStop}
                      onChange={(e) => setDestinationStop(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#D97F00] focus:bg-white cursor-pointer rounded-xl transition-all"
                    >
                      {activeBusStops.map((stop, idx) => (
                        <option key={idx} value={stop}>{stop}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Passengers Count (Stepper 1-5) */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Passengers
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden h-[48px] bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setPassengersCount(Math.max(1, passengersCount - 1))}
                        className="w-14 h-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-black text-lg transition-colors border-r border-slate-200"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-black text-base text-slate-900 select-none">
                        {passengersCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPassengersCount(Math.min(5, passengersCount + 1))}
                        className="w-14 h-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-black text-lg transition-colors border-l border-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Ticket Type */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Ticket Type
                    </label>
                    <select
                      value={ticketType}
                      onChange={(e) => setTicketType(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#D97F00] focus:bg-white cursor-pointer h-[48px] rounded-xl transition-all"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="STUDENT">Student (50%)</option>
                      <option value="CONCESSION">Concession</option>
                    </select>
                  </div>
                </div>

                {/* Fare Preview Display */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-5 rounded-2xl mt-2 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Fare Breakdown</p>
                    <p className="text-xs text-slate-700 font-extrabold uppercase mt-0.5 leading-tight">
                      {boardingStop} ➜ {destinationStop}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{passengersCount} × {ticketType} Rate</p>
                  </div>
                  <div className="text-right">
                    {previewLoading ? (
                      <Loader2 className="animate-spin text-[#D97F00] inline-block" size={24} />
                    ) : farePreview !== null ? (
                      <p className="text-3xl font-black text-[#D97F00]">₹{farePreview}</p>
                    ) : (
                      <p className="text-xs text-rose-500 font-black uppercase">Invalid Stops</p>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={farePreview === null || issueLoading}
                  className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest transition-all rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {issueLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Issuing Ticket...
                    </>
                  ) : (
                    'Issue Ticket (Cash)'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* 3.3 TICKET CONFIRMATION RECEIPT */}
          {currentView === 'TICKET_CONFIRMATION' && lastIssuedTicket && (
            <motion.div
              key="ticket-confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-5"
            >
              {/* Receipt Wrapper with custom border details */}
              <div className="bg-white border-2 border-dashed border-slate-300 p-6 shadow-md rounded-3xl relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                {/* Visual side punches */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-slate-100 border-r border-slate-300 rounded-full transform -translate-y-1/2" />
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-slate-100 border-l border-slate-300 rounded-full transform -translate-y-1/2" />

                <div className="text-center pb-4 border-b border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-xs">
                    <CheckCircle2 size={26} />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-widest text-[#0D2A5D]">
                    Nigazhthisai E-Ticket
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-1 uppercase">
                    TICKET ID: <span className="font-mono text-slate-800 font-black">{lastIssuedTicket.ticket_id}</span>
                  </p>
                </div>

                <div className="py-4 space-y-4 text-xs">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap">Bus & Route</span>
                    <span className="text-slate-700 font-black text-right max-w-[200px] leading-tight text-sm">
                      {activeNumberPlate} • {activeRouteName}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center gap-4 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">Boarding Stop</span>
                    <span className="text-slate-800 font-black text-sm">{lastIssuedTicket.origin_name}</span>
                  </div>

                  <div className="flex justify-between items-center gap-4 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">Destination Stop</span>
                    <span className="text-slate-800 font-black text-sm">{lastIssuedTicket.destination_name}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-b border-slate-200/60 py-4 my-2.5 bg-slate-50 rounded-2xl px-3.5 shadow-xs">
                    <div>
                      <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider block">Quantity & Class</span>
                      <span className="text-slate-800 font-black text-sm uppercase">
                        {lastIssuedTicket.seats} Passenger{lastIssuedTicket.seats > 1 ? 's' : ''} ({lastIssuedTicket.ticket_type})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider block">Fare Paid</span>
                      <span className="text-xl font-black text-[#D97F00]">₹{lastIssuedTicket.fare}.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 font-extrabold uppercase tracking-wider pt-1">
                    <span>Date: {lastIssuedTicket.date}</span>
                    <span>Time: {lastIssuedTicket.issued_at}</span>
                  </div>
                </div>

                {/* MOCK ETM PRINTER BOX */}
                <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <Printer size={14} className="text-[#D97F00]" />
                    ETM Printer Protocol
                  </div>
                  <p className="text-xs text-slate-300 leading-normal font-bold uppercase">
                    Connects directly to onboard printer. Supports thermal roll output.
                  </p>
                  
                  {/* Android ETM Device Printer trigger link */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log("ETM Thermal Printer command triggered: printing ticket", lastIssuedTicket);
                      toast.success('ETM Print instruction sent to hardware', { icon: '🖨️' });
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-[#D97F00] hover:text-orange-300 font-black text-xs uppercase tracking-wider transition-colors border border-slate-700 rounded-xl"
                  >
                    Simulate Paper Print
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setPassengersCount(1);
                  setTicketType('REGULAR');
                  setCurrentView('TRIP_HOME');
                }}
                className="w-full py-4.5 bg-[#0D2A5D] hover:bg-[#0a2149] text-white font-black text-sm uppercase tracking-widest shadow-md transition-colors text-center rounded-xl active:scale-[0.98]"
              >
                Done (New Ticket)
              </button>
            </motion.div>
          )}

          {/* 4.1 SCAN QR CODE SCREEN */}
          {currentView === 'SCAN_QR' && (
            <motion.div
              key="scan-qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-white border border-slate-150 p-6 shadow-md rounded-3xl flex flex-col gap-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button 
                  onClick={() => setCurrentView('TRIP_HOME')}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-[#0D2A5D]">
                  Validator
                </span>
              </div>

              {/* CAMERA VIEWFINDER OVERLAY */}
              <div className="relative w-full aspect-square bg-slate-950 flex flex-col items-center justify-center overflow-hidden border border-slate-800 rounded-3xl shadow-inner">
                {/* HTML5 QR Reader viewport */}
                <div id="reader" className="w-full h-full absolute inset-0 overflow-hidden" />

                {/* Viewfinder brackets */}
                <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-[#D97F00] rounded-tl-xl z-20 pointer-events-none" />
                <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-[#D97F00] rounded-tr-xl z-20 pointer-events-none" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-[#D97F00] rounded-bl-xl z-20 pointer-events-none" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-[#D97F00] rounded-br-xl z-20 pointer-events-none" />

                {/* Laser scan line anim */}
                {isCameraActive && (
                  <div className="absolute left-0 right-0 h-0.5 bg-orange-400 shadow-[0_0_12px_rgba(217,127,0,0.8)] top-1/4 animate-[bounce_2s_infinite] z-20 pointer-events-none" />
                )}

                {!isCameraActive && (
                  <div className="text-center p-6 space-y-2 z-10 bg-slate-950/80 backdrop-blur-xs max-w-xs border border-slate-800 rounded-2xl">
                    <QrCode size={40} className="mx-auto text-[#D97F00] animate-pulse" />
                    <p className="text-sm font-black text-white uppercase tracking-tight">Camera Feed Inactive</p>
                    <p className="text-[10px] text-slate-400 font-extrabold leading-relaxed uppercase">
                      Tap the button below to enable camera scanning.
                    </p>
                  </div>
                )}
              </div>

              {/* CAMERA CONTROL BUTTON */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={isCameraActive ? stopCamera : startCamera}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    isCameraActive 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                  }`}
                >
                  <QrCode size={16} />
                  {isCameraActive ? 'Disable Camera' : 'Enable Camera Scanner'}
                </button>
              </div>

              {/* INPUT FORM FOR PAYLOAD */}
              <form onSubmit={handleScanQR} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Manual Ticket QR Payload Input
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="e.g. TKT-VALID-12345"
                      value={scanPayload}
                      onChange={(e) => setScanPayload(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#D97F00] focus:bg-white rounded-xl transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={scanLoading}
                      className="py-3 px-6 bg-[#0D2A5D] hover:bg-[#0a2149] text-white font-black text-xs uppercase tracking-widest transition-colors rounded-xl shadow-sm"
                    >
                      {scanLoading ? '...' : 'Scan'}
                    </button>
                  </div>
                </div>

                {/* SIMULATOR QUICK PRESET SHORTCUTS */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Quick-Test Simulators
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 text-xs font-black uppercase tracking-wider text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setScanPayload('TKT-VALID-NIG849204');
                        toast.success('Preset Selected: Valid QR');
                      }}
                      className="py-3 px-2 bg-emerald-50 text-emerald-800 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                      Valid Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScanPayload('TKT-EXPIRED-NIG582049');
                        toast.success('Preset Selected: Expired QR');
                      }}
                      className="py-3 px-2 bg-rose-50 text-rose-800 border-2 border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      Expired Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScanPayload('TKT-WRONGBUS-NIG901048');
                        toast.success('Preset Selected: Wrong Bus QR');
                      }}
                      className="py-3 px-2 bg-amber-50 text-amber-800 border-2 border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                    >
                      Wrong Route
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* 4.2 SCAN RESULT DISPLAY */}
          {currentView === 'SCAN_RESULT' && scanResult && (
            <motion.div
              key="scan-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              {scanResult.valid ? (
                /* VALID TICKET SCREEN */
                <div className="bg-white border-2 border-emerald-200 p-8 shadow-md text-center space-y-6 rounded-3xl">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                    <CheckCircle2 size={44} />
                  </div>

                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-widest rounded-lg border border-emerald-200">
                      VALID BOARDING TICKET
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-4">
                      Access Authorized
                    </h3>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 p-5 text-sm space-y-3.5 text-left font-semibold rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">Ticket Code</span>
                      <span className="text-slate-800 font-black font-mono">{scanResult.ticket_info.ticket_id}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-150 pt-2.5">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">Passenger</span>
                      <span className="text-slate-800 font-black text-sm">{scanResult.ticket_info.passenger_name}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-150 pt-2.5">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">Route Bound</span>
                      <span className="text-slate-800 font-black text-right max-w-[200px] text-xs">
                        {scanResult.ticket_info.origin} ➜ {scanResult.ticket_info.destination}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-150 pt-2.5">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">Allowed Seats</span>
                      <span className="text-emerald-700 font-black text-sm">{scanResult.ticket_info.seats} Seats Registered</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => setCurrentView('TRIP_HOME')}
                      className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest transition-colors rounded-xl"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setScanPayload('');
                        setCurrentView('SCAN_QR');
                      }}
                      className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest transition-colors rounded-xl shadow-xs"
                    >
                      Scan Next
                    </button>
                  </div>
                </div>
              ) : (
                /* INVALID TICKET SCREEN */
                <div className="bg-white border-2 border-rose-200 p-8 shadow-md text-center space-y-6 rounded-3xl">
                  <div className="w-20 h-20 bg-rose-50 text-rose-600 border-2 border-rose-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <XCircle size={44} />
                  </div>

                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-widest rounded-lg border border-rose-200">
                      TICKET VALIDATION REJECTED
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-4">
                      Access Denied
                    </h3>
                  </div>

                  <div className="bg-rose-50/50 border border-rose-150 p-5 text-sm space-y-3.5 text-left text-slate-700 font-semibold rounded-2xl">
                    <div className="flex items-start gap-3 text-rose-800">
                      <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black uppercase text-[10px] tracking-wider">Failure Reason</p>
                        <p className="mt-1 leading-relaxed text-slate-800 font-extrabold text-sm">
                          {scanResult.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => setCurrentView('TRIP_HOME')}
                      className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest transition-colors rounded-xl"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setScanPayload('');
                        setCurrentView('SCAN_QR');
                      }}
                      className="py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest transition-colors rounded-xl shadow-xs"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 5. TRIP HISTORY SCREEN */}
          {currentView === 'TRIP_HISTORY' && (
            <motion.div
              key="trip-history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full bg-white border border-slate-150 p-6 shadow-md rounded-3xl flex flex-col gap-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button 
                  onClick={() => setCurrentView('TRIP_HOME')}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-[#0D2A5D]">
                  Duty Logs
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                  Today's Cash Tickets
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  ACTIVE TRIP HISTORY: {activeTripId}
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {ticketsToday.length > 0 ? (
                  ticketsToday.map((ticket, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-slate-50 border border-slate-200 flex items-center justify-between rounded-2xl shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                            {ticket.ticket_id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{ticket.issued_at}</span>
                        </div>
                        <p className="text-xs font-black text-slate-850 leading-tight">
                          {ticket.origin_name} ➜ {ticket.destination_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                          {ticket.seats} Seat{ticket.seats > 1 ? 's' : ''} ({ticket.ticket_type})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900">₹{ticket.fare}</p>
                        <p className="text-[9px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md">CASH</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      No tickets issued yet
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                      Tap 'Issue Ticket' to dispatch cash fares
                    </p>
                  </div>
                )}
              </div>

              {ticketsToday.length > 0 && (
                <button
                  onClick={() => {
                    if ((window as any).bypassConfirm || window.confirm('Clear ticket sales history for this session? This does not refund passengers.')) {
                      saveTicketsToStorage([]);
                      toast.success('Sales log cleared');
                    }
                  }}
                  className="w-full mt-2 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-black text-xs uppercase tracking-widest transition-colors border border-rose-200 text-center rounded-xl"
                >
                  Clear Log Data
                </button>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER SYSTEM DETAILS */}
      <footer className="bg-slate-50 py-3.5 px-4 border-t border-slate-200 shrink-0 text-center select-none">
        <div className="max-w-md mx-auto w-full flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Duty Status: {jwt ? 'Active' : 'Offline'}</span>
          <span>Nigazhthisai OS v2.4</span>
        </div>
      </footer>

    </div>
  );
};
