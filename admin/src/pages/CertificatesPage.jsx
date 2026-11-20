import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useResource } from '../hooks/useResource';
import { useStudio } from '../components/StudioProvider';
import { AssetPreview } from '../components/AssetControls';
import { Errors, State } from '../components/Shared';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { validateUpload } from '../lib/uploads';

const slugify = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
const safeUrl = value => {
  if (!value) return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
};
const parseCsv = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean);
const sortCertificates = list => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.title || '').localeCompare(b.title || ''));
const sortCategories = list => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.name || '').localeCompare(b.name || ''));

function CategoryManager({ categories, certificates, onClose, onReload }) {
  const { api } = useAuth(), { confirm, notify, changed } = useStudio();
  const [names, setNames] = useState(() => Object.fromEntries(categories.map(g => [g.id, g.name])));
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setNames(Object.fromEntries(categories.map(g => [g.id, g.name])));
  }, [categories]);

  const run = async (fn, message) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      await fn();
      changed();
      await onReload();
      if (message) notify(message);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const addCategory = async event => {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (categories.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(new Error('A category with that name already exists.'));
      return;
    }
    const slug = slugify(trimmed) || ('category-' + Date.now());
    await run(async () => {
      await api.save('certificate-categories', null, { slug, name: trimmed, visible: true, sortOrder: categories.length });
      setNewName('');
    }, 'Category saved.');
  };

  const saveCategory = async category => {
    const trimmed = (names[category.id] || '').trim();
    if (!trimmed) { setError(new Error('Category name is required.')); return; }
    if (categories.some(g => g.id !== category.id && g.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(new Error('A category with that name already exists.'));
      return;
    }
    await run(() => api.patch('certificate-categories', category.id, { name: trimmed }), 'Category saved.');
  };

  const toggleVisible = category => run(() => api.patch('certificate-categories', category.id, { visible: !category.visible }), category.visible ? 'Category hidden from portfolio.' : 'Category shown on portfolio.');

  const moveCategory = (index, delta) => {
    const ordered = [...categories];
    [ordered[index], ordered[index + delta]] = [ordered[index + delta], ordered[index]];
    run(() => api.order('certificate-categories', ordered), 'Category order updated.');
  };

  const removeCategory = async category => {
    if (certificates.some(c => c.categoryId === category.id)) return;
    if (await confirm({ title: 'Delete category?', message: `Delete empty category “${category.name}”?`, label: 'Delete' })) {
      await run(() => api.remove('certificate-categories', category.id), 'Category deleted.');
    }
  };

  return <Modal titleId="category-title" kicker="Manage categories" small onClose={onClose}>
    <div className="dialog-body cert-studio-modal-body">
      <h2 id="category-title">Manage categories</h2>
      <p className="cert-studio-sub">Rename, reorder or hide a category. Changes apply to your live portfolio.</p>
      <Errors error={error} />
      <div className="cert-category-list">
        {categories.map((g, i) => {
          const count = certificates.filter(c => c.categoryId === g.id).length;
          return <div className="cert-category-row" key={g.id}>
            <input aria-label="Category name" value={names[g.id] ?? g.name} maxLength={60} disabled={busy} onChange={event => setNames(prev => ({ ...prev, [g.id]: event.target.value }))} />
            <span className="cert-count-pill">{count}</span>
            <div className="cert-row-actions">
              <button type="button" className="cert-icon-btn" disabled={busy} onClick={() => saveCategory(g)}>Save</button>
              <button type="button" className="cert-icon-btn" disabled={busy || i === 0} aria-label="Move category up" onClick={() => moveCategory(i, -1)}>↑</button>
              <button type="button" className="cert-icon-btn" disabled={busy || i === categories.length - 1} aria-label="Move category down" onClick={() => moveCategory(i, 1)}>↓</button>
              <button type="button" className="cert-icon-btn" disabled={busy} onClick={() => toggleVisible(g)}>{g.visible ? 'Hide' : 'Show'}</button>
              <button type="button" className="cert-icon-btn" disabled={busy || count > 0} aria-label="Delete empty category" onClick={() => removeCategory(g)}>✕</button>
            </div>
          </div>;
        })}
        {!categories.length && <p className="cert-empty-note">No categories yet. Add your first category below.</p>}
      </div>
      <form className="cert-category-add" onSubmit={addCategory}>
        <input required maxLength={60} aria-label="New category name" placeholder="New category name" value={newName} disabled={busy} onChange={event => setNewName(event.target.value)} />
        <button type="submit" className="btn btn-primary btn-small" disabled={busy}>Add category</button>
      </form>
      <p className="cert-studio-sub" style={{ marginTop: '14px' }}>Move certificates to another category before deleting a category that contains them.</p>
    </div>
  </Modal>;
}

