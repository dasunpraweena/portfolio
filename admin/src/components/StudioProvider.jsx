import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { useAuth } from '../auth/AuthProvider';
const Context = createContext(null);
export const useStudio = () => useContext(Context);
export function StudioProvider({ children }) {
  const { access } = useAuth();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [version, changed] = useReducer(value => value + 1, 0);
  const [notice, setNotice] = useState(null), [confirmation, setConfirmation] = useState(null);
  const resolve = useRef(null);
  useEffect(() => { if (access.status !== 'authorized') { resolve.current?.(false); resolve.current = null; setConfirmation(null); setNotice(null); } }, [access.status]);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('portfolio-studio-theme', theme); } catch {} }, [theme]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 6000); return () => clearTimeout(timer); }, [notice]);
  const confirm = options => new Promise(answer => { resolve.current?.(false); resolve.current = answer; setConfirmation(options); });
  const answer = value => { resolve.current?.(value); resolve.current = null; setConfirmation(null); };
  return <Context.Provider value={{ theme, setTheme, version, changed, notify: (message, type = 'success') => setNotice({ message, type }), confirm }}>
    {children}
    <div className={'toast' + (notice ? ' show' : '')} role="status" aria-live="polite">{notice?.message}</div>
    {confirmation && <Modal titleId="confirm-title" kicker="Please confirm" small onClose={() => answer(false)}><div className="dialog-body"><h2 id="confirm-title">{confirmation.title}</h2><p>{confirmation.message}</p><div className="form-actions"><button className="btn" onClick={() => answer(false)}>Cancel</button><button className="btn btn-primary" onClick={() => answer(true)}>{confirmation.label || 'Confirm'} <Icon name="check" /></button></div></div></Modal>}
  </Context.Provider>;
}
