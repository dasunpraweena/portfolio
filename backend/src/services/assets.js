import { ApiError } from '../lib/errors.js';

export async function withContentLock(db, callback) {
  return db.$transaction(async tx => {
    // Shared by every content/asset mutation, including multiple Node instances.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(684102329)`;
    return callback(tx);
  }, { maxWait: 10000, timeout: 60000 });
}
export async function publishedReferences(db, assetId) {
  const counts = await Promise.all([
    db.projectAsset.count({ where: { assetId, project: { status: 'PUBLISHED' } } }),
    db.profile.count({ where: { photoAssetId: assetId, status: 'PUBLISHED' } }),
    db.siteSettings.count({ where: { cvAssetId: assetId, cvPublished: true } }),
    db.certificate.count({ where: { assetId, status: 'PUBLISHED', verified: true } }),
  ]);
  return counts.reduce((sum, value) => sum + value, 0);
}
export async function allReferences(db, assetId) {
  const counts = await Promise.all([
    db.projectAsset.count({ where: { assetId } }), db.profile.count({ where: { photoAssetId: assetId } }),
    db.siteSettings.count({ where: { cvAssetId: assetId } }), db.certificate.count({ where: { assetId } }),
  ]);
  return counts.reduce((sum, value) => sum + value, 0);
}
const storageError = () => new ApiError(503, 'STORAGE_UNAVAILABLE', 'Storage could not complete this operation. Retry or run asset reconciliation.');
export function makeAssetService(db, supabase, config) {
  const bucket = name => supabase.storage.from(name);
  async function download(name, path) {
    const { data, error } = await bucket(name).download(path);
    if (error || !data) throw storageError();
    return Buffer.from(await data.arrayBuffer());
  }
  async function reconcile(tx, assetId, force = false) {
    const asset = await tx.asset.findUnique({ where: { id: assetId } });
    if (!asset) return;
    const visible = await publishedReferences(tx, assetId) > 0;
    if (visible && (!asset.publicPath || force)) {
      const buffer = await download(config.PRIVATE_BUCKET, asset.privatePath);
      const { error } = await bucket(config.PUBLIC_BUCKET).upload(asset.privatePath, buffer, { contentType: asset.mimeType, cacheControl: '0', upsert: true });
      if (error) throw storageError();
      await tx.asset.update({ where: { id: assetId }, data: { publicPath: asset.privatePath } });
    } else if (!visible && (asset.publicPath || force)) {
      const { error } = await bucket(config.PUBLIC_BUCKET).remove([asset.publicPath || asset.privatePath]);
      if (error) throw storageError();
      await tx.asset.update({ where: { id: assetId }, data: { publicPath: null } });
    }
  }
  return {
    reconcile,
    async upload(file, adminId) {
      const { buffer, ...metadata } = file;
      const { error } = await bucket(config.PRIVATE_BUCKET).upload(file.privatePath, buffer, { contentType: file.mimeType, cacheControl: '0', upsert: false });
      if (error) throw storageError();
      try { return await withContentLock(db, tx => tx.asset.create({ data: { ...metadata, uploadedBy: adminId } })); }
      catch (error) { await bucket(config.PRIVATE_BUCKET).remove([file.privatePath]).catch(() => {}); throw error; }
    },
    async file(id, admin = false) {
      const asset = await db.asset.findUnique({ where: { id } });
      if (!asset || (!admin && (!asset.publicPath || !(await publishedReferences(db, id))))) throw new ApiError(404, 'NOT_FOUND', 'This file is not available.');
      const buffer = await download(admin ? config.PRIVATE_BUCKET : config.PUBLIC_BUCKET, admin ? asset.privatePath : asset.publicPath);
      // Re-check after download so an unpublish committed during I/O cannot serve stale visibility.
      if (!admin && !(await publishedReferences(db, id))) throw new ApiError(404, 'NOT_FOUND', 'This file is not available.');
      return { asset, buffer };
    },
    async remove(id) {
      return withContentLock(db, async tx => {
        const asset = await tx.asset.findUnique({ where: { id } });
        if (!asset) throw new ApiError(404, 'NOT_FOUND', 'This file does not exist.');
        if (await allReferences(tx, id)) throw new ApiError(409, 'ASSET_IN_USE', 'Detach this file from all content, including drafts, before deleting it.');
        if (asset.publicPath) { const result = await bucket(config.PUBLIC_BUCKET).remove([asset.publicPath]); if (result.error) throw storageError(); }
        const result = await bucket(config.PRIVATE_BUCKET).remove([asset.privatePath]);
        if (result.error) throw storageError();
        await tx.asset.delete({ where: { id } });
      });
    },
    async reconcileAll() {
      const rows = await db.asset.findMany({ select: { id: true } });
      for (const asset of rows) await withContentLock(db, tx => reconcile(tx, asset.id, true));
      return { checked: rows.length };
    },
  };
}
