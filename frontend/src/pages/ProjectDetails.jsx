import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useApiResource } from '../hooks/useApiResource';
import { usePortfolio } from '../components/PortfolioProvider';
import ApiState from '../components/ApiState';
import { notebook } from '../data/notebook';
import Modal from '../components/Modal';
import ProjectVisual from '../components/ProjectVisual';
import Icon from '../components/Icon';
import { ProjectLink } from '../components/ContentActions';

function Notebook({ project, heading = 'h1' }) {
  const Heading = heading;
  return <>
    <div className="case-hero"><span className="badge">{project.type} · Project brief</span><Heading id="case-title">{project.name}</Heading><p>{project.short}</p><div className="tags">{project.tech.map(tag => <span className="tag" key={tag}>{tag}</span>)}<span className="tag">Status: {project.implementationStatus || 'to be confirmed'}</span></div></div>
    <div className="case-visual"><ProjectVisual project={project} interactive={false} /></div>
    <div className="case-content">
      <div><h3>The problem</h3><p>{project.problem}</p></div>
      <div><h3>The proposed solution</h3><p>{project.solution}</p></div>
      <div><h3>Feature direction</h3><ul>{project.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div>
      <div><h3>Technology</h3><p>{project.technologies.join(' · ') || notebook.technology}</p></div>
      <div><h3>My contribution</h3><p>{project.contribution || notebook.contribution}</p></div>
      <div><h3>Challenges & lessons</h3><p>{project.lessons || notebook.lessons}</p></div>
      <div className="case-disclosure"><Icon name="info" /> <strong>Project notebook:</strong> {project.disclosure || notebook.disclosure}</div>
      {project.screenshots.length > 1 && <div className="case-gallery">{project.screenshots.slice(1).map((file, index) => <figure key={file.id || index}><img src={file.url} alt={file.caption || project.name + (file.illustrative ? ' illustrative cover' : ' screenshot')} /><figcaption>{file.illustrative ? 'Illustrative UI concept' : 'Project screenshot'}{file.caption && ' · ' + file.caption}</figcaption></figure>)}</div>}
    </div>
    <div className="case-footer"><ProjectLink className="btn" project={project} kind="repository"><Icon name="github" />GitHub repository</ProjectLink><ProjectLink className="btn" project={project} kind="demo">Open live demo <Icon name="up-right" /></ProjectLink></div>
  </>;
}

export default function ProjectDetails({ overlay = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { portfolio } = usePortfolio();
  const resource = useApiResource(signal => api.getProject(id, { signal }), [id]);
  const project = resource.data;
  useEffect(() => {
    document.title = project ? `${project.name}${portfolio?.profile?.name ? ' — ' + portfolio.profile.name : ''}` : 'Project notebook';
    return () => { document.title = portfolio?.settings?.title || 'Portfolio'; };
  }, [project, portfolio]);
  const missing = resource.error?.status === 404;
  const content = project ? <Notebook project={project} heading={overlay ? 'h2' : 'h1'} /> : missing ? <div className="case-hero"><h1 id="case-title">This project isn't in the notebook.</h1><p>It may be unpublished, moved, or the link may be incomplete.</p><Link className="btn btn-primary" to="/#work">Explore my projects <Icon name="arrow" /></Link></div> : <div className="case-hero"><h2 id="case-title">Project notebook</h2><ApiState status={resource.status} error={resource.error} onRetry={resource.retry} title={resource.status === 'loading' ? 'Loading project…' : 'Project details could not be loaded.'} /></div>;
  if (overlay) return <Modal titleId="case-title" kicker={'Project notebook' + (project ? ' / ' + String((project.sortOrder || 0) + 1).padStart(2, '0') : '')} onClose={() => navigate(-1)}>{content}</Modal>;
  return <main className="container project-page" id="main" tabIndex={-1}><Link className="btn btn-text back-link" to="/#work"><Icon name="arrow" />Back to projects</Link><article className="project-notebook">{content}</article></main>;
}
