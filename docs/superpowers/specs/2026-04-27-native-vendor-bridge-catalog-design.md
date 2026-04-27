# Native Vendor Bridge Catalog Type

**Date:** 2026-04-27
**Status:** Approved

## Problem

Some engine pairs support direct Iceberg interop via proprietary vendor mechanisms that don't map to any open catalog technology (Glue, REST, Hive, S3 Tables, Unity Catalog, DuckLake). The first confirmed case is Snowflake → Databricks via Snowflake Catalog Federation: Databricks reads Snowflake-managed Iceberg tables directly from object storage using Unity Catalog's foreign catalog feature.

These pathways are important for users evaluating Snowflake-as-write + Databricks-as-read workflows, but are currently invisible in the app.

## Solution

Add `vendor_bridge` as a first-class catalog type, last in the list, following all existing open catalog types. It behaves identically to other catalogs in the data model and UI — no special casing required.

## Data Model Changes (`src/data/compatibility.ts`)

### 1. `CatalogSupport` interface

Add an optional `sourceUrl` field for documentation provenance. Never shown in the UI; reserved for future tooling (e.g., automated freshness checks, link-out features).

```ts
export interface CatalogSupport {
  support: Support;
  limitations: string[];
  sourceUrl?: string;
}
```

### 2. `CATALOGS` const

Append `'vendor_bridge'` as the last entry:

```ts
export const CATALOGS = [
  'glue', 'rest', 'hive', 's3tables', 'unity', 'ducklake', 'vendor_bridge',
] as const;
```

### 3. `engineCatalogRules` — write-side entries

Every engine gets a `vendor_bridge` entry. Only Snowflake can write to this pathway (its native managed Iceberg tables are the source); all others are `none`.

- `snowflake`: `full` — Snowflake Managed Iceberg tables are natively stored in object storage with Snowflake controlling the metadata layer
- All other engines: `none`

### 4. `engineReadRules.databricks`

Add a `vendor_bridge` read override for Databricks:

```ts
vendor_bridge: { support: 'partial', limitations: [
  'Requires Snowflake Catalog Federation configured in Unity Catalog (foreign catalog)',
  'Databricks Runtime 13.3 LTS+ or Databricks SQL 2023.40+ required',
  'External location in Unity Catalog must cover the Snowflake table storage path',
  'Non-Iceberg Snowflake tables permanently fall back to JDBC query federation (slower)',
  'Tables with URI-incompatible locations or unsupported storage schemes also fall back to JDBC',
], sourceUrl: 'https://docs.databricks.com/aws/en/query-federation/snowflake-catalog-federation' }
```

The existing `combine(write, read)` function handles resolution automatically:
- Snowflake write (`full`) + Databricks read (`partial`) → `partial`
- Any other write (`none`) + any read → `none`

## UI Changes (`src/lib/CatalogResults.svelte`)

Add one entry to `CATALOG_LABELS`:

```ts
vendor_bridge: 'Native Vendor Bridge',
```

Render order is driven by `CATALOGS` array order; placing `vendor_bridge` last ensures it appears at the bottom of the catalog list.

No other UI changes needed.

## Out of Scope

- No new UI section, badge, or visual indicator for vendor-bridge entries (can be added later if the list grows)
- `sourceUrl` is data-only; no link rendering in this change
- No changes to `pairOverrides`

## Testing

Update `compatibility.test.ts` to assert:
- `snowflake` write + `databricks` read → `vendor_bridge` resolves to `partial`
- Any other write engine + any read engine → `vendor_bridge` resolves to `none`
- `vendor_bridge` is the last entry in `CATALOGS`
