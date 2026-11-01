import fs from 'node:fs';
import { z } from 'zod';

export function databaseIdentity(connectionString, supabaseUrl) {
  let database, supabase;
  try { database = new URL(connectionString); supabase = new URL(supabaseUrl); } catch { throw new Error('Use valid DATABASE_URL and SUPABASE_URL values.'); }
  const match = supabase.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
  if (!match || supabase.protocol !== 'https:' || supabase.username || supabase.password || supabase.port || supabase.search || supabase.hash || !['', '/'].includes(supabase.pathname)) throw new Error('SUPABASE_URL must identify your hosted Supabase project.');
  const projectRef = match[1];
  const user = decodeURIComponent(database.username);
  const direct = database.hostname === `db.${projectRef}.supabase.co`;
  const session = /^[a-z0-9.-]+\.pooler\.supabase\.com$/.test(database.hostname) && user.endsWith(`.${projectRef}`);
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || (!direct && !session) || (database.port && database.port !== '5432') || database.pathname !== '/postgres' || database.searchParams.get('schema') !== 'portfolio' || !database.password) throw new Error('Database URL must target this Supabase project using port 5432, database postgres, and schema=portfolio.');
  if (!['require', 'verify-full', 'verify-ca'].includes(database.searchParams.get('sslmode'))) throw new Error('Add sslmode=verify-full to the database URL. TLS verification is enforced.');
  const allowedParameters = new Set(['schema', 'sslmode', 'sslaccept', 'sslcert', 'sslrootcert']);
  for (const key of database.searchParams.keys()) if (!allowedParameters.has(key) || database.searchParams.getAll(key).length !== 1) throw new Error('Remove unexpected or repeated database URL parameters; connection-target overrides are not allowed.');
  return { projectRef, host: database.hostname, schema: 'portfolio', connectionType: session ? 'Session pooler' : 'Direct' };
}

const origins = z.string().transform(value => value.split(',').map(item => item.trim()).filter(Boolean)).pipe(z.array(z.string().url().refine(value => {
  const url = new URL(value);
  return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
}, 'Use exact origins without paths or trailing slashes.')));
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().refine(value => /^sb_secret_[A-Za-z0-9_-]{16,}$/.test(value) || /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value), 'Use a server secret key, or a legacy service_role JWT.'),
  ADMIN_USER_IDS: z.string().transform(value => value.split(',').map(item => item.trim()).filter(Boolean)).pipe(z.array(z.string().uuid()).min(1)),
  FRONTEND_ORIGINS: origins.prefault('http://localhost:5173'),
  ADMIN_ORIGINS: origins.prefault('http://localhost:5174'),
  PUBLIC_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9-]{2,62}$/).default('portfolio-public'),
  PRIVATE_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9-]{2,62}$/).default('portfolio-private'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  DATABASE_SSL_CA_FILE: z.string().optional(),
});
export function readConfig(env = process.env) {
  const result = schema.safeParse(env);
  if (!result.success) throw new Error(`Invalid configuration fields: ${[...new Set(result.error.issues.map(issue => issue.path[0]))].join(', ')}. Check backend/.env; values have not been logged.`);
  const config = result.data;
  if (config.SUPABASE_SECRET_KEY.startsWith('eyJ')) {
    let role;
    try { role = JSON.parse(Buffer.from(config.SUPABASE_SECRET_KEY.split('.')[1], 'base64url').toString('utf8')).role; } catch { /* Invalid legacy key is rejected below. */ }
    if (role !== 'service_role') throw new Error('Use a current sb_secret_ key or a legacy key whose role is service_role. Never use an anon key here.');
  }
  databaseIdentity(config.DATABASE_URL, config.SUPABASE_URL);
  if (config.PUBLIC_BUCKET === config.PRIVATE_BUCKET) throw new Error('The two bucket names must be different.');
  return config;
}
export function pgOptions(connectionString, env = process.env) {
  const url = new URL(connectionString);
  // node-pg SSL query parameters can override an explicit TLS configuration.
  for (const field of ['schema', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl', 'uselibpqcompat']) url.searchParams.delete(field);
  return { connectionString: url.toString(), max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: true, ...(env.DATABASE_SSL_CA_FILE ? { ca: fs.readFileSync(env.DATABASE_SSL_CA_FILE, 'utf8') } : {}) } };
}
