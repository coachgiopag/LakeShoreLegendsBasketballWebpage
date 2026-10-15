/* global React, SectionHead, LSL */
const { useState: useStateC } = React;

const W3F_CONTACT = '82b032e9-660d-4edb-ade7-e9d2082a85ca';

const INTERESTS = ['Private Training', 'Small-Group Training', 'Summer Camp', 'School Day-Off Camp', 'Jr. Mustangs Feeder', 'Other'];

function ContactForm() {
  const [f, setF] = useStateC({ parent: '', athlete: '', email: '', phone: '', grade: '', interest: '', message: '' });
  const [err, setErr] = useStateC({});
  const [sent, setSent] = useStateC(false);
  const [busy, setBusy] = useStateC(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined }); };

  const validate = () => {
    const e = {};
    if (!f.parent.trim()) e.parent = 'Please enter a name.';
    if (!f.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (f.phone && !/^[\d\s().+-]{7,}$/.test(f.phone)) e.phone = 'Enter a valid phone number.';
    if (!f.interest) e.interest = 'Select what you\'re interested in.';
    if (!f.message.trim() || f.message.trim().length < 10) e.message = 'Tell us a little more (10+ characters).';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErr(e);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    const key = W3F_CONTACT;
    if (key) {
      const subject = 'New Contact Inquiry — ' + f.interest + ' (' + f.parent + ')';
      const message = [
        '=== NEW CONTACT FORM SUBMISSION ===',
        '',
        'INTERESTED IN: ' + f.interest,
        '',
        '--- CONTACT INFO ---',
        'Parent / Guardian: ' + f.parent,
        'Athlete Name: ' + (f.athlete || '—'),
        'Email: ' + f.email,
        'Phone: ' + (f.phone || '—'),
        'Athlete Grade / Age: ' + (f.grade || '—'),
        '',
        '--- MESSAGE ---',
        f.message,
      ].join('\n');
      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: key, subject, message, from_name: 'LSL Contact Form', replyto: f.email, cc: '2244259490@tmomail.net' }),
        });
      } catch (e) { /* non-blocking */ }
    }
    setBusy(false);
    setSent(true);
  };

  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [sent]);

  if (sent) {
    return (
      <div className="lsl-form">
        <div className="lsl-formsuccess">
          <div className="lsl-formsuccess__ico"><i data-lucide="check"></i></div>
          <h3 className="lsl-h3">Message Sent</h3>
          <p className="lsl-body" style={{ maxWidth: 380, margin: '0 auto' }}>Thanks, {f.parent.split(' ')[0]}. We've received your inquiry about <strong>{f.interest}</strong> and will reply to {f.email} within 1–2 business days.</p>
        </div>
      </div>
    );
  }
  return (
    <form className="lsl-form" onSubmit={submit} noValidate>
      <div className="lsl-field lsl-field--row">
        <div>
          <label>Parent / Guardian <span className="req">*</span></label>
          <input className={'lsl-input' + (err.parent ? ' is-error' : '')} value={f.parent} onChange={set('parent')} placeholder="Jane Smith" />
          {err.parent && <span className="lsl-err">{err.parent}</span>}
        </div>
        <div>
          <label>Athlete Name</label>
          <input className="lsl-input" value={f.athlete} onChange={set('athlete')} placeholder="Alex Smith" />
        </div>
      </div>
      <div className="lsl-field lsl-field--row">
        <div>
          <label>Email <span className="req">*</span></label>
          <input className={'lsl-input' + (err.email ? ' is-error' : '')} type="email" value={f.email} onChange={set('email')} placeholder="you@email.com" />
          {err.email && <span className="lsl-err">{err.email}</span>}
        </div>
        <div>
          <label>Phone</label>
          <input className={'lsl-input' + (err.phone ? ' is-error' : '')} value={f.phone} onChange={set('phone')} placeholder="(224) 555-0142" />
          {err.phone && <span className="lsl-err">{err.phone}</span>}
        </div>
      </div>
      <div className="lsl-field lsl-field--row">
        <div>
          <label>Athlete Grade / Age</label>
          <input className="lsl-input" value={f.grade} onChange={set('grade')} placeholder="7th · Age 12" />
        </div>
        <div>
          <label>I'm Interested In <span className="req">*</span></label>
          <select className={'lsl-select' + (err.interest ? ' is-error' : '')} value={f.interest} onChange={set('interest')}>
            <option value="">Select one…</option>
            {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          {err.interest && <span className="lsl-err">{err.interest}</span>}
        </div>
      </div>
      <div className="lsl-field">
        <label>Message <span className="req">*</span></label>
        <textarea className={'lsl-textarea' + (err.message ? ' is-error' : '')} value={f.message} onChange={set('message')}
          placeholder="Tell us about your athlete, their goals, and what you're looking for…"></textarea>
        {err.message && <span className="lsl-err">{err.message}</span>}
      </div>
      <button type="submit" className="lsl-btn lsl-btn--primary lsl-form__submit" disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button>
      <p className="lsl-form__note">We typically reply within 1–2 business days.</p>
    </form>
  );
}

