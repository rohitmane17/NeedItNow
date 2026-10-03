# NeedItNow

A 24-hour request board for VIT Pune students — borrow an item, find a lab partner, grab notes before a deadline, or ask for an extra pair of hands. **Every request disappears exactly 24 hours after it is posted.**

**Live demo:** https://needitnow-delta.vercel.app
(deployed on Vercel in **Demo data** mode — it switches to live Supabase as
soon as `VITE_SUPABASE_*` environment variables are set)

**PRN #7 — "Forgetful"** is enforced in three places, not one:

| Layer | Enforcement |
| --- | --- |
| UI | Every card renders a live countdown + lifetime progress bar and unmounts the moment `expires_at` passes; the list re-purges on a 60s timer. |
| API queries | `listRequests()` always issues `.gt('expires_at', now)`; `claimHelp()` re-checks it before updating. |
| Database | RLS `SELECT USING (expires_at > NOW())`, a `CHECK` constraint, an `BEFORE INSERT OR UPDATE` trigger, `delete_expired_requests()` called by the client every 60s, and an optional `pg_cron` hourly job. |

## Tech stack

- **Frontend:** React 19 + Vite, Tailwind CSS v4, lucide-react, date-fns
- **Backend:** Supabase (PostgreSQL + Row Level Security)
- **Hosting:** Vercel

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The app boots in **Demo data** mode until Supabase credentials exist: a seeded
localStorage store that mirrors the same 24-hour rules, so the full UI is usable
immediately.

### Going live with Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/migrations/0001_init.sql` in full
   (table, RLS policies, expiry trigger, `delete_expired_requests()` and
   `increment_helper_count`).
3. Copy `.env.example` to `.env.local` and fill in the values from
   **Project Settings → API**:

   ```
   VITE_SUPABASE_URL=https://<project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```

4. Restart `npm run dev` — the header badge flips from *Demo data* to *Live*.

Optional backstop: enable the `pg_cron` extension and schedule
`SELECT delete_expired_requests();` hourly (snippet at the bottom of the
migration). The client already runs that purge on mount and every 60 seconds.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + production bundle |
| `npm run preview` | Serve the production bundle locally |
| `npm run lint` | Oxlint (React hooks + TypeScript rules) |

## Project structure

```
src/
  components/        Header, FilterBar, RequestCard, RequestFormModal, EmptyState, Toast
  hooks/             useNow (ticking clock), useRequests (list + expiry + mutations)
  lib/
    api.ts           Single data layer — live Supabase or demo store
    supabase.ts      Client + `isSupabaseConfigured` detection
    demoStore.ts     localStorage twin of the Postgres rules (dev fallback)
    time.ts          24h lifetime helpers (countdown, progress, relative dates)
    types.ts         Request model, categories, locations, styles
supabase/
  migrations/0001_init.sql   Schema, RLS, cleanup function, helper RPC
```

## Testing

### Automated checks (all run locally against the final build)

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | 0 warnings, 0 errors (oxlint, React hooks + TS rules) |
| Types + production build | `npm run build` | `tsc -b` clean, Vite bundle with no warnings |
| Dependency integrity | `npm ls --depth=0` | no missing, invalid or conflicting packages |
| Bundle integrity | inspect `dist/` | every asset referenced by `index.html` is present |
| Runtime smoke test | `npm run preview` + headless Chrome | page renders all cards and live countdowns, **0 console errors** |

### Two-user testing

Manual walkthrough performed by two testers on a fresh browser profile (demo
data mode), covering the paths automation cannot judge:

| # | Flow | Tester 1 | Tester 2 |
| --- | --- | --- | --- |
| 1 | Post a request and see it appear at the top of the feed | ☑ | ☑ |
| 2 | Validation: short title / missing contact rejected with a clear message | ☑ | ☑ |
| 3 | Search + category + location filters narrow the list correctly | ☑ | ☑ |
| 4 | Countdown ticks every second; progress bar fills as 24h elapses | ☑ | ☑ |
| 5 | "I'll help" increments the counter optimistically | ☑ | ☑ |
| 6 | Contact info copies to the clipboard in one tap | ☑ | ☑ |
| 7 | Request becomes unreachable after expiry (empty state explains why) | ☑ | ☑ |
| 8 | Mobile width (360px): no horizontal scroll, cards readable | ☑ | ☑ |

**Findings**

- **Tester 1 — first-year CS student:** the expiration timer was a bare
  `22h 29m left` with nothing saying what happens at zero. Clarified the
  timer labels: the card now reads **"Expires in …"**, carries a tooltip and
  an `aria-label` stating the request is deleted automatically 24 hours
  after posting, and the empty state explains why old requests vanish.
- **Tester 2 — third-year Mechanical student:** wanted immediate feedback
  when tapping "I'll help" instead of waiting on the network. Confirmed
  shipped: optimistic helper state (rolled back if the request expired
  mid-flight) plus toast alerts for both "I'll help" and posting a request.
- Resolved before submission: timer-label clarity (Tester 1) →
  `RequestCard.tsx`; instant feedback (Tester 2) → optimistic update +
  `Toast.tsx`.

## AI disclosure

This project was produced for the MLSC pre-interview task with AI assistance:
a Codebuff agent (Freebuff) generated the implementation — Vite + React +
Tailwind scaffolding, the Supabase schema and RLS policies, the data layer, and
the component UI.

The author reviewed every file, supplied the project requirements and schema,
and ran the verification suite above (lint, type-check, production build and a
headless-browser smoke test) before committing. All AI-generated code was held
to the same standard as hand-written code: no placeholders, no skipped logic.

## Deploying to Vercel

The repo ships with a `vercel.json` (framework: Vite, build: `npm run build`,
output: `dist`), so a Vite preset is auto-detected either way.

**Dashboard:** Add New → Project → import `rohitmane17/NeedItNow` → Deploy.
With no `VITE_SUPABASE_*` variables set the site boots in **Demo data** mode,
which is the expected default for a first deploy.

**CLI:**

```bash
npx vercel login          # once, opens the browser
npx vercel --prod --yes    # from the repo root
```

Or with a token from vercel.com/account/tokens:

```bash
npx vercel link --yes --project needitnow
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```

**After the first deploy**, add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` under **Settings → Environment Variables**
(Production + Preview) to switch from demo data to live Postgres, then
redeploy. The anon key is safe to expose: RLS is the actual security
boundary — anonymous users can only see unexpired rows.
