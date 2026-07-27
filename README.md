# Hot Off The Press — prototype

A live-streamed physical prize draw. Tickets are sold for the **next** edition;
the drum decides the **current** one, on camera, digit by digit.

This is a working prototype, not a launch build. The logic is real; the money
is not.

## What is real

- **Money is integer pence** end to end. Price is read from the database on
  every purchase, never from the form.
- **Sales close on server time.** `hotp_purchase` compares `now()` in Postgres
  against `sales_close_at` and refuses late orders. No client clock, no stream
  position. The countdown measures the browser's offset against the server and
  reports it; it does not decide anything.
- **Wheel outcomes are decided in Postgres** with `gen_random_bytes` and
  rejection sampling (flat distribution, no modulo bias), in the same
  transaction as the cap checks. Never `Math.random()`, never in the browser.
  The animation walks towards a result that already exists.
- **The wheel's expected value is enforced by a database trigger.** A config
  whose probabilities don't sum to exactly 1.000000, or whose EV exceeds the
  ceiling, is *refused* — not warned about. Try it in the admin area.
- **Spins are earned, never sold.** They arrive with tickets, paid or postal.
- **Caps.** Per-user spins per edition, and a per-edition ceiling on free
  tickets. On hitting the giveaway cap the wheel still turns but can only land
  on outcomes that cost nothing.
- **Ticket allocation is atomic** — the draw row is locked for the duration.
- **Void attempts are kept.** A drawn number of 0000, or above the tickets
  actually sold, voids the attempt and is published alongside the valid one.

## What is stubbed

| Thing | State | Where to change it |
|---|---|---|
| Payments | Mock provider, identical code path | `lib/payments.ts` |
| Stream | CSS test card | set `stream_url` on a draw (admin) |
| Live updates | 2.5s polling | `components/LiveRoom.tsx` |
| Auth | Signed cookie + bcrypt in Postgres | `lib/session.ts` |
| Postal address | Placeholder copy | `app/how-it-works/page.tsx` |

## Demo accounts

| | Email | Password |
|---|---|---|
| Punter | `demo@hotoffthepress.co.uk` | `demo1234` |
| Operator | `admin@hotoffthepress.co.uk` | `admin1234` |

One-click entrances are on `/sign-in`.

## Walking a client through it

1. **Front page** — Edition 14 on sale, server-driven countdown, ticket picker
   with live odds, skill question. Buy some.
2. **Live room** (`/live`) — Edition 13, in the TV. The sidebar sells Edition
   14, with the reason printed on it.
3. **Admin** (`/admin`) — press **Turn the drum** four times. Watch the live
   room in another tab: digits land in the caption strip and the punter's
   numbers light up. Expect a void or two; that is the format working.
4. **The wheel** — spin it. Most spins lose, and the odds say so on screen.
5. **The refusal** — in the wheel editor, press *Load the brief's example
   table*, save, and watch the database refuse it.
6. **Rehearse again** — *Reset the demo* puts Edition 13 back to ready.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · Postgres on
Supabase. Tables and functions are prefixed `hotp_`. All access goes through
`SECURITY DEFINER` functions gated by `HOTP_APP_SECRET`; RLS is on with no
policies, so the anon key on its own reaches nothing.

## Before this takes real money

1. Move `.env.production` into Vercel environment variables and delete the file.
2. Rotate both secrets:
   ```sql
   update hotp_app_secret
   set secret_hash = extensions.crypt('<new>', extensions.gen_salt('bf', 10));
   ```
3. Implement `StripeProvider.charge()` as a Checkout Session and move ticket
   allocation behind the `checkout.session.completed` webhook.
4. Replace polling with Supabase Realtime or SSE.
5. Fetch a fresh skill question per purchase attempt rather than per page load.
6. Publish real terms, the postal address, and the redraw rule before sale.
7. Delete `hotp_admin_reset_demo` — on a live draw it destroys the evidence.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the four values
npm run dev
```
