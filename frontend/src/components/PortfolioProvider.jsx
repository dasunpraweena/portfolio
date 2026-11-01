import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { api } from '../api/client';
import { useApiResource } from '../hooks/useApiResource';
import CvPreview from './CvPreview';

const PortfolioContext = createContext(null);
export const usePortfolio = () => useContext(PortfolioContext);

export function PortfolioProvider({ children }) {
  const resource = useApiResource(signal => api.getPortfolio({ signal }));
  const portfolio = resource.data;
  const profile = portfolio?.profile;
  const cv = portfolio?.settings?.cv;
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [dialog, setDialog] = useState(null);
  const [notification, setNotification] = useState('');
  const closeDialog = useCallback(() => setDialog(null), []);
  const showNotice = useCallback((message) => setNotification(message), []);
  useEffect(() => {
    if (portfolio?.settings?.title) document.title = portfolio.settings.title;
    if (portfolio?.settings?.description) document.querySelector('meta[name="description"]').content = portfolio.settings.description;
  }, [portfolio]);
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
  return <PortfolioContext.Provider value={{ theme, setTheme, setDialog, showNotice, portfolio, profile, copy: portfolio?.copy, portfolioStatus: resource.status, portfolioError: resource.error, retryPortfolio: resource.retry }}>
    {children}
    {dialog && <Modal titleId="utility-title" kicker={dialog.kicker} small onClose={closeDialog}>
      <div className="dialog-body">
        <h2 id="utility-title">{dialog.title}</h2>
        {dialog.kind === 'cv' ? cv?.url ? <CvPreview cv={{ ...cv, fileName: profile?.cv.fileName || 'CV.pdf' }} onClose={closeDialog} /> : <>
          <div className="empty-doc"><Icon name="file" /><h3>CV not added yet</h3><p>My latest PDF will be available to preview and download here when added.</p></div>
          <div className="form-actions"><button className="btn btn-primary" onClick={closeDialog}>Got it <Icon name="check" /></button></div>
        </> : dialog.records ? <>
          {dialog.records.map(record => <article className="record-detail" key={record.slug}>
            <h3>{record.institution || record.title}</h3>
            <p>{[record.faculty, record.degree, record.studyStatus, record.category, record.organisation].filter(Boolean).join(' · ')}</p>
            {record.description && <p>{record.description}</p>}
            {(record.startDate || record.endDate) && <p>{[record.startDate, record.endDate].filter(Boolean).map(date => new Date(date).toLocaleDateString()).join(' – ')}</p>}
            {record.coursework?.length > 0 && <><p>Relevant coursework</p><ul>{record.coursework.map(subject => <li key={subject}>{subject}</li>)}</ul></>}
            {record.achievements?.length > 0 && <ul>{record.achievements.map(achievement => <li key={achievement}>{achievement}</li>)}</ul>}
          </article>)}
          <div className="form-actions"><button className="btn" onClick={closeDialog}>Close</button></div>
        </> : <>
          <p>{dialog.message}</p>
          <div className="form-actions"><button className="btn btn-primary" onClick={closeDialog}>Got it <Icon name="check" /></button></div>
        </>}
      </div>
    </Modal>}
    <div className={'toast' + (notification ? ' show' : '')} role="status" aria-live="polite">{notification}</div>
  </PortfolioContext.Provider>;
}
