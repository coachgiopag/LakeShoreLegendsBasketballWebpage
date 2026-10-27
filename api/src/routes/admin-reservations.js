/* Coach dashboard: reserve an opening for a named client and hand them a private link. */
import { all, first, run, stmt, nowIso, json, readJson, HttpError, assert, audit, clean, normEmail, parseJson } from '../lib/util.js';
import { getSettings } from '../lib/settings.js';
import { localToInstant } from '../lib/time.js';
import { hardConflictsFor } from '../lib/schedule.js';
import { daySlots, dayBlocks } from '../lib/bookings.js';
import { hashToken, newToken, newReservationId, toApi } from '../lib/reservations.js';

const DEFAULT_HOURS = 24;
const MAX_HOURS = 24 * 14;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function loadReservation(db, user, id) {
  const r = await first(db, 'SELECT * FROM reservations WHERE id = ?', id);
  assert(r, 404, 'Reservation not found.');
  const slot = await first(db, 'SELECT * FROM slots WHERE id = ?', r.slot_id);
  if (user.role !== 'director') assert(slot && slot.coach_id === user.id, 403, 'That reservation belongs to another coach.');
  return { r, slot };
}

/** Expiry = now + hours, but never later than the session's start. */
function expiryFor(slot, hours, settings) {
  const h = Math.min(MAX_HOURS, Math.max(1, Math.round(+hours || DEFAULT_HOURS)));
  const start = localToInstant(slot.date, slot.time, settings.timezone).getTime();
  return new Date(Math.min(Date.now() + h * 3600000, start)).toISOString();
}

async function checkTypes(db, ids) {
  if (ids == null) return null;
  assert(Array.isArray(ids) && ids.length, 400, 'Pick at least one session type.');
  const active = await all(db, 'SELECT id FROM session_types WHERE active = 1 AND archived_at IS NULL');
  const ok = new Set(active.map((t) => t.id));
  const picked = ids.filter((id) => ok.has(id));
  assert(picked.length === ids.length, 400, 'One of those session types is not available.');
  // Every active type selected is the same as "any type"; store null so new types are included too.
  return picked.length === ok.size ? null : picked;
}

function checkClient(b, { partial = false } = {}) {
  const out = {};
  if (!partial || b.client_name !== undefined) {
    out.client_name = clean(b.client_name, 200);
    assert(out.client_name, 400, 'Enter the client’s name.');
  }
  if (!partial || b.client_email !== undefined) {
    out.client_email = clean(b.client_email, 200);
    assert(!out.client_email || EMAIL_RE.test(out.client_email), 400, 'Enter a valid email or leave it blank.');
  }
  if (!partial || b.note !== undefined) out.note = clean(b.note, 1000);
  return out;
}

export async function createReservation(env, req, user) {
  const db = env.DB;
  const settings = await getSettings(db);
  const b = await readJson(req);
  const slot = await first(db, 'SELECT * FROM slots WHERE id = ?', b.slot_id);
  assert(slot, 404, 'Opening not found.');
  if (user.role !== 'director') assert(slot.coach_id === user.id, 403, 'That opening belongs to another coach.');
  assert(slot.status === 'open', 409, 'This time is already booked or held.');
  assert(localToInstant(slot.date, slot.time, settings.timezone).getTime() > Date.now(), 409, 'That time has already passed.');
  const live = await first(db, "SELECT id FROM reservations WHERE slot_id = ? AND status = 'active' AND expires_at > ?", slot.id, nowIso());
  assert(!live, 409, 'This time is already reserved.');
  const c = checkClient(b);
  const types = await checkTypes(db, b.allowed_type_ids ?? null);
  const hard = hardConflictsFor(slot, (await daySlots(db, slot.date)).filter((s) => s.id !== slot.id), await dayBlocks(db, slot.date), settings);
  assert(!hard.length, 409, 'That time conflicts with a booked session or blocked time.');

  const id = newReservationId(), token = newToken(), t = nowIso();
  // Retire any lapsed row for this slot so the one-active-per-slot index never blocks a fresh reservation.
  await run(db, "UPDATE reservations SET status = 'revoked', updated_at = ? WHERE slot_id = ? AND status = 'active'", t, slot.id);
  await run(db, `INSERT INTO reservations (id, token_hash, slot_id, client_name, client_email, note, allowed_type_ids, status, expires_at, created_by, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?, 'active', ?, ?, ?, ?)`, id, await hashToken(token), slot.id, c.client_name, c.client_email || null, c.note || null,
    types ? JSON.stringify(types) : null, expiryFor(slot, b.expires_hours, settings), user.id, t, t);
  await audit(db, user.id, 'reservation_created', 'slot', slot.id, { reservation: id, client: c.client_name });
  const r = await first(db, 'SELECT * FROM reservations WHERE id = ?', id);
  return json({ reservation: toApi(r), token }, 201);
}

export async function updateReservation(env, req, user, id) {
  const db = env.DB;
  const settings = await getSettings(db);
  const { r, slot } = await loadReservation(db, user, id);
  assert(r.status === 'active', 409, 'This reservation is no longer active.');
  assert(slot, 409, 'The opening was removed.');
  const b = await readJson(req);
  const c = checkClient(b, { partial: true });
  const sets = [], args = [];
  for (const k of ['client_name', 'client_email', 'note']) if (k in c) { sets.push(k + ' = ?'); args.push(c[k] || null); }
  if (b.allowed_type_ids !== undefined) { const types = await checkTypes(db, b.allowed_type_ids); sets.push('allowed_type_ids = ?'); args.push(types ? JSON.stringify(types) : null); }
  if (b.expires_hours !== undefined) { sets.push('expires_at = ?'); args.push(expiryFor(slot, b.expires_hours, settings)); }
  if (sets.length) await run(db, `UPDATE reservations SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, ...args, nowIso(), id);
  await audit(db, user.id, 'reservation_updated', 'slot', r.slot_id, { reservation: id });
  return json({ reservation: toApi(await first(db, 'SELECT * FROM reservations WHERE id = ?', id)) });
}

/** The old link stops working; a new one is returned once. */
export async function regenerateReservation(env, req, user, id) {
  const db = env.DB;
  const { r } = await loadReservation(db, user, id);
  assert(r.status === 'active' && r.expires_at > nowIso(), 409, 'This reservation has expired. Create a new one or extend it first.');
  const token = newToken();
  await run(db, 'UPDATE reservations SET token_hash = ?, updated_at = ? WHERE id = ?', await hashToken(token), nowIso(), id);
  await audit(db, user.id, 'reservation_link_regenerated', 'slot', r.slot_id, { reservation: id });
  return json({ reservation: toApi(await first(db, 'SELECT * FROM reservations WHERE id = ?', id)), token });
}

export async function revokeReservation(env, req, user, id) {
  const db = env.DB;
  const { r } = await loadReservation(db, user, id);
  assert(r.status === 'active', 409, 'This reservation is no longer active.');
  await run(db, "UPDATE reservations SET status = 'revoked', updated_at = ? WHERE id = ?", nowIso(), id);
  await audit(db, user.id, 'reservation_revoked', 'slot', r.slot_id, { reservation: id });
  return json({ ok: true });
}
