export const ENGINES = [
  'snowflake', 'bigquery', 'databricks', 'duckdb',
  'redshift', 'trino', 'athena', 'postgres',
] as const;
export type EngineId = typeof ENGINES[number];

export const CATALOGS = [
  'glue', 'rest', 'hive', 's3tables', 'unity', 'ducklake', 'vendor_bridge',
] as const;
export type CatalogId = typeof CATALOGS[number];

export type Support = 'full' | 'partial' | 'none';

export interface CatalogSupport {
  support: Support;
  limitations: string[];
  sourceUrls?: string[];
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
    s3tables: { support: 'full', limitations: [
      'Requires the Snowflake Catalog-Linked Database (CLD) feature configured for the S3 Tables REST endpoint',
      'Requires appropriate AWS IAM permissions granted to Snowflake',
    ]},
    unity:    { support: 'full', limitations: [
      'Requires the Snowflake Catalog-Linked Database (CLD) feature — must be configured per external catalog',
      'Writes via Unity Catalog Iceberg REST create Managed Iceberg tables only — existing Delta tables are read-only via this interface',
    ]},
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'full', limitations: [] },
  },
  bigquery: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'BigQuery manages Iceberg tables via the Lakehouse runtime catalog (formerly BigLake Metastore) — a GCP-specific managed REST endpoint, not a self-hosted open catalog',
      'Cross-engine read/write interoperability (Spark, Flink, Trino, Snowflake, Databricks) is in preview as of May 2026 — not yet GA',
      'Credential vending is supported for cross-engine access control',
      'REST catalog tables do not support views over Iceberg, metadata tables (.snapshots, .files), clustering, or table renaming',
    ], sourceUrls: [
      'https://cloud.google.com/blog/products/data-analytics/improved-interoperability-for-your-apache-iceberg-lakehouse',
      'https://docs.cloud.google.com/lakehouse/docs/about-lakehouse-catalogs',
      'https://cloud.google.com/blog/products/data-analytics/unveiling-new-bigquery-capabilities-for-the-agentic-era',
    ]},
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
  },
  databricks: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'Requires configuring the external REST catalog via Spark cluster/session settings — not available via native Databricks SQL',
      'Works best with REST catalogs that support credential vending; direct cloud storage writes are constrained by Unity Catalog external locations',
      'Not an officially documented Databricks workflow — Unity Catalog is the recommended read/write catalog for Databricks',
    ], sourceUrls: [
      'https://docs.databricks.com/aws/en/iceberg/',
      'https://iceberg.apache.org/docs/latest/spark-configuration/',
    ]},
    hive:     { support: 'full', limitations: [
      'Hive Metastore is deprecated — new Databricks accounts created after December 18, 2025 no longer have access; Unity Catalog is the recommended replacement',
    ] },
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'full', limitations: [] },
    ducklake: { support: 'partial', limitations: [
      'Requires the DuckLake Spark client (maintained by MotherDuck)',
      'DuckDB-backed catalog must be served via Quack for remote access — local DuckDB file not directly accessible',
    ], sourceUrls: [
      'https://ducklake.select/',
      'https://motherduck.com/blog/announcing-ducklake-1-0-on-motherduck/',
    ]},
    vendor_bridge: { support: 'none', limitations: [] },
  },
  duckdb: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'REST catalog write added in v1.4.0; standard SQL syntax (INSERT/UPDATE/DELETE) requires v1.4.2+',
      'UPDATE and DELETE only supported on non-partitioned, non-sorted tables',
      'Merge-on-read semantics only — no copy-on-write',
    ], sourceUrls: [
      'https://duckdb.org/2025/11/28/iceberg-writes-in-duckdb',
    ]},
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'partial', limitations: [
      'DuckDB accesses S3 Tables via the Iceberg REST catalog endpoint',
      'Same write constraints as REST: UPDATE and DELETE require non-partitioned, non-sorted tables',
    ]},
    unity:    { support: 'partial', limitations: [
      'Iceberg REST write pathway is non-functional in DuckDB 1.5.3 — two open bugs block all write operations; use the uc_catalog Delta pathway instead',
      'Iceberg REST / CTAS: fails with S3 403 — vended credentials are scoped to the metadata path only; DuckDB writes data files to a path outside the credentialed scope (duckdb-iceberg #792)',
      'Iceberg REST / INSERT+UPDATE: fails at commit — DuckDB encodes manifest map types as Avro array-of-records instead of Iceberg JSON schema format; Unity Catalog rejects upper_bounds/lower_bounds fields (IDs 126–127); fix pending in PR #801 (duckdb-iceberg #799)',
      'uc_catalog / Delta pathway (GA in v1.5): INSERT supported via Catalog Commits; UPDATE and DELETE not yet supported',
    ], sourceUrls: [
      'https://duckdb.org/2026/05/07/delta-uc-updates',
      'https://github.com/duckdb/duckdb-iceberg/issues/792',
      'https://github.com/duckdb/duckdb-iceberg/issues/799',
    ]},
    ducklake: { support: 'partial', limitations: [
      'Requires the ducklake extension: INSTALL ducklake; LOAD ducklake;',
      'Local DuckDB file catalog is single-writer; a Quack catalog server is required for concurrent or cross-engine writers',
    ], sourceUrls: [
      'https://ducklake.select/',
      'https://duckdb.org/2026/05/12/quack-remote-protocol',
    ]},
    vendor_bridge: { support: 'none', limitations: [] },
  },
  redshift: {
    glue:     { support: 'full', limitations: [
      'Requires creating Iceberg tables in Redshift registered in Glue Data Catalog',
      'Time travel and some schema evolution features are not available via Redshift',
    ]},
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'full', limitations: [
      'Requires creating Iceberg tables in Redshift registered against S3 Tables',
      'Time travel and some schema evolution features are not available via Redshift',
    ]},
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
  },
  trino: {
    glue:     { support: 'full', limitations: [] },
    rest:     { support: 'full', limitations: [] },
    hive:     { support: 'full', limitations: [] },
    s3tables: { support: 'full', limitations: [
      'Requires configuring the S3 Tables REST catalog endpoint and AWS credentials in Trino',
    ]},
    unity:    { support: 'partial', limitations: [
      'Trino connects to Unity Catalog via Iceberg REST, but write requires security mode adjustments and is not GA in OSS Trino',
      'Writes via Unity Catalog Iceberg REST create Managed Iceberg tables only — existing Delta tables are read-only via this interface',
    ]},
    ducklake: { support: 'partial', limitations: [
      'Requires a DuckLake Trino connector',
      'DuckDB-backed catalog must be served via Quack for remote access — local DuckDB file not directly accessible',
    ], sourceUrls: [
      'https://ducklake.select/',
    ]},
    vendor_bridge: { support: 'none', limitations: [] },
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
    vendor_bridge: { support: 'none', limitations: [] },
  },
  postgres: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
    vendor_bridge: { support: 'none', limitations: [] },
  },
};

