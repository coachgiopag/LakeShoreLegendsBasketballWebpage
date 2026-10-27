/* Booking lifecycle shared by public, admin, Stripe, and cron paths.

   Statuses
     booking:    requested → awaiting_payment → confirmed → completed
                 (canceled | declined | expired are terminal)
     attendance: not_recorded | present | late | no_show
     payment:    unknown | unpaid | pending | paid | partially_refunded |
                 refunded | package_credit | complimentary

   A checkout reservation is a booking in awaiting_payment with
   hold_expires_at set and its slot in status 'held'. Only a verified Stripe
   event (or a coach recording payment) moves payment_status to paid. */
import { uid, nowIso, all, first, run, stmt, parseJson, normEmail, clean, HttpError, bookingEvent } from './util.js';
import { planResolution, hardConflictsFor } from './schedule.js';
import { zoned, localToInstant } from './time.js';
import { notifyBooking } from './notify.js';
import { flagReserved, markUsed } from './reservations.js';

export const LIVE = ['awaiting_payment', 'confirmed', 'completed'];

export async function daySlots(db, date) {
  return flagReserved(db, await all(db, 'SELECT * FROM slots WHERE date = ?', date), date, date);
}
export async function dayBlocks(db, date) {
  return all(db, 'SELECT * FROM blocks WHERE date <= ? AND end_date >= ?', date, date);
}

export function snapshotFor(type, loc, coach, settings) {
  return {
    service_name: type.name,
    size: type.size,
    duration: type.duration,
    pricing_basis: type.pricing_basis,
    price_cents: type.stripe_price_cents ?? null,
    pay_link: type.pay_link || null,
    prep_instructions: type.prep_instructions || null,
    coach_name: coach ? coach.name : settings.calendar.coachName,
    location: loc ? {
      id: loc.id, name: loc.name, facility_name: loc.facility_name || null, address: loc.address || null,
      parking: loc.parking || null, indoor_outdoor: loc.indoor_outdoor || null, weather_notes: loc.weather_notes || null,
    } : null,
  };
}

/** Find or create the family (matched only on exact email) and the athlete
    (matched only on name within that same family). Never merges on name alone. */
export async function resolveFamily(db, form, { withAthlete = true } = {}) {
  const email = normEmail(form.email);
  let fam = email ? await first(db, 'SELECT * FROM families WHERE email_norm = ? ORDER BY created_at LIMIT 1', email) : null;
  const t = nowIso();
  const stmts = [];
  let familyId, athleteId;
  if (fam) {
    familyId = fam.id;
    if (form.phone && !fam.phone) stmts.push(stmt(db, 'UPDATE families SET phone = ?, updated_at = ? WHERE id = ?', form.phone, t, familyId));
  } else {
    familyId = 'fa' + uid(10);
    stmts.push(stmt(db, 'INSERT INTO families (id, parent_name, email, email_norm, phone, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
      familyId, clean(form.parent, 200) || 'Unknown', clean(form.email, 200), email, clean(form.phone, 50), t, t));
  }
  if (!withAthlete) return { familyId, athleteId: null, stmts };
  const athName = clean(form.athlete, 200);
  const ath = fam ? await first(db, 'SELECT * FROM athletes WHERE family_id = ? AND lower(name) = lower(?)', familyId, athName) : null;
  if (ath) {
    athleteId = ath.id;
    if (form.age && form.age !== ath.grade) stmts.push(stmt(db, 'UPDATE athletes SET grade = ?, updated_at = ? WHERE id = ?', clean(form.age, 100), t, athleteId));
  } else {
    athleteId = 'at' + uid(10);
    stmts.push(stmt(db, 'INSERT INTO athletes (id, family_id, name, grade, goals, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
      athleteId, familyId, athName || 'Athlete', clean(form.age, 100), clean(form.focus, 500), t, t));
  }
  return { familyId, athleteId, stmts };
}

