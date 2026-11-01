import 'dotenv/config';
import { readConfig } from '../src/config.js';
import { makePrisma, makeSupabase } from '../src/lib/clients.js';
import { checkDatabaseSecurity, checkStorageSecurity } from '../src/services/security.js';
let db;
try {
  const config = readConfig(); db = makePrisma(config);
  await checkDatabaseSecurity(db);
  await checkStorageSecurity(db, makeSupabase(config), config);
  console.log('Both buckets are private, the restrictive client policy is present, and the application schema denies browser roles.');
} catch {
  console.error('Security checks did not pass. Review .env, application migrations, both bucket privacy switches, and sql/storage-policies.sql. No bucket settings or files were changed.');
  process.exitCode = 1;
} finally { if (db) await db.$disconnect(); }
