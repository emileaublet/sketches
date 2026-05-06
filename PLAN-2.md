# Bug Fixes & UI Polish Plan

Standalone improvements that don't overlap with PLAN.md (the controls/layout redesign).
Items already handled there (toolbar borders, fake skeleton, Leva removal) are excluded.

---

## Bug Fixes

### 1. `handleDownloadSVG` missing `rotation` in `useCallback` deps
**File:** `src/components/P5Wrapper.tsx:499`

`rotation` is used inside `handleDownloadSVG` to bake a rotation transform into the exported SVG,
but it's absent from the dependency array. If the user rotates then triggers something that
re-renders, the callback captures a stale `rotation`.

Fix: add `rotation` to the `useCallback` dep array.

---

### 2. `handleDownloadSVG` permanently mutates the live DOM
**File:** `src/components/P5Wrapper.tsx:415–470`

The download handler writes `seed` and `sketch-config` attributes directly onto the live SVG element,
and for rotated downloads rewrites `svgElement.innerHTML` entirely — without ever restoring the
original. After a rotated download the rendered sketch is broken until redraw.

Fix: clone the SVG element (`svgElement.cloneNode(true) as SVGElement`), apply all mutations to
the clone, serialize and download from the clone. The live element is never touched.

---

### 3. `isDragging.current` ref doesn't trigger cursor re-render
**File:** `src/components/P5Wrapper.tsx:668`

```tsx
cursor: isDragging.current ? "grabbing" : zoom !== 1 ? "grab" : "default"
```

Refs don't cause re-renders, so the cursor never actually shows `"grabbing"` while dragging.

Fix: replace `isDragging` ref with a `isDragging` state boolean for cursor purposes only
(or add a dedicated `cursor` state that mousedown/mouseup toggle).

---

### 4. `window.location.href` on Previous/Next causes full page reload
**File:** `src/pages/SketchPage.tsx:96, 109`

Hard-navigating via `window.location.href` blows away React state and causes a white flash
before the dark theme loads.

Fix: use `useNavigate` from `react-router`.

```tsx
const navigate = useNavigate()
// …
onClick={() => prev && navigate(`/sketch/${prev.slug}`)}
```

---

### 5. Debug `console.log` in production
**File:** `src/utils/canvasSetup.ts:28`

```ts
console.log("Calculating pixel density for zoom level:", zoomLevel);
```

Fires on every sketch load. Remove it.

---

### 6. Wheel/mouse event listeners re-attach on every zoom/pan change
**File:** `src/components/P5Wrapper.tsx:219–259`

```ts
useEffect(() => { … }, [zoom, pan]);
```

The handlers only use `setZoom` and `setPan` with functional updates — they don't actually
need `zoom` or `pan` in scope. The effect re-attaches event listeners on every single scroll
event.

Fix: change the dependency array to `[]`.

---

## Code Quality

### 7. `loadSketches` is unnecessarily async
**File:** `src/utils/loadSketches.ts`

`import.meta.glob(..., { eager: true })` is synchronous — all modules are available
immediately. Wrapping it in `async/await` + a loading state in `App.tsx` adds a
`useState(true)` → `setIsLoading(false)` cycle that causes a flicker on every cold load.

Fix: make `loadSketches` synchronous, remove the `isLoading` guard in `App.tsx`.

```ts
// Before
export async function loadSketches(): Promise<Meta[]>

// After
export function loadSketches(): Meta[]
```

---

### 8. Redundant initial spread in `createControls`
**File:** `src/utils/constants.ts:92–120`

The initial `controls = { paperSize, paperSizeRatio, ...rest, useSVG, debug }` block spreads
all constants into the object, but the `for` loop immediately below overwrites every key with
either a `controlConfig` override or an auto-generated control definition. The initial spread
contributes nothing.

Fix: initialize `controls` with only the fixed `paperSize`, `paperSizeRatio`, and `useSVG`
entries (which aren't in `constants` and aren't iterated over), then let the loop fill in the
rest.

---

## UI Polish

### 9. Load Space Grotesk (fonts already downloaded)
**File:** `src/index.css`

`public/fonts/space-grotesk/` exists but isn't loaded. Space Grotesk suits this project
better than Figtree — more geometric, more character.

Fix: add `@font-face` declarations in `index.css` and change `font-family` on `body`.
Use the variable-font file `SpaceGrotesk[wght].ttf` to cover all weights in one declaration.

```css
@font-face {
  font-family: 'Space Grotesk';
  src: url('/fonts/space-grotesk/SpaceGrotesk[wght].ttf') format('truetype');
  font-weight: 300 700;
  font-display: swap;
}

body {
  font-family: 'Space Grotesk', sans-serif;
}
```

---

### 10. Add per-sketch `<title>` tag
**File:** `src/pages/SketchPage.tsx`

The browser tab always shows "Émile's Sketches" regardless of which sketch is open.
The `<Helmet>` block already exists — just add a title.

```tsx
<Helmet>
  <title>{sketch.title} — Émile's Sketches</title>
  <meta property="og:image" content={ogImage} />
  <meta name="twitter:image" content={ogImage} />
</Helmet>
```

---

### 11. Add a favicon
**File:** `public/`

Every page load logs a 404 for `favicon.ico`. Add a minimal favicon —
an SVG favicon is the simplest approach (no build step, works in all modern browsers).

Create `public/favicon.svg` (a simple geometric mark matching the art aesthetic)
and add to `index.html`:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

---

### 12. Previous/Next navigation is too faint
**File:** `src/pages/SketchPage.tsx:91–119`

The destination title renders at `opacity-60` at rest, the label at `opacity-40`.
Both are barely readable on a dark background.

Fix: raise base opacity so the text is legible without hovering.

```tsx
// Before
<span className="opacity-40">Previous</span>
<span className="text-2xl opacity-60 hover:opacity-100">

// After
<span className="text-xs text-muted-foreground uppercase tracking-wide">Previous</span>
<span className="text-2xl hover:text-white transition-colors">
```

---

### 13. "View code" button copies SVG — misleading label
**File:** `src/components/P5Wrapper.tsx:615–624`

The `</>` icon button with `aria-label="View code"` actually copies the SVG markup to
the clipboard. Someone looking to copy the SVG won't find it; someone expecting source
code will be confused.

Fix: swap icon to `Copy` (or `ClipboardCopy`) from lucide-react, update `aria-label`
to `"Copy SVG"`.

---

### 14. Hard-coded `aspect-[8/7]` canvas container
**File:** `src/components/P5Wrapper.tsx:664`

The canvas wrapper is locked to an 8:7 aspect ratio regardless of the sketch's actual
dimensions. Portrait sketches get side bars; landscape sketches may clip.

Fix: derive the aspect ratio from the sketch's `width`/`height` constants.
P5Wrapper already receives `controlValues` which contains `width` and `height`.
Compute `aspectRatio = width / height` and apply it via inline style:

```tsx
style={{ aspectRatio: `${width} / ${height}` }}
```

Fall back to `8/7` if width/height aren't available yet (loading state).

---

## Implementation Order

These can be done in any order, but a sensible sequence:

1. Bugs first (items 1–6) — safe, isolated, no API changes
2. Code quality (items 7–8) — small refactors
3. UI polish (items 9–14) — visible changes, verify after PLAN.md layout work is done
   since items 13 and 14 touch P5Wrapper which PLAN.md also modifies
