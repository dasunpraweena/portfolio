import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navigation } from '../data/profile';
import ThemeToggle from './ThemeToggle';
import Icon from './Icon';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');
  const nav = useRef(null);
  const toggle = useRef(null);
  const location = useLocation();
  const onHome = (location.state?.backgroundLocation || location).pathname === '/';
  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    const dismiss = event => {
      if (event.type === 'keydown' && event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (event.type === 'pointerdown' && !nav.current?.contains(event.target)) setOpen(false);
    };
    if (open) { document.addEventListener('keydown', dismiss); document.addEventListener('pointerdown', dismiss); }
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', dismiss); };
  }, [open]);
  useEffect(() => {
    if (!onHome || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-15% 0px -65% 0px' });
    for (const [id] of navigation) { const element = document.getElementById(id); if (element) observer.observe(element); }
    return () => observer.disconnect();
  }, [onHome]);
  return <header className="site-header"><nav className="nav container" aria-label="Main navigation" ref={nav}>
    <Link className="brand" to="/#home" aria-label="Dasun portfolio home"><span className="brand-mark">d p</span>dasun<span className="brand-dot">.</span></Link>
    <div className={'nav-links' + (open ? ' open' : '')} id="nav-links">
      {navigation.map(([id, title]) => <Link key={id} to={'/#' + id} className={onHome && active === id ? 'active' : undefined} aria-current={onHome && active === id ? 'location' : undefined} onClick={() => setOpen(false)}>{title}</Link>)}
    </div>
    <div className="nav-actions"><ThemeToggle /><button ref={toggle} className="round-btn menu-btn" id="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(value => !value)}><Icon name={open ? 'close' : 'menu'} /></button></div>
  </nav></header>;
}
