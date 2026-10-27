import { all, first, run, stmt, uid, nowIso, json, readJson, HttpError, assert, isIsoDate, isHm, audit, parseJson } from '../lib/util.js';
import { getSettings } from '../lib/settings.js';
import { addDays, dow, toMins, fromMins, zoned, localToInstant, daysBetween } from '../lib/time.js';
import { annotateConflicts, blockHits, hardConflictsFor, pairConflict, rangeTimes, slotInterval } from '../lib/schedule.js';
import { applyResolution, releaseSlot, daySlots } from '../lib/bookings.js';
import { reservedSlotIds, revokeForSlots, markUsed, toApi } from '../lib/reservations.js';

const MAX_GENERATE = 500;

function coachScope(user, requested) {
  if (user.role === 'director') return requested || null;
  return user.id;
}

export async function schedule(env, req, user, url) {
  const db = env.DB;
  const settings = await getSettings(db);
  const from = url.searchParams.get('from'), to = url.searchParams.get('to');
  assert(isIsoDate(from) && isIsoDate(to), 400, 'from/to dates required.');
  let slots = await all(db, `SELECT s.*, b.form AS b_form, b.status AS b_status, b.payment_status AS b_payment, b.snapshot AS b_snapshot, b.attention AS b_attention
    FROM slots s LEFT JOIN bookings b ON b.id = s.booking_id WHERE s.date >= ? AND s.date <= ? ORDER BY s.date, s.time`, from, to);
  const blocks = await all(db, 'SELECT * FROM blocks WHERE end_date >= ? AND date <= ? ORDER BY date', from, to);
  const series = await all(db, 'SELECT * FROM availability_series WHERE end_date >= ? AND start_date <= ?', from, to);
  // Requests and bookings without a slot still occupy coach time (approved requests carry a slot).
  const reservedMap = await reservedSlotIds(db, from, to);
  for (const s of slots) s.reserved = reservedMap.has(s.id) ? 1 : 0;
  const conflicts = annotateConflicts(slots, blocks, settings);
  if (user.role !== 'director') slots = slots.filter((s) => s.coach_id === user.id);
  return json({
    timezone: settings.timezone,
    today: zoned(new Date(), settings.timezone).date,
    slots: slots.map((s) => {
      const form = parseJson(s.b_form, null), snap = parseJson(s.b_snapshot, null);
      return {
        id: s.id, date: s.date, time: s.time, duration: s.duration, loc_id: s.loc_id, coach_id: s.coach_id, status: s.status,
        booking_id: s.booking_id, contingent: !!s.contingent, contingent_on: s.contingent_on, series_id: s.series_id, series_detached: !!s.series_detached,
        manual: s.status !== 'open' && !s.booking_id,
        booking: s.booking_id && form ? { athlete: form.athlete, parent: form.parent, status: s.b_status, payment_status: s.b_payment, service: snap && snap.service_name, attention: s.b_attention } : null,
        conflicts: conflicts[s.id] || [],
        reservation: reservedMap.has(s.id) ? toApi(reservedMap.get(s.id)) : null,
      };
    }),
    blocks: user.role === 'director' ? blocks : blocks.filter((b) => !b.coach_id || b.coach_id === user.id),
    series: series.map((x) => ({ ...x, weekdays: parseJson(x.weekdays, []) })),
  });
}

async function rangeSlots(db, from, to) {
  return all(db, 'SELECT * FROM slots WHERE date >= ? AND date <= ?', from, to);
}
async function rangeBlocks(db, from, to) {
  return all(db, 'SELECT * FROM blocks WHERE end_date >= ? AND date <= ?', from, to);
}

