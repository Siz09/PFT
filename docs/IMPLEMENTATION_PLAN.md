# Implementation Plan
## SmartSpend — Development Roadmap (Web-First)
**Version 2.0 | April 2026**

---

## 1. Overview

Primary product is **web** (`apps/next-web`): Next.js App Router, **Supabase** (Postgres) as system of record, shared domain logic in `packages/domain`. Legacy Expo mobile and Vite reference UIs were removed from the repo; optional snapshots live under `apps/next-web/legacy/` for reference only.

Phases stay time-boxed. If a phase slips, **de-scope later phases**, not launch date.

| Phase | Name | Weeks | Exit Criteria |
|---|---|---|---|
| 1 | Foundation | 1–4 | Web app runs locally and in deploy preview; Supabase schema + categories seeded; manual transaction CRUD via API/UI shell |
| 2 | OCR & Scanning | 5–8 | Receipt image upload → server OCR → editable review → save transaction with confidence; accuracy QA on real receipts |
| 3 | AI Summaries | 9–11 | Weekly/monthly summaries generated and shown in UI; notification path defined (email/push TBD) |
| 4 | Polish & Launch | 12–14 | Charts and export working; accessibility and performance pass; production deploy + help docs |

---

## 2. Phase 1 — Foundation (Weeks 1–4)

### Week 1: Project setup

1. Next.js (App Router) + TypeScript in `apps/next-web`
2. Tailwind CSS; base shell (tabs / navigation pattern)
3. ESLint; root scripts for `lint:web` / `build:web`
4. GitHub Actions: lint + build on PR (recommended)
5. Environment: Supabase URL + anon + service role; OpenAI key for OCR route (optional until Phase 2)

### Week 2: Database & core services

1. Supabase migrations: `categories`, `transactions` (FK to categories), indexes
2. Seed default categories (Food, Transport, Health, Entertainment, Utilities, etc.)
3. `TransactionService` + types in `packages/domain`; `SupabaseTransactionRepository` in Next server layer
4. API routes: list/create transactions; list categories
5. Unit tests for domain services (`packages/domain`)

### Week 3: State & navigation

1. Client state for tabs and forms (Zustand or React state — pick one pattern and stick to it)
2. Responsive layout: mobile-first bottom nav + desktop-friendly main area
3. Core UI primitives (buttons, inputs, cards) aligned with design reference (`legacy` snapshot)
4. Theme: light/dark/system (optional stretch)

### Week 4: Transaction entry & dashboard

1. Manual add-transaction flow (all required fields + validation)
2. Transactions list with search/filter (minimum: type, category, date range)
3. Dashboard: balance summary + recent transactions (from Supabase, not mocks)
4. Settings shell (currency, profile — persist in Supabase `profiles` or app config table when added)
5. Phase 1 integration test pass + bugfix sprint

---

## 3. Phase 2 — OCR & Scanning (Weeks 5–8)

### Week 5: Capture & upload

1. Browser capture (`capture` on file input) + file upload fallback
2. Client-side image pipeline: max width 1024px, JPEG ~85% before upload
3. `ScannerView` UX: choose image → processing state → review
4. PDF: optional later (vision models differ; track as follow-up)
5. Clear errors for permission denial, unsupported type, oversize file

### Week 6: OCR pipeline (server)

1. OpenAI vision (or equivalent) via **server-only** API route — no secrets in browser
2. `OCRService` in `packages/domain`: JSON parse, validation, confidence scoring
3. OCR system/user prompts versioned in code (`ocrPrompt.ts`)
4. Regression tests on parser + synthetic corpus; expand to real images in Week 8

### Week 7: Flow polish

1. Loading and error states on scan screen
2. End-to-end scan → review → save (writes `ocr_confidence`, receipt reference)
3. Optional: Supabase **Storage** bucket for receipt blobs; DB stores path/URL (filename-only is a temporary approach)
4. Edge cases: no text, bad JSON, API timeout, rate limits — user sees actionable message + manual entry fallback

