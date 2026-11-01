import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { makePrisma } from '../src/lib/clients.js';
import { withContentLock } from '../src/services/assets.js';
import { inspectDatabase } from '../scripts/db-safety.js';

export const seedData = JSON.parse(fs.readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8'));
export async function seedPortfolio(db) {
  return withContentLock(db, async tx => {
    // Empty updates preserve admin edits and publication choices on every rerun.
    for (const [model, row] of [['profile', seedData.profile], ['siteSettings', seedData.settings]]) await tx[model].upsert({ where: { id: 'main' }, create: { id: 'main', ...row }, update: {} });
    const technologies = {};
    for (const name of ['C#', 'MySQL', 'SPSS']) technologies[name] = await tx.technology.upsert({ where: { name }, create: { name }, update: {} });
    for (const item of seedData.projects) {
      const { technologyNames, ...project } = item;
      await tx.project.upsert({ where: { slug: project.slug }, update: {}, create: { ...project, technologies: { create: technologyNames.map((name, sortOrder) => ({ technologyId: technologies[name].id, sortOrder })) } } });
    }
    for (const item of seedData.skillCategories) {
      const { skills, ...category } = item;
      const parent = await tx.skillCategory.upsert({ where: { slug: category.slug }, create: category, update: {} });
      for (const [sortOrder, name] of skills.entries()) await tx.skill.upsert({ where: { categoryId_name: { categoryId: parent.id, name } }, create: { categoryId: parent.id, name, sortOrder, status: 'PUBLISHED' }, update: {} });
    }
    for (const [model, key] of [['learningTopic', 'learningTopics'], ['journeyMilestone', 'milestones'], ['education', 'education'], ['experience', 'experience']]) for (const row of seedData[key]) await tx[model].upsert({ where: { slug: row.slug }, create: row, update: {} });
    for (const social of seedData.socialLinks) await tx.socialLink.upsert({ where: { platform: social.platform }, create: social, update: {} });
  });
}
export async function runSeed() {
  const db = makePrisma({ DATABASE_URL: process.env.DATABASE_URL, DATABASE_SSL_CA_FILE: process.env.DATABASE_SSL_CA_FILE });
  try { await seedPortfolio(db); console.log('Seed completed. Existing records were preserved; project outlines remain drafts unless you previously published them.'); }
  finally { await db.$disconnect(); }
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try { await inspectDatabase({ write: true }); await runSeed(); }
  catch { console.error('Seed stopped. Review database inspection and local .env. No reset was attempted.'); process.exitCode = 1; }
}
