# Implementation Plan
## SmartSpend — 14-Week Development Roadmap
**Version 1.0 | March 2026**

---

## 1. Overview

The implementation is divided into 4 phases over 14 weeks. Each phase ends with a working, testable milestone. Treat each phase boundary as a soft release candidate — if a phase slips, later phases are de-scoped rather than delayed, as launch date is fixed.

| Phase | Name | Weeks | Exit Criteria |
|---|---|---|---|
| 1 | Foundation | 1–4 | App launches on iOS, Android, and desktop with SQLite working and manual transaction entry functional |
| 2 | OCR & Scanning | 5–8 | Receipt scanning returns accurate pre-filled transactions; offline Tesseract fallback working |
| 3 | AI Summaries | 9–11 | Weekly and monthly summaries generated and displayed; push notifications delivered |
| 4 | Polish & Launch | 12–14 | All charts rendering; export working; app store submissions accepted; performance targets met |

---

## 2. Phase 1 — Foundation (Weeks 1–4)

### Week 1: Project Setup

1. Initialise React Native + Expo project with TypeScript
2. Configure Tauri project sharing the same React source
3. Set up Tailwind CSS / NativeWind
4. Configure ESLint, Prettier, and Husky pre-commit hooks
5. Set up GitHub Actions: lint + test on PR
6. Create placeholder screens for all 5 navigation tabs

### Week 2: Database & Core Services

1. Implement `DatabaseManager` with SQLite init and migration runner
2. Write schema migrations: transactions, categories, budgets, goals, ai_summaries
3. Seed default categories (Food, Transport, Health, Entertainment, etc.)
4. Implement `TransactionRepository` (raw SQL layer)
5. Implement `TransactionService` (business logic layer)
6. Write unit tests for TransactionService

### Week 3: State & Navigation

1. Set up Zustand stores: `SettingsStore`, `UIStore`
2. Implement React Navigation structure (Stack + Bottom Tabs)
3. Implement desktop Tauri sidebar navigation
4. Build core UI components: Button, Card, Modal, Input, Badge, AmountDisplay
5. Implement theme system (light/dark/system)

### Week 4: Transaction Entry & Dashboard

1. Build `TransactionForm` with all fields and validation
2. Build `TransactionCard` component
3. Implement Transactions screen with list, search, and basic filter
4. Build Dashboard screen: balance summary, recent transactions
5. Implement Settings screen (currency, theme, profile name)
6. Phase 1 integration test and bug fix sprint

---

## 3. Phase 2 — OCR & Scanning (Weeks 5–8)

### Week 5: Camera Integration

1. Integrate Expo Camera with document edge detection guide overlay
2. Implement image compression pipeline (max 1024px, JPEG 85%)
3. Build `ScannerView` component with capture and gallery import
4. Implement PDF import via Expo DocumentPicker
5. Handle camera permission flow with graceful denial state

### Week 6: Claude OCR Pipeline

1. Implement Claude API client (typed, with retry and timeout)
2. Implement `OCRService.scanWithClaude()` with JSON response parsing
3. Write OCR system prompt and test against 20+ sample receipts
4. Implement confidence scoring and field validation
5. Build `OCRReviewForm` (pre-filled, editable, confidence indicator)

### Week 7: Tesseract Fallback & Flow Polish

1. Integrate Tesseract.js as offline OCR fallback
2. Implement connectivity detection (online/offline switching)
3. Build loading animation for OCR processing screen
4. Complete full scan-to-save flow end to end
5. Handle edge cases: blurry image, no text detected, network failure

### Week 8: Scanning QA

1. Test OCR accuracy across receipt types: supermarket, restaurant, utility bills, fuel
2. Run OCR test suite; tune prompt until >90% field accuracy achieved
3. User test scanning flow with 5 target users
4. Fix usability issues identified in user tests
5. Phase 2 regression test — ensure Phase 1 features unbroken

---

## 4. Phase 3 — AI Summaries (Weeks 9–11)

### Week 9: Summary Service

