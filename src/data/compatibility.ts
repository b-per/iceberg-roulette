export const ENGINES = [
  'snowflake', 'bigquery', 'databricks', 'duckdb',
  'redshift', 'trino', 'athena', 'postgres',
] as const;
export type EngineId = typeof ENGINES[number];

export const CATALOGS = [
  'glue', 'rest', 'hive', 's3tables', 'unity', 'ducklake',
] as const;
export type CatalogId = typeof CATALOGS[number];

export type Support = 'full' | 'partial' | 'none';

export interface CatalogSupport {
  support: Support;
  limitations: string[];
}

export type EngineRule = Record<CatalogId, CatalogSupport>;

export type PairKey = `${EngineId}__${EngineId}`; // write__read order

export const engineCatalogRules: Record<EngineId, EngineRule> = {
  snowflake: {
    glue:     { support: 'full', limitations: [
      'Requires the Snowflake Catalog-Linked Database (CLD) feature — must be configured per external catalog',
      'No atomic CTAS support when writing to Glue-managed Iceberg tables',
      'Quoting and case sensitivity can be inconsistent between Snowflake and Iceberg',
    ]},
    rest:     { support: 'full', limitations: [
      'Quoting and case sensitivity can be inconsistent across Snowflake ↔ Iceberg REST integrations',
    ]},
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'partial', limitations: [
      'Requires the Snowflake Catalog-Linked Database (CLD) feature configured for the S3 Tables REST endpoint',
      'S3 Tables uses a managed Iceberg REST API — Snowflake connects via CLD, not natively',
      'Requires appropriate AWS IAM permissions granted to Snowflake',
    ]},
    unity:    { support: 'full', limitations: [
      'Requires the Snowflake Catalog-Linked Database (CLD) feature — must be configured per external catalog',
    ]},
    ducklake: { support: 'none', limitations: [] },
  },
  bigquery: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'BigQuery writes Iceberg tables via BigLake Metastore — a GCP-specific REST-compatible endpoint, not a general-purpose Iceberg REST catalog',
      'Other engines can read via the BigLake Metastore REST endpoint but cannot write to BigQuery-owned tables',
      'Tables must be created in BigQuery first; schema is BigQuery-managed',
    ]},
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  databricks: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'full', limitations: [] },
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'full', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  duckdb: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'DuckDB Iceberg REST catalog integration is experimental',
      'Write support is limited — primarily useful for reading Iceberg tables',
      'Not recommended for production write workloads',
    ]},
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'partial', limitations: [
      'DuckDB Unity Catalog integration is experimental and in preview',
      'Write support is limited and not recommended for production',
    ]},
    ducklake: { support: 'none', limitations: [] },
  },
  redshift: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  trino: {
    glue:     { support: 'full', limitations: [] },
    rest:     { support: 'full', limitations: [] },
    hive:     { support: 'full', limitations: [] },
    s3tables: { support: 'full', limitations: [
      'Requires configuring the S3 Tables REST catalog endpoint and AWS credentials in Trino',
    ]},
    unity:    { support: 'full', limitations: [] },
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
    s3tables: { support: 'full', limitations: [
      'Requires Athena engine version 3',
      'S3 Tables bucket and table bucket must be in the same AWS region as the Athena workgroup',
      'VACUUM and OPTIMIZE should be scheduled for query performance',
    ]},
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  postgres: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
};

// Read-side overrides: where an engine's READ catalog capability differs from its WRITE capability.
// Most engines: same rules both ways. Exceptions captured here.
export const engineReadRules: Partial<Record<EngineId, Partial<EngineRule>>> = {
  databricks: {
    // Databricks can READ from external REST catalogs (including BigLake Metastore) via Spark,
    // even though it cannot WRITE to them.
    rest: { support: 'partial', limitations: [
      'Databricks can read external Iceberg REST catalogs but cannot write to them',
      'Requires configuring the Iceberg REST catalog in Databricks cluster settings',
    ]},
    // Databricks can READ Glue-registered Iceberg tables via the Glue connector in Spark,
    // even though it cannot WRITE to the Glue catalog.
    glue: { support: 'partial', limitations: [
      'Databricks can read Glue-registered Iceberg tables via Spark connector but cannot write to Glue',
      'Read-only — use Unity Catalog or Hive Metastore for a read/write Databricks catalog',
    ]},
    // Databricks can READ from S3 Tables via the Iceberg REST catalog in Spark.
    s3tables: { support: 'partial', limitations: [
      'Databricks can read S3 Tables via the Iceberg REST catalog connector in Spark but cannot write',
      'Requires configuring the S3 Tables REST endpoint and AWS credentials in the cluster',
    ]},
  },
  redshift: {
    // Redshift Spectrum can query Glue-cataloged Iceberg tables in read-only mode.
    glue: { support: 'partial', limitations: [
      'Redshift Spectrum can query Glue-cataloged Iceberg tables but in read-only mode',
      'No write, INSERT, UPDATE, or DELETE support via Redshift on Iceberg tables',
    ]},
    // Redshift Spectrum can read S3 Tables registered in Glue Data Catalog.
    s3tables: { support: 'partial', limitations: [
      'Redshift Spectrum can read S3 Tables via Glue Data Catalog integration in read-only mode',
      'Requires registering the S3 Tables namespace in Glue Data Catalog first',
      'No write support',
    ]},
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
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'partial', limitations: [
      'DuckDB Unity Catalog integration is experimental and in preview',
      'Write support is limited and not recommended for production',
    ]},
    ducklake: { support: 'partial', limitations: [
      'DuckLake stores catalog metadata in a DuckDB database file — not accessible by other engines',
      'Requires the ducklake extension: INSTALL ducklake; LOAD ducklake;',
      'Designed for single-engine local use cases — not suitable for cross-platform sharing',
    ]},
  },
};
