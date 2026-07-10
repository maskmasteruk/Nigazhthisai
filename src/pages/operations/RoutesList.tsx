import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  MapPin, 
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Navigation,
  Save,
  Clock3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../lib/api';
import { AdminRoute } from '../../types/admin';
import { toast } from 'sonner';
import { DAYS_OF_WEEK, DayOfWeek, getCurrentDayName } from '../../lib/routeScheduler';

export const RoutesList: React.FC = () => {
  const navigate = useNavigate();
  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<AdminRoute | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    code: '',
    district: DISTRICTS[1]
  });
  
  // Schedule State
  const [schedules, setSchedules] = useState<Record<string, string[]>>({});
  const [editingDay, setEditingDay] = useState<DayOfWeek | 'DEFAULT'>('DEFAULT');
  const [newStop, setNewStop] = useState('');

  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const fetchRoutes = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getRoutes();
      setRoutes(data);
    } catch (error) {
      toast.error('Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleOpenSchedule = (route: AdminRoute) => {
    setSelectedRoute(route);
    setSchedules(route.day_schedules || {});
    setIsScheduleModalOpen(true);
  };

  const handleAddStop = () => {
    if (!newStop.trim()) return;
    
    if (editingDay === 'DEFAULT') {
      const currentStops = selectedRoute?.stops || [];
      if (selectedRoute) {
        setSelectedRoute({
          ...selectedRoute,
          stops: [...currentStops, newStop.trim()]
        });
      }
    } else {
      const currentDayStops = schedules[editingDay] || [];
      setSchedules({
        ...schedules,
        [editingDay]: [...currentDayStops, newStop.trim()]
      });
    }
    setNewStop('');
  };

  const handleRemoveStop = (index: number) => {
    if (editingDay === 'DEFAULT') {
      if (selectedRoute) {
        const updatedStops = [...(selectedRoute.stops || [])];
        updatedStops.splice(index, 1);
        setSelectedRoute({ ...selectedRoute, stops: updatedStops });
      }
    } else {
      const updatedDayStops = [...(schedules[editingDay] || [])];
      updatedDayStops.splice(index, 1);
      setSchedules({ ...schedules, [editingDay]: updatedDayStops });
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedRoute) return;
    setIsSubmitting(true);
    try {
      // In a real app we'd call an API. Here we update mock state indirectly.
      await adminApi.updateRoute(selectedRoute.id, {
        stops: selectedRoute.stops,
        day_schedules: schedules
      });
      toast.success('Schedule updated successfully');
      setIsScheduleModalOpen(false);
      fetchRoutes();
    } catch (error) {
      toast.error('Failed to update schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.name || !newRoute.code) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.createRoute(newRoute);
      toast.success('Route created successfully');
      setIsModalOpen(false);
      setNewRoute({ name: '', code: '', district: DISTRICTS[1] });
      fetchRoutes();
    } catch (error) {
      toast.error('Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    
    try {
      await adminApi.deleteRoute(id);
      toast.success('Route deleted successfully');
      fetchRoutes();
    } catch (error) {
      toast.error('Failed to delete route');
    }
  };

  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDistrict = selectedDistrict === 'All' || r.district === selectedDistrict;
    
    return matchesSearch && matchesDistrict;
  });

  const currentDay = getCurrentDayName();

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Create & Manage Routes</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Configure transit pathways and view the active routes registry.</p>
        </div>
        <button 
          onClick={() => navigate('/operations/setup/route')}
          className="px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 hover:bg-primary-light transition-all active:scale-95 self-start md:self-auto"
        >
          <Plus size={16} />
          Start Setup Wizard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Create Route Form */}
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary flex items-center justify-center text-white">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Create Route</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Define parameters</p>
            </div>
          </div>

          <form onSubmit={handleCreateRoute} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Route Name</label>
              <input 
                type="text" 
                placeholder="e.g. Tiruppur - Avinashi"
                value={newRoute.name}
                onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Route Code</label>
              <input 
                type="text" 
                placeholder="e.g. TUP-AVI"
                value={newRoute.code}
                onChange={(e) => setNewRoute({ ...newRoute, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg uppercase"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
              <select 
                value={newRoute.district}
                onChange={(e) => setNewRoute({ ...newRoute, district: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg appearance-none cursor-pointer"
              >
                {DISTRICTS.filter(d => d !== 'All').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>



            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.25em] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Creating Route...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Route
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Available Routes List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-4 shadow-sm">
            <div className="relative flex-1 w-full group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Search routes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-primary outline-none transition-all font-medium text-slate-900 text-sm"
              />
            </div>

            {isMaster && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select 
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-slate-200 focus:border-primary outline-none transition-all font-bold text-xs uppercase tracking-wider text-slate-700 cursor-pointer w-full"
                >
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d === 'All' ? 'ALL DISTRICTS' : `${d.toUpperCase()} DISTRICT`}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Routes Table */}
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Route ID</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Route Name</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Code</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Dynamic Schedule</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Routes...</p>
                      </td>
                    </tr>
                  ) : filteredRoutes.length > 0 ? filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-8 py-6">
                        <span className="text-base font-black text-slate-400 uppercase tracking-widest">#{route.id}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900">{route.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                              {route.day_schedules?.[currentDay] ? (
                                <span className="text-primary">Custom route active for {currentDay}</span>
                              ) : (
                                <span>Standard route active</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-black uppercase tracking-widest">
                          {route.code}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => handleOpenSchedule(route)}
                          className="flex items-center gap-3 group/sched transition-all"
                        >
                          <div className="flex -space-x-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <div 
                                key={day}
                                className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black ${
                                  route.day_schedules?.[day] ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'
                                }`}
                                title={day}
                              >
                                {day[0]}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/sched:text-primary transition-colors">
                            View Schedule
                          </span>
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 text-sm font-black uppercase tracking-widest ${
                          route.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {route.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/operations/trips?search=${route.name}`)}
                            className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-primary transition-all"
                            title="Schedule Trips"
                          >
                            <Clock3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleOpenSchedule(route)}
                            className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-primary transition-all"
                            title="Manage Daily Schedule"
                          >
                            <Calendar size={16} />
                          </button>
                          <button className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-primary transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteRoute(route.id)}
                            className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-rose-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No routes found matching your search</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Showing 1 to {filteredRoutes.length} of {routes.length} routes</p>
              <div className="flex items-center gap-2">
                <button className="p-2 border border-slate-200 bg-white text-slate-400 hover:text-primary transition-all disabled:opacity-50" disabled>
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <button className="p-2 border border-slate-200 bg-white text-slate-400 hover:text-primary transition-all disabled:opacity-50" disabled>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Management Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && selectedRoute && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white shadow-2xl flex flex-col h-[85vh] overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Day-Wise Route Scheduler</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">
                      Editing: <span className="text-slate-900">{selectedRoute.name} ({selectedRoute.code})</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-slate-100 transition-all text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Days Selector */}
                <div className="w-64 border-r border-slate-100 bg-slate-50 overflow-y-auto no-scrollbar">
                  <button 
                    onClick={() => setEditingDay('DEFAULT')}
                    className={`w-full text-left px-6 py-4 border-b border-white transition-all flex items-center justify-between ${
                      editingDay === 'DEFAULT' ? 'bg-white border-l-4 border-l-primary text-primary' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">Standard (Default)</span>
                    <CheckCircle2 size={14} className={selectedRoute.stops?.length ? 'text-emerald-500' : 'text-slate-200'} />
                  </button>
                  <div className="p-4">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Weekly Schedule</p>
                    <div className="space-y-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <button 
                          key={day}
                          onClick={() => setEditingDay(day)}
                          className={`w-full text-left px-4 py-3 rounded-none transition-all flex items-center justify-between ${
                            editingDay === day ? 'bg-primary text-white' : 'text-slate-600 hover:bg-white hover:shadow-sm'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">{day}</span>
                          <CheckCircle2 size={12} className={schedules[day] ? (editingDay === day ? 'text-white' : 'text-emerald-500') : 'opacity-20'} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Area - Stops Management */}
                <div className="flex-1 flex flex-col p-8 bg-white overflow-y-auto no-scrollbar">
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        Stops Sequence for {editingDay}
                      </h3>
                      {editingDay !== 'DEFAULT' && !schedules[editingDay] && (
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">Falling back to Default</span>
                      )}
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1 relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          placeholder="Search or enter stop name..."
                          value={newStop}
                          onChange={(e) => setNewStop(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddStop()}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-medium text-slate-900"
                        />
                      </div>
                      <button 
                        onClick={handleAddStop}
                        className="px-6 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add Stop
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="space-y-4 relative before:absolute before:left-6 before:top-8 before:bottom-8 before:w-px before:bg-slate-100 before:border-l before:border-dashed before:border-slate-300">
                      {(editingDay === 'DEFAULT' ? (selectedRoute?.stops || []) : (schedules[editingDay] || [])).length > 0 ? (
                        (editingDay === 'DEFAULT' ? (selectedRoute?.stops || []) : (schedules[editingDay] || [])).map((stop, index) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={`${editingDay}-${index}`}
                            className="relative flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group/stop"
                          >
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-black text-xs relative z-10 shadow-lg">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{stop}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Stop Point</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveStop(index)}
                              className="p-2 opacity-0 group-hover/stop:opacity-100 text-slate-300 hover:text-rose-500 transition-all bg-slate-50 hover:bg-rose-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="py-20 text-center space-y-4 border-2 border-dashed border-slate-100">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Navigation size={32} />
                          </div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No stops defined for this schedule</p>
                          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest max-w-[200px] mx-auto">Add stops in order using the input above to build the route sequence.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Auto-Detection Enabled</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dynamic Fallback Logic: Active</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={handleSaveSchedule}
                    disabled={isSubmitting}
                    className="px-12 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:bg-primary-light transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Entire Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

