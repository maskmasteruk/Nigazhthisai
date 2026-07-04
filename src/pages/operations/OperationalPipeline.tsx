import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Bus as BusIcon, 
  Navigation, 
  Save, 
  Plus, 
  Trash2, 
  Map as MapIcon,
  Loader2,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';

type Step = 'ROUTE' | 'BUS' | 'TRIP' | 'FINISH';

export const OperationalPipeline: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('ROUTE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shared Data
  const DISTRICTS = ['Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  const ZONES = ['North', 'South', 'West', 'East', 'Central'];

  // Route Data
  const [routeData, setRouteData] = useState({
    name: '',
    code: '',
    district: DISTRICTS[0],
    zone: ZONES[0],
    stops: [] as string[]
  });
  const [newStop, setNewStop] = useState('');

  // Bus Data
  const [busData, setBusData] = useState({
    reg_no: '',
    model: '',
    type: 'NON-AC' as 'AC' | 'NON-AC',
    etm_id: '',
    district: DISTRICTS[0],
    zone: ZONES[0]
  });

  // Trip Data
  const [tripData, setTripData] = useState({
    start_time: '08:00',
    driver_name: '',
    conductor_name: '',
    status: 'ACTIVE'
  });

  const handleAddStop = () => {
    if (!newStop.trim()) return;
    setRouteData({ ...routeData, stops: [...routeData.stops, newStop.trim()] });
    setNewStop('');
  };

  const handleRemoveStop = (idx: number) => {
    const updated = [...routeData.stops];
    updated.splice(idx, 1);
    setRouteData({ ...routeData, stops: updated });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create Route
      const route = await adminApi.createRoute({
        name: routeData.name,
        code: routeData.code,
        district: routeData.district,
        zone: routeData.zone,
        stops: routeData.stops
      });

      // 2. Create Bus
      await adminApi.addBus({
        ...busData
      });

      // 3. Create Trip
      await adminApi.scheduleTrip({
        route_id: (route as any).id,
        bus_id: busData.reg_no,
        ...tripData,
        district: routeData.district,
        zone: routeData.zone
      });

      toast.success(t('ops.success_pipeline'));
      setCurrentStep('FINISH');
    } catch (err) {
      toast.error(t('ops.err_pipeline'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* progress Tracker */}
      <div className="mb-12 flex items-center justify-between px-4">
        {[
          { id: 'ROUTE', label: t('ops.route_stops'), icon: MapPin },
          { id: 'BUS', label: t('ops.bus_etm'), icon: BusIcon },
          { id: 'TRIP', label: t('ops.trip_schedule'), icon: Navigation },
          { id: 'FINISH', label: t('ops.confirmation'), icon: CheckCircle2 }
        ].map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 flex items-center justify-center transition-all ${
                currentStep === s.id ? 'bg-primary text-white shadow-xl shadow-primary/30' : 
                ['ROUTE', 'BUS', 'TRIP', 'FINISH'].indexOf(currentStep) > idx ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <s.icon size={20} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep === s.id ? 'text-primary' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < 3 && <div className={`flex-1 h-px mx-4 ${['ROUTE', 'BUS', 'TRIP', 'FINISH'].indexOf(currentStep) > idx ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white border-2 border-slate-900 shadow-[20px_20px_0px_0px_rgba(15,23,42,0.05)] overflow-hidden">
        {/* Step Content */}
        <div className="p-10">
          <AnimatePresence mode="wait">
            {currentStep === 'ROUTE' && (
              <motion.div 
                key="route" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.route_name')}</label>
                      <input 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                        placeholder="e.g. Tiruppur – Avinashi"
                        value={routeData.name}
                        onChange={e => setRouteData({...routeData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.route_code')}</label>
                      <input 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                        placeholder="e.g. TUP-AVI"
                        value={routeData.code}
                        onChange={e => setRouteData({...routeData, code: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.district')}</label>
                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900 appearance-none"
                        value={routeData.district}
                        onChange={e => setRouteData({...routeData, district: e.target.value})}
                      >
                        {DISTRICTS.map(d => <option key={d} value={d}>{t('dist.' + d)}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.zone')}</label>
                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900 appearance-none"
                        value={routeData.zone}
                        onChange={e => setRouteData({...routeData, zone: e.target.value})}
                      >
                        {ZONES.map(z => <option key={z} value={z}>{t('ops.zone.' + z)}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">{t('ops.route_stops_sequence')}</label>
                    <div className="flex gap-4 mb-6">
                      <input 
                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                        placeholder={t('ops.enter_stop_name')}
                        value={newStop}
                        onChange={e => setNewStop(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddStop()}
                      />
                      <button 
                        onClick={handleAddStop}
                        className="px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                      >
                        {t('ops.add_stop')}
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                      {routeData.stops.map((stop, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 group">
                          <div className="flex items-center gap-4">
                            <span className="w-6 h-6 bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                            <span className="font-bold text-slate-900">{stop}</span>
                          </div>
                          <button onClick={() => handleRemoveStop(idx)} className="text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {routeData.stops.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 text-slate-300 font-bold uppercase tracking-widest text-xs">
                          {t('ops.no_stops_added')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'BUS' && (
              <motion.div 
                key="bus" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.registration_number')}</label>
                    <input 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                      placeholder="e.g. TN 37 BV 1234"
                      value={busData.reg_no}
                      onChange={e => setBusData({...busData, reg_no: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.model_chassis')}</label>
                    <input 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                      placeholder="e.g. Tata Marcopolo"
                      value={busData.model}
                      onChange={e => setBusData({...busData, model: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.etm_device_id')}</label>
                    <div className="relative">
                      <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                        placeholder="ETM-XXX"
                        value={busData.etm_id}
                        onChange={e => setBusData({...busData, etm_id: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.bus_type')}</label>
                    <div className="flex bg-slate-50 p-1 border border-slate-100">
                      {['NON-AC', 'AC'].map(type => (
                        <button
                          key={type}
                          onClick={() => setBusData({...busData, type: type as any})}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                            busData.type === type ? 'bg-primary text-white shadow-lg' : 'text-slate-400'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'TRIP' && (
              <motion.div 
                key="trip" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.start_time')}</label>
                    <input 
                      type="time"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                      value={tripData.start_time}
                      onChange={e => setTripData({...tripData, start_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.operations_base')}</label>
                    <div className="px-5 py-4 bg-slate-100 text-slate-500 font-bold border border-slate-200">
                      {t('ops.auto_synced')} {t('dist.' + routeData.district)}, {t('ops.zone.' + routeData.zone)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.allocated_driver')}</label>
                    <input 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                      placeholder={t('ops.operator_name_placeholder')}
                      value={tripData.driver_name}
                      onChange={e => setTripData({...tripData, driver_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ops.allocated_conductor')}</label>
                    <input 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900" 
                      placeholder={t('ops.staff_name_placeholder')}
                      value={tripData.conductor_name}
                      onChange={e => setTripData({...tripData, conductor_name: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'FINISH' && (
              <motion.div 
                key="finish" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-center py-12 space-y-8"
              >
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{t('ops.setup_complete')}</h2>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto mt-4">{t('ops.setup_complete_desc')}</p>
                </div>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <button 
                    onClick={() => {
                        window.location.reload(); // Quick reset
                    }}
                    className="px-8 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-light transition-all"
                  >
                    {t('ops.setup_new_pipeline')}
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-4 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                  >
                    {t('ops.return_dashboard')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        {currentStep !== 'FINISH' && (
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button 
              onClick={() => {
                if (currentStep === 'BUS') setCurrentStep('ROUTE');
                if (currentStep === 'TRIP') setCurrentStep('BUS');
              }}
              disabled={currentStep === 'ROUTE'}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
              {t('ops.previous_phase')}
            </button>
            <div className="flex gap-4">
               <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
              >
                {t('ops.cancel_setup')}
              </button>
              <button 
                onClick={() => {
                  if (currentStep === 'ROUTE') {
                    if (!routeData.name || !routeData.code || routeData.stops.length === 0) {
                      toast.error(t('ops.err_route'));
                      return;
                    }
                    setBusData({...busData, district: routeData.district, zone: routeData.zone});
                    setCurrentStep('BUS');
                  } else if (currentStep === 'BUS') {
                    if (!busData.reg_no || !busData.etm_id) {
                      toast.error(t('ops.err_bus'));
                      return;
                    }
                    setCurrentStep('TRIP');
                  } else if (currentStep === 'TRIP') {
                    if (!tripData.driver_name || !tripData.conductor_name) {
                      toast.error(t('ops.err_staff'));
                      return;
                    }
                    handleFinalSubmit();
                  }
                }}
                disabled={isSubmitting}
                className="px-10 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {currentStep === 'TRIP' ? t('ops.complete_pipeline') : t('ops.proceed_next_phase')}
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Helper Info */}
      <div className="mt-8 grid grid-cols-3 gap-6 opacity-60">
        {[
          { label: t('ops.relational_integrity'), desc: t('ops.relational_integrity_desc'), status: t('ops.enforced') },
          { label: t('ops.data_validation'), desc: t('ops.data_validation_desc'), status: t('ops.healthy') },
          { label: t('ops.etm_sync'), desc: t('ops.etm_sync_desc'), status: t('ops.ready') }
        ].map(h => (
          <div key={h.label} className="p-4 bg-white/50 border border-slate-100 border-dashed text-center">
            <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-1">{h.label}</p>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-2">{h.desc}</p>
            <span className="text-[8px] px-2 py-0.5 bg-slate-900 text-white font-black uppercase tracking-widest">{h.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
