import { useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { resources } from '../data/resources';
import { useResource } from '../hooks/useResource';
import { useStudio } from './StudioProvider';
import Modal from './Modal';
import RecordForm from './RecordForm';
import { State } from './Shared';

export default function RecordEditor({ resource, id, onClose, onSaved }) {
  const { api } = useAuth(), { confirm } = useStudio();
  const dirty = useRef(false), busy = useRef(false);
  const setDirty = useCallback(value => { dirty.current = value; }, []);
  const setBusy = useCallback(value => { busy.current = value; }, []);
  const record = useResource(signal => id ? api.read(resource, id, { signal }) : Promise.resolve(null), [resource, id]);
  const close = async () => { if (busy.current) return; if (!dirty.current || await confirm({ title: 'Discard unsaved edits?', message: 'Your unsaved form edits will be discarded.', label: 'Discard edits' })) onClose(); };
  return <Modal titleId="editor-title" kicker="Portfolio content" onClose={close}><div className="dialog-body"><h2 id="editor-title">{id ? 'Edit ' : 'Add '}{resources[resource].singular}</h2>{record.status === 'success' ? <RecordForm resource={resource} record={record.data} onDirty={setDirty} onBusy={setBusy} onSaved={async row => { dirty.current = false; await onSaved(row); onClose(); }} /> : <State status={record.status} error={record.error} retry={record.reload} />}</div></Modal>;
}
