# Technical Requirements Document
## SmartSpend — Personal Finance Tracker & Manager
**Version 1.0 | March 2026**

---

## 1. System Architecture Overview

SmartSpend has no traditional backend server. All persistence happens in on-device SQLite. External network calls are limited to two endpoints: the OpenAI API for OCR and AI summaries, and optionally Supabase for encrypted backup. This approach eliminates server costs, removes data breach risk at the server level, and enables full offline functionality.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Mobile UI | React Native + Expo SDK 51 | Cross-platform iOS/Android, reuses React knowledge |
| Desktop UI | Tauri 2 + React (WebView) | Lightweight native wrapper, <10MB bundle vs Electron ~150MB |
| Shared UI | Tailwind CSS via NativeWind | Consistent design system across platforms |
| State management | Zustand 4 | Simple, unopinionated, works offline-first |
| Local DB | SQLite via expo-sqlite (mobile) / better-sqlite3 (desktop) | ACID transactions, mature, local |
| File storage | Expo FileSystem / Node.js fs | Platform-native encrypted local file storage |
| OCR (offline) | Tesseract.js 5 | Fully local OCR, no API required |
| OCR + AI | OpenAI API (`gpt-4o-mini`) | Strong OCR + structured JSON extraction on varied receipt formats |
| AI summaries | OpenAI API (`gpt-4o-mini`) | Structured JSON insights from transaction data |
| Navigation | React Navigation 6 | Standard, well-documented, supports deep linking |
| Charts | Victory Native / Recharts | Platform-appropriate chart libraries |
| Language | TypeScript 5 | Type safety across entire codebase |
| Build (mobile) | EAS Build (Expo) | Cloud builds for iOS and Android |
| Build (desktop) | Tauri CLI + GitHub Actions | Cross-platform desktop binaries |
| Optional cloud | Supabase (opt-in backup) | Open-source, self-hostable alternative to Firebase |

---

## 3. Database Schema

### 3.1 transactions

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| amount | REAL | NOT NULL | Positive value; type determines +/- |
| type | TEXT | NOT NULL CHECK IN ('income','expense') | Transaction direction |
| category_id | TEXT | FK categories.id | Spending category |
| merchant | TEXT | | Extracted or entered merchant name |
| description | TEXT | | User note or OCR description |
| date | TEXT | NOT NULL | ISO 8601 date string |
| receipt_path | TEXT | | Local path to receipt image |
| ocr_confidence | REAL | | 0.0 – 1.0; null if manual entry |
| is_recurring | INTEGER | DEFAULT 0 | Boolean flag |
| recurring_id | TEXT | FK recurring_rules.id | Link to rule if recurring |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp |
| tags | TEXT | | JSON array of tag strings |

### 3.2 categories

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | NOT NULL UNIQUE | e.g. Food, Transport |
| icon | TEXT | | Icon identifier string |
| color | TEXT | | Hex color for UI |
| is_system | INTEGER | DEFAULT 0 | 1 = built-in, cannot delete |

### 3.3 budgets

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| category_id | TEXT | FK categories.id | Budget per category |
| amount | REAL | NOT NULL | Monthly budget limit |
| month | TEXT | NOT NULL | YYYY-MM format |
| alert_threshold | REAL | DEFAULT 0.8 | Alert at 80% by default |

### 3.4 goals

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | NOT NULL | Goal label |
| target_amount | REAL | NOT NULL | Total target |
| current_amount | REAL | DEFAULT 0 | Amount saved so far |
| deadline | TEXT | | ISO 8601 date |
| category | TEXT | | e.g. Emergency fund, Travel |

### 3.5 ai_summaries

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| period_type | TEXT | NOT NULL CHECK IN ('weekly','monthly') | Summary period |
| period_start | TEXT | NOT NULL | ISO 8601 date |
| period_end | TEXT | NOT NULL | ISO 8601 date |
| summary_json | TEXT | NOT NULL | Full OpenAI response as JSON |
| generated_at | TEXT | NOT NULL | ISO 8601 timestamp |

