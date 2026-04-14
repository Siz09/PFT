# SmartSpend

Web-first personal finance tracker.

## Project Layout

- [`apps/next-web`](apps/next-web): Web-first app (Next.js + Supabase + OCR API routes)
- [`apps/next-web/legacy`](apps/next-web/legacy): copied legacy source snapshots from old mobile/web apps for reference

## Prerequisites

- Node.js `20.19.4` (recommended)

## Root Convenience Scripts

From repo root:

- `npm run dev:web`
- `npm run lint:web`
- `npm run build:web`

## Web Setup (Next.js + Supabase)

```bash
cd apps/next-web
npm install
cp .env.example .env.local
```

Set values in `apps/next-web/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (optional, needed for online OCR route)

Run web app:

```bash
cd apps/next-web
npm run dev
```
