# Backend Structure Document
## SmartSpend — Data, Services & AI Layer
**Version 1.0 | March 2026**

---

## 1. Architecture Philosophy

SmartSpend has no traditional backend server. All persistence happens in on-device SQLite. External network calls are limited to two endpoints: the Claude API for OCR and AI summaries, and optionally Supabase for encrypted backup. This approach eliminates server costs, removes data breach risk at the server level, and enables full offline functionality.

---

## 2. Directory Structure

```
src/
├── db/
│   ├── schema.ts                        # Table definitions and seed data
│   ├── DatabaseManager.ts               # SQLite init and migration runner
│   └── migrations/
│       ├── v001_initial.ts
│       ├── v002_add_tags.ts
│       └── ...
│
├── repositories/                        # Raw SQLite query layer (one file per table)
│   ├── TransactionRepository.ts
│   ├── CategoryRepository.ts
│   ├── BudgetRepository.ts
│   ├── GoalRepository.ts
│   └── SummaryRepository.ts
│
├── services/                            # Business logic layer
│   ├── TransactionService.ts
│   ├── OCRService.ts
│   ├── AIService.ts
│   ├── BudgetService.ts
│   ├── GoalService.ts
│   ├── ExportService.ts
│   ├── NotificationService.ts
│   └── EncryptionService.ts
│
├── jobs/                                # Background job runners
│   ├── SummaryJob.ts
│   └── RecurringJob.ts
│
└── utils/                               # Shared utilities
    ├── dateHelpers.ts
    ├── formatters.ts
    └── validators.ts
```

---

## 3. Database Layer

### 3.1 Initialisation

On app start, `DatabaseManager` checks the schema version stored in `PRAGMA user_version`. If the version is behind, migrations are applied sequentially. The DB is opened with WAL (Write-Ahead Logging) mode for concurrent read performance.

### 3.2 Migration Pattern

Each migration file exports: `{ version: number, up: (db) => void, down: (db) => void }`. Migrations are applied in order and are irreversible in production builds (`down` only used in development). A failed migration rolls back and surfaces an error to the user.

### 3.3 Key Indexes

- `transactions(date)` — for date-range queries
- `transactions(category_id)` — for budget calculations
- `transactions(is_recurring, recurring_id)` — for recurring job
- `ai_summaries(period_type, period_start)` — for summary lookups

---

## 4. Service Layer

### 4.1 TransactionService

| Method | Input | Output | Notes |
|---|---|---|---|
| create | CreateTransactionDTO | Transaction | Validates amount > 0; generates UUID; sets timestamps |
| update | id: string, UpdateDTO | Transaction | Partial update; refreshes updated_at |
| delete | id: string | void | Hard delete; removes associated receipt file |
| query | TransactionFilters | PaginatedResult | Supports offset pagination; max 50 per page |
| getStats | dateRange | SpendingStats | Aggregates income, expense, net for range |
| search | query: string | Transaction[] | SQLite FTS5 full-text search |

### 4.2 OCRService

| Method | Input | Output | Notes |
|---|---|---|---|
| scan | imageUri: string | OCRResult | Entry point; chooses Claude or Tesseract based on connectivity |
| scanWithClaude | base64Image: string | OCRResult | Sends to Claude API; parses JSON response |
| scanWithTesseract | imageUri: string | OCRResult | Local fallback; lower accuracy on messy receipts |
| validateResult | OCRResult | ValidationReport | Checks confidence, required fields present |

### 4.3 AIService

| Method | Input | Output | Notes |
|---|---|---|---|
| generateWeeklySummary | weekStart: Date | AISummary | Queries 7-day window; calls Claude; stores result |
| generateMonthlySummary | month: string | AISummary | Queries full month; calls Claude; stores result |
| getSummary | period | AISummary \| null | Retrieves cached summary from DB |
| buildSummaryPayload | transactions[] | SummaryPayload | Aggregates data before sending to API |

---

## 5. Claude API Integration

### 5.1 Client Configuration

- Base URL: `https://api.anthropic.com/v1/messages`
- Model: `claude-sonnet-4-6`
- Max tokens: 1024 (OCR), 2048 (summaries)
- Timeout: 10 seconds with 2 automatic retries (exponential backoff)
- API key: read from platform secure storage at call time, never cached in memory

### 5.2 Request Types

| Request Type | Input | System Prompt Goal | Expected Output |
|---|---|---|---|
| OCR extraction | Base64 image + schema | Parse receipt fields strictly | JSON: merchant, amount, date, category, confidence |
| Weekly summary | Aggregated JSON stats | Friendly weekly digest | JSON: overview, top_categories, tips, savings_rate |
| Monthly summary | Aggregated JSON stats | Detailed monthly analysis | JSON: overview, top_categories, anomalies, tips, savings_rate |

### 5.3 Error Handling

- HTTP 429 (rate limit): exponential backoff, max 3 retries
- HTTP 500+: log error, queue job for retry in 15 minutes
- JSON parse failure: log raw response, return OCRResult with confidence 0
- Network timeout: fall back to Tesseract for OCR; skip summary generation

---

## 6. Background Jobs

### 6.1 SummaryJob

- Platform: Expo Background Fetch (mobile) / Node.js cron via Tauri sidecar (desktop)
- Weekly trigger: every Sunday at 20:00 device local time
- Monthly trigger: 1st of month at 08:00 device local time
- Checks: if summary already exists for period, skip
- On completion: push notification with summary teaser

### 6.2 RecurringJob

- Runs daily at 06:00 local time
- Queries `recurring_rules` where `next_due <= today`
- Creates transaction entries and updates `next_due` date
- Notifies user of auto-created transactions

---

## 7. Optional Cloud Backup (Supabase)

- Entirely opt-in — no data leaves device by default
- User authenticates with Supabase via email magic link
- Transactions encrypted client-side (AES-256) before upload
- Encryption key stored in device secure enclave, never sent to server
- Backup runs weekly on Wi-Fi only
- Restore decrypts locally after download

---

## 8. Data Flow

```
User captures receipt
  → OCRService.scan()
  → [Online: Claude API | Offline: Tesseract.js]
  → OCRResult
  → Review UI (user confirms / corrects)
  → TransactionService.create()
  → SQLite (transactions table)
  → SummaryJob reads transactions
  → AIService.generateSummary()
  → Claude API
  → ai_summaries table
  → NotificationService
  → User push notification
```

---

## 9. Logging & Diagnostics

- Rotating local log file: 7 days retained, max 10 MB
- Log levels: DEBUG (dev only), INFO, WARN, ERROR
- Logged events: DB migrations, OCR calls, summary generation, job runs, errors
- No remote logging without explicit user consent in Settings > Privacy
