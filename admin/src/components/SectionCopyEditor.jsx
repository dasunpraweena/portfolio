import { useState } from 'react';
import { CardTitle } from './Shared';
import { useStudio } from './StudioProvider';
export default function SectionCopyEditor({ value, onChange, error }) {
  const { confirm } = useStudio();
  const [name, setName] = useState('');
  const update = (key, items) => onChange({ ...value, [key]: items });
  return <section className="admin-card profile-progress"><CardTitle title="Section text" description="Edit saved phrases in their existing positions." /><div className="admin-card-pad">
    {Object.entries(value).map(([key, items]) => <details className="copy-group" key={key}><summary>{key} · {items.length} text items</summary>{items.map((text, index) => <label className="field" key={index}><span>{key} text {index + 1}</span><textarea aria-label={key + ' text ' + (index + 1)} value={text} maxLength={5000} onChange={event => update(key, items.map((item, i) => i === index ? event.target.value : item))} /></label>)}
      <button type="button" className="btn btn-small" disabled={items.length >= 100} onClick={() => update(key, [...items, ''])}>Add text item</button>
      <button type="button" className="btn btn-text" onClick={async () => { if (await confirm({ title: 'Remove this text group?', message: 'The group will be removed when you save website settings. Existing public text depends on its saved positions.', label: 'Remove text group' })) { const next = { ...value }; delete next[key]; onChange(next); } }}>Remove group</button>
    </details>)}
    <label className="field"><span>New text group name</span><input value={name} maxLength={50} onChange={event => setName(event.target.value)} placeholder="For example: hero" /></label>
    <button type="button" className="btn btn-small" disabled={!name.trim() || Object.hasOwn(value, name.trim())} onClick={() => { update(name.trim(), []); setName(''); }}>Add text group</button>
    <p className="form-hint">The public website reads hero, about, skills, learning, journey, contact and footer text. Empty items preserve the position of later phrases.</p>
    {error && <p className="field-error">{error}</p>}
  </div></section>;
}