/** Decide, for each proposed opening, whether it can be created. */
function vet(proposed, existing, blocks, settings, today) {
  const create = [], skipped = [], warnings = [];
  const pool = existing.slice();
  for (const p of proposed) {
    if (p.date < today) { skipped.push({ ...p, reason: 'past' }); continue; }
    const same = pool.filter((s) => s.date === p.date && ((s.coach_id || null) === (p.coach_id || null) || !s.coach_id || !p.coach_id));
    if (same.some((s) => s.time === p.time && s.loc_id === p.loc_id)) { skipped.push({ ...p, reason: 'duplicate' }); continue; }
    const overlap = same.find((s) => { const c = pairConflict(p, s, settings); return c && c.kind === 'overlap'; });
    if (overlap) { skipped.push({ ...p, reason: 'overlap', with: overlap.id, withTime: overlap.time }); continue; }
    if (blockHits(p, blocks).length) { skipped.push({ ...p, reason: 'blocked' }); continue; }
    const hard = hardConflictsFor(p, same, [], settings);
    if (hard.length) { skipped.push({ ...p, reason: 'conflict', detail: hard[0].kind }); continue; }
    const soft = same.map((s) => ({ s, c: pairConflict(p, s, settings) })).filter((x) => x.c && x.c.kind !== 'b2b_ok');
    if (soft.length) warnings.push({ ...p, reason: soft[0].c.kind, withTime: soft[0].s.time });
    create.push(p);
    pool.push({ ...p, status: 'open' });
  }
  return { create, skipped, warnings };
}

async function insertSlots(db, rows) {
  const t = nowIso();
  const stmts = rows.map((p) => stmt(db, `INSERT INTO slots (id, date, time, duration, loc_id, coach_id, status, contingent, contingent_on, series_id, created_at, updated_at)
    VALUES (?,?,?,?,?,?,'open',?,?,?,?,?)`, p.id || 's' + uid(10), p.date, p.time, p.duration, p.loc_id, p.coach_id || null, p.contingent ? 1 : 0, p.contingent_on || null, p.series_id || null, t, t));
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));
}

async function requireLoc(db, id) {
  const loc = await first(db, 'SELECT * FROM locations WHERE id = ?', id);
  assert(loc && loc.active && !loc.archived_at, 400, 'Choose an active location.');
  return loc;
}

export async function createSlot(env, req, user) {
  const db = env.DB;
  const settings = await getSettings(db);
  const b = await readJson(req);
  assert(isIsoDate(b.date) && isHm(b.time), 400, 'Date and time are required.');
  await requireLoc(db, b.loc_id);
  const p = { date: b.date, time: b.time, duration: +b.duration || settings.defaultDuration, loc_id: b.loc_id, coach_id: coachScope(user, b.coach_id) };
  assert(toMins(p.time) + p.duration <= 1440, 400, 'Session would run past midnight.');
  const today = zoned(new Date(), settings.timezone).date;
  const r = vet([p], await daySlots(db, p.date), await rangeBlocks(db, p.date, p.date), settings, today);
  if (r.skipped.length) {
    const s = r.skipped[0];
    const msg = { past: 'That date has passed.', duplicate: 'An opening already exists at that time and location.', overlap: 'Overlaps the ' + (s.withTime || '') + ' opening.', blocked: 'That time is blocked off.', conflict: 'Conflicts with a booked session (' + s.detail + ').' }[s.reason];
    throw new HttpError(409, msg, { reason: s.reason });
  }
  await insertSlots(db, r.create);
  return json({ created: r.create.length, warnings: r.warnings }, 201);
}

