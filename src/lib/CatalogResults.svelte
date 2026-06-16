<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { engineCatalogRules, engineReadRules, pairOverrides, CATALOGS, CATALOG_LABELS } from '../data/compatibility';
  import type { EngineId, CatalogId, Support, CatalogSupport, EngineRule } from '../data/compatibility';

  const dispatch = createEventDispatcher();

  export let write: EngineId | null;
  export let read: EngineId | null;

  function combine(w: CatalogSupport, r: CatalogSupport): CatalogSupport {
    if (w.support === 'none' || r.support === 'none') return { support: 'none', limitations: [] };
    const seen = new Set(w.limitations);
    const limitations = [...w.limitations, ...r.limitations.filter(l => !seen.has(l))];
    if (w.support === 'full' && r.support === 'full') return { support: 'full', limitations };
    return { support: 'partial', limitations };
  }

  function computeResults(w: EngineId, r: EngineId): EngineRule {
    const key = `${w}__${r}` as `${EngineId}__${EngineId}`;
    if (pairOverrides[key]) return pairOverrides[key]!;
    const wr = engineCatalogRules[w];
    const rrBase = engineCatalogRules[r];
    const rrOverrides = engineReadRules[r] ?? {};
    return Object.fromEntries(
      CATALOGS.map(c => [c, combine(wr[c], rrOverrides[c] ?? rrBase[c])])
    ) as EngineRule;
  }

  $: results = write ? computeResults(write, read ?? write) : null;

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

  function issueUrl(w: EngineId | null, r: EngineId | null): string {
    const title = w ? `Data inaccuracy: ${w} → ${r ?? '?'}` : 'Data inaccuracy';
    const body = w
      ? `**Write engine:** ${w}\n**Read engine:** ${r ?? 'not selected'}\n\n**What is inaccurate:**\n`
      : `**What is inaccurate:**\n`;
    return `https://github.com/b-per/iceberg-roulette/issues/new?labels=data-accuracy&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
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
      <button class="swap-btn" on:click={() => dispatch('swap')} title="Swap write and read engines">⇄</button>
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
          <div class="catalog-row {supportClass(support)} expandable">
            <div
              class="catalog-row-main"
              role="button"
              tabindex="0"
              on:click={() => toggle(catalog, support)}
              on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(catalog, support); } }}
              aria-expanded={expanded === catalog}
            >
              <span class="catalog-name">{CATALOG_LABELS[catalog]}</span>
              <span class="row-right">
                <span class="support-badge {supportClass(support)}">{supportLabel(support)}</span>
                <span class="chevron" class:open={expanded === catalog}>›</span>
              </span>
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
    <div class="footer-row">
      <p class="disclaimer">Data reflects best-effort knowledge — verify against official docs before going to prod.</p>
      <a class="report-link" href={issueUrl(write, read)} target="_blank" rel="noopener noreferrer">⚑ report inaccuracy</a>
    </div>
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
    color: var(--text-5);
    font-family: monospace;
    text-align: center;
  }

  .empty-icon { font-size: 40px; }
  .empty-title { font-size: 15px; color: var(--text-2); margin: 0; }
  .empty-sub { font-size: 12px; color: var(--text-4); max-width: 280px; margin: 0; line-height: 1.6; }

  .no-match {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--alert-bg);
    border: 1px solid var(--alert-border);
    border-radius: 8px;
    padding: 16px 18px;
    font-family: monospace;
  }

  .no-match-icon {
    font-size: 24px;
    color: var(--alert-icon);
    flex-shrink: 0;
    font-weight: bold;
  }

  .no-match-title {
    color: var(--alert-title);
    font-size: 14px;
    font-weight: bold;
    margin: 0 0 4px;
  }

  .no-match-sub {
    color: var(--alert-sub);
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
    border-bottom: 1px solid var(--border);
  }

  .engine-tag {
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 13px;
  }
  .engine-tag.write { background: var(--write-bg); color: var(--write-text); border: 1px solid var(--write-border); }
  .engine-tag.read  { background: var(--read-bg);  color: var(--read-text);  border: 1px solid var(--read-border); }

  .arrow { color: var(--text-4); }

  .swap-btn {
    background: none;
    border: none;
    color: var(--text-5);
    font-family: monospace;
    font-size: 16px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
    transition: color 0.15s;
    margin-left: 4px;
  }
  .swap-btn:hover { color: var(--text-2); }

  .read-hint {
    font-family: monospace;
    font-size: 11px;
    color: var(--text-4);
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

  .catalog-row.full    { background: var(--row-full-bg);    border-color: var(--row-full-border); }
  .catalog-row.partial { background: var(--row-partial-bg); border-color: var(--row-partial-border); }
  .catalog-row.none    { background: var(--row-none-bg);    border-color: var(--row-none-border); opacity: 0.6; }

  .catalog-row.expandable .catalog-row-main { cursor: pointer; }
  .catalog-row.expandable .catalog-row-main:hover { filter: brightness(1.08); }

  .row-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chevron {
    color: var(--text-5);
    font-size: 14px;
    line-height: 1;
    display: inline-block;
    transform: rotate(0deg);
    transition: transform 0.15s, color 0.15s;
  }
  .chevron.open {
    transform: rotate(90deg);
    color: var(--text-3);
  }

  .catalog-row-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .catalog-name { color: var(--text); font-size: 13px; }
  .catalog-row.none .catalog-name { color: var(--text-2); }

  .support-badge { font-size: 11px; white-space: nowrap; }
  .support-badge.full    { color: var(--status-full); }
  .support-badge.partial { color: var(--status-partial); }
  .support-badge.none    { color: var(--status-none); }

  .limitations {
    margin: 10px 0 0 0;
    padding: 0 0 0 16px;
    font-size: 11px;
    color: var(--text-3);
    line-height: 1.8;
  }

  .footer-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin: 4px 0 0;
  }

  .disclaimer {
    font-family: monospace;
    font-size: 10px;
    color: var(--text-4);
    margin: 0;
  }

  .report-link {
    font-family: monospace;
    font-size: 10px;
    color: var(--text-5);
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.15s;
  }
  .report-link:hover { color: var(--text-2); }
</style>
