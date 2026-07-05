import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RoutesList } from './pages/operations/RoutesList';
import { StopsList } from './pages/operations/StopsList';
import { BusesList } from './pages/operations/BusesList';
import { TripsList } from './pages/operations/TripsList';
import { OperationalAlerts } from './pages/operations/OperationalAlerts';
import { OperationalRouteCreate } from './pages/operations/OperationalRouteCreate';
import { OperationalStopsManage } from './pages/operations/OperationalStopsManage';
import { OperationalTripSchedule } from './pages/operations/OperationalTripSchedule';
import { OperationalDone } from './pages/operations/OperationalDone';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { Revenue } from './pages/Revenue';
import { Users } from './pages/Users';
import { ConductorPage } from './pages/Conductor';
import { PassengerPage } from './pages/Passenger';
import { DriverPage } from './pages/Driver';
import { 
  Settings, 
  Support 
} from './pages/Stubs';

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

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
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
          const role = session.user.user_metadata?.role || 'PASSENGER';
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
        
        const role = session.user.user_metadata?.role || 'PASSENGER';
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
      <Router>
        <Toaster position="top-right" richColors />
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
            <ProtectedRoute allowedRoles={['ADMIN']}>
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
      </Router>
    </LanguageProvider>
  );
};

export default App;
