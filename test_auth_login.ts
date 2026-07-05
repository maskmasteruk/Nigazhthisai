import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://anotsryyaynwntgfzscv.supabase.co';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  try {
    console.log('Logging in as master@nigazhthisai.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'master@nigazhthisai.com',
      password: 'master123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Login successful!');
    console.log('User metadata:', authData.user?.user_metadata);
    console.log('User role:', authData.user?.user_metadata?.role);
    console.log('Session access token present:', !!authData.session?.access_token);
  } catch (e: any) {
    console.error('Exception caught:', e);
  }
}

run();
