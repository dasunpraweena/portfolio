import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useApiResource } from '../hooks/useApiResource';
import ApiState from './ApiState';
import Icon from './Icon';

export default function CvPreview({ cv, onClose }) {
  const resource = useApiResource(signal => api.getFile(cv.url, { signal }), [cv.url]);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!resource.data) { setPreview(null); return; }
    const url = URL.createObjectURL(resource.data);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [resource.data]);
  return <>
    <p>Preview or download my latest CV.</p>
    {resource.status === 'error' ? <ApiState compact error={resource.error} onRetry={resource.retry} title="The CV preview could not be loaded." /> : preview ? <object className="cv-embed" data={preview} type="application/pdf" aria-label="CV preview"><p>Your browser cannot preview this PDF. You can download it below.</p></object> : <ApiState compact status="loading" title="Loading CV…" />}
    <div className="form-actions"><a className="btn btn-primary" href={cv.url} download={cv.fileName}>Download PDF <Icon name="download" /></a><button className="btn" onClick={onClose}>Close</button></div>
  </>;
}
