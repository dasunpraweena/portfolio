const field = (name, label, type = 'text', extra = {}) => ({ name, label, type, ...extra });
const text = (name, label, max = 500, extra = {}) => field(name, label, 'text', { required: true, max, ...extra });
const area = (name, label, max = 5000, extra = {}) => field(name, label, 'textarea', { required: true, max, ...extra });
const lines = (name, label, max = 300) => field(name, label, 'lines', { max, hint: 'One item per line.' });
const select = (name, label, options) => field(name, label, 'select', { options });
const optional = (name, label, type = 'text', max = 5000) => field(name, label, type, { nullable: true, max });
const slug = text('slug', 'URL slug', 100, { pattern: '[a-z0-9]+(?:-[a-z0-9]+)*', hint: 'Lowercase letters, numbers and hyphens.' });
const status = select('status', 'Visibility', ['DRAFT', 'PUBLISHED']);
const order = field('sortOrder', 'Display order', 'number', { min: 0, max: 100000 });
const icon = text('icon', 'Icon name', 50, { pattern: '[a-z0-9-]+', hint: 'For example: code, layers, book, school, tool, globe.' });
const common = [status, order];

export const resources = {
  projects: { label: 'Projects', title: 'Work worth sharing.', description: 'Curate projects, case studies, screenshots, and links.', singular: 'project', fields: [slug, text('name', 'Project title', 200), text('type', 'Project type', 100), select('category', 'Category', ['WEB', 'SOFTWARE', 'DATA']), area('short', 'Short description', 2000), lines('tags', 'Display tags'), select('visual', 'Illustrative cover', ['market', 'profix', 'pos', 'data', 'service', 'rocket']), select('workKind', 'Kind of work', ['CONCEPT', 'ACADEMIC']), field('verified', 'Implementation details verified', 'checkbox'), optional('implementationStatus', 'Implementation status', 'text', 200), area('problem', 'The problem', 10000), area('solution', 'The proposed solution', 10000), lines('features', 'Feature direction', 1000), optional('contribution', 'My contribution', 'textarea', 10000), optional('lessons', 'Challenges & lessons', 'textarea', 10000), optional('repositoryUrl', 'Repository URL', 'url', 2048), optional('demoUrl', 'Live demo URL', 'url', 2048), field('featured', 'Featured project', 'checkbox'), order], defaults: { type: 'Web Platform', category: 'WEB', visual: 'market', workKind: 'CONCEPT', verified: false, featured: false, sortOrder: 0 } },
  technologies: { label: 'Technologies', title: 'The building blocks.', description: 'Verified technology names available to project case studies.', singular: 'technology', fields: [text('name', 'Technology name', 100)] },
  'skill-categories': { label: 'Skill categories', title: 'Keep the toolkit organised.', description: 'Create areas for your technical practice.', singular: 'category', fields: [slug, text('name', 'Category name', 150), icon, ...common], defaults: { icon: 'code' } },
  skills: { label: 'Skills', title: 'Your technical toolkit.', description: 'Organise skills by what you build and how you work.', singular: 'skill', fields: [text('name', 'Skill name', 100), field('categoryId', 'Category', 'category', { required: true }), ...common] },
  education: { label: 'Education', title: 'Where the foundations grow.', description: 'Manage your university and academic background.', singular: 'education record', fields: [slug, text('institution', 'Institution', 300), optional('faculty', 'Faculty', 'text', 300), text('degree', 'Degree / qualification', 300), text('studyStatus', 'Study status', 100), lines('coursework', 'Relevant coursework'), lines('achievements', 'Verified academic achievements', 1000), optional('startDate', 'Start date', 'date'), optional('endDate', 'End / expected completion date', 'date'), ...common] },
  experience: { label: 'Experience', title: 'Experience, honestly presented.', description: 'Keep university activities separate from professional employment.', singular: 'experience record', fields: [slug, text('title', 'Title', 300), select('category', 'Experience category', ['Academic collaboration', 'University activity', 'Academic activity', 'Professional employment', 'Internship']), optional('organisation', 'Organisation', 'text', 300), optional('description', 'Description & responsibilities', 'textarea'), optional('startDate', 'Start date', 'date'), optional('endDate', 'End date', 'date'), ...common], defaults: { category: 'Academic collaboration' } },
  'learning-topics': { label: 'Currently learning', title: 'Currently learning.', description: 'The topics you are exploring and your next practice goals.', singular: 'learning topic', fields: [slug, text('title', 'Topic name', 200), text('category', 'Category', 100), icon, select('tone', 'Accent', ['green', 'blue', 'purple', 'amber']), area('summary', 'Public description'), lines('focus', 'Focus topics', 500), area('goal', 'Next practice goal'), select('learningStatus', 'Learning status', ['Currently learning', 'Exploring', 'Paused', 'Completed']), ...common], defaults: { icon: 'book', tone: 'green', learningStatus: 'Currently learning' } },
  milestones: { label: 'Journey milestones', title: 'Every chapter builds the next.', description: 'Your foundation, current chapter, and future goals.', singular: 'milestone', fields: [slug, text('title', 'Milestone title', 300), area('description', 'Description'), text('category', 'Category', 100), icon, text('routeLabel', 'Route label', 200), select('stage', 'Journey stage', ['FOUNDATION', 'CURRENT', 'GOAL']), lines('tags', 'Tags', 100), select('linkSection', 'Link to website section', ['', 'work', 'learning', 'contact']), optional('linkLabel', 'Link label', 'text', 200), optional('occurredAt', 'Confirmed milestone date', 'date'), ...common], defaults: { icon: 'book', stage: 'FOUNDATION', linkSection: '' } },
  certificates: { label: 'Certificates', title: 'Achievements with evidence.', description: 'Only publish completed, verified achievements.', singular: 'certificate', fields: [slug, text('title', 'Certificate / achievement title', 300), text('issuer', 'Issuing organisation', 300), optional('completedAt', 'Completion date', 'date'), optional('credentialId', 'Credential ID', 'text', 300), optional('verificationUrl', 'Verification URL', 'url', 2048), field('verified', 'I have verified this completed achievement', 'checkbox'), ...common], defaults: { verified: false } },
  'social-links': { label: 'Contact & social', title: 'Make the next connection easy.', description: 'Manage exact, verified social profile links.', singular: 'social link', fields: [text('platform', 'Platform', 100), optional('url', 'Profile URL', 'url', 2048), ...common] },
  profile: { label: 'Profile', title: 'Make it feel like you.', description: 'The person behind the work.', singleton: true, fields: [text('name', 'Full name', 150), field('email', 'Professional email', 'email', { required: true, max: 200 }), text('headline', 'Professional title', 200), lines('heroTitle', 'Hero headline lines', 200), area('introduction', 'Introduction'), lines('aboutTitle', 'About headline lines', 200), lines('about', 'About me paragraphs', 5000), lines('values', 'Personal values', 100), text('location', 'Location', 100), text('availability', 'Availability message', 200), status] },
  settings: { label: 'Website settings', title: 'The finishing touches.', description: 'Manage the website settings supported by your portfolio.', singleton: true, fields: [text('title', 'Website title', 200), area('description', 'SEO description', 1000), select('defaultTheme', 'Default website appearance', ['dark', 'light']), field('showAvailability', 'Show availability badge', 'checkbox'), optional('internalNotes', 'Private notes', 'textarea')], defaults: { defaultTheme: 'dark', showAvailability: true } },
};
export const sectionOptions = ['home', 'work', 'about', 'skills', 'learning', 'journey', 'education', 'experience', 'certificates', 'cv', 'contact'];
export const menu = [
  ['overview', 'grid', 'Overview'], ['profile', 'user', 'Profile'], ['projects', 'folder', 'Projects'], ['technologies', 'layers', 'Technologies'], ['skills', 'code', 'Skills'], ['education', 'school', 'Education'], ['experience', 'briefcase', 'Experience'], ['certificates', 'award', 'Certificates'], ['learning-topics', 'book', 'Currently learning'], ['milestones', 'pin', 'Journey milestones'], ['cv', 'file', 'CV / Resume'], ['assets', 'upload', 'Asset library'], ['social-links', 'globe', 'Contact & social'], ['messages', 'mail', 'Messages'], ['settings', 'settings', 'Website settings'],
];

