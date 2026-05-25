<script lang="ts">
  import Wheel from './lib/Wheel.svelte';
  import CatalogResults from './lib/CatalogResults.svelte';
  import Matrix from './lib/Matrix.svelte';
  import type { EngineId } from './data/compatibility';

  let view: 'roulette' | 'matrix' = 'roulette';
  let selectedWrite: EngineId | null = null;
  let selectedRead: EngineId | null = null;

  function swapEngines() {
    [selectedWrite, selectedRead] = [selectedRead, selectedWrite];
  }
</script>

<div class="app">
  <header>
    <h1>🎰 Iceberg Roulette</h1>
    <p class="tagline">spin to discover your catalog fate</p>
    <nav>
      <button class="nav-btn" class:active={view === 'roulette'} on:click={() => view = 'roulette'}>
        roulette
      </button>
      <span class="nav-sep">·</span>
      <button class="nav-btn" class:active={view === 'matrix'} on:click={() => view = 'matrix'}>
        matrix
      </button>
    </nav>
  </header>

  <main class:matrix-view={view === 'matrix'}>
    {#if view === 'roulette'}
      <section class="wheels">
        <Wheel label="Write Engine" bind:selected={selectedWrite} />
        <Wheel label="Read Engine" bind:selected={selectedRead} />
      </section>

      <div class="divider" aria-hidden="true"></div>

      <section class="results">
        <CatalogResults write={selectedWrite} read={selectedRead} on:swap={swapEngines} />
      </section>
    {:else}
      <Matrix />
    {/if}
  </main>

  <footer>
    <a href="https://github.com/b-per/iceberg-roulette" target="_blank" rel="noopener noreferrer">
      github.com/b-per/iceberg-roulette
    </a>
  </footer>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #0a0a0a;
    color: #e2e2e2;
  }

  header {
    text-align: center;
    padding: 32px 24px 16px;
    border-bottom: 1px solid #1a1a1a;
  }

  h1 {
    font-family: monospace;
    font-size: 2rem;
    margin: 0;
    color: #ffd700;
    letter-spacing: 2px;
  }

  .tagline {
    font-family: monospace;
    font-size: 11px;
    color: #999;
    margin: 6px 0 0;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  nav {
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .nav-btn {
    background: none;
    border: 1px solid #333;
    color: #777;
    font-family: monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 4px 14px;
    border-radius: 3px;
    cursor: pointer;
    transition: all .12s;
  }

  .nav-btn:hover { border-color: #ffd700; color: #ffd700; }
  .nav-btn.active { border-color: #ffd700; color: #ffd700; }

  .nav-sep { color: #333; font-size: 11px; }

  main {
    display: flex;
    flex: 1;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    padding: 32px 24px;
  }

  main.matrix-view {
    max-width: 1400px;
    display: block;
  }

  .wheels {
    display: flex;
    flex-direction: column;
    gap: 40px;
    flex: 0 0 420px;
    padding-right: 32px;
  }

  .divider {
    width: 1px;
    background: #1a1a1a;
    margin: 0 32px 0 0;
    flex-shrink: 0;
  }

  .results {
    flex: 1;
    min-width: 0;
  }

  footer {
    text-align: center;
    padding: 16px;
    border-top: 1px solid #1a1a1a;
  }

  footer a {
    font-family: monospace;
    font-size: 11px;
    color: #777;
    text-decoration: none;
  }

  footer a:hover {
    color: #bbb;
  }


  @media (max-width: 720px) {
    main {
      flex-direction: column;
      padding: 24px 16px;
    }

    .wheels {
      flex: none;
      padding-right: 0;
      padding-bottom: 32px;
    }

    .divider {
      width: 100%;
      height: 1px;
      margin: 0 0 32px;
    }
  }
</style>
