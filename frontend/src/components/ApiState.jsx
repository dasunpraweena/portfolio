import Icon from './Icon';

export default function ApiState({ status, error, onRetry, title, children, compact = false }) {
  const loading = status === 'loading';
  return <div className={'api-state' + (compact ? ' api-state-compact' : '')} role={error ? 'alert' : 'status'} aria-live="polite" aria-busy={loading}>
    <Icon name={loading ? 'layers' : error ? 'info' : 'folder'} />
    <h3>{title || (loading ? 'Loading portfolio…' : error ? 'This content could not be loaded.' : 'Nothing published here yet.')}</h3>
    {error ? <p>{error.message}</p> : children && <p>{children}</p>}
    {onRetry && !loading && <button className="btn" onClick={onRetry}>Retry <Icon name="arrow" /></button>}
  </div>;
}
