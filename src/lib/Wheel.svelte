<script context="module" lang="ts">
  let sharedAudioCtx: AudioContext | null = null;

  function initAudio(): void {
    if (sharedAudioCtx) return;
    try { sharedAudioCtx = new AudioContext(); } catch {}
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', initAudio, { capture: true, once: true });
  }
</script>

<script lang="ts">
  import { ENGINES } from '../data/compatibility';
  import type { EngineId } from '../data/compatibility';

  export let label: string;
  export let selected: EngineId | null = null;

  const SIZE = 360;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 144;
  const N = ENGINES.length;
  const SEG = 360 / N;

  const COLORS = [
    '#7c3aed', '#1d4ed8', '#0f766e', '#b45309',
    '#9f1239', '#166534', '#0e7490', '#6d28d9',
  ];

  let rotation = 0;
  let spinning = false;
  let animating = false;

  function tick(gainVal = 0.5): void {
    const ctx = sharedAudioCtx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = 1000;
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  function scheduleSpinSounds(totalDeg: number): void {
    const n = Math.round(totalDeg / SEG);
    for (let i = 0; i < n; i++) {
      setTimeout(tick, Math.pow(i / n, 2) * 4000);
    }
    setTimeout(() => tick(0.8), 4050);
  }

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

  async function spin(): Promise<void> {
    if (spinning) return;
    spinning = true;
    animating = true;
    let ctx = sharedAudioCtx;
    if (!ctx) try { ctx = sharedAudioCtx = new AudioContext(); } catch {}
    if (ctx?.state === 'suspended') await ctx.resume();
    const idx = Math.floor(Math.random() * N);
    const newRotation = targetRotation(idx) + 5 * 360;
    const totalDeg = newRotation - rotation;
    rotation = newRotation;
    if (ctx?.state === 'running') scheduleSpinSounds(totalDeg);
    setTimeout(() => {
      selected = ENGINES[idx];
      animating = false;
      spinning = false;
    }, 4000);
  }

  function selectManual(engine: EngineId): void {
    if (spinning) return;
    const idx = ENGINES.indexOf(engine);
    rotation = targetRotation(idx);
    selected = engine;
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
            font-size="11"
            font-family="monospace"
            font-weight="bold"
          >{engine}</text>
        {/each}
        <circle cx={CX} cy={CY} r="22" fill="#ffd700" stroke="#0a0a0a" stroke-width="2" />
        <circle cx={CX} cy={CY} r="7" fill="#0a0a0a" />
      </g>
      <circle cx={CX} cy={CY} r={R + 7} fill="none" stroke="#ffd700" stroke-width="3" />
    </svg>
  </div>

  <div aria-live="polite" aria-atomic="true" class="sr-only">
    {#if selected}{label}: {selected} selected{/if}
  </div>

  <button class="spin-btn" on:click={spin} disabled={spinning} aria-label="Spin {label} wheel">
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
        aria-pressed={selected === engine}
      >
        {engine}
      </button>
    {/each}
  </div>
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

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
    color: #aaa;
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
    color: #aaa;
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
    max-width: 380px;
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
