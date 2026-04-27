# Native Vendor Bridge Catalog Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `vendor_bridge` catalog type to capture proprietary cross-engine Iceberg pathways, starting with Snowflake → Databricks via Snowflake Catalog Federation.

**Architecture:** `vendor_bridge` is added as a first-class entry in `CATALOGS` (last position), following the existing data model exactly. Snowflake is the only write-side engine with non-`none` support; Databricks is the only read-side engine with non-`none` support (via `engineReadRules`). An optional `sourceUrl` field is added to `CatalogSupport` for documentation provenance — data-only, never rendered.

**Tech Stack:** TypeScript, Svelte 4, Vitest

---

## Files

- Modify: `src/data/compatibility.ts` — add `sourceUrl` to interface, add `vendor_bridge` to `CATALOGS`, fill write-side and read-side entries
- Modify: `src/lib/CatalogResults.svelte` — add `vendor_bridge` label to `CATALOG_LABELS`
- Modify: `src/data/compatibility.test.ts` — add tests for vendor_bridge behavior

---

### Task 1: Write failing tests

**Files:**
- Modify: `src/data/compatibility.test.ts`

- [ ] **Step 1: Add tests for vendor_bridge to `compatibility.test.ts`**

Append this block at the end of the file (before the final closing brace — the file has no wrapping block, so just append):

```typescript
describe('vendor_bridge catalog', () => {
  it('vendor_bridge is the last catalog in CATALOGS', () => {
    expect(CATALOGS[CATALOGS.length - 1]).toBe('vendor_bridge');
  });

  it('snowflake has full write support for vendor_bridge', () => {
    expect(engineCatalogRules.snowflake.vendor_bridge.support).toBe('full');
  });

  it('all non-snowflake engines have none write support for vendor_bridge', () => {
    const nonSnowflake = ENGINES.filter(e => e !== 'snowflake');
    for (const engine of nonSnowflake) {
      expect(
        engineCatalogRules[engine].vendor_bridge.support,
        `${engine} write vendor_bridge should be none`
      ).toBe('none');
    }
  });

  it('databricks can read vendor_bridge (Catalog Federation)', () => {
    expect(engineReadRules.databricks?.vendor_bridge?.support).toBe('partial');
  });

  it('databricks vendor_bridge read entry has limitations', () => {
    const limitations = engineReadRules.databricks?.vendor_bridge?.limitations ?? [];
    expect(limitations.length).toBeGreaterThan(0);
  });

  it('databricks vendor_bridge read entry has a sourceUrl', () => {
    expect(engineReadRules.databricks?.vendor_bridge?.sourceUrl).toBeDefined();
    expect(engineReadRules.databricks?.vendor_bridge?.sourceUrl?.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test
```

Expected: TypeScript errors — `vendor_bridge` is not a valid `CatalogId` yet. This is the correct failing state.

---

### Task 2: Implement data model changes

**Files:**
- Modify: `src/data/compatibility.ts`

- [ ] **Step 1: Add `sourceUrl` to the `CatalogSupport` interface**

Find:
```typescript
export interface CatalogSupport {
  support: Support;
  limitations: string[];
}
```

Replace with:
```typescript
export interface CatalogSupport {
  support: Support;
  limitations: string[];
  sourceUrl?: string;
}
```

- [ ] **Step 2: Add `vendor_bridge` to the `CATALOGS` const (last position)**

Find:
```typescript
export const CATALOGS = [
  'glue', 'rest', 'hive', 's3tables', 'unity', 'ducklake',
] as const;
```

Replace with:
```typescript
export const CATALOGS = [
  'glue', 'rest', 'hive', 's3tables', 'unity', 'ducklake', 'vendor_bridge',
] as const;
```

- [ ] **Step 3: Add `vendor_bridge` entries to every engine in `engineCatalogRules`**

For each engine block in `engineCatalogRules`, add a `vendor_bridge` line. The full updated entries for each engine are shown below. Add the new line after the existing last catalog entry (`ducklake`) in each engine block:

**snowflake** — `full` (it writes native managed Iceberg tables, stored in object storage):
```typescript
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'full', limitations: [] },
```

**bigquery**:
```typescript
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
```

**databricks**:
```typescript
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
```

