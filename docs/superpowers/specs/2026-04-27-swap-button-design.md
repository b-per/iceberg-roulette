# Swap Button Design

**Date:** 2026-04-27
**Status:** Approved

## What

Add a `⇄` button at the end of the `write → read` header in the results panel. Clicking it swaps the two selected engines.

## UI

```
databricks  →  bigquery  ⇄
```

Button shows only when `write` is set. Muted (`#888`), brightens on hover, monospace, no border.

## Changes

- `src/lib/CatalogResults.svelte` — add `createEventDispatcher`, dispatch `swap` on click, render button in `.results-header`
- `src/App.svelte` — handle `swap` event: `[selectedWrite, selectedRead] = [selectedRead, selectedWrite]`
