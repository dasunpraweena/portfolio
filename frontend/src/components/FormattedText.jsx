export function Lines({ values = [] }) {
  return values.map((line, index) => <span key={index}>{index > 0 && <br />}{line}</span>);
}
export function Emphasis({ text = '', phrase }) {
  const index = phrase ? text.indexOf(phrase) : -1;
  return index < 0 ? text : <>{text.slice(0, index)}<strong>{phrase}</strong>{text.slice(index + phrase.length)}</>;
}
