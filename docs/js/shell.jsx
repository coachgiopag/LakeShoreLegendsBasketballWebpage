/* global React */
/* Shared site chrome: Header (multi-page nav), Footer, Crest, SectionHead.
   Each page is its own HTML file; nav uses real <a href> links. */
const RxShell = React;

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: 'about.html' },
  { label: 'Training', href: 'training.html' },
  { label: 'Alumni', href: 'alumni.html' },
  { label: 'Jr. Mustangs', href: 'https://mundyball.com/feeder-home', external: true },
  { label: 'Gallery', href: 'gallery.html' },
  { label: 'Contact', href: 'contact.html' },
];

/* Six-point Chicago-flag star — brand motif (never a 5-point ★). */
function Star6({ size = 14, className = 'lsl-star6' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.6l2.0 6.0 6.3-.05-5.1 3.7 2.0 6.0-5.1-3.75-5.1 3.75 2.0-6.0-5.1-3.7 6.3.05z" />
    </svg>
  );
}

/* Inline brand glyphs (Lucide dropped brand icons). 24x24 viewBox. */
function SocialGlyph({ name, size = 20 }) {
  const paths = {
    instagram: <><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" ry="5.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/></>,
    x: <path fill="currentColor" d="M17.3 3h2.9l-6.34 7.25L21.5 21h-5.84l-4.57-5.98L5.86 21H2.95l6.78-7.75L2.5 3h5.99l4.13 5.46L17.3 3zm-1.02 16.27h1.61L7.8 4.64H6.07l10.21 14.63z"/>,
    linkedin: <><rect x="2.5" y="2.5" width="19" height="19" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path fill="currentColor" d="M7 9.5v8M7 6.6v.02M11 17.5v-4.4c0-1.3 1-2.3 2.3-2.3s2.2 1 2.2 2.3v4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/><circle cx="7" cy="6.6" r="1" fill="currentColor"/></>,
    facebook: <path fill="currentColor" d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.3-1.4 1.5-1.4h1.4V5.5C16.3 5.4 15.4 5.3 14.4 5.3c-2.2 0-3.7 1.3-3.7 3.8v2.1H8.2V14h2.5v7h2.8z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
  );
}

function Crest({ size = 46 }) {
  return (
    <img src="assets/badge-crest.png" alt="Lake Shore Legends" style={{ height: size, width: 'auto', display: 'block' }} />
  );
}

