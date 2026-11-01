import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessage } from '../src/utils/contact.js';
const valid = { name: 'A visitor', email: 'visitor@example.com', subject: 'A project idea', message: 'Hello 👋\nReact & C#?' };
test('creates the documented, trimmed JSON payload without extra fields', () => {
  assert.deepEqual(validateMessage({ ...valid, name: '  A visitor ', subject: ' A project idea ', admin: true }), { data: valid });
});
for (const field of ['name', 'email', 'subject', 'message']) test(`rejects whitespace-only ${field}`, () => {
  const result = validateMessage({ ...valid, [field]: ' \n ' }); assert.equal(result.field, field); assert.equal(result.data, undefined);
});
test('rejects malformed email addresses and overlong messages', () => {
  assert.equal(validateMessage({ ...valid, email: 'invalid' }).field, 'email');
  assert.equal(validateMessage({ ...valid, message: 'a'.repeat(5001) }).field, 'message');
});
test('retains Unicode, punctuation, and newlines in the message body', () => {
  assert.equal(validateMessage(valid).data.message, valid.message);
});