export function bookingInsert(db, b) {
  const cols = ['id', 'kind', 'status', 'attendance', 'payment_status', 'family_id', 'athlete_id', 'type_id', 'snapshot', 'slot_id', 'date', 'time', 'duration',
    'loc_id', 'coach_id', 'players', 'roster', 'payer_mode', 'request', 'form', 'private_notes', 'hold_expires_at', 'checkout_ref', 'legacy', 'created_at', 'updated_at'];
  const t = nowIso();
  const row = { attendance: 'not_recorded', payment_status: 'unknown', payer_mode: 'one', legacy: 0, created_at: t, updated_at: t, ...b };
  const vals = cols.map((c) => {
    const v = row[c];
    return v === undefined ? null : (typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
  });
  return { cols, vals };
}

/** Atomically claim an open slot and create a booking on it. The booking row
    is only inserted if this request won the slot. Returns the created booking
    or throws 409. Then re-checks for collisions with other live slots. */
export async function claimSlot(env, db, settings, { slot, booking, slotStatus, familyStmts, actor }) {
  const t = nowIso();
  const { cols, vals } = bookingInsert(db, booking);
  const won = 'EXISTS (SELECT 1 FROM slots WHERE id = ? AND booking_id = ?)';
  const cond = (sql, ...args) => stmt(db, sql, ...args);
  const famStmts = (familyStmts || []).map((s) => s); // unconditional; cheap to keep if claim loses
  const res = await db.batch([
    cond("UPDATE slots SET status = ?, booking_id = ?, updated_at = ? WHERE id = ? AND status = 'open'", slotStatus, booking.id, t, slot.id),
    ...famStmts,
    cond(`INSERT INTO bookings (${cols.join(',')}) SELECT ${cols.map(() => '?').join(',')} WHERE ${won}`, ...vals, slot.id, booking.id),
    cond(`INSERT INTO booking_events (id, booking_id, at, actor, type, data) SELECT ?,?,?,?,?,? WHERE ${won}`,
      uid(), booking.id, t, actor, 'created', JSON.stringify({ status: booking.status, slot: slot.id }), slot.id, booking.id),
  ]);
  if (!res[0].meta.changes) throw new HttpError(409, 'Sorry — that opening was just taken. Please pick another time.');

  // Re-check against everything live now that we hold the slot (guards against
  // two different-but-conflicting slots being claimed at the same moment).
  // If two requests race, the booking created first keeps its slot.
  const slots = await daySlots(db, slot.date);
  const mine = slots.find((s) => s.id === slot.id);
  const blocks = await dayBlocks(db, slot.date);
  const created = {};
  for (const r of await all(db, 'SELECT id, created_at FROM bookings WHERE date = ?', slot.date)) created[r.id] = r.created_at;
  const olderThanMe = (s) => !s.booking_id || !created[s.booking_id] || (created[s.booking_id] + s.booking_id) < (created[booking.id] + booking.id);
  const clashes = hardConflictsFor(mine, slots.filter((s) => s.id !== slot.id && olderThanMe(s)), blocks, settings);
  if (clashes.length) {
    await db.batch([
      stmt(db, "UPDATE slots SET status = 'open', booking_id = NULL, updated_at = ? WHERE id = ? AND booking_id = ?", nowIso(), slot.id, booking.id),
      stmt(db, "UPDATE bookings SET status = 'expired', hold_expires_at = NULL, attention = NULL, updated_at = ? WHERE id = ?", nowIso(), booking.id),
      bookingEvent(db, booking.id, 'system', 'conflict_rollback', { clashes }),
    ]);
    throw new HttpError(409, 'Sorry — that time is no longer available. Please pick another time.');
  }
  await applyResolution(db, settings, mine, slots);
  return first(db, 'SELECT * FROM bookings WHERE id = ?', booking.id);
}

/** Bump/delete open slots that conflict with a newly live slot; remember the
    changes on the slot so they can be reverted if the booking goes away. */
export async function applyResolution(db, settings, liveSlot, slots) {
  const plan = planResolution(liveSlot, slots, settings);
  if (!plan.length) return [];
  const t = nowIso();
  const stmts = plan.map((p) => p.action === 'delete'
    ? stmt(db, "DELETE FROM slots WHERE id = ? AND status = 'open'", p.id)
    : stmt(db, "UPDATE slots SET time = ?, updated_at = ? WHERE id = ? AND status = 'open'", p.newTime, t, p.id));
  stmts.push(stmt(db, 'UPDATE slots SET bump_record = ? WHERE id = ?', JSON.stringify(plan), liveSlot.id));
  await db.batch(stmts);
  return plan;
}

/** Return a slot to open and undo conflict changes that are still safe to undo. */
export async function releaseSlot(db, settings, slotId, { reopen = true } = {}) {
  const slot = await first(db, 'SELECT * FROM slots WHERE id = ?', slotId);
  if (!slot) return;
  const t = nowIso();
  const plan = parseJson(slot.bump_record, []);
  const stmts = [];
  if (reopen) stmts.push(stmt(db, "UPDATE slots SET status = 'open', booking_id = NULL, bump_record = NULL, updated_at = ? WHERE id = ?", t, slotId));
  else stmts.push(stmt(db, 'DELETE FROM slots WHERE id = ?', slotId));
  for (const p of plan) {
    if (p.action === 'bump') stmts.push(stmt(db, "UPDATE slots SET time = ?, updated_at = ? WHERE id = ? AND status = 'open' AND time = ?", p.originalTime, t, p.id, p.newTime));
    else if (p.data) {
      const d = p.data;
      stmts.push(stmt(db, `INSERT OR IGNORE INTO slots (id, date, time, duration, loc_id, coach_id, status, contingent, contingent_on, series_id, series_detached, created_at, updated_at)
        SELECT ?,?,?,?,?,?,'open',?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM slots WHERE date = ? AND time = ? AND loc_id = ?)`,
        d.id, d.date, d.time, d.duration || 60, d.loc_id, d.coach_id || null, d.contingent || 0, d.contingent_on || null, d.series_id || null, d.series_detached || 0, d.created_at || t, t,
        d.date, d.time, d.loc_id));
    }
  }
  await db.batch(stmts);
}

export async function confirmBooking(env, db, settings, bookingId, actor, why) {
  const t = nowIso();
  const bk = await first(db, 'SELECT * FROM bookings WHERE id = ?', bookingId);
  if (!bk) return null;
  if (bk.status === 'confirmed' || bk.status === 'completed') return bk;
  const stmts = [
    stmt(db, "UPDATE bookings SET status = 'confirmed', hold_expires_at = NULL, updated_at = ? WHERE id = ?", t, bookingId),
    bookingEvent(db, bookingId, actor, 'confirmed', { reason: why }),
  ];
  if (bk.slot_id) stmts.push(stmt(db, "UPDATE slots SET status = 'booked', updated_at = ? WHERE id = ? AND booking_id = ?", t, bk.slot_id, bookingId));
  await db.batch(stmts);
  await markUsed(db, bk.slot_id, bookingId);
  const fresh = await first(db, 'SELECT * FROM bookings WHERE id = ?', bookingId);
  await notifyBooking(env, db, settings, fresh, 'confirmation', { dedupeKey: 'confirmation:' + bookingId + ':' + (fresh.date || '') + 'T' + (fresh.time || '') });
  return fresh;
}

/** Try to re-take the slot for a booking whose hold lapsed (late payment). */
export async function reclaimForLatePayment(env, db, settings, bk) {
  if (!bk.slot_id) return false;
  const slot = await first(db, 'SELECT * FROM slots WHERE id = ?', bk.slot_id);
  if (!slot || slot.status !== 'open') return false;
  const slots = await daySlots(db, slot.date);
  const blocks = await dayBlocks(db, slot.date);
  if (hardConflictsFor(slot, slots, blocks, settings).length) return false;
  const t = nowIso();
  const r = await run(db, "UPDATE slots SET status = 'booked', booking_id = ?, updated_at = ? WHERE id = ? AND status = 'open'", bk.id, t, slot.id);
  if (!r.meta.changes) return false;
  await run(db, "UPDATE bookings SET status = 'awaiting_payment', updated_at = ? WHERE id = ?", t, bk.id);
  await applyResolution(db, settings, { ...slot, status: 'booked', booking_id: bk.id }, await daySlots(db, slot.date));
  return true;
}

export async function expireHolds(env, db, settings) {
  const now = nowIso();
  const due = await all(db, "SELECT * FROM bookings WHERE status = 'awaiting_payment' AND hold_expires_at IS NOT NULL AND hold_expires_at < ? AND payment_status NOT IN ('paid','pending','package_credit','complimentary')", now);
  for (const bk of due) {
    const r = await run(db, "UPDATE bookings SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'awaiting_payment'", now, bk.id);
    if (!r.meta.changes) continue;
    if (bk.slot_id) await releaseSlot(db, settings, bk.slot_id);
    await bookingEvent(db, bk.id, 'system', 'hold_expired', { hold_expires_at: bk.hold_expires_at }).run();
  }
  return due.length;
}

/** Local-time helpers for booking windows. */
export function startInstant(bk, settings) {
  return bk.date && bk.time ? localToInstant(bk.date, bk.time, settings.timezone) : null;
}
export function localNow(settings) { return zoned(new Date(), settings.timezone); }

export function bookingToApi(b, user) {
  const out = {
    ...b,
    snapshot: parseJson(b.snapshot, {}),
    roster: parseJson(b.roster, []),
    request: parseJson(b.request, null),
    form: parseJson(b.form, {}),
    cancel_info: parseJson(b.cancel_info, null),
    legacy: !!b.legacy,
  };
  if (user && user.role !== 'director' && out.snapshot) out.snapshot = { ...out.snapshot, price_cents: undefined };
  return out;
}
