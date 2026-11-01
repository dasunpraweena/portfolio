import Icon from './Icon';
import { usePortfolio } from './PortfolioProvider';
import { profile } from '../data/profile';

export function CvButton({ label = 'View / Download CV' }) {
  const { setDialog } = usePortfolio();
  return <button className="btn" onClick={() => setDialog({ kind: 'cv', kicker: 'Resume / CV', title: 'The story, in one document.' })}>{label} <Icon name="download" /></button>;
}

export function SocialLink({ platform, withIcon = 'false', tinyArrow = 'false' }) {
  const { setDialog } = usePortfolio();
  const content = <>{withIcon === 'true' && <Icon name={platform.toLowerCase()} />}{platform} <Icon name="up-right" style={tinyArrow === 'true' ? { width: 10, height: 10 } : undefined} /></>;
  return profile.socials[platform] ? <a className="social-link" href={profile.socials[platform]} target="_blank" rel="noopener noreferrer">{content}</a> : <button className="social-link" onClick={() => setDialog({ title: `Find me on ${platform}.`, kicker: 'Profile link to add', message: `My exact ${platform} profile URL has not been supplied yet. You can reach me by email in the meantime.` })}>{content}</button>;
}

export function ProjectLink({ project, kind, className = '', children }) {
  const { setDialog } = usePortfolio();
  const url = kind === 'repository' ? project.repositoryUrl : project.demoUrl;
  const label = kind === 'repository' ? 'GitHub repository URL' : 'live demo URL';
  return url ? <a className={className} href={url} target="_blank" rel="noopener noreferrer">{children}</a> : <button className={className + ' unavailable'} onClick={() => setDialog({ kicker: 'Project links', title: kind === 'repository' ? 'Repository link to add.' : 'A live demo is coming.', message: `The ${label} for ${project.name} has not been supplied yet.` })}>{children}</button>;
}
