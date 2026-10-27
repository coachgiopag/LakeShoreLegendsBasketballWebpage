/* global React */
/* LakeShore Legends — booking data client.
   All booking data lives in the booking API (see /api). The browser only
   caches the public catalog: session types, public location labels, and
   openings. Exposes window.LSL. */
(function () {
  const API = window.LSL_API || '';
  const TZ_DEFAULT = 'America/Chicago';
  const cache = { types: [], locs: [], slots: [], packages: [], settings: null, today: null };
  let loaded = false, error = null, inflight = null;

  /* Coach-reserved time: a private ?reserve=<token> link. state is one of
     loading | ok | used | expired | revoked | unavailable | invalid | error. */
  let reserveToken = null;
  try { reserveToken = new URLSearchParams(location.search).get('reserve') || null; } catch (e) { /* no query string */ }
  let reservation = reserveToken ? { state: 'loading' } : null, rsvInflight = null;
  function loadReservation() {
    if (!reserveToken) return Promise.resolve();
    if (rsvInflight) return rsvInflight;
    rsvInflight = request('GET', '/api/public/reservations/' + encodeURIComponent(reserveToken)).then((d) => {
      reservation = d;
    }).catch((e) => {
      reservation = { state: e.status === 404 ? 'invalid' : 'error' };
    }).finally(() => {
      rsvInflight = null;
      window.dispatchEvent(new CustomEvent('lsl-synced'));
    });
    return rsvInflight;
  }

  async function request(method, path, body, token) {
    let res;
    try {
      res = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (e) {
      const err = new Error('Could not reach the booking server. Check your connection and try again.');
      err.network = true;
      throw err;
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || 'Something went wrong (' + res.status + ').');
      err.status = res.status;
      err.data = data || {};
      err.fields = (data && data.fields) || null;
      throw err;
    }
    return data;
  }

  function load() {
    if (inflight) return inflight;
    inflight = request('GET', '/api/public/catalog').then((d) => {
      cache.types = d.types; cache.locs = d.locations; cache.slots = d.slots;
      cache.packages = d.packages || []; cache.settings = d.settings; cache.today = d.today;
      loaded = true; error = null;
    }).catch((e) => { error = e; }).finally(() => {
      inflight = null;
      window.dispatchEvent(new CustomEvent('lsl-synced'));
    });
    return inflight;
  }

  /* ---- formatters ---- */
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };
  const fmtDateLong = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); };
  const fmtTime = (t) => { let [h, mn] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + pad2(mn) + ' ' + ap; };
  const fmtMoney = (c) => (c == null ? '' : '$' + (c / 100).toFixed(c % 100 === 0 ? 0 : 2));
  const priceLabel = (ty) => (ty && ty.price_cents != null ? fmtMoney(ty.price_cents) + (ty.pricing_basis === 'athlete' ? ' / athlete' : '') : '');
  const tz = () => window.LSL_TZ || (cache.settings && cache.settings.timezone) || TZ_DEFAULT;

  /* Instant for a wall-clock time in the program time zone (DST-aware). */
  function offsetMin(instant, zone) {
    const p = {};
    for (const x of new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(instant)) p[x.type] = x.value;
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instant.getTime()) / 60000);
  }
  function localToInstant(date, time, zone) {
    const [y, m, d] = date.split('-').map(Number), [hh, mm] = time.split(':').map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    let inst = guess - offsetMin(new Date(guess), zone) * 60000;
    const o2 = offsetMin(new Date(inst), zone);
    return new Date(guess - o2 * 60000);
  }
  function tzLabel(date, time, zone) {
    const z = zone || tz();
    const inst = date && time ? localToInstant(date, time, z) : new Date();
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: z, timeZoneName: 'short' }).formatToParts(inst);
    return (parts.find((x) => x.type === 'timeZoneName') || {}).value || z;
  }
  function fmtInstant(iso, zone) {
    return new Date(iso).toLocaleTimeString('en-US', { timeZone: zone || tz(), hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  }

  function makeICS(bk) {
    const zone = tz();
    const dur = bk.duration || 60;
    const start = localToInstant(bk.date, bk.time, zone);
    const end = new Date(start.getTime() + dur * 60000);
    const f = (d) => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const esc = (s) => String(s || '').replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LakeShore Legends//Booking//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + bk.id + '@lakeshorelegends', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(start), 'DTEND:' + f(end),
      'SUMMARY:' + esc((bk.service || 'Training') + ' — LakeShore Legends'), 'LOCATION:' + esc(bk.location || ''),
      'DESCRIPTION:' + esc('Athlete: ' + (bk.athlete || '') + (bk.coach ? ' with ' + bk.coach : '')),
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
  }
  function downloadICS(bk) {
    const blob = new Blob([makeICS(bk)], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'lakeshore-session.ics';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  const LSL = {
    api: request,
    load, refresh: () => Promise.all([load(), loadReservation()]),
    reserveToken, getReservation: () => reservation,
    isLoaded: () => loaded, loadError: () => error,
    getTypes: () => cache.types,
    getLocs: () => cache.locs,
    getSlots: () => cache.slots,
    getPackages: () => cache.packages,
    getSettings: () => cache.settings || { timezone: TZ_DEFAULT, policyLines: [], registration: { fields: {}, acknowledgments: [] } },
    today: () => cache.today,
    locById: (id) => cache.locs.find((l) => l.id === id) || {},
    typeById: (id) => cache.types.find((t) => t.id === id) || {},
    createBooking: (payload) => request('POST', '/api/public/bookings', payload),
    createRequest: (payload) => request('POST', '/api/public/requests', payload),
    bookingStatus: (id) => request('GET', '/api/public/bookings/' + encodeURIComponent(id)),
    fmtDate, fmtDateLong, fmtTime, fmtMoney, priceLabel, tz, tzLabel, fmtInstant, localToInstant, makeICS, downloadICS,
  };
  window.LSL = LSL;
  // The build-time page snapshot (scripts/prerender.mjs) must not bake openings into the HTML.
  window.LSL_PRERENDER = /HeadlessEdg|HeadlessChrome|LSL-Prerender/i.test(navigator.userAgent || '');
  if (!window.LSL_ADMIN && !window.LSL_PRERENDER) { load(); loadReservation(); }
})();
