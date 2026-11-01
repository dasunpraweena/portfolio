import { useEffect, useId, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useResource } from '../hooks/useResource';
import { useStudio } from './StudioProvider';
import { Action, Errors } from './Shared';
import Icon from './Icon';
import { validateUpload } from '../lib/uploads';
export function AssetPreview({ id, kind = 'IMAGE' }) {
  const { api } = useAuth();
  const resource = useResource(signal => api.file(id, { signal }), [id]);
  const [url, setUrl] = useState(null);
  useEffect(() => { if (!resource.data) return; const value = URL.createObjectURL(resource.data); setUrl(value); return () => URL.revokeObjectURL(value); }, [resource.data]);
  return resource.error ? <div className="asset-preview-error"><Errors error={resource.error} /><button type="button" className="btn" onClick={resource.reload}>Retry preview</button></div> : url ? kind === 'PDF' ? <object className="cv-embed" data={url} type="application/pdf" aria-label="PDF preview"><a href={url} download="document.pdf">Download PDF</a></object> : <img className="asset-preview" src={url} alt="Selected uploaded image" /> : <p className="form-hint" role="status">Loading preview…</p>;
}
export function AssetPicker({ value, onChange, kind = 'IMAGE', label = 'Select a file', allowBoth = false }) {
  const { api } = useAuth(), { notify } = useStudio();
  const pickerId = useId();
  const assets = useResource(signal => api.all('assets', { signal }));
  const [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const upload = async event => {
    const file = event.target.files[0]; if (!file) return;
    event.target.value = '';
    const type = allowBoth && file.type === 'application/pdf' ? 'PDF' : kind;
    const invalid = validateUpload(file, type); if (invalid) { setError(new Error(invalid)); return; }
    setBusy(true); setError(null);
    try { const asset = await api.upload(file, type); await assets.reload(); onChange(asset.id); notify('File uploaded privately. Save this record to attach it.'); }
    catch (error) { setError(error); }
    finally { setBusy(false); }
  };
  const selected = assets.data?.find(asset => asset.id === value);
  return <div className="asset-picker"><div className="field"><label htmlFor={pickerId}>{label}</label><select id={pickerId} value={value || ''} onChange={event => { setError(null); onChange(event.target.value || null); }} disabled={busy}><option value="">No file attached</option>{assets.data?.filter(asset => allowBoth || asset.kind === kind).map(asset => <option key={asset.id} value={asset.id}>{asset.originalName} · {asset.kind}</option>)}</select></div>
    <label className={'upload-zone' + (busy ? ' uploading' : '')}><Icon name="upload" /><strong>{busy ? 'Uploading…' : 'Upload a new ' + (kind === 'PDF' ? 'PDF' : 'image')}</strong><span>{allowBoth ? 'JPEG, PNG, WebP or PDF' : kind === 'PDF' ? 'PDF · Maximum 10 MB' : 'JPEG, PNG or WebP · Maximum 8 MB'}</span><input className="upload-input" type="file" disabled={busy} accept={allowBoth ? 'image/jpeg,image/png,image/webp,application/pdf' : kind === 'PDF' ? 'application/pdf' : 'image/jpeg,image/png,image/webp'} onChange={upload} /></label>
    <Errors error={error || assets.error} />{assets.error && <button type="button" className="btn" onClick={assets.reload}>Retry files</button>}
    {value && <><p className="form-hint">{selected?.originalName || 'Attached file'}</p><AssetPreview key={value} id={value} kind={selected?.kind || kind} /></>}
  </div>;
}
export function Screenshots({ value, onChange }) {
  const { confirm } = useStudio();
  const [adding, setAdding] = useState(false);
  const move = (index, delta) => { const rows = [...value]; [rows[index], rows[index + delta]] = [rows[index + delta], rows[index]]; onChange(rows); };
  return <section className="editor-section"><h3>Project screenshots</h3><p className="form-hint">Files remain private until attached to published content. Save the project to persist these changes.</p>
    {value.map((file, index) => <div className="screenshot-row" key={file.assetId}><AssetPreview id={file.assetId} /><label className="field"><span>Screenshot {index + 1} caption</span><input value={file.caption || ''} maxLength={500} onChange={event => onChange(value.map((item, i) => i === index ? { ...item, caption: event.target.value } : item))} /></label><label className="checkbox-field"><input type="checkbox" checked={file.illustrative || false} onChange={event => onChange(value.map((item, i) => i === index ? { ...item, illustrative: event.target.checked } : item))} />Illustrative cover, rather than an actual screenshot</label><div className="action-buttons"><Action icon="up-right" label={'Move screenshot ' + (index + 1) + ' earlier'} disabled={index === 0} onClick={() => move(index, -1)} /><Action icon="down" label={'Move screenshot ' + (index + 1) + ' later'} disabled={index === value.length - 1} onClick={() => move(index, 1)} /><Action icon="trash" label={'Detach screenshot ' + (index + 1)} onClick={async () => { if (await confirm({ title: 'Detach this screenshot?', message: 'The file stays in your asset library. Save the project to persist the removal.', label: 'Detach screenshot' })) onChange(value.filter((_, i) => i !== index)); }} /></div></div>)}
    {value.length < 30 && <button type="button" className="btn" onClick={() => setAdding(current => !current)}><Icon name="plus" />Add screenshot</button>}
    {adding && <AssetPicker label="Choose or upload a screenshot" value={null} onChange={id => { if (id && !value.some(item => item.assetId === id)) { onChange([...value, { assetId: id, caption: '', illustrative: false, sortOrder: value.length }]); setAdding(false); } }} />}
  </section>;
}
