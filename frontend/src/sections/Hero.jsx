import { Fragment } from 'react';
import ApiState from '../components/ApiState';
import { Emphasis } from '../components/FormattedText';
import { usePortfolio } from '../components/PortfolioProvider';
import { CvButton, SocialLinks } from '../components/ContentActions';

export default function Hero() {
  const { copy, profile, portfolio } = usePortfolio();
  if (!profile) return <section className="hero container" id="home"><ApiState title="Introduction not published yet." /></section>;
  return (<>
<section className="hero container" id="home"><div className="hero-main"><div className="hero-copy">
<p className="eyebrow mono">{"Hi, I'm " + profile.name}</p>
<h1>{profile.heroTitle.map((line, index) => <Fragment key={index}>{index > 0 && <br />}{index ? <span>{line}</span> : line}</Fragment>)}</h1>
<div className="badge"><span className="status-dot"></span>{profile.headline}</div>
<p className="hero-desc"><Emphasis text={profile.introduction} phrase={copy.hero[5]} /></p>
<div className="hero-buttons"><a className="btn btn-primary" href="#work">{copy.hero[7]}<svg className="icon"><use href="#i-up-right"/></svg></a><CvButton label="Download CV" /></div>
<div className="hero-socials"><SocialLinks withIcon="true" tinyArrow="true" /><a className="social-link" href={'mailto:' + profile.email}><svg className="icon"><use href="#i-mail"/></svg>{copy.hero[8]}</a></div>
</div><div className="hero-art" role="img" aria-label="Abstract layered architecture illustration with a code card: curious, collaborative, always learning">
<div className="art-grid"></div><span className="art-coordinate mono">{copy.hero[9]}</span><span className="art-star">{copy.hero[10]}</span>
<svg className="orbital-art" viewBox="0 0 500 450" aria-hidden="true"><defs><linearGradient id="cube-top" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#edffb5"/><stop offset="1" stopColor="#adce68"/></linearGradient><linearGradient id="cube-side"><stop stopColor="#65833c"/><stop offset="1" stopColor="#8ea854"/></linearGradient><linearGradient id="cube-front" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a9ca69"/><stop offset="1" stopColor="#719344"/></linearGradient></defs>
<ellipse cx="264" cy="241" rx="202" ry="99" fill="none" stroke="#8caa5a" strokeOpacity=".25" transform="rotate(-28 264 241)"/><ellipse cx="264" cy="241" rx="188" ry="159" fill="none" stroke="#8caa5a" strokeOpacity=".15" strokeDasharray="3 7"/>
<path d="m119 274 145-83 145 83-145 84Z" fill="#24331c" stroke="#789a48" strokeWidth="1"/><path d="m119 274 145 84 145-84v16l-145 84-145-84Z" fill="#1c2a16" stroke="#789a48" strokeWidth="1"/>
<path d="m143 235 121-70 121 70-121 71Z" fill="url(#cube-top)"/><path d="m143 235 121 71v28l-121-70Z" fill="url(#cube-front)"/><path d="m264 306 121-71v29l-121 70Z" fill="url(#cube-side)"/>
<path d="m162 179 102-59 102 59-102 59Z" fill="none" stroke="#c1e481" strokeWidth="1"/><path d="m162 179 102 59 102-59v24l-102 59-102-59Z" fill="#b9dd751a" stroke="#b7d974" strokeWidth="1"/>
<path d="m182 128 82-47 82 47-82 48Z" fill="url(#cube-top)"/><path d="m182 128 82 48v27l-82-48Z" fill="url(#cube-front)"/><path d="m264 176 82-48v27l-82 48Z" fill="url(#cube-side)"/>
<path d="m264 81 82 47-82 48-82-48 82-47Zm0 0v95" fill="none" stroke="#f0ffbf" strokeOpacity=".3"/><path d="M264 207v30m0 25v40" stroke="#e4ff9d" strokeWidth="1" strokeDasharray="3 4"/>
<circle cx="85" cy="273" r="4" fill="#d3f96b"/><circle cx="397" cy="133" r="3" fill="#d3f96b"/><path d="M403 337h13m-6-6v13M122 118h9m-4-4v9" stroke="#a2be6f"/><text x="327" y="382" fill="#8eaa69" fontSize="9" fontFamily="monospace" letterSpacing="2">{copy.hero[11]}</text></svg>
<div className="floating-label"><svg className="icon"><use href="#i-code"/></svg>{copy.hero[12]}</div>
<div className="code-card"><div className="code-card-head"><i></i><i></i><i></i><span>{copy.hero[13]}</span></div><code><span className="code-key">{copy.hero[14]}</span>{copy.hero[15]}<br />{copy.hero[16]}<span className="code-value">{copy.hero[17]}</span>{copy.hero[18]}<br />{copy.hero[19]}<span className="code-value">{copy.hero[20]}</span>{copy.hero[21]}<br />{copy.hero[22]}<span className="code-value">{copy.hero[23]}</span><br />{copy.hero[24]}</code></div>
<div className="art-caption">{copy.hero[25]}<br />{copy.hero[26]}</div>
</div></div><div className="hero-bottom"><div><svg className="icon"><use href="#i-pin"/></svg>{profile.location ? 'Based in ' + profile.location : 'Location not added'}</div><div className="desktop-only"><span className="status-dot"></span>{copy.hero[28]}</div><a className="scroll-link" href="#work">{copy.hero[29]}<svg className="icon"><use href="#i-down"/></svg></a></div></section>
<div className="tech-ribbon"><div className="tech-track container"><span>{copy.hero[30]}<br />{copy.hero[31]}</span><span className="tech-item"><span className="tech-icon">{copy.hero[32]}</span>{copy.hero[33]}</span><span className="tech-item"><span className="tech-icon">{copy.hero[34]}</span>{copy.hero[35]}</span><span className="tech-item"><span className="tech-icon">{copy.hero[36]}</span>{copy.hero[37]}</span><span className="tech-item"><svg className="icon"><use href="#i-database"/></svg>{copy.hero[38]}</span><span className="tech-item"><span className="tech-icon">{copy.hero[39]}</span>{copy.hero[40]}</span><span className="tech-item"><svg className="icon"><use href="#i-github"/></svg>{copy.hero[41]}</span></div></div>

  </>);
}
