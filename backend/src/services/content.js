import { ApiError } from '../lib/errors.js';
import { resourceModels } from '../validation.js';
import { withContentLock } from './assets.js';
import { displayOrder, projectInclude } from './public.js';

const entity = resource => resource === 'profile' ? 'profile' : resource === 'settings' ? 'siteSettings' : resourceModels[resource];
const include = resource => resource === 'projects' ? projectInclude : {};
export async function referencedAssetIds(tx, resource, row) {
  if (!row) return [];
  if (resource === 'projects') return (await tx.projectAsset.findMany({ where: { projectId: row.id }, select: { assetId: true } })).map(item => item.assetId);
  return [row.photoAssetId, row.cvAssetId, row.assetId].filter(Boolean);
}
export function makeContentService(db, assets) {
  async function validateRelated(tx, resource, data, existing = {}) {
    const merged = { ...existing, ...data };
    const files = [];
    if (resource === 'projects' && data.screenshots) files.push(...data.screenshots.map(item => [item.assetId, 'IMAGE']));
    if (resource === 'profile' && data.photoAssetId) files.push([data.photoAssetId, 'IMAGE']);
    if (resource === 'settings' && data.cvAssetId) files.push([data.cvAssetId, 'PDF']);
    if (resource === 'certificates' && data.assetId) files.push([data.assetId, null]);
    for (const [id, kind] of files) {
      const file = await tx.asset.findUnique({ where: { id } });
      if (!file || (kind && file.kind !== kind)) throw new ApiError(422, 'INVALID_ASSET', 'Use an existing uploaded file of the correct type.');
    }
    if (resource === 'projects' && data.technologyIds) {
      if (await tx.technology.count({ where: { id: { in: data.technologyIds } } }) !== data.technologyIds.length) throw new ApiError(422, 'INVALID_TECHNOLOGY', 'A selected technology does not exist.');
    }
    if (resource === 'skills' && data.categoryId && !(await tx.skillCategory.findUnique({ where: { id: data.categoryId } }))) throw new ApiError(422, 'INVALID_CATEGORY', 'This skill category does not exist.');
    if (resource === 'certificates' && merged.status === 'PUBLISHED' && !merged.verified) throw new ApiError(422, 'UNVERIFIED_CERTIFICATE', 'Verify the certificate before publishing it.');
    if (resource === 'settings' && merged.cvPublished && !merged.cvAssetId) throw new ApiError(422, 'CV_REQUIRED', 'Attach a real PDF before publishing the CV.');
    if (merged.startDate && merged.endDate && new Date(merged.startDate) > new Date(merged.endDate)) throw new ApiError(422, 'INVALID_DATES', 'The end date must not precede the start date.');
  }
  function writeData(resource, data, update) {
    if (resource !== 'projects') return data;
    const { technologyIds, screenshots, ...fields } = data;
    return { ...fields,
      ...(technologyIds ? { technologies: { ...(update ? { deleteMany: {} } : {}), create: technologyIds.map((technologyId, sortOrder) => ({ technologyId, sortOrder })) } } : {}),
      ...(screenshots ? { screenshots: { ...(update ? { deleteMany: {} } : {}), create: screenshots.map((file, index) => ({ ...file, sortOrder: file.sortOrder ?? index })) } } : {}),
    };
  }
  return {
    async list(resource, { page, limit }) {
      const model = db[entity(resource)];
      const [data, total] = await Promise.all([model.findMany({ ...(resource === 'technologies' ? { orderBy: { name: 'asc' } } : { orderBy: displayOrder }), include: include(resource), skip: (page - 1) * limit, take: limit }), model.count()]);
      return { data, meta: { page, limit, total } };
    },
    async get(resource, id) { return db[entity(resource)].findUnique({ where: { id }, include: include(resource) }); },
    async save(resource, id, data, create = false, singleton = false) {
      return withContentLock(db, async tx => {
        const model = tx[entity(resource)];
        const old = id ? await model.findUnique({ where: { id } }) : null;
        if (!create && !singleton && !old) throw new ApiError(404, 'NOT_FOUND', 'This record does not exist.');
        await validateRelated(tx, resource, data, old || {});
        const oldAssets = await referencedAssetIds(tx, resource, old);
        const fields = writeData(resource, data, Boolean(old));
        const row = old ? await model.update({ where: { id }, data: fields }) : await model.create({ data: { ...fields, ...(singleton ? { id: 'main' } : {}) } });
        const ids = new Set([...oldAssets, ...await referencedAssetIds(tx, resource, row)]);
        for (const assetId of ids) await assets.reconcile(tx, assetId);
        return model.findUnique({ where: { id: row.id }, include: include(resource) });
      });
    },
    async remove(resource, id) {
      return withContentLock(db, async tx => {
        const model = tx[entity(resource)];
        const old = await model.findUnique({ where: { id } });
        if (!old) throw new ApiError(404, 'NOT_FOUND', 'This record does not exist.');
        const ids = await referencedAssetIds(tx, resource, old);
        await model.delete({ where: { id } });
        for (const assetId of ids) await assets.reconcile(tx, assetId);
      });
    },
    async order(resource, items) {
      return withContentLock(db, async tx => {
        for (const { id, sortOrder } of items) await tx[entity(resource)].update({ where: { id }, data: { sortOrder } });
        return { updated: items.length };
      });
    },
  };
}