function CertificateEditorModal({ certificate, categories, assets, nextOrder, onClose, onSaved, onAssetsReload }) {
  const { api } = useAuth(), { notify, changed } = useStudio();
  const isEditing = Boolean(certificate);
  const [form, setForm] = useState(() => ({
    title: certificate?.title || '',
    issuer: certificate?.issuer || '',
    categoryId: certificate?.categoryId || categories[0]?.id || '',
    completedAt: certificate?.completedAt ? certificate.completedAt.slice(0, 10) : '',
    description: certificate?.description || '',
    credentialId: certificate?.credentialId || '',
    verificationUrl: certificate?.verificationUrl || '',
    verification: certificate?.verified ? 'verified' : 'unverified',
    slug: certificate?.slug || '',
    skills: Array.isArray(certificate?.skills) ? certificate.skills.join(', ') : '',
    tools: Array.isArray(certificate?.tools) ? certificate.tools.join(', ') : '',
    duration: certificate?.duration || '',
    projectUrl: certificate?.projectUrl || '',
    visibility: certificate?.status === 'PUBLISHED' ? 'public' : 'draft',
    sortOrder: certificate?.sortOrder ?? nextOrder,
    featured: Boolean(certificate?.featured),
    showOnPortfolio: certificate ? certificate.showOnPortfolio !== false : true,
    assetId: certificate?.assetId || null,
  }));
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const selectedAsset = assets.find(a => a.id === form.assetId);

  const update = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(value);
      return next;
    });
    setError(null);
  };

  const handleUploadFile = async file => {
    if (!file || uploading) return;
    const kind = file.type === 'application/pdf' ? 'PDF' : 'IMAGE';
    const invalid = validateUpload(file, kind);
    if (invalid) { setError(new Error(invalid)); return; }
    setUploading(true); setError(null);
    try {
      const uploaded = await api.upload(file, kind);
      await onAssetsReload();
      setForm(prev => ({ ...prev, assetId: uploaded.id }));
      notify('Certificate file uploaded privately. Save the certificate to attach it.');
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (saving || uploading) return;
    const title = form.title.trim();
    const issuer = form.issuer.trim();
    const slug = form.slug.trim();
    const verificationUrl = form.verificationUrl.trim();
    const projectUrl = form.projectUrl.trim();
    const verified = form.verification === 'verified';

    if (!title) { setError(new Error('Certificate title is required.')); return; }
    if (!issuer) { setError(new Error('Issuing organisation is required.')); return; }
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setError(new Error('URL slug must be unique lowercase words separated by hyphens.')); return; }
    if (verificationUrl && !safeUrl(verificationUrl)) { setError(new Error('Verification URL must begin with https:// or http://.')); return; }
    if (projectUrl && !safeUrl(projectUrl)) { setError(new Error('Related project URL must begin with https:// or http://.')); return; }
    if (verified && !verificationUrl) { setError(new Error('Add an official verification URL before marking this verified.')); return; }

    const orderNum = Number(form.sortOrder);
    if (!Number.isInteger(orderNum) || orderNum < 0) { setError(new Error('Display order must be a whole number 0 or greater.')); return; }

    const payload = {
      slug,
      title,
      issuer,
      categoryId: form.categoryId || null,
      description: form.description.trim() || null,
      completedAt: form.completedAt || null,
      credentialId: form.credentialId.trim() || null,
      verificationUrl: verificationUrl || null,
      verified,
      skills: parseCsv(form.skills),
      tools: parseCsv(form.tools),
      duration: form.duration.trim() || null,
      projectUrl: projectUrl || null,
      featured: Boolean(form.featured),
      showOnPortfolio: Boolean(form.showOnPortfolio),
      assetId: form.assetId || null,
      status: form.visibility === 'public' ? 'PUBLISHED' : 'DRAFT',
      sortOrder: orderNum,
    };

    setSaving(true); setError(null);
    try {
      await api.save('certificates', certificate?.id || null, payload);
      changed();
      await onSaved();
      notify('Certificate saved.');
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return <Modal titleId="cert-editor-title" kicker={isEditing ? 'Edit certificate' : 'Add certificate'} onClose={onClose}>
    <form className="cert-editor-form" onSubmit={handleSubmit}>
      <div className="cert-editor-intro">
        <h2 id="cert-editor-title">{isEditing ? 'Edit certificate' : 'Add certificate'}</h2>
        <p>Add a certificate or achievement to your portfolio.</p>
      </div>
      <div className="cert-form-body">
        <div className="cert-column">
          <section className="cert-panel">
            <div className="cert-panel-title"><span className="cert-step">1</span><div><strong>Basic information</strong><small>Main details about your certificate.</small></div></div>
            <div className="cert-panel-body">
              <div className="cert-row">
                <label className="cert-field"><span>Certificate / achievement title <b className="cert-req">*</b></span><input required maxLength={300} value={form.title} onChange={e => update('title', e.target.value)} /></label>
                <label className="cert-field"><span>Issuing organisation <b className="cert-req">*</b></span><input list="cert-issuers-list" required maxLength={300} value={form.issuer} onChange={e => update('issuer', e.target.value)} /><datalist id="cert-issuers-list"><option value="Google" /><option value="Coursera" /><option value="Udemy" /><option value="University" /></datalist></label>
              </div>
              <div className="cert-row">
                <label className="cert-field"><span>Category</span><select value={form.categoryId} onChange={e => update('categoryId', e.target.value)}><option value="">Uncategorized</option>{categories.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
                <label className="cert-field"><span>Completion date</span><input type="date" value={form.completedAt} onChange={e => update('completedAt', e.target.value)} /></label>
              </div>
              <label className="cert-field"><span>Description</span><textarea maxLength={300} value={form.description} onChange={e => update('description', e.target.value)} /><small>{form.description.length} / 300</small></label>
            </div>
          </section>

          <section className="cert-panel">
            <div className="cert-panel-title"><span className="cert-step">2</span><div><strong>Verification details</strong><small>Links and details visitors can check.</small></div></div>
            <div className="cert-panel-body">
              <div className="cert-row">
                <label className="cert-field"><span>Credential ID</span><input maxLength={300} placeholder="Optional credential ID" value={form.credentialId} onChange={e => update('credentialId', e.target.value)} /><small>Provided by the issuing organisation.</small></label>
                <label className="cert-field"><span>Verification URL</span><input type="url" maxLength={2048} placeholder="https://issuer.com/verify/…" value={form.verificationUrl} onChange={e => update('verificationUrl', e.target.value)} /><small>Use the issuer’s official verification page.</small></label>
              </div>
              <div className="cert-row">
                <label className="cert-field"><span>Verification status</span><select value={form.verification} onChange={e => update('verification', e.target.value)}><option value="unverified">Not verified</option><option value="verified">Verified</option></select><small>Verified requires an official verification URL.</small></label>
                <label className="cert-field"><span>URL slug <b className="cert-req">*</b></span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} placeholder="foundations-of-cybersecurity" value={form.slug} onChange={e => { setSlugTouched(true); update('slug', e.target.value); }} /><small>Unique, lowercase words separated by hyphens.</small></label>
              </div>
            </div>
          </section>
        </div>

        <div className="cert-column">
          <section className="cert-panel">
            <div className="cert-panel-title"><span className="cert-step">3</span><div><strong>Certificate file</strong><small>Add an image or PDF.</small></div></div>
            <div className="cert-panel-body">
              <div className="cert-row">
                <label
                  className={'cert-drop' + (dragActive ? ' drag' : '')}
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={e => { e.preventDefault(); setDragActive(false); handleUploadFile(e.dataTransfer?.files?.[0]); }}
                >
                  <span aria-hidden="true">⇧</span>
                  <strong>{uploading ? 'Uploading…' : 'Drop your certificate here'}</strong>
                  <small>or click to browse</small>
                  <small>PDF (10 MB), PNG, JPG, WebP (8 MB)</small>
                  <input ref={fileInputRef} type="file" disabled={uploading} accept="image/png,image/jpeg,image/webp,application/pdf" style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }} onChange={e => { handleUploadFile(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
                <div className="cert-upload-preview">
                  {form.assetId ? <>
                    <AssetPreview key={form.assetId} id={form.assetId} kind={selectedAsset?.kind || 'IMAGE'} />
                    <small>{selectedAsset?.originalName || 'Attached file'}</small>
                    <button type="button" className="cert-icon-btn" onClick={() => update('assetId', null)}>Remove file</button>
                  </> : <>
                    <small>File preview</small>
                    <small>Your selected certificate appears here.</small>
                  </>}
                </div>
              </div>
              {assets.length > 0 && <label className="cert-field"><span>Or select an existing uploaded file</span><select value={form.assetId || ''} disabled={uploading} onChange={e => update('assetId', e.target.value || null)}><option value="">No file attached</option>{assets.map(asset => <option key={asset.id} value={asset.id}>{asset.originalName} · {asset.kind}</option>)}</select></label>}
            </div>
          </section>

          <section className="cert-panel">
            <div className="cert-panel-title"><span className="cert-step">4</span><div><strong>Skills & additional information</strong><small>Skills, tools and related work.</small></div></div>
            <div className="cert-panel-body">
              <label className="cert-field"><span>Skills acquired</span><input placeholder="Cybersecurity, Security fundamentals" value={form.skills} onChange={e => update('skills', e.target.value)} /><small>Separate skills with commas.</small></label>
              <label className="cert-field"><span>Technologies / tools</span><input placeholder="Linux, SQL, Network security" value={form.tools} onChange={e => update('tools', e.target.value)} /></label>
              <div className="cert-row">
                <label className="cert-field"><span>Course duration</span><input maxLength={100} placeholder="e.g. 6 hours" value={form.duration} onChange={e => update('duration', e.target.value)} /></label>
                <label className="cert-field"><span>Related project URL</span><input type="url" maxLength={2048} placeholder="https://github.com/…" value={form.projectUrl} onChange={e => update('projectUrl', e.target.value)} /></label>
              </div>
            </div>
          </section>

          <section className="cert-panel">
            <div className="cert-panel-title"><span className="cert-step">5</span><div><strong>Display settings</strong><small>Control how this appears on your portfolio.</small></div></div>
            <div className="cert-panel-body cert-row">
              <div>
                <label className="cert-field"><span>Visibility <b className="cert-req">*</b></span><select value={form.visibility} onChange={e => update('visibility', e.target.value)}><option value="public">Public</option><option value="draft">Draft</option></select></label>
                <label className="cert-field" style={{ marginTop: '10px' }}><span>Display order</span><input type="number" min="0" step="1" required value={form.sortOrder} onChange={e => update('sortOrder', e.target.value)} /><small>Lower numbers appear first.</small></label>
              </div>
              <div className="cert-checks">
                <label><input type="checkbox" checked={form.featured} onChange={e => update('featured', e.target.checked)} />Featured certificate</label>
                <label><input type="checkbox" checked={form.showOnPortfolio} onChange={e => update('showOnPortfolio', e.target.checked)} />Show on portfolio</label>
                <small>A public certificate also needs an enabled category.</small>
              </div>
            </div>
          </section>
        </div>
      </div>

      {error && <div style={{ padding: '0 18px' }}><Errors error={error} /></div>}

      <div className="cert-dialog-footer">
        <button type="button" className="btn" onClick={onClose} disabled={saving || uploading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save certificate'} <Icon name="check" /></button>
      </div>
    </form>
  </Modal>;
}

export default function CertificatesPage() {
  const { api } = useAuth(), { confirm, notify, changed } = useStudio();
  const certResource = useResource(signal => api.all('certificates', { signal }), []);
  const catResource = useResource(signal => api.all('certificate-categories', { signal }), []);
  const assetResource = useResource(signal => api.all('assets', { signal }), []);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editorState, setEditorState] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  const certificates = sortCertificates(certResource.data || []);
  const categories = sortCategories(catResource.data || []);
  const assets = assetResource.data || [];

  const categoryMap = new Map(categories.map(g => [g.id, g]));
  const isVisibleOnPortfolio = c => c.status === 'PUBLISHED' && c.showOnPortfolio !== false && (!c.categoryId || categoryMap.get(c.categoryId)?.visible !== false);
  const visibleCount = certificates.filter(isVisibleOnPortfolio).length;

  const filtered = certificates.filter(c => {
    const matchesCategory = categoryFilter === 'all' || c.categoryId === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (c.title + ' ' + c.issuer).toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const reloadAll = async () => {
    await Promise.all([certResource.reload(), catResource.reload()]);
  };

  const handleTogglePublish = async cert => {
    if (busy) return;
    setBusy(true); setActionError(null);
    const nextStatus = cert.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.patch('certificates', cert.id, { status: nextStatus });
      changed();
      await certResource.reload();
      notify(nextStatus === 'PUBLISHED' ? 'Certificate published.' : 'Certificate moved to draft.');
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async cert => {
    if (busy) return;
    const confirmed = await confirm({
      title: 'Delete certificate?',
      message: `Delete “${cert.title}”? Attached files remain in your asset library until removed separately.`,
      label: 'Delete',
    });
    if (!confirmed) return;
    setBusy(true); setActionError(null);
    try {
      await api.remove('certificates', cert.id);
      changed();
      await certResource.reload();
      notify('Certificate deleted.');
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const openAdd = () => {
    if (!categories.length) {
      notify('Add a category first.');
      setShowCategories(true);
      return;
    }
    setEditorState({ certificate: null });
  };

  const loading = certResource.status === 'loading' || catResource.status === 'loading';
  const loadError = certResource.error || catResource.error;

  return <div className="cert-studio-admin">
    <div className="admin-title-row">
      <div>
        <h1>Certifications &amp; achievements<span className="cert-accent">.</span></h1>
        <p>Organize your credentials. Choose what appears on your portfolio.</p>
      </div>
      <div className="admin-heading-actions">
        <button type="button" className="btn" onClick={() => setShowCategories(true)}>Manage categories</button>
        <button type="button" className="btn btn-primary" onClick={openAdd}><Icon name="plus" />Add certificate</button>
      </div>
    </div>

    <Errors error={actionError} />

    <div className="cert-stats">
      <div className="cert-stat"><strong>{certificates.length}</strong><span>Certificates &amp; achievements</span></div>
      <div className="cert-stat"><strong>{visibleCount}</strong><span>Visible on portfolio</span></div>
      <div className="cert-stat"><strong>{categories.length}</strong><span>Categories</span></div>
    </div>

    <section className="admin-card">
      <div className="admin-project-toolbar">
        <div className="admin-search">
          <Icon name="search" />
          <input type="search" aria-label="Search certificates" placeholder="Search certificates or issuers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="toolbar-actions">
          <select aria-label="Filter by category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button type="button" className="btn btn-small" onClick={reloadAll} disabled={loading}>Refresh</button>
        </div>
      </div>

      {loading && !certificates.length ? <State status="loading" /> : loadError ? <State status="error" error={loadError} retry={reloadAll} /> : (
        <div className="table-wrap">
          <table className="admin-table cert-admin-table">
            <thead>
              <tr>
                <th>Certificate</th>
                <th>Category</th>
                <th>Visibility</th>
                <th>Completed</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(c => {
                const catName = c.categoryId ? (categoryMap.get(c.categoryId)?.name || 'Uncategorized') : 'Uncategorized';
                const visible = isVisibleOnPortfolio(c);
                return <tr key={c.id}>
                  <td>
                    <strong className="cert-table-title">{c.title}{c.featured ? ' ★' : ''}</strong>
                    <small className="cert-table-sub">{c.issuer}</small>
                  </td>
                  <td>{catName}</td>
                  <td>
                    <span className={c.status === 'PUBLISHED' ? 'cert-status-public' : ''}>{c.status === 'PUBLISHED' ? 'Public' : 'Draft'}</span>
                    {!visible && <><br /><small className="cert-table-sub">Hidden from portfolio</small></>}
                  </td>
                  <td>{c.completedAt ? c.completedAt.slice(0, 10) : '—'}</td>
                  <td>{c.sortOrder}</td>
                  <td>
                    <div className="cert-row-actions">
                      <button type="button" className="cert-icon-btn" disabled={busy} onClick={() => setEditorState({ certificate: c })}>Edit</button>
                      <button type="button" className="cert-icon-btn" disabled={busy} onClick={() => handleTogglePublish(c)}>{c.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>
                      <button type="button" className="cert-icon-btn" disabled={busy} aria-label={'Delete ' + c.title} onClick={() => handleDelete(c)}>✕</button>
                    </div>
                  </td>
                </tr>;
              }) : <tr><td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>{certificates.length ? 'No matching certificates.' : 'No certificates added yet. Click “Add certificate” to create your first one.'}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>

    {showCategories && <CategoryManager categories={categories} certificates={certificates} onClose={() => setShowCategories(false)} onReload={reloadAll} />}
    {editorState && <CertificateEditorModal certificate={editorState.certificate} categories={categories} assets={assets} nextOrder={certificates.length + 1} onClose={() => setEditorState(null)} onSaved={reloadAll} onAssetsReload={assetResource.reload} />}
  </div>;
}
