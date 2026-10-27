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
/* global React */
/* LakeShore Legends — booking data client.
   All booking data lives in the booking API (see /api). The browser only
   caches the public catalog: session types, public location labels, and
   openings. Exposes window.LSL. */
(function () {
  var API = window.LSL_API || '';
  var TZ_DEFAULT = 'America/Chicago';
  var cache = {
    types: [],
    locs: [],
    slots: [],
    packages: [],
    settings: null,
    today: null
  };
  var loaded = false,
    error = null,
    inflight = null;

  /* Coach-reserved time: a private ?reserve=<token> link. state is one of
     loading | ok | used | expired | revoked | unavailable | invalid | error. */
  var reserveToken = null;
  try {
    reserveToken = new URLSearchParams(location.search).get('reserve') || null;
  } catch (e) {/* no query string */}
  var reservation = reserveToken ? {
      state: 'loading'
    } : null,
    rsvInflight = null;
  function loadReservation() {
    if (!reserveToken) return Promise.resolve();
    if (rsvInflight) return rsvInflight;
    rsvInflight = request('GET', '/api/public/reservations/' + encodeURIComponent(reserveToken)).then(d => {
      reservation = d;
    }).catch(e => {
      reservation = {
        state: e.status === 404 ? 'invalid' : 'error'
      };
    }).finally(() => {
      rsvInflight = null;
      window.dispatchEvent(new CustomEvent('lsl-synced'));
    });
    return rsvInflight;
  }
  function request(_x, _x2, _x3, _x4) {
    return _request.apply(this, arguments);
  }
  function _request() {
    _request = _asyncToGenerator(function* (method, path, body, token) {
      var res;
      try {
        res = yield fetch(API + path, _objectSpread({
          method,
          headers: _objectSpread({
            'Content-Type': 'application/json'
          }, token ? {
            Authorization: 'Bearer ' + token
          } : {})
        }, body !== undefined ? {
          body: JSON.stringify(body)
        } : {}));
      } catch (e) {
        var err = new Error('Could not reach the booking server. Check your connection and try again.');
        err.network = true;
        throw err;
      }
      var data = null;
      try {
        data = yield res.json();
      } catch (e) {/* empty body */}
      if (!res.ok) {
        var _err = new Error(data && data.error || 'Something went wrong (' + res.status + ').');
        _err.status = res.status;
        _err.data = data || {};
        _err.fields = data && data.fields || null;
        throw _err;
      }
      return data;
    });
    return _request.apply(this, arguments);
  }
  function load() {
    if (inflight) return inflight;
    inflight = request('GET', '/api/public/catalog').then(d => {
      cache.types = d.types;
      cache.locs = d.locations;
      cache.slots = d.slots;
      cache.packages = d.packages || [];
      cache.settings = d.settings;
      cache.today = d.today;
      loaded = true;
      error = null;
    }).catch(e => {
      error = e;
    }).finally(() => {
      inflight = null;
      window.dispatchEvent(new CustomEvent('lsl-synced'));
    });
    return inflight;
  }

  /* ---- formatters ---- */
  var pad2 = n => String(n).padStart(2, '0');
  var fmtDate = iso => {
    var _iso$split$map = iso.split('-').map(Number),
      _iso$split$map2 = _slicedToArray(_iso$split$map, 3),
      y = _iso$split$map2[0],
      m = _iso$split$map2[1],
      d = _iso$split$map2[2];
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  var fmtDateLong = iso => {
    var _iso$split$map3 = iso.split('-').map(Number),
      _iso$split$map4 = _slicedToArray(_iso$split$map3, 3),
      y = _iso$split$map4[0],
      m = _iso$split$map4[1],
      d = _iso$split$map4[2];
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  var fmtTime = t => {
    var _t$split$map = t.split(':').map(Number),
      _t$split$map2 = _slicedToArray(_t$split$map, 2),
      h = _t$split$map2[0],
      mn = _t$split$map2[1];
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + pad2(mn) + ' ' + ap;
  };
  var fmtMoney = c => c == null ? '' : '$' + (c / 100).toFixed(c % 100 === 0 ? 0 : 2);
  var priceLabel = ty => ty && ty.price_cents != null ? fmtMoney(ty.price_cents) + (ty.pricing_basis === 'athlete' ? ' / athlete' : '') : '';
  var tz = () => window.LSL_TZ || cache.settings && cache.settings.timezone || TZ_DEFAULT;

  /* Instant for a wall-clock time in the program time zone (DST-aware). */
  function offsetMin(instant, zone) {
    var p = {};
    for (var x of new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).formatToParts(instant)) p[x.type] = x.value;
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instant.getTime()) / 60000);
  }
  function localToInstant(date, time, zone) {
    var _date$split$map = date.split('-').map(Number),
      _date$split$map2 = _slicedToArray(_date$split$map, 3),
      y = _date$split$map2[0],
      m = _date$split$map2[1],
      d = _date$split$map2[2],
      _time$split$map = time.split(':').map(Number),
      _time$split$map2 = _slicedToArray(_time$split$map, 2),
      hh = _time$split$map2[0],
      mm = _time$split$map2[1];
    var guess = Date.UTC(y, m - 1, d, hh, mm);
    var inst = guess - offsetMin(new Date(guess), zone) * 60000;
    var o2 = offsetMin(new Date(inst), zone);
    return new Date(guess - o2 * 60000);
  }
  function tzLabel(date, time, zone) {
    var z = zone || tz();
    var inst = date && time ? localToInstant(date, time, z) : new Date();
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: z,
      timeZoneName: 'short'
    }).formatToParts(inst);
    return (parts.find(x => x.type === 'timeZoneName') || {}).value || z;
  }
  function fmtInstant(iso, zone) {
    return new Date(iso).toLocaleTimeString('en-US', {
      timeZone: zone || tz(),
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }
  function makeICS(bk) {
    var zone = tz();
    var dur = bk.duration || 60;
    var start = localToInstant(bk.date, bk.time, zone);
    var end = new Date(start.getTime() + dur * 60000);
    var f = d => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    var esc = s => String(s || '').replace(/[\\;,]/g, c => '\\' + c).replace(/\n/g, '\\n');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LakeShore Legends//Booking//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:' + bk.id + '@lakeshorelegends', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(start), 'DTEND:' + f(end), 'SUMMARY:' + esc((bk.service || 'Training') + ' — LakeShore Legends'), 'LOCATION:' + esc(bk.location || ''), 'DESCRIPTION:' + esc('Athlete: ' + (bk.athlete || '') + (bk.coach ? ' with ' + bk.coach : '')), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function downloadICS(bk) {
    var blob = new Blob([makeICS(bk)], {
      type: 'text/calendar'
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'lakeshore-session.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  var LSL = {
    api: request,
    load,
    refresh: () => Promise.all([load(), loadReservation()]),
    reserveToken,
    getReservation: () => reservation,
    isLoaded: () => loaded,
    loadError: () => error,
    getTypes: () => cache.types,
    getLocs: () => cache.locs,
    getSlots: () => cache.slots,
    getPackages: () => cache.packages,
    getSettings: () => cache.settings || {
      timezone: TZ_DEFAULT,
      policyLines: [],
      registration: {
        fields: {},
        acknowledgments: []
      }
    },
    today: () => cache.today,
    locById: id => cache.locs.find(l => l.id === id) || {},
    typeById: id => cache.types.find(t => t.id === id) || {},
    createBooking: payload => request('POST', '/api/public/bookings', payload),
    createRequest: payload => request('POST', '/api/public/requests', payload),
    bookingStatus: id => request('GET', '/api/public/bookings/' + encodeURIComponent(id)),
    fmtDate,
    fmtDateLong,
    fmtTime,
    fmtMoney,
    priceLabel,
    tz,
    tzLabel,
    fmtInstant,
    localToInstant,
    makeICS,
    downloadICS
  };
  window.LSL = LSL;
  // The build-time page snapshot (scripts/prerender.mjs) must not bake openings into the HTML.
  window.LSL_PRERENDER = /HeadlessEdg|HeadlessChrome|LSL-Prerender/i.test(navigator.userAgent || '');
  if (!window.LSL_ADMIN && !window.LSL_PRERENDER) {
    load();
    loadReservation();
  }
})();