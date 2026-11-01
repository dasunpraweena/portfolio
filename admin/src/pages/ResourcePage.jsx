import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { resources, labelFor } from '../data/resources';
import { useResource } from '../hooks/useResource';
import { useStudio } from '../components/StudioProvider';
import { Action, CardTitle, Errors, PageHeading, State, Status } from '../components/Shared';
import RecordEditor from '../components/RecordEditor';
import Icon from '../components/Icon';

export default function ResourcePage({ resource }) {
  const { api } = useAuth(), { changed, confirm, notify } = useStudio();
  const definition = resources[resource];
  const collection = useResource(signal => api.all(resource, { signal }), [resource]);
  const categories = useResource(signal => resource === 'skills' ? api.all('skill-categories', { signal }) : Promise.resolve([]), [resource]);
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all'), [editor, setEditor] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(null), [page, setPage] = useState(1);
  const location = useLocation(), navigate = useNavigate();
  useEffect(() => { setQuery(''); setFilter('all'); setPage(1); setEditor(null); setError(null); }, [resource]);
  useEffect(() => { if (location.state?.create) { setEditor({ id: null }); navigate(location.pathname, { replace: true, state: null }); } }, [location, navigate]);
  const rows = collection.data || [];
  const filtered = rows.filter(row => (filter === 'all' || row.category === filter || row.status === filter) && JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const displayed = filtered.slice((page - 1) * 20, page * 20);
  useEffect(() => { setPage(value => Math.min(value, Math.max(1, Math.ceil(filtered.length / 20)))); }, [filtered.length]);
  const reload = collection.reload;
  const act = async operation => { if (busy) return; setBusy(true); setError(null); try { await operation(); changed(); const result = await reload(); notify(result ? 'Change saved and list reloaded.' : 'Change saved. Retry loading the list.'); } catch (error) { setError(error); } finally { setBusy(false); } };
  const remove = async row => { if (await confirm({ title: 'Delete ' + labelFor(row) + '?', message: 'This permanently removes the record. Attached files remain in the asset library if they are still referenced.', label: 'Delete record' })) act(() => api.remove(resource, row.id)); };
  const publish = async row => { const next = row.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'; if (await confirm({ title: next === 'PUBLISHED' ? 'Publish ' + row.name + '?' : 'Unpublish ' + row.name + '?', message: next === 'PUBLISHED' ? 'This outline and its attached assets will become publicly available. Publication does not verify implementation details.' : 'This project will leave the public portfolio. Shared files remain available if other published content uses them.', label: next === 'PUBLISHED' ? 'Publish project' : 'Unpublish project' })) act(() => api.publish(row.id, next)); };
  const move = (row, delta) => { const ordered = [...rows]; const index = ordered.findIndex(item => item.id === row.id); [ordered[index], ordered[index + delta]] = [ordered[index + delta], ordered[index]]; act(() => api.order(resource, ordered)); };
  return <>
    <PageHeading title={definition.title} description={definition.description}><button className="btn btn-primary" onClick={() => setEditor({ id: null })}><Icon name="plus" />Add {definition.singular}</button></PageHeading>
    <Errors error={error} />
    <section className="admin-card"><CardTitle title={definition.label} description={collection.status === 'success' ? rows.length + ' records' : undefined}>{resource === 'skills' && <button onClick={() => navigate('/skill-categories')}>Manage categories →</button>}</CardTitle>
      <div className="admin-project-toolbar"><div className="admin-search"><Icon name="search" /><input type="search" aria-label={'Search ' + definition.label.toLowerCase()} placeholder={'Find ' + definition.singular + '…'} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></div><div className="toolbar-actions">{resource === 'projects' && <select aria-label="Filter projects" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="all">All projects</option><option value="DRAFT">Drafts</option><option value="PUBLISHED">Published</option><option value="WEB">Web & Mobile</option><option value="SOFTWARE">Software</option><option value="DATA">Data</option></select>}<button className="btn btn-small" onClick={collection.reload} disabled={collection.status === 'loading'}>Refresh</button></div></div>
      {collection.status !== 'success' ? <State status={collection.status} error={collection.error} retry={collection.reload} /> : !filtered.length ? <State title={rows.length ? 'No matching records.' : 'Your next ' + definition.singular + ' belongs here.'}><p>Add your content when you are ready to share it.</p></State> : <>
        <div className="table-wrap"><table className="admin-table"><thead><tr><th>{resource === 'projects' ? 'Project name' : 'Record'}</th><th>{resource === 'projects' ? 'Category' : 'Details'}</th>{resource !== 'technologies' && <th>Status</th>}<th>Actions</th></tr></thead><tbody>{displayed.map(row => <tr key={row.id}><td><div className="project-cell"><span className={'project-thumb ' + (row.category === 'DATA' ? 'blue' : row.category === 'SOFTWARE' ? 'tan' : 'purple')}>{labelFor(row).split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><div><strong>{labelFor(row)}</strong>{row.slug && <small>{row.slug}</small>}</div></div></td><td>{row.type || (resource === 'skills' ? categories.data?.find(category => category.id === row.categoryId)?.name : null) || row.category || row.issuer || row.degree || row.url || '—'}{row.featured && <span className="featured-label">Featured</span>}</td>{resource !== 'technologies' && <td><Status value={row.status} /></td>}<td><div className="action-buttons"><Action icon="edit" label={'Edit ' + labelFor(row)} onClick={() => setEditor({ id: row.id })} disabled={busy} />{resource === 'projects' && <><Action icon="globe" label={(row.status === 'PUBLISHED' ? 'Unpublish ' : 'Publish ') + row.name} onClick={() => publish(row)} disabled={busy} /><Action icon="bolt" label={(row.featured ? 'Unfeature ' : 'Feature ') + row.name} onClick={() => act(() => api.patch(resource, row.id, { featured: !row.featured }))} disabled={busy} /></>}{resource !== 'technologies' && <><Action icon="up-right" label={'Move ' + labelFor(row) + ' earlier'} disabled={busy || rows.indexOf(row) === 0} onClick={() => move(row, -1)} /><Action icon="down" label={'Move ' + labelFor(row) + ' later'} disabled={busy || rows.indexOf(row) === rows.length - 1} onClick={() => move(row, 1)} /></>}<Action icon="trash" label={'Delete ' + labelFor(row)} onClick={() => remove(row)} disabled={busy} /></div></td></tr>)}</tbody></table></div>
        <div className="pagination"><span>{filtered.length} matching records</span><button className="btn btn-small" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {Math.ceil(filtered.length / 20)}</span><button className="btn btn-small" disabled={page * 20 >= filtered.length} onClick={() => setPage(value => value + 1)}>Next</button></div>
      </>}
    </section>
    {resource === 'projects' && <div className="preview-banner"><span>Drafts remain private until you explicitly publish.</span><span>Public website → Projects</span></div>}
    {editor && <RecordEditor resource={resource} id={editor.id} onClose={() => setEditor(null)} onSaved={reload} />}
  </>;
}
