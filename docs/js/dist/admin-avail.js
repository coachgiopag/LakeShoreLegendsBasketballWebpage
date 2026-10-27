function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* global React, LSL */
/* Coach dashboard — Availability tab. */
(function () {
  var _React = React,
    useState = _React.useState,
    useEffect = _React.useEffect,
    useMemo = _React.useMemo;
  var A = window.LSLA;
  var Icon = A.Icon,
    Badge = A.Badge,
    Dialog = A.Dialog,
    Field = A.Field,
    Seg = A.Seg;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DOWS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var REASONS = [['practice', 'Team practice'], ['tournament', 'Tournament'], ['vacation', 'Vacation'], ['personal', 'Personal'], ['other', 'Other']];
  var pad2 = n => String(n).padStart(2, '0');
  var addDays = (iso, n) => {
    var _iso$split$map = iso.split('-').map(Number),
      _iso$split$map2 = _slicedToArray(_iso$split$map, 3),
      y = _iso$split$map2[0],
      m = _iso$split$map2[1],
      d = _iso$split$map2[2];
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  };
  var dowOf = iso => {
    var _iso$split$map3 = iso.split('-').map(Number),
      _iso$split$map4 = _slicedToArray(_iso$split$map3, 3),
      y = _iso$split$map4[0],
      m = _iso$split$map4[1],
      d = _iso$split$map4[2];
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  };
  var weekStart = iso => addDays(iso, -dowOf(iso));
  function describe(c, byId, app) {
    if (c.kind === 'blocked') return 'Inside blocked time (' + ((REASONS.find(r => r[0] === c.reason) || [])[1] || c.reason) + ')';
    var o = byId[c.with];
    var other = o ? LSL.fmtTime(o.time) + ' · ' + app.locName(o.loc_id) : 'another session';
    if (c.kind === 'overlap') return 'Overlaps ' + other;
    if (c.kind === 'travel') return 'Only ' + Math.max(0, c.gap) + ' min to get to/from ' + other + ' (travel buffer ' + c.need + ' min)';
    if (c.kind === 'buffer') return 'Only ' + c.gap + ' min after/before ' + other + ' (same-location buffer ' + c.need + ' min)';
    return 'Conflicts with ' + other;
  }
  function AvailTab() {
    var app = A.useApp();
    var toast = A.useToast();
    var _A$useConfirm = A.useConfirm(),
      _A$useConfirm2 = _slicedToArray(_A$useConfirm, 2),
      confirmUi = _A$useConfirm2[0],
      confirm = _A$useConfirm2[1];
    var _A$useAction = A.useAction(),
      _A$useAction2 = _slicedToArray(_A$useAction, 2),
      busy = _A$useAction2[0],
      run = _A$useAction2[1];
    var today = app.today;
    var _useState = useState(() => {
        var _today$split$map = today.split('-').map(Number),
          _today$split$map2 = _slicedToArray(_today$split$map, 2),
          y = _today$split$map2[0],
          m = _today$split$map2[1];
        return {
          y,
          m: m - 1
        };
      }),
      _useState2 = _slicedToArray(_useState, 2),
      ym = _useState2[0],
      setYm = _useState2[1];
    var _useState3 = useState(today),
      _useState4 = _slicedToArray(_useState3, 2),
      sel = _useState4[0],
      setSel = _useState4[1];
    var _useState5 = useState(''),
      _useState6 = _slicedToArray(_useState5, 2),
      locF = _useState6[0],
      setLocF = _useState6[1];
    var _useState7 = useState(''),
      _useState8 = _slicedToArray(_useState7, 2),
      coachF = _useState8[0],
      setCoachF = _useState8[1];
    var _useState9 = useState(null),
      _useState0 = _slicedToArray(_useState9, 2),
      dialog = _useState0[0],
      setDialog = _useState0[1];
    var from = ym.y + '-' + pad2(ym.m + 1) + '-01';
    var to = ym.y + '-' + pad2(ym.m + 1) + '-' + pad2(new Date(ym.y, ym.m + 1, 0).getDate());
    var q = A.useFetch('/api/admin/schedule?from=' + from + '&to=' + to, [app.version]);
    var data = q.data;
    var activeLocs = app.locations.filter(l => l.active && !l.archived_at);
    var multiCoach = app.coaches.filter(c => c.active).length > 1 && app.isDirector;
    var slots = useMemo(() => (data ? data.slots : []).filter(s => (!locF || s.loc_id === locF) && (!coachF || (s.coach_id || '') === coachF)), [data, locF, coachF]);
    var byId = useMemo(() => Object.fromEntries((data ? data.slots : []).map(s => [s.id, s])), [data]);
    var byDate = useMemo(() => {
      var o = {};
      slots.forEach(s => (o[s.date] = o[s.date] || []).push(s));
      return o;
    }, [slots]);
    var blocks = data ? data.blocks : [];
    var blocksOn = iso => blocks.filter(b => b.date <= iso && b.end_date >= iso && (!coachF || !b.coach_id || b.coach_id === coachF));
    var refresh = () => {
      q.reload();
    };
    var prev = () => setYm(_ref => {
      var y = _ref.y,
        m = _ref.m;
      return m === 0 ? {
        y: y - 1,
        m: 11
      } : {
        y,
        m: m - 1
      };
    });
    var next = () => setYm(_ref2 => {
      var y = _ref2.y,
        m = _ref2.m;
      return m === 11 ? {
        y: y + 1,
        m: 0
      } : {
        y,
        m: m + 1
      };
    });
    var goToday = () => {
      var _today$split$map3 = today.split('-').map(Number),
        _today$split$map4 = _slicedToArray(_today$split$map3, 2),
        y = _today$split$map4[0],
        m = _today$split$map4[1];
      setYm({
        y,
        m: m - 1
      });
      setSel(today);
    };
    var firstDow = new Date(ym.y, ym.m, 1).getDay();
    var days = new Date(ym.y, ym.m + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < firstDow; i++) cells.push(null);
    for (var d = 1; d <= days; d++) cells.push(d);
    var daySlots = (byDate[sel] || []).slice().sort((a, b) => a.time.localeCompare(b.time));
    var dayBlocks = blocksOn(sel);
    var open = daySlots.filter(s => s.status === 'open' && !s.reservation);
    var reserved = daySlots.filter(s => s.status === 'open' && s.reservation);
    var live = daySlots.filter(s => s.status !== 'open');
    var hours = live.reduce((n, s) => n + (s.duration || 60), 0) / 60;
    var hardCount = daySlots.filter(s => s.conflicts.some(c => c.severity === 'hard')).length;
    var byLoc = {};
    daySlots.forEach(s => (byLoc[s.loc_id] = byLoc[s.loc_id] || []).push(s));

    /* ---- actions ---- */
    var mark = (s, status) => run(() => A.api('POST', '/api/admin/slots/' + s.id + '/mark', {
      status
    }), r => status === 'booked' ? 'Marked booked' + (r.changes && r.changes.length ? ' — ' + r.changes.length + ' conflicting opening(s) adjusted' : '') : 'Opening is available again').then(refresh).catch(() => {});
    var addB2B = (s, dir, buffer) => run(() => A.api('POST', '/api/admin/slots/' + s.id + '/b2b', {
      dir,
      buffer: buffer || 0
    }), buffer ? 'Back-to-back opening added with a ' + buffer + ' minute buffer' : 'Back-to-back opening added').then(refresh).catch(() => {});
    var remove = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(function* (s) {
        if (s.series_id && !s.series_detached) {
          setDialog({
            kind: 'scope',
            slot: s,
            action: 'delete'
          });
          return;
        }
        if (!(yield confirm({
          title: 'Delete this opening?',
          body: LSL.fmtDateLong(s.date) + ' at ' + LSL.fmtTime(s.time) + ' · ' + app.locName(s.loc_id),
          confirmLabel: 'Delete',
          danger: true
        }))) return;
        run(() => A.api('DELETE', '/api/admin/slots/' + s.id), 'Opening deleted').then(refresh).catch(() => {});
      });
      return function remove(_x) {
        return _ref3.apply(this, arguments);
      };
    }();
    var delBlock = /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator(function* (b) {
        if (!(yield confirm({
          title: 'Remove this block?',
          body: 'Openings in this time become bookable again.',
          confirmLabel: 'Remove block'
        }))) return;
        run(() => A.api('DELETE', '/api/admin/blocks/' + b.id), 'Block removed').then(refresh).catch(() => {});
      });
      return function delBlock(_x2) {
        return _ref4.apply(this, arguments);
      };
    }();
    var dayLabel = (iso, ds, bl) => {
      var o = ds.filter(s => s.status === 'open' && !s.reservation).length,
        b = ds.filter(s => s.status !== 'open').length,
        rv = ds.filter(s => s.status === 'open' && s.reservation).length;
      var c = ds.some(s => s.conflicts.length);
      return [LSL.fmtDateLong(iso), o && o + ' open', rv && rv + ' reserved', b && b + ' booked', ds.some(s => s.contingent) && 'back-to-back openings', c && 'has conflicts', bl.length && 'blocked time'].filter(Boolean).join(', ');
    };
    return /*#__PURE__*/React.createElement("div", null, confirmUi, /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-filters"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: locF,
      onChange: e => setLocF(e.target.value),
      "aria-label": "Filter by location"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "All locations"), app.locations.map(l => /*#__PURE__*/React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name, l.archived_at ? ' (archived)' : ''))), multiCoach && /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: coachF,
      onChange: e => setCoachF(e.target.value),
      "aria-label": "Filter by coach"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "All coaches"), app.coaches.filter(c => c.active).map(c => /*#__PURE__*/React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.name))), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: goToday
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar-check"
    }), " Today")), /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal"
    }, /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__left"
    }, /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__head"
    }, /*#__PURE__*/React.createElement("button", {
      className: "lsl-admcal__navbtn",
      onClick: prev,
      "aria-label": "Previous month"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-left",
      size: 15
    })), /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__monthlabel",
      "aria-live": "polite"
    }, MONTHS[ym.m], " ", ym.y), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "lsl-admcal__navbtn",
      onClick: refresh,
      "aria-label": "Refresh",
      title: "Refresh",
      disabled: q.loading
    }, /*#__PURE__*/React.createElement(Icon, {
      name: q.loading ? 'loader-circle' : 'refresh-cw',
      size: 15,
      className: q.loading ? 'lsl-a-spin' : ''
    })), /*#__PURE__*/React.createElement("button", {
      className: "lsl-admcal__navbtn",
      onClick: next,
      "aria-label": "Next month"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 15
    })))), /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__dowrow",
      "aria-hidden": "true"
    }, DOWS.map(d => /*#__PURE__*/React.createElement("span", {
      key: d
    }, d))), /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__daygrid"
    }, cells.map((day, i) => {
      if (!day) return /*#__PURE__*/React.createElement("div", {
        key: 'e' + i
      });
      var iso = ym.y + '-' + pad2(ym.m + 1) + '-' + pad2(day);
      var ds = byDate[iso] || [];
      var bl = blocksOn(iso);
      var hasOpen = ds.some(s => s.status === 'open' && !s.contingent && !s.reservation);
      var hasReserved = ds.some(s => s.status === 'open' && s.reservation);
      var hasBooked = ds.some(s => s.status === 'booked');
      var hasHeld = ds.some(s => s.status === 'held');
      var hasB2B = ds.some(s => s.contingent);
      var hasConflict = ds.some(s => s.conflicts.some(c => c.kind !== 'blocked' || s.status !== 'open'));
      return /*#__PURE__*/React.createElement("button", {
        key: day,
        "aria-label": dayLabel(iso, ds, bl),
        "aria-pressed": iso === sel,
        title: bl.length ? 'Blocked: ' + bl.map(b => b.reason).join(', ') : undefined,
        className: ['lsl-admcal__day', iso === today && 'is-today', iso === sel && 'is-sel', iso < today && 'is-past', bl.length && 'is-blocked'].filter(Boolean).join(' '),
        onClick: () => setSel(iso)
      }, /*#__PURE__*/React.createElement("span", {
        className: "lsl-admcal__daynum"
      }, day), /*#__PURE__*/React.createElement("span", {
        className: "lsl-admcal__dots",
        "aria-hidden": "true"
      }, hasOpen && /*#__PURE__*/React.createElement("span", {
        className: "lsl-admcal__dot lsl-admcal__dot--open"
      }), hasReserved && /*#__PURE__*/React.createElement("span", {
        className: "lsl-admcal__dot lsl-admcal__dot--reserved"
      }), hasHeld && /*#__PURE__*/React.createElement("span", {
        className: "lsl-admcal__dot lsl-admcal__dot--held"
      }), hasBooked && /*#__PURE__*/React.createElement("span", {
        className: "lsl-admcal__dot lsl-admcal__dot--booked"
      }), hasB2B && /*#__PURE__*/React.createElement("span", {
        className: "lsl-admcal__dot lsl-admcal__dot--b2b"
      }), hasConflict && /*#__PURE__*/React.createElement("span", {
        className: "lsl-admcal__dot lsl-admcal__dot--conflict"
      })));
    })), /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__legend"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__dot lsl-admcal__dot--open"
    }), " Open"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__dot lsl-admcal__dot--reserved"
    }), " Reserved"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__dot lsl-admcal__dot--held"
    }), " Held"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__dot lsl-admcal__dot--booked"
    }), " Booked"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__dot lsl-admcal__dot--b2b"
    }), " B2B"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__dot lsl-admcal__dot--conflict"
    }), " Conflict"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__dot",
      style: {
        background: 'repeating-linear-gradient(135deg,#aebfd3 0 2px,transparent 2px 4px)',
        width: 10,
        height: 8
      }
    }), " Blocked"))), /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__panelhead"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "lsl-admcal__paneltitle"
    }, LSL.fmtDateLong(sel)), /*#__PURE__*/React.createElement("span", {
      className: "lsl-a-muted lsl-a-small"
    }, LSL.tzLabel(sel, '12:00'), " \xB7 ", app.settings.timezone.replace('_', ' '))), q.error && /*#__PURE__*/React.createElement(A.ErrorState, {
      error: q.error,
      onRetry: refresh
    }), q.loading && !data ? /*#__PURE__*/React.createElement(A.Loading, {
      text: "Loading schedule\u2026"
    }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-daysum",
      "aria-label": "Day summary"
    }, /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-stat"
    }, /*#__PURE__*/React.createElement("b", null, open.length), /*#__PURE__*/React.createElement("span", null, "Open")), reserved.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-stat"
    }, /*#__PURE__*/React.createElement("b", null, reserved.length), /*#__PURE__*/React.createElement("span", null, "Reserved")), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-stat"
    }, /*#__PURE__*/React.createElement("b", null, live.length), /*#__PURE__*/React.createElement("span", null, "Booked")), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-stat"
    }, /*#__PURE__*/React.createElement("b", null, hours % 1 ? hours.toFixed(1) : hours), /*#__PURE__*/React.createElement("span", null, "Training hrs")), hardCount > 0 && /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-stat is-alert"
    }, /*#__PURE__*/React.createElement("b", null, hardCount), /*#__PURE__*/React.createElement("span", null, "Double-booked"))), dayBlocks.map(b => /*#__PURE__*/React.createElement("div", {
      key: b.id,
      className: "lsl-a-block-row"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "ban"
    }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, (REASONS.find(r => r[0] === b.reason) || [])[1] || 'Blocked'), " \xB7 ", b.start_time ? LSL.fmtTime(b.start_time) + '–' + LSL.fmtTime(b.end_time) : 'All day', b.end_date !== b.date ? ' · through ' + LSL.fmtDate(b.end_date) : '', b.note ? ' · ' + b.note : '', b.coach_id ? ' · ' + (app.coachName(b.coach_id) || '') : ''), /*#__PURE__*/React.createElement("span", {
      className: "lsl-a-spacer"
    }), /*#__PURE__*/React.createElement("button", {
      className: "lsl-admin__del",
      onClick: () => delBlock(b),
      "aria-label": "Remove block"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash-2"
    })))), daySlots.length === 0 && /*#__PURE__*/React.createElement("p", {
      className: "lsl-body lsl-body--sm",
      style: {
        color: 'var(--fg3)',
        marginBottom: 16
      }
    }, "No openings on this day yet. Add one below, or use the tools to add many at once."), Object.entries(byLoc).map(_ref5 => {
      var _ref6 = _slicedToArray(_ref5, 2),
        lid = _ref6[0],
        ls = _ref6[1];
      return /*#__PURE__*/React.createElement("div", {
        key: lid,
        className: "lsl-admcal__locgroup"
      }, /*#__PURE__*/React.createElement("div", {
        className: "lsl-admcal__locname"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "map-pin",
        size: 12
      }), " ", app.locName(lid)), ls.map(s => /*#__PURE__*/React.createElement(SlotRow, {
        key: s.id,
        s: s,
        byId: byId,
        busy: busy,
        onMark: mark,
        onB2B: addB2B,
        onDelete: remove,
        onEdit: x => setDialog({
          kind: 'edit',
          slot: x
        }),
        onReserve: x => setDialog({
          kind: 'reserve',
          slot: x
        })
      })));
    }), /*#__PURE__*/React.createElement(AddOpening, {
      date: sel,
      locs: activeLocs,
      multiCoach: multiCoach,
      onDone: refresh
    }), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-toolbar",
      "aria-label": "Availability tools"
    }, /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => setDialog({
        kind: 'series'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "repeat"
    }), " Recurring"), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => setDialog({
        kind: 'bulk'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "rows-3"
    }), " Bulk add"), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => setDialog({
        kind: 'copy'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "copy"
    }), " Copy day / week"), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => setDialog({
        kind: 'block'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "ban"
    }), " Block time"))))), dialog && dialog.kind === 'series' && /*#__PURE__*/React.createElement(SeriesDialog, {
      date: sel,
      locs: activeLocs,
      series: data ? data.series : [],
      multiCoach: multiCoach,
      onClose: () => setDialog(null),
      onDone: refresh
    }), dialog && dialog.kind === 'bulk' && /*#__PURE__*/React.createElement(BulkDialog, {
      date: sel,
      locs: activeLocs,
      multiCoach: multiCoach,
      onClose: () => setDialog(null),
      onDone: refresh
    }), dialog && dialog.kind === 'copy' && /*#__PURE__*/React.createElement(CopyDialog, {
      date: sel,
      locs: activeLocs,
      onClose: () => setDialog(null),
      onDone: refresh
    }), dialog && dialog.kind === 'block' && /*#__PURE__*/React.createElement(BlockDialog, {
      date: sel,
      multiCoach: multiCoach,
      onClose: () => setDialog(null),
      onDone: refresh
    }), dialog && dialog.kind === 'edit' && /*#__PURE__*/React.createElement(EditSlotDialog, {
      slot: dialog.slot,
      locs: activeLocs,
      onClose: () => setDialog(null),
      onDone: refresh
    }), dialog && dialog.kind === 'reserve' && /*#__PURE__*/React.createElement(ReservationDialog, {
      slot: dialog.slot,
      onClose: () => setDialog(null),
      onDone: refresh
    }), dialog && dialog.kind === 'scope' && /*#__PURE__*/React.createElement(ScopeDeleteDialog, {
      slot: dialog.slot,
      onClose: () => setDialog(null),
      onDone: refresh
    }));
  }
  function SlotRow(_ref7) {
    var s = _ref7.s,
      byId = _ref7.byId,
      busy = _ref7.busy,
      onMark = _ref7.onMark,
      onB2B = _ref7.onB2B,
      onDelete = _ref7.onDelete,
      onEdit = _ref7.onEdit,
      onReserve = _ref7.onReserve;
    var app = A.useApp();
    var _useState1 = useState(false),
      _useState10 = _slicedToArray(_useState1, 2),
      pick = _useState10[0],
      setPick = _useState10[1];
    var _useState11 = useState(0),
      _useState12 = _slicedToArray(_useState11, 2),
      buffer = _useState12[0],
      setBuffer = _useState12[1];
    var hard = s.conflicts.filter(c => c.severity === 'hard');
    var soft = s.conflicts.filter(c => c.severity !== 'hard');
    var anchor = s.contingent_on ? byId[s.contingent_on] : null;
    var end = A.endTime(s.time, s.duration);
    var status = s.status === 'held' ? /*#__PURE__*/React.createElement(Badge, {
      tone: "warn",
      icon: "hourglass"
    }, "Held \xB7 awaiting payment") : s.status === 'booked' ? /*#__PURE__*/React.createElement(Badge, {
      tone: "orange",
      icon: "calendar-check"
    }, s.manual ? 'Booked (manual)' : 'Booked') : s.reservation ? /*#__PURE__*/React.createElement(Badge, {
      tone: "sky",
      icon: "user-check",
      title: 'Reserved for ' + s.reservation.client_name + ' until ' + A.stamp(s.reservation.expires_at)
    }, "Reserved \xB7 ", s.reservation.client_name) : /*#__PURE__*/React.createElement(Badge, {
      tone: "outline",
      icon: "circle"
    }, "Open");
    return /*#__PURE__*/React.createElement("div", {
      className: 'lsl-admcal__slot' + (s.reservation ? ' is-reserved' : '') + (s.contingent ? ' is-b2b' : '') + (s.status === 'booked' ? ' is-booked' : '') + (s.status === 'held' ? ' is-held' : '') + (hard.length ? ' has-hard' : '')
    }, /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__slotmain"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__slottime"
    }, LSL.fmtTime(s.time)), /*#__PURE__*/React.createElement("span", {
      className: "lsl-a-muted lsl-a-small"
    }, "\u2013 ", LSL.fmtTime(end), " \xB7 ", s.duration, " min"), status, s.contingent && /*#__PURE__*/React.createElement(Badge, {
      tone: "sky",
      icon: "repeat-2"
    }, "B2B"), s.series_id && /*#__PURE__*/React.createElement(Badge, {
      tone: "muted",
      icon: "repeat",
      title: s.series_detached ? 'Edited separately from its series' : 'Part of a recurring series'
    }, s.series_detached ? 'Edited' : 'Weekly'), s.coach_id && app.coaches.length > 1 && /*#__PURE__*/React.createElement(Badge, {
      tone: "muted",
      icon: "user"
    }, app.coachName(s.coach_id)), s.reservation && /*#__PURE__*/React.createElement("span", {
      className: "lsl-a-muted lsl-a-small"
    }, "held until ", A.stamp(s.reservation.expires_at)), s.booking && /*#__PURE__*/React.createElement("button", {
      className: "lsl-a-slotbooking",
      onClick: () => app.openBooking(s.booking_id)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user"
    }), " ", s.booking.athlete, " \xB7 ", s.booking.service), s.booking && /*#__PURE__*/React.createElement(A.StatusBadge, {
      kind: "payment",
      value: s.booking.payment_status
    }), hard.map((c, i) => /*#__PURE__*/React.createElement("span", {
      key: 'h' + i,
      className: "lsl-a-conflict is-hard"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "octagon-alert",
      size: 13
    }), " Double-booked: ", describe(c, byId, app))), soft.map((c, i) => /*#__PURE__*/React.createElement("span", {
      key: 's' + i,
      className: "lsl-a-conflict is-potential"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "triangle-alert",
      size: 13
    }), " Potential conflict: ", describe(c, byId, app), ". ", s.status === 'open' ? 'If one is booked, the other is ' + (app.settings.conflictAction === 'delete' ? 'removed' : 'moved to a safe time') + '.' : '')), s.contingent && anchor && anchor.status === 'open' && /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__slotlock"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "lock",
      size: 11
    }), " Shown to families once ", LSL.fmtTime(anchor.time), " is booked")), /*#__PURE__*/React.createElement("div", {
      className: 'lsl-admcal__slotactions' + (pick ? ' is-picking' : '')
    }, s.status === 'open' && /*#__PURE__*/React.createElement("button", {
      className: 'lsl-btn lsl-btn--xs ' + (s.reservation ? 'lsl-btn--primary' : 'lsl-btn--ghost'),
      disabled: busy,
      onClick: () => onReserve(s),
      title: "Hold this time for one client and get a private sign-up link"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user-check"
    }), " ", s.reservation ? 'Manage reservation' : 'Reserve'), s.status === 'open' && /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      disabled: busy,
      onClick: () => onMark(s, 'booked'),
      title: "Booked outside the website"
    }, "Mark booked"), s.manual && /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      disabled: busy,
      onClick: () => onMark(s, 'open')
    }, "Mark open"), s.status === 'open' && (pick ? /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__b2bpick"
    }, /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => {
        setPick(false);
        onB2B(s, 'before', buffer);
        setBuffer(0);
      }
    }, "\u2190 Before"), /*#__PURE__*/React.createElement("select", {
      className: "lsl-select lsl-admcal__bufsel",
      value: buffer,
      onChange: e => setBuffer(+e.target.value),
      "aria-label": "Add buffer time?"
    }, /*#__PURE__*/React.createElement("option", {
      value: 0
    }, "Add buffer time?"), [15, 30, 45, 60, 75, 90].map(m => /*#__PURE__*/React.createElement("option", {
      key: m,
      value: m
    }, m, " min buffer"))), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => {
        setPick(false);
        onB2B(s, 'after', buffer);
        setBuffer(0);
      }
    }, "After \u2192"), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => {
        setPick(false);
        setBuffer(0);
      }
    }, "Cancel")) : /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => setPick(true)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "repeat-2"
    }), " Add B2B")), s.status === 'open' && /*#__PURE__*/React.createElement("button", {
      className: "lsl-a-iconbtn",
      onClick: () => onEdit(s),
      "aria-label": 'Edit ' + LSL.fmtTime(s.time) + ' opening'
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pencil"
    })), s.status === 'open' && /*#__PURE__*/React.createElement("button", {
      className: "lsl-admin__del",
      onClick: () => onDelete(s),
      "aria-label": 'Delete ' + LSL.fmtTime(s.time) + ' opening'
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash-2"
    }))));
  }
  function CoachSelect(_ref8) {
    var value = _ref8.value,
      _onChange = _ref8.onChange;
    var app = A.useApp();
    return /*#__PURE__*/React.createElement(Field, {
      label: "Coach"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: value,
      onChange: e => _onChange(e.target.value)
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Default coach"), app.coaches.filter(c => c.active).map(c => /*#__PURE__*/React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.name))));
  }
  function AddOpening(_ref9) {
    var date = _ref9.date,
      locs = _ref9.locs,
      multiCoach = _ref9.multiCoach,
      onDone = _ref9.onDone;
    var app = A.useApp();
    var _useState13 = useState(''),
      _useState14 = _slicedToArray(_useState13, 2),
      time = _useState14[0],
      setTime = _useState14[1];
    var _useState15 = useState(app.settings.defaultDuration),
      _useState16 = _slicedToArray(_useState15, 2),
      dur = _useState16[0],
      setDur = _useState16[1];
    var _useState17 = useState(locs[0] ? locs[0].id : ''),
      _useState18 = _slicedToArray(_useState17, 2),
      loc = _useState18[0],
      setLoc = _useState18[1];
    var _useState19 = useState(''),
      _useState20 = _slicedToArray(_useState19, 2),
      coach = _useState20[0],
      setCoach = _useState20[1];
    var _useState21 = useState(''),
      _useState22 = _slicedToArray(_useState21, 2),
      err = _useState22[0],
      setErr = _useState22[1];
    var _A$useAction3 = A.useAction(),
      _A$useAction4 = _slicedToArray(_A$useAction3, 2),
      busy = _A$useAction4[0],
      run = _A$useAction4[1];
    var add = () => {
      setErr('');
      if (!time) {
        setErr('Pick a start time.');
        return;
      }
      run(() => A.api('POST', '/api/admin/slots', {
        date,
        time,
        duration: +dur,
        loc_id: loc,
        coach_id: coach || null
      }), r => r.warnings && r.warnings.length ? 'Added — note: tight timing with ' + LSL.fmtTime(r.warnings[0].withTime) : 'Opening added').then(() => {
        setTime('');
        onDone();
      }).catch(e => setErr(e.message));
    };
    if (date < app.today) return /*#__PURE__*/React.createElement("p", {
      className: "lsl-a-muted lsl-a-small",
      style: {
        marginTop: 16
      }
    }, "This day has passed \u2014 openings can only be added to today or later.");
    return /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__addrow"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lsl-admcal__addlabel"
    }, "Add opening"), /*#__PURE__*/React.createElement("div", {
      className: "lsl-admcal__addinputs"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input lsl-admcal__addinput",
      type: "time",
      value: time,
      onChange: e => setTime(e.target.value),
      "aria-label": "Start time"
    }), /*#__PURE__*/React.createElement("select", {
      className: "lsl-select lsl-admcal__addinput",
      value: dur,
      onChange: e => setDur(e.target.value),
      "aria-label": "Length"
    }, [30, 45, 60, 75, 90, 120].map(m => /*#__PURE__*/React.createElement("option", {
      key: m,
      value: m
    }, m, " min"))), /*#__PURE__*/React.createElement("select", {
      className: "lsl-select lsl-admcal__addinput",
      value: loc,
      onChange: e => setLoc(e.target.value),
      "aria-label": "Location"
    }, locs.map(l => /*#__PURE__*/React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name))), multiCoach && /*#__PURE__*/React.createElement("select", {
      className: "lsl-select lsl-admcal__addinput",
      value: coach,
      onChange: e => setCoach(e.target.value),
      "aria-label": "Coach"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Default coach"), app.coaches.filter(c => c.active).map(c => /*#__PURE__*/React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.name))), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--primary lsl-btn--sm",
      onClick: add,
      disabled: busy
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus"
    }), " ", busy ? 'Adding…' : 'Add')), err && /*#__PURE__*/React.createElement("span", {
      className: "lsl-err",
      role: "alert",
      style: {
        width: '100%'
      }
    }, err));
  }
  var SKIP_LABEL = {
    past: 'date has passed',
    duplicate: 'already exists',
    overlap: 'overlaps another opening',
    blocked: 'inside blocked time',
    conflict: 'conflicts with a booked session'
  };
  function Preview(_ref0) {
    var result = _ref0.result;
    if (!result) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-preview",
      "aria-live": "polite"
    }, /*#__PURE__*/React.createElement("strong", null, A.plural(result.create.length, 'opening'), " will be created"), result.skipped.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, ", ", result.skipped.length, " skipped"), result.warnings.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, ", ", result.warnings.length, " with tight timing"), /*#__PURE__*/React.createElement("ul", {
      className: "lsl-a-list"
    }, result.create.slice(0, 60).map((p, i) => /*#__PURE__*/React.createElement("li", {
      key: 'c' + i
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus"
    }), " ", LSL.fmtDate(p.date), " \xB7 ", LSL.fmtTime(p.time))), result.skipped.map((p, i) => /*#__PURE__*/React.createElement("li", {
      key: 's' + i,
      className: "lsl-a-muted"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "minus"
    }), " ", LSL.fmtDate(p.date), " \xB7 ", LSL.fmtTime(p.time), " \u2014 skipped: ", SKIP_LABEL[p.reason] || p.reason)), result.warnings.map((p, i) => /*#__PURE__*/React.createElement("li", {
      key: 'w' + i,
      style: {
        color: '#8a5a00'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "triangle-alert"
    }), " ", LSL.fmtDate(p.date), " \xB7 ", LSL.fmtTime(p.time), " \u2014 ", p.reason === 'travel' ? 'short travel time' : 'tight', " vs ", LSL.fmtTime(p.withTime)))));
  }

  /** Shared preview → confirm flow for bulk-style generators. */
  function useGenerator(onDone, onClose) {
    var toast = A.useToast();
    var _useState23 = useState(null),
      _useState24 = _slicedToArray(_useState23, 2),
      preview = _useState24[0],
      setPreview = _useState24[1];
    var _useState25 = useState(''),
      _useState26 = _slicedToArray(_useState25, 2),
      err = _useState26[0],
      setErr = _useState26[1];
    var _useState27 = useState(false),
      _useState28 = _slicedToArray(_useState27, 2),
      busy = _useState28[0],
      setBusy = _useState28[1];
    var go = /*#__PURE__*/function () {
      var _ref1 = _asyncToGenerator(function* (body, dry) {
        setErr('');
        setBusy(true);
        try {
          var r = yield A.api('POST', '/api/admin/slots/generate', _objectSpread(_objectSpread({}, body), {}, {
            dryRun: dry
          }));
          if (dry) setPreview(r);else {
            toast(A.plural(r.created, 'opening') + ' created' + (r.skipped.length ? ', ' + r.skipped.length + ' skipped' : ''));
            onDone();
            onClose();
          }
        } catch (e) {
          setErr(e.message);
          setPreview(null);
        } finally {
          setBusy(false);
        }
      });
      return function go(_x3, _x4) {
        return _ref1.apply(this, arguments);
      };
    }();
    return {
      preview,
      setPreview,
      err,
      busy,
      go
    };
  }
  function RangeFields(_ref10) {
    var v = _ref10.v,
      set = _ref10.set,
      locs = _ref10.locs,
      multiCoach = _ref10.multiCoach;
    return /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-grid"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "From"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "time",
      value: v.start,
      onChange: e => set(_objectSpread(_objectSpread({}, v), {}, {
        start: e.target.value
      }))
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Until"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "time",
      value: v.end,
      onChange: e => set(_objectSpread(_objectSpread({}, v), {}, {
        end: e.target.value
      }))
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Session length"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: v.duration,
      onChange: e => set(_objectSpread(_objectSpread({}, v), {}, {
        duration: +e.target.value
      }))
    }, [30, 45, 60, 75, 90, 120].map(m => /*#__PURE__*/React.createElement("option", {
      key: m,
      value: m
    }, m, " min")))), /*#__PURE__*/React.createElement(Field, {
      label: "Break between",
      hint: "Gap after each session"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: v.buffer,
      onChange: e => set(_objectSpread(_objectSpread({}, v), {}, {
        buffer: +e.target.value
      }))
    }, [0, 5, 10, 15, 20, 30, 45, 60].map(m => /*#__PURE__*/React.createElement("option", {
      key: m,
      value: m
    }, m, " min")))), /*#__PURE__*/React.createElement(Field, {
      label: "Location"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: v.loc_id,
      onChange: e => set(_objectSpread(_objectSpread({}, v), {}, {
        loc_id: e.target.value
      }))
    }, locs.map(l => /*#__PURE__*/React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name)))), multiCoach && /*#__PURE__*/React.createElement(CoachSelect, {
      value: v.coach_id,
      onChange: c => set(_objectSpread(_objectSpread({}, v), {}, {
        coach_id: c
      }))
    }));
  }
  function BulkDialog(_ref11) {
    var date = _ref11.date,
      locs = _ref11.locs,
      multiCoach = _ref11.multiCoach,
      onClose = _ref11.onClose,
      onDone = _ref11.onDone;
    var app = A.useApp();
    var _useState29 = useState({
        start: '15:00',
        end: '19:00',
        duration: app.settings.defaultDuration,
        buffer: 0,
        loc_id: locs[0] && locs[0].id,
        coach_id: ''
      }),
      _useState30 = _slicedToArray(_useState29, 2),
      v = _useState30[0],
      setV = _useState30[1];
    var _useState31 = useState(date),
      _useState32 = _slicedToArray(_useState31, 2),
      dates = _useState32[0],
      setDates = _useState32[1];
    var g = useGenerator(onDone, onClose);
    var body = () => _objectSpread(_objectSpread({
      mode: 'range',
      dates: dates.split(',').map(d => d.trim()).filter(Boolean)
    }, v), {}, {
      coach_id: v.coach_id || null
    });
    return /*#__PURE__*/React.createElement(Dialog, {
      title: "Bulk add openings",
      onClose: onClose,
      wide: true,
      busy: g.busy,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: () => g.go(body(), true),
        disabled: g.busy
      }, "Preview"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--primary lsl-btn--sm",
        onClick: () => g.go(body(), false),
        disabled: g.busy || !g.preview || !g.preview.create.length
      }, "Create ", g.preview ? A.plural(g.preview.create.length, 'opening') : ''))
    }, /*#__PURE__*/React.createElement("p", {
      className: "lsl-body lsl-body--sm",
      style: {
        marginTop: 0
      }
    }, "Fills a time range with back-to-back sessions. Existing openings, blocked time, and booked sessions are detected and skipped."), /*#__PURE__*/React.createElement(Field, {
      label: "Date"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      value: dates,
      min: app.today,
      onChange: e => {
        setDates(e.target.value);
        g.setPreview(null);
      }
    })), /*#__PURE__*/React.createElement(RangeFields, {
      v: v,
      set: x => {
        setV(x);
        g.setPreview(null);
      },
      locs: locs,
      multiCoach: multiCoach
    }), g.err && /*#__PURE__*/React.createElement(A.Banner, {
      tone: "danger"
    }, g.err), /*#__PURE__*/React.createElement(Preview, {
      result: g.preview
    }));
  }
  function SeriesDialog(_ref12) {
    var date = _ref12.date,
      locs = _ref12.locs,
      series = _ref12.series,
      multiCoach = _ref12.multiCoach,
      onClose = _ref12.onClose,
      _onDone = _ref12.onDone;
    var app = A.useApp();
    var toast = A.useToast();
    var _useState33 = useState({
        start: '16:00',
        end: '18:00',
        duration: app.settings.defaultDuration,
        buffer: 0,
        loc_id: locs[0] && locs[0].id,
        coach_id: ''
      }),
      _useState34 = _slicedToArray(_useState33, 2),
      v = _useState34[0],
      setV = _useState34[1];
    var _useState35 = useState([dowOf(date)]),
      _useState36 = _slicedToArray(_useState35, 2),
      wd = _useState36[0],
      setWd = _useState36[1];
    var _useState37 = useState({
        start_date: date < app.today ? app.today : date,
        end_date: addDays(date < app.today ? app.today : date, 56)
      }),
      _useState38 = _slicedToArray(_useState37, 2),
      range = _useState38[0],
      setRange = _useState38[1];
    var _useState39 = useState(null),
      _useState40 = _slicedToArray(_useState39, 2),
      editing = _useState40[0],
      setEditing = _useState40[1];
    var g = useGenerator(_onDone, onClose);
    var body = () => _objectSpread(_objectSpread(_objectSpread({
      mode: 'series',
      weekdays: wd
    }, v), range), {}, {
      coach_id: v.coach_id || null
    });
    var toggleWd = d => {
      setWd(wd.includes(d) ? wd.filter(x => x !== d) : [...wd, d].sort());
      g.setPreview(null);
    };
    var endSeries = /*#__PURE__*/function () {
      var _ref13 = _asyncToGenerator(function* (sr) {
        try {
          var r = yield A.api('PATCH', '/api/admin/series/' + sr.id, {
            from_date: app.today > sr.start_date ? app.today : sr.start_date,
            stop: true
          });
          toast('Series ended — ' + A.plural(r.removed, 'future opening') + ' removed' + (r.kept.length ? ', ' + r.kept.length + ' booked kept' : ''));
          _onDone();
          onClose();
        } catch (e) {
          toast(e.message, 'err');
        }
      });
      return function endSeries(_x5) {
        return _ref13.apply(this, arguments);
      };
    }();
    if (editing) return /*#__PURE__*/React.createElement(SeriesEditDialog, {
      sr: editing,
      locs: locs,
      onClose: () => setEditing(null),
      onDone: () => {
        _onDone();
        onClose();
      }
    });
    return /*#__PURE__*/React.createElement(Dialog, {
      title: "Recurring availability",
      onClose: onClose,
      wide: true,
      busy: g.busy,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: () => g.go(body(), true),
        disabled: g.busy
      }, "Preview"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--primary lsl-btn--sm",
        onClick: () => g.go(body(), false),
        disabled: g.busy || !g.preview || !g.preview.create.length
      }, "Create ", g.preview ? A.plural(g.preview.create.length, 'opening') : ''))
    }, /*#__PURE__*/React.createElement("p", {
      className: "lsl-body lsl-body--sm",
      style: {
        marginTop: 0
      }
    }, "Repeats weekly on the days you pick, at the same local time (", app.settings.timezone.replace('_', ' '), ") \u2014 including across daylight-saving changes."), /*#__PURE__*/React.createElement("fieldset", {
      style: {
        border: 0,
        padding: 0,
        margin: '0 0 14px'
      }
    }, /*#__PURE__*/React.createElement("legend", {
      className: "lsl-a-h4"
    }, "Repeat on"), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-weekdays"
    }, DOWS.map((d, i) => /*#__PURE__*/React.createElement("label", {
      key: i
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: wd.includes(i),
      onChange: () => toggleWd(i),
      "aria-label": DOW_LONG[i]
    }), /*#__PURE__*/React.createElement("span", null, d))))), /*#__PURE__*/React.createElement(RangeFields, {
      v: v,
      set: x => {
        setV(x);
        g.setPreview(null);
      },
      locs: locs,
      multiCoach: multiCoach
    }), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-grid",
      style: {
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Starting"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      min: app.today,
      value: range.start_date,
      onChange: e => {
        setRange(_objectSpread(_objectSpread({}, range), {}, {
          start_date: e.target.value
        }));
        g.setPreview(null);
      }
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Ending",
      hint: "Required \u2014 up to one year"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      min: range.start_date,
      value: range.end_date,
      onChange: e => {
        setRange(_objectSpread(_objectSpread({}, range), {}, {
          end_date: e.target.value
        }));
        g.setPreview(null);
      }
    }))), g.err && /*#__PURE__*/React.createElement(A.Banner, {
      tone: "danger"
    }, g.err), /*#__PURE__*/React.createElement(Preview, {
      result: g.preview
    }), series.length > 0 && /*#__PURE__*/React.createElement(A.Expand, {
      title: 'Series this month (' + series.length + ')',
      icon: "list"
    }, /*#__PURE__*/React.createElement("ul", {
      className: "lsl-a-list"
    }, series.map(sr => /*#__PURE__*/React.createElement("li", {
      key: sr.id
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, sr.weekdays.map(d => DOWS[d]).join(', ')), " \xB7 ", LSL.fmtTime(sr.start_time), "\u2013", LSL.fmtTime(sr.end_time), " \xB7 ", app.locName(sr.loc_id), " \xB7 ", LSL.fmtDate(sr.start_date), " \u2192 ", LSL.fmtDate(sr.end_date)), /*#__PURE__*/React.createElement("span", {
      className: "lsl-a-spacer"
    }), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => setEditing(sr)
    }, "Change this & future"), /*#__PURE__*/React.createElement("button", {
      className: "lsl-btn lsl-btn--ghost lsl-btn--xs",
      onClick: () => endSeries(sr)
    }, "End series"))))));
  }
  function SeriesEditDialog(_ref14) {
    var sr = _ref14.sr,
      locs = _ref14.locs,
      onClose = _ref14.onClose,
      onDone = _ref14.onDone;
    var app = A.useApp();
    var toast = A.useToast();
    var _useState41 = useState({
        start: sr.start_time,
        end: sr.end_time,
        duration: sr.duration,
        buffer: sr.buffer,
        loc_id: sr.loc_id,
        coach_id: sr.coach_id || ''
      }),
      _useState42 = _slicedToArray(_useState41, 2),
      v = _useState42[0],
      setV = _useState42[1];
    var _useState43 = useState(sr.weekdays),
      _useState44 = _slicedToArray(_useState43, 2),
      wd = _useState44[0],
      setWd = _useState44[1];
    var _useState45 = useState(app.today > sr.start_date ? app.today : sr.start_date),
      _useState46 = _slicedToArray(_useState45, 2),
      fromDate = _useState46[0],
      setFromDate = _useState46[1];
    var _useState47 = useState(sr.end_date),
      _useState48 = _slicedToArray(_useState47, 2),
      endDate = _useState48[0],
      setEndDate = _useState48[1];
    var _useState49 = useState(false),
      _useState50 = _slicedToArray(_useState49, 2),
      busy = _useState50[0],
      setBusy = _useState50[1];
    var save = /*#__PURE__*/function () {
      var _ref15 = _asyncToGenerator(function* () {
        setBusy(true);
        try {
          var r = yield A.api('PATCH', '/api/admin/series/' + sr.id, {
            from_date: fromDate,
            weekdays: wd,
            start: v.start,
            end_time: v.end,
            duration: v.duration,
            buffer: v.buffer,
            loc_id: v.loc_id,
            coach_id: v.coach_id || null,
            end_date: endDate
          });
          toast('Updated from ' + LSL.fmtDate(fromDate) + ': ' + A.plural(r.created || 0, 'opening') + ' created' + (r.kept.length ? '; ' + r.kept.length + ' booked session(s) left untouched' : ''));
          onDone();
        } catch (e) {
          toast(e.message, 'err');
        } finally {
          setBusy(false);
        }
      });
      return function save() {
        return _ref15.apply(this, arguments);
      };
    }();
    return /*#__PURE__*/React.createElement(Dialog, {
      title: "Change this & future occurrences",
      onClose: onClose,
      wide: true,
      busy: busy,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: onClose
      }, "Cancel"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--primary lsl-btn--sm",
        onClick: save,
        disabled: busy
      }, "Apply from ", LSL.fmtDate(fromDate)))
    }, /*#__PURE__*/React.createElement(A.Banner, {
      tone: "info"
    }, "Open, unedited occurrences from the chosen date are replaced. ", /*#__PURE__*/React.createElement("strong", null, "Booked sessions are never moved or canceled"), " \u2014 they stay as they are."), /*#__PURE__*/React.createElement(Field, {
      label: "Apply starting"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      min: app.today,
      value: fromDate,
      onChange: e => setFromDate(e.target.value)
    })), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-weekdays",
      style: {
        marginBottom: 12
      }
    }, DOWS.map((d, i) => /*#__PURE__*/React.createElement("label", {
      key: i
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: wd.includes(i),
      onChange: () => setWd(wd.includes(i) ? wd.filter(x => x !== i) : [...wd, i]),
      "aria-label": DOW_LONG[i]
    }), /*#__PURE__*/React.createElement("span", null, d)))), /*#__PURE__*/React.createElement(RangeFields, {
      v: v,
      set: setV,
      locs: locs,
      multiCoach: false
    }), /*#__PURE__*/React.createElement(Field, {
      label: "Series ends",
      className: ""
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      value: endDate,
      min: fromDate,
      onChange: e => setEndDate(e.target.value)
    })));
  }
  function CopyDialog(_ref16) {
    var date = _ref16.date,
      locs = _ref16.locs,
      onClose = _ref16.onClose,
      onDone = _ref16.onDone;
    var app = A.useApp();
    var _useState51 = useState('copy_day'),
      _useState52 = _slicedToArray(_useState51, 2),
      mode = _useState52[0],
      setMode = _useState52[1];
    var _useState53 = useState(date),
      _useState54 = _slicedToArray(_useState53, 2),
      src = _useState54[0],
      setSrc = _useState54[1];
    var _useState55 = useState(addDays(date, 7)),
      _useState56 = _slicedToArray(_useState55, 2),
      dst = _useState56[0],
      setDst = _useState56[1];
    var _useState57 = useState(''),
      _useState58 = _slicedToArray(_useState57, 2),
      loc = _useState58[0],
      setLoc = _useState58[1];
    var g = useGenerator(onDone, onClose);
    var body = () => mode === 'copy_week' ? {
      mode,
      from: weekStart(src),
      to: weekStart(dst),
      loc_id: loc || null
    } : {
      mode,
      from: src,
      to: dst,
      loc_id: loc || null
    };
    return /*#__PURE__*/React.createElement(Dialog, {
      title: "Copy availability",
      onClose: onClose,
      busy: g.busy,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: () => g.go(body(), true),
        disabled: g.busy
      }, "Preview"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--primary lsl-btn--sm",
        onClick: () => g.go(body(), false),
        disabled: g.busy || !g.preview || !g.preview.create.length
      }, "Copy ", g.preview ? A.plural(g.preview.create.length, 'opening') : ''))
    }, /*#__PURE__*/React.createElement(Seg, {
      value: mode,
      onChange: m => {
        setMode(m);
        g.setPreview(null);
      },
      label: "Copy a day or a week",
      options: [['copy_day', 'A day'], ['copy_week', 'A week']]
    }), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-grid",
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: mode === 'copy_week' ? 'Copy the week of' : 'Copy from',
      hint: mode === 'copy_week' ? 'Week starting ' + LSL.fmtDate(weekStart(src)) : null
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      value: src,
      onChange: e => {
        setSrc(e.target.value);
        g.setPreview(null);
      }
    })), /*#__PURE__*/React.createElement(Field, {
      label: mode === 'copy_week' ? 'Into the week of' : 'Copy to',
      hint: mode === 'copy_week' ? 'Week starting ' + LSL.fmtDate(weekStart(dst)) : null
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      min: app.today,
      value: dst,
      onChange: e => {
        setDst(e.target.value);
        g.setPreview(null);
      }
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Only this location"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: loc,
      onChange: e => {
        setLoc(e.target.value);
        g.setPreview(null);
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "All locations"), locs.map(l => /*#__PURE__*/React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name))))), /*#__PURE__*/React.createElement("p", {
      className: "lsl-a-muted lsl-a-small"
    }, "Copies opening times only \u2014 never bookings. Duplicates are detected and skipped."), g.err && /*#__PURE__*/React.createElement(A.Banner, {
      tone: "danger"
    }, g.err), /*#__PURE__*/React.createElement(Preview, {
      result: g.preview
    }));
  }
  function BlockDialog(_ref17) {
    var date = _ref17.date,
      multiCoach = _ref17.multiCoach,
      onClose = _ref17.onClose,
      onDone = _ref17.onDone;
    var app = A.useApp();
    var toast = A.useToast();
    var _useState59 = useState({
        date,
        end_date: date,
        allDay: true,
        start_time: '09:00',
        end_time: '12:00',
        reason: 'practice',
        note: '',
        coach_id: ''
      }),
      _useState60 = _slicedToArray(_useState59, 2),
      v = _useState60[0],
      setV = _useState60[1];
    var _useState61 = useState(null),
      _useState62 = _slicedToArray(_useState61, 2),
      impact = _useState62[0],
      setImpact = _useState62[1];
    var _useState63 = useState(true),
      _useState64 = _slicedToArray(_useState63, 2),
      removeOpen = _useState64[0],
      setRemoveOpen = _useState64[1];
    var _useState65 = useState(''),
      _useState66 = _slicedToArray(_useState65, 2),
      err = _useState66[0],
      setErr = _useState66[1];
    var _useState67 = useState(false),
      _useState68 = _slicedToArray(_useState67, 2),
      busy = _useState68[0],
      setBusy = _useState68[1];
    var body = () => ({
      date: v.date,
      end_date: v.end_date,
      start_time: v.allDay ? null : v.start_time,
      end_time: v.allDay ? null : v.end_time,
      reason: v.reason,
      note: v.note,
      coach_id: v.coach_id || null
    });
    var check = /*#__PURE__*/function () {
      var _ref18 = _asyncToGenerator(function* () {
        setErr('');
        setBusy(true);
        try {
          setImpact((yield A.api('POST', '/api/admin/blocks', _objectSpread(_objectSpread({}, body()), {}, {
            dryRun: true
          }))).impact);
        } catch (e) {
          setErr(e.message);
        } finally {
          setBusy(false);
        }
      });
      return function check() {
        return _ref18.apply(this, arguments);
      };
    }();
    var save = /*#__PURE__*/function () {
      var _ref19 = _asyncToGenerator(function* () {
        setErr('');
        setBusy(true);
        try {
          var r = yield A.api('POST', '/api/admin/blocks', _objectSpread(_objectSpread({}, body()), {}, {
            removeOpen
          }));
          toast('Time blocked' + (r.removedOpen ? ' — ' + A.plural(r.removedOpen, 'opening') + ' removed' : ''));
          onDone();
          onClose();
        } catch (e) {
          setErr(e.message);
        } finally {
          setBusy(false);
        }
      });
      return function save() {
        return _ref19.apply(this, arguments);
      };
    }();
    var upd = x => {
      setV(_objectSpread(_objectSpread({}, v), x));
      setImpact(null);
    };
    return /*#__PURE__*/React.createElement(Dialog, {
      title: "Block time",
      onClose: onClose,
      busy: busy,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: check,
        disabled: busy
      }, "Check impact"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--primary lsl-btn--sm",
        onClick: save,
        disabled: busy || !impact
      }, "Block time"))
    }, /*#__PURE__*/React.createElement("p", {
      className: "lsl-body lsl-body--sm",
      style: {
        marginTop: 0
      }
    }, "Families can't book blocked time, and new openings can't be added inside it."), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-grid"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Reason"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: v.reason,
      onChange: e => upd({
        reason: e.target.value
      })
    }, REASONS.map(_ref20 => {
      var _ref21 = _slicedToArray(_ref20, 2),
        k = _ref21[0],
        l = _ref21[1];
      return /*#__PURE__*/React.createElement("option", {
        key: k,
        value: k
      }, l);
    }))), /*#__PURE__*/React.createElement(Field, {
      label: "From"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      value: v.date,
      onChange: e => upd({
        date: e.target.value,
        end_date: e.target.value > v.end_date ? e.target.value : v.end_date
      })
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Through"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "date",
      min: v.date,
      value: v.end_date,
      onChange: e => upd({
        end_date: e.target.value
      })
    })), multiCoach && /*#__PURE__*/React.createElement(CoachSelect, {
      value: v.coach_id,
      onChange: c => upd({
        coach_id: c
      })
    })), /*#__PURE__*/React.createElement("label", {
      className: "lsl-a-check",
      style: {
        margin: '12px 0'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: v.allDay,
      onChange: e => upd({
        allDay: e.target.checked
      })
    }), " All day"), !v.allDay && /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-grid"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Start"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "time",
      value: v.start_time,
      onChange: e => upd({
        start_time: e.target.value
      })
    })), /*#__PURE__*/React.createElement(Field, {
      label: "End"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "time",
      value: v.end_time,
      onChange: e => upd({
        end_time: e.target.value
      })
    }))), /*#__PURE__*/React.createElement(Field, {
      label: "Note (optional)"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      value: v.note,
      onChange: e => upd({
        note: e.target.value
      }),
      placeholder: "e.g. AAU tournament in Rockford"
    })), err && /*#__PURE__*/React.createElement(A.Banner, {
      tone: "danger"
    }, err), impact && /*#__PURE__*/React.createElement("div", {
      "aria-live": "polite"
    }, impact.booked.length > 0 && /*#__PURE__*/React.createElement(A.Banner, {
      tone: "warn"
    }, /*#__PURE__*/React.createElement("strong", null, A.plural(impact.booked.length, 'booked session')), " fall inside this block. They will ", /*#__PURE__*/React.createElement("strong", null, "not"), " be moved or canceled \u2014 open each booking to reschedule if needed.", /*#__PURE__*/React.createElement("ul", {
      className: "lsl-a-list"
    }, impact.booked.map(b => /*#__PURE__*/React.createElement("li", {
      key: b.id
    }, LSL.fmtDate(b.date), " \xB7 ", LSL.fmtTime(b.time))))), impact.open.length > 0 ? /*#__PURE__*/React.createElement("label", {
      className: "lsl-a-check"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: removeOpen,
      onChange: e => setRemoveOpen(e.target.checked)
    }), " Also delete the ", A.plural(impact.open.length, 'open opening'), " inside this block") : impact.booked.length === 0 && /*#__PURE__*/React.createElement(A.Banner, {
      tone: "ok"
    }, "Nothing is scheduled in this time.")));
  }
  function EditSlotDialog(_ref22) {
    var slot = _ref22.slot,
      locs = _ref22.locs,
      onClose = _ref22.onClose,
      onDone = _ref22.onDone;
    var toast = A.useToast();
    var _useState69 = useState({
        time: slot.time,
        duration: slot.duration,
        loc_id: slot.loc_id
      }),
      _useState70 = _slicedToArray(_useState69, 2),
      v = _useState70[0],
      setV = _useState70[1];
    var _useState71 = useState('one'),
      _useState72 = _slicedToArray(_useState71, 2),
      scope = _useState72[0],
      setScope = _useState72[1];
    var _useState73 = useState(false),
      _useState74 = _slicedToArray(_useState73, 2),
      busy = _useState74[0],
      setBusy = _useState74[1];
    var _useState75 = useState(''),
      _useState76 = _slicedToArray(_useState75, 2),
      err = _useState76[0],
      setErr = _useState76[1];
    var inSeries = slot.series_id && !slot.series_detached;
    var save = /*#__PURE__*/function () {
      var _ref23 = _asyncToGenerator(function* () {
        setBusy(true);
        setErr('');
        try {
          var r = yield A.api('PATCH', '/api/admin/slots/' + slot.id, _objectSpread(_objectSpread({}, v), {}, {
            scope
          }));
          toast(A.plural(r.updated, 'opening') + ' updated' + (r.kept.length ? '; ' + r.kept.length + ' left unchanged (booked or would conflict)' : ''));
          onDone();
          onClose();
        } catch (e) {
          setErr(e.message);
        } finally {
          setBusy(false);
        }
      });
      return function save() {
        return _ref23.apply(this, arguments);
      };
    }();
    return /*#__PURE__*/React.createElement(Dialog, {
      title: 'Edit ' + LSL.fmtTime(slot.time) + ' opening',
      onClose: onClose,
      busy: busy,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: onClose
      }, "Cancel"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--primary lsl-btn--sm",
        onClick: save,
        disabled: busy
      }, "Save"))
    }, /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-grid"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Start"
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "time",
      value: v.time,
      onChange: e => setV(_objectSpread(_objectSpread({}, v), {}, {
        time: e.target.value
      }))
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Length"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: v.duration,
      onChange: e => setV(_objectSpread(_objectSpread({}, v), {}, {
        duration: +e.target.value
      }))
    }, [30, 45, 60, 75, 90, 120].map(m => /*#__PURE__*/React.createElement("option", {
      key: m,
      value: m
    }, m, " min")))), /*#__PURE__*/React.createElement(Field, {
      label: "Location"
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: v.loc_id,
      onChange: e => setV(_objectSpread(_objectSpread({}, v), {}, {
        loc_id: e.target.value
      }))
    }, locs.map(l => /*#__PURE__*/React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name))))), inSeries && /*#__PURE__*/React.createElement("fieldset", {
      style: {
        border: 0,
        padding: 0,
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("legend", {
      className: "lsl-a-h4"
    }, "This opening repeats weekly"), /*#__PURE__*/React.createElement("label", {
      className: "lsl-a-check",
      style: {
        display: 'flex',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: "scope",
      checked: scope === 'one',
      onChange: () => setScope('one')
    }), " Only this occurrence"), /*#__PURE__*/React.createElement("label", {
      className: "lsl-a-check",
      style: {
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: "scope",
      checked: scope === 'future',
      onChange: () => setScope('future')
    }), " This and future occurrences (booked ones stay as they are)")), err && /*#__PURE__*/React.createElement(A.Banner, {
      tone: "danger"
    }, err));
  }

  /* Reserve an opening for one named client, or manage an existing reservation.
     The sign-up link is shown once (only a hash is stored); "New link" replaces it. */
  var HOLD_CHOICES = [[24, '24 hours'], [48, '48 hours'], [72, '3 days'], [168, '7 days']];
  var reserveLink = token => location.origin + '/training.html?reserve=' + encodeURIComponent(token) + (window.LSL_API_NAME === 'staging' ? '&api=staging' : '');
  function ReservationDialog(_ref24) {
    var slot = _ref24.slot,
      onClose = _ref24.onClose,
      onDone = _ref24.onDone;
    var app = A.useApp();
    var toast = A.useToast();
    var _A$useConfirm3 = A.useConfirm(),
      _A$useConfirm4 = _slicedToArray(_A$useConfirm3, 2),
      confirmUi = _A$useConfirm4[0],
      confirm = _A$useConfirm4[1];
    var existing = slot.reservation;
    var types = app.types.filter(t => t.active && !t.archived_at);
    var _useState77 = useState({
        name: existing ? existing.client_name : '',
        email: existing ? existing.client_email : '',
        note: existing ? existing.note : '',
        hours: existing ? 0 : 24
      }),
      _useState78 = _slicedToArray(_useState77, 2),
      v = _useState78[0],
      setV = _useState78[1];
    var _useState79 = useState(() => new Set(existing && existing.allowed_type_ids ? existing.allowed_type_ids : types.map(t => t.id))),
      _useState80 = _slicedToArray(_useState79, 2),
      ids = _useState80[0],
      setIds = _useState80[1];
    var _useState81 = useState(null),
      _useState82 = _slicedToArray(_useState81, 2),
      link = _useState82[0],
      setLink = _useState82[1]; // { url, expires } once a link exists to show
    var _useState83 = useState(false),
      _useState84 = _slicedToArray(_useState83, 2),
      busy = _useState84[0],
      setBusy = _useState84[1];
    var _useState85 = useState(''),
      _useState86 = _slicedToArray(_useState85, 2),
      err = _useState86[0],
      setErr = _useState86[1];
    var toggle = id => setIds(cur => {
      var n = new Set(cur);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    var allowed = ids.size === types.length ? null : [...ids];
    var guard = /*#__PURE__*/function () {
      var _ref25 = _asyncToGenerator(function* (fn) {
        setBusy(true);
        setErr('');
        try {
          yield fn();
        } catch (e) {
          setErr(e.message);
        } finally {
          setBusy(false);
        }
      });
      return function guard(_x6) {
        return _ref25.apply(this, arguments);
      };
    }();
    var create = () => guard(/*#__PURE__*/_asyncToGenerator(function* () {
      if (!v.name.trim()) throw new Error('Enter the client\u2019s name.');
      if (!ids.size) throw new Error('Pick at least one session type.');
      var r = yield A.api('POST', '/api/admin/reservations', {
        slot_id: slot.id,
        client_name: v.name,
        client_email: v.email,
        note: v.note,
        allowed_type_ids: allowed,
        expires_hours: +v.hours
      });
      setLink({
        url: reserveLink(r.token),
        expires: r.reservation.expires_at
      });
      onDone();
    }));
    var save = () => guard(/*#__PURE__*/_asyncToGenerator(function* () {
      if (!v.name.trim()) throw new Error('Enter the client\u2019s name.');
      if (!ids.size) throw new Error('Pick at least one session type.');
      yield A.api('PATCH', '/api/admin/reservations/' + existing.id, _objectSpread({
        client_name: v.name,
        client_email: v.email,
        note: v.note,
        allowed_type_ids: allowed
      }, +v.hours ? {
        expires_hours: +v.hours
      } : {}));
      toast('Reservation updated');
      onDone();
      onClose();
    }));
    var newLink = /*#__PURE__*/function () {
      var _ref28 = _asyncToGenerator(function* () {
        if (!(yield confirm({
          title: 'Create a new link?',
          body: 'The old link stops working. Send the new one to ' + existing.client_name + '.',
          confirmLabel: 'Create new link'
        }))) return;
        guard(/*#__PURE__*/_asyncToGenerator(function* () {
          var r = yield A.api('POST', '/api/admin/reservations/' + existing.id + '/regenerate');
          setLink({
            url: reserveLink(r.token),
            expires: r.reservation.expires_at
          });
        }));
      });
      return function newLink() {
        return _ref28.apply(this, arguments);
      };
    }();
    var release = /*#__PURE__*/function () {
      var _ref30 = _asyncToGenerator(function* () {
        if (!(yield confirm({
          title: 'Release this time?',
          body: 'The link stops working and ' + LSL.fmtTime(slot.time) + ' goes back to being open to everyone.',
          confirmLabel: 'Release time',
          danger: true
        }))) return;
        guard(/*#__PURE__*/_asyncToGenerator(function* () {
          yield A.api('POST', '/api/admin/reservations/' + existing.id + '/revoke');
          toast('Time released');
          onDone();
          onClose();
        }));
      });
      return function release() {
        return _ref30.apply(this, arguments);
      };
    }();
    var when = LSL.fmtDateLong(slot.date) + ' at ' + LSL.fmtTime(slot.time) + ' · ' + app.locName(slot.loc_id);
    if (link) {
      return /*#__PURE__*/React.createElement(Dialog, {
        title: "Sign-up link ready",
        onClose: onClose,
        footer: /*#__PURE__*/React.createElement("button", {
          className: "lsl-btn lsl-btn--primary lsl-btn--sm",
          onClick: onClose
        }, "Done")
      }, confirmUi, /*#__PURE__*/React.createElement("p", {
        className: "lsl-body lsl-body--sm",
        style: {
          marginTop: 0
        }
      }, "Send this link to ", /*#__PURE__*/React.createElement("strong", null, v.name), ". It opens the booking page with ", /*#__PURE__*/React.createElement("strong", null, when), " ready to book. They pick a session type, fill in their details, and pay."), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("input", {
        className: "lsl-input",
        readOnly: true,
        value: link.url,
        onFocus: e => e.target.select(),
        "aria-label": "Sign-up link",
        "data-autofocus": true
      }), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--primary lsl-btn--sm",
        onClick: () => A.copy(link.url, toast)
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "copy"
      }), " Copy")), /*#__PURE__*/React.createElement("p", {
        className: "lsl-a-muted lsl-a-small",
        style: {
          marginBottom: 0
        }
      }, "The time is held for them until ", A.stamp(link.expires), ", then opens to everyone. The link works for one booking. You can\u2019t view it again later, but Manage reservation \u2192 New link makes a fresh one."));
    }
    return /*#__PURE__*/React.createElement(Dialog, {
      title: existing ? 'Reservation · ' + LSL.fmtTime(slot.time) : 'Reserve ' + LSL.fmtTime(slot.time) + ' for a client',
      onClose: onClose,
      busy: busy,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, existing && /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--danger lsl-btn--sm",
        onClick: release,
        disabled: busy,
        style: {
          marginRight: 'auto'
        }
      }, "Release time"), existing && /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: newLink,
        disabled: busy
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "link"
      }), " New link"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: onClose
      }, "Cancel"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--primary lsl-btn--sm",
        onClick: existing ? save : create,
        disabled: busy
      }, existing ? 'Save' : busy ? 'Creating…' : 'Create link'))
    }, confirmUi, /*#__PURE__*/React.createElement("p", {
      className: "lsl-body lsl-body--sm",
      style: {
        marginTop: 0
      }
    }, when, ". Families see this time marked ", /*#__PURE__*/React.createElement("strong", null, "Reserved"), "; only the person with the link can book it."), /*#__PURE__*/React.createElement("div", {
      className: "lsl-a-grid"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Client name",
      required: true
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      value: v.name,
      onChange: e => setV(_objectSpread(_objectSpread({}, v), {}, {
        name: e.target.value
      })),
      "data-autofocus": true
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Client email",
      hint: "Optional. For your records; it isn't sent anything."
    }, /*#__PURE__*/React.createElement("input", {
      className: "lsl-input",
      type: "email",
      value: v.email,
      onChange: e => setV(_objectSpread(_objectSpread({}, v), {}, {
        email: e.target.value
      }))
    })), /*#__PURE__*/React.createElement(Field, {
      label: existing ? 'Extend the hold' : 'Hold the time for'
    }, /*#__PURE__*/React.createElement("select", {
      className: "lsl-select",
      value: v.hours,
      onChange: e => setV(_objectSpread(_objectSpread({}, v), {}, {
        hours: e.target.value
      }))
    }, existing && /*#__PURE__*/React.createElement("option", {
      value: 0
    }, "Keep until ", A.stamp(existing.expires_at)), HOLD_CHOICES.map(_ref32 => {
      var _ref33 = _slicedToArray(_ref32, 2),
        h = _ref33[0],
        l = _ref33[1];
      return /*#__PURE__*/React.createElement("option", {
        key: h,
        value: h
      }, existing ? 'From now: ' : '', l);
    })))), /*#__PURE__*/React.createElement("fieldset", {
      style: {
        border: 0,
        padding: 0,
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("legend", {
      className: "lsl-a-h4"
    }, "Session types they can choose"), types.map(t => /*#__PURE__*/React.createElement("label", {
      key: t.id,
      className: "lsl-a-check",
      style: {
        display: 'flex',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: ids.has(t.id),
      onChange: () => toggle(t.id)
    }), " ", t.name))), /*#__PURE__*/React.createElement(Field, {
      label: "Private note",
      hint: "Only you see this."
    }, /*#__PURE__*/React.createElement("textarea", {
      className: "lsl-input",
      rows: 2,
      value: v.note,
      onChange: e => setV(_objectSpread(_objectSpread({}, v), {}, {
        note: e.target.value
      }))
    })), err && /*#__PURE__*/React.createElement(A.Banner, {
      tone: "danger"
    }, err));
  }
  function ScopeDeleteDialog(_ref34) {
    var slot = _ref34.slot,
      onClose = _ref34.onClose,
      onDone = _ref34.onDone;
    var toast = A.useToast();
    var _useState87 = useState(false),
      _useState88 = _slicedToArray(_useState87, 2),
      busy = _useState88[0],
      setBusy = _useState88[1];
    var del = /*#__PURE__*/function () {
      var _ref35 = _asyncToGenerator(function* (scope) {
        setBusy(true);
        try {
          var r = yield A.api('DELETE', '/api/admin/slots/' + slot.id + '?scope=' + scope);
          toast(A.plural(r.deleted, 'opening') + ' deleted' + (r.kept.length ? '; ' + r.kept.length + ' booked kept' : ''));
          onDone();
          onClose();
        } catch (e) {
          toast(e.message, 'err');
        } finally {
          setBusy(false);
        }
      });
      return function del(_x7) {
        return _ref35.apply(this, arguments);
      };
    }();
    return /*#__PURE__*/React.createElement(Dialog, {
      title: "Delete a repeating opening",
      onClose: onClose,
      busy: busy,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: onClose
      }, "Cancel"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--ghost lsl-btn--sm",
        onClick: () => del('one'),
        disabled: busy
      }, "Only this one"), /*#__PURE__*/React.createElement("button", {
        className: "lsl-btn lsl-btn--danger lsl-btn--sm",
        onClick: () => del('future'),
        disabled: busy
      }, "This & future"))
    }, /*#__PURE__*/React.createElement("p", {
      className: "lsl-body lsl-body--sm",
      style: {
        marginTop: 0
      }
    }, LSL.fmtDateLong(slot.date), " at ", LSL.fmtTime(slot.time), " is part of a weekly series. Booked sessions are never deleted."));
  }
  A.tabs = A.tabs || {};
  A.tabs.AvailTab = AvailTab;
})();