### Week 8: Scanning QA

1. Accuracy across receipt types (supermarket, restaurant, utilities, fuel)
2. Tune prompts/parsing until **>90%** field accuracy on a fixed **real** test set (not only synthetic JSON)
3. Short user tests (target 5 users) on web
4. Regression: Phase 1 flows still pass

**Note:** On-device/offline OCR (ML Kit, etc.) is **out of scope** for the web primary path; revisit only if a native client returns.

---

## 4. Phase 3 — AI Summaries (Weeks 9–11)

### Week 9: Summary service

1. `AIService.buildSummaryPayload()` — aggregate transactions to structured JSON
2. Weekly and monthly prompt templates + tests
3. `generateWeeklySummary()` / `generateMonthlySummary()` (server-side)
4. Store rows in `ai_summaries` (add migration when implementing)

### Week 10: Summary UI & scheduling

1. `SummaryCard` on dashboard; full summary screen (overview, categories, anomalies, tips)
2. `InsightList` for tips
3. Scheduling: Supabase **pg_cron**, Edge Function, or external worker — pick one; document choice
4. Notifications: web push and/or email (mobile push only if native app exists)

### Week 11: Budget alerts & reports

1. `BudgetService.getStatus()` per category
2. Budget UI: `BudgetCard`, `GoalCard`
3. Budget alerts (in-app first; email/push optional)
4. Reports screen: date range + chart type
5. Charts: **Recharts** (web). Victory Native only applies if RN client ships later.

---

## 5. Phase 4 — Polish & Launch (Weeks 12–14)

### Week 12: Advanced features & export

1. `ExportService`: CSV + JSON with filters
2. Recurring transactions (job + UI)
3. Bulk select / edit / delete on transactions
4. Advanced filters (amount range, multi-category)

### Week 13: Performance, security & accessibility

1. Postgres query review — indexes, explain plans for hot paths
2. **RLS** on user-owned data; service role only for admin/server tasks; document threat model
3. Optional: row-level encryption or field encryption for sensitive columns (if required by threat model)
4. Accessibility: keyboard nav, focus order, labels on interactive controls
5. Performance: LCP, API latency, bundle size (see TRD targets)

### Week 14: QA & launch

1. Full regression on **supported browsers** + mobile browsers
2. Fix P1/P2 bugs
3. Production deploy (e.g. Vercel) + env configuration
4. User-facing help / FAQ
5. App store / Play Store **only if** native apps are in scope again; otherwise omit

---

## 6. Task priority matrix

| Priority | Definition | Examples |
|---|---|---|
| P0 — Blocker | Cannot ship web MVP | Supabase connected; auth/data isolation story; manual transactions |
| P1 — Critical | Core value | OCR scan pipeline; summaries; budgets |
| P2 — Important | Strong UX lift | Charts, bulk ops, export, recurring |
| P3 — Nice to have | v1.1 | Native apps, widgets, social sharing |

---

## 7. Dependencies & risks

| Dependency | Risk | Mitigation |
|---|---|---|
| OpenAI (or other vision API) | Downtime / rate limits | Retries, timeouts, clear errors; manual entry always available |
| Supabase | RLS misconfiguration | Test with anon key; least-privilege policies |
| OCR accuracy | Messy receipts | Human review step; iterative prompt + parser tuning |
| Scope creep | Rebuilding old mobile stack | Web-first until MVP proven; native later if needed |

---

## 8. Definition of done

A feature is done when:

- [ ] Code reviewed and merged to `main`
- [ ] Unit tests pass for changed domain logic (`packages/domain` where applicable)
- [ ] Feature verified in **production-like** env (staging or preview) with real Supabase project
- [ ] New UI controls have accessible names / labels where applicable
- [ ] No new P0/P1 bugs in regression pass for touched flows
- [ ] Design aligned with frontend guideline (see `docs/FRONTEND_GUIDLINE.md` if present)
