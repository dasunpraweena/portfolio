import { Link } from 'react-router-dom';
import { usePortfolio } from './PortfolioProvider';

export default function Footer() {
  const { copy, profile, portfolioStatus } = usePortfolio();
  if (portfolioStatus !== 'success' || !profile) return null;
  const role = copy.footer[2]?.split(' · ').slice(1).join(' · ');
  return <footer className="site-footer"><div className="container"><div className="footer-top"><div><Link className="brand" to="/#home">{copy.footer[0]}<span className="brand-dot">{copy.footer[1]}</span></Link><p>{profile.name}{role && ' · ' + role}</p></div><div className="footer-links"><Link to="/#work">{copy.footer[3]}</Link><Link to="/#about">{copy.footer[4]}</Link><Link to="/#skills">{copy.footer[5]}</Link><Link to="/#learning">{copy.footer[6]}</Link><Link to="/#journey">{copy.footer[7]}</Link><Link to="/#contact">{copy.footer[8]}</Link>{profile.email && <a href={'mailto:' + profile.email}>{copy.footer[9]}</a>}</div></div><div className="footer-bottom"><span>{copy.footer[10]}<span className="current-year">{new Date().getFullYear()}</span>{' ' + profile.name}</span><span className="footer-crafted">{copy.footer[13]}<span className="footer-spark">{copy.footer[14]}</span>{copy.footer[15]}</span></div></div></footer>;
}
