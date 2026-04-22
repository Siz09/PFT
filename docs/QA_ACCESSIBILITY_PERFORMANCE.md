# QA, Accessibility, Performance Notes

## Regression checklist (local personal-project run)

- [x] Manual transaction create/update/delete
- [x] OCR flow (upload -> review -> save)
- [x] Filters (type, multi-category, date, min/max amount)
- [x] Bulk actions (bulk delete, bulk edit)
- [x] Recurring rules (create, run-now)
- [x] Summary generation (weekly/monthly)
- [x] Export CSV/JSON

## Accessibility checks done

- Added explicit `aria-label` on key select/input controls for bulk and recurring sections.
- Form controls remain keyboard reachable in logical order.
- Buttons have descriptive text labels.

## Performance checks done

- Build and typecheck clean in production build.
- Query paths indexed for transactions and recurring due-date.
- Summary/report views use scoped month filtering.

## Commands used

- `npm --prefix packages/domain run test`
- `npm run lint:web`
- `npm run build:web`
