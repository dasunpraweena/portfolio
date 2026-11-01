import { profile } from '../data/profile';
import copy from '../data/copy.json';
import { SocialLink } from '../components/ContentActions';
import { useContactForm } from '../hooks/useContactForm';

export default function Contact() {
  const { handleSubmit, clearValidity } = useContactForm();
  return (<>
<section className="section contact-section" id="contact"><div className="container contact-layout"><div className="contact-copy"><p className="section-label"><span>{copy.contact[0]}</span>{copy.contact[1]}</p><div className="badge"><span className="status-dot"></span>{copy.contact[2]}</div><h2>{copy.contact[3]}<br /><span>{copy.contact[4]}</span></h2><p>{copy.contact[5]}</p><a className="contact-email" href={'mailto:' + profile.email}>{profile.email} <svg className="icon"><use href="#i-up-right"/></svg></a><div className="hero-socials"><SocialLink platform="GitHub" withIcon="false" tinyArrow="false" /><SocialLink platform="LinkedIn" withIcon="false" tinyArrow="false" /></div></div><form className="contact-form" id="contact-form" onSubmit={handleSubmit} onInput={clearValidity}><div className="form-row"><label className="field"><span>{copy.contact[7]}</span><input name="name" placeholder="What should I call you?" required maxLength="100" autoComplete="name" /></label><label className="field"><span>{copy.contact[8]}</span><input name="email" type="email" placeholder="you@example.com" required maxLength="200" autoComplete="email" /></label></div><label className="field"><span>{copy.contact[9]}</span><input name="subject" placeholder="What's this about?" required maxLength="200" /></label><label className="field"><span>{copy.contact[10]}</span><textarea name="message" placeholder="Tell me a little about your idea…" required maxLength="5000"></textarea></label><button className="btn btn-primary" type="submit">{copy.contact[11]}<svg className="icon"><use href="#i-up-right"/></svg></button><p className="form-hint">{copy.contact[12]}</p></form></div></section>

  </>);
}
