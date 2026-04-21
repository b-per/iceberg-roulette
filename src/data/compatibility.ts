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

const NONE: CatalogSupport = { support: 'none', limitations: [] };

// Skeleton — all none. Real data added in Task 4.
export const engineCatalogRules: Record<EngineId, EngineRule> = {
  snowflake:  { glue: NONE, rest: NONE, hive: NONE, nessie: NONE, unity: NONE, ducklake: NONE },
  bigquery:   { glue: NONE, rest: NONE, hive: NONE, nessie: NONE, unity: NONE, ducklake: NONE },
  databricks: { glue: NONE, rest: NONE, hive: NONE, nessie: NONE, unity: NONE, ducklake: NONE },
  duckdb:     { glue: NONE, rest: NONE, hive: NONE, nessie: NONE, unity: NONE, ducklake: NONE },
  redshift:   { glue: NONE, rest: NONE, hive: NONE, nessie: NONE, unity: NONE, ducklake: NONE },
  trino:      { glue: NONE, rest: NONE, hive: NONE, nessie: NONE, unity: NONE, ducklake: NONE },
  athena:     { glue: NONE, rest: NONE, hive: NONE, nessie: NONE, unity: NONE, ducklake: NONE },
  postgres:   { glue: NONE, rest: NONE, hive: NONE, nessie: NONE, unity: NONE, ducklake: NONE },
};

export const pairOverrides: Partial<Record<PairKey, EngineRule>> = {};
