export const ENGINES = [
  'snowflake', 'bigquery', 'databricks', 'duckdb',
  'redshift', 'trino', 'athena', 'postgres',
] as const;
export type EngineId = typeof ENGINES[number];

export const CATALOGS = [
  'glue', 'rest', 'hive', 'nessie', 'unity', 'ducklake',
] as const;
export type CatalogId = typeof CATALOGS[number];

export type Support = 'full' | 'partial' | 'none';

export interface CatalogSupport {
  support: Support;
  limitations: string[];
}

export type EngineRule = Record<CatalogId, CatalogSupport>;

export type PairKey = `${EngineId}__${EngineId}`;

export const engineCatalogRules: Record<EngineId, EngineRule> = {
  snowflake: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'full', limitations: [
      'Snowflake manages its own Iceberg metadata — other engines read via the Polaris/Open Catalog REST endpoint Snowflake exposes',
      'Snowflake is the sole writer; other engines cannot write to the same Iceberg tables',
    ]},
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  bigquery: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'BigQuery writes Iceberg tables via BigLake Metastore — a REST-compatible endpoint, not a general-purpose REST catalog',
      'Other engines can read via the BigLake Metastore REST endpoint but cannot write to BigQuery-owned tables',
      'Tables must be created in BigQuery first; schema is BigQuery-managed',
    ]},
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  databricks: {
    glue:     { support: 'full', limitations: [] },
    rest:     { support: 'full', limitations: [] },
    hive:     { support: 'full', limitations: [] },
    nessie:   { support: 'full', limitations: [] },
    unity:    { support: 'full', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  duckdb: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'DuckDB can read Iceberg tables via REST catalog but write support is limited to local Iceberg file creation',
      'No transactional catalog write support — DuckDB does not commit metadata back to the REST catalog on write',
      'Primarily useful as a read engine in cross-platform setups',
    ]},
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  redshift: {
    glue:     { support: 'partial', limitations: [
      'Redshift Spectrum can query Iceberg tables registered in Glue catalog (read-heavy)',
      'Native Iceberg write via Redshift is very limited — not recommended for write-heavy Iceberg workflows',
      'No support for Iceberg schema evolution or row-level operations (DELETE/UPDATE) via Redshift',
    ]},
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  trino: {
    glue:     { support: 'partial', limitations: [
      'No DELETE or UPDATE support via Glue catalog',
      'MERGE statement not available with Glue',
      'Schema evolution limited to adding columns — renames and drops not supported via Glue',
    ]},
    rest:     { support: 'partial', limitations: [
      'DML support (DELETE/UPDATE/MERGE) varies by REST catalog implementation',
      'Most production REST catalog configurations are read-optimized for Trino',
    ]},
    hive:     { support: 'full', limitations: [] },
    nessie:   { support: 'full', limitations: [] },
    unity:    { support: 'partial', limitations: [
      'Read-only access via Unity Catalog REST API in most configurations',
      'Write support is experimental and not recommended for production',
    ]},
    ducklake: { support: 'none', limitations: [] },
  },
  athena: {
    glue:     { support: 'full', limitations: [
      'Requires Athena engine version 3 — v2 has no Iceberg support',
      'VACUUM and OPTIMIZE operations must be run manually for query performance',
      'Time travel queries use Athena-specific syntax (FOR TIMESTAMP AS OF / FOR VERSION AS OF)',
    ]},
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  postgres: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
};

export const pairOverrides: Partial<Record<PairKey, EngineRule>> = {
  'duckdb__duckdb': {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'DuckDB REST catalog write support is experimental',
      'Not recommended for production workloads',
    ]},
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'full', limitations: [
      'DuckLake stores catalog metadata in a DuckDB database file — not accessible by other engines',
      'Requires the ducklake extension: INSTALL ducklake; LOAD ducklake;',
    ]},
  },
};
