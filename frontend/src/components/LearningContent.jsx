import Icon from './Icon';
import { usePortfolio } from './PortfolioProvider';
import ApiState from './ApiState';

export function SkillGroups() {
  const { portfolio } = usePortfolio();
  const skills = portfolio.skillCategories;
  return <div className="skill-groups" id="public-skills">{skills.length ? skills.map(group => <div className="skill-group" key={group.id || group.slug}><h3><Icon name={group.icon} />{group.name}</h3><div className="skill-chips">{group.items.length ? group.items.map(skill => <span className="skill-chip" key={skill}>{skill}</span>) : <span className="muted">No skills published in this category yet.</span>}</div></div>) : <ApiState compact title="No skills published yet." />}</div>;
}

export function LearningCards() {
  const { portfolio } = usePortfolio();
  const topics = portfolio.learningTopics;
  if (!topics.length) return <ApiState compact title="No learning topics published yet." />;
  return <div className="learning-card-grid" id="public-learning">{topics.map(topic => <article className={'learning-card learning-card--' + topic.tone} key={topic.id}>
    <div className="learning-card-top"><span className="learning-card-icon"><Icon name={topic.icon} /></span><span className="learning-card-category">{topic.category}</span></div>
    <h3>{topic.title}</h3><span className="learning-status">{topic.learningStatus}</span><p>{topic.summary}</p>
    <div className="learning-focus-chips">{topic.focus.map(focus => <span key={focus}>{focus}</span>)}</div>
    <details className="learning-plan"><summary>My next practice goal <Icon name="chevron" /></summary><p><strong>Next step</strong>{topic.goal}</p></details>
  </article>)}</div>;
}
