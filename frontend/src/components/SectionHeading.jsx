export default function SectionHeading({ number, label, title, description, children }) {
  return <div className="section-heading"><div>
    <p className="section-label"><span>{number} /</span>{label}</p>
    <h2>{title}</h2>
    {description && <p className="section-subtitle">{description}</p>}
  </div>{children}</div>;
}
