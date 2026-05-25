<script lang="ts">
  import {
    ENGINES, CATALOGS, ENGINE_LABELS, CATALOG_LABELS,
    getPairCatalogDetail, bestPairSupport,
  } from '../data/compatibility';
  import type { EngineId, CatalogId, Support } from '../data/compatibility';

  let activeCatalog: CatalogId | null = null;
  let activeEngines = new Set<EngineId>(ENGINES);
  let selectedCell: { writer: EngineId; reader: EngineId } | null = null;
  let hoveredWriter: EngineId | null = null;
  let hoveredReader: EngineId | null = null;

  $: visibleEngines = ENGINES.filter(e => activeEngines.has(e));

  $: matrixRows = visibleEngines.map(writer => ({
    writer,
    cells: visibleEngines.map(reader => ({
      reader,
      support: activeCatalog
        ? getPairCatalogDetail(writer, reader, activeCatalog).combined
        : bestPairSupport(writer, reader),
    })),
  }));

  function toggleEngine(e: EngineId) {
    if (activeEngines.has(e)) {
      if (activeEngines.size > 2) { activeEngines.delete(e); activeEngines = activeEngines; }
    } else {
      activeEngines.add(e); activeEngines = activeEngines;
    }
  }

  function selectCell(writer: EngineId, reader: EngineId) {
    if (selectedCell?.writer === writer && selectedCell?.reader === reader) {
      selectedCell = null;
    } else {
      selectedCell = { writer, reader };
    }
  }

  // Detail panel: catalogs to show and their data
  $: detailCatalogs = activeCatalog ? [activeCatalog] : [...CATALOGS];
  $: detailRows = selectedCell
    ? detailCatalogs.map(cat => ({
        cat,
        label: CATALOG_LABELS[cat],
        info: getPairCatalogDetail(selectedCell!.writer, selectedCell!.reader, cat),
      }))
    : [];

  let expandedCats = new Set<CatalogId>();

  function toggleCat(cat: CatalogId) {
    if (expandedCats.has(cat)) { expandedCats.delete(cat); } else { expandedCats.add(cat); }
    expandedCats = expandedCats;
  }

  // reset expanded state when cell changes
  $: if (selectedCell) {
    expandedCats = new Set(detailCatalogs.filter(cat => {
      const info = getPairCatalogDetail(selectedCell!.writer, selectedCell!.reader, cat);
      return activeCatalog !== null || info.combined !== 'none';
    }));
  }
</script>

