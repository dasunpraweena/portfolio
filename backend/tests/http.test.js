import test from 'node:test';
import assert from 'node:assert/strict';
import { serve, ADMIN } from './helpers.js';
import { resourceModels } from '../src/validation.js';
import { seedData } from '../prisma/seed.js';

const ID = '33333333-3333-4333-8333-333333333333';
const project = (slug, status, category = 'WEB') => ({ id: ID, ...seedData.projects[0], slug, status, category, internalNotes: 'DO NOT LEAK' });

test('health and headers work without claiming remote connectivity', async t => {
  const { request } = await serve(t);
  const response = await request('/api/health');
  assert.equal(response.status, 200); assert.equal((await response.json()).data.status, 'ok');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
test('public project lists and details exclude drafts and support category filtering', async t => {
  const { request } = await serve(t, { project: [project('public-web','PUBLISHED'), { ...project('draft','DRAFT'), id: '44444444-4444-4444-8444-444444444444' }, { ...project('public-data','PUBLISHED','DATA'), id: '55555555-5555-4555-8555-555555555555' }] });
  const list = await (await request('/api/projects?category=web')).json();
  assert.deepEqual(list.data.map(row => row.slug), ['public-web']);
  assert.equal(list.meta.total, 1); assert.ok(!JSON.stringify(list).includes('DO NOT LEAK'));
  assert.equal((await request('/api/projects/draft')).status, 404);
  assert.equal((await request('/api/projects/public-web')).status, 200);
  assert.equal((await request('/api/projects?status=DRAFT')).status, 422);
  assert.equal((await request('/api/projects?category=unknown')).status, 422);
  assert.equal((await request('/api/projects?page=-1')).status, 422);
});
test('portfolio projects public fields, filters child skills, and hides private CV and messages', async t => {
  const { request } = await serve(t, {
    profile: [{ id: 'main', ...seedData.profile }],
    siteSettings: [{ id: 'main', ...seedData.settings, internalNotes: 'PRIVATE SETTING', cvPublished: false, cvAssetId: ID }],
    asset: [{ id: ID, privatePath: 'PRIVATE PATH', publicPath: null }],
    contactMessage: [{ message: 'PRIVATE MESSAGE' }],
    project: [project('draft', 'DRAFT')],
    skillCategory: [{ id: ID, name: 'Category', status: 'PUBLISHED' }],
    skill: [{ categoryId: ID, name: 'Visible', status: 'PUBLISHED' }, { categoryId: ID, name: 'PRIVATE SKILL', status: 'DRAFT' }],
  });
  const result = await (await request('/api/portfolio')).json();
  assert.equal(result.data.settings.cv, null);
  assert.deepEqual(result.data.projects, []);
  assert.deepEqual(result.data.skillCategories[0].skills.map(row => row.name), ['Visible']);
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});
test('every admin resource requires a verified token before parsing content or uploads', async t => {
  const { request } = await serve(t);
  for (const path of ['me','profile','settings',...Object.keys(resourceModels),'messages','assets']) {
    assert.equal((await request('/api/admin/' + path)).status, 401, path);
    assert.equal((await request('/api/admin/' + path, { token: 'valid.other.token' })).status, 403, path);
  }
  assert.equal((await request('/api/admin/uploads/image', { method:'POST' })).status, 401);
  for (const token of ['expired.admin.token','invalid','valid.admin']) assert.equal((await request('/api/admin/me', { token })).status, 401);
  assert.equal((await (await request('/api/admin/me', { token:'valid.admin.token' })).json()).data.id, ADMIN);
});
test('strict validation rejects trusted IDs/roles in bodies and unsafe links', async t => {
  const { request } = await serve(t);
  const body = { ...seedData.projects[0], admin: true, userId: ADMIN }; delete body.technologyNames;
  assert.equal((await request('/api/admin/projects', { token:'valid.admin.token', method:'POST', body })).status, 422);
  delete body.admin; delete body.userId; body.demoUrl = 'javascript:alert(1)';
  assert.equal((await request('/api/admin/projects', { token:'valid.admin.token', method:'POST', body })).status, 422);
});
test('an authorized admin can publish, unpublish, and reorder a project', async t => {
  const { request } = await serve(t, { project: [project('draft', 'DRAFT')] });
  const options = { token:'valid.admin.token', method:'PATCH' };
  assert.equal((await request(`/api/admin/projects/${ID}/publication`, { ...options, body:{status:'PUBLISHED'} })).status, 200);
  assert.equal((await request('/api/projects/draft')).status, 200);
  assert.equal((await request('/api/admin/projects/order', { ...options, body:{items:[{id:ID,sortOrder:7}]} })).status, 200);
  assert.equal((await request(`/api/admin/projects/${ID}/publication`, { ...options, body:{status:'DRAFT'} })).status, 200);
  assert.equal((await request('/api/projects/draft')).status, 404);
});
test('messages are validated, rate-limited, private, and manageable by admins', async t => {
  const { request, db } = await serve(t, {}, { messages: 3 });
  const body = { name:'Visitor',email:'visitor@example.com',subject:'Hello',message:'An opportunity' };
  assert.equal((await request('/api/messages',{method:'POST',body:{...body,email:'bad'}})).status, 422);
  const accepted = await request('/api/messages',{method:'POST',body});
  assert.equal(accepted.status,201); assert.deepEqual(await accepted.json(),{data:{accepted:true}});
  const id=db.rows('contactMessage')[0].id;
  assert.equal((await request('/api/messages',{method:'POST',body:{...body,message:'  '}})).status,422);
  const limited=await request('/api/messages',{method:'POST',body});
  assert.equal(limited.status,429); assert.ok(limited.headers.get('retry-after'));
  assert.equal((await request('/api/messages')).status,404);
  const options={token:'valid.admin.token',method:'PATCH'};
  assert.equal((await request('/api/admin/messages/'+id,{...options,body:{read:true}})).status,200);
  assert.ok(db.rows('contactMessage')[0].readAt);
  await request('/api/admin/messages/'+id,{...options,body:{read:false}});
  assert.equal(db.rows('contactMessage')[0].readAt,null);
  assert.equal((await request('/api/admin/messages/'+id,{token:options.token,method:'DELETE'})).status,204);
});
test('CORS rejects unknown origins and only permits configured browser origins', async t => {
  const { request } = await serve(t);
  assert.equal((await request('/api/health',{headers:{origin:'https://untrusted.example'}})).status,403);
  const response=await request('/api/health',{headers:{origin:'http://localhost:5173'}});
  assert.equal(response.headers.get('access-control-allow-origin'),'http://localhost:5173');
});
test('invalid JSON and oversized bodies return safe consistent errors', async t => {
  const { base } = await serve(t);
  for (const [body,status] of [['{',400],[JSON.stringify({message:'x'.repeat(70000)}),413]]) {
    const response=await fetch(base+'/api/messages',{method:'POST',headers:{'content-type':'application/json'},body});
    assert.equal(response.status,status); const result=await response.json();assert.ok(result.error.requestId);assert.ok(!result.error.stack);
  }
});
