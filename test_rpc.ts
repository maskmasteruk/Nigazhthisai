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

async function testUpdate() {
  console.log('Testing rpc_update_trip...');
  const { data, error } = await supabase.rpc('rpc_update_trip', {
    trip_id: 'TRIP-123456',
    driver_name: 'Test Driver',
    conductor_name: 'Test Conductor',
    trip_status: 'PLANNED'
  });
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success:', data);
  }
}

testUpdate();
