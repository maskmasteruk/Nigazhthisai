import { Client } from 'pg';

const projectId = 'anotsryyaynwntgfzscv';
const database = 'postgres';
const user = `postgres.${projectId}`;
const port = 6543; // Supavisor pooler port
const host = 'aws-0-ap-northeast-1.pooler.supabase.com'; // Tokyo
const password = 'O8WytfBLjE9MML11-8i3Ow_RcTjRlVa';

const sql = `
create or replace function public.rpc_update_trip(trip_id text, driver_name text, conductor_name text, trip_status text)
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set 
    driver_name = rpc_update_trip.driver_name,
    conductor_name = rpc_update_trip.conductor_name,
    status = rpc_update_trip.trip_status
  where id = rpc_update_trip.trip_id;
end;
$$;
`;

async function tryConnect(): Promise<boolean> {
  console.log(`Connecting to ${host}:${port} as ${user}...`);
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });
  
  try {
    await client.connect();
    console.log(`SUCCESS! Connected successfully.`);
    
    console.log('Applying RPC update function patch...');
    await client.query(sql);
    console.log('RPC update function patched successfully!');
    
    await client.end();
    return true;
  } catch (e: any) {
    console.log(`Failed: ${e.message}`);
    try {
      await client.end();
    } catch (err) {}
    return false;
  }
}

async function runPatch() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`Attempt ${attempt}/3...`);
    const ok = await tryConnect();
    if (ok) return;
    console.log('Waiting 10 seconds before next attempt...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

runPatch();
