# iceberg-roulette — Design Spec

**Date:** 2026-04-21
**Status:** Approved

## Overview

A single-page website that helps people evaluating Apache Iceberg understand cross-platform catalog support. Users pick a write engine and a read engine (optionally a cloud provider) and see which Iceberg catalogs work for that combination, plus plain-language limitations for each.

The "roulette" mechanic — a spinning casino wheel to pick engines — is the central UX metaphor. Tone is subtle fun: dry wit in copy, meme energy in the interaction, not in the visual design.

---

## Engines & Catalogs

**Engines (used for both write and read selection):**
`snowflake`, `bigquery`, `databricks`, `duckdb`, `redshift`, `trino`, `athena`, `postgres`

**Catalogs:**
`glue` (AWS Glue), `rest` (REST / Polaris / Open Catalog), `hive` (Hive Metastore), `nessie` (Nessie), `unity` (Unity Catalog)

**Cloud providers (optional filter):**
`aws`, `gcp`, `azure`

---

## Data Model

All compatibility data lives in `src/data/compatibility.ts`. TypeScript exhaustiveness enforces completeness — adding an engine or catalog without filling in its data is a compile error.

```ts
export const ENGINES = [
  'snowflake', 'bigquery', 'databricks', 'duckdb',
  'redshift', 'trino', 'athena', 'postgres'
] as const;
export type EngineId = typeof ENGINES[number];

export const CATALOGS = ['glue', 'rest', 'hive', 'nessie', 'unity'] as const;
export type CatalogId = typeof CATALOGS[number];

export const CLOUDS = ['aws', 'gcp', 'azure'] as const;
export type CloudId = typeof CLOUDS[number];

type Support = 'full' | 'partial' | 'none';

interface CatalogSupport {
  support: Support;
  limitations: string[];  // must be non-empty when support is 'partial'
}

// One entry per catalog, required for every engine
type EngineRule = Record<CatalogId, CatalogSupport>;

// Required for ALL engines — TypeScript errors if any engine is missing
export const engineCatalogRules: Record<EngineId, EngineRule> = { ... };

// Optional overrides for specific write+read pairs
type PairKey = `${EngineId}__${EngineId}`;
export const pairOverrides: Partial<Record<PairKey, EngineRule>> = { ... };
```

**Lookup logic:** `pairOverrides[\`${write}__${read}\`] ?? engineCatalogRules[write]`

**Cloud filtering:** applied client-side after lookup — catalogs not available on the selected cloud are hidden from the results list entirely (e.g. Glue is AWS-only so it's hidden when cloud is GCP or Azure). A separate `cloudCatalogMap: Partial<Record<CloudId, CatalogId[]>>` constant lists which catalogs are available per cloud; catalogs not in the list for the selected cloud are omitted.

**Engine-level rules rationale:** Some engines (e.g. BigQuery, Postgres) have fundamental write limitations that apply regardless of the read engine. Defining `engineCatalogRules` as the default avoids enumerating all 64 write×read combinations; `pairOverrides` handles combos with genuinely different catalog behavior.

---

## Layout

Side-by-side, single viewport (no scroll required on desktop):

```
┌─────────────────────────┬─────────────────────────┐
│  Write Engine           │  Catalog Results        │
│  [ roulette wheel ]     │                         │
│                         │  Glue        ✓ full     │
│  Read Engine            │  REST        ⚠ partial  │
│  [ roulette wheel ]     │  Hive        ✗           │
│                         │  Nessie      ✗           │
│  Cloud (optional)       │  Unity       ✗           │
│  [ AWS ] [ GCP ] [Azure]│                         │
└─────────────────────────┴─────────────────────────┘
```

---

## Components

### `App.svelte`
Layout shell. Holds reactive state:
- `selectedWrite: EngineId | null`
- `selectedRead: EngineId | null`
- `selectedCloud: CloudId | null`

Renders two-column layout. Passes state down to children; receives `select` events from wheels.

### `Wheel.svelte`
Props: `options: EngineId[]`, `label: string` ("Write Engine" / "Read Engine")
Emits: `select` event with chosen `EngineId`

- SVG wheel, one segment per engine, colored by index
- On spin: CSS keyframe animation rotates multiple full turns + computed offset to land on target segment. Target chosen randomly.
- Manual override: clicking an engine name beneath the wheel selects it directly without animating.
- "SPIN" button triggers animation.

### `CloudPicker.svelte`
Three toggle buttons: AWS / GCP / Azure. A fourth implicit "any" state when none selected.
Emits `select` with `CloudId | null`.

### `CatalogResults.svelte`
Props: `write: EngineId | null`, `read: EngineId | null`, `cloud: CloudId | null`

- When `write` is null: renders a prompt ("spin the wheel to get started")
- When `write` is set: performs lookup, applies cloud filter (removes catalogs not available on selected cloud), renders remaining catalog rows
- Each row: catalog name, support badge (full / partial / none), greyed out if none
- Clicking a `full` or `partial` row toggles an inline expansion showing the limitations list

---

## Testing

- **TypeScript compile** enforces data completeness (all engines × all catalogs covered).
- **One test file** (`src/data/compatibility.test.ts`) validates runtime data quality:
  - Every `partial` entry has at least one limitation string
  - No limitation strings are empty
  - All `pairOverrides` keys reference valid `EngineId` values

No UI tests — the app has no async behavior, no network calls, and no complex state transitions.

---

## Deployment

- `vite build` outputs to `dist/`
- `vite.config.ts` sets `base: '/iceberg-roulette/'`
- GitHub Actions workflow on push to `main` deploys to GitHub Pages
