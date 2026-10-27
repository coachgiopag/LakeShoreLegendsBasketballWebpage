import { all, first, uid, nowIso, parseJson, clean, HttpError, assert, json, readJson, bookingEvent } from '../lib/util.js';
import { getSettings, publicSettings } from '../lib/settings.js';
import { addDays, localToInstant, zoned } from '../lib/time.js';
import { hardConflictsFor, blockHits } from '../lib/schedule.js';
import { claimSlot, confirmBooking, expireHolds, resolveFamily, snapshotFor, bookingInsert } from '../lib/bookings.js';
import { checkoutUrl } from '../lib/stripe.js';
import { notifyBooking, coachAlert } from '../lib/notify.js';
import { flagReserved, loadByToken } from '../lib/reservations.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const playersNum = (p) => (p == null || p === '' ? 1 : parseInt(String(p), 10) || 1);

function publicType(t) {
  return {
    id: t.id, name: t.name, size: t.size, duration: t.duration,
    min_participants: t.min_participants, max_participants: t.max_participants,
    pricing_basis: t.pricing_basis, booking_mode: t.booking_mode, description: t.description || '',
    eligible_loc_ids: parseJson(t.eligible_loc_ids, null), has_pay_link: !!t.pay_link,
    price_cents: t.stripe_check_status === 'verified' ? t.stripe_price_cents : null,
  };
}

/** Openings a family may book right now, plus booked times (shown disabled). */
export async function publicSlots(db, settings) {
  const now = new Date();
  const today = zoned(now, settings.timezone).date;
  const until = addDays(today, settings.maxAdvanceDays);
  const earliest = now.getTime() + settings.minNoticeHours * 3600000;
  const locs = await all(db, 'SELECT id FROM locations WHERE active = 1');
  const activeLoc = new Set(locs.map((l) => l.id));
  const slots = await flagReserved(db, await all(db, 'SELECT * FROM slots WHERE date >= ? AND date <= ? ORDER BY date, time', today, until), today, until);
  const blocks = await all(db, 'SELECT * FROM blocks WHERE end_date >= ? AND date <= ?', today, until);
  const byId = Object.fromEntries(slots.map((s) => [s.id, s]));
  const byDate = {};
  for (const s of slots) (byDate[s.date] = byDate[s.date] || []).push(s);
  const out = [];
  for (const s of slots) {
    if (!activeLoc.has(s.loc_id)) continue;
    if (s.status !== 'open') { out.push({ id: s.id, date: s.date, time: s.time, duration: s.duration, locId: s.loc_id, status: 'booked' }); continue; }
    // Coach-reserved for one client: shown on the calendar, bookable only through that client's link.
    if (s.reserved) { out.push({ id: s.id, date: s.date, time: s.time, duration: s.duration, locId: s.loc_id, status: 'reserved' }); continue; }
    if (s.contingent) {
      const anchor = s.contingent_on && byId[s.contingent_on];
      if (!anchor || anchor.status === 'open') continue;
    }
    if (localToInstant(s.date, s.time, settings.timezone).getTime() < earliest) continue;
    if (blockHits(s, blocks).length) continue;
    if (hardConflictsFor(s, byDate[s.date], blocks, settings).length) continue;
    out.push({ id: s.id, date: s.date, time: s.time, duration: s.duration, locId: s.loc_id, status: 'open' });
  }
  return out;
}

/** Sessions that already happened, so the calendar looks as busy as it really was.
    Real ones only: confirmed/completed bookings, plus times the coach marked booked by hand.
    Never open times, held checkouts, or canceled bookings. Shown as booked, with no names. */
const PAST_DAYS = 92;
export async function pastBookedSlots(db, settings) {
  const today = zoned(new Date(), settings.timezone).date;
  const locs = await all(db, 'SELECT id FROM locations WHERE active = 1');
  const activeLoc = new Set(locs.map((l) => l.id));
  const rows = await all(db, `SELECT s.id, s.date, s.time, s.duration, s.loc_id FROM slots s LEFT JOIN bookings b ON b.id = s.booking_id
    WHERE s.status = 'booked' AND s.date >= ? AND s.date < ? AND (b.id IS NULL OR b.status IN ('confirmed', 'completed'))
    ORDER BY s.date, s.time`, addDays(today, -PAST_DAYS), today);
  return rows.filter((s) => activeLoc.has(s.loc_id)).map((s) => ({ id: s.id, date: s.date, time: s.time, duration: s.duration, locId: s.loc_id, status: 'booked', past: true }));
}

