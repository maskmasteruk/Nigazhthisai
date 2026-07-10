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
import { supabase } from '../../lib/supabase';

export const TripsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  const [submitting, setSubmitting] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [conductors, setConductors] = useState<any[]>([]);

  const [editingTrip, setEditingTrip] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    driver_name: '',
    conductor_name: '',
    status: 'PLANNED'
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      const [tripsData, routesData, busesData, usersData] = await Promise.all([
        adminApi.getTrips(),
        adminApi.getRoutes(),
        adminApi.getBuses(),
        adminApi.getUsers()
      ]);
      setTrips(tripsData);
      setRoutes(routesData);
      setBuses(busesData);

      const activeDrivers = (usersData || []).filter((u: any) => {
        const role = (u.role || u.raw_user_meta_data?.role || u.user_metadata?.role || '').toUpperCase();
        const status = (u.status || u.raw_user_meta_data?.status || u.user_metadata?.status || 'ACTIVE').toUpperCase();
        let isDriver = false;
        if (role === 'DRIVER') {
          isDriver = true;
        } else if (role === '' || role === 'PASSENGER') {
          isDriver = !!(u.email && u.email.toLowerCase().includes('driver'));
        }
        return isDriver && status === 'ACTIVE';
      });
      const activeConductors = (usersData || []).filter((u: any) => {
        const role = (u.role || u.raw_user_meta_data?.role || u.user_metadata?.role || '').toUpperCase();
        const status = (u.status || u.raw_user_meta_data?.status || u.user_metadata?.status || 'ACTIVE').toUpperCase();
        let isConductor = false;
        if (role === 'CONDUCTOR') {
          isConductor = true;
        } else if (role === '' || role === 'PASSENGER') {
          isConductor = !!(u.email && u.email.toLowerCase().includes('conductor'));
        }
        return isConductor && status === 'ACTIVE';
      });
      setDrivers(activeDrivers);
      setConductors(activeConductors);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAdminMetadata = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !isMaster) {
        const meta = user.user_metadata || {};
        if (meta.district) {
          const match = DISTRICTS.find(d => d.toLowerCase() === meta.district.toLowerCase());
          if (match) setSelectedDistrict(match);
        }
      }
    };
    fetchAdminMetadata();
  }, [userRole]);

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

  const handleEditClick = (trip: any) => {
    setEditingTrip(trip);
    setEditFormData({
      driver_name: trip.driver_name || '',
      conductor_name: trip.conductor_name || '',
      status: trip.status || 'PLANNED'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.updateTrip(editingTrip.id, editFormData);
      toast.success('Trip updated successfully');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update trip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrip = async (id: any) => {
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
    const route = (trip.route_id && routes) ? routes.find(r => r.id?.toString() === trip.route_id.toString()) : null;
    const driverName = trip.driver_name || '';
    const conductorName = trip.conductor_name || '';
    
    const matchesSearch = driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conductorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (route && ((route.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   (route.code || '').toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesDistrict = selectedDistrict === 'All' || 
      (trip.district && trip.district.toLowerCase() === selectedDistrict.toLowerCase());
    
    return matchesSearch && matchesDistrict;
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
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/operations/setup/route')}
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
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${trip.driver_ended ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {trip.driver_ended ? 'ENDED' : 'ACTIVE'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-xs font-bold">{trip.conductor_name} (C)</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${trip.conductor_ended ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {trip.conductor_ended ? 'ENDED' : 'ACTIVE'}
                          </span>
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
                      <div className="flex flex-col gap-1.5 items-start">
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
                        {trip.status === 'COMPLETED' && (
                          <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            trip.gps_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {trip.gps_verified ? 'GPS VERIFIED' : 'GPS WARNING'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(trip)}
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                          title="Edit Trip"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                          title="Delete Trip"
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

      {/* Edit Trip Modal */}
      {isEditModalOpen && editingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden rounded-sm">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Navigation className="text-primary" size={20} />
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Edit Trip Details</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-200 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Route & Bus Info (Readonly) */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-sm text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block">Route</span>
                  <span className="font-black text-slate-800">{editingTrip.route_name || `ID: ${editingTrip.route_id}`}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block">Bus</span>
                  <span className="font-black text-slate-800">{editingTrip.bus_no || editingTrip.bus_id || 'N/A'}</span>
                </div>
              </div>

              {/* Driver and Conductor allocation fields removed for self-allocation */}

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Trip Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm"
                >
                  <option value="PLANNED">PLANNED</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="RUNNING">RUNNING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white hover:bg-primary/95 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 disabled:opacity-75 disabled:pointer-events-none rounded-sm"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
