import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { createDraft, resources, sectionOptions, serializeDraft } from '../data/resources';
import { useResource } from '../hooks/useResource';
import { AssetPicker, Screenshots } from './AssetControls';
import { CardTitle, Errors, Field } from './Shared';
import { useStudio } from './StudioProvider';
import Icon from './Icon';
import SectionCopyEditor from './SectionCopyEditor';

export default function RecordForm({ resource, record, onSaved, onDirty = () => {}, onBusy = () => {} }) {
  const { api } = useAuth(), { confirm, notify, changed } = useStudio();
  const definition = resources[resource];
  const [draft, setDraft] = useState(() => createDraft(resource, record));
  const base = useRef(JSON.stringify(draft));
  const [errors, setErrors] = useState({}), [error, setError] = useState(null), [busy, setBusy] = useState(false), [savedId, setSavedId] = useState(null);
  const choices = useResource(signal => resource === 'projects' ? api.all('technologies', { signal }) : resource === 'skills' ? api.all('skill-categories', { signal }) : Promise.resolve([]), [resource]);
  const dirty = JSON.stringify(draft) !== base.current;
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => { onBusy(busy); }, [busy, onBusy]);
  useEffect(() => { const guard = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [dirty]);
  const change = (name, value) => { setDraft(previous => ({ ...previous, [name]: value })); setErrors(previous => ({ ...previous, [name]: null })); setError(null); };
  const finish = async row => {
    const next = createDraft(resource, row); base.current = JSON.stringify(next); setDraft(next); setSavedId(null); changed();
    await onSaved?.(row); notify('Changes saved and reloaded.');
  };
  const submit = async event => {
    event.preventDefault(); if (busy) return;
    const result = serializeDraft(resource, draft, { creating: !record });
    setErrors(result.errors); setError(null);
    if (Object.keys(result.errors).length) { event.currentTarget.elements.namedItem(Object.keys(result.errors)[0])?.focus(); return; }
    const publishes = result.data.status === 'PUBLISHED' && record?.status !== 'PUBLISHED' || resource === 'settings' && result.data.cvPublished && (!record?.cvPublished || record.cvAssetId !== result.data.cvAssetId);
    if (publishes && !await confirm({ title: 'Publish these details?', message: 'These details and attached files will become available on the public portfolio.', label: 'Publish and save' })) return;
    setBusy(true);
    try {
      const row = savedId ? await api.read(resource, definition.singleton ? null : savedId) : await api.save(resource, record?.id, result.data, definition.singleton);
      await finish(row);
    } catch (error) { setError(error); if (error.writeSucceeded) setSavedId(error.savedId || 'main'); }
    finally { setBusy(false); }
  };
  const reset = async () => { if (!dirty || await confirm({ title: 'Discard unsaved edits?', message: 'The last loaded version will be restored in this form.', label: 'Discard edits' })) { setDraft(JSON.parse(base.current)); setErrors({}); setError(null); } };
  const moveSection = (index, delta) => { const rows = [...draft.sectionOrder]; [rows[index], rows[index + delta]] = [rows[index + delta], rows[index]]; change('sectionOrder', rows); };
  return <form onSubmit={submit} className="record-form">
    <fieldset disabled={busy || Boolean(savedId)} className={'editor-fieldset' + (definition.singleton ? ' admin-editor-grid' : '')}>
      <section className={definition.singleton ? 'admin-card' : ''}>
        {definition.singleton && <CardTitle title={resource === 'profile' ? 'Profile information' : 'Website settings'} description={definition.description} />}
        <div className={'record-fields ' + (definition.singleton ? 'admin-card-pad' : 'editor-fields')}>
          {definition.fields.map(f => <Field key={f.name} definition={f} value={draft[f.name]} onChange={value => change(f.name, value)} error={errors[f.name]} categories={choices.data || []} />)}
          {choices.error && <><Errors error={choices.error} /><button type="button" className="btn" onClick={choices.reload}>Retry choices</button></>}
          {resource === 'projects' && <>
            <section className="editor-section"><h3>Implementation technologies</h3><p className="form-hint">Keep concept/display tags separate from the tools actually used.</p><div className="technology-options">{choices.data?.map(technology => <label key={technology.id} className="checkbox-field"><input type="checkbox" checked={draft.technologyIds.includes(technology.id)} onChange={event => change('technologyIds', event.target.checked ? [...draft.technologyIds, technology.id] : draft.technologyIds.filter(id => id !== technology.id))} />{technology.name}</label>)}{choices.status === 'loading' && <p role="status">Loading technologies…</p>}{choices.status === 'success' && !choices.data.length && <p className="form-hint">Create technologies from the Technologies page, then reload these choices.</p>}</div><button type="button" className="btn btn-text" onClick={choices.reload}>Reload technologies <Icon name="arrow" /></button></section>
            {errors.technologyIds && <p className="field-error">{errors.technologyIds}</p>}<Screenshots value={draft.screenshots} onChange={value => change('screenshots', value)} />
            <div className="inline-note"><Icon name="info" />New projects are saved as drafts. Use the separate Publish action when you decide they are ready.</div>
          </>}
          {resource === 'certificates' && <AssetPicker allowBoth label="Certificate image or PDF" value={draft.assetId} onChange={value => change('assetId', value)} />}
        </div>
      </section>
      {resource === 'profile' && <aside><section className="admin-card"><CardTitle title="Profile image" /><div className="admin-card-pad"><AssetPicker value={draft.photoAssetId} label="Profile photo" onChange={value => change('photoAssetId', value)} /></div></section><section className="admin-card profile-progress"><CardTitle title="Profile preview" /><div className="admin-profile-preview"><div className="avatar">{draft.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</div><h3>{draft.name || 'Your name'}</h3><p>{draft.headline}</p></div></section></aside>}
      {resource === 'settings' && <aside><section className="admin-card"><CardTitle title="Sections & content order" /><div className="admin-card-pad section-order">{draft.sectionOrder.map((name, index) => <div className="order-row" key={name}><Icon name="drag" /><span className="order-number">{String(index + 1).padStart(2, '0')}</span>{name}<div className="order-actions"><button type="button" className="icon-action" disabled={index === 0} aria-label={'Move ' + name + ' earlier'} onClick={() => moveSection(index, -1)}><Icon name="up-right" /></button><button type="button" className="icon-action" disabled={index === draft.sectionOrder.length - 1} aria-label={'Move ' + name + ' later'} onClick={() => moveSection(index, 1)}><Icon name="down" /></button></div></div>)}<p className="form-hint">Your public website currently keeps its existing section order. This list is saved for future use.</p><label className="field"><span>Add a section to this order</span><select value="" onChange={event => { if (event.target.value) change('sectionOrder', [...draft.sectionOrder, event.target.value]); }}><option value="">Choose section</option>{sectionOptions.filter(name => !draft.sectionOrder.includes(name)).map(name => <option key={name}>{name}</option>)}</select></label></div></section><SectionCopyEditor value={draft.sectionCopy} onChange={value => change('sectionCopy', value)} error={errors.sectionCopy} /></aside>}
    </fieldset>
    <Errors error={error} />
    <div className="admin-form-footer"><button type="button" className="btn" onClick={reset} disabled={busy || Boolean(savedId)}>Reset</button><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : savedId ? 'Reload saved record' : 'Save changes'} <Icon name="check" /></button></div>
  </form>;
}