export async function catalog(env) {
  const db = env.DB;
  const settings = await getSettings(db);
  await expireHolds(env, db, settings);
  const types = await all(db, 'SELECT * FROM session_types WHERE active = 1 AND archived_at IS NULL ORDER BY sort, created_at');
  const locs = await all(db, 'SELECT id, name, eligible_type_ids FROM locations WHERE active = 1 AND archived_at IS NULL ORDER BY sort, created_at');
  const pkgs = await all(db, 'SELECT id, name, price_cents, credits, eligible_type_ids, validity_days, description, pay_link FROM packages WHERE active = 1 AND archived_at IS NULL');
  return json({
    today: zoned(new Date(), settings.timezone).date,
    settings: publicSettings(settings),
    types: types.map(publicType),
    locations: locs.map((l) => ({ id: l.id, name: l.name, eligible_type_ids: parseJson(l.eligible_type_ids, null) })),
    packages: pkgs.map((p) => ({ ...p, eligible_type_ids: parseJson(p.eligible_type_ids, null), pay_link: undefined, purchasable: !!p.pay_link })),
    slots: [...(await pastBookedSlots(db, settings)), ...(await publicSlots(db, settings))],
  }, 200, { 'Cache-Control': 'no-store' });
}

function validateForm(settings, form, acks) {
  const f = settings.registration.fields;
  const errs = {};
  if (!clean(form.parent)) errs.parent = 'Required';
  if (!clean(form.athlete)) errs.athlete = 'Required';
  if (!EMAIL_RE.test(clean(form.email))) errs.email = 'Enter a valid email';
  for (const k of ['phone', 'age', 'focus', 'notes']) if (f[k] && f[k].show && f[k].required && !clean(form[k])) errs[k] = 'Required';
  for (const a of settings.registration.acknowledgments || []) if (a.required && !(acks || []).includes(a.id)) errs['ack_' + a.id] = 'Please confirm';
  if (Object.keys(errs).length) throw new HttpError(400, 'Please fix the highlighted fields.', { fields: errs });
  return {
    parent: clean(form.parent, 200), athlete: clean(form.athlete, 200), email: clean(form.email, 200), phone: clean(form.phone, 50),
    age: clean(form.age, 100), focus: clean(form.focus, 500), notes: clean(form.notes, 2000), acks: acks || [],
  };
}

