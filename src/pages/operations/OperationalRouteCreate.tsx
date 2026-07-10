import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MapPin, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';
import { OperationalStepIndicator } from './OperationalStepIndicator';

export const OperationalRouteCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const DISTRICTS = ['All', 'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Kanchipuram', 'Tirunelveli', 'Thanjavur'];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('All');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    district: DISTRICTS[5] // Tiruppur default
  });

  const fetchRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      const data = await adminApi.getRoutes();
      setRoutes(data);
    } catch (err: any) {
      toast.error('Failed to load existing routes');
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Route Name and Code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRoute = await adminApi.createRoute({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        district: formData.district,
        stops: []
      });

      toast.success('Route metadata created successfully! Proceeding to stops setup.');
      navigate(`/operations/setup/stops?routeId=${newRoute.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRoutes = routes.filter(r => {
    const matchesSearch = 
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id?.toString().includes(searchQuery);

    const matchesDistrict = filterDistrict === 'All' || r.district?.toLowerCase() === filterDistrict.toLowerCase();

    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Operational Setup Wizard</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Configure pathways, assign stations, schedule runs, and initialize live fleets.</p>
      </div>

      <OperationalStepIndicator currentStep="route" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Create Route Form */}
        <div className="lg:col-span-5 bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">1. Create Route Registry</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Specify code, operational boundary and district base.</p>
          </div>

          <form onSubmit={handleCreateRoute} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Route Name</label>
              <input 
                required
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg" 
                placeholder="e.g. Tiruppur – Avinashi"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Route Code</label>
              <input 
                required
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg uppercase" 
                placeholder="e.g. TUP-AVI"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
              />
            </div>

            <div className="space-y-2 w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
              <select 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg appearance-none cursor-pointer"
                value={formData.district}
                onChange={e => setFormData({...formData, district: e.target.value})}
              >
                {DISTRICTS.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Create Route & Add Stops
              <ChevronRight size={16} />
            </button>
          </form>
        </div>

        {/* Right Side: Available Routes List */}
        <div className="lg:col-span-7 bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Available Routes</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Select an existing route to manage its stops or schedule a trip.</p>
            </div>
            <button 
              onClick={fetchRoutes} 
              className="p-2 border-2 border-slate-900 hover:bg-slate-100 transition-colors self-start sm:self-auto"
              title="Refresh Routes"
            >
              <RefreshCw size={16} className={isLoadingRoutes ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-4 border-2 border-slate-950">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search by name, code or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select 
                value={filterDistrict}
                onChange={e => setFilterDistrict(e.target.value)}
                className="px-3 py-2.5 bg-white border-2 border-slate-200 focus:border-slate-900 outline-none font-bold text-xs uppercase tracking-wider text-slate-700 cursor-pointer w-full"
              >
                {DISTRICTS.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'ALL DISTRICTS' : `${d.toUpperCase()}`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Routes Table */}
          <div className="border-2 border-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white border-b-2 border-slate-950">
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Code</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Route Name</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">District</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoadingRoutes ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader2 size={24} className="animate-spin text-slate-900 mx-auto mb-2" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading routes database...</p>
                      </td>
                    </tr>
                  ) : filteredRoutes.length > 0 ? (
                    filteredRoutes.map((route) => (
                      <tr key={route.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-900 text-xs font-black uppercase tracking-wider rounded">
                            {route.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-slate-500 rounded border border-slate-200">
                              <MapPin size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{route.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {route.stops?.length || 0} stops defined
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                          {route.district}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/operations/setup/stops?routeId=${route.id}`)}
                            className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all rounded shadow-md flex items-center gap-1.5 ml-auto"
                          >
                            Configure
                            <ChevronRight size={10} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                        No routes found in the database.
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
