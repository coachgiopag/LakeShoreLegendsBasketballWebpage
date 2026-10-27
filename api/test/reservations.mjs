/* Coach-reserved times: tests against a local `wrangler dev --env dev --local` server.
   Fake data only; nothing is sent to Stripe or to real families.
   Run: npm run migrate:local && npm run dev   (one terminal)
        node test/reservations.mjs             (another)
   Uses dates ~6 weeks out so it does not depend on what today is. */
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { zoned, addDays } from '../src/lib/time.js';

const API = process.env.API || 'http://localhost:8787';
const WHSEC = 'whsec_localtest123';
const SETUP = 'local-setup-token';
const TZ = 'America/Chicago';
const today = zoned(new Date(), TZ).date;
const D = (n) => addDays(today, n);

let pass = 0, fail = 0;
const out = [];
const ok = (c, name, extra) => { if (c) { pass++; out.push('  ✓ ' + name); } else { fail++; out.push('  ✗ ' + name + (extra ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); } };
const section = (n) => out.push('\n' + n);

let token = null;
async function call(method, path, body, tok = token) {
  const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
const get = (p, t) => call('GET', p, undefined, t);
const post = (p, b, t) => call('POST', p, b ?? {}, t);

const settle = () => new Promise((r) => setTimeout(r, 2500));   // local Worker restarts after a direct DB write
function sql(command) {
  const o = execSync(`npx wrangler d1 execute lsl-booking-dev --env dev --local --json --command "${command.replace(/"/g, '\\"')}"`, { cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(o)[0].results;
}
async function webhook(event) {
  const body = JSON.stringify(event), t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', WHSEC).update(t + '.' + body).digest('hex');
  const res = await fetch(API + '/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}`, 'Content-Type': 'application/json' }, body });
  return { status: res.status };
}
const paid = (id, ref) => ({ id: 'evt_' + crypto.randomUUID().slice(0, 8), type: 'checkout.session.completed',
  data: { object: { id, client_reference_id: ref, payment_status: 'paid', amount_total: 9000, currency: 'usd', payment_intent: 'pi_' + id } } });

const form = (n) => ({ parent: 'Rsv Parent ' + n, athlete: 'Rsv Athlete ' + n, email: `rsv${n}@example.test`, phone: '555-0100', age: '7th' });
const slotAt = async (date, time, loc) => {
  const r = await post('/api/admin/slots', { date, time, loc_id: loc });
  if (r.status !== 201) throw new Error('slot create failed ' + JSON.stringify(r));
  const sch = await get(`/api/admin/schedule?from=${date}&to=${date}`);
  return sch.data.slots.find((s) => s.time === time && s.loc_id === loc);
};
const catalogSlot = async (id) => (await get('/api/public/catalog', null)).data.slots.find((s) => s.id === id);

async function main() {
  // sign in (director may already exist from other test runs)
  let r = await post('/api/auth/setup', { setupToken: SETUP, email: 'dir@example.test', name: 'Test Director', password: 'correct horse battery' });
  if (r.status === 409) r = await post('/api/auth/login', { email: 'dir@example.test', password: 'correct horse battery' });
  token = r.data.token;
  if (!token) throw new Error('could not sign in: ' + JSON.stringify(r));
  const far = D(41);   // clear leftovers from earlier runs of this file
  sql(`DELETE FROM reservations; DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE date >= '${far}'); DELETE FROM booking_events WHERE booking_id IN (SELECT id FROM bookings WHERE date >= '${far}'); DELETE FROM bookings WHERE date >= '${far}'; DELETE FROM slots WHERE date >= '${far}'`);
  await settle();
  sql("UPDATE session_types SET pay_link = 'https://buy.stripe.com/test_fake' WHERE id IN ('p1','p2')");
  await settle();

  const d = D(42);
  const s1 = await slotAt(d, '16:00', 'pr');
  const s3 = await slotAt(d, '17:00', 'mun');   // conflicts with s1 by travel buffer once s1 is held

  section('Reserve an opening');
  r = await post('/api/admin/reservations', { slot_id: s1.id, client_name: '', allowed_type_ids: null });
  ok(r.status === 400, 'client name is required');
  r = await post('/api/admin/reservations', { slot_id: s1.id, client_name: 'Pat Client', client_email: 'not-an-email' });
  ok(r.status === 400, 'bad email rejected');
  r = await post('/api/admin/reservations', { slot_id: s1.id, client_name: 'Pat Client', client_email: 'pat@example.test', note: 'prefers 1-on-1', allowed_type_ids: ['p1', 'p2'] });
  ok(r.status === 201 && r.data.token && r.data.token.length >= 30, 'reservation created with a link token', r);
  const rv = r.data.reservation, tok = r.data.token;
  ok(rv.status === 'active' && rv.allowed_type_ids.join() === 'p1,p2', 'stores allowed types');
  const hrs = (new Date(rv.expires_at) - Date.now()) / 3600000;
  ok(hrs > 23 && hrs <= 24.01, 'default expiry is 24 hours', hrs);
  ok(!JSON.stringify(sql("SELECT token_hash FROM reservations")).includes(tok), 'token is stored hashed, not in plain text');
  r = await post('/api/admin/reservations', { slot_id: s1.id, client_name: 'Someone Else' });
  ok(r.status === 409, 'cannot reserve a time that is already reserved');

  section('Public calendar');
  let cs = await catalogSlot(s1.id);
  ok(cs && cs.status === 'reserved', 'reserved time shows on the calendar, marked reserved', cs);
  ok(!JSON.stringify(cs).includes('Pat'), 'calendar does not reveal the client');
  ok(!(await catalogSlot(s3.id)), 'a conflicting opening is hidden while the time is reserved');
  r = await post('/api/public/bookings', { typeId: 'p1', slotId: s1.id, form: form(1), acks: ['policy'], players: '1' }, null);
  ok(r.status === 409, 'normal booking of a reserved time is refused', r);

  section('Client link');
  r = await get('/api/public/reservations/not-a-real-token-at-all-xxxx', null);
  ok(r.status === 404, 'unknown link → 404');
  r = await get('/api/public/reservations/' + tok, null);
  ok(r.status === 200 && r.data.state === 'ok' && r.data.slot.id === s1.id, 'valid link shows the reserved time', r.data);
  ok(r.data.allowed_type_ids.join() === 'p1,p2' && r.data.client_name === 'Pat Client', 'link lists allowed types and client name');
  ok(!JSON.stringify(r.data).includes('pat@example.test') && !JSON.stringify(r.data).includes('prefers'), 'link does not reveal coach note or email');

  section('Book through the link');
  r = await post('/api/public/bookings', { typeId: 'p3', reserveToken: tok, form: form(2), acks: ['policy'], players: '3' }, null);
  ok(r.status === 400, 'type outside the allowed list is refused', r.data);
  r = await post('/api/public/bookings', { typeId: 'p1', reserveToken: 'wrong-token-wrong-token-xxxxx', form: form(2), acks: ['policy'], players: '1' }, null);
  ok(r.status === 404, 'wrong token is refused');
  r = await post('/api/public/bookings', { typeId: 'p1', reserveToken: tok, form: form(2), acks: ['policy'], players: '1' }, null);
  ok(r.status === 201 && r.data.checkoutUrl && r.data.next === 'pay', 'allowed type books the reserved time and goes to payment', r);
  const bkId = r.data.booking.id;
  cs = await catalogSlot(s1.id);
  ok(cs && cs.status === 'booked', 'time shows as booked while the checkout hold is active');
  r = await post('/api/public/bookings', { typeId: 'p1', reserveToken: tok, form: form(3), acks: ['policy'], players: '1' }, null);
  ok(r.status === 409, 'second person using the same link is refused', r.status);
  r = await webhook(paid('cs_rsv1', bkId));
  ok(r.status === 200, 'payment webhook accepted');
  const bk = await get('/api/admin/bookings/' + bkId);
  ok(bk.data.booking.status === 'confirmed' && bk.data.booking.payment_status === 'paid', 'booking confirmed + paid');
  ok(bk.data.events.some((e) => e.type === 'reservation_used'), 'booking history notes the reserved time');
  ok(sql(`SELECT status, booking_id FROM reservations WHERE id = '${rv.id}'`)[0].status === 'used', 'reservation closes once the booking is confirmed');
  r = await get('/api/public/reservations/' + tok, null);
  ok(r.data.state === 'used', 'link now says it was used');

  section('Expiry, revoke, regenerate');
  const s4 = await slotAt(D(43), '16:00', 'pr');
  r = await post('/api/admin/reservations', { slot_id: s4.id, client_name: 'Lee Client' });
  const rv4 = r.data.reservation, t4 = r.data.token;
  sql(`UPDATE reservations SET expires_at = '2020-01-01T00:00:00.000Z' WHERE id = '${rv4.id}'`);
  await settle();
  cs = await catalogSlot(s4.id);
  ok(cs && cs.status === 'open', 'an expired reservation reopens the time to the public');
  r = await get('/api/public/reservations/' + t4, null);
  ok(r.data.state === 'expired', 'expired link says so');
  r = await post('/api/public/bookings', { typeId: 'p1', reserveToken: t4, form: form(4), acks: ['policy'], players: '1' }, null);
  ok(r.status === 409, 'expired link cannot book');
  r = await post('/api/admin/reservations', { slot_id: s4.id, client_name: 'Lee Client Again', expires_hours: 2 });
  ok(r.status === 201, 'a fresh reservation can be made after one lapsed');
  const rv4b = r.data.reservation, t4b = r.data.token;
  r = await post(`/api/admin/reservations/${rv4b.id}/regenerate`);
  ok(r.status === 200 && r.data.token && r.data.token !== t4b, 'regenerate returns a new link');
  ok((await get('/api/public/reservations/' + t4b, null)).status === 404, 'old link stops working after regenerate');
  const t4c = r.data.token;
  ok((await get('/api/public/reservations/' + t4c, null)).data.state === 'ok', 'new link works');
  r = await post(`/api/admin/reservations/${rv4b.id}/revoke`);
  ok(r.status === 200, 'revoke');
  ok((await get('/api/public/reservations/' + t4c, null)).data.state === 'revoked', 'revoked link says so');
  cs = await catalogSlot(s4.id);
  ok(cs && cs.status === 'open', 'revoked time is open to the public again');

  section('Reserved times are protected');
  const s5 = await slotAt(D(44), '16:00', 'pr');
  const s6 = await slotAt(D(44), '17:00', 'mun');
  r = await post('/api/admin/reservations', { slot_id: s5.id, client_name: 'Kim Client' });
  const rv5 = r.data.reservation;
  r = await post(`/api/admin/slots/${s6.id}/mark`, { status: 'booked' });
  ok(r.status === 409, 'cannot mark a conflicting time booked over a reserved one', r.data);
  r = await post('/api/admin/slots', { date: D(44), time: '16:30', loc_id: 'pr' });
  ok(r.status === 409, 'cannot add an opening overlapping a reserved time', r.data);
  const sch = await get(`/api/admin/schedule?from=${D(44)}&to=${D(44)}`);
  const row = sch.data.slots.find((s) => s.id === s5.id);
  ok(row && row.reservation && row.reservation.client_name === 'Kim Client', 'dashboard schedule shows who it is reserved for');
  ok(!JSON.stringify(sch.data).includes('token'), 'schedule never returns link tokens');
  r = await call('DELETE', `/api/admin/slots/${s5.id}`);
  ok(r.status === 200, 'coach can delete a reserved opening');
  ok(sql(`SELECT status FROM reservations WHERE id = '${rv5.id}'`)[0].status === 'revoked', 'deleting the opening revokes its reservation');

  section('Rules for reserving');
  r = await post('/api/admin/reservations', { slot_id: 'nope', client_name: 'X' });
  ok(r.status === 404, 'unknown opening');
  r = await post('/api/admin/reservations', { slot_id: s1.id, client_name: 'X' });
  ok(r.status === 409, 'cannot reserve a booked time');
  r = await post('/api/admin/reservations', { slot_id: s6.id, client_name: 'X', allowed_type_ids: ['nope'] });
  ok(r.status === 400, 'unknown session type rejected');
  r = await post('/api/admin/reservations', { slot_id: s6.id, client_name: 'X' }, null);
  ok(r.status === 401, 'sign-in required');

  console.log(out.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.log(out.join('\n')); console.error(e); process.exit(1); });
