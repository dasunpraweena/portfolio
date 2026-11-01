import copy from '../data/copy.json';
import { LearningCards } from '../components/LearningContent';

export default function Learning() {
  return (<>
<section className="section learning-section" id="learning" aria-labelledby="learning-heading">
<div className="container">
<div className="section-heading learning-section-heading"><div><p className="section-label"><span>{copy.learning[0]}</span>{copy.learning[1]}</p><h2 id="learning-heading">{copy.learning[2]}<span className="heading-dot">{copy.learning[3]}</span></h2><p className="section-subtitle">{copy.learning[4]}</p></div><div className="learning-active-label"><span className="status-dot"></span>{copy.learning[5]}</div></div>
<LearningCards />
<div className="learning-section-bottom"><span>{copy.learning[6]}</span><a href="#journey">{copy.learning[7]}<svg className="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>
</div></section>

  </>);
}
