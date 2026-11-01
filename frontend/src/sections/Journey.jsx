import { usePortfolio } from '../components/PortfolioProvider';
import { CvButton } from '../components/ContentActions';
import { Lines } from '../components/FormattedText';
import ApiState from '../components/ApiState';
import Icon from '../components/Icon';

function MilestoneIcon({ milestone, portfolio }) {
  const { setDialog } = usePortfolio();
  const records = milestone.slug === 'university' ? portfolio.education : ['team-projects', 'industry-exposure'].includes(milestone.slug) ? portfolio.experience : [];
  const title = milestone.slug === 'university' ? 'Education' : 'Experience & activities';
  const open = () => setDialog({ title, kicker: 'My journey', records });
  return <Icon name={milestone.icon} aria-hidden={records.length ? undefined : true} role={records.length ? 'button' : undefined} tabIndex={records.length ? 0 : undefined} aria-label={records.length ? `View ${title.toLowerCase()} details` : undefined} onClick={records.length ? open : undefined} onKeyDown={event => { if (records.length && ['Enter', ' '].includes(event.key)) { event.preventDefault(); open(); } }} />;
}

export default function Journey() {
  const { copy, portfolio } = usePortfolio();
  const { milestones, certificates } = portfolio;
  return <section className="section journey-section" id="journey" aria-labelledby="journey-heading"><div className="container">
    <div className="section-heading journey-heading"><div><p className="section-label"><span>{copy.journey[0]}</span>{copy.journey[1]}</p><h2 id="journey-heading">{copy.journey[2]}<br />{copy.journey[3]}</h2><p className="section-subtitle">{copy.journey[4]}</p></div><div className="roadmap-legend"><span><i></i>{copy.journey[5]}</span><span><i className="legend-now"></i>{copy.journey[6]}</span><span><i className="legend-next"></i>{copy.journey[7]}</span></div></div>
    {milestones.length ? <div className="roadmap-map"><div className="roadmap-map-caption"><span className="mono">{copy.journey[8]}</span><span className="mono">{milestones.length === 6 ? copy.journey[9] : `Follow 01 → ${String(milestones.length).padStart(2, '0')}`}</span></div>
      <div className="roadmap-canvas">
        <svg className="roadmap-track" viewBox="0 0 1200 642" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="roadmap-gradient" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#77984c" /><stop offset="1" stopColor="#b9dd70" /></linearGradient></defs><path className="roadmap-route-base" d="M20 20H1154Q1186 20 1186 52V330Q1186 362 1154 362H20" /><path className="roadmap-route-travelled" d="M20 20H1154Q1186 20 1186 52V330Q1186 362 1154 362H420" /><path d="m605 15 7 5-7 5m575 150 6 8 6-8m-524 182-7 5 7 5" className="route-arrow" /></svg>
        <ol className="roadmap-stages">{milestones.map((milestone, index) => <li key={milestone.slug} className={'roadmap-step' + (milestone.stage === 'CURRENT' ? ' milestone-current' : milestone.stage === 'GOAL' ? ' milestone-future' : '')} aria-current={milestone.stage === 'CURRENT' ? 'step' : undefined}>
          <span className="milestone-node">{String(index + 1).padStart(2, '0')}</span><span className="milestone-route-label">{milestone.stage === 'CURRENT' && <span className="status-dot"></span>}{milestone.routeLabel}</span>
          <article className="milestone-card"><div className="milestone-top"><span className="milestone-category">{milestone.category}</span><MilestoneIcon milestone={milestone} portfolio={portfolio} /></div><h3><Lines values={milestone.titleLines} /></h3><p>{milestone.description}</p>
            {milestone.tags.length > 0 && <div className="milestone-tags">{milestone.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
            {milestone.linkSection && <a className="milestone-link" href={'#' + milestone.linkSection}>{milestone.linkLabel}<Icon name="up-right" /></a>}
          </article>
        </li>)}</ol>
      </div><div className="roadmap-map-footer"><span className="roadmap-footer-spark">{copy.journey[55]}</span><p>{copy.journey[56]}</p></div>
    </div> : <ApiState compact title="No journey milestones published yet." />}
    <div className="journey-evidence"><Icon name="award" /><div><h3>{copy.journey[57] || 'Certifications & achievements'}</h3>{!certificates.length && <p>{copy.journey[58] || 'No verified certificates published yet.'}</p>}</div></div>
    {certificates.length > 0 && <div className="certificate-list">{certificates.map(certificate => <article className="certificate-record" key={certificate.slug}><h4>{certificate.title}</h4><p className="muted">{[certificate.issuer, certificate.completedAt && new Date(certificate.completedAt).toLocaleDateString(), certificate.credentialId].filter(Boolean).join(' · ')}</p><div className="project-links">{certificate.verificationUrl && <a href={certificate.verificationUrl} target="_blank" rel="noopener noreferrer">Verify credential <Icon name="up-right" /></a>}{certificate.file && <a href={certificate.file.url} target="_blank" rel="noopener noreferrer">View certificate <Icon name="file" /></a>}</div></article>)}</div>}
    <div className="resume-banner"><div><h3>{copy.journey[59]}</h3><p>{copy.journey[60]}</p></div><CvButton label="View / Download CV" /></div>
  </div></section>;
}
