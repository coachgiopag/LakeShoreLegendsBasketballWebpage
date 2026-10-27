# LakeShore Legends — after-launch checklist

## 1. Add openings (planned for Oct 6)
Until then the booking page shows no dates; families can still use **Request Training**.

- [x] Open https://www.lakeshorelegendsbasketball.com/coach-admin.html and check there's **no orange "Test server" badge** next to your name.
- [x] Go to **Availability** and add openings. **Recurring** fills several weeks at once; **Bulk add** fills one day with back-to-back sessions.
- [x] Open the booking page (training.html) and confirm the dates show up.

- [x] (Gio: done 10/15) Decide on Park Ridge: only Mundelein has openings (6 slots, all 3:45 PM: Oct 13, 15, 19, 20, 22, 28), so the Park Ridge filter shows an empty calendar. Add Park Ridge openings or hide it.
- [x] (Gio: done 10/15) Each opening is a single slot per day, so only one family can book that day. Add more times if that's not intended.
- [x] (Gio: done 10/15) Bookings need 24 hours' notice, so the Oct 13 slot closes about 3:45 PM Oct 12 Central. Add later dates before the current ones run out (the 90-day booking window is not the limit; the last opening is Oct 28).

## 2. Family emails — LIVE (9/29)
Resend verified; DNS now on Cloudflare; emails send from bookings@lakeshorelegendsbasketball.com to families.
- [x] Reply-to and coach alert emails set in Settings → Notifications (test email landed in the inbox).

## 3. First real booking
- [x] (Gio confirmed a real paid booking worked, 10/12–10/15) After a family pays, the booking turns **Confirmed + Paid** on its own and they land back on your training page. If it stays "Awaiting payment", ask Claude to check the server log.
- [x] (Gio confirmed the charge for the booked service equaled the site price exactly; the other Payment Links are not individually verified.) Stripe checkout amounts vs site: $79.99 / $59.99 / $49.99 / $39.99 (the catalog API returns no prices, so this can only be checked in Stripe).
- [ ] For a group session, the booking shows "1 of N athletes paid" until every family has paid with the shared link (tick **Paid** by hand for cash or Venmo).

## 4. Search & AI visibility
- [x] Google Maps link added to the site (sameAs, footer, contact page; live 10/15).
- [x] (Gio: done 10/15) Google Business Profile: confirm it shows as verified; add photos and ask a few families for reviews. (Review link already added to the site footer and Contact page, 10/15.)
- [ ] Add the Maps and review links (https://g.page/r/CeoRNxuepZVaEBM/review) to the family confirmation email (this edits the booking Worker, so it needs a staging test first).
- [x] (Gio: done 10/15) (Optional) Bing Webmaster Tools: import from Google Search Console and submit the sitemap — helps ChatGPT search.

## 5. Security housekeeping
- [x] (Gio deleted the one classic token found, Oct 2026; account lists otherwise empty) A GitHub personal access token (starts `ghp_kz3o`) was pasted in plain text in the old "Design: LakeShore Legends Basketball" chat (Aug 11). Revoke it at GitHub → Settings → Developer settings → Personal access tokens, if it still exists.

## Reference: booking rules carried over from the design chat (already built into api/)
- Cross-location slots on the same day keep a minimum gap between starts (default 120 min = 60 min session + 60 min travel). It is one global number in Settings, not per location pair.
- Booking or marking a slot Booked bumps or deletes conflicting slots at other locations (per Settings), including their back-to-back slots; marking it Open reverts only what that action changed.
- "Add B2B" never creates a duplicate slot at a time and location that already has one.

## 6. Reserved times (LIVE 10/27)
Coach reserves an opening for one client and sends them a private link (Availability tab → **Reserve**).
- [x] Production migration + Worker deploy, then site merged (10/27). Live checks passed; booking path unchanged for families.
- [ ] First real use: reserve a time for yourself, open the link, and pay it with a real card (or test it by booking a time you'd take anyway). Then confirm it turns Confirmed + Paid and the email arrives.
- [ ] Optional: add the reserve link to a client email template (needs a Worker change).

## 7. Calendar updates (LIVE 10/28)
- [x] Public calendar shows past days with their real booked sessions (last ~3 months; never unbooked openings).
- [x] Add B2B offers Before / "Add buffer time?" (15–90 min) / After.

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
