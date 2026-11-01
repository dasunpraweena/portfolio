import skills from '../data/skills.json';
import topics from '../data/learningTopics.json';
import Icon from './Icon';

export function SkillGroups() {
  return <div className="skill-groups" id="public-skills">{skills.map(group => <div className="skill-group" key={group.name}><h3><Icon name={group.icon} />{group.name}</h3><div className="skill-chips">{group.items.map(skill => <span className="skill-chip" key={skill}>{skill}</span>)}</div></div>)}</div>;
}

export function LearningCards() {
  return <div className="learning-card-grid" id="public-learning">{topics.map(topic => <article className={'learning-card learning-card--' + topic.tone} key={topic.id}>
    <div className="learning-card-top"><span className="learning-card-icon"><Icon name={topic.icon} /></span><span className="learning-card-category">{topic.category}</span></div>
    <h3>{topic.title}</h3><span className="learning-status">Currently learning</span><p>{topic.summary}</p>
    <div className="learning-focus-chips">{topic.focus.map(focus => <span key={focus}>{focus}</span>)}</div>
    <details className="learning-plan"><summary>My next practice goal <Icon name="chevron" /></summary><p><strong>Next step</strong>{topic.goal}</p></details>
  </article>)}</div>;
}
