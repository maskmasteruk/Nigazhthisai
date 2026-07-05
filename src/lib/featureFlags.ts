
type FeatureKey = 
  | 'DASHBOARD' 
  | 'LIVE_MONITORING' 
  | 'REVENUE' 
  | 'OPERATIONS' 
  | 'BUSES' 
  | 'ROUTES' 
  | 'TRIPS' 
  | 'ALERTS' 
  | 'SUPPORT';

interface FeatureFlag {
  id: FeatureKey;
  label: string;
  enabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: 'DASHBOARD', label: 'Dashboard', enabled: true },
  { id: 'LIVE_MONITORING', label: 'Live Monitoring', enabled: true },
  { id: 'REVENUE', label: 'Revenue Analytics', enabled: true },
  { id: 'OPERATIONS', label: 'Operations Module', enabled: true },
  { id: 'BUSES', label: 'Buses Management', enabled: true },
  { id: 'ROUTES', label: 'Routes Management', enabled: true },
  { id: 'TRIPS', label: 'Trips Management', enabled: true },
  { id: 'ALERTS', label: 'Operational Alerts', enabled: true },
  { id: 'SUPPORT', label: 'Support & FAQ', enabled: true },
];

export const getFeatureFlags = (): FeatureFlag[] => {
  const saved = localStorage.getItem('feature_flags');
  if (!saved) return DEFAULT_FLAGS;
  try {
    return JSON.parse(saved);
  } catch {
    return DEFAULT_FLAGS;
  }
};

export const setFeatureFlags = (flags: FeatureFlag[]) => {
  localStorage.setItem('feature_flags', JSON.stringify(flags));
  // Dispatch a custom event so other components can react
  window.dispatchEvent(new Event('feature_flags_updated'));
};

export const isFeatureEnabled = (key: FeatureKey): boolean => {
  const userRole = localStorage.getItem('user_role');
  if (userRole === 'MASTER_ADMIN') return true; // Master always has access
  
  const flags = getFeatureFlags();
  const flag = flags.find(f => f.id === key);
  return flag ? flag.enabled : true;
};
