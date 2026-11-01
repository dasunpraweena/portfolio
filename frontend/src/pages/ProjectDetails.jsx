import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import projects from '../data/projects.json';
import { notebook } from '../data/notebook';
import Modal from '../components/Modal';
import ProjectVisual from '../components/ProjectVisual';
import Icon from '../components/Icon';
import { ProjectLink } from '../components/ContentActions';

function Notebook({ project, heading = 'h1' }) {
  const Heading = heading;
  return <>
    <div className="case-hero"><span className="badge">{project.type} · Project brief</span><Heading id="case-title">{project.name}</Heading><p>{project.short}</p><div className="tags">{project.tech.map(tag => <span className="tag" key={tag}>{tag}</span>)}<span className="tag">Status: {project.status || 'to be confirmed'}</span></div></div>
    <div className="case-visual"><ProjectVisual project={project} interactive={false} /></div>
    <div className="case-content">
      <div><h3>The problem</h3><p>{project.problem}</p></div>
      <div><h3>The proposed solution</h3><p>{project.solution}</p></div>
      <div><h3>Feature direction</h3><ul>{project.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div>
      <div><h3>Technology</h3><p>{project.technologies?.join(' · ') || (['software', 'data'].includes(project.filter) ? project.tech.join(' · ') : notebook.technology)}</p></div>
      <div><h3>My contribution</h3><p>{project.contribution || notebook.contribution}</p></div>
      <div><h3>Challenges & lessons</h3><p>{project.lessons || notebook.lessons}</p></div>
      <div className="case-disclosure"><Icon name="info" /> <strong>Project notebook:</strong> {notebook.disclosure}</div>
    </div>
    <div className="case-footer"><ProjectLink className="btn" project={project} kind="repository"><Icon name="github" />GitHub repository</ProjectLink><ProjectLink className="btn" project={project} kind="demo">Open live demo <Icon name="up-right" /></ProjectLink></div>
  </>;
}

export default function ProjectDetails({ overlay = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects.find(item => item.id === id);
  useEffect(() => {
    document.title = project ? `${project.name} — Dasun Praweena` : 'Project not found — Dasun Praweena';
    return () => { document.title = 'Dasun Praweena — Ideas to code. Code to impact.'; };
  }, [project]);
  const content = project ? <Notebook project={project} heading={overlay ? 'h2' : 'h1'} /> : <div className="case-hero"><h1 id="case-title">This project isn't in the notebook.</h1><p>It may have moved, or the link may be incomplete.</p><Link className="btn btn-primary" to="/#work">Explore my projects <Icon name="arrow" /></Link></div>;
  if (overlay) return <Modal titleId="case-title" kicker={'Project notebook / ' + String(projects.indexOf(project) + 1).padStart(2, '0')} onClose={() => navigate(-1)}>{content}</Modal>;
  return <main className="container project-page" id="main" tabIndex={-1}><Link className="btn btn-text back-link" to="/#work"><Icon name="arrow" />Back to projects</Link><article className="project-notebook">{content}</article></main>;
}
