import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmailDraft } from '../src/utils/contact.js';
const valid = { name: 'A visitor', email: 'visitor@example.com', subject: 'A project idea', message: 'Let us build something.' };

test('prepares an encoded email draft for the supplied recipient', () => {
  const result = createEmailDraft(valid, 'dasunpraveena@gmail.com');
  assert.ok(result.href.startsWith('mailto:dasunpraveena@gmail.com?'));
  const query = new URLSearchParams(result.href.split('?')[1]);
  assert.equal(query.get('subject'), valid.subject);
  assert.equal(query.get('body'), 'Hello Dasun,\n\nLet us build something.\n\nFrom: A visitor\nEmail: visitor@example.com');
});
test('preserves Unicode, newlines, ampersands, and query-like text in the draft', () => {
  const message = 'Hello 👋\nReact & C#? subject=not-a-header';
  const result = createEmailDraft({ ...valid, name: 'දසුන්', subject: 'Ideas & questions #1', message }, 'dasunpraveena@gmail.com');
  const query = new URLSearchParams(result.href.split('?')[1]);
  assert.equal(query.get('subject'), 'Ideas & questions #1');
  assert.ok(query.get('body').includes(message));
  assert.ok(query.get('body').includes('දසුන්'));
  assert.equal([...query.keys()].length, 2);
});
for (const field of ['name', 'email', 'subject', 'message']) {
  test(`rejects whitespace-only ${field} without preparing a draft`, () => {
    const result = createEmailDraft({ ...valid, [field]: ' \n ' }, 'dasunpraveena@gmail.com');
    assert.equal(result.field, field);
    assert.ok(result.error);
    assert.equal(result.href, undefined);
  });
}
test('rejects an invalid email address', () => {
  assert.equal(createEmailDraft({ ...valid, email: 'not-an-email' }, 'dasunpraveena@gmail.com').field, 'email');
});
test('trims values before creating the draft', () => {
  const result = createEmailDraft({ ...valid, subject: '  Hello  ', name: '  Visitor  ' }, 'dasunpraveena@gmail.com');
  const query = new URLSearchParams(result.href.split('?')[1]);
  assert.equal(query.get('subject'), 'Hello');
  assert.ok(query.get('body').includes('From: Visitor\n'));
});
