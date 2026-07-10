// ========================================================
// NIGAZHTHISAI SUPER APP PASSENGER CLIENT
// ========================================================

import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Search, 
  MapPin, 
  Ticket as TicketIcon, 
  User, 
  LogOut, 
  ArrowLeftRight, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  Activity as ActivityInfoIcon,
  X,
  Mail,
  Globe,
  ChevronDown,
  CreditCard,
  RefreshCw,
  Menu,
  ShieldAlert,
  Send,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../lib/i18n';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { NigazhthisaiIcon } from '../components/NigazhthisaiLogo';

// Nigazhthisai Hooks & Types
import { useNigazhthisai } from '../hooks/useNigazhthisai';
import { eraseCookie } from '../utils/cookies';
import { adminApi } from '../lib/api';

type View = 
  | 'HOME'
  | 'SPOT' 
  | 'ACTIVITY' 
  | 'TRACKING' 
  | 'BOOKING' 
  | 'TICKET' 
  | 'COMPLAINT'
  | 'SOS_HISTORY';

const TAMIL_NADU_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 
  'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 
  'Viluppuram', 'Virudhunagar'
];

const STOPS_BY_DISTRICT: Record<string, string[]> = {
  'Ariyalur': ['Ariyalur Bus Stand', 'Jayamkondam', 'Sendurai', 'Andimadam', 'T.Palur'],
  'Chengalpattu': ['Chengalpattu', 'Maduranthakam', 'Tambaram', 'Pallavaram', 'Vandalur', 'Kelambakkam'],
  'Chennai': ['Koyambedu (CMBT)', 'Central Railway Station', 'Egmore', 'Adyar', 'T.Nagar', 'Broadway'],
  'Coimbatore': ['Gandhipuram', 'Singanallur', 'Ukkadam', 'Mettupalayam', 'Pollachi', 'Thudiyalur'],
  'Cuddalore': ['Cuddalore', 'Chidambaram', 'Virudhachalam', 'Panruti', 'Neyveli'],
  'Dharmapuri': ['Dharmapuri', 'Harur', 'Pennagaram', 'Pappireddipatti', 'Palacode'],
  'Dindigul': ['Dindigul', 'Palani', 'Kodaikanal', 'Oddanchatram', 'Nilakottai'],
  'Erode': ['Central Bus Stand', 'Perundurai', 'Bhavani', 'Gobichettipalayam', 'Sathyamangalam'],
  'Kallakurichi': ['Kallakurichi', 'Sankarapuram', 'Ulundurpet', 'Tirukkoyilur', 'Chinnasalem'],
  'Kanchipuram': ['Kanchipuram', 'Sriperumbudur', 'Walajabad', 'Kundrathur', 'Uthiramerur'],
  'Kanyakumari': ['Nagercoil', 'Kanyakumari', 'Marthandam', 'Thuckalay', 'Colachel'],
  'Karur': ['Karur', 'Kulithalai', 'Pallapatti', 'Aravakurichi', 'Krishnarayapuram'],
  'Krishnagiri': ['Krishnagiri', 'Hosur', 'Denkanikottai', 'Pochampalli', 'Uthangarai'],
  'Madurai': ['Mattuthavani', 'Periyar Bus Stand', 'Arapalayam', 'Tirumangalam', 'Melur'],
  'Mayiladuthurai': ['Mayiladuthurai', 'Sirkazhi', 'Kuthalam', 'Tarangambadi', 'Vaitheeswaran Koil'],
  'Nagapattinam': ['Nagapattinam', 'Velankanni', 'Vedaranyam', 'Kilvelur', 'Thirukkuvalai'],
  'Namakkal': ['Namakkal', 'Tiruchengode', 'Rasipuram', 'Paramathi Velur', 'Kumarapalayam'],
  'Nilgiris': ['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur', 'Wellington'],
  'Perambalur': ['Perambalur', 'Kunnam', 'Veppanthattai', 'Alathur'],
  'Pudukkottai': ['Pudukkottai', 'Aranthangi', 'Alangudi', 'Iluppur', 'Keeranur'],
  'Ramanathapuram': ['Ramanathapuram', 'Rameswaram', 'Paramakudi', 'Mudukulathur', 'Keelakarai'],
  'Ranipet': ['Ranipet', 'Arcot', 'Walajah', 'Sholinghur', 'Arakkonam'],
  'Salem': ['Salem New Bus Stand', 'Old Bus Stand', 'Attur', 'Mettur', 'Edappadi'],
  'Sivaganga': ['Sivaganga', 'Karaikudi', 'Devakottai', 'Manamadurai', 'Kalayarkoil'],
  'Tenkasi': ['Tenkasi', 'Sankarankovil', 'Kadayanallur', 'Sengottai', 'Alangulam'],
  'Thanjavur': ['Thanjavur', 'Kumbakonam', 'Pattukkottai', 'Papanasam', 'Orathanadu'],
  'Theni': ['Theni', 'Bodinayakanur', 'Periyakulam', 'Cumbum', 'Andipatti'],
  'Thoothukudi': ['Thoothukudi', 'Tiruchendur', 'Kovilpatti', 'Vilathikulam', 'Sathankulam'],
  'Tiruchirappalli': ['Central Bus Stand', 'Chatram Bus Stand', 'Srirangam', 'Thuvakudi', 'Lalgudi'],
  'Tirunelveli': ['Nellai Bus Stand', 'Palayamkottai', 'Ambasamudram', 'Nanguneri', 'Valliyur'],
  'Tirupathur': ['Tirupathur', 'Vaniyambadi', 'Ambur', 'Natrampalli', 'Jolarpet'],
  'Tiruppur': ['Old Bus Stand', 'New Bus Stand', 'Avinashi', 'Palladam', 'Dharapuram', 'Udumalaipettai'],
  'Tiruvallur': ['Tiruvallur', 'Avadi', 'Poonamallee', 'Red Hills', 'Tiruttani'],
  'Tiruvannamalai': ['Tiruvannamalai', 'Arani', 'Cheyyar', 'Polur', 'Vandavasi'],
  'Tiruvarur': ['Tiruvarur', 'Mannargudi', 'Thiruthuraipoondi', 'Nannilam', 'Kodavasal'],
  'Vellore': ['Green Circle', 'Katpadi', 'Gudiyatham', 'Pernambut'],
  'Viluppuram': ['Viluppuram', 'Tindivanam', 'Gingee', 'Vikravandi', 'Marakkanam'],
  'Virudhunagar': ['Virudhunagar', 'Sivakasi', 'Rajapalayam', 'Aruppukkottai', 'Sattur'],
  'default': ['Main Bus Stand', 'Railway Station', 'Town Center', 'Market Stop']
};

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Tiruppur': { lat: 11.1085, lng: 77.3411 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
  'Salem': { lat: 11.6643, lng: 78.1460 },
  'Erode': { lat: 11.3410, lng: 77.7172 }
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const LiveOccupancyProgressBar: React.FC<{ occupancy: number; max?: number }> = ({ occupancy, max = 50 }) => {
  const percentage = Math.min((occupancy / max) * 100, 100);
  let fillBgClass = '';
  let fillColor: string | null = null;
  let shadowStyle = '';

  if (percentage > 93) {
    // No Space: Flashing vibrant gradient
    fillBgClass = 'bg-gradient-to-r from-rose-600 via-purple-600 via-orange-500 to-rose-600 animate-[pulse_1s_infinite]';
    shadowStyle = 'rgba(225,29,72,0.6)';
  } else if (percentage > 83) {
    // Last 10% (83% - 93%): Solid Red
    fillColor = '#ef4444'; // Explicit hex Red
    shadowStyle = 'rgba(239,68,68,0.4)';
  } else if (percentage > 33) {
    // Next 50% (33% - 83%): Solid Orange
    fillColor = '#f97316'; // Explicit hex Orange
    shadowStyle = 'rgba(249,115,22,0.3)';
  } else {
    // 0% - 33%: Solid Green
    fillColor = '#22c55e'; // Explicit hex Green
    shadowStyle = 'rgba(34,197,94,0.3)';
  }

  return (
    <div className="w-full">
      <div className="h-2 w-full bg-slate-100 border border-slate-200/50 rounded-none overflow-hidden relative shadow-inner">
        <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
          {[...Array(5)].map((_, i) => <div key={i} className="w-px h-full bg-slate-400" />)}
        </div>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ 
            boxShadow: `0 0 10px ${shadowStyle}`,
            ...(fillColor ? { backgroundColor: fillColor } : {})
          }}
          className={`h-full relative rounded-none transition-all ${fillBgClass}`}
        >
          <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
        </motion.div>
      </div>
    </div>
  );
};

