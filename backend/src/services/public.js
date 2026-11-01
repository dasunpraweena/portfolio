export const projectInclude = {
  technologies: { include: { technology: true }, orderBy: { sortOrder: 'asc' } },
  screenshots: { include: { asset: true }, orderBy: { sortOrder: 'asc' } },
};
export const displayOrder = [{ sortOrder: 'asc' }, { id: 'asc' }];
export function publicAsset(asset) {
  return asset?.publicPath ? { id: asset.id, url: `/api/assets/${asset.id}`, kind: asset.kind, mimeType: asset.mimeType, width: asset.width, height: asset.height } : null;
}
export function publicProject(project) {
  if (!project || project.status !== 'PUBLISHED') return null;
  return {
    id: project.slug, slug: project.slug, name: project.name, type: project.type,
    filter: project.category.toLowerCase(), short: project.short, tech: project.tags,
    visual: project.visual, workKind: project.workKind, verified: project.verified,
    implementationStatus: project.implementationStatus, featured: project.featured,
    sortOrder: project.sortOrder, problem: project.problem, solution: project.solution,
    features: project.features, contribution: project.contribution, lessons: project.lessons,
    repositoryUrl: project.repositoryUrl, demoUrl: project.demoUrl,
    technologies: project.technologies.map(item => item.technology.name),
    screenshots: project.screenshots.map(item => {
      const asset = publicAsset(item.asset);
      return asset ? { ...asset, caption: item.caption, illustrative: item.illustrative } : null;
    }).filter(Boolean),
    disclosure: 'Project brief: implementation status, contributions, and evidence must be verified. CSS/SVG covers are illustrative concepts; uploaded files are labeled separately.',
  };
}
const pick = (value, fields) => value && Object.fromEntries(fields.map(field => [field, value[field]]));
const published = rows => rows.filter(row => row.status === 'PUBLISHED');
export function makePublicService(db) {
  return {
    async projects(query) {
      const where = { status: 'PUBLISHED', ...(query.category && query.category !== 'all' ? { category: query.category.toUpperCase() } : {}), ...(query.featured ? { featured: query.featured === 'true' } : {}) };
      const [rows, total] = await Promise.all([
        db.project.findMany({ where, include: projectInclude, orderBy: displayOrder, skip: (query.page - 1) * query.limit, take: query.limit }),
        db.project.count({ where }),
      ]);
      return { data: rows.map(publicProject).filter(Boolean), meta: { page: query.page, limit: query.limit, total } };
    },
    async project(slug) { return publicProject(await db.project.findFirst({ where: { slug, status: 'PUBLISHED' }, include: projectInclude })); },
    async portfolio() {
      const [profile, settings, projects, categories, topics, milestones, education, experience, certificates, socials] = await Promise.all([
        db.profile.findFirst({ where: { id: 'main', status: 'PUBLISHED' }, include: { photo: true } }),
        db.siteSettings.findUnique({ where: { id: 'main' }, include: { cv: true } }),
        db.project.findMany({ where: { status: 'PUBLISHED' }, include: projectInclude, orderBy: displayOrder, take: 100 }),
        db.skillCategory.findMany({ where: { status: 'PUBLISHED' }, include: { skills: { where: { status: 'PUBLISHED' }, orderBy: displayOrder } }, orderBy: displayOrder, take: 100 }),
        ...['learningTopic', 'journeyMilestone', 'education', 'experience', 'certificate', 'socialLink'].map(model => db[model].findMany({ where: { status: 'PUBLISHED', ...(model === 'certificate' ? { verified: true } : {}) }, orderBy: displayOrder, take: 100, ...(model === 'certificate' ? { include: { asset: true } } : {}) })),
      ]);
      return {
        profile: profile?.status === 'PUBLISHED' ? { ...pick(profile, ['name', 'email', 'headline', 'heroTitle', 'introduction', 'aboutTitle', 'about', 'values', 'location', 'availability']), photo: publicAsset(profile.photo) } : null,
        settings: settings ? { ...pick(settings, ['title', 'description', 'defaultTheme', 'showAvailability', 'sectionOrder', 'sectionCopy']), cv: settings.cvPublished ? publicAsset(settings.cv) : null } : null,
        projects: projects.map(publicProject).filter(Boolean),
        skillCategories: published(categories).map(category => ({ ...pick(category, ['id', 'slug', 'name', 'icon', 'sortOrder']), skills: published(category.skills).map(skill => pick(skill, ['id', 'name', 'sortOrder'])) })),
        learningTopics: published(topics).map(row => pick(row, ['slug', 'title', 'category', 'icon', 'tone', 'summary', 'focus', 'goal', 'learningStatus', 'sortOrder'])),
        milestones: published(milestones).map(row => pick(row, ['slug', 'title', 'description', 'category', 'icon', 'routeLabel', 'stage', 'tags', 'linkSection', 'linkLabel', 'occurredAt', 'sortOrder'])),
        education: published(education).map(row => pick(row, ['slug', 'institution', 'faculty', 'degree', 'studyStatus', 'coursework', 'achievements', 'startDate', 'endDate', 'sortOrder'])),
        experience: published(experience).map(row => pick(row, ['slug', 'title', 'category', 'organisation', 'description', 'startDate', 'endDate', 'sortOrder'])),
        certificates: published(certificates).filter(row => row.verified).map(row => ({ ...pick(row, ['slug', 'title', 'issuer', 'completedAt', 'credentialId', 'verificationUrl', 'sortOrder']), file: publicAsset(row.asset) })),
        socialLinks: published(socials).map(row => pick(row, ['platform', 'url', 'sortOrder'])),
      };
    },
  };
}
