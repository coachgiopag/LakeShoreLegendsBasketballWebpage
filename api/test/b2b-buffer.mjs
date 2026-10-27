/* Back-to-back with an optional buffer. Local `wrangler dev` server, fake data only.
   Run: npm run dev (one terminal), then node test/b2b-buffer.mjs */
import { zoned, addDays } from '../src/lib/time.js';
const API = process.env.API || 'http://localhost:8787';
const today = zoned(new Date(), 'America/Chicago').date;
const D = (n) => addDays(today, n);
let pass = 0, fail = 0; const out = [];
const ok = (c, name, extra) => { if (c) { pass++; out.push('  ✓ ' + name); } else { fail++; out.push('  ✗ ' + name + (extra ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); } };
let token = null;
const call = async (method, path, body) => { const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, data: await r.json().catch(() => null) }; };
const day = async (date) => (await call('GET', `/api/admin/schedule?from=${date}&to=${date}`)).data.slots.map((s) => s.time).sort();
const mk = async (date, time) => { await call('POST', '/api/admin/slots', { date, time, loc_id: 'pr' }); return (await call('GET', `/api/admin/schedule?from=${date}&to=${date}`)).data.slots.find((s) => s.time === time); };

async function main() {
  let r = await call('POST', '/api/auth/login', { email: 'dir@example.test', password: 'correct horse battery' });
  token = r.data.token;
  const base = 95 + Math.floor(Math.random() * 100);   // fresh far-future days each run

  let a = await mk(D(base), '10:00');
  r = await call('POST', `/api/admin/slots/${a.id}/b2b`, { dir: 'after', buffer: 30 });
  ok(r.status === 201, 'after, 30 min buffer is created', r);
  ok((await day(D(base))).join() === '10:00,11:30', 'new time is the end of the session plus 30 minutes (11:30)', await day(D(base)));
  const sch = (await call('GET', `/api/admin/schedule?from=${D(base)}&to=${D(base)}`)).data.slots.find((s) => s.time === '11:30');
  ok(sch.contingent && sch.contingent_on === a.id, 'it is still a back-to-back opening tied to the first one');
  r = await call('POST', `/api/admin/slots/${a.id}/b2b`, { dir: 'before', buffer: 45 });
  ok(r.status === 201 && (await day(D(base))).join() === '08:15,10:00,11:30', 'before, 45 min buffer lands at 08:15 (10:00 − 60 − 45)', await day(D(base)));

  let b = await mk(D(base + 1), '10:00');
  r = await call('POST', `/api/admin/slots/${b.id}/b2b`, { dir: 'after' });
  ok(r.status === 201 && (await day(D(base + 1))).join() === '10:00,11:00', 'no buffer behaves as before (11:00)');
  r = await call('POST', `/api/admin/slots/${b.id}/b2b`, { dir: 'before', buffer: 0 });
  ok(r.status === 201 && (await day(D(base + 1))).join() === '09:00,10:00,11:00', 'buffer 0 is the same as none (09:00)');
  r = await call('POST', `/api/admin/slots/${b.id}/b2b`, { dir: 'after', buffer: '' });
  ok(r.status === 409, 'repeating the same time is refused as a duplicate', r.status);

  let c = await mk(D(base + 2), '10:00');
  for (const bad of [20, 100, -15, 'abc', 7.5]) {
    r = await call('POST', `/api/admin/slots/${c.id}/b2b`, { dir: 'after', buffer: bad });
    ok(r.status === 400, 'buffer ' + JSON.stringify(bad) + ' is rejected', r.data);
  }
  r = await call('POST', `/api/admin/slots/${c.id}/b2b`, { buffer: 15 });
  ok(r.status === 400, 'direction is required');
  ok((await day(D(base + 2))).join() === '10:00', 'rejected requests create nothing');
  for (const m of [15, 30, 45, 60, 75, 90]) {
    const x = await mk(D(base + 3 + m), '10:00');
    r = await call('POST', `/api/admin/slots/${x.id}/b2b`, { dir: 'after', buffer: m });
    ok(r.status === 201, m + ' minute buffer is accepted');
  }

  let late = await mk(D(base + 4), '22:30');
  r = await call('POST', `/api/admin/slots/${late.id}/b2b`, { dir: 'after', buffer: 15 });
  ok(r.status === 400, 'no room after a late session once the buffer is added');
  let early = await mk(D(base + 5), '00:30');
  r = await call('POST', `/api/admin/slots/${early.id}/b2b`, { dir: 'before', buffer: 30 });
  ok(r.status === 400, 'no room before an early session once the buffer is added');

  console.log(out.join('\n')); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.log(out.join('\n')); console.error(e); process.exit(1); });
