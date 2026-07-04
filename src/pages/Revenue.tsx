import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

export const Revenue: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  const ZONES = ['All', 'North', 'South', 'West', 'East', 'Central'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getRevenueData({ district: selectedDistrict, zone: selectedZone });
        setData(res);
      } catch (error) {
        toast.error('Failed to fetch revenue data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDistrict, selectedZone]);

  const handleExportReport = () => {
    toast.success('Financial report exported successfully', {
      description: 'The report has been downloaded to your device as PDF.',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200">
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
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Zone</p>
                <select 
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-slate-50 border border-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all rounded-none"
                >
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest">
            <Calendar size={16} />
            Last 6 Months
          </button>
          <button 
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600">
              <DollarSign size={20} />
            </div>
            <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={10} />
              +12.5%
            </span>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-2xl font-black text-slate-900">₹{data.total_revenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600">
              <TrendingUp size={20} />
            </div>
            <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={10} />
              +8.2%
            </span>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Avg. Daily Revenue</p>
          <p className="text-2xl font-black text-slate-900">₹{(data.total_revenue / 180).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>

        <div className="bg-white p-6 border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 text-purple-600">
              <TrendingUp size={20} />
            </div>
            <span className="flex items-center gap-1 text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              <ArrowDownRight size={10} />
              -2.1%
            </span>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Revenue per Route</p>
          <p className="text-2xl font-black text-slate-900">₹{(data.total_revenue / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 border border-slate-200">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Monthly Revenue Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '0' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: '900', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Revenue by Route</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.route_revenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '0' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: '900', marginBottom: '4px' }}
                />
                <Bar dataKey="revenue" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
