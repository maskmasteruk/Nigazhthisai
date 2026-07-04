import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminApi, conductorApi } from '../lib/api';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [role, setRole] = useState<'MASTER_ADMIN' | 'ADMIN' | 'CONDUCTOR' | 'PASSENGER'>('MASTER_ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (r: any) => {
    setRole(r);
    setEmail('');
    setPassword('');
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setIsLoading(true);
    try {
      await conductorApi.sendOTP(phone);
      setShowOtp(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (role === 'MASTER_ADMIN' || role === 'ADMIN' || role === 'PASSENGER') {
        const response = await adminApi.login({ email, password });
        localStorage.setItem('admin_token', response.token || '');
        localStorage.setItem('user_role', response.user.role);
        toast.success(`Welcome ${response.user.name}`);
        
        if (response.user.role === 'PASSENGER') {
          navigate('/passenger');
        } else {
          navigate('/dashboard');
        }
      } else if (role === 'CONDUCTOR') {
        const response = await conductorApi.verifyOTP(phone, otp);
        localStorage.setItem('admin_token', response.token || '');
        localStorage.setItem('user_role', response.user.role);
        toast.success('Login successful');
        navigate('/conductor');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white p-12 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 bg-primary flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <Bus size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
            Nigazhthisai <span className="text-primary">{role.replace('_', ' ')}</span>
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-[0.3em] font-bold mt-2">Management Portal</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {(['MASTER_ADMIN', 'ADMIN', 'CONDUCTOR', 'PASSENGER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleChange(r)}
              className={`py-3 text-[10px] font-black uppercase tracking-widest transition-all border ${
                role === r 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-white border-slate-200 text-slate-400 hover:border-primary/50'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {role === 'CONDUCTOR' ? (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-slate-900"
                    placeholder="Enter phone number"
                    disabled={showOtp}
                    required
                  />
                </div>
              </div>

              {showOtp ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enter OTP</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowOtp(false);
                        setOtp('');
                      }}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-slate-900"
                      placeholder="Enter 6-digit OTP"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">
                    Use <span className="text-primary">123456</span> for demo
                  </p>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full py-5 bg-primary hover:bg-primary-light text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send OTP'}
                </button>
              )}

              {showOtp && (
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-primary hover:bg-primary-light text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Verify & Login'}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-slate-900"
                    placeholder="admin@nigazhthisai.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-slate-900"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-primary hover:bg-primary-light text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </>
          )}
        </form>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Forgot password? Contact system administrator
          </p>
        </div>
      </motion.div>
    </div>
  );
};
