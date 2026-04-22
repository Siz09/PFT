# Scheduling Decision (Personal Project)

## Choice

Use **manual trigger + optional Supabase cron later**.

- Current implemented path: `POST /api/recurring/run` runs due recurring rules now.
- For summaries: user triggers from Stats tab (`Generate weekly/monthly summary`).
- Reason: personal project, no always-on worker requirement.

## Why this choice

- Zero infrastructure overhead.
- Predictable behavior during local development.
- Keeps recurring and summary logic testable through API routes.

## Optional upgrade path

If always-on automation needed later:

1. Use Supabase `pg_cron` to call an Edge Function.
2. Edge Function invokes recurring and summary generation logic.
3. Keep same DB tables and payload contracts.