// Read-side overrides: where an engine's READ catalog capability differs from its WRITE capability.
// Most engines: same rules both ways. Exceptions captured here.
export const engineReadRules: Partial<Record<EngineId, Partial<EngineRule>>> = {
  snowflake: {
    vendor_bridge: { support: 'none', limitations: [] },
  },
  databricks: {
    // Databricks can READ from external REST catalogs (including BigLake Metastore) via Spark,
    // even though it cannot WRITE to them.
    rest: { support: 'partial', limitations: [
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
    vendor_bridge: { support: 'partial', limitations: [
      'Requires Snowflake Catalog Federation configured in Unity Catalog (foreign catalog)',
      'Databricks Runtime 13.3 LTS+ or Databricks SQL 2023.40+ required; DBR 16.4 LTS+ recommended for full feature support',
      'External location in Unity Catalog must cover the Snowflake table storage path',
      'Non-Iceberg Snowflake tables permanently fall back to JDBC query federation (slower)',
      'Tables with URI-incompatible locations or unsupported storage schemes also fall back to JDBC',
      'Foreign Iceberg tables require manual metadata refresh (ALTER TABLE) to reflect Snowflake writes in Databricks',
    ], sourceUrls: ['https://docs.databricks.com/aws/en/query-federation/snowflake-catalog-federation'] },
  },
};

export const pairOverrides: Partial<Record<PairKey, EngineRule>> = {
  'duckdb__duckdb': {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'REST catalog write added in v1.4.0; standard SQL syntax (INSERT/UPDATE/DELETE) requires v1.4.2+',
      'UPDATE and DELETE only supported on non-partitioned, non-sorted tables',
      'Merge-on-read semantics only — no copy-on-write',
    ], sourceUrls: [
      'https://duckdb.org/2025/11/28/iceberg-writes-in-duckdb',
    ]},
    hive:     { support: 'none', limitations: [] },
    s3tables: { support: 'partial', limitations: [
      'DuckDB accesses S3 Tables via the Iceberg REST catalog endpoint',
      'Same write constraints as REST: UPDATE and DELETE require non-partitioned, non-sorted tables',
    ]},
    unity:    { support: 'partial', limitations: [
      'Iceberg REST write pathway is non-functional in DuckDB 1.5.3 — two open bugs block all write operations; use the uc_catalog Delta pathway instead',
      'Iceberg REST / CTAS: fails with S3 403 — vended credentials are scoped to the metadata path only; DuckDB writes data files to a path outside the credentialed scope (duckdb-iceberg #792)',
      'Iceberg REST / INSERT+UPDATE: fails at commit — DuckDB encodes manifest map types as Avro array-of-records instead of Iceberg JSON schema format; Unity Catalog rejects upper_bounds/lower_bounds fields (IDs 126–127); fix pending in PR #801 (duckdb-iceberg #799)',
      'uc_catalog / Delta pathway (GA in v1.5): INSERT supported via Catalog Commits; UPDATE and DELETE not yet supported',
    ], sourceUrls: [
      'https://duckdb.org/2026/05/07/delta-uc-updates',
      'https://github.com/duckdb/duckdb-iceberg/issues/792',
      'https://github.com/duckdb/duckdb-iceberg/issues/799',
    ]},
    ducklake: { support: 'partial', limitations: [
      'Requires the ducklake extension: INSTALL ducklake; LOAD ducklake;',
      'Local DuckDB file catalog is single-writer only',
      'Concurrent multi-writer access requires a Quack catalog server (beta in v1.5, GA planned with DuckDB v2.0)',
    ], sourceUrls: [
      'https://ducklake.select/2026/04/13/ducklake-10/',
      'https://duckdb.org/2026/05/12/quack-remote-protocol',
    ]},
    vendor_bridge: { support: 'none', limitations: [] },
  },
};
