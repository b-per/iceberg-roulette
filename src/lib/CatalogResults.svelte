<script lang="ts">
  import { engineCatalogRules, pairOverrides, CATALOGS } from '../data/compatibility';
  import type { EngineId, CatalogId, Support } from '../data/compatibility';

  export let write: EngineId | null;
  export let read: EngineId | null;

  const CATALOG_LABELS: Record<CatalogId, string> = {
    glue:     'AWS Glue',
    rest:     'REST / Polaris / Open Catalog',
    hive:     'Hive Metastore',
    nessie:   'Nessie',
    unity:    'Unity Catalog',
    ducklake: 'DuckLake',
  };

  $: pairKey = write && read ? (`${write}__${read}` as `${EngineId}__${EngineId}`) : null;
  $: results = write
    ? (pairKey && pairOverrides[pairKey]) ?? engineCatalogRules[write]
    : null;

  $: allNone = results ? CATALOGS.every(c => results![c].support === 'none') : false;

  let expanded: CatalogId | null = null;
  $: { write; read; expanded = null; }

  function toggle(catalog: CatalogId, support: Support): void {
    if (support === 'none') return;
    expanded = expanded === catalog ? null : catalog;
  }

  function supportClass(s: Support): string {
    return s === 'full' ? 'full' : s === 'partial' ? 'partial' : 'none';
  }

  function supportLabel(s: Support): string {
    return s === 'full' ? '✓ full' : s === 'partial' ? '⚠ partial' : '✗';
  }
</script>

<div class="results-panel">
  {#if !write}
    <div class="empty-state">
      <p class="empty-icon">🎰</p>
      <p class="empty-title">Spin the wheel to get started</p>
      <p class="empty-sub">Pick a write engine and a read engine to see which Iceberg catalogs work for your combo.</p>
    </div>
  {:else}
    <div class="results-header">
      <span class="engine-tag write">{write}</span>
      <span class="arrow">→</span>
      <span class="engine-tag read">{read ?? '?'}</span>
    </div>
    {#if !read}
      <p class="read-hint">Pick a read engine above to refine results</p>
    {/if}
    {#if allNone}
      <div class="no-match">
        <span class="no-match-icon">✗</span>
        <div>
          <p class="no-match-title">No catalogs work for this combination</p>
          <p class="no-match-sub">Try a different write or read engine.</p>
        </div>
      </div>
    {/if}
    <div class="catalog-list">
      {#each CATALOGS as catalog}
        {@const entry = results?.[catalog]}
        {@const support = entry?.support ?? 'none'}
        {@const hasLimitations = (entry?.limitations.length ?? 0) > 0}
        {@const isClickable = support !== 'none' && hasLimitations}
        {#if isClickable}
          <div
            class="catalog-row {supportClass(support)} expandable"
            role="button"
            tabindex="0"
            on:click={() => toggle(catalog, support)}
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(catalog, support); } }}
            aria-expanded={expanded === catalog}
          >
            <div class="catalog-row-main">
              <span class="catalog-name">{CATALOG_LABELS[catalog]}</span>
              <span class="support-badge {supportClass(support)}">{supportLabel(support)}</span>
            </div>
            {#if expanded === catalog && entry?.limitations.length}
              <ul class="limitations">
                {#each entry.limitations as lim}
                  <li>{lim}</li>
                {/each}
              </ul>
            {/if}
          </div>
        {:else}
          <div
            class="catalog-row {supportClass(support)}"
          >
            <div class="catalog-row-main">
              <span class="catalog-name">{CATALOG_LABELS[catalog]}</span>
              <span class="support-badge {supportClass(support)}">{supportLabel(support)}</span>
            </div>
          </div>
        {/if}
      {/each}
    </div>
    <p class="disclaimer">Data reflects best-effort knowledge — verify against official docs before going to prod.</p>
  {/if}
</div>

<style>
  .results-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px;
    gap: 10px;
    color: #555;
    font-family: monospace;
    text-align: center;
  }

  .empty-icon { font-size: 40px; }
  .empty-title { font-size: 15px; color: #bbb; margin: 0; }
  .empty-sub { font-size: 12px; color: #888; max-width: 280px; margin: 0; line-height: 1.6; }

  .no-match {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #1a0505;
    border: 1px solid #7f1d1d;
    border-radius: 8px;
    padding: 16px 18px;
    font-family: monospace;
  }

  .no-match-icon {
    font-size: 24px;
    color: #ef4444;
    flex-shrink: 0;
    font-weight: bold;
  }

  .no-match-title {
    color: #fca5a5;
    font-size: 14px;
    font-weight: bold;
    margin: 0 0 4px;
  }

  .no-match-sub {
    color: #f87171;
    font-size: 11px;
    margin: 0;
    opacity: 0.8;
  }

  .results-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: monospace;
    font-size: 12px;
    flex-wrap: wrap;
    padding-bottom: 4px;
    border-bottom: 1px solid #1a1a1a;
  }

  .engine-tag {
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 13px;
  }
  .engine-tag.write { background: #1a1a2e; color: #a78bfa; border: 1px solid #7c3aed; }
  .engine-tag.read  { background: #0d2e2e; color: #6ee7b7; border: 1px solid #0f766e; }

  .arrow { color: #888; }

  .read-hint {
    font-family: monospace;
    font-size: 11px;
    color: #888;
    margin: 0;
  }

  .catalog-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .catalog-row {
    border-radius: 6px;
    padding: 10px 14px;
    border: 1px solid transparent;
    font-family: monospace;
    transition: border-color 0.15s;
  }

  .catalog-row.full    { background: #0d1f0d; border-color: #166534; }
  .catalog-row.partial { background: #1f1a0d; border-color: #854d0e; }
  .catalog-row.none    { background: #111; border-color: #1e1e1e; opacity: 0.6; }

  .catalog-row.expandable { cursor: pointer; }
  .catalog-row.expandable:hover { filter: brightness(1.15); }

  .catalog-row-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .catalog-name { color: #e2e2e2; font-size: 13px; }
  .catalog-row.none .catalog-name { color: #bbb; }

  .support-badge { font-size: 11px; white-space: nowrap; }
  .support-badge.full    { color: #4ade80; }
  .support-badge.partial { color: #fbbf24; }
  .support-badge.none    { color: #888; }

  .limitations {
    margin: 10px 0 0 0;
    padding: 0 0 0 16px;
    font-size: 11px;
    color: #a8a29e;
    line-height: 1.8;
  }

  .disclaimer {
    font-family: monospace;
    font-size: 10px;
    color: #777;
    margin: 4px 0 0;
  }
</style>
