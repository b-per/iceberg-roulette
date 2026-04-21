import { describe, it, expect } from 'vitest';
import { engineCatalogRules, engineReadRules, pairOverrides, ENGINES, CATALOGS } from './compatibility';
import type { CatalogId } from './compatibility';

describe('data completeness', () => {
  it('covers all engines', () => {
    for (const engine of ENGINES) {
      expect(engineCatalogRules).toHaveProperty(engine);
    }
  });

  it('covers all catalogs for every engine', () => {
    for (const engine of ENGINES) {
      for (const catalog of CATALOGS) {
        expect(engineCatalogRules[engine]).toHaveProperty(catalog);
      }
    }
  });
});

describe('data quality invariants', () => {
  it('partial entries always have at least one limitation', () => {
    for (const engine of ENGINES) {
      for (const catalog of CATALOGS) {
        const entry = engineCatalogRules[engine][catalog];
        if (entry.support === 'partial') {
          expect(
            entry.limitations.length,
            `${engine}→${catalog} is partial but has no limitations`
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('no empty limitation strings', () => {
    for (const engine of ENGINES) {
      for (const catalog of CATALOGS) {
        for (const lim of engineCatalogRules[engine][catalog].limitations) {
          expect(lim.trim().length, `empty limitation in ${engine}→${catalog}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('pairOverrides keys are valid PairKeys', () => {
    const validEngines = new Set<string>(ENGINES);
    for (const key of Object.keys(pairOverrides)) {
      const [write, read] = key.split('__');
      expect(validEngines.has(write), `invalid write engine: ${write}`).toBe(true);
      expect(validEngines.has(read), `invalid read engine: ${read}`).toBe(true);
    }
  });

  it('pairOverrides partial entries have limitations', () => {
    for (const [key, rule] of Object.entries(pairOverrides)) {
      if (!rule) continue;
      for (const catalog of CATALOGS) {
        const entry = rule[catalog];
        if (entry.support === 'partial') {
          expect(
            entry.limitations.length,
            `${key}→${catalog} is partial but has no limitations`
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('engineReadRules', () => {
  it('only references valid engine ids', () => {
    const validEngines = new Set<string>(ENGINES);
    for (const engine of Object.keys(engineReadRules)) {
      expect(validEngines.has(engine), `invalid engine in engineReadRules: ${engine}`).toBe(true);
    }
  });

  it('partial read entries have at least one limitation', () => {
    for (const [engine, overrides] of Object.entries(engineReadRules)) {
      if (!overrides) continue;
      for (const [catalog, entry] of Object.entries(overrides)) {
        if (!entry) continue;
        if (entry.support === 'partial') {
          expect(
            entry.limitations.length,
            `engineReadRules ${engine}→${catalog} is partial but has no limitations`
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('databricks can read from REST catalogs', () => {
    expect(engineReadRules.databricks?.rest?.support).toBe('partial');
  });

  it('databricks can read from Glue', () => {
    expect(engineReadRules.databricks?.glue?.support).toBe('partial');
  });

  it('redshift can read from Glue via Spectrum', () => {
    expect(engineReadRules.redshift?.glue?.support).toBe('partial');
  });
});

describe('known facts', () => {
  it('snowflake has full glue support via CLD', () => {
    expect(engineCatalogRules.snowflake.glue.support).toBe('full');
  });

  it('snowflake has full unity support via CLD', () => {
    expect(engineCatalogRules.snowflake.unity.support).toBe('full');
  });

  it('databricks has full unity catalog support', () => {
    expect(engineCatalogRules.databricks.unity.support).toBe('full');
  });

  it('databricks cannot write iceberg to glue', () => {
    expect(engineCatalogRules.databricks.glue.support).toBe('none');
  });

  it('athena has full glue support', () => {
    expect(engineCatalogRules.athena.glue.support).toBe('full');
  });

  it('trino has full support for all standard catalogs', () => {
    const fullCatalogs: CatalogId[] = ['glue', 'rest', 'hive', 'nessie', 'unity'];
    for (const catalog of fullCatalogs) {
      expect(engineCatalogRules.trino[catalog].support, `trino→${catalog}`).toBe('full');
    }
  });

  it('postgres has no support for any catalog', () => {
    for (const catalog of CATALOGS) {
      expect(engineCatalogRules.postgres[catalog].support).toBe('none');
    }
  });

  it('ducklake is none by default for all engines', () => {
    for (const engine of ENGINES) {
      expect(engineCatalogRules[engine].ducklake.support).toBe('none');
    }
  });

  it('duckdb+duckdb override has partial ducklake support', () => {
    const override = pairOverrides['duckdb__duckdb'];
    expect(override).toBeDefined();
    expect(override?.ducklake.support).toBe('partial');
  });
});
