import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Generation/validation work without credentials. Database commands have no fallback target.
const source = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
let url;
if (source) {
  const parsed = new URL(source);
  parsed.searchParams.set('sslmode', 'require');
  parsed.searchParams.set('sslaccept', 'strict');
  if (process.env.DATABASE_SSL_CA_FILE) parsed.searchParams.set('sslcert', process.env.DATABASE_SSL_CA_FILE);
  url = parsed.toString();
}
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'node prisma/seed.js' },
  ...(url ? { datasource: { url } } : {}),
});
