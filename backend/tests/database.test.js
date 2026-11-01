import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { checkDatabaseSecurity, checkStorageSecurity } from '../src/services/security.js';
import { config, fakeSupabase } from './helpers.js';

// Disposable embedded PostgreSQL. No connection string, credentials, or production DB.
let db;
before(async()=>{
  db=new PGlite();await db.waitReady;
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await db.exec(fs.readFileSync(new URL('../prisma/migrations/202611010001_initial/migration.sql',import.meta.url),'utf8'));
});
after(async()=>{await db?.close();});
const adapter={$queryRaw:async(strings)=> (await db.query(strings.join(''))).rows};
const insertProject=`INSERT INTO portfolio."Project" (id,slug,name,type,category,short,visual,problem,solution,"updatedAt") VALUES ($1,$2,'Outline','Web Platform','WEB','Brief','market','Problem','Direction',now())`;
test('initial migration creates only the application schema and enforces RLS',async()=>{
  await checkDatabaseSecurity(adapter);
  const tables=await db.query("SELECT tablename FROM pg_tables WHERE schemaname='portfolio'");assert.equal(tables.rows.length,16);
  await db.exec('BEGIN; SET LOCAL ROLE anon;');
  try{await assert.rejects(()=>db.query('SELECT * FROM portfolio."ContactMessage"'),error=>error.code==='42501');}finally{await db.exec('ROLLBACK');}
});
test('PostgreSQL enforces unique project slugs and nonnegative display order',async()=>{
  const id='33333333-3333-4333-8333-333333333333';
  await db.query(insertProject,[id,'test-outline']);
  await assert.rejects(()=>db.query(insertProject,['44444444-4444-4444-8444-444444444444','test-outline']),error=>error.code==='23505');
  await assert.rejects(()=>db.query('UPDATE portfolio."Project" SET "sortOrder" = -1 WHERE id=$1',[id]),error=>error.code==='23514');
});
test('PostgreSQL blocks missing asset relations and unpublished certificate evidence',async()=>{
  await assert.rejects(()=>db.query('INSERT INTO portfolio."ProjectAsset" ("projectId","assetId") VALUES ($1,$2)',['33333333-3333-4333-8333-333333333333','55555555-5555-4555-8555-555555555555']),error=>error.code==='23503');
  await assert.rejects(()=>db.exec(`INSERT INTO portfolio."Certificate" (id,slug,title,issuer,status,verified,"updatedAt") VALUES ('66666666-6666-4666-8666-666666666666','test','Test','Test','PUBLISHED',false,now())`),error=>error.code==='23514');
});
test('restrictive storage policy defeats a broad permissive policy without blocking unrelated buckets',async()=>{
  await db.exec(`CREATE SCHEMA storage; CREATE TABLE storage.objects (bucket_id text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT USAGE ON SCHEMA storage TO anon,authenticated; GRANT ALL ON storage.objects TO anon,authenticated; CREATE POLICY test_allow_all ON storage.objects FOR ALL TO anon,authenticated USING (true) WITH CHECK (true); INSERT INTO storage.objects VALUES ('portfolio-public'),('portfolio-private'),('other-bucket');`);
  await db.exec(fs.readFileSync(new URL('../sql/storage-policies.sql',import.meta.url),'utf8'));
  await checkStorageSecurity(adapter,fakeSupabase(),config);
  await db.exec('BEGIN; SET LOCAL ROLE authenticated;');
  try{const rows=await db.query('SELECT * FROM storage.objects');assert.deepEqual(rows.rows,[{bucket_id:'other-bucket'}]);await assert.rejects(()=>db.query("INSERT INTO storage.objects VALUES ('portfolio-public')"),error=>error.code==='42501');}finally{await db.exec('ROLLBACK');}
});
