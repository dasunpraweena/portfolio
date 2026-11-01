import { useState } from 'react';
import { api } from '../api/client';
import { useApiResource } from '../hooks/useApiResource';
import ApiState from '../components/ApiState';
import { work } from '../data/notebook';
import ProjectCard from '../components/ProjectCard';
import SectionHeading from '../components/SectionHeading';
import Icon from '../components/Icon';

export default function Projects() {
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const resource = useApiResource(signal => api.getProjects({ category: filter, signal }), [filter]);
  const projects = resource.data?.projects || [];
  const visible = filter === 'all' && !showAll ? projects.slice(0, 4) : projects;
  return <section className="section container" id="work">
    <SectionHeading {...work}><div className="project-filters" role="group" aria-label="Filter projects">
      {work.filters.map(([value, label]) => <button key={value} className={'filter' + (filter === value ? ' active' : '')} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
    </div></SectionHeading>
    <div className="project-grid" id="project-grid" aria-live="polite">{resource.status !== 'success' ? <ApiState status={resource.status} error={resource.error} onRetry={resource.retry} title={resource.status === 'loading' ? 'Loading projects…' : 'Projects could not be loaded.'} /> : visible.length ? visible.map(project => <ProjectCard key={project.id} project={project} />) : <ApiState title={filter === 'all' ? 'No published projects yet.' : 'No published projects in this category.'} onRetry={resource.retry}>Projects will appear here when they are published.</ApiState>}</div>
    {filter === 'all' && projects.length > 4 && <div className="more-projects"><button className="btn" id="more-projects" aria-expanded={showAll} aria-controls="project-grid" onClick={() => setShowAll(value => !value)}>{showAll ? 'Show selected projects' : `View all ${projects.length} projects`} <Icon name={showAll ? 'up-right' : 'arrow'} /></button></div>}
    <p className="form-hint project-cover-note">{work.coverNote}</p>
  </section>;
}
