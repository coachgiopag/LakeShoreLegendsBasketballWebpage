/* global React, SectionHead, LSL */
const { useState: useStateBk, useEffect: useEffectBk, useReducer: useReducerBk } = React;

// Web3Forms keys are public by design (they only let this form email the coach).
const W3F_1ON1   = '57d5ddc7-7fef-4b25-b3c1-6d0ace6f4633';
const W3F_GROUP  = '26db51db-43e4-4bf9-90d5-fa4c7a647de2';
const W3F_REQTRN = '0202f9d6-795d-4dd1-ae8e-6b5fe7391d92';

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad2 = (n) => String(n).padStart(2, '0');
const isoOf = (dt) => dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());

const policyLines = () => LSL.getSettings().policyLines || [];
const groupLabel = (t) => (t.max_participants > t.min_participants ? t.min_participants + '+' : String(t.min_participants));

async function notifyCoach(rec) {
  const isGroup = !!rec.players;
  const key = rec.mode === 'request' ? W3F_REQTRN : (isGroup ? W3F_GROUP : W3F_1ON1);
  const fromName = rec.mode === 'request' ? 'LSL Request Training' : (isGroup ? 'LSL Small Group Booking' : 'LSL New 1-on-1 Booking');
  const f = rec.form;
  const lines = rec.mode === 'request'
    ? ['Training Request — ' + f.athlete, rec.requestLine]
    : ['New Booking: ' + f.athlete, rec.service + (rec.players ? ' · ' + rec.players + ' players' : ''),
      LSL.fmtDate(rec.date) + ' · ' + LSL.fmtTime(rec.time) + ' ' + LSL.tzLabel(rec.date, rec.time), rec.location,
      rec.status === 'awaiting_payment' ? 'Status: reserved, waiting for Stripe payment' : 'Status: ' + rec.status];
  const message = [...lines, 'Parent: ' + f.parent, f.email + (f.phone ? ' · ' + f.phone : ''),
    f.age ? 'Age/Grade: ' + f.age : '', f.focus ? 'Focus: ' + f.focus : '', f.notes ? 'Notes: ' + f.notes : '',
    ...(rec.roster || []).filter((m) => !m.primary).map((m, i) => 'Player ' + (i + 2) + ': ' + (m.name || '—') + (m.contact ? ' · ' + m.contact : '')),
    'Booking ID: ' + rec.id].filter(Boolean).join('\n');
  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: key, subject: (rec.mode === 'request' ? 'Training Request — ' : 'New Booking — ') + f.athlete, message, from_name: fromName, replyto: f.email, cc: '2244259490@tmomail.net' }),
    });
  } catch (e) { /* non-blocking */ }
}

function PolicyText({ className }) {
  const lines = policyLines();
  if (!lines.length) return null;
  return <span className={className}>{lines.map((line, i) => <React.Fragment key={i}>{line}{i < lines.length - 1 && <br />}</React.Fragment>)}</span>;
}

