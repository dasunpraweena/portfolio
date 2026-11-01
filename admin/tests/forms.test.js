import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, serializeDraft } from '../src/data/resources.js';
import { validateUpload } from '../src/lib/uploads.js';
const project = { ...createDraft('projects'), name: 'A project', slug: 'a-project', short: 'Summary', problem: 'A real problem', solution: 'A proposed solution' };
test('projects remain drafts on creation and publication is excluded from ordinary edits', () => {
  const draft = { ...project, status: 'PUBLISHED', uploaderId: 'untrusted', technologies: [], technologyIds: ['technology', 'technology'] };
  const created = serializeDraft('projects', draft, { creating: true });
  assert.deepEqual(created.errors, {}); assert.equal(created.data.status, 'DRAFT');
  assert.equal(Object.hasOwn(created.data, 'uploaderId'), false); assert.deepEqual(created.data.technologyIds, ['technology']);
  assert.equal(Object.hasOwn(serializeDraft('projects', draft).data, 'status'), false);
});
test('round-trips API relationships without leaking asset internals into payloads', () => {
  const draft = createDraft('projects', { ...project, technologies: [{ technologyId: 'tech', technology: { name: 'React' } }], screenshots: [{ assetId: 'asset', caption: '  Example  ', illustrative: false, sortOrder: 7, asset: { storagePath: 'private' } }] });
  const result = serializeDraft('projects', draft);
  assert.deepEqual(result.data.technologyIds, ['tech']);
  assert.deepEqual(result.data.screenshots, [{ assetId: 'asset', caption: 'Example', illustrative: false, sortOrder: 0 }]);
});
test('validates required text, URL formats, dates, ordering and slugs', () => {
  const result = serializeDraft('projects', { ...project, name: '  ', slug: 'Bad slug', sortOrder: -1, demoUrl: 'javascript:alert(1)', repositoryUrl: 'https://user:password@example.com' });
  for (const key of ['name', 'slug', 'sortOrder', 'demoUrl', 'repositoryUrl']) assert.ok(result.errors[key]);
  const dates = serializeDraft('education', { ...createDraft('education'), startDate: '2026-05-01', endDate: '2025-05-01' });
  assert.ok(dates.errors.endDate);
});
test('normalizes absent optional dates/URLs and newline arrays', () => {
  const draft = { ...createDraft('education'), coursework: 'Software Engineering\n\n  Databases  ', startDate: '', endDate: '' };
  const { data } = serializeDraft('education', draft);
  assert.equal(data.startDate, null); assert.equal(data.endDate, null); assert.deepEqual(data.coursework, ['Software Engineering', 'Databases']);
  assert.equal(serializeDraft('projects', project).data.demoUrl, null);
});
test('prevents unverified certificates and missing CV files from being published', () => {
  assert.ok(serializeDraft('certificates', { ...createDraft('certificates'), status: 'PUBLISHED', verified: false }).errors.verified);
  assert.ok(serializeDraft('settings', { ...createDraft('settings'), cvPublished: true }).errors.cvAssetId);
});
test('preserves section text positions, whitespace, and private notes', () => {
  const draft = { ...createDraft('settings'), title: 'Site', description: 'Description', internalNotes: 'Only admins', sectionCopy: { work: ['  Intro  ', '', 'Outro'] } };
  const result = serializeDraft('settings', draft); assert.deepEqual(result.errors, {}); assert.deepEqual(result.data.sectionCopy.work, ['  Intro  ', '', 'Outro']); assert.equal(result.data.internalNotes, 'Only admins');
});
test('rejects unsupported/oversized uploads before sending private bytes', () => {
  assert.match(validateUpload({ name: 'photo.svg', type: 'image/svg+xml', size: 10 }, 'IMAGE'), /SVG/);
  assert.ok(validateUpload({ name: 'photo.png', type: 'image/png', size: 9 * 1024 * 1024 }, 'IMAGE'));
  assert.ok(validateUpload({ name: 'resume.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 }, 'PDF'));
  assert.equal(validateUpload({ name: 'resume.pdf', type: 'application/pdf', size: 1024 }, 'PDF'), null);
  assert.equal(validateUpload({ name: 'photo.webp', type: 'image/webp', size: 1024 }, 'IMAGE'), null);
});
