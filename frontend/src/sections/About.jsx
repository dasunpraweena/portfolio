import copy from '../data/copy.json';

export default function About() {
  return (<>
<section className="section about-section" id="about"><div className="container about-layout"><div className="about-art" role="img" aria-label="Dasun Praweena monogram illustration"><div className="about-orbit"></div><span className="about-monogram">{copy.about[0]}</span><span className="small-star">{copy.about[1]}</span><div className="about-art-caption"><span>{copy.about[2]}<br />{copy.about[3]}</span><span>{copy.about[4]}<br />{copy.about[5]}</span></div></div><div className="about-copy"><p className="section-label"><span>{copy.about[6]}</span>{copy.about[7]}</p><h2>{copy.about[8]}<br />{copy.about[9]}</h2><p>{copy.about[10]}<strong>{copy.about[11]}</strong>{copy.about[12]}</p><p>{copy.about[13]}</p><p>{copy.about[14]}</p><div className="about-values"><span><svg className="icon"><use href="#i-code"/></svg>{copy.about[15]}</span><span><svg className="icon"><use href="#i-user"/></svg>{copy.about[16]}</span><span><svg className="icon"><use href="#i-book"/></svg>{copy.about[17]}</span><span><svg className="icon"><use href="#i-layers"/></svg>{copy.about[18]}</span></div><a className="btn btn-text" href="#contact" style={{"marginTop":"20px"}}>{copy.about[19]}<svg className="icon"><use href="#i-arrow"/></svg></a></div></div></section>

  </>);
}
