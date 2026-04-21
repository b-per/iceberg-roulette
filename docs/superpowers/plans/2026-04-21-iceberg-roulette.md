# Iceberg Roulette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Svelte + TypeScript single-page website where users spin roulette wheels to pick write/read engines and instantly see which Iceberg catalogs support that combination, with plain-language limitations.

**Architecture:** Vite + Svelte 4 + TypeScript SPA with no backend. All compatibility data is a static typed constant in `src/data/compatibility.ts`; TypeScript's `Record<EngineId, EngineRule>` enforces exhaustive coverage at compile time. Two `Wheel.svelte` components feed selected engines into `CatalogResults.svelte` which renders a live catalog list.

**Tech Stack:** Vite 5, Svelte 4, TypeScript 5, Vitest 2, GitHub Actions (Pages deploy)

---

## File Map

| File | Responsibility |
|---|---|
| `src/data/compatibility.ts` | ENGINES/CATALOGS constants, all types, full compatibility data |
| `src/data/compatibility.test.ts` | Runtime data quality checks |
| `src/lib/Wheel.svelte` | Spinning SVG roulette wheel, emits selected EngineId |
| `src/lib/CatalogResults.svelte` | Catalog rows with support badges and expandable limitations |
| `src/App.svelte` | Layout shell, holds selectedWrite/selectedRead state |
| `src/main.ts` | Vite entry point |
| `src/app.css` | Global dark theme reset |
| `vite.config.ts` | Vite + Vitest config, base path for GH Pages |
| `tsconfig.json` | TypeScript config |
| `svelte.config.js` | Svelte preprocessor config |
| `index.html` | HTML entry point |
| `.github/workflows/deploy.yml` | GitHub Pages deploy workflow |

---

## Task 1: Scaffold project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `svelte.config.js`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/app.css`
- Create: `src/App.svelte`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "iceberg-roulette",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.1.0",
    "svelte": "^4.2.19",
    "svelte-check": "^3.8.0",
    "tslib": "^2.7.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/iceberg-roulette/',
  test: {
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ESNext", "DOM"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", "vite.config.ts"]
}
```

- [ ] **Step 4: Create `svelte.config.js`**

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
}
```

- [ ] **Step 5: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Iceberg Roulette 🎰</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.ts`**

```ts
import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
```

- [ ] **Step 7: Create `src/app.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  font-family: monospace, monospace;
  font-size: 16px;
  color-scheme: dark;
  background-color: #0a0a0a;
  color: #e2e2e2;
}

body {
  background: #0a0a0a;
}

::selection {
  background: #7c3aed44;
}

:focus-visible {
  outline: 2px solid #7c3aed;
  outline-offset: 2px;
}
```

- [ ] **Step 8: Create `src/App.svelte` (skeleton)**

```svelte
<script lang="ts">
</script>

<main>
  <h1>🎰 Iceberg Roulette</h1>
</main>
```

- [ ] **Step 9: Install dependencies**

```bash
npm install
```

Expected: packages installed, `node_modules/` created.

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at `http://localhost:5173/iceberg-roulette/` (or similar port), no errors.

- [ ] **Step 11: Commit**

```bash
git add package.json vite.config.ts tsconfig.json svelte.config.js index.html src/
git commit -m "feat: scaffold Vite + Svelte + TypeScript project"
```

---

## Task 2: Data types and skeleton

**Files:**
- Create: `src/data/compatibility.ts`

- [ ] **Step 1: Create `src/data/compatibility.ts` with types and all-`none` skeleton**

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/compatibility.ts
git commit -m "feat: add data types and skeleton compatibility data"
```

---

## Task 3: Write failing tests

**Files:**
- Create: `src/data/compatibility.test.ts`

- [ ] **Step 1: Create `src/data/compatibility.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { engineCatalogRules, pairOverrides, ENGINES, CATALOGS } from './compatibility';

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

