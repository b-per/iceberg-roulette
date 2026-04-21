<script context="module" lang="ts">
  let sharedAudioCtx: AudioContext | null = null;

  function initAudio(): void {
    if (sharedAudioCtx) return;
    try {
      sharedAudioCtx = new AudioContext();
      console.log('[audio] created, state:', sharedAudioCtx.state, 'currentTime:', sharedAudioCtx.currentTime);
      // Play a silent 1-sample buffer immediately to open the audio pipeline.
      // Without this, currentTime stays at 0 and the pipeline may not be ready
      // by the time we schedule real sounds, causing them all to play at once.
      const silence = sharedAudioCtx.createBuffer(1, 1, sharedAudioCtx.sampleRate);
      const primer = sharedAudioCtx.createBufferSource();
      primer.buffer = silence;
      primer.connect(sharedAudioCtx.destination);
      primer.start(0);
    } catch (e) {
      console.error('[audio] init failed:', e);
    }
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

  function fireTickNow(gainVal = 0.15): void {
    const ctx = sharedAudioCtx;
    if (!ctx || ctx.state !== 'running') return;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.018);
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = gainVal;
    src.connect(gain);
    gain.connect(ctx.destination);
    // Use ctx.currentTime + tiny offset — "play right now" regardless of what
    // currentTime's absolute value is. Wall-clock scheduling is done by the
    // setTimeout chain in scheduleSpinSounds.
    src.start(ctx.currentTime + 0.005);
  }

  function scheduleSpinSounds(totalDeg: number): void {
    const ticks = Math.round(totalDeg / SEG);
    const wallStart = performance.now();
    console.log('[audio] scheduling', ticks, 'ticks via wall-clock chain');

    function step(i: number): void {
      fireTickNow();
      if (i >= ticks - 1) return;
      const nextTargetMs = Math.pow((i + 1) / ticks, 2) * 4000;
      const delay = Math.max(20, nextTargetMs - (performance.now() - wallStart));
      setTimeout(() => step(i + 1), delay);
    }

    step(0);
    setTimeout(() => fireTickNow(0.28), Math.max(4000, 4050 - (performance.now() - wallStart)));
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
    if (!ctx) {
      try { ctx = sharedAudioCtx = new AudioContext(); console.log('[audio] fallback create'); } catch {}
    }
    console.log('[audio] spin, state:', ctx?.state, 'currentTime:', ctx?.currentTime?.toFixed(3));
    if (ctx?.state === 'suspended') {
      console.log('[audio] resuming...');
      await ctx.resume();
      console.log('[audio] resumed, state:', ctx.state, 'currentTime:', ctx.currentTime.toFixed(3));
    }
    const idx = Math.floor(Math.random() * N);
    const newRotation = targetRotation(idx) + 5 * 360;
    const totalDeg = newRotation - rotation;
    rotation = newRotation;
    if (ctx?.state === 'running') {
      scheduleSpinSounds(totalDeg);
    } else {
      console.warn('[audio] skipping sounds, unexpected state:', ctx?.state);
    }
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
