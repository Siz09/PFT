# App Flow Document
## SmartSpend — Screen-by-Screen User Journey
**Version 1.0 | March 2026**

---

## 1. Entry Points

| Entry Point | Condition | Destination |
|---|---|---|
| First launch | No local DB found | Onboarding flow |
| Returning launch | DB exists, no lock | Dashboard |
| Returning launch | DB exists, biometric lock on | Biometric / PIN prompt |
| Push notification (summary ready) | Any state | AI Summary screen |
| Push notification (budget alert) | Any state | Budget detail screen |
| Deep link: add transaction | Any state | Transaction entry modal |

---

## 2. Onboarding Flow

**Screen 1 — Welcome**
- App name, tagline, brief feature highlights (3 cards)
- CTA: Get Started

**Screen 2 — Permissions**
- Request camera permission (for receipt scanning)
- Request notification permission (for weekly summaries and budget alerts)
- Both skippable; reminder shown later in Settings

**Screen 3 — Currency & Profile**
- Currency selector (default: device locale)
- Optional name input for personalised summaries
- CTA: Start Tracking → navigates to Dashboard

---

## 3. Main Navigation

Bottom tab bar (mobile) / Left sidebar (desktop) with 5 destinations:

| Tab | Icon concept | Purpose |
|---|---|---|
| Dashboard | Home | Overview: balance, recent transactions, summary card |
| Transactions | List | Full transaction list with search and filter |
| Scan | Camera (centre, prominent) | OCR receipt scanning — primary action |
| Budget | Gauge | Category budgets and savings goals |
| Reports | Chart | Charts, AI summaries, export |

---

## 4. Dashboard

- Header: current month name, net balance (income minus expenses)
- Summary card: total income (green), total expenses (red), savings rate
- AI insight banner: latest summary teaser with "View full report" link
- Recent transactions: last 5, tappable to open detail
- Quick action: "+" button opens transaction type selector (manual / scan)

---

## 5. Transaction Scanning Flow

**Step 1 — Source selection**
- Camera (default), Photo library, File picker (PDF)

**Step 2 — Capture / Import**
- Live viewfinder with document edge detection guide
- Auto-capture when document detected, or manual shutter button

**Step 3 — Processing**
- Full-screen loading animation with "Reading your receipt..." message
- Image sent to Claude API (or Tesseract.js if offline)

**Step 4 — Review & Confirm**
- Pre-filled form: merchant, amount, date, category (all editable)
- Confidence indicator: green (>85%), amber (60–85%), red (<60%)
- Receipt image thumbnail shown alongside form
- CTA: Save Transaction / Scan Another

**Step 5 — Confirmation**
- Success toast: "Transaction saved"
- Option to scan another receipt immediately

---

## 6. Manual Transaction Entry

- Modal sheet triggered from Dashboard "+" or Transactions list
- Fields: Type (income/expense toggle), Amount, Merchant, Category, Date, Notes, Tags
- Category shows smart suggestions based on merchant name
- Recurring toggle: reveals frequency selector (daily/weekly/monthly)
- Save validates required fields and writes to SQLite

---

## 7. Transactions Screen

- Search bar (real-time, searches merchant + description + tags)
- Filter drawer: Type, Category (multi-select), Date range, Amount range
- List sorted by date descending; pull to refresh
- Each row: category icon, merchant, date, amount (colour-coded)
- Swipe left on row (mobile) / right-click (desktop): Edit, Delete
- Bulk select mode: long press (mobile) / checkbox (desktop)
- Export button: CSV or JSON of current filtered view

---

## 8. Budget Screen

- Month selector at top (default: current month)
- Category budget cards: progress bar, spent / limit, % remaining
- Colour coding: green (<60%), amber (60–90%), red (>90%)
- "Add Budget" button: category picker + amount input
- Savings Goals section below budgets
- Each goal card: name, progress bar, current / target, deadline countdown
- "Update Progress" button: enter amount added to goal

---

## 9. Reports Screen

- Date range selector: This month, Last month, Last 3 months, Custom
- Pie chart: spending by category
- Bar chart: income vs expenses by month
- Line chart: running balance trend
- Chart type toggle (pie / bar / line)

**AI Summary section:**
- Latest weekly summary card with key stats
- Latest monthly summary card with tips list
- "Generate Now" button (cooldown: 1 per day)
- Summary history list (tappable to expand full report)

---

## 10. Settings Screen

| Section | Options |
|---|---|
| Profile | Name, currency, app theme (light/dark/system) |
| Notifications | Weekly summary on/off, budget alerts on/off, time preferences |
| Security | Biometric lock on/off, change PIN |
| Data | Export all data (CSV/JSON), delete all data, backup to cloud (opt-in) |
| AI | API key management, summary frequency, data sent to AI (info only) |
| About | Version, licenses, feedback link |

---

## 11. AI Summary Screen (Full View)

- Period header: "Week of Mar 10–16" or "March 2026"
- Overview paragraph (2–3 sentences from Claude)
- Top spending categories: ranked list with amounts and change vs prior period
- Anomalies: flagged unusual transactions with explanation
- Tips: max 3 numbered, actionable suggestions
- Savings rate callout: large number, colour-coded
- Share button: exports summary as PDF or image (no financial data in shared version)
