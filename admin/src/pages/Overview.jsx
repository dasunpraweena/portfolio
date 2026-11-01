import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useResource } from '../hooks/useResource';
import { useStudio } from '../components/StudioProvider';
import { CardTitle, PageHeading, State, Status } from '../components/Shared';
import Icon from '../components/Icon';
export default function Overview() {
  const { api } = useAuth(), { version } = useStudio(), navigate = useNavigate();
  const data = useResource(async signal => {
    const options = { signal };
    const [projects, skills, education, certificates, messages, profile, settings, categories, topics, socials] = await Promise.all([
      api.list('projects', { limit: '4' }, options), ...['skills', 'education', 'certificates', 'messages'].map(resource => api.list(resource, { limit: '1' }, options)),
      api.read('profile', null, options), api.read('settings', null, options), api.list('skill-categories', { limit: '1' }, options), api.all('learning-topics', options), api.all('social-links', options),
    ]);
    return { projects, skills, education, certificates, messages, profile, settings, categories, topics, socials };
  }, [version]);
  const newProject = () => navigate('/projects', { state: { create: true } });
  if (data.status !== 'success') return <><PageHeading title="Your ideas, in one place." description="Your portfolio workspace." /><section className="admin-card"><State status={data.status} error={data.error} retry={data.reload} /></section></>;
  const d = data.data;
  const stats = [['Projects', d.projects.meta.total, 'Project library', 'folder'], ['Skills', d.skills.meta.total, `Across ${d.categories.meta.total} categories`, 'code'], ['Education', d.education.meta.total, 'Academic records', 'school'], ['Certificates', d.certificates.meta.total, 'Achievement records', 'award'], ['Messages', d.messages.meta.total, 'Portfolio enquiries', 'mail']];
  const readiness = [[Boolean(d.profile?.introduction), 'Personal introduction added'], [d.skills.meta.total > 0, 'Skills organised by area'], [d.education.meta.total > 0, 'Education record included'], [Boolean(d.settings?.cvAssetId), 'Latest CV attached'], [d.socials.some(row => row.url), 'Social profile links added']];
  return <>
    <PageHeading title="Your ideas, in one place." description={d.profile?.name ? `Welcome to your portfolio workspace, ${d.profile.name.split(' ')[0]}.` : 'Welcome to your portfolio workspace.'}><button className="btn btn-primary" onClick={newProject}><Icon name="plus" />New project</button></PageHeading>
    <div className="admin-stats">{stats.map(([label, count, caption, icon]) => <div className="admin-stat" key={label}><span>{label}</span><Icon name={icon} /><strong>{count}</strong><small>{caption}</small></div>)}</div>
    <div className="admin-grid"><section className="admin-card"><CardTitle title="Project library" description="Shape the work you want to share."><Link to="/projects">View all →</Link></CardTitle>{d.projects.data.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Project name</th><th>Status</th><th>Actions</th></tr></thead><tbody>{d.projects.data.map(row => <tr key={row.id}><td><div className="project-cell"><span className="project-thumb">{row.name.slice(0, 2).toUpperCase()}</span><div><strong>{row.name}</strong><small>{row.type}</small></div></div></td><td><Status value={row.status} /></td><td><Link className="icon-action" aria-label={'Manage ' + row.name} to="/projects"><Icon name="edit" /></Link></td></tr>)}</tbody></table></div> : <State title="Your first project belongs here." />}<div className="admin-card-pad"><span className="form-hint">Draft outlines stay private until you publish them.</span></div></section>
      <div><section className="admin-card"><CardTitle title="Make your next update" /><div className="quick-actions"><button className="quick-action" onClick={newProject}><Icon name="plus" />New project</button><Link className="quick-action" to="/profile"><Icon name="user" />Edit profile</Link><Link className="quick-action" to="/cv"><Icon name="upload" />Upload CV</Link><Link className="quick-action" to="/settings"><Icon name="settings" />Site settings</Link></div></section><section className="admin-card profile-progress"><CardTitle title="Ready for your next chapter" description="Based on the records currently saved." /><div className="admin-card-pad"><div className="completion-list">{readiness.map(([complete, label]) => <span key={label} className={complete ? '' : 'pending'}><Icon name={complete ? 'check' : 'plus'} />{label}</span>)}</div></div></section></div>
    </div>
    <div className="admin-bottom-row"><section className="admin-card"><CardTitle title="What to complete next" /><div className="activity-list"><div className="activity-item"><Icon name="folder" /><div><strong>Bring your projects to life</strong><p>Add actual screenshots, contributions, and lessons learned.</p></div></div><div className="activity-item"><Icon name="award" /><div><strong>Celebrate verified achievements</strong><p>Keep completed certificates and their evidence together.</p></div></div></div></section><section className="admin-card"><CardTitle title="Learning in progress" description="Your saved learning topics." /><div className="admin-card-pad"><div className="tags">{d.topics.length ? d.topics.map(topic => <span className="tag" key={topic.id}>{topic.title}</span>) : <p className="form-hint">No learning topics added yet.</p>}</div><Link className="btn btn-text" to="/learning-topics">Manage learning topics <Icon name="arrow" /></Link></div></section></div>
  </>;
}