export async function createBooking(env, req, ctx) {
  const db = env.DB;
  const body = await readJson(req);
  if (body.website) throw new HttpError(400, 'Rejected.'); // honeypot
  const settings = await getSettings(db);
  await expireHolds(env, db, settings);
  const form = validateForm(settings, body.form || {}, body.acks);

  // A reservation link (coach-reserved time) lets one client book that exact opening.
  let reservation = null;
  if (body.reserveToken) {
    const found = await loadByToken(db, body.reserveToken);
    assert(found.state === 'ok', 409, found.state === 'used' ? 'This reserved time has already been booked.' : 'This reservation link has expired. Please contact Coach Gio.');
    reservation = found.reservation;
    assert(!body.slotId || body.slotId === reservation.slot_id, 400, 'This link is for a different time.');
    body.slotId = reservation.slot_id;
  }

  const type = await first(db, 'SELECT * FROM session_types WHERE id = ? AND active = 1 AND archived_at IS NULL', body.typeId);
  assert(type, 400, 'That session type is not available.');
  if (reservation) {
    const allowed = parseJson(reservation.allowed_type_ids, null);
    assert(!allowed || allowed.includes(type.id), 400, 'That session type is not available for this reserved time.');
  }
  const slot = await first(db, 'SELECT * FROM slots WHERE id = ?', body.slotId);
  assert(slot && slot.status === 'open', 409, 'Sorry — that opening was just taken. Please pick another time.');
  if (reservation) assert(localToInstant(slot.date, slot.time, settings.timezone).getTime() > Date.now(), 409, 'That time has already passed.');
  const loc = await first(db, 'SELECT * FROM locations WHERE id = ? AND active = 1', slot.loc_id);
  assert(loc, 409, 'That location is no longer available.');
  const typeLocs = parseJson(type.eligible_loc_ids, null);
  const locTypes = parseJson(loc.eligible_type_ids, null);
  assert((!typeLocs || typeLocs.includes(loc.id)) && (!locTypes || locTypes.includes(type.id)), 400, 'That session type is not offered at this location.');
  const coachIds = parseJson(type.coach_ids, null);
  assert(!coachIds || !slot.coach_id || coachIds.includes(slot.coach_id), 400, 'That session type is not offered with this coach.');

  const players = playersNum(body.players);
  assert(players >= type.min_participants && players <= Math.max(type.max_participants, type.min_participants), 400,
    `This session is for ${type.min_participants === type.max_participants ? type.min_participants : type.min_participants + '–' + type.max_participants} participant(s).`);

  // Window + visibility re-checked on the server. (A reserved time skips the public
  // notice window; the coach chose it. Collisions are still re-checked in claimSlot.)
  if (!reservation) {
    const visible = await publicSlots(db, settings);
    assert(visible.some((s) => s.id === slot.id && s.status === 'open'), 409, 'Sorry — that time is no longer available. Please pick another time.');
  }

  const roster = [{ name: form.athlete, primary: true }, ...(Array.isArray(body.roster) ? body.roster : [])
    .filter((m) => m && (clean(m.name) || clean(m.contact))).slice(0, 20).map((m) => ({ name: clean(m.name, 200), contact: clean(m.contact, 200) }))];
  const coach = slot.coach_id ? await first(db, 'SELECT id, name FROM users WHERE id = ?', slot.coach_id) : null;
  const { familyId, athleteId, stmts } = await resolveFamily(db, form);
  const id = 'bk' + uid(10);
  const snapshot = snapshotFor({ ...type, duration: slot.duration || type.duration }, loc, coach, settings);

  if (type.booking_mode === 'request' && !reservation) {
    const { cols, vals } = bookingInsert(db, {
      id, kind: 'request', status: 'requested', payment_status: 'unpaid', family_id: familyId, athlete_id: athleteId, type_id: type.id,
      snapshot, players: String(body.players || players), roster, form,
      request: { slot_id: slot.id, date: slot.date, time: slot.time, loc_id: slot.loc_id, location: loc.name, day: null },
    });
    await db.batch([...stmts, db.prepare(`INSERT INTO bookings (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).bind(...vals),
      bookingEvent(db, id, 'family', 'requested', { slot: slot.id })]);
    const bk = await first(db, 'SELECT * FROM bookings WHERE id = ?', id);
    ctx.waitUntil(notifyBooking(env, db, settings, bk, 'request_received'));
    return json({ booking: summary(bk), checkoutUrl: null, next: 'request' }, 201);
  }

  const payToConfirm = !!type.pay_link && settings.payment.mode === 'pay_to_confirm';
  const holdUntil = payToConfirm ? new Date(Date.now() + settings.holdMinutes * 60000).toISOString() : null;
  const booking = {
    id, kind: 'dated', status: 'awaiting_payment', payment_status: 'unpaid', family_id: familyId, athlete_id: athleteId, type_id: type.id,
    snapshot, slot_id: slot.id, date: slot.date, time: slot.time, duration: slot.duration || type.duration, loc_id: slot.loc_id,
    coach_id: slot.coach_id || null, players: body.players ? String(body.players) : null, roster, form,
    hold_expires_at: holdUntil, checkout_ref: type.pay_link ? id : null,
    // Per-athlete pricing for a group: the booker pays for one athlete; the others pay separately.
    payer_mode: type.pricing_basis === 'athlete' && players > 1 ? 'each' : 'one',
  };
  let bk = await claimSlot(env, db, settings, { slot, booking, slotStatus: payToConfirm ? 'held' : 'booked', familyStmts: stmts, actor: 'family' });
  if (!payToConfirm && type.pay_link) bk = await confirmBooking(env, db, settings, id, 'system', 'confirm_then_pay');
  if (reservation) await bookingEvent(db, id, 'family', 'reservation_used', { reservation_id: reservation.id, reserved_for: reservation.client_name }).run();
  ctx.waitUntil(coachAlert(env, db, settings, 'New booking — ' + form.athlete + ' · ' + slot.date + ' ' + slot.time,
    [reservation ? 'Reserved time for ' + reservation.client_name : null, snapshot.service_name, slot.date + ' ' + slot.time + ' · ' + loc.name, 'Parent: ' + form.parent + ' · ' + form.email + ' · ' + form.phone,
      payToConfirm ? 'Status: held until ' + holdUntil + ' pending Stripe payment' : 'Status: ' + bk.status].filter(Boolean).join('\n'), 'coach_alert:' + id));
  return json({
    booking: summary(bk),
    checkoutUrl: type.pay_link ? checkoutUrl(type.pay_link, id, form.email) : null,
    shareUrl: type.pay_link && booking.payer_mode === 'each' ? checkoutUrl(type.pay_link, id) : null,
    athletes: players,
    next: payToConfirm ? 'pay' : (type.pay_link ? 'pay_optional' : 'coach_will_invoice'),
  }, 201);
}

export async function createRequest(env, req, ctx) {
  const db = env.DB;
  const body = await readJson(req);
  if (body.website) throw new HttpError(400, 'Rejected.');
  const settings = await getSettings(db);
  const form = validateForm({ ...settings, registration: { ...settings.registration, acknowledgments: [] } }, body.form || {}, []);
  const r = body.request || {};
  const type = r.typeId ? await first(db, 'SELECT * FROM session_types WHERE id = ?', r.typeId) : null;
  const { familyId, athleteId, stmts } = await resolveFamily(db, form);
  const id = 'bk' + uid(10);
  const snapshot = type ? snapshotFor(type, null, null, settings) : { service_name: clean(r.serviceName, 200) || 'Training Request', duration: settings.defaultDuration };
  const { cols, vals } = bookingInsert(db, {
    id, kind: 'request', status: 'requested', payment_status: 'unpaid', family_id: familyId, athlete_id: athleteId, type_id: type ? type.id : null,
    snapshot, players: r.players ? String(r.players) : null, form,
    roster: [{ name: form.athlete, primary: true }, ...(Array.isArray(body.roster) ? body.roster : []).slice(0, 20).map((m) => ({ name: clean(m.name, 200), contact: clean(m.contact, 200) }))],
    request: { day: clean(r.day, 50), time: clean(r.time, 50), date: clean(r.date, 100), location: clean(r.location, 200), dow: r.dow ?? null, reqTime: clean(r.reqTime, 10) },
  });
  await db.batch([...stmts, db.prepare(`INSERT INTO bookings (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).bind(...vals),
    bookingEvent(db, id, 'family', 'requested', r)]);
  const bk = await first(db, 'SELECT * FROM bookings WHERE id = ?', id);
  ctx.waitUntil(notifyBooking(env, db, settings, bk, 'request_received'));
  return json({ booking: summary(bk) }, 201);
}

function summary(bk) {
  const snap = parseJson(bk.snapshot, {});
  return {
    id: bk.id, status: bk.status, payment_status: bk.payment_status, service: snap.service_name,
    date: bk.date, time: bk.time, location: snap.location ? snap.location.name : null, hold_expires_at: bk.hold_expires_at,
  };
}

export async function bookingStatus(env, id) {
  const bk = await first(env.DB, 'SELECT * FROM bookings WHERE id = ?', id);
  if (!bk) throw new HttpError(404, 'Booking not found.');
  return json({ booking: summary(bk) }, 200, { 'Cache-Control': 'no-store' });
}

export async function packageCheckout(env, req) {
  const db = env.DB;
  const body = await readJson(req);
  const settings = await getSettings(db);
  const pkg = await first(db, 'SELECT * FROM packages WHERE id = ? AND active = 1 AND archived_at IS NULL', body.packageId);
  assert(pkg && pkg.pay_link, 400, 'That package is not available for online purchase.');
  const form = validateForm({ ...settings, registration: { ...settings.registration, acknowledgments: [] } }, { ...body.form, athlete: body.form && body.form.athlete || '-' }, []);
  const { familyId, stmts } = await resolveFamily(db, form, { withAthlete: false });
  const fpId = 'fp' + uid(10);
  const t = nowIso();
  await db.batch([...stmts, db.prepare(`INSERT INTO family_packages (id, family_id, package_id, snapshot, status, credits_total, checkout_ref, created_at)
    VALUES (?,?,?,?, 'pending_payment', ?, ?, ?)`).bind(fpId, familyId, pkg.id, JSON.stringify(pkg), pkg.credits, fpId, t)]);
  return json({ checkoutUrl: checkoutUrl(pkg.pay_link, fpId, form.email) }, 201);
}

/** What a client sees when they open a reservation link. Never exposes coach notes or email. */
export async function reservationLookup(env, token) {
  const db = env.DB;
  const settings = await getSettings(db);
  await expireHolds(env, db, settings);
  const { reservation: r, state } = await loadByToken(db, token);
  const slot = await first(db, 'SELECT * FROM slots WHERE id = ?', r.slot_id);
  const types = await all(db, 'SELECT id FROM session_types WHERE active = 1 AND archived_at IS NULL');
  const allowed = parseJson(r.allowed_type_ids, null);
  const ok = state === 'ok' && slot && slot.status === 'open';
  return json({
    state: state === 'ok' && !ok ? 'unavailable' : state,
    client_name: r.client_name,
    expires_at: r.expires_at,
    slot: slot && ok ? { id: slot.id, date: slot.date, time: slot.time, duration: slot.duration, locId: slot.loc_id } : null,
    allowed_type_ids: allowed ? allowed.filter((id) => types.some((t) => t.id === id)) : types.map((t) => t.id),
  }, 200, { 'Cache-Control': 'no-store' });
}
