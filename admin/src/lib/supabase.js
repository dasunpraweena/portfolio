import { createClient } from '@supabase/supabase-js';
const env = import.meta.env;
let error = null;
let supabase = null;
try {
  const url = new URL(env.VITE_SUPABASE_URL);
  if (url.protocol !== 'https:' || !env.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) throw new Error();
  supabase = createClient(url.origin, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'portfolio-studio-auth' } });
} catch { error = 'Add your public Supabase URL and publishable key to admin/.env.local, then restart Vite.'; }
export { supabase, error as configurationError };
