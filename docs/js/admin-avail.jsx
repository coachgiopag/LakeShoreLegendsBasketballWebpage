/* global React, LSL */
/* Coach dashboard — Availability tab. */
(function () {
  const { useState, useEffect, useMemo } = React;
  const A = window.LSLA;
  const { Icon, Badge, Dialog, Field, Seg } = A;

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOWS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const REASONS = [['practice', 'Team practice'], ['tournament', 'Tournament'], ['vacation', 'Vacation'], ['personal', 'Personal'], ['other', 'Other']];
  const pad2 = (n) => String(n).padStart(2, '0');
  const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
  const dowOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
  const weekStart = (iso) => addDays(iso, -dowOf(iso));

  function describe(c, byId, app) {
    if (c.kind === 'blocked') return 'Inside blocked time (' + ((REASONS.find((r) => r[0] === c.reason) || [])[1] || c.reason) + ')';
    const o = byId[c.with];
    const other = o ? LSL.fmtTime(o.time) + ' · ' + app.locName(o.loc_id) : 'another session';
    if (c.kind === 'overlap') return 'Overlaps ' + other;
    if (c.kind === 'travel') return 'Only ' + Math.max(0, c.gap) + ' min to get to/from ' + other + ' (travel buffer ' + c.need + ' min)';
    if (c.kind === 'buffer') return 'Only ' + c.gap + ' min after/before ' + other + ' (same-location buffer ' + c.need + ' min)';
    return 'Conflicts with ' + other;
  }

  function AvailTab() {
    const app = A.useApp();
    const toast = A.useToast();
    const [confirmUi, confirm] = A.useConfirm();
    const [busy, run] = A.useAction();
    const today = app.today;
    const [ym, setYm] = useState(() => { const [y, m] = today.split('-').map(Number); return { y, m: m - 1 }; });
    const [sel, setSel] = useState(today);
    const [locF, setLocF] = useState('');
    const [coachF, setCoachF] = useState('');
    const [dialog, setDialog] = useState(null);
    const from = ym.y + '-' + pad2(ym.m + 1) + '-01';
    const to = ym.y + '-' + pad2(ym.m + 1) + '-' + pad2(new Date(ym.y, ym.m + 1, 0).getDate());
    const q = A.useFetch('/api/admin/schedule?from=' + from + '&to=' + to, [app.version]);
    const data = q.data;
    const activeLocs = app.locations.filter((l) => l.active && !l.archived_at);
    const multiCoach = app.coaches.filter((c) => c.active).length > 1 && app.isDirector;

    const slots = useMemo(() => (data ? data.slots : []).filter((s) => (!locF || s.loc_id === locF) && (!coachF || (s.coach_id || '') === coachF)), [data, locF, coachF]);
    const byId = useMemo(() => Object.fromEntries((data ? data.slots : []).map((s) => [s.id, s])), [data]);
    const byDate = useMemo(() => { const o = {}; slots.forEach((s) => (o[s.date] = o[s.date] || []).push(s)); return o; }, [slots]);
    const blocks = data ? data.blocks : [];
    const blocksOn = (iso) => blocks.filter((b) => b.date <= iso && b.end_date >= iso && (!coachF || !b.coach_id || b.coach_id === coachF));

    const refresh = () => { q.reload(); };
    const prev = () => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
    const next = () => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
    const goToday = () => { const [y, m] = today.split('-').map(Number); setYm({ y, m: m - 1 }); setSel(today); };

    const firstDow = new Date(ym.y, ym.m, 1).getDay();
    const days = new Date(ym.y, ym.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);

    const daySlots = (byDate[sel] || []).slice().sort((a, b) => a.time.localeCompare(b.time));
    const dayBlocks = blocksOn(sel);
    const open = daySlots.filter((s) => s.status === 'open' && !s.reservation);
    const reserved = daySlots.filter((s) => s.status === 'open' && s.reservation);
    const live = daySlots.filter((s) => s.status !== 'open');
    const hours = live.reduce((n, s) => n + (s.duration || 60), 0) / 60;
    const hardCount = daySlots.filter((s) => s.conflicts.some((c) => c.severity === 'hard')).length;
    const byLoc = {};
    daySlots.forEach((s) => (byLoc[s.loc_id] = byLoc[s.loc_id] || []).push(s));

    /* ---- actions ---- */
    const mark = (s, status) => run(() => A.api('POST', '/api/admin/slots/' + s.id + '/mark', { status }), (r) => status === 'booked'
      ? 'Marked booked' + (r.changes && r.changes.length ? ' — ' + r.changes.length + ' conflicting opening(s) adjusted' : '')
      : 'Opening is available again').then(refresh).catch(() => {});
    const addB2B = (s, dir, buffer) => run(() => A.api('POST', '/api/admin/slots/' + s.id + '/b2b', { dir, buffer: buffer || 0 }),
      buffer ? 'Back-to-back opening added with a ' + buffer + ' minute buffer' : 'Back-to-back opening added').then(refresh).catch(() => {});
    const remove = async (s) => {
      if (s.series_id && !s.series_detached) { setDialog({ kind: 'scope', slot: s, action: 'delete' }); return; }
      if (!(await confirm({ title: 'Delete this opening?', body: LSL.fmtDateLong(s.date) + ' at ' + LSL.fmtTime(s.time) + ' · ' + app.locName(s.loc_id), confirmLabel: 'Delete', danger: true }))) return;
      run(() => A.api('DELETE', '/api/admin/slots/' + s.id), 'Opening deleted').then(refresh).catch(() => {});
    };
    const delBlock = async (b) => {
      if (!(await confirm({ title: 'Remove this block?', body: 'Openings in this time become bookable again.', confirmLabel: 'Remove block' }))) return;
      run(() => A.api('DELETE', '/api/admin/blocks/' + b.id), 'Block removed').then(refresh).catch(() => {});
    };

    const dayLabel = (iso, ds, bl) => {
      const o = ds.filter((s) => s.status === 'open' && !s.reservation).length, b = ds.filter((s) => s.status !== 'open').length, rv = ds.filter((s) => s.status === 'open' && s.reservation).length;
      const c = ds.some((s) => s.conflicts.length);
      return [LSL.fmtDateLong(iso), o && o + ' open', rv && rv + ' reserved', b && b + ' booked', ds.some((s) => s.contingent) && 'back-to-back openings', c && 'has conflicts', bl.length && 'blocked time'].filter(Boolean).join(', ');
    };

    return (
      <div>
        {confirmUi}
        <div className="lsl-a-filters">
          <select className="lsl-select" value={locF} onChange={(e) => setLocF(e.target.value)} aria-label="Filter by location">
            <option value="">All locations</option>
            {app.locations.map((l) => <option key={l.id} value={l.id}>{l.name}{l.archived_at ? ' (archived)' : ''}</option>)}
          </select>
          {multiCoach && (
            <select className="lsl-select" value={coachF} onChange={(e) => setCoachF(e.target.value)} aria-label="Filter by coach">
              <option value="">All coaches</option>
              {app.coaches.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={goToday}><Icon name="calendar-check" /> Today</button>
        </div>
        <div className="lsl-admcal">
          <div className="lsl-admcal__left">
            <div className="lsl-admcal__head">
              <button className="lsl-admcal__navbtn" onClick={prev} aria-label="Previous month"><Icon name="chevron-left" size={15} /></button>
              <span className="lsl-admcal__monthlabel" aria-live="polite">{MONTHS[ym.m]} {ym.y}</span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button className="lsl-admcal__navbtn" onClick={refresh} aria-label="Refresh" title="Refresh" disabled={q.loading}>
                  <Icon name={q.loading ? 'loader-circle' : 'refresh-cw'} size={15} className={q.loading ? 'lsl-a-spin' : ''} />
                </button>
                <button className="lsl-admcal__navbtn" onClick={next} aria-label="Next month"><Icon name="chevron-right" size={15} /></button>
              </div>
            </div>
            <div className="lsl-admcal__dowrow" aria-hidden="true">{DOWS.map((d) => <span key={d}>{d}</span>)}</div>
            <div className="lsl-admcal__daygrid">
              {cells.map((day, i) => {
                if (!day) return <div key={'e' + i} />;
                const iso = ym.y + '-' + pad2(ym.m + 1) + '-' + pad2(day);
                const ds = byDate[iso] || [];
                const bl = blocksOn(iso);
                const hasOpen = ds.some((s) => s.status === 'open' && !s.contingent && !s.reservation);
                const hasReserved = ds.some((s) => s.status === 'open' && s.reservation);
                const hasBooked = ds.some((s) => s.status === 'booked');
                const hasHeld = ds.some((s) => s.status === 'held');
                const hasB2B = ds.some((s) => s.contingent);
                const hasConflict = ds.some((s) => s.conflicts.some((c) => c.kind !== 'blocked' || s.status !== 'open'));
                return (
                  <button key={day} aria-label={dayLabel(iso, ds, bl)} aria-pressed={iso === sel} title={bl.length ? 'Blocked: ' + bl.map((b) => b.reason).join(', ') : undefined}
                    className={['lsl-admcal__day', iso === today && 'is-today', iso === sel && 'is-sel', iso < today && 'is-past', bl.length && 'is-blocked'].filter(Boolean).join(' ')}
                    onClick={() => setSel(iso)}>
                    <span className="lsl-admcal__daynum">{day}</span>
                    <span className="lsl-admcal__dots" aria-hidden="true">
                      {hasOpen && <span className="lsl-admcal__dot lsl-admcal__dot--open" />}
                      {hasReserved && <span className="lsl-admcal__dot lsl-admcal__dot--reserved" />}
                      {hasHeld && <span className="lsl-admcal__dot lsl-admcal__dot--held" />}
                      {hasBooked && <span className="lsl-admcal__dot lsl-admcal__dot--booked" />}
                      {hasB2B && <span className="lsl-admcal__dot lsl-admcal__dot--b2b" />}
                      {hasConflict && <span className="lsl-admcal__dot lsl-admcal__dot--conflict" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="lsl-admcal__legend">
              <span><span className="lsl-admcal__dot lsl-admcal__dot--open" /> Open</span>
              <span><span className="lsl-admcal__dot lsl-admcal__dot--reserved" /> Reserved</span>
              <span><span className="lsl-admcal__dot lsl-admcal__dot--held" /> Held</span>
              <span><span className="lsl-admcal__dot lsl-admcal__dot--booked" /> Booked</span>
              <span><span className="lsl-admcal__dot lsl-admcal__dot--b2b" /> B2B</span>
              <span><span className="lsl-admcal__dot lsl-admcal__dot--conflict" /> Conflict</span>
              <span><span className="lsl-admcal__dot" style={{ background: 'repeating-linear-gradient(135deg,#aebfd3 0 2px,transparent 2px 4px)', width: 10, height: 8 }} /> Blocked</span>
            </div>
          </div>

          <div className="lsl-admcal__panel">
            <div className="lsl-admcal__panelhead">
              <h3 className="lsl-admcal__paneltitle">{LSL.fmtDateLong(sel)}</h3>
              <span className="lsl-a-muted lsl-a-small">{LSL.tzLabel(sel, '12:00')} · {app.settings.timezone.replace('_', ' ')}</span>
            </div>
            {q.error && <A.ErrorState error={q.error} onRetry={refresh} />}
            {q.loading && !data ? <A.Loading text="Loading schedule…" /> : (
              <>
                <div className="lsl-a-daysum" aria-label="Day summary">
                  <div className="lsl-a-stat"><b>{open.length}</b><span>Open</span></div>
                  {reserved.length > 0 && <div className="lsl-a-stat"><b>{reserved.length}</b><span>Reserved</span></div>}
                  <div className="lsl-a-stat"><b>{live.length}</b><span>Booked</span></div>
                  <div className="lsl-a-stat"><b>{hours % 1 ? hours.toFixed(1) : hours}</b><span>Training hrs</span></div>
                  {hardCount > 0 && <div className="lsl-a-stat is-alert"><b>{hardCount}</b><span>Double-booked</span></div>}
                </div>

                {dayBlocks.map((b) => (
                  <div key={b.id} className="lsl-a-block-row">
                    <Icon name="ban" />
                    <span><strong>{(REASONS.find((r) => r[0] === b.reason) || [])[1] || 'Blocked'}</strong> · {b.start_time ? LSL.fmtTime(b.start_time) + '–' + LSL.fmtTime(b.end_time) : 'All day'}
                      {b.end_date !== b.date ? ' · through ' + LSL.fmtDate(b.end_date) : ''}{b.note ? ' · ' + b.note : ''}{b.coach_id ? ' · ' + (app.coachName(b.coach_id) || '') : ''}</span>
                    <span className="lsl-a-spacer" />
                    <button className="lsl-admin__del" onClick={() => delBlock(b)} aria-label="Remove block"><Icon name="trash-2" /></button>
                  </div>
                ))}

                {daySlots.length === 0 && <p className="lsl-body lsl-body--sm" style={{ color: 'var(--fg3)', marginBottom: 16 }}>No openings on this day yet. Add one below, or use the tools to add many at once.</p>}

                {Object.entries(byLoc).map(([lid, ls]) => (
                  <div key={lid} className="lsl-admcal__locgroup">
                    <div className="lsl-admcal__locname"><Icon name="map-pin" size={12} /> {app.locName(lid)}</div>
                    {ls.map((s) => <SlotRow key={s.id} s={s} byId={byId} busy={busy} onMark={mark} onB2B={addB2B} onDelete={remove} onEdit={(x) => setDialog({ kind: 'edit', slot: x })} onReserve={(x) => setDialog({ kind: 'reserve', slot: x })} />)}
                  </div>
                ))}

                <AddOpening date={sel} locs={activeLocs} multiCoach={multiCoach} onDone={refresh} />

                <div className="lsl-a-toolbar" aria-label="Availability tools">
                  <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => setDialog({ kind: 'series' })}><Icon name="repeat" /> Recurring</button>
                  <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => setDialog({ kind: 'bulk' })}><Icon name="rows-3" /> Bulk add</button>
                  <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => setDialog({ kind: 'copy' })}><Icon name="copy" /> Copy day / week</button>
                  <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => setDialog({ kind: 'block' })}><Icon name="ban" /> Block time</button>
                </div>
              </>
            )}
          </div>
        </div>
        {dialog && dialog.kind === 'series' && <SeriesDialog date={sel} locs={activeLocs} series={data ? data.series : []} multiCoach={multiCoach} onClose={() => setDialog(null)} onDone={refresh} />}
        {dialog && dialog.kind === 'bulk' && <BulkDialog date={sel} locs={activeLocs} multiCoach={multiCoach} onClose={() => setDialog(null)} onDone={refresh} />}
        {dialog && dialog.kind === 'copy' && <CopyDialog date={sel} locs={activeLocs} onClose={() => setDialog(null)} onDone={refresh} />}
        {dialog && dialog.kind === 'block' && <BlockDialog date={sel} multiCoach={multiCoach} onClose={() => setDialog(null)} onDone={refresh} />}
        {dialog && dialog.kind === 'edit' && <EditSlotDialog slot={dialog.slot} locs={activeLocs} onClose={() => setDialog(null)} onDone={refresh} />}
        {dialog && dialog.kind === 'reserve' && <ReservationDialog slot={dialog.slot} onClose={() => setDialog(null)} onDone={refresh} />}
        {dialog && dialog.kind === 'scope' && <ScopeDeleteDialog slot={dialog.slot} onClose={() => setDialog(null)} onDone={refresh} />}
      </div>
    );
  }

  function SlotRow({ s, byId, busy, onMark, onB2B, onDelete, onEdit, onReserve }) {
    const app = A.useApp();
    const [pick, setPick] = useState(false);
    const [buffer, setBuffer] = useState(0);
    const hard = s.conflicts.filter((c) => c.severity === 'hard');
    const soft = s.conflicts.filter((c) => c.severity !== 'hard');
    const anchor = s.contingent_on ? byId[s.contingent_on] : null;
    const end = A.endTime(s.time, s.duration);
    const status = s.status === 'held'
      ? <Badge tone="warn" icon="hourglass">Held · awaiting payment</Badge>
      : s.status === 'booked' ? <Badge tone="orange" icon="calendar-check">{s.manual ? 'Booked (manual)' : 'Booked'}</Badge>
        : s.reservation ? <Badge tone="sky" icon="user-check" title={'Reserved for ' + s.reservation.client_name + ' until ' + A.stamp(s.reservation.expires_at)}>Reserved · {s.reservation.client_name}</Badge>
          : <Badge tone="outline" icon="circle">Open</Badge>;
    return (
      <div className={'lsl-admcal__slot' + (s.reservation ? ' is-reserved' : '') + (s.contingent ? ' is-b2b' : '') + (s.status === 'booked' ? ' is-booked' : '') + (s.status === 'held' ? ' is-held' : '') + (hard.length ? ' has-hard' : '')}>
        <div className="lsl-admcal__slotmain">
          <span className="lsl-admcal__slottime">{LSL.fmtTime(s.time)}</span>
          <span className="lsl-a-muted lsl-a-small">– {LSL.fmtTime(end)} · {s.duration} min</span>
          {status}
          {s.contingent && <Badge tone="sky" icon="repeat-2">B2B</Badge>}
          {s.series_id && <Badge tone="muted" icon="repeat" title={s.series_detached ? 'Edited separately from its series' : 'Part of a recurring series'}>{s.series_detached ? 'Edited' : 'Weekly'}</Badge>}
          {s.coach_id && app.coaches.length > 1 && <Badge tone="muted" icon="user">{app.coachName(s.coach_id)}</Badge>}
          {s.reservation && <span className="lsl-a-muted lsl-a-small">held until {A.stamp(s.reservation.expires_at)}</span>}
          {s.booking && (
            <button className="lsl-a-slotbooking" onClick={() => app.openBooking(s.booking_id)}>
              <Icon name="user" /> {s.booking.athlete} · {s.booking.service}
            </button>
          )}
          {s.booking && <A.StatusBadge kind="payment" value={s.booking.payment_status} />}
          {hard.map((c, i) => <span key={'h' + i} className="lsl-a-conflict is-hard"><Icon name="octagon-alert" size={13} /> Double-booked: {describe(c, byId, app)}</span>)}
          {soft.map((c, i) => <span key={'s' + i} className="lsl-a-conflict is-potential"><Icon name="triangle-alert" size={13} /> Potential conflict: {describe(c, byId, app)}. {s.status === 'open' ? 'If one is booked, the other is ' + (app.settings.conflictAction === 'delete' ? 'removed' : 'moved to a safe time') + '.' : ''}</span>)}
          {s.contingent && anchor && anchor.status === 'open' && <span className="lsl-admcal__slotlock"><Icon name="lock" size={11} /> Shown to families once {LSL.fmtTime(anchor.time)} is booked</span>}
        </div>
        <div className={'lsl-admcal__slotactions' + (pick ? ' is-picking' : '')}>
          {s.status === 'open' && <button className={'lsl-btn lsl-btn--xs ' + (s.reservation ? 'lsl-btn--primary' : 'lsl-btn--ghost')} disabled={busy} onClick={() => onReserve(s)} title="Hold this time for one client and get a private sign-up link"><Icon name="user-check" /> {s.reservation ? 'Manage reservation' : 'Reserve'}</button>}
          {s.status === 'open' && <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" disabled={busy} onClick={() => onMark(s, 'booked')} title="Booked outside the website">Mark booked</button>}
          {s.manual && <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" disabled={busy} onClick={() => onMark(s, 'open')}>Mark open</button>}
          {s.status === 'open' && (pick ? (
            <span className="lsl-admcal__b2bpick">
              <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => { setPick(false); onB2B(s, 'before', buffer); setBuffer(0); }}>← Before</button>
              <select className="lsl-select lsl-admcal__bufsel" value={buffer} onChange={(e) => setBuffer(+e.target.value)} aria-label="Add buffer time?">
                <option value={0}>Add buffer time?</option>
                {[15, 30, 45, 60, 75, 90].map((m) => <option key={m} value={m}>{m} min buffer</option>)}
              </select>
              <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => { setPick(false); onB2B(s, 'after', buffer); setBuffer(0); }}>After →</button>
              <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => { setPick(false); setBuffer(0); }}>Cancel</button>
            </span>
          ) : <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => setPick(true)}><Icon name="repeat-2" /> Add B2B</button>)}
          {s.status === 'open' && <button className="lsl-a-iconbtn" onClick={() => onEdit(s)} aria-label={'Edit ' + LSL.fmtTime(s.time) + ' opening'}><Icon name="pencil" /></button>}
          {s.status === 'open' && <button className="lsl-admin__del" onClick={() => onDelete(s)} aria-label={'Delete ' + LSL.fmtTime(s.time) + ' opening'}><Icon name="trash-2" /></button>}
        </div>
      </div>
    );
  }

  function CoachSelect({ value, onChange }) {
    const app = A.useApp();
    return (
      <Field label="Coach">
        <select className="lsl-select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Default coach</option>
          {app.coaches.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
    );
  }

  function AddOpening({ date, locs, multiCoach, onDone }) {
    const app = A.useApp();
    const [time, setTime] = useState('');
    const [dur, setDur] = useState(app.settings.defaultDuration);
    const [loc, setLoc] = useState(locs[0] ? locs[0].id : '');
    const [coach, setCoach] = useState('');
    const [err, setErr] = useState('');
    const [busy, run] = A.useAction();
    const add = () => {
      setErr('');
      if (!time) { setErr('Pick a start time.'); return; }
      run(() => A.api('POST', '/api/admin/slots', { date, time, duration: +dur, loc_id: loc, coach_id: coach || null }),
        (r) => r.warnings && r.warnings.length ? 'Added — note: tight timing with ' + LSL.fmtTime(r.warnings[0].withTime) : 'Opening added')
        .then(() => { setTime(''); onDone(); }).catch((e) => setErr(e.message));
    };
    if (date < app.today) return <p className="lsl-a-muted lsl-a-small" style={{ marginTop: 16 }}>This day has passed — openings can only be added to today or later.</p>;
    return (
      <div className="lsl-admcal__addrow">
        <span className="lsl-admcal__addlabel">Add opening</span>
        <div className="lsl-admcal__addinputs">
          <input className="lsl-input lsl-admcal__addinput" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Start time" />
          <select className="lsl-select lsl-admcal__addinput" value={dur} onChange={(e) => setDur(e.target.value)} aria-label="Length">
            {[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
          <select className="lsl-select lsl-admcal__addinput" value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Location">
            {locs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {multiCoach && (
            <select className="lsl-select lsl-admcal__addinput" value={coach} onChange={(e) => setCoach(e.target.value)} aria-label="Coach">
              <option value="">Default coach</option>
              {app.coaches.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={add} disabled={busy}><Icon name="plus" /> {busy ? 'Adding…' : 'Add'}</button>
        </div>
        {err && <span className="lsl-err" role="alert" style={{ width: '100%' }}>{err}</span>}
      </div>
    );
  }

  const SKIP_LABEL = { past: 'date has passed', duplicate: 'already exists', overlap: 'overlaps another opening', blocked: 'inside blocked time', conflict: 'conflicts with a booked session' };
  function Preview({ result }) {
    if (!result) return null;
    return (
      <div className="lsl-a-preview" aria-live="polite">
        <strong>{A.plural(result.create.length, 'opening')} will be created</strong>
        {result.skipped.length > 0 && <>, {result.skipped.length} skipped</>}
        {result.warnings.length > 0 && <>, {result.warnings.length} with tight timing</>}
        <ul className="lsl-a-list">
          {result.create.slice(0, 60).map((p, i) => <li key={'c' + i}><Icon name="plus" /> {LSL.fmtDate(p.date)} · {LSL.fmtTime(p.time)}</li>)}
          {result.skipped.map((p, i) => <li key={'s' + i} className="lsl-a-muted"><Icon name="minus" /> {LSL.fmtDate(p.date)} · {LSL.fmtTime(p.time)} — skipped: {SKIP_LABEL[p.reason] || p.reason}</li>)}
          {result.warnings.map((p, i) => <li key={'w' + i} style={{ color: '#8a5a00' }}><Icon name="triangle-alert" /> {LSL.fmtDate(p.date)} · {LSL.fmtTime(p.time)} — {p.reason === 'travel' ? 'short travel time' : 'tight'} vs {LSL.fmtTime(p.withTime)}</li>)}
        </ul>
      </div>
    );
  }

  /** Shared preview → confirm flow for bulk-style generators. */
  function useGenerator(onDone, onClose) {
    const toast = A.useToast();
    const [preview, setPreview] = useState(null);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const go = async (body, dry) => {
      setErr(''); setBusy(true);
      try {
        const r = await A.api('POST', '/api/admin/slots/generate', { ...body, dryRun: dry });
        if (dry) setPreview(r);
        else { toast(A.plural(r.created, 'opening') + ' created' + (r.skipped.length ? ', ' + r.skipped.length + ' skipped' : '')); onDone(); onClose(); }
      } catch (e) { setErr(e.message); setPreview(null); } finally { setBusy(false); }
    };
    return { preview, setPreview, err, busy, go };
  }

  function RangeFields({ v, set, locs, multiCoach }) {
    return (
      <div className="lsl-a-grid">
        <Field label="From"><input className="lsl-input" type="time" value={v.start} onChange={(e) => set({ ...v, start: e.target.value })} /></Field>
        <Field label="Until"><input className="lsl-input" type="time" value={v.end} onChange={(e) => set({ ...v, end: e.target.value })} /></Field>
        <Field label="Session length"><select className="lsl-select" value={v.duration} onChange={(e) => set({ ...v, duration: +e.target.value })}>{[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}</select></Field>
        <Field label="Break between" hint="Gap after each session"><select className="lsl-select" value={v.buffer} onChange={(e) => set({ ...v, buffer: +e.target.value })}>{[0, 5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}</select></Field>
        <Field label="Location"><select className="lsl-select" value={v.loc_id} onChange={(e) => set({ ...v, loc_id: e.target.value })}>{locs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
        {multiCoach && <CoachSelect value={v.coach_id} onChange={(c) => set({ ...v, coach_id: c })} />}
      </div>
    );
  }

  function BulkDialog({ date, locs, multiCoach, onClose, onDone }) {
    const app = A.useApp();
    const [v, setV] = useState({ start: '15:00', end: '19:00', duration: app.settings.defaultDuration, buffer: 0, loc_id: locs[0] && locs[0].id, coach_id: '' });
    const [dates, setDates] = useState(date);
    const g = useGenerator(onDone, onClose);
    const body = () => ({ mode: 'range', dates: dates.split(',').map((d) => d.trim()).filter(Boolean), ...v, coach_id: v.coach_id || null });
    return (
      <Dialog title="Bulk add openings" onClose={onClose} wide busy={g.busy}
        footer={<>
          <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={() => g.go(body(), true)} disabled={g.busy}>Preview</button>
          <button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={() => g.go(body(), false)} disabled={g.busy || !g.preview || !g.preview.create.length}>Create {g.preview ? A.plural(g.preview.create.length, 'opening') : ''}</button>
        </>}>
        <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>Fills a time range with back-to-back sessions. Existing openings, blocked time, and booked sessions are detected and skipped.</p>
        <Field label="Date"><input className="lsl-input" type="date" value={dates} min={app.today} onChange={(e) => { setDates(e.target.value); g.setPreview(null); }} /></Field>
        <RangeFields v={v} set={(x) => { setV(x); g.setPreview(null); }} locs={locs} multiCoach={multiCoach} />
        {g.err && <A.Banner tone="danger">{g.err}</A.Banner>}
        <Preview result={g.preview} />
      </Dialog>
    );
  }

  function SeriesDialog({ date, locs, series, multiCoach, onClose, onDone }) {
    const app = A.useApp();
    const toast = A.useToast();
    const [v, setV] = useState({ start: '16:00', end: '18:00', duration: app.settings.defaultDuration, buffer: 0, loc_id: locs[0] && locs[0].id, coach_id: '' });
    const [wd, setWd] = useState([dowOf(date)]);
    const [range, setRange] = useState({ start_date: date < app.today ? app.today : date, end_date: addDays(date < app.today ? app.today : date, 56) });
    const [editing, setEditing] = useState(null);
    const g = useGenerator(onDone, onClose);
    const body = () => ({ mode: 'series', weekdays: wd, ...v, ...range, coach_id: v.coach_id || null });
    const toggleWd = (d) => { setWd(wd.includes(d) ? wd.filter((x) => x !== d) : [...wd, d].sort()); g.setPreview(null); };
    const endSeries = async (sr) => {
      try {
        const r = await A.api('PATCH', '/api/admin/series/' + sr.id, { from_date: app.today > sr.start_date ? app.today : sr.start_date, stop: true });
        toast('Series ended — ' + A.plural(r.removed, 'future opening') + ' removed' + (r.kept.length ? ', ' + r.kept.length + ' booked kept' : ''));
        onDone(); onClose();
      } catch (e) { toast(e.message, 'err'); }
    };
    if (editing) return <SeriesEditDialog sr={editing} locs={locs} onClose={() => setEditing(null)} onDone={() => { onDone(); onClose(); }} />;
    return (
      <Dialog title="Recurring availability" onClose={onClose} wide busy={g.busy}
        footer={<>
          <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={() => g.go(body(), true)} disabled={g.busy}>Preview</button>
          <button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={() => g.go(body(), false)} disabled={g.busy || !g.preview || !g.preview.create.length}>Create {g.preview ? A.plural(g.preview.create.length, 'opening') : ''}</button>
        </>}>
        <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>Repeats weekly on the days you pick, at the same local time ({app.settings.timezone.replace('_', ' ')}) — including across daylight-saving changes.</p>
        <fieldset style={{ border: 0, padding: 0, margin: '0 0 14px' }}>
          <legend className="lsl-a-h4">Repeat on</legend>
          <div className="lsl-a-weekdays">
            {DOWS.map((d, i) => <label key={i}><input type="checkbox" checked={wd.includes(i)} onChange={() => toggleWd(i)} aria-label={DOW_LONG[i]} /><span>{d}</span></label>)}
          </div>
        </fieldset>
        <RangeFields v={v} set={(x) => { setV(x); g.setPreview(null); }} locs={locs} multiCoach={multiCoach} />
        <div className="lsl-a-grid" style={{ marginTop: 12 }}>
          <Field label="Starting"><input className="lsl-input" type="date" min={app.today} value={range.start_date} onChange={(e) => { setRange({ ...range, start_date: e.target.value }); g.setPreview(null); }} /></Field>
          <Field label="Ending" hint="Required — up to one year"><input className="lsl-input" type="date" min={range.start_date} value={range.end_date} onChange={(e) => { setRange({ ...range, end_date: e.target.value }); g.setPreview(null); }} /></Field>
        </div>
        {g.err && <A.Banner tone="danger">{g.err}</A.Banner>}
        <Preview result={g.preview} />
        {series.length > 0 && (
          <A.Expand title={'Series this month (' + series.length + ')'} icon="list">
            <ul className="lsl-a-list">
              {series.map((sr) => (
                <li key={sr.id}>
                  <span><strong>{sr.weekdays.map((d) => DOWS[d]).join(', ')}</strong> · {LSL.fmtTime(sr.start_time)}–{LSL.fmtTime(sr.end_time)} · {app.locName(sr.loc_id)} · {LSL.fmtDate(sr.start_date)} → {LSL.fmtDate(sr.end_date)}</span>
                  <span className="lsl-a-spacer" />
                  <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => setEditing(sr)}>Change this &amp; future</button>
                  <button className="lsl-btn lsl-btn--ghost lsl-btn--xs" onClick={() => endSeries(sr)}>End series</button>
                </li>
              ))}
            </ul>
          </A.Expand>
        )}
      </Dialog>
    );
  }

  function SeriesEditDialog({ sr, locs, onClose, onDone }) {
    const app = A.useApp();
    const toast = A.useToast();
    const [v, setV] = useState({ start: sr.start_time, end: sr.end_time, duration: sr.duration, buffer: sr.buffer, loc_id: sr.loc_id, coach_id: sr.coach_id || '' });
    const [wd, setWd] = useState(sr.weekdays);
    const [fromDate, setFromDate] = useState(app.today > sr.start_date ? app.today : sr.start_date);
    const [endDate, setEndDate] = useState(sr.end_date);
    const [busy, setBusy] = useState(false);
    const save = async () => {
      setBusy(true);
      try {
        const r = await A.api('PATCH', '/api/admin/series/' + sr.id, { from_date: fromDate, weekdays: wd, start: v.start, end_time: v.end, duration: v.duration, buffer: v.buffer, loc_id: v.loc_id, coach_id: v.coach_id || null, end_date: endDate });
        toast('Updated from ' + LSL.fmtDate(fromDate) + ': ' + A.plural(r.created || 0, 'opening') + ' created' + (r.kept.length ? '; ' + r.kept.length + ' booked session(s) left untouched' : ''));
        onDone();
      } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
    };
    return (
      <Dialog title="Change this & future occurrences" onClose={onClose} wide busy={busy}
        footer={<><button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={onClose}>Cancel</button><button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={save} disabled={busy}>Apply from {LSL.fmtDate(fromDate)}</button></>}>
        <A.Banner tone="info">Open, unedited occurrences from the chosen date are replaced. <strong>Booked sessions are never moved or canceled</strong> — they stay as they are.</A.Banner>
        <Field label="Apply starting"><input className="lsl-input" type="date" min={app.today} value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field>
        <div className="lsl-a-weekdays" style={{ marginBottom: 12 }}>
          {DOWS.map((d, i) => <label key={i}><input type="checkbox" checked={wd.includes(i)} onChange={() => setWd(wd.includes(i) ? wd.filter((x) => x !== i) : [...wd, i])} aria-label={DOW_LONG[i]} /><span>{d}</span></label>)}
        </div>
        <RangeFields v={v} set={setV} locs={locs} multiCoach={false} />
        <Field label="Series ends" className="" ><input className="lsl-input" type="date" value={endDate} min={fromDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
      </Dialog>
    );
  }

  function CopyDialog({ date, locs, onClose, onDone }) {
    const app = A.useApp();
    const [mode, setMode] = useState('copy_day');
    const [src, setSrc] = useState(date);
    const [dst, setDst] = useState(addDays(date, 7));
    const [loc, setLoc] = useState('');
    const g = useGenerator(onDone, onClose);
    const body = () => mode === 'copy_week'
      ? { mode, from: weekStart(src), to: weekStart(dst), loc_id: loc || null }
      : { mode, from: src, to: dst, loc_id: loc || null };
    return (
      <Dialog title="Copy availability" onClose={onClose} busy={g.busy}
        footer={<>
          <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={() => g.go(body(), true)} disabled={g.busy}>Preview</button>
          <button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={() => g.go(body(), false)} disabled={g.busy || !g.preview || !g.preview.create.length}>Copy {g.preview ? A.plural(g.preview.create.length, 'opening') : ''}</button>
        </>}>
        <Seg value={mode} onChange={(m) => { setMode(m); g.setPreview(null); }} label="Copy a day or a week" options={[['copy_day', 'A day'], ['copy_week', 'A week']]} />
        <div className="lsl-a-grid" style={{ marginTop: 14 }}>
          <Field label={mode === 'copy_week' ? 'Copy the week of' : 'Copy from'} hint={mode === 'copy_week' ? 'Week starting ' + LSL.fmtDate(weekStart(src)) : null}>
            <input className="lsl-input" type="date" value={src} onChange={(e) => { setSrc(e.target.value); g.setPreview(null); }} />
          </Field>
          <Field label={mode === 'copy_week' ? 'Into the week of' : 'Copy to'} hint={mode === 'copy_week' ? 'Week starting ' + LSL.fmtDate(weekStart(dst)) : null}>
            <input className="lsl-input" type="date" min={app.today} value={dst} onChange={(e) => { setDst(e.target.value); g.setPreview(null); }} />
          </Field>
          <Field label="Only this location"><select className="lsl-select" value={loc} onChange={(e) => { setLoc(e.target.value); g.setPreview(null); }}><option value="">All locations</option>{locs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
        </div>
        <p className="lsl-a-muted lsl-a-small">Copies opening times only — never bookings. Duplicates are detected and skipped.</p>
        {g.err && <A.Banner tone="danger">{g.err}</A.Banner>}
        <Preview result={g.preview} />
      </Dialog>
    );
  }

  function BlockDialog({ date, multiCoach, onClose, onDone }) {
    const app = A.useApp();
    const toast = A.useToast();
    const [v, setV] = useState({ date, end_date: date, allDay: true, start_time: '09:00', end_time: '12:00', reason: 'practice', note: '', coach_id: '' });
    const [impact, setImpact] = useState(null);
    const [removeOpen, setRemoveOpen] = useState(true);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const body = () => ({ date: v.date, end_date: v.end_date, start_time: v.allDay ? null : v.start_time, end_time: v.allDay ? null : v.end_time, reason: v.reason, note: v.note, coach_id: v.coach_id || null });
    const check = async () => {
      setErr(''); setBusy(true);
      try { setImpact((await A.api('POST', '/api/admin/blocks', { ...body(), dryRun: true })).impact); } catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    const save = async () => {
      setErr(''); setBusy(true);
      try {
        const r = await A.api('POST', '/api/admin/blocks', { ...body(), removeOpen });
        toast('Time blocked' + (r.removedOpen ? ' — ' + A.plural(r.removedOpen, 'opening') + ' removed' : ''));
        onDone(); onClose();
      } catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    const upd = (x) => { setV({ ...v, ...x }); setImpact(null); };
    return (
      <Dialog title="Block time" onClose={onClose} busy={busy}
        footer={<>
          <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={check} disabled={busy}>Check impact</button>
          <button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={save} disabled={busy || !impact}>Block time</button>
        </>}>
        <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>Families can't book blocked time, and new openings can't be added inside it.</p>
        <div className="lsl-a-grid">
          <Field label="Reason"><select className="lsl-select" value={v.reason} onChange={(e) => upd({ reason: e.target.value })}>{REASONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="From"><input className="lsl-input" type="date" value={v.date} onChange={(e) => upd({ date: e.target.value, end_date: e.target.value > v.end_date ? e.target.value : v.end_date })} /></Field>
          <Field label="Through"><input className="lsl-input" type="date" min={v.date} value={v.end_date} onChange={(e) => upd({ end_date: e.target.value })} /></Field>
          {multiCoach && <CoachSelect value={v.coach_id} onChange={(c) => upd({ coach_id: c })} />}
        </div>
        <label className="lsl-a-check" style={{ margin: '12px 0' }}><input type="checkbox" checked={v.allDay} onChange={(e) => upd({ allDay: e.target.checked })} /> All day</label>
        {!v.allDay && (
          <div className="lsl-a-grid">
            <Field label="Start"><input className="lsl-input" type="time" value={v.start_time} onChange={(e) => upd({ start_time: e.target.value })} /></Field>
            <Field label="End"><input className="lsl-input" type="time" value={v.end_time} onChange={(e) => upd({ end_time: e.target.value })} /></Field>
          </div>
        )}
        <Field label="Note (optional)"><input className="lsl-input" value={v.note} onChange={(e) => upd({ note: e.target.value })} placeholder="e.g. AAU tournament in Rockford" /></Field>
        {err && <A.Banner tone="danger">{err}</A.Banner>}
        {impact && (
          <div aria-live="polite">
            {impact.booked.length > 0 && <A.Banner tone="warn"><strong>{A.plural(impact.booked.length, 'booked session')}</strong> fall inside this block. They will <strong>not</strong> be moved or canceled — open each booking to reschedule if needed.
              <ul className="lsl-a-list">{impact.booked.map((b) => <li key={b.id}>{LSL.fmtDate(b.date)} · {LSL.fmtTime(b.time)}</li>)}</ul></A.Banner>}
            {impact.open.length > 0
              ? <label className="lsl-a-check"><input type="checkbox" checked={removeOpen} onChange={(e) => setRemoveOpen(e.target.checked)} /> Also delete the {A.plural(impact.open.length, 'open opening')} inside this block</label>
              : impact.booked.length === 0 && <A.Banner tone="ok">Nothing is scheduled in this time.</A.Banner>}
          </div>
        )}
      </Dialog>
    );
  }

  function EditSlotDialog({ slot, locs, onClose, onDone }) {
    const toast = A.useToast();
    const [v, setV] = useState({ time: slot.time, duration: slot.duration, loc_id: slot.loc_id });
    const [scope, setScope] = useState('one');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const inSeries = slot.series_id && !slot.series_detached;
    const save = async () => {
      setBusy(true); setErr('');
      try {
        const r = await A.api('PATCH', '/api/admin/slots/' + slot.id, { ...v, scope });
        toast(A.plural(r.updated, 'opening') + ' updated' + (r.kept.length ? '; ' + r.kept.length + ' left unchanged (booked or would conflict)' : ''));
        onDone(); onClose();
      } catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    return (
      <Dialog title={'Edit ' + LSL.fmtTime(slot.time) + ' opening'} onClose={onClose} busy={busy}
        footer={<><button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={onClose}>Cancel</button><button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={save} disabled={busy}>Save</button></>}>
        <div className="lsl-a-grid">
          <Field label="Start"><input className="lsl-input" type="time" value={v.time} onChange={(e) => setV({ ...v, time: e.target.value })} /></Field>
          <Field label="Length"><select className="lsl-select" value={v.duration} onChange={(e) => setV({ ...v, duration: +e.target.value })}>{[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}</select></Field>
          <Field label="Location"><select className="lsl-select" value={v.loc_id} onChange={(e) => setV({ ...v, loc_id: e.target.value })}>{locs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
        </div>
        {inSeries && (
          <fieldset style={{ border: 0, padding: 0, marginTop: 14 }}>
            <legend className="lsl-a-h4">This opening repeats weekly</legend>
            <label className="lsl-a-check" style={{ display: 'flex', marginBottom: 6 }}><input type="radio" name="scope" checked={scope === 'one'} onChange={() => setScope('one')} /> Only this occurrence</label>
            <label className="lsl-a-check" style={{ display: 'flex' }}><input type="radio" name="scope" checked={scope === 'future'} onChange={() => setScope('future')} /> This and future occurrences (booked ones stay as they are)</label>
          </fieldset>
        )}
        {err && <A.Banner tone="danger">{err}</A.Banner>}
      </Dialog>
    );
  }

  /* Reserve an opening for one named client, or manage an existing reservation.
     The sign-up link is shown once (only a hash is stored); "New link" replaces it. */
  const HOLD_CHOICES = [[24, '24 hours'], [48, '48 hours'], [72, '3 days'], [168, '7 days']];
  const reserveLink = (token) => location.origin + '/training.html?reserve=' + encodeURIComponent(token) + (window.LSL_API_NAME === 'staging' ? '&api=staging' : '');

  function ReservationDialog({ slot, onClose, onDone }) {
    const app = A.useApp();
    const toast = A.useToast();
    const [confirmUi, confirm] = A.useConfirm();
    const existing = slot.reservation;
    const types = app.types.filter((t) => t.active && !t.archived_at);
    const [v, setV] = useState({ name: existing ? existing.client_name : '', email: existing ? existing.client_email : '', note: existing ? existing.note : '', hours: existing ? 0 : 24 });
    const [ids, setIds] = useState(() => new Set(existing && existing.allowed_type_ids ? existing.allowed_type_ids : types.map((t) => t.id)));
    const [link, setLink] = useState(null);   // { url, expires } once a link exists to show
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const toggle = (id) => setIds((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const allowed = ids.size === types.length ? null : [...ids];
    const guard = async (fn) => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };

    const create = () => guard(async () => {
      if (!v.name.trim()) throw new Error('Enter the client\u2019s name.');
      if (!ids.size) throw new Error('Pick at least one session type.');
      const r = await A.api('POST', '/api/admin/reservations', { slot_id: slot.id, client_name: v.name, client_email: v.email, note: v.note, allowed_type_ids: allowed, expires_hours: +v.hours });
      setLink({ url: reserveLink(r.token), expires: r.reservation.expires_at });
      onDone();
    });
    const save = () => guard(async () => {
      if (!v.name.trim()) throw new Error('Enter the client\u2019s name.');
      if (!ids.size) throw new Error('Pick at least one session type.');
      await A.api('PATCH', '/api/admin/reservations/' + existing.id, { client_name: v.name, client_email: v.email, note: v.note, allowed_type_ids: allowed, ...(+v.hours ? { expires_hours: +v.hours } : {}) });
      toast('Reservation updated'); onDone(); onClose();
    });
    const newLink = async () => {
      if (!(await confirm({ title: 'Create a new link?', body: 'The old link stops working. Send the new one to ' + existing.client_name + '.', confirmLabel: 'Create new link' }))) return;
      guard(async () => {
        const r = await A.api('POST', '/api/admin/reservations/' + existing.id + '/regenerate');
        setLink({ url: reserveLink(r.token), expires: r.reservation.expires_at });
      });
    };
    const release = async () => {
      if (!(await confirm({ title: 'Release this time?', body: 'The link stops working and ' + LSL.fmtTime(slot.time) + ' goes back to being open to everyone.', confirmLabel: 'Release time', danger: true }))) return;
      guard(async () => { await A.api('POST', '/api/admin/reservations/' + existing.id + '/revoke'); toast('Time released'); onDone(); onClose(); });
    };

    const when = LSL.fmtDateLong(slot.date) + ' at ' + LSL.fmtTime(slot.time) + ' · ' + app.locName(slot.loc_id);
    if (link) {
      return (
        <Dialog title="Sign-up link ready" onClose={onClose}
          footer={<button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={onClose}>Done</button>}>
          {confirmUi}
          <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>Send this link to <strong>{v.name}</strong>. It opens the booking page with <strong>{when}</strong> ready to book. They pick a session type, fill in their details, and pay.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="lsl-input" readOnly value={link.url} onFocus={(e) => e.target.select()} aria-label="Sign-up link" data-autofocus />
            <button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={() => A.copy(link.url, toast)}><Icon name="copy" /> Copy</button>
          </div>
          <p className="lsl-a-muted lsl-a-small" style={{ marginBottom: 0 }}>The time is held for them until {A.stamp(link.expires)}, then opens to everyone. The link works for one booking. You can&rsquo;t view it again later, but Manage reservation &rarr; New link makes a fresh one.</p>
        </Dialog>
      );
    }
    return (
      <Dialog title={existing ? 'Reservation · ' + LSL.fmtTime(slot.time) : 'Reserve ' + LSL.fmtTime(slot.time) + ' for a client'} onClose={onClose} busy={busy}
        footer={<>
          {existing && <button className="lsl-btn lsl-btn--danger lsl-btn--sm" onClick={release} disabled={busy} style={{ marginRight: 'auto' }}>Release time</button>}
          {existing && <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={newLink} disabled={busy}><Icon name="link" /> New link</button>}
          <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={onClose}>Cancel</button>
          <button className="lsl-btn lsl-btn--primary lsl-btn--sm" onClick={existing ? save : create} disabled={busy}>{existing ? 'Save' : busy ? 'Creating…' : 'Create link'}</button>
        </>}>
        {confirmUi}
        <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>{when}. Families see this time marked <strong>Reserved</strong>; only the person with the link can book it.</p>
        <div className="lsl-a-grid">
          <Field label="Client name" required><input className="lsl-input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} data-autofocus /></Field>
          <Field label="Client email" hint="Optional. For your records; it isn't sent anything."><input className="lsl-input" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
          <Field label={existing ? 'Extend the hold' : 'Hold the time for'}>
            <select className="lsl-select" value={v.hours} onChange={(e) => setV({ ...v, hours: e.target.value })}>
              {existing && <option value={0}>Keep until {A.stamp(existing.expires_at)}</option>}
              {HOLD_CHOICES.map(([h, l]) => <option key={h} value={h}>{existing ? 'From now: ' : ''}{l}</option>)}
            </select>
          </Field>
        </div>
        <fieldset style={{ border: 0, padding: 0, marginTop: 14 }}>
          <legend className="lsl-a-h4">Session types they can choose</legend>
          {types.map((t) => <label key={t.id} className="lsl-a-check" style={{ display: 'flex', marginBottom: 6 }}><input type="checkbox" checked={ids.has(t.id)} onChange={() => toggle(t.id)} /> {t.name}</label>)}
        </fieldset>
        <Field label="Private note" hint="Only you see this."><textarea className="lsl-input" rows={2} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} /></Field>
        {err && <A.Banner tone="danger">{err}</A.Banner>}
      </Dialog>
    );
  }

  function ScopeDeleteDialog({ slot, onClose, onDone }) {
    const toast = A.useToast();
    const [busy, setBusy] = useState(false);
    const del = async (scope) => {
      setBusy(true);
      try {
        const r = await A.api('DELETE', '/api/admin/slots/' + slot.id + '?scope=' + scope);
        toast(A.plural(r.deleted, 'opening') + ' deleted' + (r.kept.length ? '; ' + r.kept.length + ' booked kept' : ''));
        onDone(); onClose();
      } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
    };
    return (
      <Dialog title="Delete a repeating opening" onClose={onClose} busy={busy}
        footer={<>
          <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={onClose}>Cancel</button>
          <button className="lsl-btn lsl-btn--ghost lsl-btn--sm" onClick={() => del('one')} disabled={busy}>Only this one</button>
          <button className="lsl-btn lsl-btn--danger lsl-btn--sm" onClick={() => del('future')} disabled={busy}>This &amp; future</button>
        </>}>
        <p className="lsl-body lsl-body--sm" style={{ marginTop: 0 }}>{LSL.fmtDateLong(slot.date)} at {LSL.fmtTime(slot.time)} is part of a weekly series. Booked sessions are never deleted.</p>
      </Dialog>
    );
  }

  A.tabs = A.tabs || {};
  A.tabs.AvailTab = AvailTab;
})();
