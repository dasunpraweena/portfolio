import { usePortfolio } from '../components/PortfolioProvider';
import { SocialLinks } from '../components/ContentActions';
import { useContactForm } from '../hooks/useContactForm';
import Icon from '../components/Icon';

export default function Contact() {
  const { copy, profile, portfolio } = usePortfolio();
  const { handleSubmit, clearValidity, status, message } = useContactForm();
  return <section className="section contact-section" id="contact"><div className="container contact-layout">
    <div className="contact-copy"><p className="section-label"><span>{copy.contact[0]}</span>{copy.contact[1]}</p>{portfolio.settings?.showAvailability !== false && profile?.availability && <div className="badge"><span className="status-dot"></span>{profile.availability}</div>}<h2>{copy.contact[3]}<br /><span>{copy.contact[4]}</span></h2><p>{copy.contact[5]}</p>{profile?.email && <a className="contact-email" href={'mailto:' + profile.email}>{profile.email} <Icon name="up-right" /></a>}<div className="hero-socials"><SocialLinks /></div></div>
    <form className="contact-form" id="contact-form" onSubmit={handleSubmit} onInput={clearValidity} aria-busy={status === 'pending'} aria-describedby="contact-hint">
      <div className="form-row"><label className="field"><span>{copy.contact[7] || 'Your name'}</span><input name="name" placeholder="What should I call you?" required maxLength="100" autoComplete="name" /></label><label className="field"><span>{copy.contact[8] || 'Email address'}</span><input name="email" type="email" placeholder="you@example.com" required maxLength="200" autoComplete="email" /></label></div>
      <label className="field"><span>{copy.contact[9] || 'Subject'}</span><input name="subject" placeholder="What's this about?" required maxLength="200" /></label>
      <label className="field"><span>{copy.contact[10] || 'Your message'}</span><textarea name="message" placeholder="Tell me a little about your idea…" required maxLength="5000"></textarea></label>
      <button className="btn btn-primary" type="submit" disabled={status === 'pending'}>{status === 'pending' ? 'Saving message…' : status === 'error' ? 'Retry message' : 'Send message'}<Icon name="up-right" /></button>
      <p className="form-hint" id="contact-hint">Send a message to my portfolio inbox. No email is sent automatically.</p>
      {message && <p className="contact-feedback" role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
    </form>
  </div></section>;
}
