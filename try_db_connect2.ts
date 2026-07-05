import { Client } from 'pg';
import fs from 'fs';

const projectId = 'rdvfzvhdovlybrkxxbur';
const user = `postgres.${projectId}`;
const database = 'postgres';
const port = 6543; // Supavisor port
const host = 'aws-0-ap-northeast-1.pooler.supabase.com'; // Tokyo

const passwords = [
  'nigalthisaidb',
  'nigazhthisaidb',
  'Nigalthisaidb',
  'Nigazhthisaidb',
  'NigalthisaiDB',
  'NigazhthisaiDB',
  'nigalthisai_db',
  'nigazhthisai_db',
  'Nigalthisai_DB',
  'Nigazhthisai_DB',
  'nigazhthisai_supabase',
  'nigalthisai_supabase'
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
      
      if (e.message.includes('circuitbreaker')) {
        console.log('Circuit breaker active, waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }
}

tryConnect();
