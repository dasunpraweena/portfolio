import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { profile } from '../data/profile';

const PortfolioContext = createContext(null);
export const usePortfolio = () => useContext(PortfolioContext);

export function PortfolioProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [dialog, setDialog] = useState(null);
  const [notification, setNotification] = useState('');
  const closeDialog = useCallback(() => setDialog(null), []);
  const showNotice = useCallback((message) => setNotification(message), []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f4f5ed' : '#121612';
    try { localStorage.setItem('dasun-portfolio-theme', theme); } catch { /* The theme still works when storage is unavailable. */ }
  }, [theme]);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(''), 5000);
    return () => clearTimeout(timer);
  }, [notification]);
  return <PortfolioContext.Provider value={{ theme, setTheme, setDialog, showNotice }}>
    {children}
    {dialog && <Modal titleId="utility-title" kicker={dialog.kicker} small onClose={closeDialog}>
      <div className="dialog-body">
        <h2 id="utility-title">{dialog.title}</h2>
        {dialog.kind === 'cv' ? profile.cv.url ? <>
          <p>Preview or download my latest CV.</p>
          <object className="cv-embed" data={profile.cv.url} type="application/pdf" aria-label="CV preview">
            <p>Your browser cannot preview this PDF. You can download it below.</p>
          </object>
          <div className="form-actions"><a className="btn btn-primary" href={profile.cv.url} download={profile.cv.fileName}>Download PDF <Icon name="download" /></a><button className="btn" onClick={closeDialog}>Close</button></div>
        </> : <>
          <div className="empty-doc"><Icon name="file" /><h3>CV not added yet</h3><p>My latest PDF will be available to preview and download here when added.</p></div>
          <div className="form-actions"><button className="btn btn-primary" onClick={closeDialog}>Got it <Icon name="check" /></button></div>
        </> : <>
          <p>{dialog.message}</p>
          <div className="form-actions"><button className="btn btn-primary" onClick={closeDialog}>Got it <Icon name="check" /></button></div>
        </>}
      </div>
    </Modal>}
    <div className={'toast' + (notification ? ' show' : '')} role="status" aria-live="polite">{notification}</div>
  </PortfolioContext.Provider>;
}
