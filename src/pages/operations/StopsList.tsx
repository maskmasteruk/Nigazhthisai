import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MapPin, 
  Loader2,
  X,
  Save,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';

export const StopsList: React.FC = () => {
  const navigate = useNavigate();
  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  
  const [stops, setStops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [stopForm, setStopForm] = useState({
    name: '',
    district: DISTRICTS[1],
    lat: '11.1085',
    lng: '77.3411'
  });

  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const fetchStops = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getStops();
      setStops(data);
    } catch (error) {
      toast.error('Failed to fetch stops');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStops();
  }, []);

  const handleOpenAddModal = () => {
    setEditingStop(null);
    setStopForm({
      name: '',
      district: DISTRICTS[1],
      lat: '11.1085',
      lng: '77.3411'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (stop: any) => {
    setEditingStop(stop);
    setStopForm({
      name: stop.name,
      district: stop.district || DISTRICTS[1],
      lat: String(stop.lat || 11.1085),
      lng: String(stop.lng || 77.3411)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopForm.name.trim()) {
      toast.error('Please enter a stop name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStop) {
        await adminApi.updateStop(editingStop.id, {
          name: stopForm.name.trim(),
          district: stopForm.district,
          lat: parseFloat(stopForm.lat),
          lng: parseFloat(stopForm.lng)
        });
        toast.success('Stop updated successfully');
      } else {
        await adminApi.addStop({
          name: stopForm.name.trim(),
          district: stopForm.district,
          lat: parseFloat(stopForm.lat),
          lng: parseFloat(stopForm.lng)
        });
        toast.success('Stop created successfully');
      }
      setIsModalOpen(false);
      fetchStops();
    } catch (error) {
      toast.error(editingStop ? 'Failed to update stop' : 'Failed to create stop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStop = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this stop?')) return;
    
    try {
      await adminApi.deleteStop(id);
      toast.success('Stop deleted successfully');
      fetchStops();
    } catch (error) {
      toast.error('Failed to delete stop');
    }
  };

  const filteredStops = stops.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.id && String(s.id).toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDistrict = selectedDistrict === 'All' || s.district === selectedDistrict;
    
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Manage Stops</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Configure transit stops and coordinates in the system.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Create/Edit Stop Form */}
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary flex items-center justify-center text-white">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                {editingStop ? 'Edit Stop' : 'Create Stop'}
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                {editingStop ? 'Modify details' : 'Define new stop'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stop Name</label>
              <input 
                type="text" 
                placeholder="e.g. Tiruppur New Bus Stand"
                value={stopForm.name}
                onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
              <select 
                value={stopForm.district}
                onChange={(e) => setStopForm({ ...stopForm, district: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg appearance-none cursor-pointer"
              >
                {DISTRICTS.filter(d => d !== 'All').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                <input 
                  type="number" 
                  step="0.000001"
                  placeholder="11.1085"
                  value={stopForm.lat}
                  onChange={(e) => setStopForm({ ...stopForm, lat: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                <input 
                  type="number" 
                  step="0.000001"
                  placeholder="77.3411"
                  value={stopForm.lng}
                  onChange={(e) => setStopForm({ ...stopForm, lng: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {editingStop && (
                <button 
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    {editingStop ? 'Save' : 'Create Stop'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Stops Directory Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-4 shadow-sm">
            <div className="relative flex-1 w-full group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Search stops..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-primary outline-none transition-all font-medium text-slate-900 text-sm"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 focus:border-primary outline-none transition-all font-bold text-xs uppercase tracking-wider text-slate-700 cursor-pointer"
              >
                {DISTRICTS.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'ALL DISTRICTS' : `${d.toUpperCase()} DISTRICT`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stops Table */}
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Stop ID</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Stop Name</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">District</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Coordinates</th>
                    <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Stops...</p>
                      </td>
                    </tr>
                  ) : filteredStops.length > 0 ? filteredStops.map((stop) => (
                    <tr key={stop.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-8 py-6">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block truncate max-w-[120px]" title={stop.id}>
                          #{stop.id ? stop.id.substring(0, 8) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900">{stop.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Verified Stop Point</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-black uppercase tracking-widest">
                          {stop.district || 'General'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                          <Globe size={14} className="text-slate-400" />
                          <span>{Number(stop.lat).toFixed(4)}, {Number(stop.lng).toFixed(4)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(stop)}
                            className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-primary transition-all"
                            title="Edit Stop Details"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteStop(stop.id)}
                            className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-rose-500 transition-all"
                            title="Delete Stop"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No stops found matching your search</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
