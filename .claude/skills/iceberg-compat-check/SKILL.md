---
name: iceberg-compat-check
description: Use when asked to check if iceberg-roulette compatibility data is current, verify if bug fixes or new releases have landed for any engine, or update engine/catalog support information in compatibility.ts.
allowed-tools: Read, Bash(gh *)
---

# Iceberg Compatibility Freshness Check

Project: `/Users/bper/dev/iceberg-roulette/src/data/compatibility.ts`

## Step 1 — Scan for staleness signals

Search `compatibility.ts` for phrases that indicate version-gated or pending information:

```bash
grep -n "pending\|current stable\|post-\|pre-\|as of\|preview\|issues/\|planned\|not yet" \
  src/data/compatibility.ts
```

Also note any explicit version strings (e.g. `v1.5.3`, `May 2026`) — these are candidates to verify.

## Step 2 — Look up upstream status

Use `gh` CLI directly (not subagents). Per-engine sources:

| Engine | What to check | Commands |
|---|---|---|
| DuckDB | Releases + duckdb-iceberg issues/PRs | `gh release list --repo duckdb/duckdb --limit 5` / `gh issue view N --repo duckdb/duckdb-iceberg` |
| Databricks | Unity Catalog release notes | WebFetch docs |
| Snowflake | CLD / Iceberg REST docs | WebFetch docs |
| Trino | GitHub releases | `gh release list --repo trinodb/trino --limit 5` |
| Athena / Glue | AWS docs / blog | WebFetch |
| BigQuery | Google Cloud blog | WebFetch |
| pg_lake | GitHub releases | `gh release list --repo Snowflake-Labs/pg_lake --limit 5` |

For GitHub-tracked issues in `sourceUrls`, check their state:
```bash
gh issue view NUMBER --repo OWNER/REPO --json state,title,closedAt
```

## Step 3 — Update the data

- Replace "pending post-X.Y.Z" / "current stable" language with concrete version + date once released
- Remove "broken" / "workaround" notes when the fix has shipped
- Strip stale issue references from `sourceUrls` once resolved (keep if useful as historical context)

## Step 4 — Reassess support levels

After updating text, ask: do the remaining limitations still justify `partial`?

- `partial` → `full`: only if no meaningful functional restrictions remain (config steps alone don't justify `partial`)
- `full` → `partial`: if a new real restriction is discovered
- Keep informational notes (explaining *how* something works) even on `full` entries — they're useful context, not limitations