<div class="matrix-page">
  <!-- Controls -->
  <div class="controls">
    <div class="filter-row">
      <span class="filter-label">Catalog</span>
      <div class="pills">
        <button class="pill" class:active={activeCatalog === null} on:click={() => activeCatalog = null}>
          All catalogs
        </button>
        {#each CATALOGS as cat}
          <button class="pill" class:active={activeCatalog === cat} on:click={() => activeCatalog = cat}>
            {CATALOG_LABELS[cat]}
          </button>
        {/each}
      </div>
    </div>
    <div class="filter-row">
      <span class="filter-label">Engines</span>
      <div class="pills">
        {#each ENGINES as e}
          <button class="pill engine-pill" class:off={!activeEngines.has(e)} on:click={() => toggleEngine(e)}>
            {ENGINE_LABELS[e]}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Matrix + detail panel -->
  <div class="layout">
    <div class="matrix-wrap">
      <div class="reader-axis">← reader</div>
      <div class="table-with-axis">
        <div class="writer-axis">writer ↓</div>
        <table>
        <thead>
          <tr>
            <th class="th-spacer"></th>
            {#each visibleEngines as reader}
              <th class="th-col" class:highlighted={hoveredReader === reader}>
                <span class="th-col-inner">{ENGINE_LABELS[reader]}</span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each matrixRows as { writer, cells }}
            <tr>
              <th class="th-row" class:highlighted={hoveredWriter === writer}>
                {ENGINE_LABELS[writer]}
              </th>
              {#each cells as { reader, support }}
                <td
                  class="cell support-{support}"
                  class:selected={selectedCell?.writer === writer && selectedCell?.reader === reader}
                  title="{ENGINE_LABELS[writer]} → {ENGINE_LABELS[reader]}: {support}"
                  on:click={() => selectCell(writer, reader)}
                  on:mouseenter={() => { hoveredWriter = writer; hoveredReader = reader; }}
                  on:mouseleave={() => { hoveredWriter = null; hoveredReader = null; }}
                ></td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      </div><!-- table-with-axis -->
      <div class="legend">
        <span class="legend-item"><span class="legend-dot full"></span>Full support</span>
        <span class="legend-item"><span class="legend-dot partial"></span>Partial / caveats</span>
        <span class="legend-item"><span class="legend-dot none"></span>Not supported</span>
        <span class="legend-hint">best path shown when "all catalogs"</span>
      </div>
    </div>

    <!-- Detail panel -->
    {#if selectedCell}
      <div class="detail-panel">
        <div class="detail-header">
          <div>
            <div class="detail-pair">
              {ENGINE_LABELS[selectedCell.writer]} → {ENGINE_LABELS[selectedCell.reader]}
            </div>
            <div class="detail-subtitle">
              {activeCatalog ? `via ${CATALOG_LABELS[activeCatalog]}` : 'all catalog pathways'}
            </div>
          </div>
          <button class="close-btn" on:click={() => selectedCell = null}>✕</button>
        </div>
        <div class="detail-body">
          {#each detailRows as { cat, label, info }}
            <div class="cat-row">
              <button class="cat-header" on:click={() => toggleCat(cat)}>
                <span class="cat-name">{label}</span>
                <span class="cat-right">
                  <span class="badge badge-{info.combined}">{info.combined}</span>
                  <span class="chevron" class:open={expandedCats.has(cat)}>▼</span>
                </span>
              </button>
              {#if expandedCats.has(cat)}
                <div class="cat-details">
                  {#if info.isOverride && info.ov}
                    {#if info.ov.limitations.length}
                      <p class="side-label">Notes</p>
                      <ul class="lim-list">
                        {#each info.ov.limitations as lim}
                          <li class="lim-item"><span class="bullet">·</span>{lim}</li>
                        {/each}
                      </ul>
                    {:else}
                      <p class="no-lim">No known limitations.</p>
                    {/if}
                    {#if info.ov.sourceUrls?.length}
                      <div class="src-links">
                        {#each info.ov.sourceUrls as url}
                          <a class="src-link" href={url} target="_blank" rel="noopener">
                            {url.replace(/^https?:\/\//, '').split('/').slice(0, 3).join('/')}
                          </a>
                        {/each}
                      </div>
                    {/if}
                  {:else if info.wi && info.ri}
                    <p class="side-label">Write <span class="badge badge-{info.wi.support}">{info.wi.support}</span></p>
                    {#if info.wi.limitations.length}
                      <ul class="lim-list">
                        {#each info.wi.limitations as lim}
                          <li class="lim-item"><span class="bullet">·</span>{lim}</li>
                        {/each}
                      </ul>
                    {:else}
                      <p class="no-lim">No known limitations.</p>
                    {/if}
                    <p class="side-label" style="margin-top:8px">Read <span class="badge badge-{info.ri.support}">{info.ri.support}</span></p>
                    {#if info.ri.limitations.length}
                      <ul class="lim-list">
                        {#each info.ri.limitations as lim}
                          <li class="lim-item"><span class="bullet">·</span>{lim}</li>
                        {/each}
                      </ul>
                    {:else}
                      <p class="no-lim">No known limitations.</p>
                    {/if}
                    {#if (info.wi.sourceUrls?.length || info.ri.sourceUrls?.length)}
                      <div class="src-links">
                        {#each [...new Set([...(info.wi.sourceUrls ?? []), ...(info.ri.sourceUrls ?? [])])] as url}
                          <a class="src-link" href={url} target="_blank" rel="noopener">
                            {url.replace(/^https?:\/\//, '').split('/').slice(0, 3).join('/')}
                          </a>
                        {/each}
                      </div>
                    {/if}
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .matrix-page { width: 100%; }

  /* Controls */
  .controls {
    background: #111;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .filter-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .filter-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .1em; color: #777; width: 58px; flex-shrink: 0;
  }
  .pills { display: flex; flex-wrap: wrap; gap: 5px; }
  .pill {
    padding: 3px 11px; border-radius: 3px; font-size: 11px; font-family: monospace;
    cursor: pointer; border: 1px solid #222; background: transparent; color: #777;
    transition: all .12s;
  }
  .pill:hover { border-color: #ffd700; color: #ffd700; }
  .pill.active { background: #ffd700; border-color: #ffd700; color: #000; font-weight: 700; }
  .pill.engine-pill { color: #e2e2e2; }
  .pill.engine-pill.off { opacity: .3; text-decoration: line-through; }

  /* Layout */
  .layout { display: flex; gap: 18px; align-items: flex-start; }

  /* Matrix */
  .matrix-wrap {
    background: #111; border: 1px solid #222; border-radius: 8px;
    padding: 14px 18px 18px; overflow-x: auto; flex-shrink: 0;
  }
  .reader-axis {
    font-size: 10px; color: #555; text-transform: uppercase;
    letter-spacing: .08em; margin-bottom: 5px; padding-left: 112px;
  }
  .table-with-axis { display: flex; align-items: flex-start; }
  .writer-axis {
    writing-mode: vertical-lr;
    transform: rotate(180deg);
    font-size: 10px; color: #555; text-transform: uppercase;
    letter-spacing: .08em; white-space: nowrap;
    margin-right: 4px;
    margin-top: 120px; /* align with tbody, below the column headers */
  }
  table { border-collapse: separate; border-spacing: 3px; }

  .th-spacer { width: 110px; }
  .th-col { width: 54px; height: 120px; vertical-align: bottom; padding-bottom: 8px; text-align: center; }
  .th-col-inner {
    display: inline-block; writing-mode: vertical-lr; transform: rotate(180deg);
    white-space: nowrap; font-size: 11px; font-family: monospace; font-weight: 600; color: #e2e2e2;
  }
  .th-col.highlighted .th-col-inner { color: #ffd700; }

  .th-row {
    width: 110px; padding-right: 10px; text-align: right; white-space: nowrap;
    font-size: 11px; font-family: monospace; font-weight: 600; color: #e2e2e2; vertical-align: middle;
  }
  .th-row.highlighted { color: #ffd700; }

  .cell {
    width: 54px; height: 54px; border-radius: 4px; cursor: pointer;
    border: 2px solid transparent; transition: transform .1s, box-shadow .1s;
  }
  .cell:hover { transform: scale(1.12); }
  .cell.selected { border-color: #ffd700 !important; box-shadow: 0 0 0 1px rgba(255,215,0,.35); }
  .cell.support-full    { background: #14532d; }
  .cell.support-partial { background: #78350f; }
  .cell.support-none    { background: #450a0a; }

  /* Legend */
  .legend { display: flex; gap: 18px; margin-top: 10px; padding-left: 2px; align-items: center; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #777; }
  .legend-dot { width: 13px; height: 13px; border-radius: 3px; flex-shrink: 0; }
  .legend-dot.full    { background: #14532d; border: 1px solid #4ade80; }
  .legend-dot.partial { background: #78350f; border: 1px solid #fbbf24; }
  .legend-dot.none    { background: #450a0a; border: 1px solid #f87171; }
  .legend-hint { margin-left: auto; font-size: 10px; color: #333; font-family: monospace; }

  /* Detail panel */
  .detail-panel {
    background: #111; border: 1px solid #222; border-radius: 8px;
    width: 380px; flex-shrink: 0;
  }
  .detail-header {
    padding: 13px 16px; border-bottom: 1px solid #222; background: #1a1a1a;
    border-radius: 8px 8px 0 0; display: flex; align-items: flex-start;
    justify-content: space-between; gap: 8px;
  }
  .detail-pair { font-size: 13px; font-weight: 700; color: #ffd700; }
  .detail-subtitle { font-size: 11px; color: #777; margin-top: 3px; }
  .close-btn {
    background: none; border: none; color: #777; cursor: pointer;
    font-size: 16px; line-height: 1; padding: 0; flex-shrink: 0; font-family: monospace;
  }
  .close-btn:hover { color: #e2e2e2; }

  .detail-body { padding: 10px 16px; max-height: 65vh; overflow-y: auto; }
  .detail-body::-webkit-scrollbar { width: 4px; }
  .detail-body::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

  .cat-row { padding: 8px 0; border-bottom: 1px solid #1a1a1a; }
  .cat-row:last-child { border-bottom: none; }
  .cat-header {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    background: none; border: none; cursor: pointer; padding: 0; gap: 8px; color: inherit;
  }
  .cat-name { font-size: 12px; font-weight: 700; color: #e2e2e2; font-family: monospace; }
  .cat-right { display: flex; align-items: center; gap: 7px; }
  .badge {
    font-size: 10px; font-weight: 700; font-family: monospace; padding: 1px 7px;
    border-radius: 3px; text-transform: uppercase; letter-spacing: .06em;
  }
  .badge-full    { background: #14532d; color: #4ade80; }
  .badge-partial { background: #78350f; color: #fbbf24; }
  .badge-none    { background: #450a0a; color: #f87171; }
  .chevron { font-size: 9px; color: #555; transition: transform .15s; }
  .chevron.open { transform: rotate(180deg); }

  .cat-details { margin-top: 7px; }
  .side-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
    color: #555; margin: 6px 0 3px; display: flex; align-items: center; gap: 6px;
  }
  .lim-list { list-style: none; display: flex; flex-direction: column; gap: 3px; }
  .lim-item { display: flex; gap: 6px; font-size: 11px; color: #aaa; line-height: 1.45; }
  .bullet { color: #333; flex-shrink: 0; }
  .no-lim { font-size: 11px; color: #444; font-style: italic; }
  .src-links { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 6px; }
  .src-link { font-size: 10px; color: #ffd700; text-decoration: none; opacity: .7; }
  .src-link:hover { opacity: 1; text-decoration: underline; }
</style>
