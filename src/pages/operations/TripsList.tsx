import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Navigation, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Clock,
  User,
  Users,
  Loader2,
  X,
  Calendar,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';

export const TripsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  const ZONES = ['All', 'North', 'South', 'West', 'East', 'Central'];
  const [submitting, setSubmitting] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [newTrip, setNewTrip] = useState({
    route_id: '',
    bus_id: '',
    driver_name: '',
    conductor_name: '',
    start_time: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsData, routesData, busesData] = await Promise.all([
        adminApi.getTrips(),
        adminApi.getRoutes(),
        adminApi.getBuses()
      ]);
      setTrips(tripsData);
      setRoutes(routesData);
      setBuses(busesData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.route_id || !newTrip.bus_id || !newTrip.driver_name || !newTrip.conductor_name || !newTrip.start_time) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.scheduleTrip(newTrip);
      toast.success('Trip scheduled successfully');
      setIsModalOpen(false);
      setNewTrip({ route_id: '', bus_id: '', driver_name: '', conductor_name: '', start_time: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to schedule trip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrip = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    
    try {
      await adminApi.deleteTrip(id);
      toast.success('Trip deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete trip');
    }
  };

  const filteredTrips = trips.filter(trip => {
    const route = routes.find(r => r.id.toString() === trip.route_id.toString());
    const matchesSearch = trip.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.conductor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (route && (route.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   route.code.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesDistrict = selectedDistrict === 'All' || trip.district === selectedDistrict;
    const matchesZone = selectedZone === 'All' || trip.zone === selectedZone;
    
    return matchesSearch && matchesDistrict && matchesZone;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by Driver or Conductor name..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isMaster && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-black uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                >
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d} DISTRICT</option>
                  ))}
                </select>
              </div>

              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-black uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                >
                  {ZONES.map(z => (
                    <option key={z} value={z}>{z} ZONE</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/operations/setup')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Plus size={16} />
            Setup New Operation
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Trip Info</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Staff</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Schedule</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Occupancy</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={24} />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading trips...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No trips found</p>
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <Navigation size={20} />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900">Trip #{trip.id}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Route ID: {trip.route_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User size={14} className="text-slate-400" />
                          <span className="text-xs font-bold">{trip.driver_name} (D)</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-xs font-bold">{trip.conductor_name} (C)</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-bold">{trip.start_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[100px] space-y-1">
                        <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                          <span>{trip.occupancy}%</span>
                          <span className="text-slate-400">Full</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              trip.occupancy > 80 ? 'bg-rose-500' : 
                              trip.occupancy > 50 ? 'bg-amber-500' : 
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${trip.occupancy}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                        trip.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-700' : 
                        trip.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          trip.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 
                          trip.status === 'SCHEDULED' ? 'bg-blue-500' : 
                          'bg-slate-500'
                        }`} />
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