function PrivateBooking() {
  const [locFilter, setLocFilter] = useStateBk(null); // null = all
  const [dropOpen, setDropOpen] = useStateBk(false);
  const dropRef = React.useRef(null);
  const [offset, setOffset] = useStateBk(0);
  const [date, setDate] = useStateBk(null);
  const [slotId, setSlotId] = useStateBk(null);
  const [svcType, setSvcType] = useStateBk(null); // 'solo' | 'small'
  const [groupTypeId, setGroupTypeId] = useStateBk(null);
  const [formDesc, setFormDesc] = useStateBk(null); // snapshot, so the result stays up after the selection resets
  const [reqTrainOpen, setReqTrainOpen] = useStateBk(false);
  const [, forceSync] = useReducerBk((x) => x + 1, 0);

  useEffectBk(() => {
    const onSync = () => forceSync();
    window.addEventListener('lsl-synced', onSync);
    return () => window.removeEventListener('lsl-synced', onSync);
  }, []);
  useEffectBk(() => { if (window.lucide) window.lucide.createIcons(); });
  useEffectBk(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const todayIso = LSL.today() || isoOf(new Date());
  const locs = LSL.getLocs();
  const allSlots = LSL.getSlots();
  const types = LSL.getTypes();
  const loaded = LSL.isLoaded();
  const loadErr = LSL.loadError();

  // Coach-reserved time (private link): preselect it once, then limit session types to what the coach allowed.
  const rsv = LSL.getReservation();
  const mineId = rsv && rsv.state === 'ok' && rsv.slot ? rsv.slot.id : null;
  const appliedRef = React.useRef(false);
  useEffectBk(() => {
    if (appliedRef.current || !mineId || !loaded) return;
    appliedRef.current = true;
    const [ty, tm] = (LSL.today() || isoOf(new Date())).split('-').map(Number);
    const [sy, sm] = rsv.slot.date.split('-').map(Number);
    setOffset(Math.max(0, (sy - ty) * 12 + (sm - tm)));
    setDate(rsv.slot.date); setSlotId(mineId); setSvcType(null); setGroupTypeId(null);
    const el = document.getElementById('book');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // A reserved time is listed (marked Reserved) so families can see it is taken, but only open times count as bookable.
  const openDates = new Set(allSlots.filter((s) => (s.status === 'open' || s.status === 'reserved') && (!locFilter || s.locId === locFilter)).map((s) => s.date));
  const daySlots = date
    ? allSlots.filter((s) => s.date === date && (!locFilter || s.locId === locFilter)).sort((a, b) => a.time.localeCompare(b.time))
    : [];
  const byLoc = {};
  daySlots.forEach((s) => { if (!byLoc[s.locId]) byLoc[s.locId] = []; byLoc[s.locId].push(s); });

  const slot = allSlots.find((s) => s.id === slotId) || null;
  const allowedIds = mineId && slotId === mineId ? rsv.allowed_type_ids : null;
  const offeredHere = (t) => {
    if (!slot) return false;
    if (allowedIds && !allowedIds.includes(t.id)) return false;
    const loc = LSL.locById(slot.locId);
    return (!t.eligible_loc_ids || t.eligible_loc_ids.includes(slot.locId)) && (!loc.eligible_type_ids || loc.eligible_type_ids.includes(t.id));
  };
  const soloType = types.find((t) => t.max_participants === 1 && offeredHere(t));
  const groupTypes = types.filter((t) => t.max_participants > 1 && offeredHere(t)).sort((a, b) => a.min_participants - b.min_participants);

  const pickLoc = (id) => { setLocFilter(id); setDate(null); setSlotId(null); setSvcType(null); setGroupTypeId(null); setOffset(0); };
  const pickDate = (iso) => { setDate(iso); setSlotId(null); setSvcType(null); setGroupTypeId(null); };
  const pickSlot = (id) => { setSlotId(id); setSvcType(null); setGroupTypeId(null); };

  let desc = null;
  if (slot && svcType === 'solo' && soloType) desc = { type: soloType, slot, players: null };
  else if (slot && svcType === 'small' && groupTypeId) {
    const gt = groupTypes.find((t) => t.id === groupTypeId);
    if (gt) desc = { type: gt, slot, players: groupLabel(gt) };
  }

  const ReqFooter = () => (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <p className="lsl-body lsl-body--sm" style={{ color: 'var(--fg2)', marginBottom: 12, textAlign: 'center', fontSize: '0.85em' }}>
        Don&rsquo;t see a date, time, or location you like?<br/>
        <span style={{ fontSize: '1.08em' }}>Reach out &mdash; Coach Gio can often make it work.</span>
      </p>
      <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" style={{ width: '100%' }} onClick={() => setReqTrainOpen(true)}>
        <i data-lucide="mail"></i> Request Training
      </button>
    </div>
  );

  const zone = LSL.tzLabel();

  return (
    <section className="lsl-section lsl-section--cream" id="book" style={{ paddingTop: '44px' }}>
      <div className="lsl-wrap">
        <SectionHead center wide eyebrow="Private Training"
          title="Book a Session With Coach Gio"
          sub="Check out our availability and book the date and time that works for you." />

        {window.LSL_API_NAME === 'staging' && <p className="lsl-bknote" style={{ maxWidth: 560, margin: '0 auto 16px' }}><i data-lucide="flask-conical"></i><span><strong>Test mode:</strong> bookings here go to the test server and use Stripe test payments.</span></p>}
        {!loaded && !loadErr && !window.LSL_PRERENDER && <p className="lsl-body lsl-body--sm" style={{ textAlign: 'center', color: 'var(--fg3)' }} role="status">Loading availability…</p>}
        {loadErr && (
          <div className="lsl-bknote" role="alert" style={{ maxWidth: 560, margin: '0 auto 20px' }}>
            <i data-lucide="alert-triangle"></i>
            <span>We couldn&rsquo;t load open times right now. <button className="lsl-linkbtn" onClick={() => LSL.refresh()}>Try again</button> or use Request Training below.</span>
          </div>
        )}

        <ReservationNotice rsv={rsv} />

        <div className="lsl-sched">
          <div className="lsl-sched__col">
            <div className="lsl-sched__head" style={{ textAlign: 'center' }}>Select a Date</div>
            {locs.length > 0 && (
              <div className="lsl-locdrop" ref={dropRef}>
                <button className="lsl-locdrop__trigger" onClick={() => setDropOpen(!dropOpen)} aria-expanded={dropOpen}>
                  <i data-lucide="map-pin"></i>
                  <span>{locFilter ? (LSL.locById(locFilter) || {}).name : 'All Locations'}</span>
                  <i data-lucide={dropOpen ? 'chevron-up' : 'chevron-down'} className="lsl-locdrop__chev"></i>
                </button>
                {dropOpen && (
                  <div className="lsl-locdrop__menu">
                    <button className={'lsl-locdrop__opt' + (!locFilter ? ' is-sel' : '')} onClick={() => { pickLoc(null); setDropOpen(false); }}>All Locations</button>
                    {locs.map((loc) => (
                      <button key={loc.id} className={'lsl-locdrop__opt' + (locFilter === loc.id ? ' is-sel' : '')} onClick={() => { pickLoc(loc.id); setDropOpen(false); }}>
                        <i data-lucide="map-pin"></i>{loc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Calendar offset={offset} onOffset={setOffset} openDates={openDates} selected={date} onPick={pickDate} todayIso={todayIso} />
          </div>

          <div className="lsl-sched__col lsl-sched__col--border">
            <div className="lsl-sched__head">Available Times <span style={{ fontWeight: 400, color: 'var(--fg3)', textTransform: 'none', letterSpacing: 0 }}>({zone})</span></div>
            {!date
              ? <div className="lsl-sched__ph">Pick a highlighted date to see open times.</div>
              : daySlots.length === 0
                ? <p className="lsl-body lsl-body--sm" style={{ color: 'var(--fg3)' }}>No open times on this day.</p>
                : Object.keys(byLoc).map((lid) => (
                    <div key={lid} style={{ marginBottom: 16 }}>
                      <div className="lsl-times__loc">{LSL.locById(lid).name || lid}</div>
                      <div className="lsl-times__row">
                        {byLoc[lid].map((s) => {
                          const mine = s.id === mineId;
                          const reserved = s.status === 'reserved' && !mine;
                          const bookable = s.status === 'open' || mine;
                          return (
                            <button key={s.id}
                              className={'lsl-time' + (!bookable ? ' is-booked' : '') + (reserved ? ' is-reserved' : '') + (mine ? ' is-mine' : '') + (slotId === s.id ? ' is-sel' : '')}
                              disabled={!bookable} aria-pressed={slotId === s.id}
                              aria-label={LSL.fmtTime(s.time) + (mine ? ', reserved for you' : reserved ? ', reserved' : !bookable ? ', booked' : '')}
                              onClick={() => bookable && pickSlot(s.id)}>
                              {LSL.fmtTime(s.time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
            }
          </div>

          <div className="lsl-sched__col lsl-sched__col--border">
            <div className="lsl-sched__head">Type of Session</div>
            {!slotId ? (
              <>
                <div className="lsl-sched__ph">Select a date and time to choose your session type.</div>
                <ReqFooter />
              </>
            ) : (
              <div>
                <div className="lsl-svclist">
                  {soloType && (
                    <button className={'lsl-svc' + (svcType === 'solo' ? ' is-sel' : '')} onClick={() => { setSvcType('solo'); setGroupTypeId(null); }}>
                      <span className="lsl-svc__ico"><i data-lucide="user"></i></span>
                      <span className="lsl-svc__body">
                        <span className="lsl-svc__name">1-on-1 Private Training</span>
                        <span className="lsl-svc__meta">One athlete · {soloType.duration} min{LSL.priceLabel(soloType) ? ' · ' + LSL.priceLabel(soloType) : ''}</span>
                      </span>
                      <i data-lucide="chevron-right" className="lsl-svc__chev"></i>
                    </button>
                  )}
                  {groupTypes.length > 0 && (
                    <button className={'lsl-svc' + (svcType === 'small' ? ' is-sel' : '')} onClick={() => { setSvcType('small'); setGroupTypeId(null); }}>
                      <span className="lsl-svc__ico"><i data-lucide="users"></i></span>
                      <span className="lsl-svc__body">
                        <span className="lsl-svc__name">Small Group Training</span>
                        <span className="lsl-svc__meta">Bring your own group</span>
                      </span>
                      <i data-lucide="chevron-right" className="lsl-svc__chev"></i>
                    </button>
                  )}
                </div>
                {svcType === 'small' && (
                  <div className="lsl-svcsub">
                    <div className="lsl-svcsub__q" id="lsl-players-q">How many players in your group?</div>
                    <div className="lsl-svcsub__opts" role="group" aria-labelledby="lsl-players-q">
                      {groupTypes.map((t) => (
                        <button key={t.id} className={'lsl-countchip' + (groupTypeId === t.id ? ' is-sel' : '')} aria-pressed={groupTypeId === t.id} onClick={() => setGroupTypeId(t.id)}>{groupLabel(t)}</button>
                      ))}
                    </div>
                  </div>
                )}
                {desc && (
                  <button className="lsl-btn lsl-btn--primary lsl-times__req" onClick={() => setFormDesc(desc)}>
                    <i data-lucide="calendar-check"></i> {desc.type.booking_mode === 'request' ? 'Request Session' : 'Book Session'}
                  </button>
                )}
                <ReqFooter />
              </div>
            )}
          </div>
        </div>

        <p className="lsl-bookpolicy">
          <i data-lucide="info"></i>
          <PolicyText />
        </p>
      </div>
      {formDesc && (
        <BookingForm desc={formDesc} onClose={() => setFormDesc(null)}
          onBooked={() => { setSlotId(null); setDate(null); setSvcType(null); setGroupTypeId(null); LSL.refresh(); }} />
      )}
      {reqTrainOpen && <TrainingRequestForm onClose={() => setReqTrainOpen(false)} />}
    </section>
  );
}

function ReservationNotice({ rsv }) {
  useEffectBk(() => { if (window.lucide) window.lucide.createIcons(); });
  if (!rsv || rsv.state === 'loading') return null;
  const wrap = { maxWidth: 640, margin: '0 auto 20px' };
  if (rsv.state === 'ok' && rsv.slot) {
    const loc = LSL.locById(rsv.slot.locId);
    const until = new Date(rsv.expires_at).toLocaleDateString('en-US', { timeZone: LSL.tz(), weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + LSL.fmtInstant(rsv.expires_at);
    return (
      <div className="lsl-bknote" role="status" style={wrap}>
        <i data-lucide="calendar-check"></i>
        <span><strong>Reserved for {rsv.client_name}:</strong> {LSL.fmtDateLong(rsv.slot.date)} at {LSL.fmtTime(rsv.slot.time)}{loc.name ? ' · ' + loc.name : ''}.
          Choose your session type below to book it. This time is held for you until {until}.</span>
      </div>
    );
  }
  const msg = {
    used: 'This reserved time has already been booked.',
    expired: 'This reservation link has expired. Please contact Coach Gio, or choose another time below.',
    revoked: 'This reservation link is no longer active. Please contact Coach Gio, or choose another time below.',
    unavailable: 'This reserved time is no longer available. Please contact Coach Gio, or choose another time below.',
    invalid: 'This reservation link is not valid. Please check the link or contact Coach Gio.',
    error: 'We couldn\u2019t check your reservation right now. Please refresh and try again.',
  }[rsv.state] || 'This reservation link is not available.';
  return (
    <div className="lsl-bknote" role="alert" style={wrap}>
      <i data-lucide="info"></i>
      <span>{msg}</span>
    </div>
  );
}

function Calendar({ offset, onOffset, openDates, selected, onPick, todayIso }) {
  useEffectBk(() => { if (window.lucide) window.lucide.createIcons(); });
  const [ty, tm] = todayIso.split('-').map(Number);
  const base = new Date(ty, tm - 1 + offset, 1);
  const y = base.getFullYear(), m = base.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const monthName = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="lsl-cal">
      <div className="lsl-cal__nav">
        <button onClick={() => onOffset(Math.max(0, offset - 1))} disabled={offset <= 0} aria-label="Previous month"><i data-lucide="chevron-left"></i></button>
        <span className="lsl-cal__month" aria-live="polite">{monthName}</span>
        <button onClick={() => onOffset(offset + 1)} aria-label="Next month"><i data-lucide="chevron-right"></i></button>
      </div>
      <div className="lsl-cal__dows">{dows.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="lsl-cal__grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={'b' + i} className="lsl-cal__cell is-empty"></span>;
          const iso = y + '-' + pad2(m + 1) + '-' + pad2(d);
          const can = openDates.has(iso) && iso >= todayIso;
          return (
            <button key={iso} disabled={!can} aria-label={LSL.fmtDateLong(iso) + (can ? ', has open times' : '')} aria-pressed={selected === iso}
              className={'lsl-cal__cell' + (can ? ' is-open' : '') + (selected === iso ? ' is-sel' : '')}
              onClick={() => can && onPick(iso)}>
              {d}
              {can && <span className="lsl-cal__dot"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useModalKeys(onClose, deps) {
  useEffectBk(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, deps);
}

function BookingForm({ desc, onClose, onBooked }) {
  const settings = LSL.getSettings();
  const fields = (settings.registration && settings.registration.fields) || {};
  const acks = (settings.registration && settings.registration.acknowledgments) || [];
  const [form, setForm] = useStateBk({ parent: '', athlete: '', age: '', email: '', phone: '', focus: '', notes: '', website: '' });
  const [ackd, setAckd] = useStateBk([]);
  const [errs, setErrs] = useStateBk({});
  const [busy, setBusy] = useStateBk(false);
  const [result, setResult] = useStateBk(null);
  const { type, slot } = desc;
  const isReq = type.booking_mode === 'request';
  const extraCount = Math.max(0, (type.min_participants || 1) - 1);
  const [groupMembers, setGroupMembers] = useStateBk(() => Array.from({ length: extraCount }, () => ({ name: '', contact: '' })));
  useModalKeys(onClose, [result]);

  const loc = LSL.locById(slot.locId);
  const show = (k) => !fields[k] || fields[k].show !== false;
  const req = (k) => ['parent', 'athlete', 'email'].includes(k) || !!(fields[k] && fields[k].required);
  const label = (k, def) => (fields[k] && fields[k].label) || def;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setMember = (i, k) => (e) => setGroupMembers(groupMembers.map((m, idx) => idx === i ? { ...m, [k]: e.target.value } : m));

  function validate() {
    const e = {};
    if (!form.parent.trim()) e.parent = 'Required';
    if (!form.athlete.trim()) e.athlete = 'Required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Enter a valid email';
    ['phone', 'age', 'focus', 'notes'].forEach((k) => { if (show(k) && req(k) && !String(form[k]).trim()) e[k] = 'Required'; });
    acks.forEach((a) => { if (a.required && !ackd.includes(a.id)) e['ack_' + a.id] = 'Please confirm'; });
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const members = groupMembers.filter((m) => m.name.trim() || m.contact.trim());
      const rv = LSL.getReservation();
      const reserveToken = rv && rv.state === 'ok' && rv.slot && rv.slot.id === slot.id ? LSL.reserveToken : undefined;
      const res = await LSL.createBooking({ slotId: slot.id, typeId: type.id, players: desc.players, form, roster: members, acks: ackd, website: form.website, reserveToken });
      const rec = { ...res.booking, mode: 'dated', players: desc.players, form, roster: [{ primary: true }, ...members], checkoutUrl: res.checkoutUrl, shareUrl: res.shareUrl, athletes: res.athletes, next: res.next, duration: type.duration };
      notifyCoach(rec);
      setResult(rec);
      if (onBooked) onBooked();
    } catch (err) {
      setErrs({ ...(err.fields || {}), form: err.message });
      if (err.status === 409) LSL.refresh();
    } finally { setBusy(false); }
  }

  const Field = ({ k, def, type: inputType, placeholder }) => (
    <div><label htmlFor={'bk-' + k}>{label(k, def)} {req(k) && <span className="req">*</span>}</label>
      <input id={'bk-' + k} className={'lsl-input' + (errs[k] ? ' is-error' : '')} type={inputType || 'text'} value={form[k]} onChange={set(k)} placeholder={placeholder} aria-invalid={!!errs[k]} />
      {errs[k] && <span className="lsl-err">{errs[k]}</span>}</div>
  );

  return (
    <div className="lsl-lightbox" onClick={onClose}>
      <div className="lsl-bkmodal" role="dialog" aria-modal="true" aria-labelledby="bk-title" onClick={(e) => e.stopPropagation()}>
        <button className="lsl-lightbox__close" onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16 }}>
          <i data-lucide="x"></i>
        </button>

        {!result ? (
          <form className="lsl-bkbody" onSubmit={submit} noValidate>
            <h3 className="lsl-h3" id="bk-title" style={{ marginTop: 0, marginBottom: 4 }}>{isReq ? 'Request Session' : 'Book Session'}</h3>
            <div className="lsl-bksummary">
              <span><i data-lucide="dumbbell"></i>{type.name}</span>
              {desc.players && <span><i data-lucide="users"></i>{desc.players} players</span>}
              <span><i data-lucide="calendar"></i>{LSL.fmtDateLong(slot.date)}</span>
              <span><i data-lucide="clock"></i>{LSL.fmtTime(slot.time)} {LSL.tzLabel(slot.date, slot.time)}</span>
              <span><i data-lucide="map-pin"></i>{loc.name}</span>
              {LSL.priceLabel(type) && <span><i data-lucide="tag"></i>{LSL.priceLabel(type)}</span>}
            </div>
            {type.description && <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>{type.description}</p>}
            <div className="lsl-field lsl-field--row">
              {Field({ k: 'parent', def: 'Parent / Guardian Name', placeholder: 'Jane Smith' })}
              {Field({ k: 'athlete', def: 'Athlete Name', placeholder: 'Alex Smith' })}
            </div>
            <div className="lsl-field lsl-field--row">
              {Field({ k: 'email', def: 'Email', type: 'email', placeholder: 'you@email.com' })}
              {show('phone') && Field({ k: 'phone', def: 'Phone', type: 'tel', placeholder: '(555) 555-5555' })}
            </div>
            <div className="lsl-field lsl-field--row">
              {show('age') && Field({ k: 'age', def: 'Athlete Age / Grade', placeholder: '7th grade' })}
              {show('focus') && Field({ k: 'focus', def: 'Focus Areas / Goals', placeholder: 'Shooting, ball handling' })}
            </div>
            {show('notes') && (
              <div className="lsl-field">
                <label htmlFor="bk-notes">{label('notes', 'Additional Notes')} {req('notes') && <span className="req">*</span>}</label>
                <textarea id="bk-notes" className={'lsl-textarea' + (errs.notes ? ' is-error' : '')} value={form.notes} onChange={set('notes')} placeholder="Anything Coach Gio should know" style={{ minHeight: 76 }}></textarea>
                {errs.notes && <span className="lsl-err">{errs.notes}</span>}
              </div>
            )}
            <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex="-1" autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
            {extraCount > 0 && (
              <div className="lsl-groupmembers">
                <div className="lsl-groupmembers__head"><i data-lucide="users"></i> Who else is coming to this session?</div>
                <p className="lsl-body lsl-body--sm" style={{ color: 'var(--fg3)', marginTop: 0, marginBottom: 14 }}>
                  Add your group members below — a name and a way to reach them is all we need.
                </p>
                {groupMembers.map((m, i) => (
                  <div key={i} className="lsl-groupmembers__row">
                    <span className="lsl-groupmembers__num">{i + 2}</span>
                    <div className="lsl-field lsl-field--row" style={{ flex: 1, margin: 0 }}>
                      <div><label htmlFor={'gm-n' + i}>Name</label><input id={'gm-n' + i} className="lsl-input" value={m.name} onChange={setMember(i, 'name')} placeholder={'Player ' + (i + 2) + ' name'} /></div>
                      <div><label htmlFor={'gm-c' + i}>Email or Phone Number</label><input id={'gm-c' + i} className="lsl-input" value={m.contact} onChange={setMember(i, 'contact')} placeholder="If you have it" /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="lsl-bknote" style={{ marginBottom: 14 }}>
              <i data-lucide={isReq ? 'mail' : 'shield-check'}></i>
              {isReq
                ? <span>This sends a <strong>request</strong> to Coach Gio. Nothing is booked or charged until it&rsquo;s approved.</span>
                : type.has_pay_link
                  ? <span>We&rsquo;ll hold this time for <strong>{settings.holdMinutes || 10} minutes</strong> while you pay securely with <strong>Stripe</strong>. It&rsquo;s confirmed once payment goes through.</span>
                  : <span>Coach Gio will email you a secure payment link.</span>}
            </div>
            <div className="lsl-bknote" style={{ marginBottom: 14 }}>
              <i data-lucide="map-pin"></i>
              <span>Sessions are in the <strong>{loc.name}</strong> area. After booking, reach out to Coach Gio to organize the exact location.</span>
            </div>
            <p className="lsl-bkpolicy--modal"><PolicyText /></p>
            {acks.map((a) => (
              <label key={a.id} className="lsl-ack">
                <input type="checkbox" checked={ackd.includes(a.id)} onChange={(e) => setAckd(e.target.checked ? [...ackd, a.id] : ackd.filter((x) => x !== a.id))} aria-invalid={!!errs['ack_' + a.id]} />
                <span>{a.text}{a.required && <span className="req"> *</span>}</span>
                {errs['ack_' + a.id] && <span className="lsl-err" style={{ display: 'block' }}>{errs['ack_' + a.id]}</span>}
              </label>
            ))}
            {errs.form && <p className="lsl-err" role="alert">{errs.form}</p>}
            <button type="submit" className="lsl-btn lsl-btn--primary" disabled={busy} style={{ width: '100%' }}>
              <i data-lucide={isReq ? 'send' : 'arrow-right'}></i>
              {busy ? ' Reserving…' : (isReq ? ' Submit Request' : (type.has_pay_link ? ' Reserve & Continue to Payment' : ' Reserve Session'))}
            </button>
          </form>
        ) : result.status === 'requested' ? (
          <div className="lsl-bkbody lsl-bkdone" role="status">
            <div className="lsl-formsuccess__ico"><i data-lucide="check"></i></div>
            <h3 className="lsl-h3">Request received</h3>
            <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>
              {result.service} · {LSL.fmtDateLong(slot.date)} · {LSL.fmtTime(slot.time)}.<br />
              This is not confirmed yet — Coach Gio will follow up at <strong>{form.email}</strong>. No payment has been taken.
            </p>
            <div className="lsl-bkdone__row"><button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={onClose}>Done</button></div>
          </div>
        ) : (
          <div className="lsl-bkbody lsl-bkdone" role="status">
            <div className="lsl-formsuccess__ico"><i data-lucide="check"></i></div>
            <h3 className="lsl-h3">{result.next === 'pay' ? 'Spot held — one last step' : 'Spot reserved'}</h3>
            <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>
              {result.service}{result.players ? ' · ' + result.players + ' players' : ''} · {LSL.fmtDateLong(result.date)} · {LSL.fmtTime(result.time)} {LSL.tzLabel(result.date, result.time)} · {result.location}.
            </p>
            {result.checkoutUrl
              ? <a className="lsl-btn lsl-btn--primary" href={result.checkoutUrl} target="_blank" rel="noopener" style={{ marginBottom: 12 }}><i data-lucide="credit-card"></i> {result.shareUrl ? 'Pay for My Athlete' : 'Complete Payment Now'}</a>
              : <div className="lsl-bknote"><i data-lucide="info"></i><span>Coach Gio will email a secure payment link to {form.email}.</span></div>}
            {result.shareUrl && (
              <div className="lsl-bknote" style={{ marginBottom: 12, display: 'block' }}>
                <span>Each family pays for its own athlete. <strong>Send this link to the other {result.athletes - 1} {result.athletes - 1 === 1 ? 'family' : 'families'}</strong> in your group — their payments are added to this booking automatically:</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input className="lsl-input" readOnly value={result.shareUrl} onFocus={(e) => e.target.select()} aria-label="Payment link for the other families" style={{ flex: 1, minWidth: 180, fontSize: 13 }} />
                  <button type="button" className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={() => { try { navigator.clipboard.writeText(result.shareUrl); } catch (e) { /* select-and-copy fallback */ } }}>Copy link</button>
                </div>
              </div>
            )}
            {result.hold_expires_at && (
              <p className="lsl-body lsl-body--sm" style={{ color: 'var(--fg2)' }}>
                We&rsquo;re holding this time until <strong>{LSL.fmtInstant(result.hold_expires_at)}</strong>. Your booking is confirmed once Stripe confirms payment — you&rsquo;ll get a confirmation email.
              </p>
            )}
            <div className="lsl-bknote" style={{ marginBottom: 12 }}>
              <i data-lucide="map-pin"></i>
              <span><strong>Next:</strong> reach out to Coach Gio to organize the exact location — reply to your confirmation email or use the <a href="contact.html">contact page</a>.</span>
            </div>
            <div className="lsl-bkdone__row">
              <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={() => LSL.downloadICS({ ...result, athlete: form.athlete })}><i data-lucide="calendar-plus"></i> Add to calendar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TrainingRequestForm({ onClose }) {
  const [form, setForm] = useStateBk({ parent: '', athlete: '', email: '', phone: '', reqLocation: '', reqTime: '', reqDate: '', age: '', focus: '', notes: '', website: '' });
  const [errs, setErrs] = useStateBk({});
  const [busy, setBusy] = useStateBk(false);
  const [done, setDone] = useStateBk(false);
  useModalKeys(onClose, [done]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    if (!form.parent.trim()) e.parent = 'Required';
    if (!form.athlete.trim()) e.athlete = 'Required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await LSL.createRequest({
        website: form.website,
        form: { parent: form.parent, athlete: form.athlete, email: form.email, phone: form.phone, age: form.age, focus: form.focus, notes: form.notes },
        request: { serviceName: 'Training Request', location: form.reqLocation, time: form.reqTime, date: form.reqDate },
      });
      notifyCoach({ mode: 'request', id: res.booking.id, form, requestLine: [form.reqLocation, form.reqDate, form.reqTime].filter(Boolean).join(' · ') });
      setDone(true);
    } catch (err) {
      setErrs({ ...(err.fields || {}), form: err.message });
    } finally { setBusy(false); }
  }

  const input = (k, lbl, ph, required, inputType) => (
    <div><label htmlFor={'rq-' + k}>{lbl} {required && <span className="req">*</span>}</label>
      <input id={'rq-' + k} className={'lsl-input' + (errs[k] ? ' is-error' : '')} type={inputType || 'text'} value={form[k]} onChange={set(k)} placeholder={ph} aria-invalid={!!errs[k]} />
      {errs[k] && <span className="lsl-err">{errs[k]}</span>}</div>
  );

  return (
    <div className="lsl-lightbox" onClick={onClose}>
      <div className="lsl-bkmodal" role="dialog" aria-modal="true" aria-labelledby="rq-title" onClick={(e) => e.stopPropagation()}>
        <button className="lsl-lightbox__close" onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16 }}>
          <i data-lucide="x"></i>
        </button>
        {!done ? (
          <form className="lsl-bkbody" onSubmit={submit} noValidate>
            <h3 className="lsl-h3" id="rq-title" style={{ marginTop: 0, marginBottom: 4 }}>Request Training</h3>
            <p className="lsl-body lsl-body--sm" style={{ color: 'var(--fg2)', marginTop: 0, marginBottom: 16 }}>
              Fill this out and Coach Gio will reach out to make it work.
            </p>
            <div className="lsl-field lsl-field--row">{input('parent', 'Parent / Guardian Name', 'Jane Smith', true)}{input('athlete', 'Athlete Name', 'Alex Smith', true)}</div>
            <div className="lsl-field lsl-field--row">{input('email', 'Email', 'you@email.com', true, 'email')}{input('phone', 'Phone', '(555) 555-5555', false, 'tel')}</div>
            <div className="lsl-field lsl-field--row">{input('reqLocation', 'Requested Location', 'Park Ridge, Mundelein…')}{input('reqTime', 'Requested Time', 'e.g. 4:00 PM')}</div>
            <div className="lsl-field lsl-field--row">{input('reqDate', 'Requested Date', 'e.g. July 25')}{input('age', 'Athlete Age / Grade', '7th grade')}</div>
            <div className="lsl-field">{input('focus', 'Focus Areas / Goals', 'Shooting, ball handling, defense…')}</div>
            <div className="lsl-field">
              <label htmlFor="rq-notes">Additional Notes</label>
              <textarea id="rq-notes" className="lsl-textarea" value={form.notes} onChange={set('notes')} placeholder="Anything Coach Gio should know" style={{ minHeight: 76 }}></textarea>
            </div>
            <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex="-1" autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
            {errs.form && <p className="lsl-err" role="alert">{errs.form}</p>}
            <button type="submit" className="lsl-btn lsl-btn--primary" disabled={busy} style={{ width: '100%' }}>
              <i data-lucide="send"></i>{busy ? ' Sending…' : ' Request Booking'}
            </button>
          </form>
        ) : (
          <div className="lsl-bkbody lsl-bkdone" role="status">
            <div className="lsl-formsuccess__ico"><i data-lucide="check"></i></div>
            <h3 className="lsl-h3">Request received</h3>
            <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>
              Thank you! This is a request, not a confirmed booking. Coach Gio will reach out to <strong>{form.email}</strong> to set up {form.athlete}&rsquo;s session.
            </p>
            <div className="lsl-bkdone__row"><button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={onClose}>Done</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Visible FAQ; the same list (js/faq.js) becomes FAQPage structured data at build time. */
function TrainingFAQ() {
  const items = window.LSL_FAQ || [];
  if (!items.length) return null;
  return (
    <section className="lsl-section" id="faq" style={{ paddingTop: 40 }}>
      <div className="lsl-wrap" style={{ maxWidth: 860 }}>
        <SectionHead center eyebrow="Questions" title="Training FAQ" sub="Quick answers about booking, pricing, locations, and policies." />
        <div className="lsl-faq">
          {items.map((f, i) => (
            <details key={i} className="lsl-faq__item" open={i === 0}>
              <summary className="lsl-faq__q">{f.q}</summary>
              <p className="lsl-faq__a">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { PrivateBooking, BookingForm, Calendar, TrainingRequestForm, TrainingFAQ });
