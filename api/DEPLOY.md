# Booking API — setup & deployment

The site (`docs/`) stays on GitHub Pages. Bookings, payments, coach logins and
settings live in a Cloudflare Worker + D1 database. Secrets are stored only as
Worker secrets — never in the site's code.

There are two servers:
- **staging** — test server. Stripe *test mode*, emails redirected to you, its own database.
- **production** — the real one, used by families.

Always deploy and test on staging first. Run commands from the `api/` folder.

## Part A — Test server (staging)

1. `npx wrangler login` — approve in the browser.
2. `npx wrangler d1 create lsl-booking-staging` → paste the printed
   `database_id` into `wrangler.toml` under `[[env.staging.d1_databases]]`.
3. `npm run migrate:staging` — creates the tables.
4. `npx wrangler secret put SETUP_TOKEN --env staging` — type any long phrase.
5. `npm run deploy:staging` → note the URL
   (`https://lsl-booking-api-staging.<subdomain>.workers.dev`). Put it in
   `docs/js/config.js` (`staging`) and in `wrangler.toml` as the staging
   `API_PUBLIC_URL`, then `npm run deploy:staging` again.
6. Stripe, **Test mode** on:
   - Create test Payment Links for your four sessions (same prices).
   - Developers → Webhooks → Add endpoint: `<staging URL>/api/stripe/webhook`,
     events `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
   - `npx wrangler secret put STRIPE_WEBHOOK_SECRET --env staging` — paste the `whsec_…`.
7. Open the site locally with `?api=staging`
   (`http://localhost:8080/coach-admin.html?api=staging`), create your
   director login with the SETUP_TOKEN, and paste the **test** Payment Links
   into Sessions & Links.
8. Test: add openings → book on `training.html?api=staging` → pay with card
   `4242 4242 4242 4242` → the booking turns Confirmed + Paid. Also try an
   abandoned checkout (wait 10 minutes → time reopens), cancel, reschedule,
   and the old-data import.

## Part B — Production

Same steps without `--env staging`: `npx wrangler d1 create lsl-booking`
(paste id in the top `[[d1_databases]]`), `npm run migrate:remote`, secrets
without `--env`, `npm run deploy`, live-mode Stripe webhook, `production` URL
in `docs/js/config.js`. Then merge the branch to `main` (this updates the live
site), create the director login, import the old data, and delete the old
JSONbin bin / regenerate its key.

## Email (optional)

Create a Resend account, verify `lakeshorelegendsbasketball.com` (DNS records
at GoDaddy), set `EMAIL_FROM`, then `npx wrangler secret put RESEND_API_KEY`.
Keep `EMAIL_MODE = "redirect"` with `EMAIL_REDIRECT_TO` = your address until
you want families to receive emails, then set `EMAIL_MODE = "live"`.

## How payments are matched

Families use your Stripe Payment Links. The time is held (10 minutes by
default) and the family is sent to the link with
`?client_reference_id=<booking id>`. Stripe returns that id with the payment,
and the webhook marks that booking paid. Nothing is marked paid by the browser.

## Local development

```
npm install && npm run migrate:local && npm run dev   # API on :8787
npm test                                             # end-to-end tests, fake data
```
Rebuild site JSX with `npm run build` from the repo root.

## Reserved times (coach reserves a time for one client)

Adds a `reservations` table (migration `0004_reservations.sql`) and the admin and
public endpoints behind **Reserve** on the Availability tab. Deploy the Worker
**before** merging the site changes, or the dashboard button will call an API that
doesn't exist yet.

Staging first (from `api/`):
1. `npm run migrate:staging`
2. `npm run deploy:staging`
3. Open `coach-admin.html?api=staging`, pick an opening, click **Reserve**, copy the link.
4. Open the link (it already carries `&api=staging`): the time is preselected, only the
   allowed session types show, and booking goes to Stripe **test** checkout.
5. Check that a normal visitor sees the time marked **Reserved** and cannot book it.

Production, once staging looks right:
1. `npm run migrate:remote`
2. `npm run deploy`
3. Merge the site changes (`docs/`) so the page and dashboard use the new endpoints.

Automated checks (local `npm run dev` running): `npm run test:reservations`.
