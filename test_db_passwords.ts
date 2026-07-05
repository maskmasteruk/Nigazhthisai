import { Client } from 'pg';

const projectId = 'anotsryyaynwntgfzscv';
const database = 'postgres';
const user = `postgres.${projectId}`;
const port = 6543;
const host = 'aws-0-ap-northeast-1.pooler.supabase.com';

const candidates = [
  'O8WytfBLjE9MML11-8i3Ow_RcTjRlVa',
  'sb_publishable_O8WytfBLjE9MML11-8i3Ow_RcTjRlVa',
  'v4zt7tD4SSmIsMYX5gRi-A_zxGrtygr',
  'sb_publishable_v4zt7tD4SSmIsMYX5gRi-A_zxGrtygr',
  'nigazhthisaidb',
  'Nigazhthisaidb',
  'nigalthisaidb',
  'Nigalthisaidb',
  'postgres',
  'master123',
  'admin123'
];

async function checkPassword(password: string): Promise<boolean> {
  console.log(`Checking password: ${password.substring(0, 15)}...`);
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000
  });

  try {
    await client.connect();
    console.log(`SUCCESS!!! The correct password is: ${password}`);
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

async function run() {
  for (const pw of candidates) {
    const success = await checkPassword(pw);
    if (success) return;
    console.log('Waiting 5 seconds to avoid circuit breaker...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  console.log('None of the passwords worked.');
}

run();
