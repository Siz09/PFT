# SmartSpend FAQ (Personal Project)

## Where is data stored?

Supabase Postgres stores categories, transactions, settings, budgets, summaries, goals, and recurring rules.

## Why no automatic background scheduler?

Personal-project scope keeps scheduling manual-first. You can run recurring now and generate summaries on demand.

## Does OCR require API keys in browser?

No. OCR and summary model calls happen server-side only.

## Why are push/email notifications not complete?

Notification path is documented and can be added later. Current in-app flow is enough for personal use.

## Can I export data?

Yes. Stats tab has CSV and JSON export links for the selected month range.
