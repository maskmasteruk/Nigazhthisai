import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MainLayout } from './components/layout/MainLayout';

// Lazy loaded page components
const LoginPage = React.lazy(() => import('./pages/Login').then(m => ({ default: m.LoginPage })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const RoutesList = React.lazy(() => import('./pages/operations/RoutesList').then(m => ({ default: m.RoutesList })));
const StopsList = React.lazy(() => import('./pages/operations/StopsList').then(m => ({ default: m.StopsList })));
const BusesList = React.lazy(() => import('./pages/operations/BusesList').then(m => ({ default: m.BusesList })));
const TripsList = React.lazy(() => import('./pages/operations/TripsList').then(m => ({ default: m.TripsList })));
const OperationalAlerts = React.lazy(() => import('./pages/operations/OperationalAlerts').then(m => ({ default: m.OperationalAlerts })));
const OperationalRouteCreate = React.lazy(() => import('./pages/operations/OperationalRouteCreate').then(m => ({ default: m.OperationalRouteCreate })));
const OperationalStopsManage = React.lazy(() => import('./pages/operations/OperationalStopsManage').then(m => ({ default: m.OperationalStopsManage })));
const OperationalTripSchedule = React.lazy(() => import('./pages/operations/OperationalTripSchedule').then(m => ({ default: m.OperationalTripSchedule })));
const OperationalDone = React.lazy(() => import('./pages/operations/OperationalDone').then(m => ({ default: m.OperationalDone })));
const LiveMonitoring = React.lazy(() => import('./pages/LiveMonitoring').then(m => ({ default: m.LiveMonitoring })));
const Revenue = React.lazy(() => import('./pages/Revenue').then(m => ({ default: m.Revenue })));
const Users = React.lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const ConductorPage = React.lazy(() => import('./pages/Conductor').then(m => ({ default: m.ConductorPage })));
const PassengerPage = React.lazy(() => import('./pages/Passenger').then(m => ({ default: m.PassengerPage })));
const DriverPage = React.lazy(() => import('./pages/Driver').then(m => ({ default: m.DriverPage })));
const Settings = React.lazy(() => import('./pages/Stubs').then(m => ({ default: m.Settings })));
const Support = React.lazy(() => import('./pages/Stubs').then(m => ({ default: m.Support })));

import { LanguageProvider } from './lib/i18n';
import { isFeatureEnabled } from './lib/featureFlags';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import { getCookie, setCookie, eraseCookie } from './utils/cookies';

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  useLayout?: boolean;
  feature?: any;
  allowedRoles?: string[];
}> = ({ children, useLayout = true, feature, allowedRoles }) => {
  const token = localStorage.getItem('admin_token');
  const role = localStorage.getItem('user_role') || 'ADMIN';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (feature && !isFeatureEnabled(feature)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return useLayout ? <MainLayout>{children}</MainLayout> : <>{children}</>;
};

const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-[#D97F00] mx-auto" size={48} />
        <p className="text-white text-xs uppercase tracking-[0.3em] font-extrabold">Loading...</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const getSessionRole = async (session: any) => {
      return session.user.user_metadata?.role || 'PASSENGER';
    };

    const initAuth = async () => {
      try {
        const accessToken = getCookie('sb-access-token');
        const refreshToken = getCookie('sb-refresh-token');
        if (accessToken && refreshToken) {
          // Reauthenticate the session from the secure cookies
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('admin_token', session.access_token);
          const role = await getSessionRole(session);
          localStorage.setItem('user_role', role);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('admin_token', session.access_token);
        
        // Save access & refresh tokens in secure cookies
        setCookie('sb-access-token', session.access_token, session.expires_in || 3600);
        if (session.refresh_token) {
          setCookie('sb-refresh-token', session.refresh_token, 604800); // 7 days
        }
        
        const role = await getSessionRole(session);
        localStorage.setItem('user_role', role);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('user_role');
        
        // Remove cookies on logout
        eraseCookie('sb-access-token');
        eraseCookie('sb-refresh-token');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-[#D97F00] mx-auto" size={48} />
          <p className="text-white text-xs uppercase tracking-[0.3em] font-extrabold">Initializing Session...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" richColors />
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute feature="DASHBOARD">
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/operations/routes" element={
            <ProtectedRoute feature="ROUTES">
              <RoutesList />
            </ProtectedRoute>
          } />

          <Route path="/operations/stops" element={
            <ProtectedRoute feature="ROUTES">
              <StopsList />
            </ProtectedRoute>
          } />

          <Route path="/operations/buses" element={
            <ProtectedRoute feature="BUSES">
              <BusesList />
            </ProtectedRoute>
          } />

          <Route path="/operations/trips" element={
            <ProtectedRoute feature="TRIPS">
              <TripsList />
            </ProtectedRoute>
          } />

          <Route path="/operations/alerts" element={
            <ProtectedRoute feature="ALERTS">
              <OperationalAlerts />
            </ProtectedRoute>
          } />

          <Route path="/operations/setup" element={<Navigate to="/operations/setup/route" replace />} />

          <Route path="/operations/setup/route" element={
            <ProtectedRoute>
              <OperationalRouteCreate />
            </ProtectedRoute>
          } />

          <Route path="/operations/setup/stops" element={
            <ProtectedRoute>
              <OperationalStopsManage />
            </ProtectedRoute>
          } />

          <Route path="/operations/setup/schedule" element={
            <ProtectedRoute>
              <OperationalTripSchedule />
            </ProtectedRoute>
          } />

          <Route path="/operations/setup/done" element={
            <ProtectedRoute>
              <OperationalDone />
            </ProtectedRoute>
          } />

          <Route path="/live" element={
            <ProtectedRoute feature="LIVE_MONITORING">
              <LiveMonitoring />
            </ProtectedRoute>
          } />

          <Route path="/revenue" element={
            <ProtectedRoute feature="REVENUE">
              <Revenue />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['MASTER_ADMIN', 'ADMIN']}>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/support" element={
            <ProtectedRoute feature="SUPPORT">
              <Support />
            </ProtectedRoute>
          } />

          <Route path="/conductor" element={
            <ProtectedRoute useLayout={false}>
              <ConductorPage />
            </ProtectedRoute>
          } />
          
          <Route path="/passenger" element={
            <ProtectedRoute useLayout={false}>
              <PassengerPage />
            </ProtectedRoute>
          } />

          <Route path="/sos" element={
            <ProtectedRoute useLayout={false}>
              <PassengerPage initialView="SOS_HISTORY" />
            </ProtectedRoute>
          } />

          <Route path="/driver" element={
            <ProtectedRoute useLayout={false}>
              <DriverPage />
            </ProtectedRoute>
          } />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </LanguageProvider>
  );
};

export default App;
