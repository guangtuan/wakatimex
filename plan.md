# WakaTime Sync Roadmap

## Phase 1 - Show Stats First (1-2 days)

- Build basic statistics APIs from existing heartbeat table:
  - `GET /api/stats/daily`
  - `GET /api/stats/range`
  - `GET /api/stats/breakdown`
- Surface key cards on homepage: today, last 7 days, top languages/projects, best day.
- Keep implementation simple: query from current data first, then optimize later.
- Deliverable: visible and usable stats page/API as the first milestone.

## Phase 2 - Stable Incremental Sync (1-2 days)

- Harden heartbeat sync for production: retries, timeouts, rate limiting, pagination guardrails.
- Add sync window compensation: sweep from T-2 to T daily to avoid delayed-arrival data gaps.
- Strengthen idempotent writes on `heartbeat.id` and add sync run logs (start/end/duration/result).
- Deliverable: a daily sync pipeline that is safe to rerun and does not duplicate dirty data.

## Phase 3 - Full Import + Incremental Handoff (1-2 days)

- Implement `data_dumps(type=heartbeats)` bootstrap flow (create job, poll, download, ingest).
- Define full-to-incremental cutover point (for example, last ingested heartbeat timestamp).
- Add backfill API for date-range repair jobs.
- Deliverable: one-shot environment bootstrap plus continuous incremental updates.

## Phase 4 - Data Model and Query Layer (2-3 days)

- Add aggregate tables/materialized stats (daily/weekly) for language, project, editor, machine, and best day.
- Expose query APIs: `/api/stats/daily`, `/api/stats/range`, `/api/stats/breakdown`.
- Optimize DB indexes for query paths (`time/project/language/machine`).
- Deliverable: local-db-first analytics without relying on online aggregation.

## Phase 5 - Frontend and Operability (1-2 days)

- Extend homepage with sync status, last error, and quick stat cards.
- Add `/jobs.html` to display recent sync executions.
- Split diagnostics endpoints: app health, DB health, sync health.
- Deliverable: visible runtime status and actionable operations from UI.

## Phase 6 - Release and Production Readiness (1-2 days)

- Add production compose profile and stricter env templates.
- Standardize structured logs (`job_id/date_range/fetched/inserted/updated/error_code`).
- Add minimum regression tests for sync flow, idempotency, and key APIs.
- Deliverable: deployable and observable production baseline.

## Priority Order

1. Phase 1 first (deliver visible stats quickly).
2. Phase 2 + Phase 3 next (data completeness and correctness).
3. Phase 4 next (query performance and richer analytics).
4. Phase 5 + Phase 6 last (operations and release quality).
