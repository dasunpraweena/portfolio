const list = value => Array.isArray(value) ? value : [];
const textList = value => list(value).filter(item => typeof item === 'string');
const copyKeys = ['hero', 'about', 'skills', 'learning', 'journey', 'contact', 'footer'];

export function mapProject(project, resolveUrl) {
  if (!project || typeof project !== 'object' || typeof project.slug !== 'string') throw new Error('The API returned an invalid project.');
  return {
    ...project, id: project.slug, tech: textList(project.tech), technologies: textList(project.technologies), features: textList(project.features), repositoryUrl: resolveUrl(project.repositoryUrl), demoUrl: resolveUrl(project.demoUrl),
    screenshots: list(project.screenshots).map(file => typeof file === 'string' ? { url: resolveUrl(file), illustrative: false } : { ...file, url: resolveUrl(file?.url) }).filter(file => file.url),
  };
}

export function mapPortfolio(data, resolveUrl) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('The API returned invalid portfolio content.');
  const copy = Object.fromEntries(copyKeys.map(key => [key, textList(data.settings?.sectionCopy?.[key])]));
  const asset = value => { const url = resolveUrl(value?.url); return url ? { ...value, url } : null; };
  const socials = Object.fromEntries(list(data.socialLinks).map(link => [link.platform, resolveUrl(link.url)]));
  const titlePairs = { university: [13, 14], foundations: [21, 22], 'team-projects': [29, 30], 'industry-exposure': [36, 37], 'current-chapter': [44, 45], 'future-goal': [51, 52] };
  return {
    ...data, copy,
    settings: data.settings ? { ...data.settings, cv: asset(data.settings.cv) } : null,
    profile: data.profile ? { ...data.profile, heroTitle: textList(data.profile.heroTitle), aboutTitle: textList(data.profile.aboutTitle), about: textList(data.profile.about), values: textList(data.profile.values), photo: asset(data.profile.photo), socials, cv: { url: asset(data.settings?.cv)?.url || null, fileName: 'CV.pdf' } } : null,
    skillCategories: list(data.skillCategories).map(group => ({ ...group, items: list(group.skills).map(skill => skill.name).filter(Boolean) })),
    learningTopics: list(data.learningTopics).map(topic => ({ ...topic, id: topic.slug, focus: textList(topic.focus) })),
    milestones: list(data.milestones).map(milestone => {
      const lines = titlePairs[milestone.slug]?.map(index => copy.journey[index]);
      return { ...milestone, tags: textList(milestone.tags), titleLines: lines?.join('') === milestone.title ? lines : [milestone.title] };
    }),
    education: list(data.education), experience: list(data.experience),
    certificates: list(data.certificates).map(certificate => ({ ...certificate, verificationUrl: resolveUrl(certificate.verificationUrl), file: asset(certificate.file) })),
    socialLinks: list(data.socialLinks).map(link => ({ ...link, url: resolveUrl(link.url) })),
  };
}
