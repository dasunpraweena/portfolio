import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig, databaseIdentity, pgOptions } from '../src/config.js';
import { databaseEnvironment } from '../scripts/db-safety.js';
import { seedPortfolio, seedData } from '../prisma/seed.js';
import { schemas } from '../src/validation.js';
import { fakeDatabase, ADMIN } from './helpers.js';
const ref='abcdefghijklmnopqrst',supabase=`https://${ref}.supabase.co`;
const connection=`postgresql://postgres.${ref}:a%40b%3Ac%23d@aws-0-test.pooler.supabase.com:5432/postgres?schema=portfolio&sslmode=require`;
test('configuration validates defaults, UUID allowlist, keys, and percent-encoded database URLs',()=>{
  const config=readConfig({DATABASE_URL:connection,SUPABASE_URL:supabase,SUPABASE_SECRET_KEY:'sb_secret_example_test_only_123456',ADMIN_USER_IDS:ADMIN});
  assert.deepEqual(config.FRONTEND_ORIGINS,['http://localhost:5173']);
  assert.deepEqual(config.ADMIN_ORIGINS,['http://localhost:5174']);
  assert.deepEqual(config.ADMIN_USER_IDS,[ADMIN]);
  assert.equal(databaseIdentity(connection,supabase).connectionType,'Session pooler');
  assert.equal(pgOptions(connection,{}).ssl.rejectUnauthorized,true);
  assert.throws(()=>readConfig({}),/Invalid configuration/);
});
test('database target guards reject wrong projects, transaction pooling, target overrides, and missing configuration',()=>{
  for(const url of [connection.replace(ref,'wrongprojectref'),connection.replace(':5432',':6543'),connection+'&host=evil.example',connection+'&schema=public',connection.replace('schema=portfolio','schema=public')]) assert.throws(()=>databaseIdentity(url,supabase));
  assert.throws(()=>databaseEnvironment({}));
});
test('seed data validates and does not fabricate evidence or qualifications',()=>{
  schemas.profile.parse(seedData.profile);schemas.settings.parse(seedData.settings);
  for(const project of seedData.projects){const {technologyNames,...data}=project;schemas.projects.parse(data);assert.equal(project.status,'DRAFT');assert.equal(project.verified,false);assert.equal(project.contribution,undefined);}
  for(const education of seedData.education){schemas.education.parse(education);assert.equal(education.startDate,undefined);assert.deepEqual(education.achievements,[]);}
  for(const row of seedData.experience){schemas.experience.parse(row);assert.ok(!['Professional employment','Internship'].includes(row.category));}
  assert.ok(seedData.socialLinks.every(row=>row.url===null));assert.equal(seedData.settings.cvPublished,false);
});
test('seeding is idempotent and preserves edited records and publication choices',async()=>{
  const db=fakeDatabase();await seedPortfolio(db);
  const before=db.rows('project').length;
  db.rows('project')[0].status='PUBLISHED';db.rows('project')[0].contribution='An admin edit';
  await seedPortfolio(db);
  assert.equal(db.rows('project').length,before);assert.equal(before,6);assert.equal(db.rows('skill').length,19);
  assert.equal(db.rows('project')[0].contribution,'An admin edit');assert.equal(db.rows('project')[0].status,'PUBLISHED');
  assert.equal(db.rows('certificate').length,0);assert.equal(db.rows('asset').length,0);
});
