import { useAuth } from '../auth/AuthProvider';
import { useResource } from '../hooks/useResource';
import { resources } from '../data/resources';
import { PageHeading, State } from '../components/Shared';
import RecordForm from '../components/RecordForm';
export default function SingletonPage({ resource }) {
  const { api } = useAuth();
  const record = useResource(signal => api.read(resource, null, { signal }), [resource]);
  return <><PageHeading title={resources[resource].title} description={resources[resource].description} />{record.status === 'success' ? <RecordForm key={resource + (record.data?.updatedAt || 'new')} resource={resource} record={record.data} onSaved={record.reload} /> : <section className="admin-card"><State status={record.status} error={record.error} retry={record.reload} /></section>}</>;
}
