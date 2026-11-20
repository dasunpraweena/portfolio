import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useApiResource } from '../hooks/useApiResource';
import { usePortfolio } from './PortfolioProvider';
import Modal from './Modal';
import ApiState from './ApiState';

const formatDate = value => (value ? String(value).slice(0, 10) : '');

function CertificatePdfViewer({ url, title }) {
  const resource = useApiResource(signal => api.getFile(url, { signal }), [url]);
  const [blobUrl, setBlobUrl] = useState(null);
  useEffect(() => {
    if (!resource.data) { setBlobUrl(null); return; }
    const objectUrl = URL.createObjectURL(resource.data);
    setBlobUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [resource.data]);

  if (resource.status === 'error') {
    return <ApiState compact error={resource.error} onRetry={resource.retry} title="The certificate PDF could not be loaded." />;
  }
  if (!blobUrl) {
    return <ApiState compact status="loading" title="Loading certificate PDF…" />;
  }
  return <iframe className="cert-viewer-pdf" title={`${title} PDF`} src={blobUrl} />;
}

export default function CertificatesSection() {
  const { portfolio } = usePortfolio();
  const categories = portfolio?.certificateCategories || [];
  const certificates = portfolio?.certificates || [];

  const [selected, setSelected] = useState('all');
  const [viewing, setViewing] = useState(null);

  const sortedCertificates = [...certificates].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.title || '').localeCompare(b.title || ''));
  const hasUncategorized = sortedCertificates.some(c => !c.categoryId || !categories.some(g => g.id === c.categoryId));

  const allGroups = [
    ...categories.map(g => ({ id: g.id, name: g.name })),
    ...(hasUncategorized ? [{ id: '__uncategorized__', name: 'Certificates' }] : []),
  ];

  const activeFilter = selected === 'all' || allGroups.some(g => g.id === selected) ? selected : 'all';

  const groupRows = groupId => sortedCertificates.filter(c => {
    if (groupId === '__uncategorized__') return !c.categoryId || !categories.some(g => g.id === c.categoryId);
    return c.categoryId === groupId;
  });

  const visibleGroups = allGroups
    .filter(g => activeFilter === 'all' || activeFilter === g.id)
    .map(g => ({ ...g, rows: groupRows(g.id) }))
    .filter(g => g.rows.length > 0);

  return (
    <div className="cert-section" id="certificates" aria-labelledby="certificates-heading">
      <p className="mono cert-accent">Certifications &amp; achievements</p>
      <h3 id="certificates-heading" className="cert-section-title">
        Learning, put into practice<span className="cert-accent">.</span>
      </h3>
      <p className="cert-subtitle">
        A growing collection of courses, credentials and milestones, organized by area.
      </p>

      {allGroups.length > 0 && (
        <div className="cert-filters" role="group" aria-label="Certificate categories">
          <button
            type="button"
            className={'cert-chip' + (activeFilter === 'all' ? ' active' : '')}
            aria-pressed={activeFilter === 'all'}
            onClick={() => setSelected('all')}
          >
            All categories <span>· {sortedCertificates.length}</span>
          </button>
          {allGroups.map(g => (
            <button
              type="button"
              key={g.id}
              className={'cert-chip' + (activeFilter === g.id ? ' active' : '')}
              aria-pressed={activeFilter === g.id}
              onClick={() => setSelected(g.id)}
            >
              {g.name} · {groupRows(g.id).length}
            </button>
          ))}
        </div>
      )}

      {visibleGroups.length > 0 ? (
        visibleGroups.map(group => (
          <section className="cert-group" key={group.id}>
            <div className="cert-group-title">
              <h4>{group.name}</h4>
              <span className="cert-count">{group.rows.length}</span>
            </div>
            <div className="cert-grid">
              {group.rows.map(c => {
                const isImage = c.file && c.file.kind === 'IMAGE';
                const dateStr = formatDate(c.completedAt);
                return (
                  <article className="cert-card" key={c.slug}>
                    <button
                      type="button"
                      className={'cert-cover' + (c.file ? ' has-file' : '')}
                      aria-label={'View ' + c.title}
                      onClick={() => setViewing(c)}
                    >
                      {isImage ? (
                        <img src={c.file.url} alt={`${c.title} certificate`} />
                      ) : (
                        <div className="cert-paper">
                          <small>{c.file ? 'DOCUMENT' : 'CERTIFICATE'}</small>
                          <strong>{c.title}</strong>
                          <span>{c.issuer}</span>
                        </div>
                      )}
                    </button>
                    <div className="cert-card-content">
                      <div className="cert-card-top">
                        <span className="cert-badge">{c.categoryName || group.name}</span>
                        {c.featured && <span className="cert-badge cert-featured">★ Featured</span>}
                      </div>
                      <h5>{c.title}</h5>
                      <small className="cert-issuer">{c.issuer}</small>
                      {c.description && <p className="cert-desc">{c.description}</p>}
                      {c.skills?.length > 0 && (
                        <div className="cert-tags">
                          {c.skills.slice(0, 3).map(tag => (
                            <span className="cert-tag" key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="cert-card-footer">
                        <small>
                          {dateStr}
                          {c.verified ? (dateStr ? ' · ✓ Verified' : '✓ Verified') : ''}
                        </small>
                        <button type="button" className="cert-icon-btn" onClick={() => setViewing(c)}>
                          View details ↗
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      ) : (
        <p className="cert-empty">No published certificates in this category yet.</p>
      )}

      {viewing && (
        <Modal titleId="cert-viewer-title" kicker="Certificate" onClose={() => setViewing(null)}>
          <div className="cert-viewer-body">
            <h2 id="cert-viewer-title" className="cert-viewer-title">{viewing.title}</h2>
            {viewing.file ? (
              viewing.file.kind === 'IMAGE' ? (
                <img className="cert-viewer-img" src={viewing.file.url} alt={viewing.title} />
              ) : (
                <CertificatePdfViewer url={viewing.file.url} title={viewing.title} />
              )
            ) : (
              <p className="cert-empty">No certificate file has been attached.</p>
            )}

            <p className="cert-subtitle" style={{ marginTop: '18px' }}>
              {[viewing.issuer, formatDate(viewing.completedAt)].filter(Boolean).join(' · ')}
            </p>
            {viewing.description && <p className="cert-viewer-desc">{viewing.description}</p>}
            {(viewing.skills?.length > 0 || viewing.tools?.length > 0 || viewing.duration) && (
              <p className="cert-subtitle">
                {[
                  viewing.skills?.length ? viewing.skills.join(', ') : '',
                  viewing.tools?.length ? viewing.tools.join(', ') : '',
                  viewing.duration || '',
                ].filter(Boolean).join(' · ')}
              </p>
            )}
            {viewing.credentialId && (
              <p className="cert-subtitle">Credential ID · {viewing.credentialId}</p>
            )}
            <div className="cert-viewer-actions">
              {viewing.verificationUrl && (
                <a className="btn" href={viewing.verificationUrl} target="_blank" rel="noopener noreferrer">
                  Verify credential ↗
                </a>
              )}
              {viewing.projectUrl && (
                <a className="btn" href={viewing.projectUrl} target="_blank" rel="noopener noreferrer">
                  Related project ↗
                </a>
              )}
              {viewing.file?.kind === 'PDF' && (
                <a className="btn" href={viewing.file.url} target="_blank" rel="noopener noreferrer">
                  Download PDF ↗
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
