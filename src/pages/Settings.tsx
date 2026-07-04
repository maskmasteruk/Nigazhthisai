import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Bell, 
  Shield, 
  Database, 
  Monitor, 
  Save,
  User,
  Lock,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslation, Language } from '../lib/i18n';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { getFeatureFlags, setFeatureFlags } from '../lib/featureFlags';

export const Settings: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const userRole = localStorage.getItem('user_role');
  const isMaster = userRole === 'MASTER_ADMIN';

  const [notifications, setNotifications] = useState({
    alerts: true,
    revenue: false,
    system: true
  });

  const [featureFlags, setFlags] = useState(getFeatureFlags());

  const handleToggleFeature = (id: string) => {
    const updated = featureFlags.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    setFlags(updated);
    setFeatureFlags(updated);
    toast.success('Access permissions updated');
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const toastMsg = {
      EN: 'Language changed successfully',
      TA: 'மொழி மாற்றப்பட்டது',
      ML: 'ഭാഷ വിജയകരമായി മാറ്റി',
      KN: 'ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ',
      TE: 'భాష విజయవంతంగా మార్చబడింది',
      HI: 'भाषा सफलतापूर्वक बदल दी गई'
    }[newLang] || 'Language changed successfully';
    toast.success(toastMsg);
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Settings Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-slate-900 text-white">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">System Settings</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage your dashboard preferences and system configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation / Sidebar */}
        <div className="space-y-1">
          <button className="w-full text-left px-4 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest flex items-center justify-between">
            General
            <ChevronRight size={14} />
          </button>
          <button className="w-full text-left px-4 py-3 hover:bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest flex items-center justify-between transition-all">
            Notifications
            <ChevronRight size={14} />
          </button>
          {isMaster && (
            <>
              <button className="w-full text-left px-4 py-3 hover:bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest flex items-center justify-between transition-all font-bold">
                Location Management
                <ChevronRight size={14} />
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest flex items-center justify-between transition-all">
                Security & Privacy
                <ChevronRight size={14} />
              </button>
            </>
          )}
          <button className="w-full text-left px-4 py-3 hover:bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest flex items-center justify-between transition-all">
            Audit logs
            <ChevronRight size={14} />
          </button>
        </div>

        {/* content area */}
        <div className="md:col-span-2 space-y-8">
          {/* Alert Configuration Section */}
          <section className="bg-white p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Bell size={18} className="text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Alert Configuration</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Idle Time Threshold (Minutes)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="5" max="60" defaultValue="20" className="flex-1 accent-primary" />
                  <span className="text-sm font-black text-slate-900 w-12 text-right">20m</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geofence Radius (Meters)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="10" max="200" defaultValue="50" className="flex-1 accent-primary" />
                  <span className="text-sm font-black text-slate-900 w-12 text-right">50m</span>
                </div>
              </div>
            </div>
          </section>

          {/* Language Section */}
          <section className="bg-white p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Globe size={18} className="text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Language & Localization</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'EN', name: 'ENGLISH', native: 'English', desc: 'System Default' },
                { id: 'TA', name: 'தமிழ்', native: 'Tamil', desc: 'Tamil Content' },
                { id: 'ML', name: 'മലയാളം', native: 'Malayalam', desc: 'Malayalam Content' },
                { id: 'KN', name: 'ಕನ್ನಡ', native: 'Kannada', desc: 'Kannada Content' },
                { id: 'TE', name: 'తెలుగు', native: 'Telugu', desc: 'Telugu Content' },
                { id: 'HI', name: 'हिन्दी', native: 'Hindi', desc: 'Hindi Content' }
              ].map((lang) => (
                <button 
                  key={lang.id}
                  onClick={() => handleLanguageChange(lang.id as Language)}
                  className={`p-4 border-2 transition-all text-center rounded-none flex flex-col justify-center items-center ${language === lang.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <p className="text-base font-black mb-0.5">{lang.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{lang.native}</p>
                  <p className="text-[8px] tracking-tight opacity-60 mt-1">{lang.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Access Control Section (Master only) */}
          {isMaster && (
            <section className="bg-white p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <Shield size={18} className="text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Normal Admin Access Control</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                Enable or disable specific features for Standard Administrators. Master Admins always retain full access.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featureFlags.map((flag) => (
                  <button
                    key={flag.id}
                    onClick={() => handleToggleFeature(flag.id)}
                    className={`flex items-center justify-between p-3 border transition-all ${
                      flag.enabled 
                        ? 'border-emerald-100 bg-emerald-50/30 text-emerald-700' 
                        : 'border-slate-100 bg-slate-50/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {flag.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{flag.label}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${flag.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <motion.div 
                        animate={{ x: flag.enabled ? 16 : 4 }}
                        className="absolute top-1 w-2 h-2 bg-white rounded-full" 
                      />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* User Profile Summary */}
          <section className="bg-white p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <User size={18} className="text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Profile Information</h3>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100">
              <div className="w-16 h-16 bg-slate-200 flex items-center justify-center text-slate-400">
                <User size={32} />
              </div>
              <div>
                <p className="text-base font-black text-slate-900">{isMaster ? 'Master Administrator' : 'Standard Admin'}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{userRole}</p>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                  <Lock size={10} />
                  Change Password
                </button>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-white p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Monitor size={18} className="text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Preferences</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-900">Dark Mode</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adjust dashboard appearance</p>
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded-full cursor-not-allowed opacity-50" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">Real-time Updates</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auto-refresh live monitoring data</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                   <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {/* Master Only Security */}
          {isMaster && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 border border-slate-200 border-l-4 border-l-rose-500"
            >
              <div className="flex items-center gap-2 mb-6">
                <Shield size={18} className="text-rose-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Master Controls</h3>
              </div>
              <div className="space-y-4">
                <button className="w-full p-4 border border-slate-100 flex items-center justify-between text-left hover:bg-slate-50 transition-all">
                  <div>
                    <p className="text-sm font-bold text-slate-900">API Access Tokens</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage external service integrations</p>
                  </div>
                  <Database size={16} className="text-slate-300" />
                </button>
              </div>
            </motion.section>
          )}

          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleSave}
              className="px-8 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <Save size={16} />
              Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
