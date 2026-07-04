import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';

async function run() {
  try {
    console.log('Fetching', supabaseUrl);
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    console.log('Status:', res.status);
    console.log('Headers:');
    res.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

run();
