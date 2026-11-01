import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useStudio } from '../components/StudioProvider';
import { useResource } from '../hooks/useResource';
import { AssetPicker } from '../components/AssetControls';
import { CardTitle, Errors, PageHeading, State } from '../components/Shared';
import Icon from '../components/Icon';
function CvEditor({ settings, reload }) {
  const { api } = useAuth(), { confirm, notify, changed } = useStudio();
  const [id, setId] = useState(settings.cvAssetId), [published, setPublished] = useState(settings.cvPublished), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const save = async event => {
    event.preventDefault(); if (busy) return;
    if (published && !id) { setError(new Error('Attach a real PDF before publishing the CV.')); return; }
    if ((published && (!settings.cvPublished || id !== settings.cvAssetId) || !published && settings.cvPublished || !id && settings.cvAssetId) && !await confirm({ title: published ? 'Publish this CV?' : 'Update public CV availability?', message: published ? 'Visitors will be able to download this PDF.' : 'The previous CV may stop being publicly available.', label: 'Save CV availability' })) return;
    setBusy(true); setError(null);
    try { await api.patch('settings', null, { cvAssetId: id || null, cvPublished: published }); const result = await reload(); changed(); notify(result ? 'CV settings saved and reloaded.' : 'CV settings saved. Retry loading them.'); }
    catch (error) { setError(error); } finally { setBusy(false); }
  };
  return <form className="admin-editor-grid" onSubmit={save}><section className="admin-card"><CardTitle title="CV management" description="Choose, upload, preview, or replace your PDF." /><div className="admin-card-pad"><AssetPicker value={id} onChange={setId} kind="PDF" label="CV PDF" /><Errors error={error} /></div><div className="admin-form-footer"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save CV settings'} <Icon name="check" /></button></div></section><section className="admin-card"><CardTitle title="How it appears on your portfolio" /><div className="admin-card-pad"><div className="empty-doc"><Icon name="file" /><h3>{id ? 'PDF selected' : 'No CV attached yet.'}</h3><p>Only an attached, published PDF is available to visitors.</p></div><label className="checkbox-field"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} />Publish this CV for visitors</label><p className="form-hint">Uploading alone keeps the file private. Replacing an attachment does not delete the original file.</p></div></section></form>;
}
export default function CvPage() {
  const { api } = useAuth();
  const settings = useResource(signal => api.read('settings', null, { signal }));
  return <><PageHeading title="Your next introduction." description="Upload, preview, or replace your CV as a PDF." />{settings.status !== 'success' ? <State status={settings.status} error={settings.error} retry={settings.reload} /> : settings.data ? <CvEditor key={settings.data.updatedAt} settings={settings.data} reload={settings.reload} /> : <section className="admin-card"><State title="Create website settings first."><p>Your CV reference is part of the website settings.</p><Link className="btn btn-primary" to="/settings">Open website settings</Link></State></section>}</>;
}
