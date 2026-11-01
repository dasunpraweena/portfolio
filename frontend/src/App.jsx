import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { IconDefinitions } from './components/Icon';
import Home from './pages/Home';
import ProjectDetails from './pages/ProjectDetails';
import NotFound from './pages/NotFound';

function ScrollManager() {
  const location = useLocation();
  const previous = useRef(location);
  useEffect(() => {
    const old = previous.current;
    previous.current = location;
    if (location.state?.backgroundLocation || old.state?.backgroundLocation) return;
    const frame = requestAnimationFrame(() => {
      if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        target?.scrollIntoView();
      } else if (old.pathname !== location.pathname) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.querySelector('main')?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location]);
  return null;
}

export default function App() {
  const location = useLocation();
  const background = location.state?.backgroundLocation;
  return <>
    <IconDefinitions />
    <a className="skip-link" href="#main">Skip to content</a>
    <Navbar />
    <ScrollManager />
    <Routes location={background || location}>
      <Route path="/" element={<Home />} />
      <Route path="/projects/:id" element={<ProjectDetails />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Footer />
    {background && <Routes><Route path="/projects/:id" element={<ProjectDetails overlay />} /></Routes>}
  </>;
}
