import { Client } from 'pg';
import fs from 'fs';

const projectId = 'rdvfzvhdovlybrkxxbur';
const user = `postgres.${projectId}`;
const database = 'postgres';
const port = 6543; // Supavisor port
const host = 'aws-0-ap-northeast-1.pooler.supabase.com'; // Tokyo

const passwords = [
  'v4zt7tD4SSmIsMYX5gRi-A_zxGrtygr',
  'sb_publishable_v4zt7tD4SSmIsMYX5gRi-A_zxGrtygr'
];

async function tryConnect() {
  const sql = fs.readFileSync('e:/PROJECTS/Nigalthisai/supabase_rls_fix.sql', 'utf8');
  
  for (const password of passwords) {
    console.log(`Trying password: ${password}`);
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
      console.log(`SUCCESS! Connected with password: ${password}`);
      
      console.log('Applying RLS fix SQL...');
      await client.query(sql);
      console.log('RLS fix applied successfully!');
      
      await client.end();
      return;
    } catch (e: any) {
      console.log(`Failed for ${password}: ${e.message}`);
      try {
        await client.end();
      } catch (err) {}
    }
  }
}

tryConnect();