---

## 4. AI Pipeline

### 4.1 OCR Extraction Flow

1. User captures or imports receipt image
2. Image compressed to max 1024px wide, converted to base64
3. POST to OpenAI API with vision prompt requesting JSON output
4. Response parsed: `{ merchant, amount, date, category, confidence }`
5. If confidence < 0.75, show correction UI before saving
6. Confirmed transaction written to SQLite

### 4.2 OCR Prompt Template

**System:**
```
You are a receipt parser. Extract financial data from the image and respond ONLY with valid JSON. No markdown, no preamble.
```

**User:**
```
Extract: { "merchant": string, "amount": number, "date": "YYYY-MM-DD", "category": string, "description": string, "confidence": 0.0-1.0 }
```

### 4.3 Summary Generation

1. Scheduler triggers weekly (Sunday 20:00 local) and monthly (1st of month, 08:00)
2. Query SQLite for all transactions in the period
3. Aggregate: total income, total expense, per-category breakdown
4. Send structured data (NOT raw text) to OpenAI API
5. Response: `{ overview, top_categories, anomalies, tips, savings_rate }`
6. Store in ai_summaries table; push notification to user

### 4.4 Summary Prompt Template

**System:**
```
You are a personal finance advisor. Given structured spending data, generate a concise summary. Respond ONLY with JSON matching the schema provided.
```

---

## 5. API Design (Internal Service Layer)

| Module | Method | Description |
|---|---|---|
| TransactionService | create(data) | Validate and insert transaction |
| TransactionService | update(id, data) | Update transaction fields |
| TransactionService | delete(id) | Soft-delete transaction |
| TransactionService | query(filters) | Return paginated, filtered results |
| OCRService | scan(imageUri) | Run OCR pipeline, return extracted data |
| AIService | generateSummary(period) | Trigger OpenAI summary for date range |
| AIService | getSummary(period) | Retrieve stored summary from DB |
| BudgetService | getStatus(month) | Current spend vs budget per category |
| GoalService | updateProgress(id, amount) | Add to goal current_amount |
| ExportService | toCSV(filters) | Generate CSV string for filtered transactions |

---

## 6. Security Requirements

- SQLite database encrypted with SQLCipher (AES-256-CBC)
- Encryption key derived from device biometric / PIN via platform secure enclave
- OpenAI API key stored in platform secure storage (Keychain / Keystore / OS credential store)
- No financial data transmitted except: (a) image bytes for OCR, (b) aggregated numbers for summaries
- HTTPS with certificate pinning for all OpenAI API calls
- Optional cloud backup encrypted client-side before transmission

---

## 7. Performance Targets

| Operation | Target | Notes |
|---|---|---|
| App cold start | < 2 seconds | Splash screen during DB init |
| OCR processing | < 5 seconds | Includes network round-trip to OpenAI |
| Transaction query (1000 rows) | < 100ms | Indexed by date, category |
| Chart render | < 300ms | Aggregation done in background thread |
| Summary generation | < 8 seconds | Background job, non-blocking |
| DB write | < 50ms | WAL mode enabled on SQLite |

---

## 8. Error Handling Strategy

- OCR failure: show manual entry form with pre-filled empty fields
- AI API timeout (>10s): queue job for retry; notify user when complete
- DB write failure: rollback transaction; surface error toast
- Corrupted receipt image: prompt user to retake
- All errors logged locally (rotating 7-day log); no remote error reporting without consent

---

## 9. Testing Requirements

| Type | Tool | Coverage Target |
|---|---|---|
| Unit tests | Jest | 80% of service layer |
| Integration tests | Jest + in-memory SQLite | All DB operations |
| E2E tests (mobile) | Maestro | Core user flows |
| E2E tests (desktop) | Playwright | Core user flows |
| OCR accuracy tests | Custom test suite with sample receipts | >90% field accuracy |
