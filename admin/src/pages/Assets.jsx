import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useStudio } from '../components/StudioProvider';
import { useResource } from '../hooks/useResource';
import { AssetPicker, AssetPreview } from '../components/AssetControls';
import { Action, CardTitle, Errors, PageHeading, State } from '../components/Shared';
import Modal from '../components/Modal';
export default function Assets() {
  const { api } = useAuth(), { confirm, notify } = useStudio();
  const assets = useResource(signal => api.all('assets', { signal }));
  const [preview, setPreview] = useState(null), [upload, setUpload] = useState(false), [error, setError] = useState(null), [busy, setBusy] = useState(false);
  const remove = async row => {
    if (!await confirm({ title: 'Delete ' + row.originalName + '?', message: 'Deletion is permanent. The server will refuse if any content, including a draft, still references this file.', label: 'Delete file' })) return;
    setBusy(true); setError(null);
    try { await api.remove('assets', row.id); await assets.reload(); notify('Unreferenced file deleted.'); } catch (error) { setError(error); } finally { setBusy(false); }
  };
  return <><PageHeading title="Files, with a purpose." description="Private originals and files attached to your portfolio."><button className="btn btn-primary" onClick={() => setUpload(true)}>Upload a file</button></PageHeading><Errors error={error} /><section className="admin-card"><CardTitle title="Asset library"><button disabled={busy} onClick={async () => {
    if (!await confirm({ title: 'Reconcile published files?', message: 'This rebuilds published copies and removes copies no longer referenced by public content. Private originals remain intact.', label: 'Reconcile files' })) return;
    setBusy(true); setError(null); try { const result = await api.reconcile(); await assets.reload(); notify(`Checked ${result.data.checked} file records.`); } catch (error) { setError(error); } finally { setBusy(false); }
  }}>Reconcile publication copies</button></CardTitle>{assets.status !== 'success' ? <State status={assets.status} error={assets.error} retry={assets.reload} /> : !assets.data.length ? <State title="No uploaded files yet." /> : <div className="table-wrap"><table className="admin-table"><thead><tr><th>File</th><th>Type</th><th>Size</th><th>Actions</th></tr></thead><tbody>{assets.data.map(row => <tr key={row.id}><td>{row.originalName}</td><td>{row.kind}</td><td>{Math.ceil(row.sizeBytes / 1024)} KB</td><td><div className="action-buttons"><Action icon="eye" label={'Preview ' + row.originalName} onClick={() => setPreview(row)} /><Action icon="trash" label={'Delete ' + row.originalName} disabled={busy} onClick={() => remove(row)} /></div></td></tr>)}</tbody></table></div>}</section>
    {preview && <Modal small titleId="preview-title" kicker="Private file preview" onClose={() => setPreview(null)}><div className="dialog-body"><h2 id="preview-title">{preview.originalName}</h2><AssetPreview id={preview.id} kind={preview.kind} /></div></Modal>}
    {upload && <Modal small titleId="upload-title" kicker="Asset library" onClose={() => setUpload(false)}><div className="dialog-body"><h2 id="upload-title">Upload a file</h2><AssetPicker allowBoth value={null} onChange={async id => { if (id) { await assets.reload(); setUpload(false); } }} /></div></Modal>}
  </>;
}