/** Bulk creation. mode: range | copy_day | copy_week | series. dryRun previews. */
export async function generate(env, req, user) {
  const db = env.DB;
  const settings = await getSettings(db);
  const b = await readJson(req);
  const today = zoned(new Date(), settings.timezone).date;
  const coach = coachScope(user, b.coach_id);
  let proposed = [];
  let seriesRow = null;

  if (b.mode === 'range' || b.mode === 'series') {
    assert(isHm(b.start) && isHm(b.end) && toMins(b.end) > toMins(b.start), 400, 'Enter a start and end time.');
    const duration = +b.duration || settings.defaultDuration;
    const buffer = Math.max(0, +b.buffer || 0);
    assert(duration >= 15 && duration <= 480, 400, 'Session length must be 15–480 minutes.');
    await requireLoc(db, b.loc_id);
    const times = rangeTimes(b.start, b.end, duration, buffer);
    assert(times.length, 400, 'No sessions fit in that time range.');
    let dates = [];
    if (b.mode === 'range') {
      dates = (Array.isArray(b.dates) ? b.dates : [b.date]).filter(isIsoDate);
    } else {
      const wd = (b.weekdays || []).map(Number).filter((d) => d >= 0 && d <= 6);
      assert(wd.length, 400, 'Pick at least one weekday.');
      assert(isIsoDate(b.start_date) && isIsoDate(b.end_date) && b.end_date >= b.start_date, 400, 'Pick a start and end date.');
      assert(daysBetween(b.start_date, b.end_date) <= 366, 400, 'Recurring availability can span at most one year.');
      for (let d = b.start_date; d <= b.end_date; d = addDays(d, 1)) if (wd.includes(dow(d))) dates.push(d);
      seriesRow = { id: 'sr' + uid(10), weekdays: JSON.stringify(wd), start_time: b.start, end_time: b.end, duration, buffer, loc_id: b.loc_id, coach_id: coach, start_date: b.start_date, end_date: b.end_date };
    }
    assert(dates.length, 400, 'No dates selected.');
    for (const d of dates) for (const t of times) proposed.push({ date: d, time: t, duration, loc_id: b.loc_id, coach_id: coach, series_id: seriesRow ? seriesRow.id : null });
  } else if (b.mode === 'copy_day' || b.mode === 'copy_week') {
    const span = b.mode === 'copy_week' ? 7 : 1;
    assert(isIsoDate(b.from) && isIsoDate(b.to), 400, 'Pick what to copy from and to.');
    const offset = daysBetween(b.from, b.to);
    assert(offset !== 0, 400, 'Source and destination are the same.');
    const src = await rangeSlots(db, b.from, addDays(b.from, span - 1));
    for (const s of src) {
      if (s.contingent) continue;
      if (user.role !== 'director' && s.coach_id !== user.id) continue;
      if (b.loc_id && s.loc_id !== b.loc_id) continue;
      proposed.push({ date: addDays(s.date, offset), time: s.time, duration: s.duration, loc_id: s.loc_id, coach_id: s.coach_id });
    }
    assert(proposed.length, 400, 'Nothing to copy — the source has no openings.');
  } else throw new HttpError(400, 'Unknown mode.');

  assert(proposed.length <= MAX_GENERATE, 400, `That would create ${proposed.length} openings; the limit is ${MAX_GENERATE} at a time.`);
  const dates = proposed.map((p) => p.date).sort();
  const r = vet(proposed, await rangeSlots(db, dates[0], dates[dates.length - 1]), await rangeBlocks(db, dates[0], dates[dates.length - 1]), settings, today);
  if (b.dryRun) return json({ preview: true, ...r });
  if (seriesRow) {
    const t = nowIso();
    await run(db, `INSERT INTO availability_series (id, weekdays, start_time, end_time, duration, buffer, loc_id, coach_id, start_date, end_date, created_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, seriesRow.id, seriesRow.weekdays, seriesRow.start_time, seriesRow.end_time, seriesRow.duration, seriesRow.buffer,
      seriesRow.loc_id, seriesRow.coach_id, seriesRow.start_date, seriesRow.end_date, user.id, t, t);
  }
  await insertSlots(db, r.create);
  await audit(db, user.id, 'generate_slots', 'slots', seriesRow ? seriesRow.id : null, { mode: b.mode, created: r.create.length, skipped: r.skipped.length });
  return json({ created: r.create.length, skipped: r.skipped, warnings: r.warnings, series_id: seriesRow ? seriesRow.id : null }, 201);
}

async function loadSlotFor(db, user, id) {
  const s = await first(db, 'SELECT * FROM slots WHERE id = ?', id);
  assert(s, 404, 'Opening not found.');
  if (user.role !== 'director') assert(s.coach_id === user.id, 403, 'That opening belongs to another coach.');
  return s;
}

export async function updateSlot(env, req, user, id) {
  const db = env.DB;
  const settings = await getSettings(db);
  const s = await loadSlotFor(db, user, id);
  const b = await readJson(req);
  assert(s.status === 'open', 409, 'This time is booked. Reschedule the booking instead of moving the opening.');
  const next = {
    time: b.time ?? s.time, duration: +(b.duration ?? s.duration), loc_id: b.loc_id ?? s.loc_id,
    coach_id: user.role === 'director' ? (b.coach_id === undefined ? s.coach_id : b.coach_id || null) : s.coach_id,
  };
  assert(isHm(next.time) && next.duration >= 15 && toMins(next.time) + next.duration <= 1440, 400, 'Invalid time or length.');
  if (next.loc_id !== s.loc_id) await requireLoc(db, next.loc_id);
  const delta = toMins(next.time) - toMins(s.time);
  const targets = b.scope === 'future' && s.series_id
    ? await all(db, 'SELECT * FROM slots WHERE series_id = ? AND date >= ? AND series_detached = 0', s.series_id, s.date)
    : [s];
  const moved = [], kept = [];
  const t = nowIso();
  const stmts = [];
  for (const x of targets) {
    if (x.status !== 'open') { kept.push({ id: x.id, date: x.date, time: x.time }); continue; }
    const nt = fromMins(toMins(x.time) + delta);
    if (toMins(x.time) + delta < 0 || toMins(x.time) + delta + next.duration > 1440) { kept.push({ id: x.id, date: x.date, time: x.time, reason: 'out_of_day' }); continue; }
    const cand = { ...x, time: nt, duration: next.duration, loc_id: next.loc_id, coach_id: next.coach_id };
    const others = (await daySlots(db, x.date)).filter((o) => o.id !== x.id);
    if (hardConflictsFor(cand, others, await rangeBlocks(db, x.date, x.date), settings).length || others.some((o) => (pairConflict(cand, o, settings) || {}).kind === 'overlap')) {
      kept.push({ id: x.id, date: x.date, time: x.time, reason: 'conflict' }); continue;
    }
    stmts.push(stmt(db, 'UPDATE slots SET time = ?, duration = ?, loc_id = ?, coach_id = ?, series_detached = ?, updated_at = ? WHERE id = ? AND status = \'open\'',
      nt, next.duration, next.loc_id, next.coach_id, b.scope === 'future' ? x.series_detached : (x.series_id ? 1 : 0), t, x.id));
    moved.push(x.id);
  }
  if (stmts.length) await db.batch(stmts);
  if (b.scope === 'future' && s.series_id && moved.length) {
    await run(db, 'UPDATE availability_series SET start_time = ?, duration = ?, loc_id = ?, coach_id = ?, updated_at = ? WHERE id = ?',
      fromMins(toMins(s.time) + delta), next.duration, next.loc_id, next.coach_id, t, s.series_id);
  }
  return json({ updated: moved.length, kept });
}

export async function deleteSlot(env, req, user, id, url) {
  const db = env.DB;
  const s = await loadSlotFor(db, user, id);
  const scope = url.searchParams.get('scope');
  assert(s.status === 'open', 409, 'This time is booked. Cancel the booking first; openings with bookings are never deleted silently.');
  const targets = scope === 'future' && s.series_id
    ? await all(db, 'SELECT * FROM slots WHERE series_id = ? AND date >= ? AND series_detached = 0', s.series_id, s.date)
    : [s];
  const ids = targets.filter((x) => x.status === 'open').map((x) => x.id);
  const kept = targets.filter((x) => x.status !== 'open').map((x) => ({ id: x.id, date: x.date, time: x.time }));
  const stmts = [];
  for (const i of ids) {
    stmts.push(stmt(db, "DELETE FROM slots WHERE id = ? AND status = 'open'", i));
    stmts.push(stmt(db, "DELETE FROM slots WHERE contingent_on = ? AND status = 'open'", i));
  }
  await revokeForSlots(db, ids);
  if (scope === 'future' && s.series_id) stmts.push(stmt(db, 'UPDATE availability_series SET end_date = ?, updated_at = ? WHERE id = ?', addDays(s.date, -1), nowIso(), s.series_id));
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));
  return json({ deleted: ids.length, kept });
}

export async function addB2B(env, req, user, id) {
  const db = env.DB;
  const settings = await getSettings(db);
  const s = await loadSlotFor(db, user, id);
  const { dir } = await readJson(req);
  const start = dir === 'before' ? toMins(s.time) - s.duration : toMins(s.time) + s.duration;
  assert(start >= 0 && start + s.duration <= 1440, 400, 'No room in the day for that.');
  const p = { date: s.date, time: fromMins(start), duration: s.duration, loc_id: s.loc_id, coach_id: s.coach_id, contingent: true, contingent_on: s.id };
  const r = vet([p], await daySlots(db, s.date), await rangeBlocks(db, s.date, s.date), settings, zoned(new Date(), settings.timezone).date);
  if (r.skipped.length) throw new HttpError(409, r.skipped[0].reason === 'duplicate' ? 'An opening already exists at that time.' : 'That time is not free (' + r.skipped[0].reason + ').');
  await insertSlots(db, r.create);
  return json({ created: 1 }, 201);
}

/** Manual Mark Booked / Mark Open for time booked outside the website. */
export async function markSlot(env, req, user, id) {
  const db = env.DB;
  const settings = await getSettings(db);
  const s = await loadSlotFor(db, user, id);
  const { status } = await readJson(req);
  if (status === 'booked') {
    assert(s.status === 'open', 409, 'Already booked.');
    const others = await daySlots(db, s.date);
    const hard = hardConflictsFor(s, others, await rangeBlocks(db, s.date, s.date), settings);
    assert(!hard.length, 409, 'That would double-book: it conflicts with another booked session or blocked time.');
    const r = await run(db, "UPDATE slots SET status = 'booked', updated_at = ? WHERE id = ? AND status = 'open'", nowIso(), id);
    assert(r.meta.changes, 409, 'Opening changed; refresh and try again.');
    const plan = await applyResolution(db, settings, { ...s, status: 'booked' }, others);
    await markUsed(db, id, null);
    await audit(db, user.id, 'mark_booked', 'slot', id, { plan });
    return json({ ok: true, changes: plan });
  }
  assert(s.status === 'booked' && !s.booking_id, 409, 'This time has a booking. Open the booking to cancel it.');
  await releaseSlot(db, settings, id);
  await audit(db, user.id, 'mark_open', 'slot', id);
  return json({ ok: true });
}

export async function updateSeries(env, req, user, id) {
  const db = env.DB;
  const sr = await first(db, 'SELECT * FROM availability_series WHERE id = ?', id);
  assert(sr, 404, 'Series not found.');
  if (user.role !== 'director') assert(sr.coach_id === user.id, 403, 'Not your series.');
  const b = await readJson(req);
  const fromDate = b.from_date;
  assert(isIsoDate(fromDate), 400, 'from_date required.');
  const settings = await getSettings(db);
  const today = zoned(new Date(), settings.timezone).date;
  const effective = fromDate < today ? today : fromDate;
  // Remove this and future open, unmodified occurrences; bookings are untouched.
  const old = await all(db, 'SELECT * FROM slots WHERE series_id = ? AND date >= ? AND series_detached = 0', id, effective);
  const kept = old.filter((x) => x.status !== 'open').map((x) => ({ id: x.id, date: x.date, time: x.time }));
  const del = old.filter((x) => x.status === 'open').map((x) => stmt(db, "DELETE FROM slots WHERE id = ? AND status = 'open'", x.id));
  for (let i = 0; i < del.length; i += 50) await db.batch(del.slice(i, i + 50));
  await run(db, 'UPDATE availability_series SET end_date = ?, updated_at = ? WHERE id = ?', addDays(effective, -1), nowIso(), id);
  if (b.stop) {
    // End the series here (no replacement).
    return json({ removed: del.length, kept, series_id: null });
  }
  const genReq = new Request('http://x', { method: 'POST', body: JSON.stringify({
    mode: 'series', weekdays: b.weekdays || parseJson(sr.weekdays, []), start: b.start || sr.start_time, end: b.end_time || sr.end_time,
    duration: b.duration || sr.duration, buffer: b.buffer ?? sr.buffer, loc_id: b.loc_id || sr.loc_id, coach_id: b.coach_id ?? sr.coach_id,
    start_date: effective, end_date: b.end_date || sr.end_date,
  }) });
  const res = await generate(env, genReq, user);
  const body = await res.json();
  return json({ removed: del.length, kept, ...body });
}

export async function createBlock(env, req, user) {
  const db = env.DB;
  const settings = await getSettings(db);
  const b = await readJson(req);
  assert(isIsoDate(b.date), 400, 'Pick a date.');
  const endDate = isIsoDate(b.end_date) && b.end_date >= b.date ? b.end_date : b.date;
  assert(daysBetween(b.date, endDate) <= 180, 400, 'Blocks can span at most 180 days.');
  const allDay = !b.start_time;
  if (!allDay) assert(isHm(b.start_time) && isHm(b.end_time) && (endDate > b.date || toMins(b.end_time) > toMins(b.start_time)), 400, 'Enter a valid time range.');
  const block = { id: 'bl' + uid(10), coach_id: coachScope(user, b.coach_id), date: b.date, end_date: endDate, start_time: allDay ? null : b.start_time, end_time: allDay ? null : b.end_time,
    reason: ['practice', 'tournament', 'vacation', 'personal', 'other'].includes(b.reason) ? b.reason : 'other', note: (b.note || '').slice(0, 300) };
  const slots = await rangeSlots(db, block.date, block.end_date);
  const hits = slots.filter((s) => blockHits(s, [block]).length && (!block.coach_id || !s.coach_id || s.coach_id === block.coach_id));
  const open = hits.filter((s) => s.status === 'open'), live = hits.filter((s) => s.status !== 'open');
  const impact = { open: open.map((s) => ({ id: s.id, date: s.date, time: s.time, loc_id: s.loc_id })), booked: live.map((s) => ({ id: s.id, date: s.date, time: s.time, booking_id: s.booking_id })) };
  if (b.dryRun) return json({ preview: true, impact });
  const t = nowIso();
  const stmts = [stmt(db, 'INSERT INTO blocks (id, coach_id, date, end_date, start_time, end_time, reason, note, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    block.id, block.coach_id, block.date, block.end_date, block.start_time, block.end_time, block.reason, block.note, t)];
  if (b.removeOpen) for (const s of open) stmts.push(stmt(db, "DELETE FROM slots WHERE id = ? AND status = 'open'", s.id));
  await db.batch(stmts);
  await audit(db, user.id, 'create_block', 'block', block.id, { removedOpen: b.removeOpen ? open.length : 0 });
  return json({ block, impact, removedOpen: b.removeOpen ? open.length : 0 }, 201);
}

export async function deleteBlock(env, req, user, id) {
  const db = env.DB;
  const bl = await first(db, 'SELECT * FROM blocks WHERE id = ?', id);
  assert(bl, 404, 'Block not found.');
  if (user.role !== 'director') assert(bl.coach_id === user.id, 403, 'Not your block.');
  await run(db, 'DELETE FROM blocks WHERE id = ?', id);
  return json({ ok: true });
}
