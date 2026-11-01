import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../src/app.js';

export const ADMIN = '11111111-1111-4111-8111-111111111111';
export const OTHER = '22222222-2222-4222-8222-222222222222';
export const config = { PORT: 3001, NODE_ENV: 'test', ADMIN_USER_IDS: [ADMIN], FRONTEND_ORIGINS: ['http://localhost:5173'], ADMIN_ORIGINS: ['http://localhost:5174'], TRUST_PROXY_HOPS: 0, PUBLIC_BUCKET: 'portfolio-public', PRIVATE_BUCKET: 'portfolio-private' };

// In-memory doubles exercise HTTP and service boundaries. They never read .env or connect to Supabase.
export function fakeDatabase(initial = {}) {
  const state = structuredClone(initial);
  const db = { rows: model => state[model] ||= [], $executeRaw: async () => 1 };
  const models = ['profile','siteSettings','project','technology','projectTechnology','projectAsset','skillCategory','skill','learningTopic','journeyMilestone','education','experience','certificate','socialLink','contactMessage','asset'];
  const matches = (row, where = {}, model) => Object.entries(where).every(([key, expected]) => {
    if (key === 'project' && model === 'projectAsset') return matches(db.rows('project').find(value => value.id === row.projectId) || {}, expected);
    if (key === 'category' && model === 'skill' && typeof expected === 'object') return matches(db.rows('skillCategory').find(value => value.id === row.categoryId) || {}, expected);
    if (key === 'categoryId_name') return row.categoryId === expected.categoryId && row.name === expected.name;
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      if ('in' in expected) return expected.in.includes(row[key]);
      if ('not' in expected) return (row[key] ?? null) !== expected.not;
    }
    return (row[key] ?? null) === expected;
  });
  const hydrate = (model, row, include) => {
    if (!row) return null;
    const result = structuredClone(row);
    if (model === 'project') {
      result.technologies = db.rows('projectTechnology').filter(item => item.projectId === row.id).map(item => ({ ...item, technology: db.rows('technology').find(value => value.id === item.technologyId) }));
      result.screenshots = db.rows('projectAsset').filter(item => item.projectId === row.id).map(item => ({ ...item, asset: db.rows('asset').find(value => value.id === item.assetId) }));
    }
    if (include?.photo) result.photo = db.rows('asset').find(value => value.id === row.photoAssetId) || null;
    if (include?.cv) result.cv = db.rows('asset').find(value => value.id === row.cvAssetId) || null;
    if (include?.asset) result.asset = db.rows('asset').find(value => value.id === row.assetId) || null;
    if (include?.skills) result.skills = db.rows('skill').filter(value => value.categoryId === row.id && matches(value, include.skills.where));
    return result;
  };
  for (const model of models) db[model] = {
    async findMany({ where, skip = 0, take, include, select, orderBy } = {}) {
      let rows = db.rows(model).filter(row => matches(row, where, model));
      if (orderBy) rows = [...rows].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      return rows.slice(skip, take ? skip + take : undefined).map(row => select ? Object.fromEntries(Object.keys(select).map(key => [key, row[key]])) : hydrate(model, row, include));
    },
    async count({ where } = {}) { return db.rows(model).filter(row => matches(row, where, model)).length; },
    async findUnique({ where, include }) { return hydrate(model, db.rows(model).find(row => matches(row, where, model)), include); },
    async findFirst(options) { return (await this.findMany(options))[0] || null; },
    async create({ data }) {
      const row = { id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), readAt: null, ...structuredClone(data) };
      if (model === 'project') {
        for (const field of ['technologies','screenshots']) {
          for (const item of row[field]?.create || []) db.rows(field === 'technologies' ? 'projectTechnology' : 'projectAsset').push({ ...item, projectId: row.id });
          delete row[field];
        }
      }
      db.rows(model).push(row); return hydrate(model, row);
    },
    async update({ where, data }) {
      const row = db.rows(model).find(value => matches(value, where, model));
      if (!row) throw Object.assign(new Error('Missing'), { code: 'P2025' });
      Object.assign(row, structuredClone(data)); return hydrate(model, row);
    },
    async delete({ where }) {
      const index = db.rows(model).findIndex(row => matches(row, where, model));
      if (index < 0) throw Object.assign(new Error('Missing'), { code: 'P2025' });
      const [row] = db.rows(model).splice(index, 1);
      if (model === 'project') state.projectAsset = db.rows('projectAsset').filter(item => item.projectId !== row.id);
      return row;
    },
    async upsert({ where, create, update }) { const row = await this.findUnique({ where }); return row ? this.update({ where, data: update }) : this.create({ data: create }); },
  };
  db.$transaction = async callback => {
    const snapshot = structuredClone(state);
    try { return await callback(db); }
    catch (error) { for (const key of Object.keys(state)) delete state[key]; Object.assign(state, snapshot); throw error; }
  };
  return db;
}
export function fakeSupabase() {
  const files = new Map(), events = [];
  const state = { files, events, failUpload: false };
  return Object.assign(state, {
    auth: { async getUser(token) { return token === 'valid.admin.token' ? { data: { user: { id: ADMIN } } } : token === 'valid.other.token' ? { data: { user: { id: OTHER } } } : { data: { user: null }, error: { message: 'Invalid or expired token' } }; } },
    storage: {
      async getBucket(name) { return { data: { id: name, public: false } }; },
      from(bucket) { return {
        async upload(key, data, options) { if (state.failUpload) return { error: new Error('Storage unavailable') }; files.set(bucket + '/' + key, Buffer.from(data)); events.push(['upload', bucket, key, options]); return { data: { path: key } }; },
        async download(key) { const buffer = files.get(bucket + '/' + key); return buffer ? { data: new Blob([buffer]) } : { error: new Error('Not found') }; },
        async remove(keys) { for (const key of keys) files.delete(bucket + '/' + key); events.push(['remove', bucket, keys]); return { data: [] }; },
      }; },
    },
  });
}
export async function serve(t, initial = {}, limits = {}) {
  const db = fakeDatabase(initial), supabase = fakeSupabase();
  const server = createApp({ db, supabase, config, limits }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, { token, body, ...options } = {}) => fetch(base + path, { ...options, headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...options.headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { db, supabase, request, base };
}
