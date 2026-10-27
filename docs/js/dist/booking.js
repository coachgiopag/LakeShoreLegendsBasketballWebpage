function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/* global React, SectionHead, LSL */
var _React = React,
  useStateBk = _React.useState,
  useEffectBk = _React.useEffect,
  useReducerBk = _React.useReducer;

// Web3Forms keys are public by design (they only let this form email the coach).
var W3F_1ON1 = '57d5ddc7-7fef-4b25-b3c1-6d0ace6f4633';
var W3F_GROUP = '26db51db-43e4-4bf9-90d5-fa4c7a647de2';
var W3F_REQTRN = '0202f9d6-795d-4dd1-ae8e-6b5fe7391d92';
var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var pad2 = n => String(n).padStart(2, '0');
var isoOf = dt => dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
var policyLines = () => LSL.getSettings().policyLines || [];
var groupLabel = t => t.max_participants > t.min_participants ? t.min_participants + '+' : String(t.min_participants);
function notifyCoach(_x) {
  return _notifyCoach.apply(this, arguments);
}
function _notifyCoach() {
  _notifyCoach = _asyncToGenerator(function* (rec) {
    var isGroup = !!rec.players;
    var key = rec.mode === 'request' ? W3F_REQTRN : isGroup ? W3F_GROUP : W3F_1ON1;
    var fromName = rec.mode === 'request' ? 'LSL Request Training' : isGroup ? 'LSL Small Group Booking' : 'LSL New 1-on-1 Booking';
    var f = rec.form;
    var lines = rec.mode === 'request' ? ['Training Request — ' + f.athlete, rec.requestLine] : ['New Booking: ' + f.athlete, rec.service + (rec.players ? ' · ' + rec.players + ' players' : ''), LSL.fmtDate(rec.date) + ' · ' + LSL.fmtTime(rec.time) + ' ' + LSL.tzLabel(rec.date, rec.time), rec.location, rec.status === 'awaiting_payment' ? 'Status: reserved, waiting for Stripe payment' : 'Status: ' + rec.status];
    var message = [...lines, 'Parent: ' + f.parent, f.email + (f.phone ? ' · ' + f.phone : ''), f.age ? 'Age/Grade: ' + f.age : '', f.focus ? 'Focus: ' + f.focus : '', f.notes ? 'Notes: ' + f.notes : '', ...(rec.roster || []).filter(m => !m.primary).map((m, i) => 'Player ' + (i + 2) + ': ' + (m.name || '—') + (m.contact ? ' · ' + m.contact : '')), 'Booking ID: ' + rec.id].filter(Boolean).join('\n');
    try {
      yield fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          access_key: key,
          subject: (rec.mode === 'request' ? 'Training Request — ' : 'New Booking — ') + f.athlete,
          message,
          from_name: fromName,
          replyto: f.email,
          cc: '2244259490@tmomail.net'
        })
      });
    } catch (e) {/* non-blocking */}
  });
  return _notifyCoach.apply(this, arguments);
}
function PolicyText(_ref) {
  var className = _ref.className;
  var lines = policyLines();
  if (!lines.length) return null;
  return /*#__PURE__*/React.createElement("span", {
    className: className
  }, lines.map((line, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, line, i < lines.length - 1 && /*#__PURE__*/React.createElement("br", null))));
}
function PrivateBooking() {
  var _useStateBk = useStateBk(null),
    _useStateBk2 = _slicedToArray(_useStateBk, 2),
    locFilter = _useStateBk2[0],
    setLocFilter = _useStateBk2[1]; // null = all
  var _useStateBk3 = useStateBk(false),
    _useStateBk4 = _slicedToArray(_useStateBk3, 2),
    dropOpen = _useStateBk4[0],
    setDropOpen = _useStateBk4[1];
  var dropRef = React.useRef(null);
  var _useStateBk5 = useStateBk(0),
    _useStateBk6 = _slicedToArray(_useStateBk5, 2),
    offset = _useStateBk6[0],
    setOffset = _useStateBk6[1];
  var _useStateBk7 = useStateBk(null),
    _useStateBk8 = _slicedToArray(_useStateBk7, 2),
    date = _useStateBk8[0],
    setDate = _useStateBk8[1];
  var _useStateBk9 = useStateBk(null),
    _useStateBk0 = _slicedToArray(_useStateBk9, 2),
    slotId = _useStateBk0[0],
    setSlotId = _useStateBk0[1];
  var _useStateBk1 = useStateBk(null),
    _useStateBk10 = _slicedToArray(_useStateBk1, 2),
    svcType = _useStateBk10[0],
    setSvcType = _useStateBk10[1]; // 'solo' | 'small'
  var _useStateBk11 = useStateBk(null),
    _useStateBk12 = _slicedToArray(_useStateBk11, 2),
    groupTypeId = _useStateBk12[0],
    setGroupTypeId = _useStateBk12[1];
  var _useStateBk13 = useStateBk(null),
    _useStateBk14 = _slicedToArray(_useStateBk13, 2),
    formDesc = _useStateBk14[0],
    setFormDesc = _useStateBk14[1]; // snapshot, so the result stays up after the selection resets
  var _useStateBk15 = useStateBk(false),
    _useStateBk16 = _slicedToArray(_useStateBk15, 2),
    reqTrainOpen = _useStateBk16[0],
    setReqTrainOpen = _useStateBk16[1];
  var _useReducerBk = useReducerBk(x => x + 1, 0),
    _useReducerBk2 = _slicedToArray(_useReducerBk, 2),
    forceSync = _useReducerBk2[1];
  useEffectBk(() => {
    var onSync = () => forceSync();
    window.addEventListener('lsl-synced', onSync);
    return () => window.removeEventListener('lsl-synced', onSync);
  }, []);
  useEffectBk(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  useEffectBk(() => {
    var handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  var todayIso = LSL.today() || isoOf(new Date());
  var locs = LSL.getLocs();
  var allSlots = LSL.getSlots();
  var types = LSL.getTypes();
  var loaded = LSL.isLoaded();
  var loadErr = LSL.loadError();

  // Coach-reserved time (private link): preselect it once, then limit session types to what the coach allowed.
  var rsv = LSL.getReservation();
  var mineId = rsv && rsv.state === 'ok' && rsv.slot ? rsv.slot.id : null;
  var appliedRef = React.useRef(false);
  useEffectBk(() => {
    if (appliedRef.current || !mineId || !loaded) return;
    appliedRef.current = true;
    var _split$map = (LSL.today() || isoOf(new Date())).split('-').map(Number),
      _split$map2 = _slicedToArray(_split$map, 2),
      ty = _split$map2[0],
      tm = _split$map2[1];
    var _rsv$slot$date$split$ = rsv.slot.date.split('-').map(Number),
      _rsv$slot$date$split$2 = _slicedToArray(_rsv$slot$date$split$, 2),
      sy = _rsv$slot$date$split$2[0],
      sm = _rsv$slot$date$split$2[1];
    setOffset(Math.max(0, (sy - ty) * 12 + (sm - tm)));
    setDate(rsv.slot.date);
    setSlotId(mineId);
    setSvcType(null);
    setGroupTypeId(null);
    var el = document.getElementById('book');
    if (el && el.scrollIntoView) el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });

  // A reserved time is listed (marked Reserved) so families can see it is taken, but only open times count as bookable.
  var openDates = new Set(allSlots.filter(s => (s.status === 'open' || s.status === 'reserved') && (!locFilter || s.locId === locFilter)).map(s => s.date));
  // Days that already passed show the sessions that really were booked (bookable times never include these).
  var pastDates = new Set(allSlots.filter(s => s.past && (!locFilter || s.locId === locFilter)).map(s => s.date));
  var _todayIso$split$map = todayIso.split('-').map(Number),
    _todayIso$split$map2 = _slicedToArray(_todayIso$split$map, 2),
    cy = _todayIso$split$map2[0],
    cm = _todayIso$split$map2[1];
  var minOffset = pastDates.size ? Math.min(0, ...[...pastDates].map(d => {
    var _d$split$map = d.split('-').map(Number),
      _d$split$map2 = _slicedToArray(_d$split$map, 2),
      y = _d$split$map2[0],
      m = _d$split$map2[1];
    return (y - cy) * 12 + (m - cm);
  })) : 0;
  var daySlots = date ? allSlots.filter(s => s.date === date && (!locFilter || s.locId === locFilter)).sort((a, b) => a.time.localeCompare(b.time)) : [];
  var byLoc = {};
  daySlots.forEach(s => {
    if (!byLoc[s.locId]) byLoc[s.locId] = [];
    byLoc[s.locId].push(s);
  });
  var slot = allSlots.find(s => s.id === slotId) || null;
  var allowedIds = mineId && slotId === mineId ? rsv.allowed_type_ids : null;
  var offeredHere = t => {
    if (!slot) return false;
    if (allowedIds && !allowedIds.includes(t.id)) return false;
    var loc = LSL.locById(slot.locId);
    return (!t.eligible_loc_ids || t.eligible_loc_ids.includes(slot.locId)) && (!loc.eligible_type_ids || loc.eligible_type_ids.includes(t.id));
  };
  var soloType = types.find(t => t.max_participants === 1 && offeredHere(t));
  var groupTypes = types.filter(t => t.max_participants > 1 && offeredHere(t)).sort((a, b) => a.min_participants - b.min_participants);
  var pickLoc = id => {
    setLocFilter(id);
    setDate(null);
    setSlotId(null);
    setSvcType(null);
    setGroupTypeId(null);
    setOffset(0);
  };
  var pickDate = iso => {
    setDate(iso);
    setSlotId(null);
    setSvcType(null);
    setGroupTypeId(null);
  };
  var pickSlot = id => {
    setSlotId(id);
    setSvcType(null);
    setGroupTypeId(null);
  };
  var desc = null;
  if (slot && svcType === 'solo' && soloType) desc = {
    type: soloType,
    slot,
    players: null
  };else if (slot && svcType === 'small' && groupTypeId) {
    var gt = groupTypes.find(t => t.id === groupTypeId);
    if (gt) desc = {
      type: gt,
      slot,
      players: groupLabel(gt)
    };
  }
  var ReqFooter = () => /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      paddingTop: 16,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      color: 'var(--fg2)',
      marginBottom: 12,
      textAlign: 'center',
      fontSize: '0.85em'
    }
  }, "Don\u2019t see a date, time, or location you like?", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.08em'
    }
  }, "Reach out \u2014 Coach Gio can often make it work.")), /*#__PURE__*/React.createElement("button", {
    className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
    style: {
      width: '100%'
    },
    onClick: () => setReqTrainOpen(true)
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "mail"
  }), " Request Training"));
  var zone = LSL.tzLabel();
  return /*#__PURE__*/React.createElement("section", {
    className: "lsl-section lsl-section--cream",
    id: "book",
    style: {
      paddingTop: '44px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-wrap"
  }, /*#__PURE__*/React.createElement(SectionHead, {
    center: true,
    wide: true,
    eyebrow: "Private Training",
    title: "Book a Session With Coach Gio",
    sub: "Check out our availability and book the date and time that works for you."
  }), window.LSL_API_NAME === 'staging' && /*#__PURE__*/React.createElement("p", {
    className: "lsl-bknote",
    style: {
      maxWidth: 560,
      margin: '0 auto 16px'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "flask-conical"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Test mode:"), " bookings here go to the test server and use Stripe test payments.")), !loaded && !loadErr && !window.LSL_PRERENDER && /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      textAlign: 'center',
      color: 'var(--fg3)'
    },
    role: "status"
  }, "Loading availability\u2026"), loadErr && /*#__PURE__*/React.createElement("div", {
    className: "lsl-bknote",
    role: "alert",
    style: {
      maxWidth: 560,
      margin: '0 auto 20px'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "alert-triangle"
  }), /*#__PURE__*/React.createElement("span", null, "We couldn\u2019t load open times right now. ", /*#__PURE__*/React.createElement("button", {
    className: "lsl-linkbtn",
    onClick: () => LSL.refresh()
  }, "Try again"), " or use Request Training below.")), /*#__PURE__*/React.createElement(ReservationNotice, {
    rsv: rsv
  }), /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched__col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched__head",
    style: {
      textAlign: 'center'
    }
  }, "Select a Date"), locs.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "lsl-locdrop",
    ref: dropRef
  }, /*#__PURE__*/React.createElement("button", {
    className: "lsl-locdrop__trigger",
    onClick: () => setDropOpen(!dropOpen),
    "aria-expanded": dropOpen
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "map-pin"
  }), /*#__PURE__*/React.createElement("span", null, locFilter ? (LSL.locById(locFilter) || {}).name : 'All Locations'), /*#__PURE__*/React.createElement("i", {
    "data-lucide": dropOpen ? 'chevron-up' : 'chevron-down',
    className: "lsl-locdrop__chev"
  })), dropOpen && /*#__PURE__*/React.createElement("div", {
    className: "lsl-locdrop__menu"
  }, /*#__PURE__*/React.createElement("button", {
    className: 'lsl-locdrop__opt' + (!locFilter ? ' is-sel' : ''),
    onClick: () => {
      pickLoc(null);
      setDropOpen(false);
    }
  }, "All Locations"), locs.map(loc => /*#__PURE__*/React.createElement("button", {
    key: loc.id,
    className: 'lsl-locdrop__opt' + (locFilter === loc.id ? ' is-sel' : ''),
    onClick: () => {
      pickLoc(loc.id);
      setDropOpen(false);
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "map-pin"
  }), loc.name)))), /*#__PURE__*/React.createElement(Calendar, {
    offset: offset,
    onOffset: setOffset,
    openDates: openDates,
    pastDates: pastDates,
    minOffset: minOffset,
    selected: date,
    onPick: pickDate,
    todayIso: todayIso
  })), /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched__col lsl-sched__col--border"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched__head"
  }, "Available Times ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: 'var(--fg3)',
      textTransform: 'none',
      letterSpacing: 0
    }
  }, "(", zone, ")")), !date ? /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched__ph"
  }, "Pick a highlighted date to see open times.") : daySlots.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      color: 'var(--fg3)'
    }
  }, "No open times on this day.") : Object.keys(byLoc).map(lid => /*#__PURE__*/React.createElement("div", {
    key: lid,
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-times__loc"
  }, LSL.locById(lid).name || lid), /*#__PURE__*/React.createElement("div", {
    className: "lsl-times__row"
  }, byLoc[lid].map(s => {
    var mine = s.id === mineId;
    var reserved = s.status === 'reserved' && !mine;
    var bookable = s.status === 'open' || mine;
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      className: 'lsl-time' + (!bookable ? ' is-booked' : '') + (reserved ? ' is-reserved' : '') + (mine ? ' is-mine' : '') + (slotId === s.id ? ' is-sel' : ''),
      disabled: !bookable,
      "aria-pressed": slotId === s.id,
      "aria-label": LSL.fmtTime(s.time) + (mine ? ', reserved for you' : reserved ? ', reserved' : !bookable ? ', booked' : ''),
      onClick: () => bookable && pickSlot(s.id)
    }, LSL.fmtTime(s.time));
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched__col lsl-sched__col--border"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched__head"
  }, "Type of Session"), !slotId ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "lsl-sched__ph"
  }, "Select a date and time to choose your session type."), /*#__PURE__*/React.createElement(ReqFooter, null)) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lsl-svclist"
  }, soloType && /*#__PURE__*/React.createElement("button", {
    className: 'lsl-svc' + (svcType === 'solo' ? ' is-sel' : ''),
    onClick: () => {
      setSvcType('solo');
      setGroupTypeId(null);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lsl-svc__ico"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "user"
  })), /*#__PURE__*/React.createElement("span", {
    className: "lsl-svc__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lsl-svc__name"
  }, "1-on-1 Private Training"), /*#__PURE__*/React.createElement("span", {
    className: "lsl-svc__meta"
  }, "One athlete \xB7 ", soloType.duration, " min", LSL.priceLabel(soloType) ? ' · ' + LSL.priceLabel(soloType) : '')), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-right",
    className: "lsl-svc__chev"
  })), groupTypes.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: 'lsl-svc' + (svcType === 'small' ? ' is-sel' : ''),
    onClick: () => {
      setSvcType('small');
      setGroupTypeId(null);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lsl-svc__ico"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "users"
  })), /*#__PURE__*/React.createElement("span", {
    className: "lsl-svc__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lsl-svc__name"
  }, "Small Group Training"), /*#__PURE__*/React.createElement("span", {
    className: "lsl-svc__meta"
  }, "Bring your own group")), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-right",
    className: "lsl-svc__chev"
  }))), svcType === 'small' && /*#__PURE__*/React.createElement("div", {
    className: "lsl-svcsub"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-svcsub__q",
    id: "lsl-players-q"
  }, "How many players in your group?"), /*#__PURE__*/React.createElement("div", {
    className: "lsl-svcsub__opts",
    role: "group",
    "aria-labelledby": "lsl-players-q"
  }, groupTypes.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    className: 'lsl-countchip' + (groupTypeId === t.id ? ' is-sel' : ''),
    "aria-pressed": groupTypeId === t.id,
    onClick: () => setGroupTypeId(t.id)
  }, groupLabel(t))))), desc && /*#__PURE__*/React.createElement("button", {
    className: "lsl-btn lsl-btn--primary lsl-times__req",
    onClick: () => setFormDesc(desc)
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar-check"
  }), " ", desc.type.booking_mode === 'request' ? 'Request Session' : 'Book Session'), /*#__PURE__*/React.createElement(ReqFooter, null)))), /*#__PURE__*/React.createElement("p", {
    className: "lsl-bookpolicy"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "info"
  }), /*#__PURE__*/React.createElement(PolicyText, null))), formDesc && /*#__PURE__*/React.createElement(BookingForm, {
    desc: formDesc,
    onClose: () => setFormDesc(null),
    onBooked: () => {
      setSlotId(null);
      setDate(null);
      setSvcType(null);
      setGroupTypeId(null);
      LSL.refresh();
    }
  }), reqTrainOpen && /*#__PURE__*/React.createElement(TrainingRequestForm, {
    onClose: () => setReqTrainOpen(false)
  }));
}
function ReservationNotice(_ref2) {
  var rsv = _ref2.rsv;
  useEffectBk(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  if (!rsv || rsv.state === 'loading') return null;
  var wrap = {
    maxWidth: 640,
    margin: '0 auto 20px'
  };
  if (rsv.state === 'ok' && rsv.slot) {
    var loc = LSL.locById(rsv.slot.locId);
    var until = new Date(rsv.expires_at).toLocaleDateString('en-US', {
      timeZone: LSL.tz(),
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }) + ', ' + LSL.fmtInstant(rsv.expires_at);
    return /*#__PURE__*/React.createElement("div", {
      className: "lsl-bknote",
      role: "status",
      style: wrap
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": "calendar-check"
    }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Reserved for ", rsv.client_name, ":"), " ", LSL.fmtDateLong(rsv.slot.date), " at ", LSL.fmtTime(rsv.slot.time), loc.name ? ' · ' + loc.name : '', ". Choose your session type below to book it. This time is held for you until ", until, "."));
  }
  var msg = {
    used: 'This reserved time has already been booked.',
    expired: 'This reservation link has expired. Please contact Coach Gio, or choose another time below.',
    revoked: 'This reservation link is no longer active. Please contact Coach Gio, or choose another time below.',
    unavailable: 'This reserved time is no longer available. Please contact Coach Gio, or choose another time below.',
    invalid: 'This reservation link is not valid. Please check the link or contact Coach Gio.',
    error: 'We couldn\u2019t check your reservation right now. Please refresh and try again.'
  }[rsv.state] || 'This reservation link is not available.';
  return /*#__PURE__*/React.createElement("div", {
    className: "lsl-bknote",
    role: "alert",
    style: wrap
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "info"
  }), /*#__PURE__*/React.createElement("span", null, msg));
}
function Calendar(_ref3) {
  var offset = _ref3.offset,
    onOffset = _ref3.onOffset,
    openDates = _ref3.openDates,
    pastDates = _ref3.pastDates,
    minOffset = _ref3.minOffset,
    selected = _ref3.selected,
    onPick = _ref3.onPick,
    todayIso = _ref3.todayIso;
  useEffectBk(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  var _todayIso$split$map3 = todayIso.split('-').map(Number),
    _todayIso$split$map4 = _slicedToArray(_todayIso$split$map3, 2),
    ty = _todayIso$split$map4[0],
    tm = _todayIso$split$map4[1];
  var base = new Date(ty, tm - 1 + offset, 1);
  var y = base.getFullYear(),
    m = base.getMonth();
  var firstDow = new Date(y, m, 1).getDay();
  var days = new Date(y, m + 1, 0).getDate();
  var cells = [];
  for (var i = 0; i < firstDow; i++) cells.push(null);
  for (var d = 1; d <= days; d++) cells.push(d);
  var monthName = base.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  var dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return /*#__PURE__*/React.createElement("div", {
    className: "lsl-cal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-cal__nav"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onOffset(Math.max(minOffset, offset - 1)),
    disabled: offset <= minOffset,
    "aria-label": "Previous month"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-left"
  })), /*#__PURE__*/React.createElement("span", {
    className: "lsl-cal__month",
    "aria-live": "polite"
  }, monthName), /*#__PURE__*/React.createElement("button", {
    onClick: () => onOffset(offset + 1),
    "aria-label": "Next month"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-right"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lsl-cal__dows"
  }, dows.map(d => /*#__PURE__*/React.createElement("span", {
    key: d
  }, d))), /*#__PURE__*/React.createElement("div", {
    className: "lsl-cal__grid"
  }, cells.map((d, i) => {
    if (d === null) return /*#__PURE__*/React.createElement("span", {
      key: 'b' + i,
      className: "lsl-cal__cell is-empty"
    });
    var iso = y + '-' + pad2(m + 1) + '-' + pad2(d);
    var upcoming = openDates.has(iso) && iso >= todayIso;
    var past = !upcoming && iso < todayIso && pastDates.has(iso);
    var can = upcoming || past;
    return /*#__PURE__*/React.createElement("button", {
      key: iso,
      disabled: !can,
      "aria-label": LSL.fmtDateLong(iso) + (upcoming ? ', has open times' : past ? ', had booked sessions' : ''),
      "aria-pressed": selected === iso,
      className: 'lsl-cal__cell' + (upcoming ? ' is-open' : '') + (past ? ' is-past' : '') + (selected === iso ? ' is-sel' : ''),
      onClick: () => can && onPick(iso)
    }, d, can && /*#__PURE__*/React.createElement("span", {
      className: 'lsl-cal__dot' + (past ? ' lsl-cal__dot--past' : '')
    }));
  })));
}
function useModalKeys(onClose, deps) {
  useEffectBk(() => {
    if (window.lucide) window.lucide.createIcons();
    var onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, deps);
}
function BookingForm(_ref4) {
  var desc = _ref4.desc,
    onClose = _ref4.onClose,
    onBooked = _ref4.onBooked;
  var settings = LSL.getSettings();
  var fields = settings.registration && settings.registration.fields || {};
  var acks = settings.registration && settings.registration.acknowledgments || [];
  var _useStateBk17 = useStateBk({
      parent: '',
      athlete: '',
      age: '',
      email: '',
      phone: '',
      focus: '',
      notes: '',
      website: ''
    }),
    _useStateBk18 = _slicedToArray(_useStateBk17, 2),
    form = _useStateBk18[0],
    setForm = _useStateBk18[1];
  var _useStateBk19 = useStateBk([]),
    _useStateBk20 = _slicedToArray(_useStateBk19, 2),
    ackd = _useStateBk20[0],
    setAckd = _useStateBk20[1];
  var _useStateBk21 = useStateBk({}),
    _useStateBk22 = _slicedToArray(_useStateBk21, 2),
    errs = _useStateBk22[0],
    setErrs = _useStateBk22[1];
  var _useStateBk23 = useStateBk(false),
    _useStateBk24 = _slicedToArray(_useStateBk23, 2),
    busy = _useStateBk24[0],
    setBusy = _useStateBk24[1];
  var _useStateBk25 = useStateBk(null),
    _useStateBk26 = _slicedToArray(_useStateBk25, 2),
    result = _useStateBk26[0],
    setResult = _useStateBk26[1];
  var type = desc.type,
    slot = desc.slot;
  var isReq = type.booking_mode === 'request';
  var extraCount = Math.max(0, (type.min_participants || 1) - 1);
  var _useStateBk27 = useStateBk(() => Array.from({
      length: extraCount
    }, () => ({
      name: '',
      contact: ''
    }))),
    _useStateBk28 = _slicedToArray(_useStateBk27, 2),
    groupMembers = _useStateBk28[0],
    setGroupMembers = _useStateBk28[1];
  useModalKeys(onClose, [result]);
  var loc = LSL.locById(slot.locId);
  var show = k => !fields[k] || fields[k].show !== false;
  var req = k => ['parent', 'athlete', 'email'].includes(k) || !!(fields[k] && fields[k].required);
  var label = (k, def) => fields[k] && fields[k].label || def;
  var set = k => e => setForm(_objectSpread(_objectSpread({}, form), {}, {
    [k]: e.target.value
  }));
  var setMember = (i, k) => e => setGroupMembers(groupMembers.map((m, idx) => idx === i ? _objectSpread(_objectSpread({}, m), {}, {
    [k]: e.target.value
  }) : m));
  function validate() {
    var e = {};
    if (!form.parent.trim()) e.parent = 'Required';
    if (!form.athlete.trim()) e.athlete = 'Required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Enter a valid email';
    ['phone', 'age', 'focus', 'notes'].forEach(k => {
      if (show(k) && req(k) && !String(form[k]).trim()) e[k] = 'Required';
    });
    acks.forEach(a => {
      if (a.required && !ackd.includes(a.id)) e['ack_' + a.id] = 'Please confirm';
    });
    setErrs(e);
    return Object.keys(e).length === 0;
  }
  function submit(_x2) {
    return _submit.apply(this, arguments);
  }
  function _submit() {
    _submit = _asyncToGenerator(function* (e) {
      e.preventDefault();
      if (!validate()) return;
      setBusy(true);
      try {
        var members = groupMembers.filter(m => m.name.trim() || m.contact.trim());
        var rv = LSL.getReservation();
        var reserveToken = rv && rv.state === 'ok' && rv.slot && rv.slot.id === slot.id ? LSL.reserveToken : undefined;
        var res = yield LSL.createBooking({
          slotId: slot.id,
          typeId: type.id,
          players: desc.players,
          form,
          roster: members,
          acks: ackd,
          website: form.website,
          reserveToken
        });
        var rec = _objectSpread(_objectSpread({}, res.booking), {}, {
          mode: 'dated',
          players: desc.players,
          form,
          roster: [{
            primary: true
          }, ...members],
          checkoutUrl: res.checkoutUrl,
          shareUrl: res.shareUrl,
          athletes: res.athletes,
          next: res.next,
          duration: type.duration
        });
        notifyCoach(rec);
        setResult(rec);
        if (onBooked) onBooked();
      } catch (err) {
        setErrs(_objectSpread(_objectSpread({}, err.fields || {}), {}, {
          form: err.message
        }));
        if (err.status === 409) LSL.refresh();
      } finally {
        setBusy(false);
      }
    });
    return _submit.apply(this, arguments);
  }
  var Field = _ref5 => {
    var k = _ref5.k,
      def = _ref5.def,
      inputType = _ref5.type,
      placeholder = _ref5.placeholder;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      htmlFor: 'bk-' + k
    }, label(k, def), " ", req(k) && /*#__PURE__*/React.createElement("span", {
      className: "req"
    }, "*")), /*#__PURE__*/React.createElement("input", {
      id: 'bk-' + k,
      className: 'lsl-input' + (errs[k] ? ' is-error' : ''),
      type: inputType || 'text',
      value: form[k],
      onChange: set(k),
      placeholder: placeholder,
      "aria-invalid": !!errs[k]
    }), errs[k] && /*#__PURE__*/React.createElement("span", {
      className: "lsl-err"
    }, errs[k]));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "lsl-lightbox",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-bkmodal",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "bk-title",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "lsl-lightbox__close",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      position: 'absolute',
      top: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x"
  })), !result ? /*#__PURE__*/React.createElement("form", {
    className: "lsl-bkbody",
    onSubmit: submit,
    noValidate: true
  }, /*#__PURE__*/React.createElement("h3", {
    className: "lsl-h3",
    id: "bk-title",
    style: {
      marginTop: 0,
      marginBottom: 4
    }
  }, isReq ? 'Request Session' : 'Book Session'), /*#__PURE__*/React.createElement("div", {
    className: "lsl-bksummary"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "dumbbell"
  }), type.name), desc.players && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "users"
  }), desc.players, " players"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar"
  }), LSL.fmtDateLong(slot.date)), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "clock"
  }), LSL.fmtTime(slot.time), " ", LSL.tzLabel(slot.date, slot.time)), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "map-pin"
  }), loc.name), LSL.priceLabel(type) && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "tag"
  }), LSL.priceLabel(type))), type.description && /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      marginTop: 0
    }
  }, type.description), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, Field({
    k: 'parent',
    def: 'Parent / Guardian Name',
    placeholder: 'Jane Smith'
  }), Field({
    k: 'athlete',
    def: 'Athlete Name',
    placeholder: 'Alex Smith'
  })), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, Field({
    k: 'email',
    def: 'Email',
    type: 'email',
    placeholder: 'you@email.com'
  }), show('phone') && Field({
    k: 'phone',
    def: 'Phone',
    type: 'tel',
    placeholder: '(555) 555-5555'
  })), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, show('age') && Field({
    k: 'age',
    def: 'Athlete Age / Grade',
    placeholder: '7th grade'
  }), show('focus') && Field({
    k: 'focus',
    def: 'Focus Areas / Goals',
    placeholder: 'Shooting, ball handling'
  })), show('notes') && /*#__PURE__*/React.createElement("div", {
    className: "lsl-field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "bk-notes"
  }, label('notes', 'Additional Notes'), " ", req('notes') && /*#__PURE__*/React.createElement("span", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("textarea", {
    id: "bk-notes",
    className: 'lsl-textarea' + (errs.notes ? ' is-error' : ''),
    value: form.notes,
    onChange: set('notes'),
    placeholder: "Anything Coach Gio should know",
    style: {
      minHeight: 76
    }
  }), errs.notes && /*#__PURE__*/React.createElement("span", {
    className: "lsl-err"
  }, errs.notes)), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "website",
    value: form.website,
    onChange: set('website'),
    tabIndex: "-1",
    autoComplete: "off",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: '-9999px'
    }
  }), extraCount > 0 && /*#__PURE__*/React.createElement("div", {
    className: "lsl-groupmembers"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-groupmembers__head"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "users"
  }), " Who else is coming to this session?"), /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      color: 'var(--fg3)',
      marginTop: 0,
      marginBottom: 14
    }
  }, "Add your group members below \u2014 a name and a way to reach them is all we need."), groupMembers.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "lsl-groupmembers__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lsl-groupmembers__num"
  }, i + 2), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row",
    style: {
      flex: 1,
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: 'gm-n' + i
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    id: 'gm-n' + i,
    className: "lsl-input",
    value: m.name,
    onChange: setMember(i, 'name'),
    placeholder: 'Player ' + (i + 2) + ' name'
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: 'gm-c' + i
  }, "Email or Phone Number"), /*#__PURE__*/React.createElement("input", {
    id: 'gm-c' + i,
    className: "lsl-input",
    value: m.contact,
    onChange: setMember(i, 'contact'),
    placeholder: "If you have it"
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "lsl-bknote",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": isReq ? 'mail' : 'shield-check'
  }), isReq ? /*#__PURE__*/React.createElement("span", null, "This sends a ", /*#__PURE__*/React.createElement("strong", null, "request"), " to Coach Gio. Nothing is booked or charged until it\u2019s approved.") : type.has_pay_link ? /*#__PURE__*/React.createElement("span", null, "We\u2019ll hold this time for ", /*#__PURE__*/React.createElement("strong", null, settings.holdMinutes || 10, " minutes"), " while you pay securely with ", /*#__PURE__*/React.createElement("strong", null, "Stripe"), ". It\u2019s confirmed once payment goes through.") : /*#__PURE__*/React.createElement("span", null, "Coach Gio will email you a secure payment link.")), /*#__PURE__*/React.createElement("div", {
    className: "lsl-bknote",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "map-pin"
  }), /*#__PURE__*/React.createElement("span", null, "Sessions are in the ", /*#__PURE__*/React.createElement("strong", null, loc.name), " area. After booking, reach out to Coach Gio to organize the exact location.")), /*#__PURE__*/React.createElement("p", {
    className: "lsl-bkpolicy--modal"
  }, /*#__PURE__*/React.createElement(PolicyText, null)), acks.map(a => /*#__PURE__*/React.createElement("label", {
    key: a.id,
    className: "lsl-ack"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: ackd.includes(a.id),
    onChange: e => setAckd(e.target.checked ? [...ackd, a.id] : ackd.filter(x => x !== a.id)),
    "aria-invalid": !!errs['ack_' + a.id]
  }), /*#__PURE__*/React.createElement("span", null, a.text, a.required && /*#__PURE__*/React.createElement("span", {
    className: "req"
  }, " *")), errs['ack_' + a.id] && /*#__PURE__*/React.createElement("span", {
    className: "lsl-err",
    style: {
      display: 'block'
    }
  }, errs['ack_' + a.id]))), errs.form && /*#__PURE__*/React.createElement("p", {
    className: "lsl-err",
    role: "alert"
  }, errs.form), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "lsl-btn lsl-btn--primary",
    disabled: busy,
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": isReq ? 'send' : 'arrow-right'
  }), busy ? ' Reserving…' : isReq ? ' Submit Request' : type.has_pay_link ? ' Reserve & Continue to Payment' : ' Reserve Session')) : result.status === 'requested' ? /*#__PURE__*/React.createElement("div", {
    className: "lsl-bkbody lsl-bkdone",
    role: "status"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-formsuccess__ico"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check"
  })), /*#__PURE__*/React.createElement("h3", {
    className: "lsl-h3"
  }, "Request received"), /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      marginTop: 0
    }
  }, result.service, " \xB7 ", LSL.fmtDateLong(slot.date), " \xB7 ", LSL.fmtTime(slot.time), ".", /*#__PURE__*/React.createElement("br", null), "This is not confirmed yet \u2014 Coach Gio will follow up at ", /*#__PURE__*/React.createElement("strong", null, form.email), ". No payment has been taken."), /*#__PURE__*/React.createElement("div", {
    className: "lsl-bkdone__row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lsl-btn lsl-btn--primary lsl-btn--sm",
    onClick: onClose
  }, "Done"))) : /*#__PURE__*/React.createElement("div", {
    className: "lsl-bkbody lsl-bkdone",
    role: "status"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-formsuccess__ico"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check"
  })), /*#__PURE__*/React.createElement("h3", {
    className: "lsl-h3"
  }, result.next === 'pay' ? 'Spot held — one last step' : 'Spot reserved'), /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      marginTop: 0
    }
  }, result.service, result.players ? ' · ' + result.players + ' players' : '', " \xB7 ", LSL.fmtDateLong(result.date), " \xB7 ", LSL.fmtTime(result.time), " ", LSL.tzLabel(result.date, result.time), " \xB7 ", result.location, "."), result.checkoutUrl ? /*#__PURE__*/React.createElement("a", {
    className: "lsl-btn lsl-btn--primary",
    href: result.checkoutUrl,
    target: "_blank",
    rel: "noopener",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "credit-card"
  }), " ", result.shareUrl ? 'Pay for My Athlete' : 'Complete Payment Now') : /*#__PURE__*/React.createElement("div", {
    className: "lsl-bknote"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "info"
  }), /*#__PURE__*/React.createElement("span", null, "Coach Gio will email a secure payment link to ", form.email, ".")), result.shareUrl && /*#__PURE__*/React.createElement("div", {
    className: "lsl-bknote",
    style: {
      marginBottom: 12,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Each family pays for its own athlete. ", /*#__PURE__*/React.createElement("strong", null, "Send this link to the other ", result.athletes - 1, " ", result.athletes - 1 === 1 ? 'family' : 'families'), " in your group \u2014 their payments are added to this booking automatically:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "lsl-input",
    readOnly: true,
    value: result.shareUrl,
    onFocus: e => e.target.select(),
    "aria-label": "Payment link for the other families",
    style: {
      flex: 1,
      minWidth: 180,
      fontSize: 13
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
    onClick: () => {
      try {
        navigator.clipboard.writeText(result.shareUrl);
      } catch (e) {/* select-and-copy fallback */}
    }
  }, "Copy link"))), result.hold_expires_at && /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      color: 'var(--fg2)'
    }
  }, "We\u2019re holding this time until ", /*#__PURE__*/React.createElement("strong", null, LSL.fmtInstant(result.hold_expires_at)), ". Your booking is confirmed once Stripe confirms payment \u2014 you\u2019ll get a confirmation email."), /*#__PURE__*/React.createElement("div", {
    className: "lsl-bknote",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "map-pin"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Next:"), " reach out to Coach Gio to organize the exact location \u2014 reply to your confirmation email or use the ", /*#__PURE__*/React.createElement("a", {
    href: "contact.html"
  }, "contact page"), ".")), /*#__PURE__*/React.createElement("div", {
    className: "lsl-bkdone__row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
    onClick: () => LSL.downloadICS(_objectSpread(_objectSpread({}, result), {}, {
      athlete: form.athlete
    }))
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar-plus"
  }), " Add to calendar")))));
}
function TrainingRequestForm(_ref6) {
  var onClose = _ref6.onClose;
  var _useStateBk29 = useStateBk({
      parent: '',
      athlete: '',
      email: '',
      phone: '',
      reqLocation: '',
      reqTime: '',
      reqDate: '',
      age: '',
      focus: '',
      notes: '',
      website: ''
    }),
    _useStateBk30 = _slicedToArray(_useStateBk29, 2),
    form = _useStateBk30[0],
    setForm = _useStateBk30[1];
  var _useStateBk31 = useStateBk({}),
    _useStateBk32 = _slicedToArray(_useStateBk31, 2),
    errs = _useStateBk32[0],
    setErrs = _useStateBk32[1];
  var _useStateBk33 = useStateBk(false),
    _useStateBk34 = _slicedToArray(_useStateBk33, 2),
    busy = _useStateBk34[0],
    setBusy = _useStateBk34[1];
  var _useStateBk35 = useStateBk(false),
    _useStateBk36 = _slicedToArray(_useStateBk35, 2),
    done = _useStateBk36[0],
    setDone = _useStateBk36[1];
  useModalKeys(onClose, [done]);
  var set = k => e => setForm(_objectSpread(_objectSpread({}, form), {}, {
    [k]: e.target.value
  }));
  function validate() {
    var e = {};
    if (!form.parent.trim()) e.parent = 'Required';
    if (!form.athlete.trim()) e.athlete = 'Required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrs(e);
    return Object.keys(e).length === 0;
  }
  function submit(_x3) {
    return _submit2.apply(this, arguments);
  }
  function _submit2() {
    _submit2 = _asyncToGenerator(function* (e) {
      e.preventDefault();
      if (!validate()) return;
      setBusy(true);
      try {
        var res = yield LSL.createRequest({
          website: form.website,
          form: {
            parent: form.parent,
            athlete: form.athlete,
            email: form.email,
            phone: form.phone,
            age: form.age,
            focus: form.focus,
            notes: form.notes
          },
          request: {
            serviceName: 'Training Request',
            location: form.reqLocation,
            time: form.reqTime,
            date: form.reqDate
          }
        });
        notifyCoach({
          mode: 'request',
          id: res.booking.id,
          form,
          requestLine: [form.reqLocation, form.reqDate, form.reqTime].filter(Boolean).join(' · ')
        });
        setDone(true);
      } catch (err) {
        setErrs(_objectSpread(_objectSpread({}, err.fields || {}), {}, {
          form: err.message
        }));
      } finally {
        setBusy(false);
      }
    });
    return _submit2.apply(this, arguments);
  }
  var input = (k, lbl, ph, required, inputType) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: 'rq-' + k
  }, lbl, " ", required && /*#__PURE__*/React.createElement("span", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    id: 'rq-' + k,
    className: 'lsl-input' + (errs[k] ? ' is-error' : ''),
    type: inputType || 'text',
    value: form[k],
    onChange: set(k),
    placeholder: ph,
    "aria-invalid": !!errs[k]
  }), errs[k] && /*#__PURE__*/React.createElement("span", {
    className: "lsl-err"
  }, errs[k]));
  return /*#__PURE__*/React.createElement("div", {
    className: "lsl-lightbox",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-bkmodal",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "rq-title",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "lsl-lightbox__close",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      position: 'absolute',
      top: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x"
  })), !done ? /*#__PURE__*/React.createElement("form", {
    className: "lsl-bkbody",
    onSubmit: submit,
    noValidate: true
  }, /*#__PURE__*/React.createElement("h3", {
    className: "lsl-h3",
    id: "rq-title",
    style: {
      marginTop: 0,
      marginBottom: 4
    }
  }, "Request Training"), /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      color: 'var(--fg2)',
      marginTop: 0,
      marginBottom: 16
    }
  }, "Fill this out and Coach Gio will reach out to make it work."), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, input('parent', 'Parent / Guardian Name', 'Jane Smith', true), input('athlete', 'Athlete Name', 'Alex Smith', true)), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, input('email', 'Email', 'you@email.com', true, 'email'), input('phone', 'Phone', '(555) 555-5555', false, 'tel')), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, input('reqLocation', 'Requested Location', 'Park Ridge, Mundelein…'), input('reqTime', 'Requested Time', 'e.g. 4:00 PM')), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field lsl-field--row"
  }, input('reqDate', 'Requested Date', 'e.g. July 25'), input('age', 'Athlete Age / Grade', '7th grade')), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field"
  }, input('focus', 'Focus Areas / Goals', 'Shooting, ball handling, defense…')), /*#__PURE__*/React.createElement("div", {
    className: "lsl-field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "rq-notes"
  }, "Additional Notes"), /*#__PURE__*/React.createElement("textarea", {
    id: "rq-notes",
    className: "lsl-textarea",
    value: form.notes,
    onChange: set('notes'),
    placeholder: "Anything Coach Gio should know",
    style: {
      minHeight: 76
    }
  })), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "website",
    value: form.website,
    onChange: set('website'),
    tabIndex: "-1",
    autoComplete: "off",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: '-9999px'
    }
  }), errs.form && /*#__PURE__*/React.createElement("p", {
    className: "lsl-err",
    role: "alert"
  }, errs.form), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "lsl-btn lsl-btn--primary",
    disabled: busy,
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "send"
  }), busy ? ' Sending…' : ' Request Booking')) : /*#__PURE__*/React.createElement("div", {
    className: "lsl-bkbody lsl-bkdone",
    role: "status"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-formsuccess__ico"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check"
  })), /*#__PURE__*/React.createElement("h3", {
    className: "lsl-h3"
  }, "Request received"), /*#__PURE__*/React.createElement("p", {
    className: "lsl-body lsl-body--sm",
    style: {
      marginTop: 0
    }
  }, "Thank you! This is a request, not a confirmed booking. Coach Gio will reach out to ", /*#__PURE__*/React.createElement("strong", null, form.email), " to set up ", form.athlete, "\u2019s session."), /*#__PURE__*/React.createElement("div", {
    className: "lsl-bkdone__row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lsl-btn lsl-btn--primary lsl-btn--sm",
    onClick: onClose
  }, "Done")))));
}

/* Visible FAQ; the same list (js/faq.js) becomes FAQPage structured data at build time. */
function TrainingFAQ() {
  var items = window.LSL_FAQ || [];
  if (!items.length) return null;
  return /*#__PURE__*/React.createElement("section", {
    className: "lsl-section",
    id: "faq",
    style: {
      paddingTop: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lsl-wrap",
    style: {
      maxWidth: 860
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    center: true,
    eyebrow: "Questions",
    title: "Training FAQ",
    sub: "Quick answers about booking, pricing, locations, and policies."
  }), /*#__PURE__*/React.createElement("div", {
    className: "lsl-faq"
  }, items.map((f, i) => /*#__PURE__*/React.createElement("details", {
    key: i,
    className: "lsl-faq__item",
    open: i === 0
  }, /*#__PURE__*/React.createElement("summary", {
    className: "lsl-faq__q"
  }, f.q), /*#__PURE__*/React.createElement("p", {
    className: "lsl-faq__a"
  }, f.a))))));
}
Object.assign(window, {
  PrivateBooking,
  BookingForm,
  Calendar,
  TrainingRequestForm,
  TrainingFAQ
});