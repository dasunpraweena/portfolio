export function createEmailDraft(values, recipient) {
  const fields = Object.fromEntries(['name', 'email', 'subject', 'message'].map(key => [key, String(values[key] || '').trim()]));
  const missing = Object.keys(fields).find(key => !fields[key]);
  if (missing) return { error: 'Please fill in this field.', field: missing };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return { error: 'Please enter a valid email address.', field: 'email' };
  const body = `Hello Dasun,\n\n${fields.message}\n\nFrom: ${fields.name}\nEmail: ${fields.email}`;
  return { href: `mailto:${recipient}?subject=${encodeURIComponent(fields.subject)}&body=${encodeURIComponent(body)}` };
}
