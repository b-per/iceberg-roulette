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
