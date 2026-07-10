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
import { supabase } from '../lib/supabase';

export const LiveMonitoring: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [liveTrips, setLiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];

  useEffect(() => {
    const fetchAdminMetadata = async () => {
      if (userRole === 'ADMIN') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata) {
          const meta = session.user.user_metadata;
          if (meta.district) {
            const match = DISTRICTS.find(d => d.toLowerCase() === meta.district.toLowerCase());
            if (match) setSelectedDistrict(match);
          }
        }
      }
    };
    fetchAdminMetadata();
  }, [userRole]);

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
    return matchesSearch && matchesDistrict;
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
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 focus:border-primary outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-700 appearance-none cursor-pointer text-center"
          >
            {DISTRICTS.map(d => (
              <option key={d} value={d}>{d} DISTRICT</option>
            ))}
          </select>
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
              {/* Live Pipeline Tracker */}
              {(() => {
                const routeStops: string[] = selectedTrip?.stops || [];
                const stopsToUse = routeStops.length > 0 ? routeStops : ['Origin Stop', 'Stop A', 'Stop B', 'Stop C', 'Destination Stop'];
                
                const currentSegment = selectedTrip?.current_segment || '';
                let activeStopIndex = stopsToUse.findIndex(s => s.toLowerCase() === currentSegment.toLowerCase());
                if (activeStopIndex === -1) {
                  activeStopIndex = 1;
                }

                return (
                  <div className="flex-1 bg-slate-950 p-8 relative overflow-y-auto no-scrollbar border-b border-slate-200">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,42,93,0.25),rgba(255,255,255,0))]" />
                    
                    <div className="relative z-10 space-y-6 max-w-lg mx-auto">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Live Route Pipeline</span>
                        <span className="px-2.5 py-1 bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-wider">
                          Bus: {selectedTrip.bus_id} ({selectedTrip.status})
                        </span>
                      </div>

                      <div className="relative pl-8 space-y-8">
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

                          return (
                            <div key={stop + '-' + index} className="relative flex items-center gap-4">
                              <div className="absolute -left-[25px] flex items-center justify-center">
                                {isActive ? (
                                  <div className="relative flex items-center justify-center z-20">
                                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75" />
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg shadow-emerald-500/50">
                                      <BusIcon size={14} className="animate-pulse" />
                                    </div>
                                  </div>
                                ) : isCompleted ? (
                                  <div className="w-4 h-4 rounded-full bg-[#D97F00] border border-white flex items-center justify-center text-white z-10 shadow-sm" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 z-10" />
                                )}
                              </div>

                              <div className="flex-1 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/40 p-4 transition-all flex items-center justify-between gap-2">
                                <div>
                                  <p className={`text-xs font-black uppercase tracking-wide ${isActive ? 'text-emerald-400' : isCompleted ? 'text-slate-350' : 'text-slate-500'}`}>
                                    {stop}
                                  </p>
                                  {isActive && (
                                    <span className="text-[8px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                      ● Current Location
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
                );
              })()}

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