function InfoCard() {
  const rows = [
    ['mail', 'Email', <a href="mailto:coachgiopag@gmail.com">coachgiopag@gmail.com</a>],
    ['phone', 'Phone', <a href="tel:+12244259490">(224) 425-9490</a>],
    ['map-pin', 'Based In', <>Park Ridge, IL &amp; Mundelein, IL<br /><a href="https://www.google.com/maps/place/LakeShore+Legends+Basketball/@41.9743491,-87.795934,10z/data=!3m1!4b1!4m6!3m5!1s0xa30c2e7c809a2921:0x5a95a59e1b3711ea!8m2!3d41.9743491!4d-87.795934!16s%2Fg%2F11zy02tnkz" target="_blank" rel="noopener">View on Google Maps</a><br /><a href="https://g.page/r/CeoRNxuepZVaEBM/review" target="_blank" rel="noopener">Leave a Google review</a></>],
    ['clock', 'Response Time', '1–2 business days'],
  ];
  const socials = [
    ['instagram', 'https://www.instagram.com/coachgiopag/', 'Instagram'],
    ['x', 'https://x.com/CoachGioPag', 'X'],
    ['linkedin', 'https://www.linkedin.com/in/gio-paganis/', 'LinkedIn'],
  ];
  return (
    <div className="lsl-infocard">
      <h3 className="lsl-h3" style={{ color: '#fff', marginBottom: 6 }}>Get In Touch</h3>
      <p className="lsl-body lsl-body--light" style={{ fontSize: 15 }}>Reach out directly or connect with us on social to stay up to date on camps, clinics, and announcements.</p>
      {rows.map(([ico, k, v]) => (
        <div className="lsl-infocard__row" key={k}>
          <div className="lsl-infocard__ico"><i data-lucide={ico}></i></div>
          <div>
            <div className="lsl-infocard__k">{k}</div>
            <div className="lsl-infocard__v">{v}</div>
          </div>
        </div>
      ))}
      <div className="lsl-social">
        {socials.map(([ico, href, label]) => (
          <a key={ico} href={href} target="_blank" rel="noopener" aria-label={label}><SocialGlyph name={ico} /></a>
        ))}
      </div>
    </div>
  );
}

function ContactSection() {
  return (
    <section className="lsl-section lsl-section--cream">
      <div className="lsl-wrap">
        <SectionHead eyebrow="Contact & Connect"
          title="Let's Build Your Athlete's Game"
          sub="Questions about training, camps, or the Jr. Mustangs feeder program? Send us a note — we'd love to hear from you." />
        <div className="lsl-contactgrid">
          <ContactForm />
          <InfoCard />
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ['What ages and skill levels do you train?', "We work with athletes of all ages and skill levels. From rising 3rd graders to high school and college athletes, as long as you're serious about hoops, we will give you the skills and tools necessary to get you to the next level."],
  ['What\'s the difference between private and small-group training?', 'Private sessions are fully individualized & built around one athlete\'s specific needs and goals. Small-group training (2–4 athletes) keeps that personalized feedback while adding competitive, game-realistic reps at a lower per-session cost.'],
  ['When are summer camps and how do I register?', 'This summer\'s Mundelein Jr. Mustangs Feeder basketball camps are July 6th–10th and July 27th–31st. Camps are open to rising 3rd–8th graders and will be held at Mundelein High School in the Main Gym. Head to MundyBall.com/Camps or reach out to mundeleinboysbasketball@gmail.com for details.'],
  ['What is the Jr. Mustangs feeder program?', 'The Jr. Mustangs Feeder Basketball program is our winter competitive team pathway. It connects developing athletes in the Mundelein community to a structured, training-first team environment. Reach out and we\'ll connect you to the right people to get you involved!'],
];

function FAQ() {
  const [open, setOpen] = useStateC(0);
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [open]);
  return (
    <section className="lsl-section lsl-section--cream" style={{ paddingTop: 0 }}>
      <div className="lsl-wrap">
        <SectionHead center eyebrow="FAQs" title="Common Questions" />
        <div className="lsl-faq">
          {FAQS.map(([q, a], i) => (
            <div className={'lsl-faqitem' + (open === i ? ' is-open' : '')} key={q}>
              <button className="lsl-faqitem__q" onClick={() => setOpen(open === i ? -1 : i)}>
                {q}<i data-lucide="plus"></i>
              </button>
              <div className="lsl-faqitem__a" style={{ maxHeight: open === i ? '320px' : '0' }}>
                <p>{a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { ContactSection, FAQ });
