import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useStudio } from '../components/StudioProvider';
import { Errors, State } from '../components/Shared';
import Icon from '../components/Icon';
export function ThemeToggle() {
  const { theme, setTheme } = useStudio();
  return <button className="round-btn" aria-label={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme'} onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>;
}
export default function Login() {
  const { signIn, access } = useAuth();
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const submit = async event => { event.preventDefault(); if (busy) return; setBusy(true); setError(null); try { await signIn(email, password); setPassword(''); } catch (error) { setError(error); } finally { setBusy(false); } };
  return <main className="auth-screen"><div className="auth-top"><a className="brand" href="/"><span className="brand-mark">d p</span>Portfolio studio<span className="brand-dot">.</span></a><ThemeToggle /></div><section className="auth-card admin-card"><div className="auth-copy"><p className="mono">Your content workspace</p><h1>Good to see you again.</h1><p>Sign in to look after your portfolio.</p></div><form onSubmit={submit}><label className="field"><span>Email address</span><input type="email" name="email" autoComplete="username" required maxLength={200} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label><label className="field"><span>Password</span><input type="password" name="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></label><Errors error={error || access.error} /><button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'} <Icon name="arrow" /></button></form><p className="form-hint">Use your existing Supabase Auth account. Public registration is not available here.</p></section></main>;
}
export function AccessState() {
  const { access, verify, signOut } = useAuth();
  return <main className="auth-screen"><div className="auth-top"><span className="brand"><span className="brand-mark">d p</span>Portfolio studio.</span><ThemeToggle /></div><section className="auth-card admin-card"><State status={access.status === 'checking' ? 'loading' : 'error'} error={access.error} title={access.status === 'denied' ? 'Access denied.' : access.status === 'configuration' ? 'Finish local setup.' : access.status === 'checking' ? 'Checking your admin access…' : 'Your workspace is unavailable.'} retry={['denied', 'error'].includes(access.status) ? verify : undefined} />{access.status !== 'checking' && <button className="btn" onClick={signOut}>Sign out</button>}</section></main>;
}
