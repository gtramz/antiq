# ANTIQ

Artist funding platform — explore projects and fund artists. Mobile-first web MVP with a desktop layout (≥1024px): top nav, wider content, same brand and flows.

## Quick start

```bash
pnpm install   # or: npx pnpm@9.15.0 install
pnpm --filter @antiq/nebula build
pnpm --filter @antiq/types build
pnpm --filter @antiq/web dev
```

App: http://localhost:3020

Port **3020** is reserved for antiq (keeps clear of dare-market `:3000` and Zero `:3010` / `:4000` / `:8081`).

## MVP routes

- `/` — Discover feed
- `/project/[id]` — Project detail + fund sheet
- `/artist/[id]` — Artist profile
- `/pledges` — Your pledges
- `/pledges/receipt` — Mock pledge confirmation
