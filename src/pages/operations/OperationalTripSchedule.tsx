import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Navigation, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Bus as BusIcon, 
  Clock, 
  User, 
  Users, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';
import { OperationalStepIndicator } from './OperationalStepIndicator';

export const OperationalTripSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('routeId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  // Buses list
  const [buses, setBuses] = useState<any[]>([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(true);

  // Drivers and Conductors lists
  const [drivers, setDrivers] = useState<any[]>([]);
  const [conductors, setConductors] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Existing trips
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  // Trip scheduling form data
  const [tripData, setTripData] = useState({
    bus_id: '',
    start_time: '08:00',
    driver_name: '',
    conductor_name: '',
    status: 'SCHEDULED'
  });

  // Quick Bus Creation
  const [showQuickBusForm, setShowQuickBusForm] = useState(false);
  const [quickBusData, setQuickBusData] = useState({
    reg_no: '',
    model: '',
    type: 'NON-AC' as 'AC' | 'NON-AC',
    etm_id: '',
    capacity: 50,
    fare: 15
  });

  const loadData = async () => {
    if (!routeId) {
      toast.warning('Please select or create a route first.');
      navigate('/operations/setup/route');
      return;
    }

    setIsLoadingRoute(true);
    setIsLoadingBuses(true);
    setIsLoadingTrips(true);
    setIsLoadingUsers(true);

    try {
      const [routesList, busesList, tripsList, usersList] = await Promise.all([
        adminApi.getRoutes(),
        adminApi.getBuses(),
        adminApi.getTrips(),
        adminApi.getUsers()
      ]);

      const currentRoute = routesList.find((r: any) => r.id.toString() === routeId);
      if (!currentRoute) {
        toast.error('The selected route was not found.');
        navigate('/operations/setup/route');
        return;
      }

      setRoute(currentRoute);
      setBuses(busesList);
      setTrips(tripsList);

      const driverUsers = usersList.filter((u: any) => u.role === 'DRIVER' && u.status === 'ACTIVE');
      const conductorUsers = usersList.filter((u: any) => u.role === 'CONDUCTOR' && u.status === 'ACTIVE');
      setDrivers(driverUsers);
      setConductors(conductorUsers);

      // Auto select first bus if available
      if (busesList.length > 0) {
        setTripData(prev => ({ 
          ...prev, 
          bus_id: busesList[0].id || busesList[0].registration_number,
          driver_name: prev.driver_name || (driverUsers[0]?.name || ''),
          conductor_name: prev.conductor_name || (conductorUsers[0]?.name || '')
        }));
      } else {
        setTripData(prev => ({ 
          ...prev,
          driver_name: prev.driver_name || (driverUsers[0]?.name || ''),
          conductor_name: prev.conductor_name || (conductorUsers[0]?.name || '')
        }));
      }
    } catch (err: any) {
      toast.error('Failed to load scheduling data');
    } finally {
      setIsLoadingRoute(false);
      setIsLoadingBuses(false);
      setIsLoadingTrips(false);
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [routeId, navigate]);

  const handleQuickBusRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBusData.reg_no.trim() || !quickBusData.etm_id.trim()) {
      toast.error('Registration Number and ETM Device ID are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBus = await adminApi.addBus({
        reg_no: quickBusData.reg_no.trim().toUpperCase(),
        model: quickBusData.model.trim() || 'Tata Marcopolo',
        type: quickBusData.type,
        etm_id: quickBusData.etm_id.trim(),
        capacity: Number(quickBusData.capacity),
        fare: Number(quickBusData.fare),
        district: route.district,
        zone: route.zone,
        status: 'ACTIVE'
      });

      setBuses(prev => [...prev, newBus]);
      setTripData(prev => ({ ...prev, bus_id: newBus.id || newBus.reg_no }));
      setShowQuickBusForm(false);
      setQuickBusData({
        reg_no: '',
        model: '',
        type: 'NON-AC',
        etm_id: '',
        capacity: 50,
        fare: 15
      });
      toast.success('New bus registered and auto-selected!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to register bus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTripScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripData.bus_id) {
      toast.error('Please allocate a bus for this trip');
      return;
    }
    if (!tripData.driver_name.trim() || !tripData.conductor_name.trim()) {
      toast.error('Driver and Conductor names are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledTrip = await adminApi.scheduleTrip({
        route_id: route.id,
        bus_id: tripData.bus_id,
        driver_name: tripData.driver_name.trim(),
        conductor_name: tripData.conductor_name.trim(),
        status: 'SCHEDULED',
        actual_start_time: tripData.start_time,
        district: route.district,
        zone: route.zone
      });

      toast.success('Trip scheduled and linked successfully!');
      navigate(`/operations/setup/done?routeId=${route.id}&tripId=${scheduledTrip.id || scheduledTrip.trip_id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter existing trips for this specific route for the right panel list
  const routeTrips = trips.filter(t => t.route_id?.toString() === routeId?.toString());

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Operational Setup Wizard</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Configure pathways, assign stations, schedule runs, and initialize live fleets.</p>
      </div>

      <OperationalStepIndicator currentStep="schedule" />

      {isLoadingRoute ? (
        <div className="bg-white border-4 border-slate-900 p-20 text-center shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
          <Loader2 size={36} className="animate-spin text-slate-900 mx-auto mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading operational details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Trip Scheduling Form (6/12 width) */}
          <div className="lg:col-span-6 bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">3. Schedule operational trip</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Assign an active bus, driver, and conductor schedules.</p>
              </div>
              <div className="bg-slate-900 text-white px-4 py-2 border-2 border-slate-950 font-black text-xs uppercase tracking-widest flex flex-col items-start rounded">
                <span>Route: {route.code}</span>
                <span className="text-slate-400 font-bold text-[10px]">{route.stops?.length || 0} stops</span>
              </div>
            </div>

            {/* Quick Register / Select Bus */}
            <div className="space-y-4 bg-slate-50 p-6 border-2 border-slate-950 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Allocate operational bus</label>
                <button
                  type="button"
                  onClick={() => setShowQuickBusForm(!showQuickBusForm)}
                  className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline transition-all"
                >
                  {showQuickBusForm ? 'Select Existing Bus' : '+ Register New Bus'}
                </button>
              </div>

              {!showQuickBusForm ? (
                <div className="space-y-2">
                  {isLoadingBuses ? (
                    <div className="flex items-center gap-2 text-slate-500 py-3 text-xs">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Fetching active buses...</span>
                    </div>
                  ) : buses.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold flex flex-col gap-2">
                      <span>No registered buses found in the database. Please register one.</span>
                      <button
                        type="button"
                        onClick={() => setShowQuickBusForm(true)}
                        className="bg-amber-700 text-white px-3 py-1.5 text-[9px] uppercase tracking-widest font-black rounded hover:bg-amber-800 transition-all self-start"
                      >
                        Register Bus
                      </button>
                    </div>
                  ) : (
                    <select 
                      className="w-full px-5 py-4 bg-white border-2 border-slate-200 focus:border-slate-900 outline-none transition-all font-bold text-slate-950 rounded-lg appearance-none cursor-pointer text-sm"
                      value={tripData.bus_id}
                      onChange={e => setTripData({ ...tripData, bus_id: e.target.value })}
                    >
                      {buses.map(b => (
                        <option key={b.id || b.registration_number} value={b.id || b.registration_number}>
                          {b.registration_number} ({b.model || 'Tata Marcopolo'}) — {b.type}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                /* QUICK REGISTER BUS FORM */
                <form onSubmit={handleQuickBusRegister} className="bg-white p-5 border border-slate-250 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registration No.</label>
                      <input 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 text-xs rounded" 
                        placeholder="e.g. TN 37 BV 1234"
                        value={quickBusData.reg_no}
                        onChange={e => setQuickBusData({...quickBusData, reg_no: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model/Chassis</label>
                      <input 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 text-xs rounded" 
                        placeholder="e.g. Ashok Leyland"
                        value={quickBusData.model}
                        onChange={e => setQuickBusData({...quickBusData, model: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ETM Device ID</label>
                      <input 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 text-xs rounded" 
                        placeholder="ETM-XXX"
                        value={quickBusData.etm_id}
                        onChange={e => setQuickBusData({...quickBusData, etm_id: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bus Type</label>
                      <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                        {['NON-AC', 'AC'].map(tType => (
                          <button
                            type="button"
                            key={tType}
                            onClick={() => setQuickBusData({...quickBusData, type: tType as any})}
                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                              quickBusData.type === tType ? 'bg-slate-900 text-white rounded' : 'text-slate-400'
                            }`}
                          >
                            {tType}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickBusForm(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-500 font-bold text-[9px] uppercase tracking-widest rounded hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded hover:bg-slate-800 transition-all flex items-center gap-1"
                    >
                      {isSubmitting && <Loader2 className="animate-spin" size={10} />}
                      Save & Select
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Scheduler Core Form */}
            <form onSubmit={handleTripScheduleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                  <input 
                    type="time"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg text-sm" 
                    value={tripData.start_time}
                    onChange={e => setTripData({...tripData, start_time: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operations Base</label>
                  <div className="px-5 py-4 bg-slate-100 text-slate-500 font-bold border-2 border-slate-200 rounded-lg text-sm h-[56px] flex items-center">
                    District: {route.district} ({route.zone} Zone)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocated Driver</label>
                  {isLoadingUsers ? (
                    <div className="px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-400 text-xs font-bold flex items-center gap-2 rounded-lg">
                      <Loader2 size={12} className="animate-spin" />
                      Loading drivers...
                    </div>
                  ) : drivers.length === 0 ? (
                    <div className="space-y-2">
                      <input 
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg text-sm" 
                        placeholder="Enter driver name manually"
                        value={tripData.driver_name}
                        onChange={e => setTripData({...tripData, driver_name: e.target.value})}
                      />
                      <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wide ml-1">No active drivers in DB. Type name manually or create in Users.</p>
                    </div>
                  ) : (
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg appearance-none cursor-pointer text-sm"
                      value={tripData.driver_name}
                      onChange={e => setTripData({...tripData, driver_name: e.target.value})}
                    >
                      <option value="">-- Select Driver --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.name}>{d.name} ({d.phone || d.email})</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocated Conductor</label>
                  {isLoadingUsers ? (
                    <div className="px-5 py-4 bg-slate-50 border-2 border-slate-200 text-slate-400 text-xs font-bold flex items-center gap-2 rounded-lg">
                      <Loader2 size={12} className="animate-spin" />
                      Loading conductors...
                    </div>
                  ) : conductors.length === 0 ? (
                    <div className="space-y-2">
                      <input 
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg text-sm" 
                        placeholder="Enter conductor name manually"
                        value={tripData.conductor_name}
                        onChange={e => setTripData({...tripData, conductor_name: e.target.value})}
                      />
                      <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wide ml-1">No active conductors in DB. Type name manually or create in Users.</p>
                    </div>
                  ) : (
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 rounded-lg appearance-none cursor-pointer text-sm"
                      value={tripData.conductor_name}
                      onChange={e => setTripData({...tripData, conductor_name: e.target.value})}
                    >
                      <option value="">-- Select Conductor --</option>
                      {conductors.map(c => (
                        <option key={c.id} value={c.name}>{c.name} ({c.phone || c.email})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t-2 border-slate-100 flex justify-between items-center">
                <button 
                  type="button"
                  onClick={() => navigate(`/operations/setup/stops?routeId=${route.id}`)}
                  className="px-6 py-4 border-2 border-slate-900 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-1.5 rounded-lg"
                >
                  <ChevronLeft size={16} />
                  Back to Stops
                </button>

                <button 
                  type="submit"
                  disabled={isSubmitting || !tripData.bus_id}
                  className="px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Complete Operational Setup
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Fleet and Trips Status (6/12 width) */}
          <div className="lg:col-span-6 space-y-6">
            {/* available buses panel */}
            <div className="bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 space-y-6">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Available Fleet</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Bus resources registered in the system.</p>
                </div>
                <button onClick={loadData} className="p-2 border-2 border-slate-900 hover:bg-slate-100 transition-colors">
                  <RefreshCw size={16} className={isLoadingBuses ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
                {isLoadingBuses ? (
                  <div className="py-8 text-center">
                    <Loader2 size={24} className="animate-spin text-slate-900 mx-auto" />
                  </div>
                ) : buses.length > 0 ? (
                  buses.map(b => (
                    <div key={b.id || b.registration_number} className="flex items-center justify-between p-3 border-2 border-slate-950 bg-slate-50 hover:bg-white transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded">
                          <BusIcon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{b.registration_number}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{b.model || 'Tata Marcopolo'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider ${
                          b.status === 'ACTIVE' || b.status === 'RUNNING'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}>
                          {b.status || 'ACTIVE'}
                        </span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{b.type}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-450 font-bold uppercase tracking-widest py-6 text-center">No buses found in the database.</p>
                )}
              </div>
            </div>

            {/* scheduled trips on this route */}
            <div className="bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 space-y-6">
              <div className="border-b-2 border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Active Route Schedules</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Currently scheduled runs on this route ({route.name}).</p>
              </div>

              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
                {isLoadingTrips ? (
                  <div className="py-8 text-center">
                    <Loader2 size={24} className="animate-spin text-slate-900 mx-auto" />
                  </div>
                ) : routeTrips.length > 0 ? (
                  routeTrips.map(t => (
                    <div key={t.id} className="p-3 border-2 border-slate-950 bg-slate-50 hover:bg-white transition-colors space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">Trip #{t.id}</span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 border border-blue-300 bg-blue-50 text-blue-800 uppercase tracking-wider">
                          {t.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{t.start_time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BusIcon size={12} />
                          <span>Bus: {t.bus_no || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          <User size={12} />
                          <span>Driver: {t.driver_name} | Staff: {t.conductor_name}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-455 font-bold uppercase tracking-widest py-6 text-center">No runs scheduled for this route yet today.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
