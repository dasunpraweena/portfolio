import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, configurationError } from '../lib/supabase';
import { createAdminApi } from '../lib/api';
const Context = createContext(null);
export const useAuth = () => useContext(Context);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [access, setAccess] = useState({ status: configurationError ? 'configuration' : 'checking', error: configurationError });
  const sessionRef = useRef(null), refresh = useRef(null), sequence = useRef(0), signedOut = useRef(false), clearing = useRef(null);
  const clearSession = useCallback(() => {
    if (clearing.current) return clearing.current;
    clearing.current = (async () => {
      try { await supabase?.auth.signOut({ scope: 'local' }); }
      finally {
        // Also clear persisted credentials when the auth service cannot be reached.
        for (const key of ['portfolio-studio-auth', 'portfolio-studio-auth-code-verifier', 'portfolio-studio-auth-user']) {
          try { localStorage.removeItem(key); } catch {}
        }
        await supabase?.auth.stopAutoRefresh();
      }
    })().finally(() => { clearing.current = null; });
    return clearing.current;
  }, []);
  const expire = useCallback(() => {
    signedOut.current = true; sequence.current++;
    sessionRef.current = null; setSession(null); setAccess({ status: 'signedOut', error: 'Your session expired. Please sign in again.' });
    clearSession().catch(() => {});
  }, [clearSession]);
  const api = useMemo(() => createAdminApi(import.meta.env.VITE_API_BASE_URL, {
    async getToken() { if (signedOut.current) return null; const result = await supabase.auth.getSession(); return result.error ? null : result.data.session?.access_token; },
    async refreshToken() {
      if (!refresh.current) refresh.current = supabase.auth.refreshSession().then(result => result.error ? null : result.data.session?.access_token).finally(() => { refresh.current = null; });
      return refresh.current;
    },
    onUnauthorized: expire,
    onDenied: () => setAccess({ status: 'denied', error: 'Your account is signed in but is not authorized to manage this portfolio.' }),
  }), [expire]);
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    const accept = value => {
      if (!mounted || value && signedOut.current) return;
      if (value && sessionRef.current?.user.id !== value.user.id) setAccess({ status: 'checking', error: null });
      sessionRef.current = value; setSession(value);
      if (!value) setAccess(previous => ({ status: 'signedOut', error: previous.status === 'signedOut' ? previous.error : null }));
    };
    // The callback is synchronous; all API work happens in a separate React effect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, value) => accept(value));
    supabase.auth.getSession().then(({ data, error }) => { if (mounted) { if (error) setAccess({ status: 'signedOut', error: 'Restore your session by signing in again.' }); else accept(data.session); } });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  const verify = useCallback(async () => {
    if (!sessionRef.current) return;
    const version = ++sequence.current;
    const userId = sessionRef.current.user.id;
    setAccess(previous => previous.status === 'authorized' && previous.userId === userId ? previous : { status: 'checking', error: null });
    try {
      const result = await api.read('me');
      if (version !== sequence.current || sessionRef.current?.user.id !== userId) return;
      if (result?.id !== userId) { setAccess({ status: 'denied', error: 'The server did not authorize this account.' }); return; }
      setAccess({ status: 'authorized', userId, error: null });
    } catch (error) {
      if (version !== sequence.current || !sessionRef.current) return;
      setAccess({ status: error.status === 403 ? 'denied' : error.status === 401 ? 'signedOut' : 'error', error: error.message });
    }
  }, [api]);
  useEffect(() => { if (session) verify(); }, [session?.access_token, verify]);
  const signIn = async (email, password) => {
    await clearing.current?.catch(() => {});
    signedOut.current = false;
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.status === 429 ? 'Too many sign-in attempts. Please try again later.' : 'Sign-in failed. Check your email and password, then retry.');
    await supabase.auth.startAutoRefresh();
  };
  const signOut = async () => {
    signedOut.current = true; sequence.current++; sessionRef.current = null; setSession(null); setAccess({ status: 'signedOut', error: null });
    try { await clearSession(); }
    catch { /* Remove local access immediately even if the remote logout is unavailable. */ }
  };
  return <Context.Provider value={{ session, access, api, signIn, signOut, verify }}>{children}</Context.Provider>;
}
