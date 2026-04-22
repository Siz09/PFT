# Frontend Guideline
## SmartSpend — Design System & Component Standards
**Version 1.0 | March 2026**

---

## 1. Design Principles

- **Clarity first:** financial data must be scannable at a glance
- **Local-first feel:** no loading spinners for data that is already on device
- **Calm colours:** avoid anxiety-inducing reds except for genuine overspend alerts
- **Progressive disclosure:** summary view first, detail on demand
- **Accessible by default:** meet WCAG 2.1 AA without workarounds

---

## 2. Color System

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| brand.primary | #4F81BD | #6B9FD4 | Primary actions, links, active states |
| brand.secondary | #1F3864 | #4A7AB5 | Headings, important labels |
| income.default | #16A34A | #22C55E | Income amounts, positive balances |
| expense.default | #DC2626 | #EF4444 | Expense amounts, overspend indicators |
| warning.default | #D97706 | #F59E0B | Budget approaching limit (80–99%) |
| surface.primary | #FFFFFF | #1C1C1E | Main card backgrounds |
| surface.secondary | #F5F5F5 | #2C2C2E | Screen background, list rows |
| text.primary | #111827 | #F9FAFB | Body text |
| text.secondary | #6B7280 | #9CA3AF | Labels, metadata, timestamps |
| border.default | #E5E7EB | #3A3A3C | Card borders, dividers |

---

## 3. Typography

| Scale | Size | Weight | Usage |
|---|---|---|---|
| display | 32sp/pt | 700 | Dashboard net balance, large numbers |
| heading-1 | 24sp/pt | 600 | Screen titles |
| heading-2 | 18sp/pt | 600 | Section headers, card titles |
| heading-3 | 16sp/pt | 500 | Sub-section labels |
| body-1 | 16sp/pt | 400 | Primary body text, transaction descriptions |
| body-2 | 14sp/pt | 400 | Secondary body, list items |
| caption | 12sp/pt | 400 | Timestamps, metadata, footnotes |
| label | 12sp/pt | 500 | Button labels, tags, badges |
| mono | 14sp/pt | 400 | Amount figures (use tabular numbers) |

> Always use tabular (monospaced) number rendering for currency amounts so columns align correctly.

---

## 4. Spacing & Layout

- Base unit: 4px — all spacing values are multiples of 4
- Screen horizontal padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Card internal padding: 16px
- List item height: 64px (two-line), 48px (single-line)
- Bottom safe area: respect device safe area insets on all platforms
- Max content width (desktop): 800px — centred with auto margins

---

## 5. Component Library

### 5.1 Core Components

| Component | Location | Props | Notes |
|---|---|---|---|
| Button | components/core/Button | variant (primary\|secondary\|ghost\|danger), size, disabled, loading | Loading shows spinner in place of label |
| Card | components/core/Card | padding, shadow, onPress | Default 8px border radius |
| Modal | components/core/Modal | isOpen, onClose, title, size | Animated bottom sheet (mobile), centred dialog (desktop) |
| Input | components/core/Input | label, error, hint, prefix, suffix | Shows error message below field |
| Badge | components/core/Badge | variant (income\|expense\|category), label | Pill shaped, colour-coded |
| ProgressBar | components/core/ProgressBar | value (0-1), variant (default\|warning\|danger) | Auto-colours based on value |
| AmountDisplay | components/core/AmountDisplay | amount, type, size, showSign | Tabular numbers, colour-coded |
| EmptyState | components/core/EmptyState | icon, title, description, action | Centred placeholder for empty lists |
| LoadingSpinner | components/core/LoadingSpinner | size, color | Platform-native activity indicator |
| Toast | components/core/Toast | message, type (success\|error\|info) | Auto-dismisses after 3 seconds |

### 5.2 Feature Components

| Component | Description |
|---|---|
| TransactionCard | Single transaction row with category icon, merchant, amount, date |
| TransactionForm | Add/edit form with all fields and validation |
| ScannerView | Camera viewfinder with document detection overlay |
| OCRReviewForm | Pre-filled correction form shown after OCR processing |
| SummaryCard | AI summary teaser card with period, key stat, and expand CTA |
| InsightList | Numbered list of OpenAI-generated tips with icons |
| BudgetCard | Category budget with progress bar, amounts, and alert badge |
| GoalCard | Savings goal card with circular progress, amounts, deadline |
| CategoryPicker | Scrollable category selector with icons and colours |
| DateRangePicker | Calendar-based date range selector |
| ChartContainer | Wrapper handling chart type toggle and loading state |

---

## 6. Navigation Structure

### 6.1 Mobile (React Navigation)

```
Root Stack
├── Onboarding Stack
│   ├── WelcomeScreen
│   ├── PermissionsScreen
│   └── ProfileSetupScreen
├── Main Bottom Tab Navigator
│   ├── DashboardScreen
│   ├── TransactionsScreen
│   ├── ScanScreen
│   ├── BudgetScreen
│   └── ReportsScreen
└── Modals (presented over any screen)
    ├── TransactionFormModal
    ├── GoalFormModal
    ├── BudgetFormModal
    └── AISummaryModal
```

### 6.2 Desktop (Tauri sidebar)

- Left sidebar: fixed 240px, collapsible to icon-only 64px
- Content area: fluid, max 800px centred
- Modals: centred overlay dialogs, max 560px wide

---

## 7. Platform Adaptation

| Element | Mobile | Desktop |
|---|---|---|
| Navigation | Bottom tab bar | Left sidebar |
| Modals | Bottom sheet (slides up) | Centred dialog with backdrop |
| Transaction delete | Swipe gesture on row | Right-click context menu or row button |
| Bulk select | Long press to enter selection mode | Checkbox column visible on hover |
| Date picker | Native date picker | Custom calendar dropdown |
| Back navigation | Physical/gesture back | Breadcrumb or back button in header |
| Font scaling | Respects OS text size setting | Minimum 14px enforced |

---

## 8. State Management

- **Global state (Zustand):** current user settings, active filters, UI theme
- **Server state (direct service calls + local cache):** transactions, budgets, goals
- **Local component state (useState):** form values, modal open/close, tab selection
- Avoid prop drilling beyond 2 levels — use Zustand or React Context
- Persist settings and filter preferences to AsyncStorage / localStorage

---

## 9. Accessibility Standards

- All interactive elements have accessible labels (`accessibilityLabel` on RN, `aria-label` on web)
- Colour is never the only indicator — use icons or text alongside colour
- Minimum tap target size: 44×44dp on mobile, 36×36px on desktop
- All charts have text-based data tables as accessible alternatives
- Screen reader tested on VoiceOver (iOS/macOS) and TalkBack (Android)
- Focus order is logical and does not trap keyboard users

---

## 10. Animation Guidelines

- Use React Native Reanimated for performance-critical animations (lists, charts)
- Standard transition duration: 250ms ease-in-out
- Screen transitions: shared element (receipt thumbnail → scan screen)
- Respect `prefers-reduced-motion`: disable non-essential animations
- No animation on financial data updates — clarity over delight for numbers

---

## 11. Code Standards

- All components typed with TypeScript — no `any`
- Component files: PascalCase (`TransactionCard.tsx`)
- Hook files: camelCase prefixed with `use` (`useTransactions.ts`)
- Max component file length: 200 lines — extract subcomponents beyond this
- Styles colocated in component file via `StyleSheet.create()` or Tailwind classes
- No inline styles except for dynamic values (e.g., width based on progress percentage)
- Exports: named exports for all components; default export only for screen-level components
