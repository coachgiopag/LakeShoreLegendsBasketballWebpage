/* LakeShore Legends booking API (Cloudflare Worker + D1). */
import { HttpError, json, run, nowIso } from './lib/util.js';
import { requireUser } from './lib/auth.js';
import { getSettings } from './lib/settings.js';
import { expireHolds } from './lib/bookings.js';
import * as pub from './routes/public.js';
import * as auth from './routes/auth.js';
import * as sched from './routes/admin-schedule.js';
import * as bk from './routes/admin-bookings.js';
import * as cat from './routes/admin-catalog.js';
import * as set from './routes/admin-settings.js';
import * as rsv from './routes/admin-reservations.js';
import { stripeWebhook } from './routes/stripe.js';

const PUBLIC = [
  ['GET', /^\/api\/public\/catalog$/, (env) => pub.catalog(env)],
  ['POST', /^\/api\/public\/bookings$/, (env, req, ctx) => pub.createBooking(env, req, ctx)],
  ['POST', /^\/api\/public\/requests$/, (env, req, ctx) => pub.createRequest(env, req, ctx)],
  ['GET', /^\/api\/public\/bookings\/([a-z0-9]+)$/, (env, req, ctx, m) => pub.bookingStatus(env, m[1])],
  ['GET', /^\/api\/public\/reservations\/([A-Za-z0-9_-]+)$/, (env, req, ctx, m) => pub.reservationLookup(env, m[1])],
  ['POST', /^\/api\/public\/packages\/checkout$/, (env, req) => pub.packageCheckout(env, req)],
  ['POST', /^\/api\/auth\/login$/, (env, req) => auth.login(env, req)],
  ['POST', /^\/api\/auth\/logout$/, (env, req) => auth.logout(env, req)],
  ['GET', /^\/api\/auth\/me$/, (env, req) => auth.me(env, req)],
  ['GET', /^\/api\/auth\/setup$/, (env) => auth.setupStatus(env)],
  ['POST', /^\/api\/auth\/setup$/, (env, req) => auth.setup(env, req)],
  ['POST', /^\/api\/auth\/password$/, (env, req) => auth.changePassword(env, req)],
  ['POST', /^\/api\/stripe\/webhook$/, (env, req) => stripeWebhook(env, req)],
];

