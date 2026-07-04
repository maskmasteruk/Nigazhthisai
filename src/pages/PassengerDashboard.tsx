import React from 'react';
import { Bus, MapPin, Search, Ticket, User, LogOut, Navigation, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const PassengerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('passenger_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center text-white">
              <Bus size={18} />
            </div>
            <h1 className="text-lg font-black uppercase tracking-tighter text-slate-900">Nigazhthisai</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-slate-600 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24 space-y-6">
        {/* Search Section */}
        <div className="bg-primary p-6 shadow-xl shadow-primary/20">
          <h2 className="text-white text-xl font-black uppercase tracking-tighter mb-4">Where are you going?</h2>
          <div className="space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="From: Current Location" 
                className="w-full pl-10 pr-4 py-3 bg-white border-none focus:ring-2 focus:ring-accent outline-none text-sm font-bold"
              />
            </div>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="To: Destination" 
                className="w-full pl-10 pr-4 py-3 bg-white border-none focus:ring-2 focus:ring-accent outline-none text-sm font-bold"
              />
            </div>
            <button className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
              Search Buses
            </button>
          </div>
        </div>

        {/* Recent/Favorite Routes */}
        <div className="space-y-4">
          <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Recent Routes</h3>
          <div className="space-y-3">
            {[
              { from: 'Tiruppur', to: 'Avinashi', time: '15 mins', price: '₹25' },
              { from: 'Coimbatore', to: 'Gandhipuram', time: '45 mins', price: '₹45' }
            ].map((route, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-4 border border-slate-200 flex justify-between items-center group cursor-pointer hover:border-primary transition-all"
              >
                <div>
                  <p className="text-sm font-black text-slate-900">{route.from} → {route.to}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{route.time} • {route.price}</p>
                </div>
                <Star size={16} className="text-slate-200 group-hover:text-amber-400 transition-all" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Active Tickets */}
        <div className="space-y-4">
          <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest">My Active Tickets</h3>
          <div className="bg-white border-2 border-dashed border-slate-200 p-6 text-center">
            <Ticket size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No active tickets found</p>
            <button className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
              Book a new ticket
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Search size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Search</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-all">
            <Ticket size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Tickets</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-all">
            <User size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
