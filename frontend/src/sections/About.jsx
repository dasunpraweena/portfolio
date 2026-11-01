import ApiState from '../components/ApiState';
import { Lines, Emphasis } from '../components/FormattedText';
import { usePortfolio } from '../components/PortfolioProvider';

export default function About() {
  const { copy, profile, portfolio } = usePortfolio();
  if (!profile) return <section className="section about-section" id="about"><div className="container"><ApiState title="About information not published yet." /></div></section>;
  return (<>
<section className="section about-section" id="about"><div className="container about-layout"><div className="about-art" role="img" aria-label={profile.name + (profile.photo ? " portrait" : " monogram illustration")}><div className="about-orbit"></div>{profile.photo ? <img className="profile-photo" src={profile.photo.url} alt={profile.name} /> : <span className="about-monogram">{profile.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLowerCase()}</span>}<span className="small-star">{copy.about[1]}</span><div className="about-art-caption"><span>{copy.about[2]}<br />{copy.about[3]}</span><span>{copy.about[4]}<br />{copy.about[5]}</span></div></div><div className="about-copy"><p className="section-label"><span>{copy.about[6]}</span>{copy.about[7]}</p><h2><Lines values={profile.aboutTitle} /></h2>{profile.about.map((paragraph, index) => <p key={index}><Emphasis text={paragraph} phrase={profile.name} /></p>)}<div className="about-values">{profile.values.map((value, index) => <span key={value}><svg className="icon"><use href={"#i-" + (["code", "user", "book", "layers"][index] || "check")} /></svg>{value}</span>)}</div><a className="btn btn-text" href="#contact" style={{"marginTop":"20px"}}>{copy.about[19]}<svg className="icon"><use href="#i-arrow"/></svg></a></div></div></section>

  </>);
}
