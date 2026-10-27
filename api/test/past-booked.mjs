/* Past booked sessions on the public calendar. Local `wrangler dev` server, fake data only.
   Run: npm run dev (one terminal), then node test/past-booked.mjs */
import { execSync } from 'node:child_process';
import { zoned, addDays } from '../src/lib/time.js';

const API = process.env.API || 'http://localhost:8787';
const today = zoned(new Date(), 'America/Chicago').date;
const D = (n) => addDays(today, n);
let pass = 0, fail = 0; const out = [];
const ok = (c, name, extra) => { if (c) { pass++; out.push('  ✓ ' + name); } else { fail++; out.push('  ✗ ' + name + (extra ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); } };
function sql(command) {
  return JSON.parse(execSync(`npx wrangler d1 execute lsl-booking-dev --env dev --local --json --command "${command.replace(/"/g, '\\"')}"`, { cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'] }).toString())[0].results;
}
const settle = () => new Promise((r) => setTimeout(r, 2500));
const t = '2026-01-01T00:00:00.000Z';
const slot = (id, date, status, bk) => `INSERT INTO slots (id, date, time, duration, loc_id, status, booking_id, created_at, updated_at) VALUES ('${id}', '${date}', '15:45', 60, 'mun', '${status}', ${bk ? `'${bk}'` : 'NULL'}, '${t}', '${t}')`;
const booking = (id, status) => `INSERT INTO bookings (id, kind, status, snapshot, form, created_at, updated_at) VALUES ('${id}', 'dated', '${status}', '{}', '{"parent":"Secret Parent","athlete":"Secret Kid"}', '${t}', '${t}')`;

async function main() {
  sql("DELETE FROM slots WHERE id LIKE 'pb_%'; DELETE FROM bookings WHERE id LIKE 'pb_%'");
  sql([
    booking('pb_bk1', 'confirmed'), booking('pb_bk2', 'canceled'), booking('pb_bk3', 'completed'), booking('pb_bk4', 'awaiting_payment'),
    slot('pb_confirmed', D(-5), 'booked', 'pb_bk1'),
    slot('pb_manual', D(-6), 'booked', null),
    slot('pb_canceled', D(-7), 'booked', 'pb_bk2'),
    slot('pb_open', D(-8), 'open', null),
    slot('pb_old', D(-200), 'booked', 'pb_bk3'),
    slot('pb_held', D(-9), 'held', 'pb_bk4'),
    slot('pb_unpaid', D(-10), 'booked', 'pb_bk4'),
    slot('pb_future', D(-0 + 3), 'booked', 'pb_bk1'),
  ].join('; '));
  await settle();
  const cat = await (await fetch(API + '/api/public/catalog')).json();
  const by = Object.fromEntries(cat.slots.map((s) => [s.id, s]));
  ok(by.pb_confirmed && by.pb_confirmed.status === 'booked' && by.pb_confirmed.past === true, 'a past confirmed session is shown as booked', by.pb_confirmed);
  ok(by.pb_manual && by.pb_manual.past === true, 'a past time the coach marked booked by hand is shown');
  ok(!by.pb_canceled, 'a canceled booking is not shown');
  ok(!by.pb_open, 'a past opening nobody booked is not shown');
  ok(!by.pb_old, 'a session older than about three months is not shown');
  ok(!by.pb_held, 'a held checkout is not shown');
  ok(!by.pb_unpaid, 'an unpaid, never-confirmed booking is not shown');
  ok(by.pb_future && by.pb_future.past === undefined, 'upcoming sessions behave as before');
  ok(!JSON.stringify(cat).includes('Secret'), 'no family or athlete names are exposed');
  sql("DELETE FROM slots WHERE id LIKE 'pb_%'; DELETE FROM bookings WHERE id LIKE 'pb_%'");
  console.log(out.join('\n')); console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.log(out.join('\n')); console.error(e); process.exit(1); });