**duckdb**:
```typescript
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
```

**redshift**:
```typescript
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
```

**trino**:
```typescript
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
```

**athena**:
```typescript
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
```

**postgres**:
```typescript
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
```

- [ ] **Step 4: Add `vendor_bridge` to `engineReadRules.databricks`**

The `engineReadRules.databricks` block currently ends after `s3tables`. Add the new entry:

```typescript
  databricks: {
    rest: { support: 'partial', limitations: [
      'Databricks can read external Iceberg REST catalogs but cannot write to them',
      'Requires configuring the Iceberg REST catalog in Databricks cluster settings',
    ]},
    glue: { support: 'partial', limitations: [
      'Databricks can read Glue-registered Iceberg tables via Spark connector but cannot write to Glue',
      'Read-only — use Unity Catalog or Hive Metastore for a read/write Databricks catalog',
    ]},
    s3tables: { support: 'partial', limitations: [
      'Databricks can read S3 Tables via the Iceberg REST catalog connector in Spark but cannot write',
      'Requires configuring the S3 Tables REST endpoint and AWS credentials in the cluster',
    ]},
    vendor_bridge: { support: 'partial', limitations: [
      'Requires Snowflake Catalog Federation configured in Unity Catalog (foreign catalog)',
      'Databricks Runtime 13.3 LTS+ or Databricks SQL 2023.40+ required',
      'External location in Unity Catalog must cover the Snowflake table storage path',
      'Non-Iceberg Snowflake tables permanently fall back to JDBC query federation (slower)',
      'Tables with URI-incompatible locations or unsupported storage schemes also fall back to JDBC',
    ], sourceUrl: 'https://docs.databricks.com/aws/en/query-federation/snowflake-catalog-federation' },
  },
```

- [ ] **Step 5: Also add `vendor_bridge` to the `duckdb__duckdb` pair override in `pairOverrides`**

The `pairOverrides['duckdb__duckdb']` block must cover all catalogs. Add after `ducklake`:

```typescript
    vendor_bridge: { support: 'none', limitations: [] },
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
pnpm test
```

Expected: all tests pass, including the new `vendor_bridge catalog` describe block.

---

### Task 3: Add UI label

**Files:**
- Modify: `src/lib/CatalogResults.svelte`

- [ ] **Step 1: Add `vendor_bridge` to `CATALOG_LABELS`**

Find:
```typescript
  const CATALOG_LABELS: Record<CatalogId, string> = {
    glue:     'AWS Glue',
    rest:     'REST / Polaris / Open Catalog',
    hive:     'Hive Metastore',
    s3tables: 'AWS S3 Tables',
    unity:    'Unity Catalog',
    ducklake: 'DuckLake',
  };
```

Replace with:
```typescript
  const CATALOG_LABELS: Record<CatalogId, string> = {
    glue:         'AWS Glue',
    rest:         'REST / Polaris / Open Catalog',
    hive:         'Hive Metastore',
    s3tables:     'AWS S3 Tables',
    unity:        'Unity Catalog',
    ducklake:     'DuckLake',
    vendor_bridge: 'Native Vendor Bridge',
  };
```

- [ ] **Step 2: Run type check to confirm no errors**

```bash
pnpm check
```

Expected: no errors.

---

### Task 4: Final verification and commit

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 2: Manually verify the UI renders correctly**

```bash
pnpm dev
```

Open `http://localhost:5173/iceberg-roulette/` and check:
- Select **snowflake** write + **databricks** read → "Native Vendor Bridge" appears last with `⚠ partial`, expandable with 5 limitations
- Select **snowflake** write + any other read engine → "Native Vendor Bridge" shows `✗`
- Select any non-snowflake write engine + **databricks** read → "Native Vendor Bridge" shows `✗`

- [ ] **Step 3: Commit**

```bash
git add src/data/compatibility.ts src/lib/CatalogResults.svelte src/data/compatibility.test.ts docs/superpowers/
git commit -m "feat: add Native Vendor Bridge catalog type for vendor-specific Iceberg pathways

First entry: Snowflake (write) → Databricks (read) via Snowflake Catalog Federation.
Adds optional sourceUrl field to CatalogSupport for documentation provenance."
```
