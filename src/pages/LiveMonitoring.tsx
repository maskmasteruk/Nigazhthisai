import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Navigation, 
  Bus as BusIcon, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Search,
  Loader2,
  MapPin,
  Activity,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

export const LiveMonitoring: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [liveTrips, setLiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  const ZONES = ['All', 'North', 'South', 'West', 'East', 'Central'];

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const data = await adminApi.getLiveTrips();
        setLiveTrips(data);
        
        // If we have a search query, try to auto-select the matching trip
        const initialSearch = searchParams.get('search');
        if (initialSearch && !selectedTrip) {
          const trip = data.find((t: any) => t.bus_id.includes(initialSearch));
          if (trip) setSelectedTrip(trip);
        }
      } catch (error) {
        toast.error('Failed to fetch live data');
      } finally {
        setLoading(false);
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const filteredLiveTrips = liveTrips.filter(trip => {
    const matchesSearch = trip.bus_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         trip.route_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = selectedDistrict === 'All' || trip.district === selectedDistrict;
    const matchesZone = selectedZone === 'All' || trip.zone === selectedZone;
    return matchesSearch && matchesDistrict && matchesZone;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search active buses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>

        {isMaster && (
          <>
            <select 
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 focus:border-primary outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
            >
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d} DISTRICT</option>
              ))}
            </select>

            <select 
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 focus:border-primary outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
            >
              {ZONES.map(z => (
                <option key={z} value={z}>{z} ZONE</option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="h-[calc(100vh-16rem)] flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Active Trips */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
            {loading ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <Loader2 className="animate-spin text-primary" size={20} />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tracking buses...</p>
              </div>
            ) : (
              filteredLiveTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`w-full text-left p-4 border transition-all group ${
                    selectedTrip?.id === trip.id 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-slate-200 hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <BusIcon size={16} className={selectedTrip?.id === trip.id ? 'text-white' : 'text-primary'} />
                      <span className="text-sm font-black">{trip.bus_id}</span>
                    </div>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
                      trip.status === 'ON_TIME' ? 'bg-emerald-500/20 text-emerald-500' : 
                      trip.status === 'DELAYED' ? 'bg-rose-500/20 text-rose-500' : 
                      'bg-slate-500/20 text-slate-500'
                    }`}>
                      {trip.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${
                    selectedTrip?.id === trip.id ? 'text-white/70' : 'text-slate-400'
                  }`}>
                    {trip.route_name}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Activity size={12} className={selectedTrip?.id === trip.id ? 'text-white/70' : 'text-slate-400'} />
                        <span className="text-[10px] font-mono">{trip.speed} km/h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wifi size={12} className={selectedTrip?.id === trip.id ? 'text-white/70' : 'text-emerald-500'} />
                        <span className="text-[10px] font-mono">Live</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-black">
                      {trip.occupancy}% <span className="text-[8px] opacity-70">Load</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Map View Area */}
        <div className="flex-1 bg-white border border-slate-200 relative overflow-hidden">
          {selectedTrip ? (
            <div className="absolute inset-0 flex flex-col">
              {/* Live Map Placeholder */}
              <div className="flex-1 bg-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                
                {/* Animated Bus Marker */}
                <motion.div 
                  animate={{ 
                    x: [100, 200, 150, 300],
                    y: [100, 150, 250, 200]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white z-10"
                >
                  <BusIcon size={24} />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap shadow-lg">
                    {selectedTrip.bus_id}
                  </div>
                </motion.div>

                {/* Route Path */}
                <svg className="absolute inset-0 w-full h-full opacity-10">
                  <path d="M 50,50 L 200,150 L 400,100 L 600,300" stroke="black" strokeWidth="8" fill="none" strokeLinecap="round" />
                </svg>

                {/* Map Controls */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                  <button className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-lg">
                    <Plus size={20} />
                  </button>
                  <button className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-lg">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Trip Details Bar */}
              <div className="h-24 border-t border-slate-200 flex items-center px-8 gap-12 bg-white">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-sm font-black">Near Avinashi Bypass</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Next Stop</p>
                  <div className="flex items-center gap-2">
                    <Navigation size={16} className="text-amber-500" />
                    <span className="text-sm font-black">Avinashi New Stand (2.4 km)</span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <button className="px-4 py-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Contact Driver
                  </button>
                  <button className="px-4 py-2 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all">
                    Emergency Alert
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                <Navigation size={40} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 mb-2">Select a Bus to Monitor</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-xs">
                Click on an active trip from the sidebar to view live GPS tracking, speed, and occupancy data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
