/* Scheduling rules: conflict detection between slots, bookings, and blocks.

   Two items for the same coach conflict when the gap between them is smaller
   than required:
     - same location:      gap >= sameLocationBuffer (0 = true back-to-back is fine)
     - different locations: gap >= configured travel buffer for that pair
   Negative gap = overlap. Blocks conflict with anything they overlap.
   Coach ids of null mean "the default coach", so single-coach programs work. */
import { toMins, fromMins } from './time.js';
import { travelMinutes } from './settings.js';

const sameCoach = (a, b) => (a.coach_id || null) === (b.coach_id || null) || !a.coach_id || !b.coach_id;

export function slotInterval(s) {
  const start = toMins(s.time);
  return { start, end: start + (s.duration || 60) };
}

/** Describe the relationship between two slots on the same date. */
export function pairConflict(a, b, settings) {
  if (a.date !== b.date || a.id === b.id || !sameCoach(a, b)) return null;
  const ia = slotInterval(a), ib = slotInterval(b);
  const [first, second] = ia.start <= ib.start ? [ia, ib] : [ib, ia];
  const gap = second.start - first.end;
  const need = travelMinutes(settings, a.loc_id, b.loc_id);
  const sameLoc = a.loc_id === b.loc_id;
  if (gap < 0) return { kind: 'overlap', gap, need, sameLoc };
  if (gap < need) return { kind: sameLoc ? 'buffer' : 'travel', gap, need, sameLoc };
  if (sameLoc && gap === 0) return { kind: 'b2b_ok', gap, need, sameLoc };
  return null;
}

export function blockHits(slot, blocks) {
  const iv = slotInterval(slot);
  return blocks.filter((b) => {
    if (b.coach_id && slot.coach_id && b.coach_id !== slot.coach_id) return false;
    if (slot.date < b.date || slot.date > b.end_date) return false;
    if (!b.start_time) return true;
    const bs = slot.date === b.date ? toMins(b.start_time) : 0;
    const be = slot.date === b.end_date ? toMins(b.end_time) : 1440;
    return iv.start < be && bs < iv.end;
  });
}

// A coach-reserved opening (s.reserved) holds its time like a booking does.
const live = (s) => s.status === 'held' || s.status === 'booked' || !!s.reserved;

/** Annotate each slot with conflicts. severity 'hard' = two live (held/booked)
    items collide; 'potential' = at least one side is still just an opening. */
export function annotateConflicts(slots, blocks, settings) {
  const byDate = {};
  for (const s of slots) (byDate[s.date] = byDate[s.date] || []).push(s);
  const out = {};
  for (const ds of Object.values(byDate)) {
    for (let i = 0; i < ds.length; i++) {
      for (let j = i + 1; j < ds.length; j++) {
        const c = pairConflict(ds[i], ds[j], settings);
        if (!c || c.kind === 'b2b_ok') continue;
        const severity = live(ds[i]) && live(ds[j]) ? 'hard' : 'potential';
        (out[ds[i].id] = out[ds[i].id] || []).push({ with: ds[j].id, ...c, severity });
        (out[ds[j].id] = out[ds[j].id] || []).push({ with: ds[i].id, ...c, severity });
      }
    }
  }
  for (const s of slots) {
    for (const b of blockHits(s, blocks)) {
      (out[s.id] = out[s.id] || []).push({ kind: 'blocked', block: b.id, reason: b.reason, severity: live(s) ? 'hard' : 'potential' });
    }
  }
  return out;
}

/** Hard conflicts a candidate would have against live slots and blocks. */
export function hardConflictsFor(candidate, slots, blocks, settings) {
  const res = [];
  for (const s of slots) {
    if (s.id === candidate.id || !live(s)) continue;
    const c = pairConflict(candidate, s, settings);
    if (c && c.kind !== 'b2b_ok') res.push({ with: s.id, ...c });
  }
  for (const b of blockHits(candidate, blocks)) res.push({ kind: 'blocked', block: b.id, reason: b.reason });
  return res;
}

/** When `booked` becomes live, decide what happens to open slots that now
    conflict with it: bump to the nearest safe time or delete (settings).
    B2B children follow their anchor. Returns [{id, action, newTime?, originalTime}]. */
export function planResolution(booked, slots, settings) {
  const changes = {};
  const others = slots.filter((s) => s.id !== booked.id && s.status === 'open' && !s.reserved && s.date === booked.date && sameCoach(s, booked));
  const bi = slotInterval(booked);
  for (const s of others) {
    const c = pairConflict(booked, s, settings);
    if (!c || c.kind === 'b2b_ok') continue;
    if (settings.conflictAction === 'delete') { changes[s.id] = { action: 'delete' }; continue; }
    const si = slotInterval(s);
    const need = travelMinutes(settings, booked.loc_id, s.loc_id);
    const newStart = si.start >= bi.start ? bi.end + need : bi.start - need - (s.duration || 60);
    if (newStart < 0 || newStart + (s.duration || 60) > 1440) { changes[s.id] = { action: 'delete' }; continue; }
    changes[s.id] = { action: 'bump', newStart, delta: newStart - si.start };
  }
  for (const s of others) {
    if (!s.contingent_on || !changes[s.contingent_on] || changes[s.id]) continue;
    const pc = changes[s.contingent_on];
    if (pc.action === 'delete') { changes[s.id] = { action: 'delete' }; continue; }
    const ns = toMins(s.time) + pc.delta;
    changes[s.id] = ns < 0 || ns + (s.duration || 60) > 1440 ? { action: 'delete' } : { action: 'bump', newStart: ns, delta: pc.delta };
  }
  // A bumped slot must not land on another conflict; drop it instead.
  const result = [];
  for (const s of others) {
    const ch = changes[s.id];
    if (!ch) continue;
    if (ch.action === 'bump') {
      const moved = { ...s, time: fromMins(ch.newStart) };
      const bad = (o) => { const c = pairConflict(moved, o, settings); return !!c && c.kind !== 'b2b_ok'; };
      const stillBad = bad(booked) || slots.some((o) => o.id !== s.id && o.id !== booked.id && live(o) && bad(o));
      if (stillBad) { result.push({ id: s.id, action: 'delete', originalTime: s.time, data: s }); continue; }
      result.push({ id: s.id, action: 'bump', newTime: moved.time, originalTime: s.time });
    } else result.push({ id: s.id, action: 'delete', originalTime: s.time, data: s });
  }
  return result;
}

/** Times for a range split into sessions of `duration` separated by `buffer`. */
export function rangeTimes(start, end, duration, buffer) {
  const out = [];
  const e = toMins(end);
  for (let t = toMins(start); t + duration <= e; t += duration + buffer) out.push(fromMins(t));
  return out;
}