export function createDraft(resource, record = null) {
  const definition = resources[resource];
  const draft = { status: 'DRAFT', sortOrder: 0, ...definition.defaults };
  for (const f of definition.fields) {
    const value = record?.[f.name] ?? draft[f.name];
    draft[f.name] = f.type === 'lines' ? (Array.isArray(value) ? value.join('\n') : '') : f.type === 'checkbox' ? Boolean(value) : f.type === 'date' ? value?.slice(0, 10) || '' : value ?? '';
  }
  if (resource === 'projects') {
    draft.technologyIds = record?.technologies?.map(item => item.technologyId) || [];
    draft.screenshots = record?.screenshots?.map(item => ({ assetId: item.assetId, caption: item.caption || '', illustrative: item.illustrative, sortOrder: item.sortOrder })) || [];
  }
  if (resource === 'profile') draft.photoAssetId = record?.photoAssetId || null;
  if (resource === 'certificates') draft.assetId = record?.assetId || null;
  if (resource === 'settings') { draft.cvAssetId = record?.cvAssetId || null; draft.cvPublished = record?.cvPublished || false; draft.sectionOrder = record?.sectionOrder || [...sectionOptions.slice(0, 6), 'contact']; draft.sectionCopy = structuredClone(record?.sectionCopy || {}); }
  return draft;
}
export function serializeDraft(resource, draft, { creating = false } = {}) {
  const result = {}, errors = {};
  for (const f of resources[resource].fields) {
    let value = draft[f.name];
    if (f.type === 'lines') {
      value = String(value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
      if (value.length > 100 || value.some(item => item.length > f.max)) errors[f.name] = `Use up to 100 items, each at most ${f.max} characters.`;
    } else if (f.type === 'checkbox') value = Boolean(value);
    else if (f.type === 'number') { value = Number(value); if (!Number.isInteger(value) || value < f.min || value > f.max) errors[f.name] = `Use a whole number from ${f.min} to ${f.max}.`; }
    else {
      value = String(value ?? '').trim();
      if (f.required && !value) errors[f.name] = 'This field is required.';
      if (f.max && value.length > f.max) errors[f.name] = `Use at most ${f.max} characters.`;
      if (value && f.pattern && !new RegExp('^(?:' + f.pattern + ')$').test(value)) errors[f.name] = 'Use the format described below.';
      if (value && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[f.name] = 'Enter a valid email address.';
      if (value && f.type === 'url') { try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(); } catch { errors[f.name] = 'Enter an HTTP or HTTPS URL without credentials.'; } }
      if (f.nullable && !value || f.name === 'linkSection' && !value) value = null;
    }
    result[f.name] = value;
  }
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) errors.endDate = 'The end date cannot precede the start date.';
  if (resource === 'projects') {
    result.technologyIds = [...new Set(draft.technologyIds || [])];
    if (result.technologyIds.length > 50) errors.technologyIds = 'Choose up to 50 technologies.';
    result.screenshots = (draft.screenshots || []).map((item, sortOrder) => ({ assetId: item.assetId, caption: item.caption?.trim() || null, illustrative: Boolean(item.illustrative), sortOrder }));
    if (creating) result.status = 'DRAFT';
  }
  if (resource === 'profile') result.photoAssetId = draft.photoAssetId || null;
  if (resource === 'certificates') { result.assetId = draft.assetId || null; if (result.status === 'PUBLISHED' && !result.verified) errors.verified = 'Verify this completed certificate before publishing.'; }
  if (resource === 'settings') {
    Object.assign(result, { sectionOrder: draft.sectionOrder, sectionCopy: draft.sectionCopy, cvAssetId: draft.cvAssetId || null, cvPublished: Boolean(draft.cvPublished) });
    if (result.cvPublished && !result.cvAssetId) errors.cvAssetId = 'Attach a real PDF before publishing the CV.';
    if (Object.keys(result.sectionCopy).some(key => key.length > 50 || !Array.isArray(result.sectionCopy[key]) || result.sectionCopy[key].length > 100 || result.sectionCopy[key].some(value => typeof value !== 'string' || value.length > 5000))) errors.sectionCopy = 'Section names may have up to 50 characters, with up to 100 text items of 5,000 characters each.';
  }
  return { data: result, errors };
}
export function labelFor(row) { return row?.name || row?.title || row?.institution || row?.platform || 'Untitled record'; }
