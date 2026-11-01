import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import { pgOptions } from '../config.js';

export function makePrisma(config) {
  const adapter = new PrismaPg(pgOptions(config.DATABASE_URL, config), { schema: 'portfolio' });
  return new PrismaClient({ adapter });
}
export function makeSupabase(config) {
  return createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, options = {}) => fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(20000) }) },
  });
}
