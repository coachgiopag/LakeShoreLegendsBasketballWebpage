/* Coach-reserved times.

   A reservation is "live" while status = 'active' and expires_at is in the
   future (expiry is checked at read time; no cron needed). The link token is a
   random bearer secret shown once; only its SHA-256 hash is stored. */
import { all, first, run, uid, nowIso, parseJson, HttpError } from './util.js';

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const hashToken = async (token) => hex(await crypto.subtle.digest('SHA-256', enc.encode(String(token))));

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
export const newReservationId = () => 'rv' + uid(10);

/** Live reservations on slots between two dates, keyed by slot id. */
export async function reservedSlotIds(db, from, to) {
  const rows = await all(db, `SELECT r.* FROM reservations r JOIN slots s ON s.id = r.slot_id
    WHERE r.status = 'active' AND r.expires_at > ? AND s.date >= ? AND s.date <= ?`, nowIso(), from, to);
  return new Map(rows.map((r) => [r.slot_id, r]));
}

/** Flag each slot row with .reserved (mutates and returns the rows). */
export async function flagReserved(db, slots, from, to) {
  if (!slots.length) return slots;
  const m = await reservedSlotIds(db, from, to);
  for (const s of slots) s.reserved = m.has(s.id) ? 1 : 0;
  return slots;
}

/** Look up a reservation from the link token. state: ok | expired | used | revoked. */
export async function loadByToken(db, token) {
  if (!TOKEN_RE.test(String(token || ''))) throw new HttpError(404, 'This reservation link is not valid.');
  const r = await first(db, 'SELECT * FROM reservations WHERE token_hash = ?', await hashToken(token));
  if (!r) throw new HttpError(404, 'This reservation link is not valid.');
  const state = r.status === 'active' ? (r.expires_at > nowIso() ? 'ok' : 'expired') : r.status;
  return { reservation: r, state };
}

/** A used reservation closes when the booking on its slot is confirmed. */
export async function markUsed(db, slotId, bookingId) {
  if (!slotId) return;
  await run(db, "UPDATE reservations SET status = 'used', booking_id = ?, updated_at = ? WHERE slot_id = ? AND status = 'active'", bookingId, nowIso(), slotId);
}

export async function revokeForSlots(db, slotIds) {
  for (const id of slotIds) await run(db, "UPDATE reservations SET status = 'revoked', updated_at = ? WHERE slot_id = ? AND status = 'active'", nowIso(), id);
}

export const toApi = (r) => ({
  id: r.id, slot_id: r.slot_id, client_name: r.client_name, client_email: r.client_email || '', note: r.note || '',
  allowed_type_ids: parseJson(r.allowed_type_ids, null), status: r.status, expires_at: r.expires_at, booking_id: r.booking_id || null,
});
