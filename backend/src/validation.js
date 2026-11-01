import { z } from 'zod';

export const uuid = z.string().uuid();
export const slug = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = (max = 500) => z.string().trim().min(1).max(max);
const optionalText = (max = 5000) => text(max).nullable().optional();
const list = (maxLength = 300) => z.array(text(maxLength)).max(100);
const order = z.number().int().min(0).max(100000);
export const status = z.enum(['DRAFT', 'PUBLISHED']);
const url = z.string().url().max(2048).refine(value => { const parsed = new URL(value); return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password; }, 'Use an HTTP or HTTPS URL without credentials.').nullable().optional();
const date = z.string().date().transform(value => new Date(value + 'T00:00:00Z')).nullable().optional();
const common = { status: status.optional(), sortOrder: order.optional() };
const assetId = uuid.nullable().optional();

export const schemas = {
  profile: z.object({ name: text(150), email: z.string().trim().email().max(200), headline: text(200), heroTitle: list(200), introduction: text(5000), aboutTitle: list(200), about: list(5000), values: list(100), location: text(100), availability: text(200), status: status.optional(), photoAssetId: assetId }).strict(),
  settings: z.object({ title: text(200), description: text(1000), defaultTheme: z.enum(['dark', 'light']).optional(), showAvailability: z.boolean().optional(), sectionOrder: z.array(z.enum(['home', 'work', 'about', 'skills', 'learning', 'journey', 'education', 'experience', 'certificates', 'cv', 'contact'])).max(20).refine(items => new Set(items).size === items.length), sectionCopy: z.record(z.string().max(50), z.array(z.string().max(5000)).max(100)).optional(), internalNotes: optionalText(), cvAssetId: assetId, cvPublished: z.boolean().optional() }).strict(),
  projects: z.object({ slug, name: text(200), type: text(100), category: z.enum(['WEB', 'SOFTWARE', 'DATA']), short: text(2000), tags: list(), visual: z.enum(['market', 'profix', 'pos', 'data', 'service', 'rocket']), workKind: z.enum(['CONCEPT', 'ACADEMIC']).optional(), verified: z.boolean().optional(), implementationStatus: optionalText(200), problem: text(10000), solution: text(10000), features: list(1000), contribution: optionalText(10000), lessons: optionalText(10000), repositoryUrl: url, demoUrl: url, featured: z.boolean().optional(), ...common, technologyIds: z.array(uuid).max(50).refine(items => new Set(items).size === items.length).optional(), screenshots: z.array(z.object({ assetId: uuid, caption: optionalText(500), illustrative: z.boolean().optional(), sortOrder: order.optional() }).strict()).max(30).refine(items => new Set(items.map(item => item.assetId)).size === items.length).optional() }).strict(),
  technologies: z.object({ name: text(100) }).strict(),
  'skill-categories': z.object({ slug, name: text(150), icon: text(50).regex(/^[a-z0-9-]+$/), ...common }).strict(),
  skills: z.object({ categoryId: uuid, name: text(100), ...common }).strict(),
  'learning-topics': z.object({ slug, title: text(200), category: text(100), icon: text(50).regex(/^[a-z0-9-]+$/), tone: z.enum(['green', 'blue', 'purple', 'amber']), summary: text(5000), focus: list(500), goal: text(5000), learningStatus: z.enum(['Currently learning', 'Exploring', 'Paused', 'Completed']).optional(), ...common }).strict(),
  milestones: z.object({ slug, title: text(300), description: text(5000), category: text(100), icon: text(50).regex(/^[a-z0-9-]+$/), routeLabel: text(200), stage: z.enum(['FOUNDATION', 'CURRENT', 'GOAL']), tags: list(100), linkSection: z.enum(['work', 'learning', 'contact']).nullable().optional(), linkLabel: optionalText(200), occurredAt: date, ...common }).strict(),
  education: z.object({ slug, institution: text(300), faculty: optionalText(300), degree: text(300), studyStatus: text(100), coursework: list(), achievements: list(1000), startDate: date, endDate: date, ...common }).strict(),
  experience: z.object({ slug, title: text(300), category: z.enum(['Academic collaboration', 'University activity', 'Academic activity', 'Professional employment', 'Internship']), organisation: optionalText(300), description: optionalText(), startDate: date, endDate: date, ...common }).strict(),
  certificates: z.object({ slug, title: text(300), issuer: text(300), completedAt: date, credentialId: optionalText(300), verificationUrl: url, verified: z.boolean().optional(), assetId, ...common }).strict(),
  'social-links': z.object({ platform: text(100), url, ...common }).strict(),
};
export const messageSchema = z.object({ name: text(100), email: z.string().trim().email().max(200), subject: text(200), message: text(5000) }).strict();
const integerQuery = (fallback, max) => z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(max)).optional().default(fallback);
export const pagination = z.object({ page: integerQuery(1, 10000), limit: integerQuery(20, 100) }).strict();
export const projectQuery = pagination.extend({ category: z.enum(['all', 'web', 'software', 'data']).optional(), featured: z.enum(['true', 'false']).optional() }).strict();
export const ordering = z.object({ items: z.array(z.object({ id: uuid, sortOrder: order }).strict()).min(1).max(100).refine(items => new Set(items.map(item => item.id)).size === items.length) }).strict();
export const resourceModels = { projects: 'project', technologies: 'technology', 'skill-categories': 'skillCategory', skills: 'skill', 'learning-topics': 'learningTopic', milestones: 'journeyMilestone', education: 'education', experience: 'experience', certificates: 'certificate', 'social-links': 'socialLink' };
