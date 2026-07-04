import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Search, 
  MapPin, 
  Ticket as TicketIcon, 
  User, 
  LogOut, 
  Navigation, 
  Menu, 
  ArrowLeftRight, 
  ArrowLeft,
  ChevronRight, 
  Share2, 
  Download,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Activity as ActivityInfoIcon,
  X,
  Mail,
  Globe,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../lib/i18n';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { NigazhthisaiIcon, NigazhthisaiWordmark } from '../components/NigazhthisaiLogo';

type View = 'SPOT' | 'ACTIVITY' | 'TRACKING' | 'BOOKING' | 'TICKET' | 'COMPLAINT';

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

const LiveOccupancyProgressBar: React.FC<{ occupancy: number; max?: number }> = ({ occupancy, max = 50 }) => {
  const percentage = Math.min((occupancy / max) * 100, 100);
  let fillBgClass = 'bg-gradient-to-r from-emerald-500 to-teal-400';
  let shadowStyle = 'rgba(16,185,129,0.3)';
  
  if (percentage >= 80) {
    fillBgClass = 'bg-gradient-to-r from-emerald-500 via-amber-500 via-orange-500 to-rose-600 animate-[pulse_1.5s_infinite]';
    shadowStyle = 'rgba(244,63,94,0.6)';
  } else if (percentage >= 50) {
    fillBgClass = 'bg-gradient-to-r from-emerald-500 via-yellow-450 to-amber-500';
    shadowStyle = 'rgba(245,158,11,0.4)';
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
          style={{ boxShadow: `0 0 10px ${shadowStyle}` }}
          className={`h-full relative rounded-none transition-all ${fillBgClass}`}
        >
          <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
        </motion.div>
      </div>
    </div>
  );
};

