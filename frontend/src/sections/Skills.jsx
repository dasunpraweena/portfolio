import { usePortfolio } from '../components/PortfolioProvider';
import { SkillGroups } from '../components/LearningContent';

export default function Skills() {
  const { copy, profile, portfolio } = usePortfolio();
  return (<>
<section className="section container" id="skills"><div className="skills-layout"><div><p className="section-label"><span>{copy.skills[0]}</span>{copy.skills[1]}</p><h2>{copy.skills[2]}<br />{copy.skills[3]}</h2><p className="section-subtitle">{copy.skills[4]}</p><div className="skill-note"><svg className="icon"><use href="#i-info"/></svg><span>{copy.skills[5]}<a href="#learning" className="learning-inline-link">{copy.skills[6]}</a>{copy.skills[7]}</span></div></div><SkillGroups /></div></section>

  </>);
}
