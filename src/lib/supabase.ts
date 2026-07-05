import { createClient, SupportedStorage } from '@supabase/supabase-js';
import { getCookie, setCookie, eraseCookie } from '../utils/cookies';

// Retrieve credentials from Vite's compiled environment variables
const supabaseUrl = (process.env.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

const urlToUse = supabaseUrl || 'https://placeholder-project-id.supabase.co';
const keyToUse = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg1Njk2MDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder-signature';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Falling back to placeholder credentials to prevent app crash.');
}

export const isPlaceholder = !supabaseUrl || !supabaseAnonKey;

// Cookie storage provider to store and reauthenticate Supabase Auth sessions via cookies
const cookieStorage: SupportedStorage = {
  getItem: (key: string): string | null => {
    return getCookie(key);
  },
  setItem: (key: string, value: string): void => {
    // Session is valid for 7 days (604800 seconds)
    setCookie(key, value, 604800);
  },
  removeItem: (key: string): void => {
    eraseCookie(key);
  }
};

export const supabase = createClient(urlToUse, keyToUse, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: cookieStorage
  }
});
