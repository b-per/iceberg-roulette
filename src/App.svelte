<script lang="ts">
  import Wheel from './lib/Wheel.svelte';
  import CatalogResults from './lib/CatalogResults.svelte';
  import Matrix from './lib/Matrix.svelte';
  import type { EngineId } from './data/compatibility';

  type View = 'roulette' | 'matrix';
  type Theme = 'dark' | 'light';

  function hashToView(hash: string): View {
    return hash === '#matrix' ? 'matrix' : 'roulette';
  }

  let view: View = hashToView(window.location.hash);
  let selectedWrite: EngineId | null = null;
  let selectedRead: EngineId | null = null;

  const stored = localStorage.getItem('theme') as Theme | null;
  let theme: Theme = stored ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
  }

  $: document.documentElement.setAttribute('data-theme', theme);

  function setView(v: View) {
    view = v;
    history.pushState(null, '', v === 'roulette' ? '#roulette' : '#matrix');
  }

  function swapEngines() {
    [selectedWrite, selectedRead] = [selectedRead, selectedWrite];
  }

  function onHashChange() {
    view = hashToView(window.location.hash);
  }

</script>

<svelte:window on:hashchange={onHashChange} />

<div class="app">
  <header>
    <h1>🎰 Iceberg Roulette</h1>
    <p class="tagline">spin to discover your catalog fate</p>
    <nav>
      <button class="nav-btn" class:active={view === 'roulette'} on:click={() => setView('roulette')}>
        roulette
      </button>
      <span class="nav-sep">·</span>
      <button class="nav-btn" class:active={view === 'matrix'} on:click={() => setView('matrix')}>
        matrix
      </button>
    </nav>
    <button
      class="theme-btn"
      on:click={toggleTheme}
      title="Switch to {theme === 'dark' ? 'light' : 'dark'} mode"
      aria-label="Switch to {theme === 'dark' ? 'light' : 'dark'} mode"
    >{theme === 'dark' ? '☀' : '☾'}</button>
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
    background: var(--bg);
    color: var(--text);
  }

  header {
    position: relative;
    text-align: center;
    padding: 32px 24px 16px;
    border-bottom: 1px solid var(--border);
  }

  h1 {
    font-family: monospace;
    font-size: 2rem;
    margin: 0;
    color: var(--gold);
    letter-spacing: 2px;
  }

  .tagline {
    font-family: monospace;
    font-size: 11px;
    color: var(--text-3);
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
    border: 1px solid var(--border-lg);
    color: var(--text-4);
    font-family: monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 4px 14px;
    border-radius: 3px;
    cursor: pointer;
    transition: all .12s;
  }

  .nav-btn:hover { border-color: var(--gold); color: var(--gold); }
  .nav-btn.active { border-color: var(--gold); color: var(--gold); }

  .theme-btn {
    position: absolute;
    top: 16px;
    right: 20px;
    background: none;
    border: 1px solid var(--border-lg);
    color: var(--text-4);
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
    transition: all .12s;
  }
  .theme-btn:hover { border-color: var(--gold); color: var(--gold); }

  .nav-sep { color: var(--border-lg); font-size: 11px; }

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
    background: var(--border);
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
    border-top: 1px solid var(--border);
  }

  footer a {
    font-family: monospace;
    font-size: 11px;
    color: var(--text-4);
    text-decoration: none;
  }

  footer a:hover {
    color: var(--text-2);
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
