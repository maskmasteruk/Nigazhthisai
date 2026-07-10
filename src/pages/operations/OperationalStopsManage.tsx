import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Search, 
  Globe, 
  Save, 
  RefreshCw 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';
import { OperationalStepIndicator } from './OperationalStepIndicator';

export const OperationalStopsManage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('routeId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  // Stops list currently in the route sequence
  const [routeStops, setRouteStops] = useState<string[]>([]);
  
  // Master stops in the system
  const [masterStops, setMasterStops] = useState<any[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState(true);
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  
  // Form to quickly add a new master stop with coordinates
  const [showNewStopForm, setShowNewStopForm] = useState(false);
  const [newStopData, setNewStopData] = useState({
    name: '',
    lat: '11.1085',
    lng: '77.3411'
  });

  const [newStopInput, setNewStopInput] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load route details and master stops
  useEffect(() => {
    if (!routeId) {
      toast.warning('Please select or create a route first.');
      navigate('/operations/setup/route');
      return;
    }

    const loadData = async () => {
      setIsLoadingRoute(true);
      setIsLoadingStops(true);
      try {
        const [routesList, stopsList] = await Promise.all([
          adminApi.getRoutes(),
          adminApi.getStops()
        ]);
        
        const currentRoute = routesList.find((r: any) => r.id.toString() === routeId);
        if (!currentRoute) {
          toast.error('The selected route was not found.');
          navigate('/operations/setup/route');
          return;
        }

        setRoute(currentRoute);
        setRouteStops(currentRoute.stops || []);
        setMasterStops(stopsList);
      } catch (err: any) {
        toast.error('Failed to load stops or route data');
      } finally {
        setIsLoadingRoute(false);
        setIsLoadingStops(false);
      }
    };

    loadData();
  }, [routeId, navigate]);

  // Filter master stops for suggestion list (only show stops in the same district, and filter by search)
  const filteredMasterStops = masterStops.filter(s => {
    const matchesDistrict = !route || s.district?.toLowerCase() === route.district?.toLowerCase();
    const matchesSearch = s.name?.toLowerCase().includes(stopSearchQuery.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  // Reordering logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...routeStops];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setRouteStops(updated);
    setDraggedIndex(null);
  };

  const moveStopUp = (index: number) => {
    if (index === 0) return;
    const updated = [...routeStops];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setRouteStops(updated);
  };

  const moveStopDown = (index: number) => {
    if (index === routeStops.length - 1) return;
    const updated = [...routeStops];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setRouteStops(updated);
  };

  const handleAddStopToSequence = async (stopName: string) => {
    const trimmed = stopName.trim();
    if (!trimmed) return;

    if (routeStops.includes(trimmed)) {
      toast.error('Stop is already added to this route sequence.');
      return;
    }

    setRouteStops(prev => [...prev, trimmed]);
    setNewStopInput('');

    // If it's a completely new stop not in master lists, add it silently to the database
    const exists = masterStops.some(s => s.name?.toLowerCase() === trimmed.toLowerCase());
    if (!exists && route) {
      try {
        const added = await adminApi.addStop({
          name: trimmed,
          district: route.district,
          lat: 11.1085,
          lng: 77.3411
        });
        setMasterStops(prev => [...prev, added]);
      } catch (err) {
        console.error('Failed to register stop to master list', err);
      }
    }
  };

  const handleCreateNewMasterStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopData.name.trim()) {
      toast.error('Stop Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await adminApi.addStop({
        name: newStopData.name.trim(),
        district: route.district,
        lat: parseFloat(newStopData.lat),
        lng: parseFloat(newStopData.lng)
      });

      setMasterStops(prev => [...prev, added]);
      toast.success('Master stop registered successfully!');
      
      // Auto add to current sequence
      handleAddStopToSequence(added.name);
      
      // Reset form
      setNewStopData({
        name: '',
        lat: '11.1085',
        lng: '77.3411'
      });
      setShowNewStopForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create master stop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStop = (idx: number) => {
    const updated = [...routeStops];
    updated.splice(idx, 1);
    setRouteStops(updated);
  };

  const handleSaveStopsSubmit = async () => {
    if (routeStops.length < 2) {
      toast.error('Please add at least 2 stops to complete the route sequence.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.updateRoute(route.id, {
        name: route.name,
        code: route.code,
        stops: routeStops
      });

      toast.success('Route stops sequence updated! Proceeding to trip scheduling.');
      navigate(`/operations/setup/schedule?routeId=${route.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save route stops sequence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Operational Setup Wizard</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Configure pathways, assign stations, schedule runs, and initialize live fleets.</p>
      </div>

      <OperationalStepIndicator currentStep="stops" />

      {isLoadingRoute ? (
        <div className="bg-white border-4 border-slate-900 p-20 text-center shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
          <Loader2 size={36} className="animate-spin text-slate-900 mx-auto mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading route configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Stops Sequence Configurator (7/12 width) */}
          <div className="lg:col-span-7 bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">2. Sequence Route Stops</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Add, delete, or drag-and-drop to sequence stops on this route.</p>
              </div>
              <div className="bg-slate-900 text-white px-4 py-2 border-2 border-slate-950 font-black text-xs uppercase tracking-widest flex flex-col items-start rounded">
                <span>Route: {route.code}</span>
                <span className="text-slate-400 font-bold text-[10px]">{route.name}</span>
              </div>
            </div>

            {/* Quick Add Stop input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type stop name and press Enter</label>
              <div className="flex gap-4">
                <input 
                  className="flex-1 px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg text-sm" 
                  placeholder="Enter stop name (e.g. Tiruppur Old Bus Stand)"
                  value={newStopInput}
                  onChange={e => setNewStopInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddStopToSequence(newStopInput)}
                />
                <button 
                  onClick={() => handleAddStopToSequence(newStopInput)}
                  className="px-6 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all rounded-lg flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            {/* Drag & Drop Sequence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stops Sequence ({routeStops.length})</span>
                <span className="text-[9px] text-slate-400 font-bold italic">Drag handles or use arrows to rearrange</span>
              </div>

              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 border-2 border-dashed border-slate-200 p-4 bg-slate-50 rounded-lg">
                {routeStops.map((stop, idx) => (
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`flex items-center justify-between p-4 bg-white border-2 rounded-xl transition-all group ${
                      draggedIndex === idx 
                        ? 'border-dashed border-primary bg-primary/5 opacity-50' 
                        : 'border-slate-250 hover:border-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="cursor-grab text-slate-400 hover:text-slate-900 p-1">
                        <GripVertical size={16} />
                      </div>
                      <span className="w-6 h-6 bg-slate-900 text-white text-[10px] font-black flex-shrink-0 flex items-center justify-center rounded-full">
                        {idx + 1}
                      </span>
                      <span className="font-black text-slate-950 text-xs sm:text-sm truncate">{stop}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button 
                        onClick={() => moveStopUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-450 hover:text-slate-950 disabled:opacity-20 transition-all"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        onClick={() => moveStopDown(idx)}
                        disabled={idx === routeStops.length - 1}
                        className="p-1.5 text-slate-450 hover:text-slate-950 disabled:opacity-20 transition-all"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button 
                        onClick={() => handleRemoveStop(idx)} 
                        className="p-1.5 text-slate-350 hover:text-rose-600 transition-all ml-1"
                        title="Delete Stop"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}

                {routeStops.length === 0 && (
                  <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No stops added to this route sequence yet.
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-6 border-t-2 border-slate-100 flex justify-between items-center">
              <button 
                onClick={() => navigate('/operations/setup/route')}
                className="px-6 py-4 border-2 border-slate-900 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-1.5 rounded-lg"
              >
                <ChevronLeft size={16} />
                Back to Route
              </button>

              <button 
                onClick={handleSaveStopsSubmit}
                disabled={isSubmitting || routeStops.length < 2}
                className="px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Stops & Proceed
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Column: Available System Stops Directory (5/12 width) */}
          <div className="lg:col-span-5 bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Available Stops</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Stops registered in {route.district} district. Click to add to sequence.</p>
              </div>
            </div>

            {/* Stop Search Input */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Filter master stops list..." 
                value={stopSearchQuery}
                onChange={e => setStopSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 text-xs"
              />
            </div>

            {/* Stops Buttons Grid */}
            <div className="max-h-[300px] overflow-y-auto pr-1 border-2 border-slate-250 p-4 rounded-lg bg-slate-50">
              {isLoadingStops ? (
                <div className="py-10 text-center">
                  <Loader2 size={20} className="animate-spin text-slate-900 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching master stops...</p>
                </div>
              ) : filteredMasterStops.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredMasterStops.map(s => {
                    const isAlreadyAdded = routeStops.includes(s.name);
                    return (
                      <button
                        key={s.id}
                        disabled={isAlreadyAdded}
                        onClick={() => handleAddStopToSequence(s.name)}
                        className={`px-3 py-2 rounded-lg text-xs font-black border-2 transition-all shadow-sm ${
                          isAlreadyAdded 
                            ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed shadow-none' 
                            : 'bg-white text-slate-800 border-slate-900 hover:bg-slate-900 hover:text-white hover:-translate-y-0.5'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-6 text-xs text-slate-450 font-bold uppercase tracking-widest">
                  No registered stops found in {route.district}.
                </p>
              )}
            </div>

            {/* Register New Master Stop Panel */}
            <div className="border-t-2 border-slate-100 pt-6">
              {!showNewStopForm ? (
                <button
                  onClick={() => setShowNewStopForm(true)}
                  className="w-full py-3 bg-slate-100 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-black text-xs uppercase tracking-widest transition-all rounded-lg"
                >
                  + Create New Master Stop
                </button>
              ) : (
                <form onSubmit={handleCreateNewMasterStop} className="p-5 border-2 border-slate-950 bg-slate-50 space-y-4 rounded-lg">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                    <span className="text-xs font-black uppercase text-slate-900">New Master Stop Form</span>
                    <button 
                      type="button" 
                      onClick={() => setShowNewStopForm(false)} 
                      className="text-[10px] font-black uppercase text-slate-455 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stop Name</label>
                    <input 
                      required
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 text-xs" 
                      placeholder="e.g. Avinashi New Bus Stand"
                      value={newStopData.name}
                      onChange={e => setNewStopData({...newStopData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latitude</label>
                      <input 
                        type="number"
                        step="0.000001"
                        required
                        className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 text-xs" 
                        value={newStopData.lat}
                        onChange={e => setNewStopData({...newStopData, lat: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Longitude</label>
                      <input 
                        type="number"
                        step="0.000001"
                        required
                        className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 text-xs" 
                        value={newStopData.lng}
                        onChange={e => setNewStopData({...newStopData, lng: e.target.value})}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={12} /> : <Plus size={12} />}
                    Register Master Stop
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
