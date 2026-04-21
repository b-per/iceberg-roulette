<script lang="ts">
  import Wheel from './lib/Wheel.svelte';
  import CatalogResults from './lib/CatalogResults.svelte';
  import type { EngineId } from './data/compatibility';

  let selectedWrite: EngineId | null = null;
  let selectedRead: EngineId | null = null;
</script>

<div class="app">
  <header>
    <h1>🎰 Iceberg Roulette</h1>
    <p class="tagline">spin to discover your catalog fate</p>
  </header>

  <main>
    <section class="wheels">
      <Wheel
        label="Write Engine"
        bind:selected={selectedWrite}
        on:select={(e) => (selectedWrite = e.detail)}
      />
      <Wheel
        label="Read Engine"
        bind:selected={selectedRead}
        on:select={(e) => (selectedRead = e.detail)}
      />
    </section>

    <div class="divider" aria-hidden="true"></div>

    <section class="results">
      <CatalogResults write={selectedWrite} read={selectedRead} />
    </section>
  </main>

  <footer>
    <a href="https://github.com/b-per/iceberg-roulette" target="_blank" rel="noopener">
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
    color: #555;
    margin: 6px 0 0;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  main {
    display: flex;
    flex: 1;
    gap: 0;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    padding: 32px 24px;
  }

  .wheels {
    display: flex;
    flex-direction: column;
    gap: 40px;
    flex: 0 0 360px;
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
    color: #444;
    text-decoration: none;
  }

  footer a:hover {
    color: #888;
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
