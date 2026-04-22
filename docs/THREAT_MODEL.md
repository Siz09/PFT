# Threat Model (Personal Project Baseline)

## Scope

Single-user personal finance app, local dev usage, Supabase backend.

## Assets

- Transaction records
- Receipt-derived OCR fields
- Budget and summary data
- API keys and service credentials

## Main risks

1. Credential leakage (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`)
2. Over-permissive data access when auth is introduced
3. Inference leaks from logs or exported files
4. Third-party API rate-limit and outage behavior

## Implemented controls

- Server-only OpenAI calls (`/api/ocr`, `/api/summaries`)
- Env validation for required secrets
- RLS enabled on core tables (migration baseline)
- Error handling with fallback/manual paths
- Bulk and recurring operations run via server routes, not client-side secrets

## Known trade-offs (intentional)

- Service-role server routes are used for simplicity in personal-project mode.
- Full per-user row ownership policies are deferred until multi-user auth is required.
- Push/email notifications are not mandatory for current personal scope.

## Future hardening

1. Add `user_id` ownership columns and strict RLS policies.
2. Replace service-role route usage with user-scoped Supabase server client where possible.
3. Add audit logging for critical mutations (bulk updates/deletes, recurring runs).
