# 🎰 Iceberg Roulette

**Which Iceberg catalogs work between your write engine and read engine?** Spin to find out — or just click the engine chips.

🔗 **Live site:** https://b-per.github.io/iceberg-roulette/

---

## What it does

Pick a write engine and a read engine (or spin the roulette wheels). The app shows you which Apache Iceberg catalog types work for that combination, with support levels:

- ✓ **full** — both engines support this catalog with no known blockers
- ⚠ **partial** — works, but with caveats (click to expand limitations)
- ✗ **none** — not supported

## Engines covered

`snowflake` · `bigquery` · `databricks` · `duckdb` · `redshift` · `trino` · `athena` · `postgres`

## Catalogs covered

| Catalog | Notes |
|---------|-------|
| AWS Glue | |
| REST / Polaris / Open Catalog | Includes any Iceberg REST-compatible endpoint |
| Hive Metastore | |
| AWS S3 Tables | Managed Iceberg REST catalog, GA since Nov 2024 |
| Unity Catalog | Databricks Unity Catalog Iceberg REST |
| DuckLake | DuckDB-native catalog backed by a DuckDB file |

> Data reflects best-effort knowledge as of mid-2025. Verify against official docs before going to prod.

## Local development

```bash
pnpm install
pnpm dev       # http://localhost:5173/iceberg-roulette/
pnpm test      # vitest
pnpm build     # output → dist/
```

## Contributing

Corrections and additions welcome — the compatibility data lives in [`src/data/compatibility.ts`](src/data/compatibility.ts). Tests are in [`src/data/compatibility.test.ts`](src/data/compatibility.test.ts).
