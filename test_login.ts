import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

if (typeof global !== 'undefined' && !(global as any).WebSocket) {
  (global as any).WebSocket = class {};
}

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';

console.log('Connecting to Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'master@nigazhthisai.com',
      password: 'master123'
    });
    
    if (authError) {
      console.error('Login error:', JSON.stringify(authError, null, 2));
      return;
    }
    
    console.log('Login successful! User ID:', authData.user?.id);
    
    console.log('Querying profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) {
      console.error('Query profiles error:', profilesError.message);
    } else {
      console.log('Profiles fetched successfully, count:', profiles?.length);
    }
    
    console.log('Querying routes...');
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('*');
      
    if (routesError) {
      console.error('Query routes error:', routesError.message);
    } else {
      console.log('Routes fetched successfully, count:', routes?.length);
    }
  } catch (e: any) {
    console.error('Exception:', e.message);
  }
}

test();
