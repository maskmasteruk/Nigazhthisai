import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Ticket, 
  Navigation, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle,
  Clock,
  MapPin,
  ShieldAlert,
  Activity,
  Lock,
  Unlock,
  ShieldCheck,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { adminApi } from '../lib/api';
import { DashboardStats } from '../types/admin';
import { useTranslation } from '../lib/i18n';
import { getFeatureFlags, setFeatureFlags } from '../lib/featureFlags';

const COLORS = ['#0D2A5D', '#D97F00', '#10b981', '#ef4444'];

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const [featureFlags, setFlagsState] = useState(getFeatureFlags());
  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const districts = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur'];
  const zones = ['All', 'North', 'South', 'West', 'East', 'Central'];

  const handleToggleFeature = (id: any) => {
    const updated = featureFlags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    setFlagsState(updated);
    setFeatureFlags(updated);
    // In real app, this would be a toast
    console.log(`Feature ${id} toggled`);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const [statsData, tripsData] = await Promise.all([
          adminApi.getDashboardStats({ district: selectedDistrict, zone: selectedZone }),
          adminApi.getTrips()
        ]);
        setStats(statsData);

        // Filter and sort trips for "Recent Trips"
        const filteredTrips = tripsData.filter((t: any) => {
          const matchesDistrict = selectedDistrict === 'All' || t.district === selectedDistrict;
          const matchesZone = selectedZone === 'All' || t.zone === selectedZone;
          return matchesDistrict && matchesZone;
        });

        const sortedTrips = [...filteredTrips].sort((a: any, b: any) => {
          // Put RUNNING first
          if (a.status === 'RUNNING' && b.status !== 'RUNNING') return -1;
          if (a.status !== 'RUNNING' && b.status === 'RUNNING') return 1;
          // Sort by start_time descending (fallback to created_at or id)
          const timeA = a.start_time || a.created_at || '';
          const timeB = b.start_time || b.created_at || '';
          return timeB.localeCompare(timeA);
        });

        setRecentTrips(sortedTrips.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [selectedDistrict, selectedZone]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Filters</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refine dashboard data by location</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {isMaster && (
            <>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">District</p>
                <select 
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-slate-50 border border-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all rounded-none"
                >
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Zone</p>
                <select 
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-slate-50 border border-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all rounded-none"
                >
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isMaster && (
          <StatCard 
            title={t('dash.today_revenue')} 
            value={`₹${stats.today_revenue.total.toLocaleString()}`} 
            icon={TrendingUp} 
            trend="+12.5%" 
            trendUp={true} 
            onClick={() => navigate('/revenue')}
          />
        )}
        <StatCard 
          title={t('dash.total_tickets')} 
          value={stats.today_tickets.total.toString()} 
          icon={Ticket} 
          trend="+8.2%" 
          trendUp={true} 
          onClick={() => navigate('/revenue')}
        />
        <StatCard 
          title={t('dash.active_trips')} 
          value={stats.today_trips.active.toString()} 
          icon={Navigation} 
          trend="-2.4%" 
          trendUp={false} 
          onClick={() => navigate('/live')}
        />
        <StatCard 
          title={t('dash.total_passengers')} 
          value={stats.total_passengers.toLocaleString()} 
          icon={Users} 
          trend="+15.3%" 
          trendUp={true} 
          onClick={() => navigate('/operations/trips')}
        />
        {!isMaster && (
           <StatCard 
            title="Operational Health" 
            value="98.2%" 
            icon={Activity} 
            trend="+0.5%" 
            trendUp={true} 
            onClick={() => navigate('/operations/alerts')}
          />
        )}
      </div>

      {isMaster && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{t('dash.revenue_by_route')}</h3>
              <button 
                onClick={() => navigate('/revenue')}
                className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
              >
                View Report
              </button>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.today_revenue.top_routes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="route_name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', borderRadius: 0 }}
                  />
                  <Bar dataKey="revenue" fill="#0D2A5D" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Breakdown */}
          <div className="bg-white p-8 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{t('dash.booking_channels')}</h3>
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'App', value: stats.today_tickets.app },
                      { name: 'ETM', value: stats.today_tickets.etm }
                    ]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#0D2A5D" />
                    <Cell fill="#D97F00" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-black text-slate-900">{Math.round((stats.today_tickets.app / stats.today_tickets.total) * 100)}%</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">App Share</p>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary" />
                  <span className="text-xs font-bold text-slate-600">Mobile App</span>
                </div>
                <span className="text-xs font-black text-slate-900">{stats.today_tickets.app}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent" />
                  <span className="text-xs font-bold text-slate-600">ETM Device</span>
                </div>
                <span className="text-xs font-black text-slate-900">{stats.today_tickets.etm}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} className="text-rose-500" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{t('dash.system_alerts')}</h3>
            </div>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest">
              {stats.alerts.length} Active
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.alerts.map((alert) => (
              <div key={alert.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-all">
                <div className="w-10 h-10 bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-slate-900">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      <Clock size={12} />
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {alert.type === 'IDLE_BUS' ? (
                      <button 
                        onClick={() => navigate('/operations/alerts')}
                        className="text-xs font-black text-rose-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                         {t('alerts.investigate')}
                         <ArrowUpRight size={12} />
                      </button>
                    ) : (
                      <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Investigate</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{t('dash.recent_trips')}</h3>
            </div>
            <button 
              onClick={() => navigate('/operations/trips')}
              className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTrips.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                No recent trips found
              </div>
            ) : (
              recentTrips.map((trip) => (
                <div key={trip.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400">
                      <Navigation size={20} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">Trip #{trip.id}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                        {trip.route_name || 'N/A'} • {trip.bus_no || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-xs font-black uppercase tracking-widest ${
                      trip.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-600' :
                      trip.status === 'PLANNED' ? 'bg-blue-100 text-blue-600' :
                      trip.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {trip.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-1 font-bold">
                      {trip.status === 'RUNNING' ? `Delay: ${trip.delay_minutes || 0}m` : `Start: ${trip.start_time || 'N/A'}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Master Admin Controls */}
      {isMaster && (
        <div className="bg-white border-2 border-slate-900 overflow-hidden">
          <div className="p-6 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Admin Control Center</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Toggle Feature Accessibility for Normal Admins</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 text-primary text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck size={14} />
              Master Authority Active
            </div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureFlags.map((flag) => (
              <div key={flag.id} className="p-4 border border-slate-100 bg-slate-50 flex items-center justify-between group hover:border-primary transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${flag.enabled ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                    {flag.enabled ? <Unlock size={16} /> : <Lock size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">{flag.label}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {flag.enabled ? 'Access Granted' : 'Access Restricted'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleFeature(flag.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-none transition-colors focus:outline-none ${
                    flag.enabled ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${
                    flag.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: any; trend: string; trendUp: boolean; onClick?: () => void }> = ({ title, value, icon: Icon, trend, trendUp, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-8 border border-slate-200 shadow-sm hover:border-primary/30 transition-all group ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-black uppercase tracking-widest ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
    <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
  </div>
);
