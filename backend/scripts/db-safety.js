import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { databaseIdentity, pgOptions } from '../src/config.js';

export function databaseEnvironment(env = process.env, migration = false) {
  const connectionString = migration ? env.MIGRATION_DATABASE_URL || env.DATABASE_URL : env.DATABASE_URL;
  if (!connectionString || !env.SUPABASE_URL) throw new Error('Fill DATABASE_URL and SUPABASE_URL in backend/.env first. No database command was run.');
  const identity = databaseIdentity(connectionString, env.SUPABASE_URL);
  return { connectionString, identity };
}
export async function inspectDatabase({ write = false, migration = false, env = process.env } = {}) {
  const { connectionString, identity } = databaseEnvironment(env, migration);
  const client = new pg.Client(pgOptions(connectionString, env));
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const result = await client.query("SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('portfolio', 'public') ORDER BY schemaname, tablename");
    console.log(JSON.stringify({ projectRef: identity.projectRef, host: identity.host, connectionType: identity.connectionType, database: 'postgres', applicationSchema: 'portfolio', tables: result.rows }, null, 2));
    const tables = result.rows;
    const app = tables.filter(table => table.schemaname === 'portfolio');
    const migrations = app.some(table => table.tablename === '_prisma_migrations');
    const problems = [];
    if (app.length && !migrations) problems.push('Existing portfolio tables have no Prisma migration history. Inspect/baseline them with a developer; do not reset or force an initial migration.');
    if (migrations) {
      const history = await client.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM portfolio._prisma_migrations');
      if (!history.rows.length && app.some(table => table.tablename !== '_prisma_migrations')) problems.push('Application tables exist but the migration history is empty. Review and baseline before applying the initial migration.');
      for (const record of history.rows.filter(row => !row.rolled_back_at)) {
        if (!/^\d{12,14}_[a-z0-9_-]+$/i.test(record.migration_name)) { problems.push('An unexpected migration name requires manual review.'); continue; }
        const file = path.resolve('prisma/migrations', record.migration_name, 'migration.sql');
        if (!record.finished_at) problems.push('An unfinished migration needs investigation.');
        else if (!fs.existsSync(file) || createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== record.checksum) problems.push(`Migration history conflict: ${record.migration_name}. Preserve the database and recover the original migration files.`);
      }
    }
    const expected = new Set(['_prisma_migrations', 'Profile', 'SiteSettings', 'Project', 'Technology', 'ProjectTechnology', 'ProjectAsset', 'SkillCategory', 'Skill', 'LearningTopic', 'JourneyMilestone', 'Education', 'Experience', 'Certificate', 'SocialLink', 'ContactMessage', 'Asset']);
    if (app.some(table => !expected.has(table.tablename))) problems.push('Unrecognized tables exist in the portfolio schema. Review their ownership and migration history before changing this schema.');
    if (tables.some(table => table.schemaname === 'public') && env.DB_EXISTING_TABLES_REVIEWED !== 'true') problems.push('Existing public tables were found. Review the list and any existing application ownership before setting DB_EXISTING_TABLES_REVIEWED=true. These migrations only manage portfolio.');
    await client.query('COMMIT');
    if (problems.length) console.log('Review required:\n' + problems.join('\n'));
    if (write && env.DB_TARGET_CONFIRMED !== identity.projectRef) throw new Error('No changes made. After reviewing db:inspect, set DB_TARGET_CONFIRMED to this exact project ref in .env.');
    if (write && problems.length) throw new Error('No changes made. Resolve the inspection findings before applying migrations or seed data.');
    return { connectionString, identity, problems };
  } finally { await client.end().catch(() => {}); }
}
