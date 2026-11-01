import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { z } from 'zod';
import { ApiError, errorHandler } from './lib/errors.js';
import { requireAdmin } from './middleware/auth.js';
import { makePublicService } from './services/public.js';
import { makeContentService } from './services/content.js';
import { makeAssetService } from './services/assets.js';
import { inspectUpload } from './services/files.js';
import { schemas, resourceModels, uuid, slug, status, pagination, projectQuery, ordering, messageSchema } from './validation.js';

const notFound = () => new ApiError(404, 'NOT_FOUND', 'This record does not exist.');
export function createApp({ db, supabase, config, limits = {} }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY_HOPS || false);
  app.use((req, res, next) => { req.id = randomUUID(); res.set('X-Request-ID', req.id); res.set('Cache-Control', 'no-store'); next(); });
  app.use(helmet());
  const origins = new Set([...config.FRONTEND_ORIGINS, ...config.ADMIN_ORIGINS]);
  app.use(cors({ origin(origin, callback) { callback(origin && !origins.has(origin) ? new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.') : null, true); }, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: false }));
  const limiter = (max, windowMs, code) => rateLimit({ windowMs, limit: max, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ error: { code, message: 'Too many requests. Please try again later.', requestId: req.id } }) });
  const publicService = makePublicService(db);
  const assets = makeAssetService(db, supabase, config);
  const content = makeContentService(db, assets);
  app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));
  app.use('/api', limiter(limits.api ?? 240, 60000, 'RATE_LIMITED'));
  app.get('/api/portfolio', async (req, res) => { z.object({}).strict().parse(req.query); res.json({ data: await publicService.portfolio() }); });
  app.get('/api/projects', async (req, res) => res.json(await publicService.projects(projectQuery.parse(req.query))));
  app.get('/api/projects/:slug', async (req, res) => {
    const project = await publicService.project(slug.parse(req.params.slug));
    if (!project) throw notFound();
    res.json({ data: project });
  });
  function sendFile(res, result) {
    res.set('Content-Type', result.asset.mimeType);
    res.set('Content-Disposition', result.asset.kind === 'PDF' ? 'attachment; filename="portfolio-document.pdf"' : 'inline');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'private, no-store, max-age=0');
    res.send(result.buffer);
  }
  app.get('/api/assets/:id', async (req, res) => sendFile(res, await assets.file(uuid.parse(req.params.id))));
  const json = express.json({ limit: '64kb', strict: true });
  app.post('/api/messages', limiter(limits.messages ?? 5, 15 * 60000, 'MESSAGE_RATE_LIMITED'), json, async (req, res) => {
    if (!req.is('application/json')) throw new ApiError(415, 'JSON_REQUIRED', 'Use Content-Type: application/json.');
    const data = messageSchema.parse(req.body);
    await db.contactMessage.create({ data });
    res.status(201).json({ data: { accepted: true } });
  });

  // Authentication is mounted before JSON parsing, uploads, and every admin handler.
  const admin = express.Router();
  app.use('/api/admin', limiter(limits.admin ?? 120, 60000, 'ADMIN_RATE_LIMITED'), requireAdmin(supabase, config.ADMIN_USER_IDS), admin);
  admin.use(json);
  admin.get('/me', (req, res) => res.json({ data: { id: req.admin.id } }));
  for (const resource of ['profile', 'settings']) {
    admin.get('/' + resource, async (req, res) => res.json({ data: await content.get(resource, 'main') }));
    admin.put('/' + resource, async (req, res) => res.json({ data: await content.save(resource, 'main', schemas[resource].parse(req.body), false, true) }));
    admin.patch('/' + resource, async (req, res) => res.json({ data: await content.save(resource, 'main', schemas[resource].partial().refine(value => Object.keys(value).length > 0).parse(req.body)) }));
    admin.delete('/' + resource, async (req, res) => { await content.remove(resource, 'main'); res.status(204).end(); });
  }
  for (const resource of Object.keys(resourceModels)) {
    const route = '/' + resource;
    admin.get(route, async (req, res) => res.json(await content.list(resource, pagination.parse(req.query))));
    admin.post(route, async (req, res) => res.status(201).json({ data: await content.save(resource, null, schemas[resource].parse(req.body), true) }));
    if (resource !== 'technologies') admin.patch(route + '/order', async (req, res) => res.json({ data: await content.order(resource, ordering.parse(req.body).items) }));
    admin.get(route + '/:id', async (req, res) => { const row = await content.get(resource, uuid.parse(req.params.id)); if (!row) throw notFound(); res.json({ data: row }); });
    admin.patch(route + '/:id', async (req, res) => res.json({ data: await content.save(resource, uuid.parse(req.params.id), schemas[resource].partial().refine(value => Object.keys(value).length > 0).parse(req.body)) }));
    admin.delete(route + '/:id', async (req, res) => { await content.remove(resource, uuid.parse(req.params.id)); res.status(204).end(); });
  }
  admin.patch('/projects/:id/publication', async (req, res) => {
    const data = z.object({ status }).strict().parse(req.body);
    res.json({ data: await content.save('projects', uuid.parse(req.params.id), data) });
  });
  admin.get('/messages', async (req, res) => {
    const query = pagination.extend({ read: z.enum(['true', 'false']).optional() }).parse(req.query);
    const where = query.read ? { readAt: query.read === 'true' ? { not: null } : null } : {};
    const [data, total] = await Promise.all([db.contactMessage.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: query.limit, skip: (query.page - 1) * query.limit }), db.contactMessage.count({ where })]);
    res.json({ data, meta: { page: query.page, limit: query.limit, total } });
  });
  admin.patch('/messages/:id', async (req, res) => {
    const { read } = z.object({ read: z.boolean() }).strict().parse(req.body);
    res.json({ data: await db.contactMessage.update({ where: { id: uuid.parse(req.params.id) }, data: { readAt: read ? new Date() : null } }) });
  });
  admin.delete('/messages/:id', async (req, res) => { await db.contactMessage.delete({ where: { id: uuid.parse(req.params.id) } }); res.status(204).end(); });
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 1, headerPairs: 50 } }).single('file');
  for (const [route, kind] of [['/uploads/image', 'IMAGE'], ['/uploads/pdf', 'PDF']]) admin.post(route, upload, async (req, res) => res.status(201).json({ data: await assets.upload(await inspectUpload(req.file, kind), req.admin.id) }));
  admin.get('/assets', async (req, res) => {
    const query = pagination.parse(req.query);
    const [data, total] = await Promise.all([db.asset.findMany({ orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }), db.asset.count()]);
    res.json({ data, meta: { ...query, total } });
  });
  admin.post('/assets/reconcile', async (req, res) => res.json({ data: await assets.reconcileAll() }));
  admin.get('/assets/:id/file', async (req, res) => sendFile(res, await assets.file(uuid.parse(req.params.id), true)));
  admin.delete('/assets/:id', async (req, res) => { await assets.remove(uuid.parse(req.params.id)); res.status(204).end(); });
  app.use((req, res, next) => next(new ApiError(404, 'NOT_FOUND', 'This API route does not exist.')));
  app.use(errorHandler);
  return app;
}