1. Implement `AIService.buildSummaryPayload()` — aggregate transactions to JSON
2. Write and test weekly summary prompt template
3. Write and test monthly summary prompt template
4. Implement `AIService.generateWeeklySummary()` and `generateMonthlySummary()`
5. Store summaries in `ai_summaries` table

### Week 10: Summary UI & Scheduler

1. Build `SummaryCard` component (teaser on Dashboard)
2. Build full AI Summary screen (overview, categories, anomalies, tips)
3. Build `InsightList` component for tips display
4. Implement `SummaryJob` scheduler (Expo Background Fetch + Tauri cron sidecar)
5. Implement `NotificationService` for summary-ready push notifications

### Week 11: Budget Alerts & Reports

1. Implement `BudgetService.getStatus()` with per-category calculations
2. Build Budget screen with `BudgetCard` and `GoalCard` components
3. Implement budget alert notifications via `NotificationService`
4. Build Reports screen with chart type toggle and date range selector
5. Integrate Victory Native (mobile) and Recharts (desktop) chart libraries
6. Implement pie, bar, and line charts with correct data binding

---

## 5. Phase 4 — Polish & Launch (Weeks 12–14)

### Week 12: Advanced Features & Export

1. Implement `ExportService` (CSV and JSON export with filtered data)
2. Implement `RecurringJob` for auto-creating recurring transactions
3. Build recurring transaction UI in `TransactionForm`
4. Implement bulk select, edit, and delete on Transactions screen
5. Add advanced filters: date range, amount range, multi-category

### Week 13: Performance, Security & Accessibility

1. Profile and optimise SQLite queries — add missing indexes
2. Implement SQLCipher DB encryption with secure key management
3. Implement biometric lock screen
4. Conduct accessibility audit (VoiceOver, TalkBack, keyboard nav)
5. Fix all WCAG 2.1 AA failures
6. Performance pass: achieve all targets from TRD Section 7

### Week 14: QA, Submission & Documentation

1. Full regression test across iOS, Android, Windows, macOS
2. Fix all P1 and P2 bugs
3. Prepare App Store screenshots and metadata
4. Prepare Google Play Store listing and screenshots
5. Submit to Apple TestFlight for review
6. Submit to Google Play internal testing track
7. Publish desktop binaries to GitHub Releases
8. Write user-facing help documentation

---

## 6. Task Priority Matrix

| Priority | Definition | Examples |
|---|---|---|
| P0 — Blocker | App cannot ship without this | SQLite working, manual transaction entry, app launching on all platforms |
| P1 — Critical | Core user value; de-scoping breaks the proposition | OCR scanning, AI summaries, budget tracking |
| P2 — Important | Strongly enhances experience | Charts, bulk operations, export, recurring transactions |
| P3 — Nice to have | Can ship without; backlog for v1.1 | Optional cloud backup, summary sharing, home screen widget |

---

## 7. Dependencies & Risks

| Dependency | Risk | Mitigation |
|---|---|---|
| Claude API availability | API downtime blocks OCR and summaries | Tesseract fallback for OCR; cache last summary; retry queue |
| Expo SDK compatibility | Native modules may conflict across SDK versions | Pin SDK version; test on physical devices from Week 1 |
| Tauri 2 stability | Desktop builds may have OS-specific issues | Prioritise macOS first; Windows second; Linux third |
| Apple review process | Review rejection adds 1–2 weeks | Submit to TestFlight by Week 13; address any issues in buffer time |
| OCR accuracy targets | Tesseract may not reach 90% on all receipt types | Rely primarily on Claude; Tesseract is offline-only fallback |

---

## 8. Definition of Done

A feature is considered done when:

- [ ] Code is reviewed and merged to `main`
- [ ] Unit tests pass (Jest) with >80% coverage on the changed service
- [ ] Feature works on at least one iOS device, one Android device, and the desktop build
- [ ] Accessibility label added to all new interactive elements
- [ ] No P0 or P1 bugs introduced in regression test
- [ ] Design review completed against Frontend Guideline
