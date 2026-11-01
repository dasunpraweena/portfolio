import { Link, useLocation } from 'react-router-dom';
import ProjectVisual from './ProjectVisual';
import Icon from './Icon';
import { ProjectLink } from './ContentActions';

export default function ProjectCard({ project }) {
  const location = useLocation();
  const target = '/projects/' + project.id;
  const state = { backgroundLocation: location };
  return <article className="project-card">
    <ProjectVisual project={project} />
    <div className="project-info"><h3><Link to={target} state={state}>{project.name}</Link></h3><span className="project-type">{project.type}</span></div>
    <p className="project-description">{project.short}</p>
    <div className="tags">{project.tech.map(tag => <span className="tag" key={tag}>{tag}</span>)}<span className="tag">{project.verified ? 'Verified details' : 'Details to verify'}</span></div>
    <div className="project-links">
      <Link to={target} state={state}>Project notebook <Icon name="up-right" /></Link>
      <ProjectLink project={project} kind="repository"><Icon name="github" />Repository</ProjectLink>
      <ProjectLink project={project} kind="demo">Live demo <Icon name="up-right" /></ProjectLink>
    </div>
  </article>;
}
