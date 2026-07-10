import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  MapPin, 
  Bus as BusIcon, 
  Clock, 
  User, 
  Users, 
  ArrowRight, 
  LayoutDashboard, 
  List, 
  Loader2, 
  Activity 
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';
import { OperationalStepIndicator } from './OperationalStepIndicator';

export const OperationalDone: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('routeId');
  const tripId = searchParams.get('tripId');

  const [isLoading, setIsLoading] = useState(true);
  const [route, setRoute] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  
  // List of active/running operations for the right panel
  const [otherTrips, setOtherTrips] = useState<any[]>([]);
  const [isLoadingOther, setIsLoadingOther] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const [routesList, tripsList] = await Promise.all([
          adminApi.getRoutes(),
          adminApi.getTrips()
        ]);

        if (routeId) {
          const currentRoute = routesList.find((r: any) => r.id.toString() === routeId);
          setRoute(currentRoute);
        }

        if (tripId) {
          const currentTrip = tripsList.find((t: any) => t.id.toString() === tripId);
          setTrip(currentTrip);
        }

        // Load active/scheduled system trips for context
        setOtherTrips(tripsList.slice(0, 5)); // show top 5 trips
      } catch (err) {
        toast.error('Failed to load completed setup details');
      } finally {
        setIsLoading(false);
        setIsLoadingOther(false);
      }
    };

    loadDetails();
  }, [routeId, tripId]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Operational Setup Wizard</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Configure pathways, assign stations, schedule runs, and initialize live fleets.</p>
      </div>

      <OperationalStepIndicator currentStep="done" />

      {isLoading ? (
        <div className="bg-white border-4 border-slate-900 p-20 text-center shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
          <Loader2 size={36} className="animate-spin text-slate-900 mx-auto mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Wrapping up operational dispatch...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Summary (7/12 width) */}
          <div className="lg:col-span-7 bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 text-center space-y-8">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">{t('ops.setup_complete') || 'Operational Setup Complete'}</h2>
              <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto mt-2">
                {t('ops.setup_complete_desc') || 'The route, stops sequence, and trip operations have been successfully initialized and linked in the system.'}
              </p>
            </div>

            {/* Summary Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {route && (
                <div className="p-5 border-2 border-slate-950 bg-slate-50 rounded-lg space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">1. Route Registry</span>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{route.code} — {route.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{route.district}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Stops Sequence</span>
                    <p className="text-[11px] font-bold text-slate-700 truncate">
                      {route.stops && route.stops.length > 0 
                        ? route.stops.join(' ➔ ') 
                        : 'No stops registered'}
                    </p>
                  </div>
                </div>
              )}

              {trip && (
                <div className="p-5 border-2 border-slate-950 bg-slate-50 rounded-lg space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">2. Operational Trip</span>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded shrink-0">
                      <BusIcon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Trip #{trip.id}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Status: <span className="text-primary font-black">{trip.status}</span></p>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-1 grid grid-cols-2 gap-1 text-[9px] font-bold text-slate-600 uppercase">
                    <span className="flex items-center gap-1"><Clock size={10} /> Time: {trip.start_time}</span>
                    <span className="flex items-center gap-1"><BusIcon size={10} /> Bus: {trip.bus_no}</span>
                    <span className="col-span-2 flex items-center gap-1 mt-1"><User size={10} /> Driver: {trip.driver_name}</span>
                    <span className="col-span-2 flex items-center gap-1"><Users size={10} /> Staff: {trip.conductor_name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={() => navigate('/operations/setup/route')}
                className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 font-black text-xs uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2"
              >
                {t('ops.setup_new_pipeline') || 'Setup New Operation'}
                <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => navigate('/operations/trips')}
                className="px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-900 font-black text-xs uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2"
              >
                <List size={14} />
                View All Trips
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={14} />
                {t('ops.return_dashboard') || 'Dashboard'}
              </button>
            </div>
          </div>

          {/* Right Column: Other Active Operations (5/12 width) */}
          <div className="lg:col-span-5 bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Active System Operations</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Other scheduled runs currently registered in the database.</p>
            </div>

            <div className="space-y-3">
              {isLoadingOther ? (
                <div className="py-10 text-center">
                  <Loader2 size={24} className="animate-spin text-slate-900 mx-auto" />
                </div>
              ) : otherTrips.length > 0 ? (
                otherTrips.map(ot => (
                  <div key={ot.id} className="p-3 border-2 border-slate-950 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center rounded shrink-0">
                        <Activity size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Trip #{ot.id}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Route ID: {ot.route_id} | Time: {ot.start_time}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase border border-slate-350 bg-slate-100 text-slate-700">
                      {ot.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-455 font-bold uppercase tracking-widest text-center py-6">No other trips registered.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
