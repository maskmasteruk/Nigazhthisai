import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Lock, Mail, ArrowRight, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminApi, conductorApi } from '../lib/api';
import { toast } from 'sonner';
import { supabase, isPlaceholder } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [role, setRole] = useState<'MASTER_ADMIN' | 'ADMIN' | 'CONDUCTOR' | 'PASSENGER'>('MASTER_ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Mode states for registration and recovery
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'>('LOGIN');
  const [name, setName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('type') === 'recovery' || window.location.hash.includes('type=recovery')) {
      setMode('RESET_PASSWORD');
    }
  }, []);

  const handleRoleChange = (r: any) => {
    setRole(r);
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
        if (response.user.role !== role) {
          try {
            await supabase.auth.signOut();
          } catch (signOutErr) {
            console.error('Failed to sign out after role mismatch:', signOutErr);
          }
          localStorage.removeItem('admin_token');
          localStorage.removeItem('user_role');
          throw new Error(`Unauthorized: Your account does not have the specified role '${role.replace('_', ' ')}'`);
        }
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
        if (response.user.role !== 'CONDUCTOR') {
          try {
            await supabase.auth.signOut();
          } catch (signOutErr) {
            console.error('Failed to sign out after role mismatch:', signOutErr);
          }
          localStorage.removeItem('admin_token');
          localStorage.removeItem('user_role');
          throw new Error(`Unauthorized: Your account does not have the specified role 'CONDUCTOR'`);
        }
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await adminApi.registerPassenger({
        name,
        email,
        password,
        phone: registerPhone
      });
      toast.success(response.message || 'Registration successful!');
      setMode('LOGIN');
      setRole('PASSENGER');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isPlaceholder) {
        toast.success('Demo: Password reset link sent to your email.');
        setTimeout(() => {
          setMode('RESET_PASSWORD');
        }, 1500);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?type=recovery`
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isPlaceholder) {
        toast.success('Demo: Password updated successfully!');
        setMode('LOGIN');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully! You can now log in.');
      setMode('LOGIN');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
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
            Nigazhthisai <span className="text-primary">
              {mode === 'LOGIN' 
                ? role.replace('_', ' ') 
                : mode === 'REGISTER' 
                ? 'Register' 
                : mode === 'FORGOT_PASSWORD'
                ? 'Recovery'
                : 'Reset Password'
              }
            </span>
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-[0.3em] font-bold mt-2">
            {mode === 'LOGIN' 
              ? 'Management Portal' 
              : mode === 'REGISTER' 
              ? 'Passenger Sign Up' 
              : mode === 'FORGOT_PASSWORD'
              ? 'Password Recovery'
              : 'Secure Password Update'
            }
          </p>
        </div>

        {/* Role Selection */}
        {mode === 'LOGIN' && (
          <div className="grid grid-cols-2 gap-2 mb-8">
            {(['MASTER_ADMIN', 'ADMIN', 'CONDUCTOR', 'PASSENGER'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`py-3 text-[10px] font-black uppercase tracking-widest transition-all border ${role === r
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-primary/50'
                  }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        {mode === 'LOGIN' && (
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
        )}

        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-slate-900"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
                  placeholder="passenger@nigazhthisai.com"
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

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-slate-900"
                  placeholder="Enter phone number"
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
                  Register
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {mode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleForgotPassword} className="space-y-6">
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
                  placeholder="passenger@nigazhthisai.com"
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
                  Send Reset Link
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {mode === 'RESET_PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  Update Password
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-slate-100 text-center space-y-4">
          {mode === 'LOGIN' && (
            <>
              {role === 'PASSENGER' && (
                <button
                  type="button"
                  onClick={() => setMode('REGISTER')}
                  className="text-xs font-black text-primary uppercase tracking-widest hover:underline block mx-auto cursor-pointer"
                >
                  Don't have an account? Register as Passenger
                </button>
              )}
              {role === 'PASSENGER' && (
                <button
                  type="button"
                  onClick={() => setMode('FORGOT_PASSWORD')}
                  className="text-[10px] text-slate-400 uppercase tracking-widest font-bold hover:underline block mx-auto cursor-pointer"
                >
                  Forgot password? Reset via Email
                </button>
              )}
              {role !== 'PASSENGER' && (
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Forgot password? Contact system administrator
                </p>
              )}
            </>
          )}

          {mode === 'REGISTER' && (
            <button
              type="button"
              onClick={() => setMode('LOGIN')}
              className="text-xs font-black text-primary uppercase tracking-widest hover:underline block mx-auto cursor-pointer"
            >
              Already have an account? Sign In
            </button>
          )}

          {(mode === 'FORGOT_PASSWORD' || mode === 'RESET_PASSWORD') && (
            <button
              type="button"
              onClick={() => setMode('LOGIN')}
              className="text-xs font-black text-primary uppercase tracking-widest hover:underline block mx-auto cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
