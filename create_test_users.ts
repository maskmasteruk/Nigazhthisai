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

async function createUsers() {
  const users = [
    {
      email: 'conductor@nigazhthisai.com',
      password: 'conductor123',
      name: 'Nigazhthisai Conductor',
      role: 'CONDUCTOR'
    },
    {
      email: 'passenger@nigazhthisai.com',
      password: 'passenger123',
      name: 'Nigazhthisai Passenger',
      role: 'PASSENGER'
    }
  ];

  for (const u of users) {
    console.log(`Signing up ${u.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: {
          name: u.name,
          role: u.role
        }
      }
    });

    if (error) {
      console.error(`Failed to sign up ${u.email}:`, error.message);
    } else {
      console.log(`Successfully signed up ${u.email}!`);
      console.log('User ID:', data.user?.id);
    }
  }
}

createUsers();
