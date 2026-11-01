import { ApiError } from '../lib/errors.js';

const normalize = value => (value || '').replace(/[\s()]/g, '');
export async function checkStorageSecurity(db, supabase, config) {
  for (const name of [config.PUBLIC_BUCKET, config.PRIVATE_BUCKET]) {
    const { data, error } = await supabase.storage.getBucket(name);
    if (error || !data || data.public !== false) throw new ApiError(503, 'STORAGE_CONFIGURATION', `Create private bucket ${name} with Public bucket switched OFF.`);
  }
  const policies = await db.$queryRaw`SELECT policyname, permissive, roles::text[], cmd, qual, with_check FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_express_only'`;
  const expected = normalize(`bucket_id <> '${config.PUBLIC_BUCKET}'::text AND bucket_id <> '${config.PRIVATE_BUCKET}'::text`);
  const policy = policies[0];
  if (!policy || policy.permissive !== 'RESTRICTIVE' || policy.cmd !== 'ALL' || !policy.roles.includes('anon') || !policy.roles.includes('authenticated') || normalize(policy.qual) !== expected || normalize(policy.with_check) !== expected) throw new ApiError(503, 'STORAGE_POLICY_REQUIRED', 'Apply sql/storage-policies.sql for the configured bucket names, then run storage:check.');
}
export async function checkDatabaseSecurity(db) {
  const roles = await db.$queryRaw`SELECT has_schema_privilege('anon', 'portfolio', 'USAGE') AS anon_access, has_schema_privilege('authenticated', 'portfolio', 'USAGE') AS user_access`;
  const unsafe = await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'portfolio' AND tablename <> '_prisma_migrations' AND NOT rowsecurity`;
  if (roles[0]?.anon_access || roles[0]?.user_access || unsafe.length) throw new ApiError(503, 'DATABASE_SECURITY', 'Apply the application migrations and remove client access to the portfolio schema.');
}