function Header({ page }) {
  const [scrolled, setScrolled] = RxShell.useState(false);
  const [open, setOpen] = RxShell.useState(false);
  RxShell.useEffect(() => {
    const sc = document.querySelector('.lsl-scroll');
    const onScroll = () => setScrolled((sc?.scrollTop || window.scrollY) > 20);
    sc?.addEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll);
    return () => { sc?.removeEventListener('scroll', onScroll); window.removeEventListener('scroll', onScroll); };
  }, []);
  return (
    <header className={'lsl-header' + (scrolled ? ' is-scrolled' : '')}>
      <div className="lsl-header__inner">
        <a className="lsl-brand" href="/">
          <Crest size={46} />
          <span className="lsl-brand__name">Lake&nbsp;Shore<br/>Legends</span>
        </a>
        <nav className="lsl-nav">
          {NAV.map((n) => (
            <a key={n.label}
               className={'lsl-nav__link' + (page === n.label ? ' is-active' : '')}
               href={n.href}
               {...(n.external ? { target: '_blank', rel: 'noopener' } : {})}>
              {n.label}
            </a>
          ))}
        </nav>
        <a className="lsl-btn lsl-btn--primary lsl-btn--sm lsl-header__cta" href="training.html#book">Start Training</a>
        <button className="lsl-burger" onClick={() => setOpen(!open)} aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      {open && (
        <div className="lsl-mobilenav">
          {NAV.map((n) => (
            <a key={n.label} href={n.href}
               {...(n.external ? { target: '_blank', rel: 'noopener' } : {})}>
              {n.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function SectionHead({ eyebrow, title, sub, light, center, wide, full, smTitle }) {
  return (
    <div className={'lsl-secthead' + (center ? ' lsl-secthead--center' : '') + (full ? ' lsl-secthead--full' : wide ? ' lsl-secthead--wide' : '')}>
      {eyebrow && <span className={'lsl-eyebrow' + (light ? ' lsl-eyebrow--light' : '')}>{eyebrow}</span>}
      {title && <h2 className={'lsl-h2' + (light ? ' lsl-h2--light' : '')} style={smTitle ? { fontSize: 'clamp(22px, 2.4vw, 32px)' } : undefined}>{title}</h2>}
      {sub && <p className={'lsl-body' + (light ? ' lsl-body--light' : '')}>{sub}</p>}
    </div>
  );
}

function PageHero({ eyebrow, title, sub, accent }) {
  return (
    <section className="lsl-pagehero">
      <div className={'lsl-pagehero__glow' + (accent === 'orange' ? ' is-orange' : '')}></div>
      <img className="lsl-pagehero__spire" src="assets/mark-spire-stars.png" alt="" aria-hidden="true" />
      <div className="lsl-pagehero__inner">
        <span className="lsl-eyebrow lsl-eyebrow--light">{eyebrow}</span>
        <h1 className="lsl-display lsl-display--md">{title}</h1>
        {sub && <p className="lsl-lede" style={{ maxWidth: 780, color: 'var(--fg-on-dark-2)' }}>{String(sub).split('\n').map((s, i, a) => <React.Fragment key={i}>{s}{i < a.length - 1 && <br/>}</React.Fragment>)}</p>}
      </div>
    </section>
  );
}

function CTA({ title = 'Turn Your Athlete Into a Legend', sub = 'Get in touch to learn about training, camps, and the Jr. Mustangs feeder program.', btn = 'Connect With Us', href = 'contact.html' }) {
  return (
    <section className="lsl-cta">
      <div className="lsl-cta__inner">
        <img className="lsl-cta__mark" src="assets/monogram-lsl.png" alt="" aria-hidden="true" />
        <h2 className="lsl-h2 lsl-h2--light">{title}</h2>
        <p className="lsl-body lsl-body--light">{sub}</p>
        <a className="lsl-btn lsl-btn--primary" href={href}>{btn}</a>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ['Quick Links', [['Meet Our Coaches', 'about.html'], ['Training Programs', 'training.html'], ['Alumni Success Stories', 'alumni.html'], ['Jr. Mustangs Feeder', 'https://mundyball.com/feeder-home']]],
    ['Follow Us', [['Twitter / X', 'https://x.com/LSLegendsHoops'], ['Instagram', 'https://www.instagram.com/coachgiopag/'], ['LinkedIn', 'https://www.linkedin.com/in/gio-paganis/'], ['Google Maps', 'https://www.google.com/maps/place/LakeShore+Legends+Basketball/@41.9743491,-87.795934,10z/data=!3m1!4b1!4m6!3m5!1s0xa30c2e7c809a2921:0x5a95a59e1b3711ea!8m2!3d41.9743491!4d-87.795934!16s%2Fg%2F11zy02tnkz']]],
    ['Resources', [['Contact Us', 'contact.html'], ['Code of Conduct', 'codes.html'], ['Forms', '#'], ['FAQs', 'contact.html']]],
  ];
  return (
    <footer className="lsl-footer">
      <div className="lsl-footer__top">
        <img src="assets/badge-crest.png" alt="LakeShore Legends Crest" className="lsl-footer__logoside" />
        <div className="lsl-footer__cols">
          {cols.map(([h, links]) => (
            <div key={h} className="lsl-footer__col">
              <h4 className="lsl-footer__h">{h}</h4>
              {links.map(([l, href]) => {
                const ext = href && href.startsWith('http');
                return (
                  <a key={l} className="lsl-footer__link" href={href || '#'}
                     {...(ext ? { target: '_blank', rel: 'noopener' } : {})}>{l}</a>
                );
              })}
            </div>
          ))}
        </div>
        <img src="assets/mark-spire-stars.png" alt="LakeShore Legends Spire" className="lsl-footer__logoside" />
      </div>
      <div className="lsl-footer__bar">
        <span>© 2026 LakeShore Legends Basketball</span>
        <span>Chicago, Illinois</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Star6, SocialGlyph, Crest, Header, SectionHead, PageHero, CTA, Footer, NAV });