export const PassengerPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('SPOT');
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

  const [numSeats, setNumSeats] = useState(2);
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const navigate = useNavigate();

  // Supabase states
  const [trips, setTrips] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [dbStops, setDbStops] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Complaint form states
  const [complaintType, setComplaintType] = useState('Delay');
  const [complaintDesc, setComplaintDesc] = useState('');

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

  // Fetch trips and passenger tickets
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch running trips in district
      const { data: tripsData } = await supabase.rpc('rpc_get_trips_by_district', { district_name: selectedDistrict });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: ticketsData } = await supabase.rpc('rpc_get_tickets_by_user_id', { passenger_user_id: user.id });
        setTickets(ticketsData || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrict, currentView]);

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
    await supabase.auth.signOut();
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  const handleConfirmBooking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to book a ticket');
        return;
      }
      
      const ticketId = `NIG-${Math.floor(100000 + Math.random() * 900000)}`;
      const fare = numSeats * (selectedTrip?.buses?.fare || 14);
      const ticketPayload = {
        id: ticketId,
        user_id: user.id,
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
      try {
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
          console.warn('Supabase booking insert returned error, using local fallback:', error);
          ticket = ticketPayload;
        } else {
          ticket = data;
        }
      } catch (dbErr) {
        console.warn('Supabase booking insert threw exception, using local fallback:', dbErr);
        ticket = ticketPayload;
      }
      
      toast.success('Ticket Booked Successfully!');
      setSelectedTicket(ticket);
      setCurrentView('TICKET');
    } catch (err: any) {
      toast.error(err.message || 'Failed to book ticket');
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintDesc.trim()) {
      toast.error('Please enter a description of the issue');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc('rpc_insert_complaint', {
        bus_id: selectedTrip?.bus_id || '32',
        type: complaintType,
        description: complaintDesc,
        user_id: user?.id || null
      });
        
      if (error) throw error;
      
      toast.success(t('complaint.success'));
      setComplaintDesc('');
      setCurrentView('SPOT');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit complaint');
    }
  };

  // --- Sub-Views ---

  const SpotView = () => (
    <div className="space-y-6">
      {/* Selection Bar */}
      <div 
        onClick={() => setIsDistrictModalOpen(true)}
        className="bg-white px-5 py-3 rounded-none border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer group hover:border-emerald-500 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-none group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Globe size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t('ui.select_district')}</p>
            <p className="text-sm font-bold text-slate-900 leading-none">{t(`dist.${selectedDistrict}`)}</p>
          </div>
        </div>
        <ChevronDown size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
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
                <p className="text-sm font-bold text-slate-900 truncate">{t(`stop.${fromStop}`)}</p>
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
                localStorage.setItem('from_stop', toStop);
                localStorage.setItem('to_stop', fromStop);
              }}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-slate-200 flex items-center justify-center rounded-none shadow-md text-emerald-600 hover:text-emerald-700 active:scale-90 transition-all"
            >
              <ArrowLeftRight size={14} className="rotate-90" />
            </button>
          </div>

          <button 
            onClick={() => openStopModal('TO')}
            className="flex items-center gap-4 p-3 rounded-none hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-rose-50 text-rose-500 flex items-center justify-center rounded-none">
              <Navigation size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('ui.to')}</p>
              <p className="text-sm font-bold text-slate-900 truncate">{t(`stop.${toStop}`)}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Dynamic Running Buses List */}
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Available Buses</h3>
        
        {trips.length > 0 ? (
          trips.map((trip) => (
            <motion.div 
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedTrip(trip);
                setCurrentView('TRACKING');
              }}
              className="bg-emerald-600 rounded-none p-4 text-white shadow-lg relative overflow-hidden active:scale-[0.99] transition-transform cursor-pointer group/card hover:bg-emerald-500 mb-4"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">
                      {trip.routes?.code || 'LIVE'}
                    </p>
                    <h2 className="text-xl font-black leading-none truncate max-w-[280px]">
                      {trip.routes?.name || trip.bus_name || 'Route 32'}
                    </h2>
                  </div>
                  <div className="w-10 h-10 bg-white/20 flex items-center justify-center rounded-none backdrop-blur-sm border border-white/10 shrink-0">
                    <Bus size={20} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        ETA: {trip.buses?.eta || 5} mins
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-none text-[10px] font-bold">
                      <User size={12} />
                      {trip.buses?.current_occupancy || 0} / {trip.buses?.capacity || 50}
                    </div>
                  </div>
                  <LiveOccupancyProgressBar occupancy={trip.buses?.current_occupancy || 0} max={trip.buses?.capacity || 50} />
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Fare</p>
                    <span className="text-xl font-black">₹{trip.buses?.fare || 14.00}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrip(trip);
                      setCurrentView('BOOKING');
                    }}
                    className="flex-1 bg-white text-emerald-700 py-3 rounded-none font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-colors active:scale-95"
                  >
                    Book Ticket
                  </button>
                </div>
              </div>
              
              <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12">
                <Bus size={180} />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 p-8 text-center rounded-none">
            <Bus size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No running buses in this district</p>
            <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Please select another district or check back later</p>
          </div>
        )}
      </div>
    </div>
  );

  const TrackingView = () => {
    const stopsToShowForTracking = selectedTrip?.routes?.stops || ['Old Bus Stand', 'Pushpa Theatre', 'Kumar Nagar', 'Avinashi'];
    
    return (
      <div className="flex flex-col h-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentView('SPOT')}
              className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm hover:bg-slate-50 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase">{selectedTrip?.buses?.registration_number || 'BUS'}</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Live Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline List (Pipe Map) */}
        <div className="flex-1 relative pl-10 space-y-8 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-1 before:bg-slate-200 before:rounded-none overflow-y-auto no-scrollbar pb-6 mt-2">
          {stopsToShowForTracking.map((stopName: string, i: number) => {
            const isFrom = stopName === fromStop;
            const isTo = stopName === toStop;
            return (
              <div key={i} className="relative group">
                <div className={`absolute -left-[29px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-md transition-all ${
                  isFrom ? 'bg-blue-500 scale-125' : isTo ? 'bg-rose-500 scale-125' : 'bg-slate-300'
                }`} />
                
                <div className="bg-white p-3 rounded-none border border-slate-100 shadow-sm group-hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight leading-tight">{stopName}</h3>
                    </div>
                    {i > 0 && (
                      <div className="text-right pl-4">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ETA</p>
                        <p className="text-base font-black text-slate-900 tracking-tighter">{i * 5}m</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="w-full py-3 bg-slate-900 text-white flex items-center justify-center gap-3 rounded-none shadow-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
          <MapPin size={20} />
          View Full Map
        </button>
      </div>
    );
  };

  const BookingView = () => (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex items-center gap-4 px-2">
        <button 
          onClick={() => setCurrentView('SPOT')}
          className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm hover:bg-slate-50 transition-colors active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tighter">{t('ui.book_ticket')}</h2>
      </div>

      <div className="space-y-4 flex-1 bg-white p-4 rounded-none border border-slate-100 shadow-sm overflow-y-auto no-scrollbar">
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-none border border-emerald-100 flex flex-col gap-1 mb-2">
          <p className="text-[10px] font-black tracking-widest uppercase">Assigned Bus</p>
          <p className="text-sm font-black">{selectedTrip?.routes?.name || selectedTrip?.bus_name || 'Bus 32'}</p>
        </div>

        <section className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('ui.boarding_from')}</h3>
          <button 
            onClick={() => openStopModal('FROM')}
            className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-none hover:border-emerald-500 transition-colors group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-none">
                <MapPin size={18} />
              </div>
              <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{fromStop}</p>
            </div>
            <ChevronDown size={18} className="text-slate-300 group-hover:text-emerald-500" />
          </button>
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('ui.destination_to')}</h3>
          <button 
            onClick={() => openStopModal('TO')}
            className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-none hover:border-emerald-500 transition-colors group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-rose-100 text-rose-500 rounded-none">
                <Navigation size={18} />
              </div>
              <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{toStop}</p>
            </div>
            <ChevronDown size={18} className="text-slate-300 group-hover:text-emerald-500" />
          </button>
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('ui.num_seats')}</h3>
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-none shadow-inner">
            <div className="text-center flex-1">
              <p className="text-3xl font-black text-slate-900 leading-none">{numSeats}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t('ui.seats_selected')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setNumSeats(Math.max(1, numSeats - 1))}
                className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 rounded-none transition-all shadow-sm active:scale-90"
              >
                <Minus size={20} />
              </button>
              <button 
                onClick={() => setNumSeats(numSeats + 1)}
                className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 rounded-none transition-all shadow-sm active:scale-90"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </section>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{t('ui.total_amount')}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹{numSeats * (selectedTrip?.buses?.fare || 14)}.00</p>
          </div>
          <p className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-none border border-emerald-100 uppercase tracking-widest">{t('ui.ready_to_book')}</p>
        </div>
      </div>

      <button 
        onClick={handleConfirmBooking}
        className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-none shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
      >
        {t('ui.confirm_booking')}
      </button>
    </div>
  );

  const TicketView = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-full border border-emerald-100 shadow-sm animate-bounce-subtle">
          <CheckCircle2 size={20} />
          <span className="text-xs font-black uppercase tracking-widest">{t('ui.ticket_booked')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <button 
          onClick={() => setCurrentView('ACTIVITY')}
          className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-normal tracking-tighter text-slate-900">{t('ui.your_ticket')}</h2>
          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em]">{t('ui.booking_confirmed')}</p>
        </div>
        <button className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-400 shadow-sm hover:text-emerald-500 transition-colors">
          <Download size={20} />
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-none overflow-hidden shadow-2xl flex-1 flex flex-col">
        <div className="bg-gradient-to-br from-emerald-600 to-green-600 p-6 flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-none shadow-xl ring-4 ring-white/10">
            <QRCodeSVG value={selectedTicket?.qr_payload || "VALID"} size={140} />
          </div>
          <div className="mt-6 text-center">
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.3em] mb-1">{t('ui.ticket_ref')}</p>
            <p className="text-xl font-black text-white tracking-[0.4em]">{selectedTicket?.id}</p>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar relative">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-50 to-transparent opacity-20" />
          
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-none border border-slate-100 border-dashed">
            <div className="w-10 h-10 bg-white text-emerald-500 shadow-sm flex items-center justify-center rounded-none">
              <Navigation size={20} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-none mb-1">{t('ui.live_status')}</p>
              <p className="text-sm font-bold text-slate-900 leading-none">{selectedTicket?.status || 'CONFIRMED'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 px-2">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{language === 'TA' ? 'வழித்தடம்' : 'ROUTE'}</p>
              <p className="text-xl font-normal text-slate-900 tracking-tight">{selectedTicket?.bus_name || 'Bus'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{language === 'TA' ? 'தேதி' : 'DATE'}</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">{selectedTicket?.date}</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-y border-slate-100 border-dashed px-2">
            <div className="text-left flex-1 min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('ui.from')}</p>
              <p className="text-sm font-black text-slate-900 truncate">{selectedTicket?.from_stop}</p>
            </div>
            <div className="px-4 text-emerald-200">
               <ArrowLeft size={18} className="rotate-180" />
            </div>
            <div className="text-right flex-1 min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('ui.to')}</p>
              <p className="text-sm font-black text-slate-900 truncate">{selectedTicket?.to_stop}</p>
            </div>
          </div>

          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('ui.passengers')}</p>
              <p className="text-xl font-black text-slate-900">{selectedTicket?.seats} <span className="text-xs text-slate-400 font-bold tracking-normal uppercase ml-1">{t('ui.total')}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('ui.amount_paid')}</p>
              <p className="text-2xl font-black text-emerald-600 tracking-tighter">₹{selectedTicket?.fare}.00</p>
            </div>
          </div>

          <button className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-none flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95">
            <Share2 size={20} />
            {t('ui.share_ticket')}
          </button>
        </div>
      </div>
    </div>
  );

  const ActivityView = () => (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('ui.active_tickets')}</h3>
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest">
            {tickets.length} {t('ui.active')}
          </span>
        </div>
        
        <div className="space-y-4">
          {tickets.map((tkt) => (
            <button 
              key={tkt.id} 
              onClick={() => {
                setSelectedTicket(tkt);
                setCurrentView('TICKET');
              }}
              className="w-full bg-white p-4 border border-slate-100 rounded-none shadow-sm flex items-center justify-between text-left hover:border-emerald-500 transition-all group active:scale-[0.98]"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-none shadow-sm">BUS</div>
                  <p className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">{tkt.from_stop} → {tkt.to_stop}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <Clock size={12} className="text-emerald-500" />
                  {tkt.date}
                  <span className="w-1.5 h-1.5 bg-slate-100 rounded-full" />
                  <span className="text-emerald-600 font-black">₹{tkt.fare}.00</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-none flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <TicketIcon size={20} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const ComplaintView = () => (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex items-center gap-4 px-2">
        <button 
          onClick={() => setCurrentView('SPOT')}
          className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center rounded-none text-slate-900 shadow-sm hover:bg-slate-50 transition-colors active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tighter">{t('ui.complaint')}</h2>
      </div>

      <div className="flex-1 bg-white p-6 rounded-none border border-slate-100 shadow-sm space-y-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
          {t('complaint.desc')}
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('complaint.issue_type')}</label>
            <select 
              value={complaintType}
              onChange={(e) => setComplaintType(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold text-slate-900 appearance-none focus:border-emerald-500 transition-colors outline-none cursor-pointer"
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
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold text-slate-900 focus:border-emerald-500 transition-colors outline-none resize-none"
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

  if (showSplash) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 max-w-md mx-auto relative overflow-hidden font-sans" id="passenger-splash-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center space-y-10"
        >
          <div className="relative p-2 bg-slate-50/50 rounded-3xl shadow-2xl shadow-[#0D2A5D]/5 border border-slate-100">
            <NigazhthisaiIcon size={220} />
          </div>
          
          <div className="text-center pt-2">
            <NigazhthisaiWordmark size={42} />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 animate-pulse">
              {language === 'EN' ? 'LIVE BUS TRACKING & TICKETS' : 'நேரடி பேருந்து கண்காணிப்பு'}
            </p>
          </div>
        </motion.div>
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D2A5D] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97F00] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D2A5D] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

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
              <div className="bg-emerald-600 pt-16 pb-12 px-6 text-white relative overflow-hidden shrink-0">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/20 rounded-none flex items-center justify-center border-2 border-white/30 shadow-xl backdrop-blur-sm mb-5">
                    <User size={40} />
                  </div>
                  <div className="text-center w-full">
                    <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-2">PASSENGER</h2>
                    <p className="text-[10px] font-bold opacity-70 tracking-[0.2em]">Nigazhthisai User</p>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
                <div className="absolute -right-10 -bottom-10 bg-white/10 w-40 h-40 rounded-full blur-3xl" />
              </div>

              <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto no-scrollbar">
                {[
                  { label: t('ui.home'), icon: Bus, active: currentView === 'SPOT' || currentView === 'TRACKING' || currentView === 'BOOKING' || currentView === 'TICKET', id: 'SPOT' },
                  { label: t('ui.recent_activity'), icon: ActivityInfoIcon, active: currentView === 'ACTIVITY', id: 'ACTIVITY' },
                  { label: t('ui.complaint'), icon: Mail, active: currentView === 'COMPLAINT', id: 'COMPLAINT' },
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (item.id) {
                        setCurrentView(item.id as View);
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-none transition-all group ${item.active ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <div className={`p-2.5 rounded-none transition-all ${item.active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
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
                        <Globe size={14} className={isLangOpen ? "text-emerald-600 animate-[spin_4s_linear_infinite]" : ""} />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Language</p>
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight mt-1">
                          {language === 'EN' ? 'English' : 'தமிழ்'}
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
                            { id: 'TA', label: 'TAMIL', native: 'தமிழ்' }
                          ].map((lang) => (
                            <button 
                              key={lang.id}
                              onClick={() => {
                                setLanguage(lang.id as any);
                                setIsLangOpen(false);
                              }}
                              className={`py-2 px-1 text-center rounded-none transition-all border relative overflow-hidden ${
                                language === lang.id 
                                  ? 'bg-emerald-50/60 border-emerald-500/50 text-emerald-700 font-black' 
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
        <h1 className="text-xl font-normal uppercase tracking-tighter text-slate-900 absolute left-1/2 -translate-x-1/2">{t('app.name')}</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto no-scrollbar pb-24">
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
          { id: 'SPOT', label: t('pnav.spot'), icon: Navigation },
          { id: 'TRACKING', label: t('pnav.track'), icon: MapPin },
          { id: 'ACTIVITY', label: t('pnav.history'), icon: ActivityInfoIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'TRACKING' && !selectedTrip) {
                toast.info('Please select a bus/trip first to track');
                return;
              }
              setCurrentView(tab.id as View);
            }}
            className={`flex flex-col items-center gap-2 transition-all flex-1 py-2 ${currentView === tab.id ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-none transition-all ${currentView === tab.id ? 'bg-emerald-50 shadow-inner' : ''}`}>
               <tab.icon size={22} className={currentView === tab.id ? 'scale-110' : ''} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-opacity ${currentView === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
          </button>
        ))}
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
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/20' 
                        : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50'
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
              <div className="bg-gradient-to-br from-emerald-600 to-green-600 p-6 text-white sticky top-0 z-10 shadow-xl overflow-hidden">
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
                
                <div className="absolute -right-10 -top-10 bg-white/5 w-40 h-40 rounded-full blur-3xl" />
                <div className="absolute -left-10 -bottom-10 bg-white/5 w-40 h-40 rounded-full blur-3xl" />
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
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/20' 
                          : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-none ${ (stopSelectionType === 'FROM' ? fromStop : toStop) === stop ? 'bg-white/20' : 'bg-slate-50 text-emerald-500'}`}>
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
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-200 shadow-inner">
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
    </div>
  );
};
export default PassengerPage;
