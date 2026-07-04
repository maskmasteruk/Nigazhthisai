import React from 'react';
import { Bus, MapPin, Navigation, Clock, Activity, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ConductorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('conductor_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bus size={24} />
            <h1 className="text-xl font-black uppercase tracking-tighter">Conductor Portal</h1>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Active Trip Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 border border-slate-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Trip</p>
              <h2 className="text-2xl font-black text-slate-900">Tiruppur - Avinashi</h2>
            </div>
            <span className="bg-accent/10 text-accent text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
              Running
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Bus No</p>
              <p className="text-sm font-black text-slate-900">TN 39 AB 1234</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ETM ID</p>
              <p className="text-sm font-black text-slate-900">ETM-452</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tickets Issued</p>
              <p className="text-sm font-black text-slate-900">42</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Revenue</p>
              <p className="text-sm font-black text-accent">₹1,240</p>
            </div>
          </div>
        </motion.div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button className="bg-white p-6 border border-slate-200 hover:border-primary transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <Navigation size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900">Issue Ticket</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scan QR or Manual Entry</p>
            </div>
          </button>

          <button className="bg-white p-6 border border-slate-200 hover:border-primary transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <MapPin size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900">Update Stop</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Next: Avinashi Bypass</p>
            </div>
          </button>

          <button className="bg-white p-6 border border-slate-200 hover:border-primary transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <Activity size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900">Trip Summary</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">View all transactions</p>
            </div>
          </button>

          <button className="bg-white p-6 border border-slate-200 hover:border-rose-500 transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all">
              <Clock size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900">End Trip</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Complete current schedule</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};