// [method, pattern, handler(env, req, user, match, url, ctx)]
const ADMIN = [
  ['GET', /^\/api\/admin\/bootstrap$/, (e, r, u) => set.bootstrap(e, r, u)],
  ['PUT', /^\/api\/admin\/settings$/, (e, r, u) => set.updateSettings(e, r, u)],
  ['POST', /^\/api\/admin\/templates\/(\w+)\/reset$/, (e, r, u, m) => set.resetTemplate(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/templates\/preview$/, (e, r, u) => bk.previewTemplate(e, r, u)],
  ['POST', /^\/api\/admin\/users$/, (e, r, u) => set.createUser(e, r, u)],
  ['PATCH', /^\/api\/admin\/users\/([\w]+)$/, (e, r, u, m) => set.updateUser(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/import-legacy$/, (e, r, u) => set.importLegacy(e, r, u)],

  ['GET', /^\/api\/admin\/schedule$/, (e, r, u, m, url) => sched.schedule(e, r, u, url)],
  ['POST', /^\/api\/admin\/slots$/, (e, r, u) => sched.createSlot(e, r, u)],
  ['POST', /^\/api\/admin\/slots\/generate$/, (e, r, u) => sched.generate(e, r, u)],
  ['PATCH', /^\/api\/admin\/slots\/(\w+)$/, (e, r, u, m) => sched.updateSlot(e, r, u, m[1])],
  ['DELETE', /^\/api\/admin\/slots\/(\w+)$/, (e, r, u, m, url) => sched.deleteSlot(e, r, u, m[1], url)],
  ['POST', /^\/api\/admin\/slots\/(\w+)\/b2b$/, (e, r, u, m) => sched.addB2B(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/slots\/(\w+)\/mark$/, (e, r, u, m) => sched.markSlot(e, r, u, m[1])],
  ['PATCH', /^\/api\/admin\/series\/(\w+)$/, (e, r, u, m) => sched.updateSeries(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/reservations$/, (e, r, u) => rsv.createReservation(e, r, u)],
  ['PATCH', /^\/api\/admin\/reservations\/(\w+)$/, (e, r, u, m) => rsv.updateReservation(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/reservations\/(\w+)\/regenerate$/, (e, r, u, m) => rsv.regenerateReservation(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/reservations\/(\w+)\/revoke$/, (e, r, u, m) => rsv.revokeReservation(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/blocks$/, (e, r, u) => sched.createBlock(e, r, u)],
  ['DELETE', /^\/api\/admin\/blocks\/(\w+)$/, (e, r, u, m) => sched.deleteBlock(e, r, u, m[1])],

  ['GET', /^\/api\/admin\/bookings$/, (e, r, u) => bk.listBookings(e, r, u)],
  ['GET', /^\/api\/admin\/bookings\/(\w+)$/, (e, r, u, m) => bk.getBooking(e, r, u, m[1])],
  ['PATCH', /^\/api\/admin\/bookings\/(\w+)$/, (e, r, u, m) => bk.patchBooking(e, r, u, m[1])],
  ['DELETE', /^\/api\/admin\/bookings\/(\w+)$/, (e, r, u, m) => bk.deleteBooking(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/attendance$/, (e, r, u, m) => bk.recordAttendance(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/payments$/, (e, r, u, m) => bk.recordPayment(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/complimentary$/, (e, r, u, m) => bk.setComplimentary(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/confirm$/, (e, r, u, m) => bk.confirmManually(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/reschedule$/, (e, r, u, m) => bk.reschedule(e, r, u, m[1])],
  ['GET', /^\/api\/admin\/bookings\/(\w+)\/cancel$/, (e, r, u, m) => bk.cancelPreview(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/cancel$/, (e, r, u, m) => bk.cancelBooking(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/resend$/, (e, r, u, m) => bk.resend(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/approve$/, (e, r, u, m) => bk.approveRequest(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/offer$/, (e, r, u, m) => bk.offerTimes(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/decline$/, (e, r, u, m) => bk.declineRequest(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/bookings\/(\w+)\/redeem$/, (e, r, u, m) => bk.redeemCredit(e, r, u, m[1])],
  ['GET', /^\/api\/admin\/payments$/, (e, r, u) => bk.listPayments(e, r, u)],

  ['POST', /^\/api\/admin\/types$/, (e, r, u) => cat.createType(e, r, u)],
  ['POST', /^\/api\/admin\/types\/verify-prices$/, (e, r, u) => cat.verifyPrices(e, r, u)],
  ['POST', /^\/api\/admin\/types\/reorder$/, (e, r, u) => cat.reorder(e, r, u, 'types')],
  ['PUT', /^\/api\/admin\/types\/(\w+)$/, (e, r, u, m) => cat.updateType(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/types\/(\w+)\/archive$/, (e, r, u, m) => cat.archiveType(e, r, u, m[1])],
  ['DELETE', /^\/api\/admin\/types\/(\w+)$/, (e, r, u, m) => cat.deleteType(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/locations$/, (e, r, u) => cat.createLocation(e, r, u)],
  ['POST', /^\/api\/admin\/locations\/reorder$/, (e, r, u) => cat.reorder(e, r, u, 'locations')],
  ['GET', /^\/api\/admin\/locations\/(\w+)\/impact$/, (e, r, u, m) => cat.locationImpact(e, r, u, m[1])],
  ['PUT', /^\/api\/admin\/locations\/(\w+)$/, (e, r, u, m) => cat.updateLocation(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/locations\/(\w+)\/archive$/, (e, r, u, m) => cat.archiveLocation(e, r, u, m[1])],
  ['DELETE', /^\/api\/admin\/locations\/(\w+)$/, (e, r, u, m) => cat.deleteLocation(e, r, u, m[1])],
  ['GET', /^\/api\/admin\/packages$/, (e, r, u) => cat.listPackages(e, r, u)],
  ['POST', /^\/api\/admin\/packages$/, (e, r, u) => cat.savePackage(e, r, u, null)],
  ['PUT', /^\/api\/admin\/packages\/(\w+)$/, (e, r, u, m) => cat.savePackage(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/packages\/(\w+)\/archive$/, (e, r, u, m) => cat.archivePackage(e, r, u, m[1])],
  ['DELETE', /^\/api\/admin\/packages\/(\w+)$/, (e, r, u, m) => cat.deletePackage(e, r, u, m[1])],
  ['GET', /^\/api\/admin\/families$/, (e, r, u, m, url) => cat.searchFamilies(e, r, u, url)],
  ['GET', /^\/api\/admin\/families\/(\w+)$/, (e, r, u, m) => cat.getFamily(e, r, u, m[1])],
  ['PATCH', /^\/api\/admin\/families\/(\w+)$/, (e, r, u, m) => cat.patchFamily(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/families\/(\w+)\/merge$/, (e, r, u, m) => cat.mergeFamily(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/families\/(\w+)\/packages$/, (e, r, u, m) => cat.grantPackage(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/family-packages\/(\w+)\/adjust$/, (e, r, u, m) => cat.adjustCredits(e, r, u, m[1])],
  ['PATCH', /^\/api\/admin\/athletes\/(\w+)$/, (e, r, u, m) => cat.patchAthlete(e, r, u, m[1])],
  ['POST', /^\/api\/admin\/athletes\/(\w+)\/merge$/, (e, r, u, m) => cat.mergeAthlete(e, r, u, m[1])],
];

function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

async function route(req, env, ctx) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '');
  for (const [method, re, h] of PUBLIC) {
    const m = re.exec(path);
    if (m && method === req.method) return h(env, req, ctx, m);
  }
  if (path.startsWith('/api/admin/')) {
    for (const [method, re, h] of ADMIN) {
      const m = re.exec(path);
      if (m && method === req.method) {
        const user = await requireUser(env.DB, req);
        return h(env, req, user, m, url, ctx);
      }
    }
  }
  if (path === '/api/health') return json({ ok: true });
  throw new HttpError(404, 'Not found.');
}

export default {
  async fetch(req, env, ctx) {
    const headers = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    let res;
    try {
      res = await route(req, env, ctx);
    } catch (e) {
      if (e instanceof HttpError) res = json({ error: e.message, ...(e.extra || {}) }, e.status);
      else {
        console.error(e && e.stack || e);
        res = json({ error: 'Something went wrong on our side. Please try again.' }, 500);
      }
    }
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
    out.headers.set('X-Content-Type-Options', 'nosniff');
    return out;
  },

  async scheduled(event, env, ctx) {
    const db = env.DB;
    const settings = await getSettings(db);
    await expireHolds(env, db, settings);
    await bk.runReminders(env, db, settings);
    await run(db, "INSERT INTO settings (key, value, updated_at) VALUES ('cron_last_run', '1', ?) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at", nowIso());
  },
};
