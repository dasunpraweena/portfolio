import 'dotenv/config';
import { readConfig } from './config.js';
import { makePrisma, makeSupabase } from './lib/clients.js';
import { createApp } from './app.js';
import { checkDatabaseSecurity, checkStorageSecurity } from './services/security.js';

let db;
let config;
try {
  config = readConfig();
  db = makePrisma(config);
  const supabase = makeSupabase(config);
  await db.$connect();
  await checkDatabaseSecurity(db);
  await checkStorageSecurity(db, supabase, config);
  const server = createApp({ db, supabase, config }).listen(config.PORT, () => console.log(`Portfolio API listening at http://localhost:${config.PORT}`));
  const shutdown = () => { server.close(async () => { await db.$disconnect(); process.exit(0); }); setTimeout(() => process.exit(1), 10000).unref(); };
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
} catch (error) {
  // Startup exceptions from a DB driver may contain credentials. Only curated errors are shown.
  console.error(error.name === 'ApiError' || !config ? error.message : 'Startup failed. Check your local configuration, database migrations, TLS certificate, and bucket permissions. No credentials have been logged.');
  if (db) await db.$disconnect().catch(() => {});
  process.exitCode = 1;
}
