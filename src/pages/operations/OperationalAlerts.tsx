import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Navigation,
  Activity,
  History,
  Check,
  CalendarDays,
  Bus as BusIcon,
  Search,
  Eye
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../lib/i18n';
import { getCurrentDayName } from '../../lib/routeScheduler';

export const OperationalAlerts: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [liveTrips, setLiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const currentDay = getCurrentDayName();

  const userRole = localStorage.getItem('user_role');
  const isMaster = userRole === 'MASTER_ADMIN';

  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  const ZONES = ['All', 'North', 'South', 'West', 'East', 'Central'];

  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [statsData, liveData] = await Promise.all([
        adminApi.getDashboardStats({ district: selectedDistrict, zone: selectedZone }),
        adminApi.getLiveTrips()
      ]);
      setStats(statsData);
      setLiveTrips(liveData);
    } catch (error) {
      toast.error('Failed to update alert data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedDistrict, selectedZone]);

  const handleAcknowledge = async (id: string) => {
    try {
      await adminApi.acknowledgeAlert(id);
      setAcknowledgedAlerts(prev => [...prev, id]);
      toast.success('Alert acknowledged and team notified');
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const idleBuses = liveTrips.filter(t => {
    const isStationary = t.is_idle && t.idle_minutes >= 20;
    const isNotAcked = !acknowledgedAlerts.includes(t.id);
    const matchesDistrict = selectedDistrict === 'All' || t.district === selectedDistrict;
    const matchesZone = selectedZone === 'All' || t.zone === selectedZone;
    return isStationary && matchesDistrict && matchesZone && (activeTab === 'ACTIVE' ? isNotAcked : !isNotAcked);
  });

  return (
    <div className="space-y-8">
      {/* Filters */}
      {isMaster && (
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-6 border border-slate-200">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">District Filter</p>
            <select 
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all rounded-none"
            >
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Zone Filter</p>
            <select 
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-slate-50 border border-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all rounded-none"
            >
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Header section with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('alerts.active_idle')}</p>
              <p className="text-3xl font-black text-slate-900">{idleBuses.length}</p>
            </div>
          </div>
          <div className="h-1 bg-rose-100 overflow-hidden">
            <div className="h-full bg-rose-600 transition-all duration-1000" style={{ width: `${(idleBuses.length / 10) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('alerts.resolved_today')}</p>
              <p className="text-3xl font-black text-slate-900">12</p>
            </div>
          </div>
          <div className="h-1 bg-emerald-100 overflow-hidden">
            <div className="h-full bg-emerald-600" style={{ width: '85%' }} />
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-50 text-slate-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('alerts.avg_response')}</p>
              <p className="text-3xl font-black text-slate-900">8.4m</p>
            </div>
          </div>
          <div className="h-1 bg-slate-100 overflow-hidden">
            <div className="h-full bg-slate-600" style={{ width: '40%' }} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200">
        <div className="border-b border-slate-200 flex">
          <button 
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'ACTIVE' ? 'text-primary' : 'text-slate-400'}`}
          >
            {t('alerts.realtime_detection')}
            {activeTab === 'ACTIVE' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'HISTORY' ? 'text-primary' : 'text-slate-400'}`}
          >
            {t('alerts.history')}
            {activeTab === 'HISTORY' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'ACTIVE' ? (
              <motion.div 
                key="active" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {idleBuses.length > 0 ? (
                  idleBuses.map((bus) => (
                    <div key={bus.id} className="border border-rose-200 bg-rose-50/10 hover:shadow-xl hover:shadow-rose-500/5 transition-all p-6 group">
                      <div className="flex flex-col lg:flex-row gap-8">
                        {/* Map Preview Placeholder */}
                        <div className="w-full lg:w-72 h-44 bg-slate-100 border border-slate-200 relative overflow-hidden shrink-0">
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white animate-pulse shadow-lg ring-4 ring-rose-500/20">
                              <BusIcon size={20} />
                            </div>
                          </div>
                          <div className="absolute bottom-3 left-3 bg-white px-2 py-1 border border-slate-200 text-xs font-black uppercase tracking-widest">
                            {t('alerts.gps')}: {bus.current_lat.toFixed(4)}, {bus.current_lng.toFixed(4)}
                          </div>
                        </div>

                        <div className="flex-1 space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-black text-slate-900">{bus.bus_id}</h3>
                                <span className="px-3 py-1 bg-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                  <AlertCircle size={10} />
                                  {t('alerts.stationary_label')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                  {t('alerts.route')}: {bus.route_name}
                                </p>
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                                  <CalendarDays size={10} />
                                  Applying {currentDay} Specific Sequence
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-rose-600">{bus.idle_minutes}m</p>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('alerts.idle_duration')}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white p-3 border border-slate-100">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('alerts.status')}</p>
                              <div className="flex items-center gap-1 text-rose-500 font-bold text-sm uppercase">
                                <Activity size={12} />
                                {t('alerts.abnormal_stop')}
                              </div>
                            </div>
                            <div className="bg-white p-3 border border-slate-100">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('alerts.last_movement')}</p>
                              <p className="text-sm font-bold text-slate-900">{bus.idle_minutes} {t('alerts.min_ago')}</p>
                            </div>
                            <div className="bg-white p-3 border border-slate-100">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('alerts.distance_to_stop')}</p>
                              <p className="text-sm font-bold text-slate-900">1.2 km (Avinashi)</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 pt-2">
                            <button 
                              onClick={() => navigate(`/live?search=${bus.bus_id}`)}
                              className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                              <Eye size={14} />
                              Track Live
                            </button>
                            {!isMaster && (
                              <button 
                                onClick={() => handleAcknowledge(bus.id)}
                                className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                              >
                                <Check size={14} />
                                {t('alerts.acknowledge')}
                              </button>
                            )}
                            <a 
                              href={`https://www.google.com/maps?q=${bus.current_lat},${bus.current_lng}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-6 py-3 border border-slate-200 text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                              <ExternalLink size={14} />
                              {t('alerts.map_link')}
                            </a>
                            {!isMaster && (
                              <button className="ml-auto text-xs font-black text-rose-500 uppercase tracking-widest hover:underline">
                                {t('alerts.escalate')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white border border-slate-200 flex items-center justify-center text-slate-300 mx-auto mb-6">
                      <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">{t('alerts.no_alerts')}</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('alerts.scanning')}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="history" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <History size={16} />
                    <span className="text-sm font-black uppercase tracking-widest">{t('alerts.last_24h')}</span>
                  </div>
                  <button className="text-sm font-black text-primary uppercase tracking-widest hover:underline">{t('alerts.export')}</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">{t('alerts.bus_trip')}</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">{t('alerts.alert_time')}</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">{t('alerts.duration')}</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">{t('alerts.resolution')}</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">{t('alerts.details')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-all">
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-slate-900">TN 39 AB 100{i}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trip #TRP-10{i}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">Today, 10:24 AM</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">32m</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                               <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{t('alerts.acknowledged_status')}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-slate-400 hover:text-primary">
                              <ExternalLink size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 border border-slate-200">
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);
