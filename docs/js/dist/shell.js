function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* global React */
/* Shared site chrome: Header (multi-page nav), Footer, Crest, SectionHead.
   Each page is its own HTML file; nav uses real <a href> links. */
var RxShell = React;
var NAV = [{
  label: 'Home',
  href: '/'
}, {
  label: 'About',
  href: 'about.html'
}, {
  label: 'Training',
  href: 'training.html'
}, {
  label: 'Alumni',
  href: 'alumni.html'
}, {
  label: 'Jr. Mustangs',
  href: 'https://mundyball.com/feeder-home',
  external: true
}, {
  label: 'Gallery',
  href: 'gallery.html'
}, {
  label: 'Contact',
  href: 'contact.html'
}];

/* Six-point Chicago-flag star — brand motif (never a 5-point ★). */
function Star6(_ref) {
  var _ref$size = _ref.size,
    size = _ref$size === void 0 ? 14 : _ref$size,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? 'lsl-star6' : _ref$className;
  return /*#__PURE__*/React.createElement("svg", {
    className: className,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 1.6l2.0 6.0 6.3-.05-5.1 3.7 2.0 6.0-5.1-3.75-5.1 3.75 2.0-6.0-5.1-3.7 6.3.05z"
  }));
}

/* Inline brand glyphs (Lucide dropped brand icons). 24x24 viewBox. */
function SocialGlyph(_ref2) {
  var name = _ref2.name,
    _ref2$size = _ref2.size,
    size = _ref2$size === void 0 ? 20 : _ref2$size;
  var paths = {
    instagram: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "2.5",
      y: "2.5",
      width: "19",
      height: "19",
      rx: "5.5",
      ry: "5.5",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "4.2",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "17.4",
      cy: "6.6",
      r: "1.3",
      fill: "currentColor"
    })),
    x: /*#__PURE__*/React.createElement("path", {
      fill: "currentColor",
      d: "M17.3 3h2.9l-6.34 7.25L21.5 21h-5.84l-4.57-5.98L5.86 21H2.95l6.78-7.75L2.5 3h5.99l4.13 5.46L17.3 3zm-1.02 16.27h1.61L7.8 4.64H6.07l10.21 14.63z"
    }),
    linkedin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "2.5",
      y: "2.5",
      width: "19",
      height: "19",
      rx: "2.5",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8"
    }), /*#__PURE__*/React.createElement("path", {
      fill: "currentColor",
      d: "M7 9.5v8M7 6.6v.02M11 17.5v-4.4c0-1.3 1-2.3 2.3-2.3s2.2 1 2.2 2.3v4.4",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      fill: "none"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "7",
      cy: "6.6",
      r: "1",
      fill: "currentColor"
    })),
    facebook: /*#__PURE__*/React.createElement("path", {
      fill: "currentColor",
      d: "M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.3-1.4 1.5-1.4h1.4V5.5C16.3 5.4 15.4 5.3 14.4 5.3c-2.2 0-3.7 1.3-3.7 3.8v2.1H8.2V14h2.5v7h2.8z"
    })
  };
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, paths[name]);
}
function Crest(_ref3) {
  var _ref3$size = _ref3.size,
    size = _ref3$size === void 0 ? 46 : _ref3$size;
  return /*#__PURE__*/React.createElement("img", {
    src: "assets/badge-crest.png",
    alt: "Lake Shore Legends",
    style: {
      height: size,
      width: 'auto',
      display: 'block'
    }
  });
}
function Header(_ref4) {
  var page = _ref4.page;
  var _RxShell$useState = RxShell.useState(false),
    _RxShell$useState2 = _slicedToArray(_RxShell$useState, 2),
    scrolled = _RxShell$useState2[0],
    setScrolled = _RxShell$useState2[1];
  var _RxShell$useState3 = RxShell.useState(false),
    _RxShell$useState4 = _slicedToArray(_RxShell$useState3, 2),
    open = _RxShell$useState4[0],
    setOpen = _RxShell$useState4[1];
  RxShell.useEffect(() => {
    var sc = document.querySelector('.lsl-scroll');
    var onScroll = () => setScrolled(((sc === null || sc === void 0 ? void 0 : sc.scrollTop) || window.scrollY) > 20);
    sc === null || sc === void 0 || sc.addEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll);
    return () => {
      sc === null || sc === void 0 || sc.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return /*#__PURE__*/React.createElement("header", {
    className: 'lsl-header' + (scrolled ? ' is-scrolled' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-header__inner"
  }, /*#__PURE__*/React.createElement("a", {
    className: "lsl-brand",
    href: "/"
  }, /*#__PURE__*/React.createElement(Crest, {
    size: 46
  }), /*#__PURE__*/React.createElement("span", {
    className: "lsl-brand__name"
  }, "Lake\xA0Shore", /*#__PURE__*/React.createElement("br", null), "Legends")), /*#__PURE__*/React.createElement("nav", {
    className: "lsl-nav"
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", _extends({
    key: n.label,
    className: 'lsl-nav__link' + (page === n.label ? ' is-active' : ''),
    href: n.href
  }, n.external ? {
    target: '_blank',
    rel: 'noopener'
  } : {}), n.label))), /*#__PURE__*/React.createElement("a", {
    className: "lsl-btn lsl-btn--primary lsl-btn--sm lsl-header__cta",
    href: "training.html#book"
  }, "Start Training"), /*#__PURE__*/React.createElement("button", {
    className: "lsl-burger",
    onClick: () => setOpen(!open),
    "aria-label": "Menu"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null))), open && /*#__PURE__*/React.createElement("div", {
    className: "lsl-mobilenav"
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", _extends({
    key: n.label,
    href: n.href
  }, n.external ? {
    target: '_blank',
    rel: 'noopener'
  } : {}), n.label))));
}
function SectionHead(_ref5) {
  var eyebrow = _ref5.eyebrow,
    title = _ref5.title,
    sub = _ref5.sub,
    light = _ref5.light,
    center = _ref5.center,
    wide = _ref5.wide,
    full = _ref5.full,
    smTitle = _ref5.smTitle;
  return /*#__PURE__*/React.createElement("div", {
    className: 'lsl-secthead' + (center ? ' lsl-secthead--center' : '') + (full ? ' lsl-secthead--full' : wide ? ' lsl-secthead--wide' : '')
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    className: 'lsl-eyebrow' + (light ? ' lsl-eyebrow--light' : '')
  }, eyebrow), title && /*#__PURE__*/React.createElement("h2", {
    className: 'lsl-h2' + (light ? ' lsl-h2--light' : ''),
    style: smTitle ? {
      fontSize: 'clamp(22px, 2.4vw, 32px)'
    } : undefined
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    className: 'lsl-body' + (light ? ' lsl-body--light' : '')
  }, sub));
}
function PageHero(_ref6) {
  var eyebrow = _ref6.eyebrow,
    title = _ref6.title,
    sub = _ref6.sub,
    accent = _ref6.accent;
  return /*#__PURE__*/React.createElement("section", {
    className: "lsl-pagehero"
  }, /*#__PURE__*/React.createElement("div", {
    className: 'lsl-pagehero__glow' + (accent === 'orange' ? ' is-orange' : '')
  }), /*#__PURE__*/React.createElement("img", {
    className: "lsl-pagehero__spire",
    src: "assets/mark-spire-stars.png",
    alt: "",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lsl-pagehero__inner"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lsl-eyebrow lsl-eyebrow--light"
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    className: "lsl-display lsl-display--md"
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    className: "lsl-lede",
    style: {
      maxWidth: 780,
      color: 'var(--fg-on-dark-2)'
    }
  }, String(sub).split('\n').map((s, i, a) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, s, i < a.length - 1 && /*#__PURE__*/React.createElement("br", null))))));
}
function CTA(_ref7) {
  var _ref7$title = _ref7.title,
    title = _ref7$title === void 0 ? 'Turn Your Athlete Into a Legend' : _ref7$title,
    _ref7$sub = _ref7.sub,
    sub = _ref7$sub === void 0 ? 'Get in touch to learn about training, camps, and the Jr. Mustangs feeder program.' : _ref7$sub,
    _ref7$btn = _ref7.btn,
    btn = _ref7$btn === void 0 ? 'Connect With Us' : _ref7$btn,
    _ref7$href = _ref7.href,
    href = _ref7$href === void 0 ? 'contact.html' : _ref7$href;
  return /*#__PURE__*/React.createElement("section", {
    className: "lsl-cta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-cta__inner"
  }, /*#__PURE__*/React.createElement("img", {
    className: "lsl-cta__mark",
    src: "assets/monogram-lsl.png",
    alt: "",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("h2", {
    className: "lsl-h2 lsl-h2--light"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--light"
  }, sub), /*#__PURE__*/React.createElement("a", {
    className: "lsl-btn lsl-btn--primary",
    href: href
  }, btn)));
}
function Footer() {
  var cols = [['Quick Links', [['Meet Our Coaches', 'about.html'], ['Training Programs', 'training.html'], ['Alumni Success Stories', 'alumni.html'], ['Jr. Mustangs Feeder', 'https://mundyball.com/feeder-home']]], ['Follow Us', [['Twitter / X', 'https://x.com/LSLegendsHoops'], ['Instagram', 'https://www.instagram.com/coachgiopag/'], ['LinkedIn', 'https://www.linkedin.com/in/gio-paganis/'], ['Google Maps', 'https://www.google.com/maps/place/LakeShore+Legends+Basketball/@41.9743491,-87.795934,10z/data=!3m1!4b1!4m6!3m5!1s0xa30c2e7c809a2921:0x5a95a59e1b3711ea!8m2!3d41.9743491!4d-87.795934!16s%2Fg%2F11zy02tnkz'], ['Leave a Review', 'https://g.page/r/CeoRNxuepZVaEBM/review']]], ['Resources', [['Contact Us', 'contact.html'], ['Code of Conduct', 'codes.html'], ['Forms', '#'], ['FAQs', 'contact.html']]]];
  return /*#__PURE__*/React.createElement("footer", {
    className: "lsl-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-footer__top"
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/badge-crest.png",
    alt: "LakeShore Legends Crest",
    className: "lsl-footer__logoside"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lsl-footer__cols"
  }, cols.map(_ref8 => {
    var _ref9 = _slicedToArray(_ref8, 2),
      h = _ref9[0],
      links = _ref9[1];
    return /*#__PURE__*/React.createElement("div", {
      key: h,
      className: "lsl-footer__col"
    }, /*#__PURE__*/React.createElement("h4", {
      className: "lsl-footer__h"
    }, h), links.map(_ref0 => {
      var _ref1 = _slicedToArray(_ref0, 2),
        l = _ref1[0],
        href = _ref1[1];
      var ext = href && href.startsWith('http');
      return /*#__PURE__*/React.createElement("a", _extends({
        key: l,
        className: "lsl-footer__link",
        href: href || '#'
      }, ext ? {
        target: '_blank',
        rel: 'noopener'
      } : {}), l);
    }));
  })), /*#__PURE__*/React.createElement("img", {
    src: "assets/mark-spire-stars.png",
    alt: "LakeShore Legends Spire",
    className: "lsl-footer__logoside"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lsl-footer__bar"
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 LakeShore Legends Basketball"), /*#__PURE__*/React.createElement("span", null, "Chicago, Illinois")));
}
Object.assign(window, {
  Star6,
  SocialGlyph,
  Crest,
  Header,
  SectionHead,
  PageHero,
  CTA,
  Footer,
  NAV
});