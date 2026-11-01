export function validateMessage(values) {
  const limits = { name: 100, email: 200, subject: 200, message: 5000 };
  const data = Object.fromEntries(Object.keys(limits).map(key => [key, String(values[key] || '').trim()]));
  for (const [field, limit] of Object.entries(limits)) {
    if (!data[field]) return { error: 'Please fill in this field.', field };
    if (data[field].length > limit) return { error: `Please use no more than ${limit} characters.`, field };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: 'Please enter a valid email address.', field: 'email' };
  return { data };
}
