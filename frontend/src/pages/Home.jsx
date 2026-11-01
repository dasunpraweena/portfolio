import { useEffect } from 'react';
import { usePortfolio } from '../components/PortfolioProvider';
import ApiState from '../components/ApiState';
import Hero from '../sections/Hero';
import Projects from '../sections/Projects';
import About from '../sections/About';
import Skills from '../sections/Skills';
import Learning from '../sections/Learning';
import Journey from '../sections/Journey';
import Contact from '../sections/Contact';
export default function Home() {
  const { portfolioStatus, portfolioError, retryPortfolio, portfolio } = usePortfolio();
  useEffect(() => { if (portfolio?.settings?.title) document.title = portfolio.settings.title; }, [portfolio]);
  if (portfolioStatus !== 'success') return <main id="main" className="container portfolio-state" tabIndex={-1}><ApiState status={portfolioStatus} error={portfolioError} onRetry={retryPortfolio} /></main>;
  return <main id="main" tabIndex={-1}><Hero /><Projects /><About /><Skills /><Learning /><Journey /><Contact /></main>;
}
