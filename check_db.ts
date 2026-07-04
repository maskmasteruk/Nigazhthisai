import dotenv from 'dotenv';

if (typeof global !== 'undefined' && !(global as any).WebSocket) {
  (global as any).WebSocket = class {};
}

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';

console.log('Connecting to Supabase:', supabaseUrl);

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['profiles', 'routes', 'buses', 'trips', 'tickets', 'bookings', 'seat_segments', 'complaints', 'alerts', 'shops', 'stops'];
  for (const table of tables) {
    try {
      const res = await supabase.from(table).select('*');
      console.log(`Table "${table}" response:`, JSON.stringify(res, null, 2));
    } catch (e: any) {
      console.error(`Exception checking table "${table}":`, e.message);
    }
  }
}

check();
