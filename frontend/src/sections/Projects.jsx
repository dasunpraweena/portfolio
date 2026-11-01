import { useState } from 'react';
import projects from '../data/projects.json';
import { work } from '../data/notebook';
import ProjectCard from '../components/ProjectCard';
import SectionHeading from '../components/SectionHeading';
import Icon from '../components/Icon';

export default function Projects() {
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const filtered = projects.filter(project => filter === 'all' || project.filter === filter);
  const visible = filter === 'all' && !showAll ? filtered.slice(0, 4) : filtered;
  return <section className="section container" id="work">
    <SectionHeading {...work}><div className="project-filters" role="group" aria-label="Filter projects">
      {work.filters.map(([value, label]) => <button key={value} className={'filter' + (filter === value ? ' active' : '')} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
    </div></SectionHeading>
    <div className="project-grid" id="project-grid" aria-live="polite">{visible.length ? visible.map(project => <ProjectCard key={project.id} project={project} />) : <div className="project-empty"><h3>No projects here yet.</h3><p>Try another category to explore my work.</p></div>}</div>
    {filter === 'all' && projects.length > 4 && <div className="more-projects"><button className="btn" id="more-projects" aria-expanded={showAll} aria-controls="project-grid" onClick={() => setShowAll(value => !value)}>{showAll ? 'Show selected projects' : `View all ${projects.length} projects`} <Icon name={showAll ? 'up-right' : 'arrow'} /></button></div>}
    <p className="form-hint project-cover-note">{work.coverNote}</p>
  </section>;
}
