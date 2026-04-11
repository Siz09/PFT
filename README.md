# SmartSpend

Personal finance tracker: **offline-first SQLite**, optional **Claude** for receipt OCR and summaries, optional **Supabase** backup. See [`docs/TRD.md`](docs/TRD.md) for the full technical spec.

## Repository layout

| Path | Role |
|------|------|
| [`apps/web`](apps/web) | Vite + React + Tailwind (desktop UI embedded in **Tauri**) |
| [`apps/mobile`](apps/mobile) | **Expo SDK 51** + React Native + NativeWind (iOS / Android) |

Mobile and web share product and design direction but use **separate UI trees** (RN vs DOM). Shared types, stores, and business logic can later live under `packages/` if you add them.

## Prerequisites

- **Node.js** (LTS recommended)
- **Mobile:** Xcode (macOS) for iOS simulators; Android Studio / SDK for Android
- **Desktop (Tauri):** [Rust](https://www.rust-lang.org/tools/install) and OS-specific build tools ([Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

## Install

From the repo root:

```bash
npm install
```

Use `npm install --legacy-peer-deps` only if npm reports peer dependency conflicts in this workspace.

## Environment

- Copy [`.env.example`](.env.example) to `.env` at the repo root (optional, for shared tooling).
- For the **web** app, copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env` and set:

  - `ANTHROPIC_API_KEY` — Claude API key (TRD: OCR + AI summaries). Never commit real keys.

## Scripts (run from repo root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server for **web** (port 3000) |
| `npm run dev:web` | Same as `dev` |
| `npm run dev:mobile` | Start **Expo** (mobile) |
| `npm run dev:desktop` | **Tauri** dev shell + web dev server (requires Rust) |
| `npm run build` | Production build of **web** → `apps/web/dist` |
| `npm run build:desktop` | Tauri **release** build (uses `apps/web` build output) |
| `npm run preview` | Preview the built web app |
| `npm run lint` | Typecheck **web** and **mobile** where configured |

## Documentation

- [`docs/TRD.md`](docs/TRD.md) — architecture, stack, schema, AI pipeline
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — phased delivery plan
