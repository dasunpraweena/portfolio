import { Fragment, useEffect, useRef, useState } from 'react';
import ApiState from '../components/ApiState';
import { Emphasis } from '../components/FormattedText';
import { usePortfolio } from '../components/PortfolioProvider';
import { CvButton, SocialLinks } from '../components/ContentActions';

export default function Hero() {
  const { copy, profile, showNotice } = usePortfolio();
  const [localPhoto, setLocalPhoto] = useState(null);
  const [isDrop, setIsDrop] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => { if (localPhoto) URL.revokeObjectURL(localPhoto); };
  }, [localPhoto]);

  if (!profile) return <section className="hero container" id="home"><ApiState title="Introduction not published yet." /></section>;

  const photoSrc = localPhoto || profile.photo?.url || null;
  const pickPhoto = () => fileInputRef.current?.click();
  const handleFile = f => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 8 * 1024 * 1024) {
      showNotice?.('Choose a JPG, PNG, or WebP image smaller than 8 MB.');
      return;
    }
    const candidate = URL.createObjectURL(f);
    const probe = new Image();
    probe.onload = () => {
      setLocalPhoto(candidate);
      showNotice?.('Profile photo now appears on the portfolio preview for this session.');
    };
    probe.onerror = () => {
      URL.revokeObjectURL(candidate);
      showNotice?.('This image could not be opened.');
    };
    probe.src = candidate;
  };

  return (<>
<section className="hero container" id="home"><div className="hero-main"><div className="hero-copy">
<p className="eyebrow mono">{"Hi, I'm " + profile.name}</p>
<h1>{profile.heroTitle.map((line, index) => <Fragment key={index}>{index > 0 && <br />}{index ? <span>{line}</span> : line}</Fragment>)}</h1>
<div className="badge"><span className="status-dot"></span>{profile.headline}</div>
<p className="hero-desc"><Emphasis text={profile.introduction} phrase={copy.hero[5]} /></p>
<div className="hero-buttons"><a className="btn btn-primary" href="#work">{copy.hero[7]}<svg className="icon"><use href="#i-up-right"/></svg></a><CvButton label="Download CV" /></div>
<div className="hero-socials"><SocialLinks withIcon="true" tinyArrow="true" /><a className="social-link" href={'mailto:' + profile.email}><svg className="icon"><use href="#i-mail"/></svg>{copy.hero[8]}</a></div>
</div><div className="hero-art portrait-hero">
<div className="art-grid" aria-hidden="true"></div>
<figure className="portrait-card">
<span className="portrait-word" aria-hidden="true">dp</span>
<div
  className={'portrait-frame' + (isDrop ? ' is-drop' : '')}
  id="portrait-frame"
  onDragEnter={e => { e.preventDefault(); setIsDrop(true); }}
  onDragOver={e => { e.preventDefault(); setIsDrop(true); }}
  onDragLeave={e => { e.preventDefault(); setIsDrop(false); }}
  onDrop={e => { e.preventDefault(); setIsDrop(false); handleFile(e.dataTransfer?.files?.[0]); }}
>
<img id="hero-portrait" src={photoSrc || undefined} alt={'Portrait of ' + profile.name} hidden={!photoSrc} />
<div className="portrait-placeholder">
<span className="portrait-initials" aria-hidden="true">dp<span>.</span></span>
<button type="button" className="portrait-add" id="portrait-add" onClick={pickPhoto}><svg className="icon"><use href="#i-upload"/></svg>Add your photo</button>
</div>
<button type="button" className="portrait-replace" id="portrait-replace" aria-label="Change profile photo" onClick={pickPhoto}><svg className="icon"><use href="#i-upload"/></svg></button>
</div>
<div className="portrait-badge" aria-hidden="true"><svg className="ring" viewBox="0 0 128 128"><defs><path id="pcirc" d="M64,64 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0"/></defs><text fontSize="11" fontFamily="Courier New,monospace" letterSpacing="1"><textPath href="#pcirc" textLength="292" lengthAdjust="spacing">Software engineer · Sri Lanka · Always building · </textPath></text></svg><span className="core">&lt;/&gt;</span></div>
<div className="portrait-sticker"><i></i>React · Node.js · MySQL</div>
<figcaption><strong>Dasun Praweena</strong><span>Software Engineering Undergraduate<br />Sabaragamuwa University</span></figcaption>
</figure>
<input ref={fileInputRef} type="file" id="profile-file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
</div></div><div className="hero-bottom"><div><svg className="icon"><use href="#i-pin"/></svg>{profile.location ? 'Based in ' + profile.location : 'Location not added'}</div><div className="desktop-only"><span className="status-dot"></span>{copy.hero[28]}</div><a className="scroll-link" href="#work">{copy.hero[29]}<svg className="icon"><use href="#i-down"/></svg></a></div></section>
<div className="tech-ribbon"><div className="tech-track container"><span>{copy.hero[30]}<br />{copy.hero[31]}</span><span className="tech-item"><span className="tech-icon">{copy.hero[32]}</span>{copy.hero[33]}</span><span className="tech-item"><span className="tech-icon">{copy.hero[34]}</span>{copy.hero[35]}</span><span className="tech-item"><span className="tech-icon">{copy.hero[36]}</span>{copy.hero[37]}</span><span className="tech-item"><svg className="icon"><use href="#i-database"/></svg>{copy.hero[38]}</span><span className="tech-item"><span className="tech-icon">{copy.hero[39]}</span>{copy.hero[40]}</span><span className="tech-item"><svg className="icon"><use href="#i-github"/></svg>{copy.hero[41]}</span></div></div>

  </>);
}
