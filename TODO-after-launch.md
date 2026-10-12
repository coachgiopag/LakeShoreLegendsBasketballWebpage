# LakeShore Legends — after-launch checklist

## 1. Add openings (planned for Oct 6)
Until then the booking page shows no dates; families can still use **Request Training**.

- [x] Open https://www.lakeshorelegendsbasketball.com/coach-admin.html and check there's **no orange "Test server" badge** next to your name.
- [x] Go to **Availability** and add openings. **Recurring** fills several weeks at once; **Bulk add** fills one day with back-to-back sessions.
- [x] Open the booking page (training.html) and confirm the dates show up.

- [ ] Decide on Park Ridge: only Mundelein has openings (6 slots, all 3:45 PM: Oct 13, 15, 19, 20, 22, 28), so the Park Ridge filter shows an empty calendar. Add Park Ridge openings or hide it.
- [ ] Each opening is a single slot per day, so only one family can book that day. Add more times if that's not intended.
- [ ] Bookings need 24 hours' notice, so the Oct 13 slot closes about 3:45 PM Oct 12 Central. Add later dates before the current ones run out (the 90-day booking window is not the limit; the last opening is Oct 28).

## 2. Family emails — LIVE (9/29)
Resend verified; DNS now on Cloudflare; emails send from bookings@lakeshorelegendsbasketball.com to families.
- [x] Reply-to and coach alert emails set in Settings → Notifications (test email landed in the inbox).

## 3. First real booking
- [ ] After a family pays, the booking turns **Confirmed + Paid** on its own and they land back on your training page. If it stays "Awaiting payment", ask Claude to check the server log.
- [ ] Before the paid test, confirm the Stripe checkout amounts match the site: $79.99 / $59.99 / $49.99 / $39.99 (the catalog API returns no prices, so this can only be checked in Stripe).
- [ ] For a group session, the booking shows "1 of N athletes paid" until every family has paid with the shared link (tick **Paid** by hand for cash or Venmo).

## 4. Search & AI visibility
- [ ] Google Business Profile: waiting on Google's verification. Once verified, add photos, and ask a few families for reviews. Send Claude the profile's Maps link so it can be added to the site's structured data.
- [ ] (Optional) Bing Webmaster Tools: import from Google Search Console and submit the sitemap — helps ChatGPT search.

## 5. Security housekeeping
- [ ] A GitHub personal access token (starts `ghp_kz3o`) was pasted in plain text in the old "Design: LakeShore Legends Basketball" chat (Aug 11). Revoke it at GitHub → Settings → Developer settings → Personal access tokens, if it still exists.

## Reference: booking rules carried over from the design chat (already built into api/)
- Cross-location slots on the same day keep a minimum gap between starts (default 120 min = 60 min session + 60 min travel). It is one global number in Settings, not per location pair.
- Booking or marking a slot Booked bumps or deletes conflicting slots at other locations (per Settings), including their back-to-back slots; marking it Open reverts only what that action changed.
- "Add B2B" never creates a duplicate slot at a time and location that already has one.

## Done
- [x] Stripe post-payment page: new live Payment Links send families back to training.html (9/28).
- [x] Group sessions priced per athlete; each family pays its own share (9/28).
- [x] Old JSONbin data deleted / key no longer works.
- [x] Old bookings imported (marked Paid).
- [x] Old Payment Links (…Jq00–Jq03) deactivated in Stripe (9/28).
- [x] DNS moved to Cloudflare (9/29).
- [x] Domain registration transferred GoDaddy → Cloudflare; expires Jan 9, 2028 (9/29).
- [x] Family emails live via Resend (9/29).
- [x] Housekeeping: Cloudflare auto-renew on; GoDaddy add-ons cancelled (9/29).
- [x] SEO/GEO: crawlable page text, titles, structured data, training FAQ, sitemap, robots.txt, llms.txt (9/29).
- [x] Google Search Console verified; Instagram link fixed to @coachgiopag (9/30).
- [x] Google Business Profile created as a service-area business (9/30).
