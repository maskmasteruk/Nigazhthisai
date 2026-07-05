import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Bus, 
  MapPin, 
  Navigation, 
  Ticket, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  UserCircle,
  TrendingUp,
  Activity,
  ShieldAlert,
  ShoppingBag,
  Globe,
  ChevronDown
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../lib/i18n';
import { isFeatureEnabled } from '../../lib/featureFlags';
import { supabase } from '../../lib/supabase';
import { eraseCookie } from '../../utils/cookies';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'operations', label: 'Operations', icon: Activity, subItems: [
    { id: 'routes', label: 'Routes & Stops', icon: MapPin, path: '/operations/routes' },
    { id: 'buses', label: 'Buses & ETM', icon: Bus, path: '/operations/buses' },
    { id: 'trips', label: 'Trips & Schedules', icon: Navigation, path: '/operations/trips' },
  ]},
  { id: 'live', label: 'Live Monitoring', icon: TrendingUp, path: '/live' },
  { id: 'revenue', label: 'Tickets & Revenue', icon: Ticket, path: '/revenue' },
  { id: 'users', label: 'Users & Roles', icon: Users, path: '/users' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { id: 'support', label: 'Support', icon: HelpCircle, path: '/support' },
];

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, language, setLanguage } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [, setTick] = useState(0); // For re-renders
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('user_role') || 'ADMIN';

  React.useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('feature_flags_updated', handleUpdate);
    return () => window.removeEventListener('feature_flags_updated', handleUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out from Supabase:', e);
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_role');
    eraseCookie('sb-access-token');
    eraseCookie('sb-refresh-token');
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'DASHBOARD' },
    { id: 'live', label: t('nav.live'), icon: TrendingUp, path: '/live', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'LIVE_MONITORING' },
    { id: 'operational-setup', label: t('nav.operational_setup'), icon: Activity, path: '/operations/setup/route', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'OPERATIONS' },
    { id: 'operational-alerts', label: t('nav.alerts'), icon: ShieldAlert, path: '/operations/alerts', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'ALERTS' },
    { id: 'routes', label: t('nav.routes'), icon: MapPin, path: '/operations/routes', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'ROUTES' },
    { id: 'stops', label: t('nav.stops'), icon: Navigation, path: '/operations/stops', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'ROUTES' },
    { id: 'buses', label: t('nav.buses'), icon: Bus, path: '/operations/buses', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'BUSES' },
    { id: 'trips', label: t('nav.trips'), icon: Navigation, path: '/operations/trips', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'TRIPS' },
    { id: 'revenue', label: t('nav.revenue'), icon: Ticket, path: '/revenue', roles: ['MASTER_ADMIN'], feature: 'REVENUE' },
    { id: 'users', label: t('nav.users'), icon: Users, path: '/users', roles: ['MASTER_ADMIN'] },
    { id: 'settings', label: t('nav.settings'), icon: Settings, path: '/settings', roles: ['ADMIN'] },
    { id: 'support', label: t('nav.support'), icon: HelpCircle, path: '/support', roles: ['MASTER_ADMIN', 'ADMIN'], feature: 'SUPPORT' },
  ].filter(item => {
    const hasRole = item.roles.includes(userRole);
    const isEnabled = !item.feature || isFeatureEnabled(item.feature as any);
    return hasRole && isEnabled;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-slate-900 text-white flex flex-col fixed h-full z-50 transition-all duration-300"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-white/10 overflow-hidden">
          <div className="w-8 h-8 bg-primary flex items-center justify-center shrink-0">
            <Bus size={20} className="text-white" />
          </div>
          {isSidebarOpen && (
            <span className="ml-3 font-black uppercase tracking-tighter text-lg whitespace-nowrap">
              {t('app.name')} <span className="text-primary">{userRole === 'MASTER_ADMIN' ? 'Master' : 'Admin'}</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 no-scrollbar">
          {navItems.map((item) => (
            <div key={item.id} className="px-3 mb-2">
              <Link
                to={item.path!}
                className={`flex items-center gap-3 px-3 py-2.5 transition-all group ${
                  location.pathname === item.path 
                    ? 'bg-primary text-white' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} className={location.pathname === item.path ? 'text-white' : 'group-hover:text-white'} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-400 hover:bg-rose-500/10 transition-all group"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="text-sm font-medium">{t('nav.logout')}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}>
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 transition-all text-slate-500"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            {location.pathname !== '/dashboard' && (
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-all pr-4 border-r border-slate-100"
              >
                <LayoutDashboard size={14} />
                {t('ui.back')}
              </button>
            )}
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
              {MENU_ITEMS.find(i => i.path === location.pathname || i.subItems?.some(s => s.path === location.pathname))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-50 text-slate-700 font-extrabold text-xs rounded-md hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
              >
                <Globe size={13} className="text-slate-500" />
                <span>{{ EN: 'EN', TA: 'TA', TE: 'TE', KN: 'KN', ML: 'ML' }[language] || language}</span>
                <ChevronDown size={12} className={`text-slate-450 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 bg-white border border-slate-200 shadow-xl z-50 w-32 overflow-hidden rounded-md"
                    >
                      {[
                        { id: 'EN', name: 'English' },
                        { id: 'TA', name: 'தமிழ்' },
                        { id: 'TE', name: 'తెలుగు' },
                        { id: 'KN', name: 'ಕನ್ನಡ' },
                        { id: 'ML', name: 'മലയാളം' }
                      ].map((lang) => (
                        <button 
                          key={lang.id}
                          onClick={() => {
                            setLanguage(lang.id as any);
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left py-2 px-3 text-xs font-bold ${language === lang.id ? 'bg-[#0D2A5D] text-white' : 'text-slate-700 hover:bg-slate-50'} transition-colors`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button className="relative p-2 hover:bg-slate-100 transition-all text-slate-500">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-base font-bold text-slate-900">{userRole === 'MASTER_ADMIN' ? 'Master Admin' : 'Admin User'}</p>
                <p className="text-sm text-slate-400 uppercase tracking-widest">{userRole.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <UserCircle size={24} />
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
