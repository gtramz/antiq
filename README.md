# ANTIQ

Artist funding platform — explore projects and fund artists. Mobile-first web app with a desktop layout (≥1024px): top nav, wider content, same brand and flows.

## Quick start

```bash
pnpm install   # or: npx pnpm@9.15.0 install
pnpm --filter @antiq/nebula build
pnpm --filter @antiq/types build
pnpm --filter @antiq/web dev
```

App: http://localhost:3020

Port **3020** is reserved for antiq (keeps clear of dare-market `:3000` and Zero `:3010` / `:4000` / `:8081`).

## Routes

- `/` — Landing (logo + Log in / Create account)
- `/explore` — Discover feed (guest OK on desktop; mobile requires session)
- `/login` · `/register` — Auth forms (Back → landing)
- `/profile` — Role home (artist dashboard or investor wallet)
- `/search` — Search artists & projects
- `/project/[id]` — Project detail + fund sheet
- `/artist/[id]` — Artist profile (edit, add projects, connect)
- `/pledges` — Your pledges
- `/pledges/receipt` — Pledge confirmation

## Database (Neon Postgres)

Set `DATABASE_URL` in `apps/web/.env.local` (gitignored). Then:

```bash
pnpm --filter @antiq/web db:migrate   # apply db/schema.sql
# or: curl http://localhost:3020/api/health/db
```

## Auth / API

Set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` to your backend base URL.

Expected endpoints (service layer):

- `GET /api/users/lookup?email=` → `{ exists, data? }`
- `POST /api/auth/login` → `{ user, token }`
- `POST /api/auth/register/artist` → `{ user, token }`
- `POST /api/auth/register/investor` → `{ user, token }`
- `GET /api/auth/me` (Bearer) · `PATCH /api/auth/me` · `POST /api/auth/logout`

## Getting started

1. Configure `NEXT_PUBLIC_API_URL`, then open `/register`
2. Artists: email lookup may open **Link Account** if the user exists in Antiq
3. Role home is `/profile` (artist dashboard or investor wallet)