describe('known facts', () => {
  it('databricks has full unity catalog support', () => {
    expect(engineCatalogRules.databricks.unity.support).toBe('full');
  });

  it('databricks has full glue support', () => {
    expect(engineCatalogRules.databricks.glue.support).toBe('full');
  });

  it('athena has full glue support', () => {
    expect(engineCatalogRules.athena.glue.support).toBe('full');
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

  it('duckdb+duckdb override has full ducklake support', () => {
    const override = pairOverrides['duckdb__duckdb'];
    expect(override).toBeDefined();
    expect(override?.ducklake.support).toBe('full');
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npm run test
```

Expected: FAIL on the `known facts` block:
```
✗ known facts > databricks has full unity catalog support
✗ known facts > databricks has full glue support
✗ known facts > athena has full glue support
✗ known facts > duckdb+duckdb override has full ducklake support
```
(The invariant and completeness tests pass because the skeleton has no `partial` entries.)

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/data/compatibility.test.ts
git commit -m "test: add compatibility data quality and known-fact assertions"
```

---

## Task 4: Fill in compatibility data

**Files:**
- Modify: `src/data/compatibility.ts`

- [ ] **Step 1: Replace the skeleton `engineCatalogRules` and `pairOverrides` with real data**

Replace the entire `engineCatalogRules` and `pairOverrides` export in `src/data/compatibility.ts`:

```ts
export const engineCatalogRules: Record<EngineId, EngineRule> = {
  snowflake: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'full', limitations: [
      'Snowflake manages its own Iceberg metadata — other engines read via the Polaris/Open Catalog REST endpoint Snowflake exposes',
      'Snowflake is the sole writer; other engines cannot write to the same Iceberg tables',
    ]},
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  bigquery: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'BigQuery writes Iceberg tables via BigLake Metastore — a REST-compatible endpoint, not a general-purpose REST catalog',
      'Other engines can read via the BigLake Metastore REST endpoint but cannot write to BigQuery-owned tables',
      'Tables must be created in BigQuery first; schema is BigQuery-managed',
    ]},
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  databricks: {
    glue:     { support: 'full', limitations: [] },
    rest:     { support: 'full', limitations: [] },
    hive:     { support: 'full', limitations: [] },
    nessie:   { support: 'full', limitations: [] },
    unity:    { support: 'full', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  duckdb: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'partial', limitations: [
      'DuckDB can read Iceberg tables via REST catalog but write support is limited to local Iceberg file creation',
      'No transactional catalog write support — DuckDB does not commit metadata back to the REST catalog on write',
      'Primarily useful as a read engine in cross-platform setups',
    ]},
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  redshift: {
    glue:     { support: 'partial', limitations: [
      'Redshift Spectrum can query Iceberg tables registered in Glue catalog (read-heavy)',
      'Native Iceberg write via Redshift is very limited — not recommended for write-heavy Iceberg workflows',
      'No support for Iceberg schema evolution or row-level operations (DELETE/UPDATE) via Redshift',
    ]},
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  trino: {
    glue:     { support: 'partial', limitations: [
      'No DELETE or UPDATE support via Glue catalog',
      'MERGE statement not available with Glue',
      'Schema evolution limited to adding columns — renames and drops not supported via Glue',
    ]},
    rest:     { support: 'partial', limitations: [
      'DML support (DELETE/UPDATE/MERGE) varies by REST catalog implementation',
      'Most production REST catalog configurations are read-optimized for Trino',
    ]},
    hive:     { support: 'full', limitations: [] },
    nessie:   { support: 'full', limitations: [] },
    unity:    { support: 'partial', limitations: [
      'Read-only access via Unity Catalog REST API in most configurations',
      'Write support is experimental and not recommended for production',
    ]},
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
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
  },
  postgres: {
    glue:     { support: 'none', limitations: [] },
    rest:     { support: 'none', limitations: [] },
    hive:     { support: 'none', limitations: [] },
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'none', limitations: [] },
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
    nessie:   { support: 'none', limitations: [] },
    unity:    { support: 'none', limitations: [] },
    ducklake: { support: 'full', limitations: [
      'DuckLake stores catalog metadata in a DuckDB database file — not accessible by other engines',
      'Requires the ducklake extension: INSTALL ducklake; LOAD ducklake;',
    ]},
  },
};
```

Also remove the `const NONE` line and the skeleton data above (those are replaced by the above).

- [ ] **Step 2: Run tests — expect all pass**

```bash
npm run test
```

Expected: all tests pass, output ends with something like:
```
 ✓ src/data/compatibility.test.ts (12)
 Test Files  1 passed (1)
```

- [ ] **Step 3: Commit**

```bash
git add src/data/compatibility.ts
git commit -m "feat: add full Iceberg catalog compatibility data"
```

---

## Task 5: Wheel component

**Files:**
- Create: `src/lib/Wheel.svelte`

- [ ] **Step 1: Create `src/lib/Wheel.svelte`**

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ENGINES } from '../data/compatibility';
  import type { EngineId } from '../data/compatibility';

  export let label: string;
  export let selected: EngineId | null = null;

  const dispatch = createEventDispatcher<{ select: EngineId }>();

  const SIZE = 300;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 120;
  const N = ENGINES.length;
  const SEG = 360 / N;

  const COLORS = [
    '#7c3aed', '#1d4ed8', '#0f766e', '#b45309',
    '#9f1239', '#166534', '#0e7490', '#6d28d9',
  ];

  let rotation = 0;
  let spinning = false;
  let animating = false;

  function toRad(deg: number): number {
    return ((deg - 90) * Math.PI) / 180;
  }

  function segmentPath(i: number): string {
    const s = { x: CX + R * Math.cos(toRad(i * SEG)), y: CY + R * Math.sin(toRad(i * SEG)) };
    const e = { x: CX + R * Math.cos(toRad((i + 1) * SEG)), y: CY + R * Math.sin(toRad((i + 1) * SEG)) };
    return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 0 1 ${e.x} ${e.y} Z`;
  }

  function labelPos(i: number): { x: number; y: number } {
    const angle = i * SEG + SEG / 2;
    const r = R * 0.65;
    return { x: CX + r * Math.cos(toRad(angle)), y: CY + r * Math.sin(toRad(angle)) };
  }

  function targetRotation(index: number): number {
    // Land the center of segment `index` at the top (pointer position).
    // After rotating `rotation` degrees clockwise, segment i's center is at:
    //   (i * SEG + SEG/2 + rotation) mod 360
    // We want that to equal 0 (top). So: rotation ≡ -(i * SEG + SEG/2) (mod 360)
    const target = ((-(index * SEG + SEG / 2)) % 360 + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let extra = target - currentMod;
    if (extra <= 0) extra += 360;
    return rotation + extra;
  }

  function spin(): void {
    if (spinning) return;
    spinning = true;
    animating = true;
    const idx = Math.floor(Math.random() * N);
    rotation = targetRotation(idx) + 5 * 360;
    setTimeout(() => {
      animating = false;
      spinning = false;
      selected = ENGINES[idx];
      dispatch('select', ENGINES[idx]);
    }, 4000);
  }

  function selectManual(engine: EngineId): void {
    if (spinning) return;
    const idx = ENGINES.indexOf(engine);
    rotation = targetRotation(idx);
    selected = engine;
    dispatch('select', engine);
  }
</script>

<div class="wheel-wrapper">
  <div class="wheel-label">{label}</div>
  <div class="wheel-container">
    <div class="pointer" aria-hidden="true">▼</div>
    <svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 {SIZE} {SIZE}"
      role="img"
      aria-label="{label} roulette wheel"
    >
      <g
        class="wheel-group"
        class:animating
        style="--rotation: {rotation}deg"
      >
        {#each ENGINES as engine, i}
          <path
            d={segmentPath(i)}
            fill={COLORS[i % COLORS.length]}
            stroke="#0a0a0a"
            stroke-width="2"
          />
          <text
            x={labelPos(i).x}
            y={labelPos(i).y}
            text-anchor="middle"
            dominant-baseline="middle"
            fill="white"
            font-size="9"
            font-family="monospace"
            font-weight="bold"
          >{engine}</text>
        {/each}
        <circle cx={CX} cy={CY} r="18" fill="#ffd700" stroke="#0a0a0a" stroke-width="2" />
        <circle cx={CX} cy={CY} r="6" fill="#0a0a0a" />
      </g>
      <circle cx={CX} cy={CY} r={R + 6} fill="none" stroke="#ffd700" stroke-width="3" />
    </svg>
  </div>

  <button class="spin-btn" on:click={spin} disabled={spinning}>
    {spinning ? 'spinning...' : '🎰 SPIN'}
  </button>

  {#if selected}
    <div class="selected-display">
      <span class="selected-name">{selected}</span>
    </div>
  {/if}

  <div class="engine-list">
    {#each ENGINES as engine, i}
      <button
        class="engine-chip"
        class:active={selected === engine}
        style="--chip-color: {COLORS[i % COLORS.length]}"
        on:click={() => selectManual(engine)}
        disabled={spinning}
      >
        {engine}
      </button>
    {/each}
  </div>
</div>

<style>
  .wheel-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .wheel-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #888;
    font-family: monospace;
  }

  .wheel-container {
    position: relative;
    display: inline-block;
  }

  .pointer {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    color: #ffd700;
    font-size: 20px;
    z-index: 1;
    line-height: 1;
  }

  .wheel-group {
    transform: rotate(var(--rotation));
    transform-box: fill-box;
    transform-origin: center;
  }

  .wheel-group.animating {
    transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  }

  .spin-btn {
    background: #ffd700;
    color: #0a0a0a;
    border: none;
    padding: 10px 28px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    letter-spacing: 1px;
  }

  .spin-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .selected-display {
    font-family: monospace;
    font-size: 13px;
    color: #888;
  }

  .selected-name {
    color: #ffd700;
    font-weight: bold;
  }

  .engine-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    max-width: 320px;
  }

  .engine-chip {
    background: transparent;
    border: 1px solid var(--chip-color);
    color: var(--chip-color);
    padding: 4px 10px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .engine-chip:hover:not(:disabled) {
    background: color-mix(in srgb, var(--chip-color) 20%, transparent);
  }

  .engine-chip.active {
    background: var(--chip-color);
    color: white;
  }

  .engine-chip:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
```

- [ ] **Step 2: Smoke-test the component by wiring it temporarily in `App.svelte`**

Replace `src/App.svelte` with:

```svelte
<script lang="ts">
  import Wheel from './lib/Wheel.svelte';
  import type { EngineId } from './data/compatibility';
  let selected: EngineId | null = null;
</script>

<main style="padding: 40px; background: #0a0a0a; min-height: 100vh;">
  <Wheel label="Write Engine" on:select={(e) => (selected = e.detail)} />
  <p style="color: white; font-family: monospace; margin-top: 20px;">Selected: {selected}</p>
</main>
```

Open `http://localhost:5173/iceberg-roulette/` (run `npm run dev` if not running).

Verify:
- Wheel renders with 8 colored segments
- Gold pointer arrow at the top
- SPIN button triggers a ~4s animation that stops on a random engine
- Clicking an engine chip snaps the wheel to that engine instantly
- `selected` text updates correctly after spin and after manual click

- [ ] **Step 3: Commit**

```bash
git add src/lib/Wheel.svelte src/App.svelte
git commit -m "feat: add Wheel SVG component with spin animation and manual selection"
```

---

## Task 6: CatalogResults component

**Files:**
- Create: `src/lib/CatalogResults.svelte`

- [ ] **Step 1: Create `src/lib/CatalogResults.svelte`**

```svelte
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

  let expanded: CatalogId | null = null;

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
    <div class="catalog-list">
      {#each CATALOGS as catalog}
        {@const entry = results?.[catalog]}
        {@const support = entry?.support ?? 'none'}
        {@const hasLimitations = (entry?.limitations.length ?? 0) > 0}
        <div
          class="catalog-row {supportClass(support)}"
          class:expandable={support !== 'none' && hasLimitations}
          role={support !== 'none' && hasLimitations ? 'button' : 'listitem'}
          tabindex={support !== 'none' && hasLimitations ? 0 : -1}
          on:click={() => toggle(catalog, support)}
          on:keydown={(e) => e.key === 'Enter' && toggle(catalog, support)}
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
  .empty-title { font-size: 15px; color: #777; margin: 0; }
  .empty-sub { font-size: 12px; color: #444; max-width: 280px; margin: 0; line-height: 1.6; }

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

  .arrow { color: #555; }

  .read-hint {
    font-family: monospace;
    font-size: 11px;
    color: #555;
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
  .catalog-row.none    { background: #111; border-color: #1a1a1a; opacity: 0.45; }

  .catalog-row.expandable { cursor: pointer; }
  .catalog-row.expandable:hover { filter: brightness(1.15); }

  .catalog-row-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .catalog-name { color: #e2e2e2; font-size: 13px; }
  .catalog-row.none .catalog-name { color: #555; }

  .support-badge { font-size: 11px; white-space: nowrap; }
  .support-badge.full    { color: #4ade80; }
  .support-badge.partial { color: #fbbf24; }
  .support-badge.none    { color: #444; }

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
    color: #333;
    margin: 4px 0 0;
  }
</style>
```

- [ ] **Step 2: Test in dev by wiring CatalogResults into App.svelte temporarily**

Add to `src/App.svelte`:

```svelte
<script lang="ts">
  import CatalogResults from './lib/CatalogResults.svelte';
</script>

<CatalogResults write="databricks" read="trino" />
```

Verify in browser:
- All 6 catalogs appear as rows
- Databricks: glue/rest/hive/nessie/unity all show ✓ full (green), ducklake shows ✗ (greyed)
- Clicking a full/partial row expands limitations inline; clicking again collapses
- Clicking a `none` row does nothing

- [ ] **Step 3: Commit**

```bash
git add src/lib/CatalogResults.svelte
git commit -m "feat: add CatalogResults component with expandable limitations"
```

---

## Task 7: Wire up App.svelte

**Files:**
- Modify: `src/App.svelte`

- [ ] **Step 1: Replace `src/App.svelte` with the final layout**

```svelte
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
```

- [ ] **Step 2: Verify the full flow in the browser**

With dev server running, open `http://localhost:5173/iceberg-roulette/`.

Check these scenarios:
1. Page loads showing empty state ("Spin the wheel to get started") in the right panel
2. Spin write wheel → write engine tag appears in results header, catalog list loads
3. Spin read wheel → read engine tag appears, results may refine (test `duckdb` + `duckdb` → DuckLake shows ✓ full)
4. Click engine chips manually for both wheels → results update instantly
5. Test `databricks` write + `trino` read → Glue shows ⚠ partial, click it to see limitations
6. Test `postgres` write → all catalogs show ✗

- [ ] **Step 3: Run tests to confirm nothing broken**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.svelte
git commit -m "feat: wire App.svelte with two-column layout and full data flow"
```

---

## Task 8: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```bash
mkdir -p .github/workflows
```

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Pages in the repo settings**

Go to `https://github.com/b-per/iceberg-roulette/settings/pages`, set Source to **GitHub Actions**.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy to GitHub Pages"
git push origin main
```

- [ ] **Step 4: Verify deploy**

Go to `https://github.com/b-per/iceberg-roulette/actions`. The `Deploy to GitHub Pages` workflow should run and succeed.

Once deployed, open `https://b-per.github.io/iceberg-roulette/` and verify the full flow works (spin wheels, see results, expand limitations).

---

## Self-Review

**Spec coverage check:**
- ✅ Engines: snowflake, bigquery, databricks, duckdb, redshift, trino, athena, postgres
- ✅ Catalogs: glue, rest, hive, nessie, unity, ducklake
- ✅ Layout: side-by-side, wheels left / results right
- ✅ Wheel: SVG with colored segments, CSS spin animation, manual chip selection
- ✅ Results: all 6 catalogs as rows, full/partial/none badges, expandable limitations
- ✅ Data model: `Record<EngineId, EngineRule>` + `pairOverrides`, exhaustive TypeScript
- ✅ Tests: compile-time enforcement + Vitest runtime quality checks
- ✅ Deploy: GitHub Actions → GitHub Pages
- ✅ `duckdb__duckdb` pair override for DuckLake
- ✅ Mobile responsive (stacked layout under 720px)

**Placeholder scan:** No TBD/TODO in any task. All steps contain complete code.

**Type consistency:** `EngineId`, `CatalogId`, `Support`, `CatalogSupport`, `EngineRule`, `PairKey` defined in Task 2 and used consistently in Tasks 5, 6, 7.
