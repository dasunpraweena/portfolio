import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
export default function NotFound() {
  useEffect(() => { document.title = 'Page not found — Dasun Praweena'; }, []);
  return <main id="main" className="container not-found" tabIndex={-1}><p className="section-label"><span>404 /</span>A small detour</p><h1>Still curious?<br /><span className="lime">Let's find your way.</span></h1><p>This page doesn't exist. There's plenty to explore back in the portfolio.</p><Link className="btn btn-primary" to="/#home">Back to home <Icon name="arrow" /></Link></main>;
}