interface PassengerPageProps {
  initialView?: View;
}

export const PassengerPage: React.FC<PassengerPageProps> = ({ initialView }) => {
  const { t, language, setLanguage } = useTranslation();
  const [showSplash, setShowSplash] = useState(initialView ? false : true);
  const [currentView, setCurrentView] = useState<View>(initialView === 'SOS_HISTORY' ? 'ACTIVITY' : (initialView || 'HOME'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopSelectionType, setStopSelectionType] = useState<'FROM' | 'TO'>('FROM');
  
  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => {
    return localStorage.getItem('selected_district') || 'Tiruppur';
  });

  const [fromStop, setFromStop] = useState<string>(() => {
    return localStorage.getItem('from_stop') || (STOPS_BY_DISTRICT[selectedDistrict] || STOPS_BY_DISTRICT['default'])[0];
  });
  
  const [toStop, setToStop] = useState<string>(() => {
    return localStorage.getItem('to_stop') || (STOPS_BY_DISTRICT[selectedDistrict] || STOPS_BY_DISTRICT['default'])[1];
  });

  const [numSeats, setNumSeats] = useState(1);
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const navigate = useNavigate();

  // Supabase Authenticated User Session ID
  const [userId, setUserId] = useState<string | null>(null);

  // Transit state definitions
  const [trips, setTrips] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [dbStops, setDbStops] = useState<string[]>([]);
  const [isTransitLoading, setIsTransitLoading] = useState(false);

  // Geo-tiling states
  const [allStopsWithCoords, setAllStopsWithCoords] = useState<any[]>([]);
  const [hasAutoFilledNearest, setHasAutoFilledNearest] = useState(false);

  // Complaint grievance form states
  const [complaintType, setComplaintType] = useState('Delay');
  const [complaintDesc, setComplaintDesc] = useState('');

  // SOS Countdown state
  const [sosActive, setSosActive] = useState(false);
  const [userName, setUserName] = useState<string>('Citizen');

  // SOS Chat State
  const [activeSosAlertId, setActiveSosAlertId] = useState<number | null>(null);
  const [isSosChatOpen, setIsSosChatOpen] = useState(false);
  const [sosMessages, setSosMessages] = useState<any[]>([]);
  const [newSosMessageText, setNewSosMessageText] = useState('');

  const fetchSosMessages = async (alertId: number) => {
    try {
      const { data, error } = await supabase.rpc('rpc_get_alert_messages', { p_alert_id: alertId });
      if (!error && data) {
        setSosMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendSosMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSosMessageText.trim() || !activeSosAlertId) return;
    try {
      const { data, error } = await supabase.rpc('rpc_send_alert_message', {
        p_alert_id: activeSosAlertId,
        p_sender_role: 'USER',
        p_sender_name: userName,
        p_message: newSosMessageText.trim()
      });
      if (!error && data) {
        setNewSosMessageText('');
        setSosMessages(prev => [...prev, data]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Poll SOS messages
  useEffect(() => {
    if (!isSosChatOpen || !activeSosAlertId) return;
    fetchSosMessages(activeSosAlertId);
    const interval = setInterval(() => {
      fetchSosMessages(activeSosAlertId);
    }, 3000);
    return () => clearInterval(interval);
  }, [isSosChatOpen, activeSosAlertId]);

  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [isLoadingSosAlerts, setIsLoadingSosAlerts] = useState(false);
  const [activityTab, setActivityTab] = useState<'BOOKINGS' | 'SOS'>(initialView === 'SOS_HISTORY' ? 'SOS' : 'BOOKINGS');

  const fetchPassengerSosAlerts = async (uid: string, autoResume = false) => {
    if (!uid) return;
    try {
      setIsLoadingSosAlerts(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('type', 'SOS')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setSosAlerts(data);
        
        if (autoResume) {
          const activeAlert = data.find((alert: any) => 
            alert.status === 'PENDING' || alert.status === 'ACKNOWLEDGED'
          );
          if (activeAlert) {
            setActiveSosAlertId(activeAlert.id);
            setIsSosChatOpen(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSosAlerts(false);
    }
  };

  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [allocatedDriver, setAllocatedDriver] = useState<{ name: string; phone: string } | null>(null);
  const [allocatedConductor, setAllocatedConductor] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    const fetchAllocationDetails = async () => {
      if (!selectedTrip) {
        setAllocatedDriver(null);
        setAllocatedConductor(null);
        return;
      }
      
      setAllocationLoading(true);
      setAllocationError(null);
      
      try {
        const users = await adminApi.getUsers();
        
        // Find driver
        const driverName = selectedTrip.driver_name;
        if (driverName && driverName.toLowerCase() !== 'not allocated' && driverName.trim()) {
          const driverUser = (users || []).find((u: any) => 
            u.name?.toLowerCase().trim() === driverName.toLowerCase().trim() &&
            (u.role?.toUpperCase() === 'DRIVER' || u.email?.toLowerCase().includes('driver'))
          );
          if (driverUser) {
            setAllocatedDriver({
              name: driverUser.name,
              phone: driverUser.phone || ''
            });
          } else {
            setAllocatedDriver({
              name: driverName,
              phone: ''
            });
          }
        } else {
          setAllocatedDriver(null);
        }

        // Find conductor
        const conductorName = selectedTrip.conductor_name;
        if (conductorName && conductorName.toLowerCase() !== 'not allocated' && conductorName.trim()) {
          const conductorUser = (users || []).find((u: any) => 
            u.name?.toLowerCase().trim() === conductorName.toLowerCase().trim() &&
            (u.role?.toUpperCase() === 'CONDUCTOR' || u.email?.toLowerCase().includes('conductor'))
          );
          if (conductorUser) {
            setAllocatedConductor({
              name: conductorUser.name,
              phone: conductorUser.phone || ''
            });
          } else {
            setAllocatedConductor({
              name: conductorName,
              phone: ''
            });
          }
        } else {
          setAllocatedConductor(null);
        }
      } catch (err) {
        console.error('Failed to load allocation details:', err);
        setAllocationError('Failed to load allocation details.');
      } finally {
        setAllocationLoading(false);
      }
    };

    fetchAllocationDetails();
  }, [selectedTrip]);

  // Retrieve user session or initialize local passenger guest uuid
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchPassengerSosAlerts(user.id, true);
        if (user.user_metadata?.name) {
          setUserName(user.user_metadata.name);
        }
      } else {
        setUserId('00000000-0000-0000-0000-000000000000');
        setUserName('Citizen');
      }
    });
  }, []);

  // Poll passenger sos alerts history when currentView is ACTIVITY
  useEffect(() => {
    if (currentView === 'ACTIVITY' && userId) {
      fetchPassengerSosAlerts(userId);
    }
  }, [currentView, userId]);

  // Poll active SOS alert status while an active SOS alert exists or chat is open
  useEffect(() => {
    if (!userId) return;
    const hasActive = (sosAlerts || []).some((alert: any) => 
      alert.status === 'PENDING' || alert.status === 'ACKNOWLEDGED'
    );
    if (!hasActive && !isSosChatOpen) return;

    const interval = setInterval(() => {
      fetchPassengerSosAlerts(userId);
    }, 5000);

    return () => clearInterval(interval);
  }, [userId, sosAlerts, isSosChatOpen]);

  // Automatically close chat if the active alert is resolved/solved by admin
  useEffect(() => {
    if (activeSosAlertId && sosAlerts.length > 0) {
      const currentAlert = sosAlerts.find(a => a.id === activeSosAlertId);
      if (currentAlert && currentAlert.status === 'RESOLVED') {
        toast.info('This emergency alert has been marked as solved.');
        setIsSosChatOpen(false);
        setActiveSosAlertId(null);
      }
    }
  }, [activeSosAlertId, sosAlerts]);

  // Initialize Nigazhthisai custom hook with user session id
  const superApp = useNigazhthisai(userId);

  // Geolocation auto-detection of district
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          let closestDistrict = 'Tiruppur';
          let minDistance = Infinity;
          
          Object.entries(DISTRICT_COORDINATES).forEach(([district, coords]) => {
            const dist = getDistance(latitude, longitude, coords.lat, coords.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestDistrict = district;
            }
          });
          
          if (minDistance < 150) {
            setSelectedDistrict(closestDistrict);
            localStorage.setItem('selected_district', closestDistrict);
            
            const districtStops = STOPS_BY_DISTRICT[closestDistrict] || STOPS_BY_DISTRICT['default'];
            setFromStop(districtStops[0]);
            setToStop(districtStops[1]);
            localStorage.setItem('from_stop', districtStops[0]);
            localStorage.setItem('to_stop', districtStops[1]);
            
            toast.success(`Location auto-detected: ${closestDistrict}`);
          }
        },
        (error) => {
          console.warn('Geolocation access declined or unavailable:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    }
  }, []);

  // Fetch db stops
  useEffect(() => {
    const fetchStops = async () => {
      const { data } = await supabase.rpc('rpc_get_stops_by_district', { district_name: selectedDistrict });
      if (data && data.length > 0) {
        setDbStops((data as any[]).map(s => s.name));
      } else {
        setDbStops([]);
      }
    };
    fetchStops();
  }, [selectedDistrict]);

  const stopsToShow = dbStops.length > 0 ? dbStops : (STOPS_BY_DISTRICT[selectedDistrict] || STOPS_BY_DISTRICT['default']);

  // Fetch stops with coordinates for geo-tiling
  useEffect(() => {
    const fetchStopsWithCoords = async () => {
      try {
        const { data, error } = await supabase.from('stops').select('*');
        if (!error && data) {
          setAllStopsWithCoords(data);
        }
      } catch (err) {
        console.error('Failed to load stops coordinates in passenger:', err);
      }
    };
    fetchStopsWithCoords();
  }, []);

  // Compute nearest stop on startup
  useEffect(() => {
    if (allStopsWithCoords.length === 0 || hasAutoFilledNearest || stopsToShow.length === 0) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          let closestStop = null;
          let minDistance = Infinity;
          const stopsToShowLower = stopsToShow.map((s: string) => s.toLowerCase());

          allStopsWithCoords.forEach(stop => {
            if (stop.lat && stop.lng && stopsToShowLower.includes(stop.name.toLowerCase())) {
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
            setFromStop((closestStop as any).name);
            setHasAutoFilledNearest(true);
            toast.info(`Auto-selected nearest boarding stop: ${(closestStop as any).name}`);
          }
        },
        (error) => {
          console.warn("Could not retrieve geolocation for nearest stop:", error);
        }
      );
    }
  }, [allStopsWithCoords, hasAutoFilledNearest, stopsToShow]);

  // Fetch trips and passenger tickets
  const loadData = async () => {
    setIsTransitLoading(true);
    try {
      // 1. Fetch running trips in district
      const { data: tripsData, error: tripsErr } = await supabase.rpc('rpc_get_trips_by_district', { district_name: selectedDistrict });
      if (tripsErr) throw tripsErr;
      const mappedTrips = (tripsData || []).map((t: any) => ({
        ...t,
        routes: {
          code: t.route_code,
          name: t.route_name,
          stops: t.stops
        },
        buses: {
          registration_number: t.bus_registration_number,
          eta: t.bus_eta,
          capacity: t.bus_capacity,
          current_occupancy: t.bus_current_occupancy,
          fare: t.bus_fare
        }
      }));
      setTrips(mappedTrips || []);

      // 2. Fetch user's booked tickets
      if (userId) {
        const { data: ticketsData, error: ticketsErr } = await supabase.rpc('rpc_get_tickets_by_user_id', { passenger_user_id: userId });
        if (ticketsErr) throw ticketsErr;
        
        if (ticketsData && ticketsData.length > 0) {
          const { data: tripsForTickets } = await supabase
            .from('trips')
            .select('id, status')
            .in('id', ticketsData.map((t: any) => t.trip_id));
            
          const ticketsWithTripStatus = (ticketsData || []).map((t: any) => {
            const trip = (tripsForTickets || []).find((tr: any) => tr.id === t.trip_id);
            return {
              ...t,
              trip_status: trip?.status || 'PLANNED'
            };
          });
          setTickets(ticketsWithTripStatus);
        } else {
          setTickets([]);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsTransitLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [selectedDistrict, currentView, userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    localStorage.setItem('selected_district', district);
    
    const districtStops = STOPS_BY_DISTRICT[district] || STOPS_BY_DISTRICT['default'];
    setFromStop(districtStops[0]);
    setToStop(districtStops[1]);
    localStorage.setItem('from_stop', districtStops[0]);
    localStorage.setItem('to_stop', districtStops[1]);
    
    setIsDistrictModalOpen(false);
  };

  const handleStopSelect = (stop: string) => {
    if (stopSelectionType === 'FROM') {
      setFromStop(stop);
      localStorage.setItem('from_stop', stop);
    } else {
      setToStop(stop);
      localStorage.setItem('to_stop', stop);
    }
    setIsStopModalOpen(false);
  };

  const openStopModal = (type: 'FROM' | 'TO') => {
    setStopSelectionType(type);
    setStopSearchQuery('');
    setIsStopModalOpen(true);
  };

  const handleLogout = async () => {
    localStorage.clear();
    eraseCookie('sb-access-token');
    eraseCookie('sb-refresh-token');

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out from Supabase:', e);
    }
    
    navigate('/login');
  };

  const handleSubmitComplaint = async () => {
    if (!complaintDesc.trim()) {
      toast.error('Please enter a description of the issue');
      return;
    }
    
    try {
      const { error } = await supabase.rpc('rpc_insert_complaint', {
        bus_id: selectedTrip?.bus_id || '32',
        type: complaintType,
        description: complaintDesc,
        user_id: userId
      });
        
      if (error) throw error;
      
      toast.success(t('complaint.success'));
      setComplaintDesc('');
      setCurrentView('HOME');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit complaint');
    }
  };

  const handleConfirmBookingViaRazorpay = async () => {
    try {
      if (!userId) {
        toast.error('You must be logged in to book a ticket');
        return;
      }
      const fare = numSeats * (selectedTrip?.buses?.fare || 14);
      superApp.processRazorpayPayment(
        fare,
        `Bus Ticket: ${selectedTrip?.routes?.name}`,
        async (paymentId) => {
          try {
            const ticketId = `NIG-${Math.floor(100000 + Math.random() * 900000)}`;
            const ticketPayload = {
              id: ticketId,
              user_id: userId,
              trip_id: selectedTrip?.id,
              bus_id: selectedTrip?.bus_id,
              bus_name: selectedTrip?.routes?.name || selectedTrip?.bus_name || 'Bus 32',
              from_stop: fromStop,
              to_stop: toStop,
              seats: numSeats,
              fare: fare,
              channel: 'APP',
              status: 'CONFIRMED',
              qr_payload: `VALID:${ticketId}`,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
            
            let ticket = null;
            const { data, error } = await supabase.rpc('rpc_insert_ticket', {
              ticket_id: ticketPayload.id,
              user_id: ticketPayload.user_id,
              trip_id: ticketPayload.trip_id,
              bus_id: ticketPayload.bus_id,
              bus_name: ticketPayload.bus_name,
              from_stop: ticketPayload.from_stop,
              to_stop: ticketPayload.to_stop,
              seats: ticketPayload.seats,
              fare: ticketPayload.fare,
              channel: ticketPayload.channel,
              status: ticketPayload.status,
              qr_payload: ticketPayload.qr_payload,
              ticket_date: ticketPayload.date
            });
            if (error) {
              ticket = ticketPayload;
            } else {
              ticket = data;
            }
            toast.success('Ticket Booked & Paid via Razorpay!');
            setSelectedTicket(ticket);
            setCurrentView('TICKET');
          } catch (err: any) {
            toast.error(err.message || 'Verification complete but ticket placement failed');
          }
        }
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate Razorpay payment');
    }
  };

  const triggerSOSAlert = () => {
    const hasActiveSOS = (sosAlerts || []).some((alert: any) => 
      alert.status === 'PENDING' || alert.status === 'ACKNOWLEDGED'
    );
    if (hasActiveSOS) {
      toast.warning('An active SOS emergency is already running. Please use the open chat to communicate.');
      const activeAlert = (sosAlerts || []).find((alert: any) => 
        alert.status === 'PENDING' || alert.status === 'ACKNOWLEDGED'
      );
      if (activeAlert) {
        setActiveSosAlertId(activeAlert.id);
        setIsSosChatOpen(true);
      }
      return;
    }

    setSosActive(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const alertId = await superApp.triggerSOS(pos.coords.latitude, pos.coords.longitude);
        if (alertId) {
          setActiveSosAlertId(alertId);
          setIsSosChatOpen(true);
          if (userId) fetchPassengerSosAlerts(userId);
        }
      },
      async () => {
        const alertId = await superApp.triggerSOS(13.0827, 80.2707); // Default Chennai fallback
        if (alertId) {
          setActiveSosAlertId(alertId);
          setIsSosChatOpen(true);
          if (userId) fetchPassengerSosAlerts(userId);
        }
      }
    );
    setTimeout(() => {
      setSosActive(false);
    }, 4000);
  };

  // --- Sub-Views ---

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Welcome Branding Card */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0D2A5D] to-indigo-950 p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Bus size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Nigazhthisai Transit</p>
                <p className="text-xs text-slate-200 mt-1 font-semibold">Universal Transit Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-auto">
            <div>
              <p className="text-xl font-black tracking-tight">Welcome, {userName}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-bold rounded-none">ONLINE</span>
            </div>
          </div>
        </div>
        <div className="absolute right-[-40px] bottom-[-40px] opacity-10 pointer-events-none">
          <NigazhthisaiIcon size={180} />
        </div>
      </div>

      {/* District Selector */}
      <div 
        onClick={() => setIsDistrictModalOpen(true)}
        className="bg-white px-5 py-4 border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer group hover:border-emerald-500 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-none group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Globe size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t('ui.select_district')}</p>
            <p className="text-sm font-black text-slate-900 leading-none">{t(`dist.${selectedDistrict}`)}</p>
          </div>
        </div>
        <ChevronDown size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </div>
 
      {/* Services Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'SPOT', label: 'Bus Booking', icon: Bus, gradient: 'from-emerald-50 to-teal-50 text-emerald-600 hover:border-emerald-500' },
          { id: 'ACTIVITY', label: 'Booking History', icon: ActivityInfoIcon, gradient: 'from-blue-50 to-indigo-50 text-blue-600 hover:border-blue-500' },
          { id: 'TICKET', label: 'Live Ticket', icon: TicketIcon, gradient: 'from-amber-50 to-orange-50 text-amber-600 hover:border-amber-500' },
          { id: 'COMPLAINT', label: 'Grievance', icon: Mail, gradient: 'from-rose-50 to-amber-50 text-rose-500 hover:border-rose-600' }
        ].map((service) => (
          <button
            key={service.id}
            onClick={() => {
              if (service.id === 'TICKET') {
                const liveTicket = tickets.find(t => t.status === 'CONFIRMED' || t.status === 'BOARDED');
                if (liveTicket) {
                  setSelectedTicket(liveTicket);
                  setCurrentView('TICKET');
                } else {
                  toast.error('No Live Ticket found. You do not have any active running trips at this moment.');
                }
              } else {
                setCurrentView(service.id as View);
              }
            }}
            className={`bg-white p-4 border border-slate-200 flex flex-col items-center justify-center text-center gap-3 transition-all hover:-translate-y-0.5 active:scale-95 group shadow-sm`}
          >
            <div className={`p-3 rounded-none bg-gradient-to-br ${service.gradient} transition-transform group-hover:scale-115`}>
              <service.icon size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-tight">{service.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const SpotView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-2">
        <button 
          onClick={() => setCurrentView('HOME')}
          className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Bus Lookup</h2>
      </div>

      {/* Search Section */}
      <div className="bg-white p-1 rounded-none shadow-sm border border-slate-200">
        <div className="flex flex-col relative">
          <button 
            onClick={() => openStopModal('FROM')}
            className="flex items-center gap-4 p-3 rounded-none hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-none transition-colors bg-blue-50 text-blue-500">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'TA' ? 'புறப்படும் இடம்' : 'BOARDING FROM'}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 truncate">{fromStop}</p>
              </div>
            </div>
          </button>
          
          <div className="mx-14 h-px bg-slate-100 relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const tempStop = fromStop;
                setFromStop(toStop);
                setToStop(tempStop);
              }}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-slate-200 flex items-center justify-center rounded-none shadow-md text-emerald-600 hover:text-emerald-700 active:scale-90 transition-all"
            >
              <ArrowLeftRight size={14} className="rotate-90" />
            </button>
          </div>

          <button 
            onClick={() => openStopModal('TO')}
            className="flex items-center gap-4 p-3 rounded-none hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-none transition-colors bg-rose-50 text-rose-500">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'TA' ? 'சேருமிடம்' : 'DESTINATION TO'}</p>
              <p className="text-sm font-bold text-slate-900 truncate">{toStop}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Live Running Buses list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">{language === 'TA' ? 'நேரடி பேருந்துகள்' : 'Active Scheduled Buses'}</h2>
          </div>
          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-none font-bold text-slate-400 uppercase tracking-wider">{trips.length} Running</span>
        </div>

        {isTransitLoading ? (
          <div className="py-16 text-center space-y-4">
            <RefreshCw size={24} className="animate-spin text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing schedule logs...</p>
          </div>
        ) : trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map((trip) => {
              const busNo = trip.buses?.registration_number || trip.bus_id;
              const routeName = trip.routes?.name || 'Local Route';
              const routeCode = trip.routes?.code || 'R32';
              const eta = trip.buses?.eta || 5;
              const capacity = trip.buses?.capacity || 50;
              const occupancy = trip.buses?.current_occupancy || 0;
              const fare = trip.buses?.fare || 14;

              return (
                <div 
                  key={trip.id} 
                  className="bg-white border border-slate-200 overflow-hidden relative shadow-sm hover:border-emerald-500 transition-colors"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-none shadow-sm uppercase tracking-wider">{routeCode}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{busNo}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight uppercase truncate">{routeName}</h3>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{language === 'TA' ? 'கட்டணம்' : 'FARE'}</p>
                        <p className="text-lg font-black text-emerald-600 leading-none mt-1">₹{fare}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-b border-slate-50 py-3">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-emerald-500" />
                        <span>ETA: {eta} MINS</span>
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-100 rounded-full" />
                      <div>
                        <span>SEATS: {capacity - occupancy} AVAILABLE</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>{language === 'TA' ? 'இருக்கை பயன்பாடு' : 'Bus Occupancy'}</span>
                        <span className="text-slate-800 font-black">{occupancy}/{capacity} Seats Filled</span>
                      </div>
                      <LiveOccupancyProgressBar occupancy={occupancy} max={capacity} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        onClick={() => {
                          setSelectedTrip(trip);
                          setCurrentView('TRACKING');
                        }}
                        className="py-3 bg-slate-50 border border-slate-200 text-slate-800 font-black text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-slate-100 transition-all text-center flex items-center justify-center gap-2"
                      >
                        <MapPin size={12} className="text-slate-600" />
                        <span>Track Bus</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedTrip(trip);
                          setNumSeats(1);
                          setCurrentView('BOOKING');
                        }}
                        className="py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-slate-800 transition-all text-center"
                      >
                        Book Ticket
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-white border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-none flex items-center justify-center mx-auto text-slate-300">
              <Bus size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{language === 'TA' ? 'சேவை இல்லை' : 'No Active Buses Scheduled'}</p>
              <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Try changing district or locations</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );

  const BookingView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-2">
        <button 
          onClick={() => setCurrentView('SPOT')}
          className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Seat Selection</h2>
      </div>

      <div className="bg-white p-6 border border-slate-200 space-y-6 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Selected Route</p>
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
            {selectedTrip?.routes?.name}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">{selectedTrip?.buses?.registration_number}</p>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3">Number of Seats</label>
          <div className="flex items-center gap-6">
            <button 
              disabled={numSeats <= 1}
              onClick={() => setNumSeats(prev => prev - 1)}
              className="w-12 h-12 bg-slate-50 border border-slate-200 flex items-center justify-center rounded-none text-slate-900 font-black hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <X size={18} />
            </button>
            <span className="text-2xl font-black text-slate-900 w-8 text-center">{numSeats}</span>
            <button 
              disabled={numSeats >= 6}
              onClick={() => setNumSeats(prev => prev + 1)}
              className="w-12 h-12 bg-slate-50 border border-slate-200 flex items-center justify-center rounded-none text-slate-900 font-black hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 size={18} />
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold text-slate-900">
            <span className="text-slate-400 uppercase tracking-widest text-xs">Total Amount</span>
            <span className="text-lg font-black text-emerald-600">₹{numSeats * (selectedTrip?.buses?.fare || 14)}</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleConfirmBookingViaRazorpay}
              className="w-full py-4 bg-[#0D2A5D] text-white font-black text-xs uppercase tracking-[0.2em] rounded-none shadow-xl hover:bg-indigo-950 transition-all text-center flex items-center justify-center gap-2 border border-indigo-800"
            >
              <CreditCard size={14} />
              Confirm & Pay (via Razorpay)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const TrackingView = () => {
    const routeStops: string[] = selectedTrip?.routes?.stops || [];
    const stopsToUse = routeStops.length > 0 ? routeStops : [fromStop, 'Stop A', 'Stop B', 'Stop C', toStop];
    
    const currentSegment = selectedTrip?.current_segment || '';
    let activeStopIndex = stopsToUse.findIndex(s => s.toLowerCase() === currentSegment.toLowerCase());
    if (activeStopIndex === -1) {
      const boardIdx = stopsToUse.findIndex(s => s.toLowerCase() === fromStop.toLowerCase());
      activeStopIndex = boardIdx !== -1 ? Math.min(boardIdx + 1, stopsToUse.length - 1) : 1;
    }

    const boardIndex = stopsToUse.findIndex(s => s.toLowerCase() === fromStop.toLowerCase());
    const destIndex = stopsToUse.findIndex(s => s.toLowerCase() === toStop.toLowerCase());

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <button 
            onClick={() => setCurrentView('SPOT')}
            className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black uppercase tracking-tighter">Live Tracker</h2>
        </div>

        <div className="bg-slate-950 p-6 border border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,42,93,0.25),rgba(255,255,255,0))]" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Route Pipeline</span>
              <span className="px-2 py-0.5 bg-[#D97F00]/20 border border-[#D97F00]/30 text-[#D97F00] text-[8px] font-black uppercase tracking-wider">
                {selectedTrip?.buses?.registration_number || 'TN BUS'}
              </span>
            </div>

            <div className="relative pl-8 space-y-6">
              <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-slate-800" />
              <div 
                className="absolute left-[15px] top-3 w-0.5 bg-gradient-to-b from-[#D97F00] to-emerald-500 transition-all duration-500" 
                style={{ 
                  height: `${(activeStopIndex / Math.max(1, stopsToUse.length - 1)) * 100}%`,
                  maxHeight: '94%'
                }} 
              />

              {stopsToUse.map((stop, index) => {
                const isCompleted = index < activeStopIndex;
                const isActive = index === activeStopIndex;
                const isBoarding = index === boardIndex;
                const isDestination = index === destIndex;

                return (
                  <div key={stop + '-' + index} className="relative flex items-center gap-4">
                    <div className="absolute -left-[25px] flex items-center justify-center">
                      {isActive ? (
                        <div className="relative flex items-center justify-center z-20">
                          <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75" />
                          <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg shadow-emerald-500/50">
                            <Bus size={14} className="animate-pulse" />
                          </div>
                        </div>
                      ) : isCompleted ? (
                        <div className="w-4 h-4 rounded-full bg-[#D97F00] border border-white flex items-center justify-center text-white z-10 shadow-sm" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 z-10" />
                      )}
                    </div>

                    <div className="flex-1 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/40 p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className={`text-xs font-black uppercase tracking-wide ${isActive ? 'text-emerald-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                          {stop}
                        </p>
                        {isActive && (
                          <span className="text-[8px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            ● Current Position
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isBoarding && (
                          <span className="px-1.5 py-0.5 bg-[#0D2A5D] border border-blue-900/40 text-white text-[7px] font-black tracking-widest uppercase">
                            Boarding
                          </span>
                        )}
                        {isDestination && (
                          <span className="px-1.5 py-0.5 bg-[#D97F00] border border-orange-900/40 text-white text-[7px] font-black tracking-widest uppercase animate-pulse">
                            Destination
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Live Status</p>
              <h3 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
                {selectedTrip?.routes?.name}
              </h3>
            </div>
            <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 font-bold uppercase">ON TIME</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div>
              <p className="text-[9px] text-slate-400 leading-none">Allocated Driver</p>
              {allocationLoading ? (
                <div className="flex items-center gap-1 mt-1.5 text-slate-500 font-bold normal-case">
                  <Loader2 size={10} className="animate-spin text-slate-400" />
                  <span>Loading...</span>
                </div>
              ) : allocationError ? (
                <p className="text-rose-600 font-bold mt-1.5 normal-case">{allocationError}</p>
              ) : allocatedDriver ? (
                <div className="mt-1.5 text-slate-800 font-black normal-case">
                  <p className="text-slate-800 font-black">{allocatedDriver.name}</p>
                  {allocatedDriver.phone && <p className="text-xs text-slate-500 font-bold mt-0.5">{allocatedDriver.phone}</p>}
                </div>
              ) : (
                <p className="text-slate-500 font-bold mt-1.5 normal-case">Not Allocated</p>
              )}
            </div>
            <div>
              <p className="text-[9px] text-slate-400 leading-none">Allocated Conductor</p>
              {allocationLoading ? (
                <div className="flex items-center gap-1 mt-1.5 text-slate-500 font-bold normal-case">
                  <Loader2 size={10} className="animate-spin text-slate-400" />
                  <span>Loading...</span>
                </div>
              ) : allocationError ? (
                <p className="text-rose-600 font-bold mt-1.5 normal-case">{allocationError}</p>
              ) : allocatedConductor ? (
                <div className="mt-1.5 text-slate-800 font-black normal-case">
                  <p className="text-slate-800 font-black">{allocatedConductor.name}</p>
                  {allocatedConductor.phone && <p className="text-xs text-slate-500 font-bold mt-0.5">{allocatedConductor.phone}</p>}
                </div>
              ) : (
                <p className="text-slate-500 font-bold mt-1.5 normal-case">Not Allocated</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TicketView = () => {
    const tkt = selectedTicket;
    if (!tkt) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <button 
            onClick={() => setCurrentView('ACTIVITY')}
            className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black uppercase tracking-tighter">Your Ticket</h2>
        </div>

        <div className="bg-white border border-slate-200 p-6 relative overflow-hidden shadow-sm space-y-6">
          <div className="absolute top-[-30px] right-[-30px] opacity-10 pointer-events-none">
            <NigazhthisaiIcon size={140} />
          </div>

          <div className="flex justify-between items-start border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider">BUS</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tkt.id}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight uppercase">{tkt.bus_name || 'Transit Route'}</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 font-bold uppercase">CONFIRMED</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div>
                <p className="text-[9px] text-slate-400 leading-none">From</p>
                <p className="text-slate-900 font-black mt-1.5">{tkt.from_stop}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 leading-none">To</p>
                <p className="text-slate-900 font-black mt-1.5">{tkt.to_stop}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-50 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div>
                <p className="text-[9px] text-slate-400 leading-none">Date</p>
                <p className="text-slate-800 font-black mt-1.5">{tkt.date}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400 leading-none">Seats</p>
                <p className="text-slate-800 font-black mt-1.5">{tkt.seats}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 leading-none">Fare</p>
                <p className="text-emerald-600 font-black mt-1.5">₹{tkt.fare}.00</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center py-4 space-y-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-200">
              <QRCodeSVG value={tkt.qr_payload || `VALID:${tkt.id}`} size={120} />
            </div>
            <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">SCAN QR CODE AT BUS ENTRANCE VALIDATOR</p>
          </div>
        </div>
      </div>
    );
  };

  const ActivityView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">{t('ui.recent_activity')}</h2>
        <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-none font-bold text-slate-400 uppercase tracking-widest">History Log</span>
      </div>

      <div className="flex border border-slate-200 bg-slate-50 p-1">
        <button
          onClick={() => setActivityTab('BOOKINGS')}
          className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-widest transition-all ${
            activityTab === 'BOOKINGS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setActivityTab('SOS')}
          className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-widest transition-all ${
            activityTab === 'SOS'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          SOS Alerts ({sosAlerts.length})
        </button>
      </div>
      
      <div className="space-y-4">
        {activityTab === 'BOOKINGS' ? (
          <>
            {tickets.map((tkt) => (
              <button 
                key={tkt.id} 
                onClick={() => {
                  setSelectedTicket(tkt);
                  setCurrentView('TICKET');
                }}
                className="w-full bg-white p-4 border border-slate-200 flex items-center justify-between text-left hover:border-emerald-500 transition-colors shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black rounded-none shadow-sm uppercase tracking-wider">BUS</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{tkt.id}</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">{tkt.from_stop} → {tkt.to_stop}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Clock size={12} className="text-emerald-500" />
                    {tkt.date}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-none uppercase">CONFIRMED</span>
                  <p className="text-xs font-black text-slate-700 mt-1.5">₹{tkt.fare}</p>
                </div>
              </button>
            ))}

            {tickets.length === 0 && (
              <div className="py-20 text-center space-y-4 bg-white border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-none flex items-center justify-center mx-auto text-slate-300">
                  <ActivityInfoIcon size={32} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No booking activity logged yet</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Book your first bus ticket!</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {sosAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className="w-full bg-white p-4 border border-red-200 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-wider">SOS ALERT</span>
                    <span className="text-[9px] text-slate-400 font-black">ID: #{alert.id}</span>
                  </div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    alert.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                    alert.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {alert.status}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-900 leading-normal">{alert.message}</p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    <Clock size={12} className="text-red-500" />
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                  <button 
                    onClick={() => {
                      setActiveSosAlertId(alert.id);
                      setIsSosChatOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-1 transition-all"
                  >
                    <MessageSquare size={10} />
                    Open Live Chat
                  </button>
                </div>
              </div>
            ))}

            {sosAlerts.length === 0 && (
              <div className="py-20 text-center space-y-4 bg-white border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-none flex items-center justify-center mx-auto text-slate-350">
                  <ShieldAlert size={32} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No SOS alerts triggered yet</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Your emergency logs will appear here</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const ComplaintView = () => (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex items-center gap-4 px-2">
        <button 
          onClick={() => setCurrentView('HOME')}
          className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm hover:bg-slate-50 transition-colors active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tighter">{t('ui.complaint')}</h2>
      </div>

      <div className="flex-1 bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
          {t('complaint.desc')}
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('complaint.issue_type')}</label>
            <select 
              value={complaintType}
              onChange={(e) => setComplaintType(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-none text-sm font-bold text-slate-900 appearance-none focus:border-emerald-500 transition-colors outline-none cursor-pointer"
            >
              <option value="Delay">{t('complaint.type.delay')}</option>
              <option value="Behavior">{t('complaint.type.behavior')}</option>
              <option value="Fare">{t('complaint.type.fare')}</option>
              <option value="Other">{t('complaint.type.other')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('complaint.description')}</label>
            <textarea 
              rows={5}
              placeholder={t('complaint.placeholder')}
              value={complaintDesc}
              onChange={(e) => setComplaintDesc(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-none text-sm font-bold text-slate-900 focus:border-emerald-500 transition-colors outline-none resize-none"
            />
          </div>
        </div>

        <button 
          onClick={handleSubmitComplaint}
          className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-none shadow-xl hover:bg-slate-800 transition-all active:scale-95"
        >
          {t('complaint.submit')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden font-sans">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[55] backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[80%] max-w-sm bg-white z-[60] flex flex-col shadow-2xl"
            >
              <div className="bg-slate-950 pt-16 pb-12 px-6 text-white relative overflow-hidden shrink-0">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 rounded-none flex items-center justify-center border border-white/20 shadow-xl backdrop-blur-md mb-5">
                    <User size={40} />
                  </div>
                  <div className="text-center w-full">
                    <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-2">PASSENGER</h2>
                    <p className="text-[10px] font-bold opacity-70 tracking-[0.2em]">{userName}</p>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
                <div className="absolute -right-10 -bottom-10 bg-white/5 w-40 h-40 rounded-full blur-3xl" />
              </div>

              <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto no-scrollbar">
                {[
                  { label: 'SuperApp Home', icon: Bus, active: currentView === 'HOME' || currentView === 'SPOT' || currentView === 'TRACKING' || currentView === 'BOOKING', id: 'HOME' },
                  { label: 'Live Ticket', icon: TicketIcon, active: currentView === 'TICKET', id: 'TICKET' },
                  { label: t('ui.recent_activity'), icon: ActivityInfoIcon, active: currentView === 'ACTIVITY', id: 'ACTIVITY' },
                  { label: t('ui.complaint'), icon: Mail, active: currentView === 'COMPLAINT', id: 'COMPLAINT' },
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (item.id === 'TICKET') {
                        const liveTicket = tickets.find(t => t.status === 'CONFIRMED' || t.status === 'BOARDED');
                        if (liveTicket) {
                          setSelectedTicket(liveTicket);
                          setCurrentView('TICKET');
                        } else {
                          toast.error('No Live Ticket found. You do not have any active running trips at this moment.');
                        }
                      } else if (item.id) {
                        setCurrentView(item.id as View);
                      }
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-none transition-all group ${item.active ? 'text-slate-900 bg-slate-50' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <div className={`p-2.5 rounded-none transition-all ${item.active ? 'bg-slate-900 text-white shadow-lg shadow-slate-950/20 scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                      <item.icon size={18} />
                    </div>
                    <span className={`text-[11px] uppercase tracking-widest ${item.active ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-6 border-t border-slate-100 space-y-4 shrink-0 bg-slate-50/40">
                <div className="bg-white border border-slate-200 shadow-sm relative w-full overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-none transition-colors">
                        <Globe size={14} className={isLangOpen ? "text-slate-800 animate-[spin_4s_linear_infinite]" : ""} />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Language</p>
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight mt-1">
                          {{ EN: 'English', TA: 'தமிழ்', TE: 'తెలుగు', KN: 'ಕನ್ನಡ', ML: 'മലയാളம்', HI: 'हिन्दी' }[language] || language}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isLangOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-slate-400"
                    >
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isLangOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-slate-100"
                      >
                        <div className="p-3 bg-slate-50/20 grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'EN', label: 'ENGLISH', native: 'English' },
                            { id: 'TA', label: 'TAMIL', native: 'தமிழ்' },
                            { id: 'TE', label: 'TELUGU', native: 'తెలుగు' },
                            { id: 'KN', label: 'KANNADA', native: 'ಕನ್ನಡ' },
                            { id: 'ML', label: 'MALAYALAM', native: 'മലയാളம்' }
                          ].map((lang) => (
                            <button 
                              key={lang.id}
                              onClick={() => {
                                setLanguage(lang.id as any);
                                setIsLangOpen(false);
                              }}
                              className={`py-2 px-1 text-center rounded-none transition-all border relative overflow-hidden ${
                                language === lang.id 
                                  ? 'bg-slate-100 border-slate-500 text-slate-900 font-black' 
                                  : 'bg-slate-50/60 border-slate-200/50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-semibold'
                              }`}
                            >
                              <div className="text-[10px] uppercase tracking-tight leading-none">{lang.label}</div>
                              <div className="text-[8px] opacity-75 mt-0.5 leading-none">{lang.native}</div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-5 px-6 py-4 text-rose-500 bg-rose-50 rounded-none transition-all hover:bg-rose-100 active:scale-95 group"
                >
                  <div className="p-2.5 bg-rose-500 text-white rounded-none shadow-lg shadow-rose-500/20">
                    <LogOut size={20} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">{t('nav.logout')}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="w-10 h-10 flex items-center justify-center text-slate-900 bg-slate-50 rounded-none hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* SOS Alerting Indicator */}
        <AnimatePresence>
          {sosActive && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-x-6 top-20 bg-rose-600 text-white p-4 border border-rose-500 shadow-2xl z-50 text-center uppercase tracking-widest font-black text-xs animate-[pulse_1s_infinite]"
            >
              CRITICAL SOS TRIGGERED. DISPATCHING GPS LOGS...
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className="text-xl font-normal uppercase tracking-tighter text-slate-900 absolute left-1/2 -translate-x-1/2">{t('app.name')}</h1>
        
        {/* Immediate SOS trigger button */}
        <button 
          onClick={triggerSOSAlert}
          className="px-4 py-2 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 active:scale-90 transition-all rounded-none"
        >
          SOS
        </button>
      </header>

      {/* Persistent SOS Emergency Banner */}
      {(() => {
        const activeUnresolvedAlert = (sosAlerts || []).find((alert: any) => 
          alert.status === 'PENDING' || alert.status === 'ACKNOWLEDGED'
        );
        if (!activeUnresolvedAlert) return null;
        return (
          <div className="bg-rose-600 text-white px-6 py-3 flex items-center justify-between border-b border-rose-500 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Live SOS Active (ID: #{activeUnresolvedAlert.id})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSosAlertId(activeUnresolvedAlert.id);
                  setIsSosChatOpen(true);
                }}
                className="bg-white text-rose-600 hover:bg-slate-50 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 transition-all shadow-sm rounded-none"
              >
                Open Chat
              </button>
              <button
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from('alerts')
                      .update({ status: 'RESOLVED' })
                      .eq('id', activeUnresolvedAlert.id);
                    if (!error) {
                      toast.success('Emergency alert resolved successfully.');
                      fetchPassengerSosAlerts(userId);
                    }
                  } catch (err) {
                    toast.error('Failed to resolve alert');
                  }
                }}
                className="bg-rose-800 text-white hover:bg-rose-900 border border-rose-700 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 transition-all rounded-none"
              >
                Resolve
              </button>
            </div>
          </div>
        );
      })()}

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto no-scrollbar pb-24">
        {currentView === 'HOME' && <DashboardView />}
        {currentView === 'SPOT' && <SpotView />}
        {currentView === 'ACTIVITY' && <ActivityView />}
        {currentView === 'TRACKING' && <TrackingView />}
        {currentView === 'BOOKING' && <BookingView />}
        {currentView === 'TICKET' && <TicketView />}
        {currentView === 'COMPLAINT' && <ComplaintView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-24 bg-white border-t border-slate-100 flex items-center justify-around px-4 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-45 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] pb-4">
        {[
          { id: 'HOME', label: 'SuperApp', icon: Bus },
          { id: 'SPOT', label: 'Buses', icon: Search },
          { id: 'ACTIVITY', label: 'History', icon: ActivityInfoIcon },
        ].map((tab) => {
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentView(tab.id as View);
              }}
              className={`flex flex-col items-center gap-2 transition-all flex-1 py-2 ${currentView === tab.id ? 'text-slate-800' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-none transition-all ${currentView === tab.id ? 'bg-slate-100 shadow-inner' : ''}`}>
                <tab.icon size={22} className={currentView === tab.id ? 'scale-110 text-slate-800' : ''} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity ${currentView === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* District Selection Modal */}
      <AnimatePresence>
        {isDistrictModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDistrictModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white z-[70] rounded-none overflow-hidden flex flex-col max-h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="space-y-1">
                  <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">{t('ui.select_district')}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{t('ui.tamil_nadu')} • {TAMIL_NADU_DISTRICTS.length} Districts</p>
                </div>
                <button 
                  onClick={() => setIsDistrictModalOpen(false)}
                  className="w-10 h-10 bg-slate-50 text-slate-400 rounded-none flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2 no-scrollbar">
                {TAMIL_NADU_DISTRICTS.map((district) => (
                  <button
                    key={district}
                    onClick={() => handleDistrictSelect(district)}
                    className={`w-full text-left px-6 py-4 rounded-none font-bold text-sm transition-all flex items-center justify-between border ${
                      selectedDistrict === district 
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xl' 
                        : 'bg-white text-slate-600 border-slate-100 hover:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${selectedDistrict === district ? 'bg-white animate-pulse' : 'bg-slate-200'}`} />
                      <span>{district}</span>
                    </div>
                    {selectedDistrict === district && <CheckCircle2 size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stop Selection Modal */}
      <AnimatePresence>
        {isStopModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStopModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white z-[70] rounded-none overflow-hidden flex flex-col h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
            >
              <div className="bg-slate-950 p-6 text-white sticky top-0 z-10 shadow-xl overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black uppercase tracking-tighter leading-none">
                        {stopSelectionType === 'FROM' ? t('ui.boarding_from') : t('ui.destination_to')}
                      </h2>
                      <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em]">
                        {selectedDistrict} District
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsStopModalOpen(false)}
                      className="w-10 h-10 bg-white/10 text-white rounded-none flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                    <input 
                      type="text"
                      placeholder={t('ui.search_stop')}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-none focus:outline-none focus:bg-white/20 focus:border-white/30 placeholder:text-white/40 text-sm font-black transition-all backdrop-blur-sm"
                      value={stopSearchQuery}
                      onChange={(e) => setStopSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2 no-scrollbar bg-slate-50">
                {stopsToShow
                  .filter(stop => stop.toLowerCase().includes(stopSearchQuery.toLowerCase()))
                  .sort((a, b) => a.localeCompare(b))
                  .map((stop) => (
                    <button
                      key={stop}
                      onClick={() => handleStopSelect(stop)}
                      className={`w-full text-left px-6 py-4 rounded-none font-bold text-sm transition-all flex items-center justify-between border ${
                        (stopSelectionType === 'FROM' ? fromStop : toStop) === stop
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                          : 'bg-white text-slate-600 border-slate-100 hover:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-none ${ (stopSelectionType === 'FROM' ? fromStop : toStop) === stop ? 'bg-white/20' : 'bg-slate-50 text-slate-600'}`}>
                          <MapPin size={16} />
                        </div>
                        <span className="tracking-tight">{stop}</span>
                      </div>
                      {(stopSelectionType === 'FROM' ? fromStop : toStop) === stop && <CheckCircle2 size={16} className="text-white" />}
                    </button>
                  ))}
                
                {stopsToShow
                  .filter(stop => stop.toLowerCase().includes(stopSearchQuery.toLowerCase())).length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-none flex items-center justify-center mx-auto text-slate-200">
                      <Search size={32} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('ui.no_stops_found')}</p>
                      <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Try another search term</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating SOS Support Desk Indicator */}
      {activeSosAlertId && !isSosChatOpen && (
        <button 
          onClick={() => setIsSosChatOpen(true)}
          className="fixed text-red-500 bottom-24 left-6 z-40 bg-red-50 px-3 py-2 rounded-full font-black text-[9px] shadow-2xl flex items-center gap-1.5 border border-red-500 hover:scale-105 transition-all animate-bounce uppercase tracking-wider"
        >
          <MessageSquare size={12} />
          SOS Live Chat Active
        </button>
      )}

      {/* SOS Citizen Live Chat Drawer */}
      <AnimatePresence>
        {isSosChatOpen && activeSosAlertId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSosChatOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[90] backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white z-[100] rounded-t-xl overflow-hidden flex flex-col h-[75vh] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border-t-2 border-red-500"
            >
              {/* Header */}
              <div className="bg-red-600 p-5 text-white flex items-center justify-between sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                    <ShieldAlert size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-tight leading-none">SOS Emergency Desk</h2>
                    <p className="text-[9px] text-white/80 font-black uppercase tracking-widest mt-1">
                      Direct Support Channel • Live
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSosChatOpen(false)}
                  className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 no-scrollbar">
                <div className="bg-red-50 border border-red-200 p-4 text-xs text-red-950 font-bold leading-normal text-center space-y-1">
                  <p className="font-black text-sm uppercase tracking-tight text-red-700">Emergency Alert Active</p>
                  <p>Your coordinates and trip details have been broadcasted to the district authorities. Speak directly with dispatcher below.</p>
                </div>

                <div className="space-y-4 pt-2">
                  {sosMessages.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      Connecting with dispatcher...
                    </div>
                  ) : (
                    sosMessages.map((msg) => {
                      const isMe = msg.sender_role === 'SYSTEM'; // Citizen role maps to SYSTEM
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                            {msg.sender_name} ({msg.sender_role === 'ADMIN' ? 'Support Desk' : 'You'})
                          </span>
                          <div className={`max-w-[85%] px-4 py-2.5 shadow-sm text-xs font-semibold leading-relaxed ${
                            isMe 
                              ? 'bg-slate-900 text-white rounded-l-md rounded-br-md' 
                              : 'bg-white text-slate-800 border border-slate-200 rounded-r-md rounded-bl-md'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[8px] text-slate-400 font-bold mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Send Box */}
              <form onSubmit={handleSendSosMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
                <input 
                  type="text"
                  placeholder="Tell us what is happening..."
                  value={newSosMessageText}
                  onChange={(e) => setNewSosMessageText(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs font-semibold rounded-none"
                />
                <button
                  type="submit"
                  className="p-3 bg-red-600 hover:bg-red-700 text-white transition-all flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
export default PassengerPage;
