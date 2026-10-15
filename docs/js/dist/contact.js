/* global React, SectionHead, LSL */
const {
  useState: useStateC
} = React;
const W3F_CONTACT = '82b032e9-660d-4edb-ade7-e9d2082a85ca';
const INTERESTS = ['Private Training', 'Small-Group Training', 'Summer Camp', 'School Day-Off Camp', 'Jr. Mustangs Feeder', 'Other'];
function ContactForm() {
  const [f, setF] = useStateC({
    parent: '',
    athlete: '',
    email: '',
    phone: '',
    grade: '',
    interest: '',
    message: ''
  });
  const [err, setErr] = useStateC({});
  const [sent, setSent] = useStateC(false);
  const [busy, setBusy] = useStateC(false);
  const set = k => e => {
    setF({
      ...f,
      [k]: e.target.value
    });
    setErr({
      ...err,
      [k]: undefined
    });
  };
  const validate = () => {
    const e = {};
    if (!f.parent.trim()) e.parent = 'Please enter a name.';
    if (!f.email.trim()) e.email = 'Email is required.';else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (f.phone && !/^[\d\s().+-]{7,}$/.test(f.phone)) e.phone = 'Enter a valid phone number.';
    if (!f.interest) e.interest = 'Select what you\'re interested in.';
    if (!f.message.trim() || f.message.trim().length < 10) e.message = 'Tell us a little more (10+ characters).';
    return e;
  };
  const submit = async ev => {
    ev.preventDefault();
    const e = validate();
    setErr(e);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    const key = W3F_CONTACT;
    if (key) {
      const subject = 'New Contact Inquiry — ' + f.interest + ' (' + f.parent + ')';
      const message = ['=== NEW CONTACT FORM SUBMISSION ===', '', 'INTERESTED IN: ' + f.interest, '', '--- CONTACT INFO ---', 'Parent / Guardian: ' + f.parent, 'Athlete Name: ' + (f.athlete || '—'), 'Email: ' + f.email, 'Phone: ' + (f.phone || '—'), 'Athlete Grade / Age: ' + (f.grade || '—'), '', '--- MESSAGE ---', f.message].join('\n');
      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            access_key: key,
            subject,
            message,
            from_name: 'LSL Contact Form',
            replyto: f.email,
            cc: '2244259490@tmomail.net'
          })
        });
      } catch (e) {/* non-blocking */}
    }
    setBusy(false);
    setSent(true);
  };
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [sent]);
  if (sent) {
    return /*#__PURE__*/React.createElement("div", {
      className: "lsl-form"
    }, /*#__PURE__*/React.createElement("div", {
      className: "lsl-formsuccess"
    }, /*#__PURE__*/React.createElement("div", {
      className: "lsl-formsuccess__ico"
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": "check"
    })), /*#__PURE__*/React.createElement("h3", {
      className: "lsl-h3"
    }, "Message Sent"), /*#__PURE__*/React.createElement("p", {
      className: "lsl-body",
      style: {
        maxWidth: 380,
        margin: '0 auto'
      }
    }, "Thanks, ", f.parent.split(' ')[0], ". We've received your inquiry about ", /*#__PURE__*/React.createElement("strong", null, f.interest), " and will reply to ", f.email, " within 1\u20132 business days.")));
  }
  return /*#__PURE__*/React.createElement("form", {
    className: "lsl-form",
    onSubmit: submit,
    noValidate: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Parent / Guardian ", /*#__PURE__*/React.createElement("span", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: 'lsl-input' + (err.parent ? ' is-error' : ''),
    value: f.parent,
    onChange: set('parent'),
    placeholder: "Jane Smith"
  }), err.parent && /*#__PURE__*/React.createElement("span", {
    className: "lsl-err"
  }, err.parent)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Athlete Name"), /*#__PURE__*/React.createElement("input", {
    className: "lsl-input",
    value: f.athlete,
    onChange: set('athlete'),
    placeholder: "Alex Smith"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Email ", /*#__PURE__*/React.createElement("span", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: 'lsl-input' + (err.email ? ' is-error' : ''),
    type: "email",
    value: f.email,
    onChange: set('email'),
    placeholder: "you@email.com"
  }), err.email && /*#__PURE__*/React.createElement("span", {
    className: "lsl-err"
  }, err.email)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Phone"), /*#__PURE__*/React.createElement("input", {
    className: 'lsl-input' + (err.phone ? ' is-error' : ''),
    value: f.phone,
    onChange: set('phone'),
    placeholder: "(224) 555-0142"
  }), err.phone && /*#__PURE__*/React.createElement("span", {
    className: "lsl-err"
  }, err.phone))), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Athlete Grade / Age"), /*#__PURE__*/React.createElement("input", {
    className: "lsl-input",
    value: f.grade,
    onChange: set('grade'),
    placeholder: "7th \xB7 Age 12"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "I'm Interested In ", /*#__PURE__*/React.createElement("span", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    className: 'lsl-select' + (err.interest ? ' is-error' : ''),
    value: f.interest,
    onChange: set('interest')
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select one\u2026"), INTERESTS.map(i => /*#__PURE__*/React.createElement("option", {
    key: i,
    value: i
  }, i))), err.interest && /*#__PURE__*/React.createElement("span", {
    className: "lsl-err"
  }, err.interest))), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field"
  }, /*#__PURE__*/React.createElement("label", null, "Message ", /*#__PURE__*/React.createElement("span", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("textarea", {
    className: 'lsl-textarea' + (err.message ? ' is-error' : ''),
    value: f.message,
    onChange: set('message'),
    placeholder: "Tell us about your athlete, their goals, and what you're looking for\u2026"
  }), err.message && /*#__PURE__*/React.createElement("span", {
    className: "lsl-err"
  }, err.message)), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "lsl-btn lsl-btn--primary lsl-form__submit",
    disabled: busy
  }, busy ? 'Sending…' : 'Send Message'), /*#__PURE__*/React.createElement("p", {
    className: "lsl-form__note"
  }, "We typically reply within 1\u20132 business days."));
}
function InfoCard() {
  const rows = [['mail', 'Email', /*#__PURE__*/React.createElement("a", {
    href: "mailto:coachgiopag@gmail.com"
  }, "coachgiopag@gmail.com")], ['phone', 'Phone', /*#__PURE__*/React.createElement("a", {
    href: "tel:+12244259490"
  }, "(224) 425-9490")], ['map-pin', 'Based In', /*#__PURE__*/React.createElement(React.Fragment, null, "Park Ridge, IL & Mundelein, IL", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("a", {
    href: "https://www.google.com/maps/place/LakeShore+Legends+Basketball/@41.9743491,-87.795934,10z/data=!3m1!4b1!4m6!3m5!1s0xa30c2e7c809a2921:0x5a95a59e1b3711ea!8m2!3d41.9743491!4d-87.795934!16s%2Fg%2F11zy02tnkz",
    target: "_blank",
    rel: "noopener"
  }, "View on Google Maps"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("a", {
    href: "https://g.page/r/CeoRNxuepZVaEBM/review",
    target: "_blank",
    rel: "noopener"
  }, "Leave a Google review"))], ['clock', 'Response Time', '1–2 business days']];
  const socials = [['instagram', 'https://www.instagram.com/coachgiopag/', 'Instagram'], ['x', 'https://x.com/CoachGioPag', 'X'], ['linkedin', 'https://www.linkedin.com/in/gio-paganis/', 'LinkedIn']];
  return /*#__PURE__*/React.createElement("div", {
    className: "lsl-infocard"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "lsl-h3",
    style: {
      color: '#fff',
      marginBottom: 6
    }
  }, "Get In Touch"), /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--light",
    style: {
      fontSize: 15
    }
  }, "Reach out directly or connect with us on social to stay up to date on camps, clinics, and announcements."), rows.map(([ico, k, v]) => /*#__PURE__*/React.createElement("div", {
    className: "lsl-infocard__row",
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-infocard__ico"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": ico
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lsl-infocard__k"
  }, k), /*#__PURE__*/React.createElement("div", {
    className: "lsl-infocard__v"
  }, v)))), /*#__PURE__*/React.createElement("div", {
    className: "lsl-social"
  }, socials.map(([ico, href, label]) => /*#__PURE__*/React.createElement("a", {
    key: ico,
    href: href,
    target: "_blank",
    rel: "noopener",
    "aria-label": label
  }, /*#__PURE__*/React.createElement(SocialGlyph, {
    name: ico
  })))));
}
function ContactSection() {
  return /*#__PURE__*/React.createElement("section", {
    className: "lsl-section lsl-section--cream"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-wrap"
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "Contact & Connect",
    title: "Let's Build Your Athlete's Game",
    sub: "Questions about training, camps, or the Jr. Mustangs feeder program? Send us a note \u2014 we'd love to hear from you."
  }), /*#__PURE__*/React.createElement("div", {
    className: "lsl-contactgrid"
  }, /*#__PURE__*/React.createElement(ContactForm, null), /*#__PURE__*/React.createElement(InfoCard, null))));
}
const FAQS = [['What ages and skill levels do you train?', "We work with athletes of all ages and skill levels. From rising 3rd graders to high school and college athletes, as long as you're serious about hoops, we will give you the skills and tools necessary to get you to the next level."], ['What\'s the difference between private and small-group training?', 'Private sessions are fully individualized & built around one athlete\'s specific needs and goals. Small-group training (2–4 athletes) keeps that personalized feedback while adding competitive, game-realistic reps at a lower per-session cost.'], ['When are summer camps and how do I register?', 'This summer\'s Mundelein Jr. Mustangs Feeder basketball camps are July 6th–10th and July 27th–31st. Camps are open to rising 3rd–8th graders and will be held at Mundelein High School in the Main Gym. Head to MundyBall.com/Camps or reach out to mundeleinboysbasketball@gmail.com for details.'], ['What is the Jr. Mustangs feeder program?', 'The Jr. Mustangs Feeder Basketball program is our winter competitive team pathway. It connects developing athletes in the Mundelein community to a structured, training-first team environment. Reach out and we\'ll connect you to the right people to get you involved!']];
function FAQ() {
  const [open, setOpen] = useStateC(0);
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [open]);
  return /*#__PURE__*/React.createElement("section", {
    className: "lsl-section lsl-section--cream",
    style: {
      paddingTop: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-wrap"
  }, /*#__PURE__*/React.createElement(SectionHead, {
    center: true,
    eyebrow: "FAQs",
    title: "Common Questions"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lsl-faq"
  }, FAQS.map(([q, a], i) => /*#__PURE__*/React.createElement("div", {
    className: 'lsl-faqitem' + (open === i ? ' is-open' : ''),
    key: q
  }, /*#__PURE__*/React.createElement("button", {
    className: "lsl-faqitem__q",
    onClick: () => setOpen(open === i ? -1 : i)
  }, q, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lsl-faqitem__a",
    style: {
      maxHeight: open === i ? '320px' : '0'
    }
  }, /*#__PURE__*/React.createElement("p", null, a)))))));
}
Object.assign(window, {
  ContactSection,
  FAQ
});
