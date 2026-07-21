# Mentorque — Mentoring Call Scheduling (Frontend)

Vite + React + Tailwind. Three role-scoped dashboards over the scheduling API.

## Setup

Start the backend first (it serves on `:5000`), then:

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

`VITE_API_URL` is empty by default, so `/api` calls go through the Vite dev proxy to
`localhost:5000` — same origin, no CORS to configure locally. Set it to an absolute URL only
when the API is deployed elsewhere.

## Sign in

Each role has its own page. Signing in on the wrong one is rejected by the server (the page
sends `expectedRole`), so the separation is real rather than cosmetic.

| Page | Account | Password |
|---|---|---|
| `/login/admin` | `admin@mentorque.dev` | `admin1234` |
| `/login/mentor` | `priya@mentorque.dev` | `mentor1234` |
| `/login/user` | `ananya@mentorque.dev` | `user1234` |

## Routes

| Path | Role | Purpose |
|---|---|---|
| `/dashboard` | USER | Availability grid, profile editor, request a call |
| `/mentor` | MENTOR | Availability grid, read-only profile |
| `/admin` | ADMIN | Request queue |
| `/admin/requests/:id` | ADMIN | Ranked mentors → shared slots → book |
| `/admin/mentors` | ADMIN | Mentor metadata editor + their availability |
| `/admin/mentees` | ADMIN | Mentee profiles + their availability |
| `/admin/meetings` | ADMIN | Booked calls |

Route guards are UX only — every route is independently enforced server-side, so a tampered
`localStorage` role gets a 403 from the API rather than data.

## Structure

```
src/
├── constants/        roles.js, taxonomy.js   — single source for role and vocabulary literals
├── api/              one module per resource over a shared fetch wrapper
├── context/          AuthContext
├── components/
│   ├── ui/           Modal, Bits (Tag, StatusBadge, TagPicker, EmptyState, notes)
│   ├── AvailabilityDashboard.jsx   — 24h × 7d drag-paint grid (reused by all three roles)
│   ├── LoginForm.jsx               — shared by the three login pages
│   ├── Layout.jsx, MqSelect.jsx, MentorqueLogo.jsx
└── pages/            UserDashboard, MentorDashboard, login/*, admin/*
```

`AvailabilityDashboard` is parameterised by `role`, `viewAs`, `readOnly` and `embedded`, so
the same component serves the user's own grid, the mentor's own grid, and the admin's view
of anyone else's.

Styling is the `mq-*` component layer in `src/index.css` (dark-mode only). Note the palette
is inverted: `primary-600` is near-white.

## Notes on the refactor

Removed the external SSO flow (`Welcome` → `SSO` → token-in-URL), the dead `Availability`,
`Register` and unrouted `Login` pages, the Google Calendar settings page, and the unused
`VITE_SUPABASE_*` variables.

Fixed along the way:

- **Timezone display bug** — `utils/time.js` mapped the "UTC" option to `Europe/Dublin`,
  which observes Irish Summer Time. From late March to late October the grid labelled
  "GMT+0" rendered every slot **one hour off** from what the backend stores.
- **`AuthContext.login` never wrote `userRole`**, but `client.js` read it to pick the 403
  redirect target. Latent under SSO; it would have become live on the JWT login path.
- **Dual storage** — the app picked `sessionStorage` or `localStorage` depending on which
  already held a token, so different code paths could write to different places. Now one.
- **`client.js` spread `...options` after `method`/`headers`/`body`**, so a caller could
  silently override them; and `get/post/put/del` never forwarded options at all.
- **Auto-delete of past meetings** — the old admin dashboard ran a 60-second interval that
  hard-deleted every meeting whose end time had passed. Booking history is now kept.
- **A synthesised-user fallback** let a URL-supplied role stand in for a real session when
  `/me` failed.
