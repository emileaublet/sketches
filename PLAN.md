# UI Redesign Plan — Custom Controls + Two-Column Layout

## Goals

- Replace Leva with a custom controls sidebar using shadcn components
- Sketch page uses a two-column layout: canvas on the left (1fr), controls on the right (200px fixed)
- Decouple `PenColorMultiselect` from Leva so it becomes a pure React component
- Leave the index/home page completely untouched

## Non-Goals

- No changes to sketch files' `constants` / `constantsProps` exports
- No changes to `createControls()` output shape (control schema stays the same)
- No redesign of the home page
- No new shadcn components beyond what's needed

---

## Layout (SketchPage)

Current:
```
[header]
[title + description]          ← full width
[canvas + floating Leva panel] ← canvas centered, Leva overlaid
[prev / next]
[footer]
```

New:
```
[header]
[title + description]  ← full width, above the grid
[canvas | controls]    ← grid-cols-[1fr_200px], fills remaining height
[prev / next]
[footer]
```

The two-column grid wraps only the canvas viewer and the controls sidebar.
On mobile (< md breakpoint), it collapses to single column, controls below canvas.

---

## State / Data Flow

Currently all state (control schema, control values) lives in `P5Wrapper`.
With the sidebar outside P5Wrapper, we need to lift some state up.

New ownership:

| State | Owner |
|---|---|
| `controlSchema` (Leva-format definitions) | `SketchPage` |
| `controlValues` (current values) | `SketchPage` |
| `seed`, `pos`, `zoom`, `pan`, `rotation` | `P5Wrapper` (unchanged) |
| `isLoading`, `isRedrawing` | `P5Wrapper` (unchanged) |

`P5Wrapper` fires `onSchemaReady(schema)` once the sketch module loads.
`SketchPage` holds the schema + values, passes values down to `P5Wrapper` and schema+values to `SketchControls`.

External update (SVG upload restoring a config): currently goes through Leva's `set()`. In the new flow, `P5Wrapper` calls `onExternalUpdate(config)` → `SketchPage` updates `controlValues` directly, which flows down to both `P5Wrapper` and `SketchControls`.

---

## New Components

### `SketchControls`
`src/components/SketchControls.tsx`

Renders a scrollable 200px sidebar. Maps each entry in the control schema to a shadcn widget.

Props:
```ts
interface SketchControlsProps {
  schema: Record<string, LevaControlType | PenMultiselectDescriptor>
  values: Record<string, any>
  onChange: (key: string, value: any) => void
}
```

Control type → widget mapping:

| Schema shape | Widget |
|---|---|
| `{ value: number, min, max, step }` | `Slider` + inline `Input` (number) |
| `{ value: boolean }` | `Switch` (shadcn) |
| `{ value: string, options: string[] }` | `Select` |
| `{ value: string }` (no options) | `Input` (text) |
| `{ _type: 'pen-multiselect', ... }` | `PenColorMultiselect` (decoupled, see below) |

Special cases:
- `paperSize` + `paperSizeRatio`: when `paperSize` changes to a non-"Custom" value, auto-compute `width`/`height` and call `onChange` for both. This logic currently lives in `P5Wrapper > Controls useEffect` — move it into `SketchControls`.
- Keys `useSVG` and `debug` are always rendered last (schema already orders them this way via `createControls`).

Each control row: `<Label>` + widget, compact spacing to fit 200px width.

---

### `PenColorMultiselect` (decoupled)
`src/components/PenColorMultiselect.tsx` (move out of `leva/` subdirectory)

The visual component already exists in `src/components/leva/PenColorMultiselect.tsx`. It just needs to be decoupled from Leva's plugin system.

**Changes needed:**
1. Remove `createPlugin`, `useInputContext` from leva — replace with plain props
2. New props interface:
```ts
interface PenColorMultiselectProps {
  label: string
  options: DotPen[]
  value: DotPen[]
  onChange: (value: DotPen[]) => void
}
```
3. Keep the color swatch grid and tooltip logic as-is — they're not Leva-specific.

**New control descriptor type** (replaces the Leva plugin factory):
```ts
// src/components/PenColorMultiselect.tsx
export type PenMultiselectDescriptor = {
  _type: 'pen-multiselect'
  family?: PenFamily
  available?: DotPen[]
  selected?: DotPen[]
  label?: string
}

export function penColorMultiselect(config: Omit<PenMultiselectDescriptor, '_type'>): PenMultiselectDescriptor {
  return { _type: 'pen-multiselect', ...config }
}
```

`createControls` already handles function-typed entries in `constantsProps` by calling them with the constant value. The result (now a `PenMultiselectDescriptor`) is stored in the schema as-is. `SketchControls` detects `_type === 'pen-multiselect'` and renders the component.

Sketch files that import `penColorMultiselect` from `@/components/leva/PenColorMultiselect` will need their import path updated to `@/components/PenColorMultiselect`. Currently only `tartan-01.ts` uses it.

---

## P5Wrapper Changes

Remove:
- `import { Leva, useControls } from "leva"`
- The `Controls` inner component entirely (was the Leva bridge)
- `externalControlUpdate` state (handled by SketchPage now)
- `controls` state (schema now lives in SketchPage)

Add:
- `onSchemaReady: (schema: Record<string, any>) => void` prop
- `onExternalUpdate: (values: Record<string, any>) => void` prop
- `controlValues` prop (replaces internal state — received from SketchPage)

The top toolbar loses the Leva toggle and the dev seed navigation row shrinks slightly.
The two-border (`border-b-2` / `border-t-2`) toolbars can be softened to `border-b border-white/10`.

Layout inside P5Wrapper stays as `grid-rows-[auto_1fr_auto]` (top toolbar / canvas / bottom toolbar).

---

## SketchPage Changes

- Wrap `P5Wrapper` + `SketchControls` in a `grid grid-cols-[1fr_200px] md:grid-cols-[1fr_200px]` div
- Hold `controlSchema` and `controlValues` state
- Pass `onChange` down to `SketchControls`, which calls `P5Wrapper` re-render via updated `controlValues`
- Remove the fake 300ms loading skeleton (replace with the real loading state from P5Wrapper)

---

## Files Changed

| File | Change |
|---|---|
| `src/components/P5Wrapper.tsx` | Remove Leva, expose schema/values via props/callbacks |
| `src/components/SketchControls.tsx` | **New** — custom controls sidebar |
| `src/components/PenColorMultiselect.tsx` | **New** — decoupled from Leva (moved + rewritten props) |
| `src/components/leva/PenColorMultiselect.tsx` | **Delete** |
| `src/pages/SketchPage.tsx` | Two-column layout, lift control state, remove fake skeleton |
| `src/sketches/tartan-01.ts` | Update import path for `penColorMultiselect` |
| `package.json` | Remove `leva` dependency |

`src/utils/constants.ts` — no changes needed. The schema format stays the same.

---

## Implementation Steps

1. **Decouple PenColorMultiselect from Leva**
   - Create `src/components/PenColorMultiselect.tsx` with plain props interface
   - Export new `penColorMultiselect()` descriptor function
   - Delete `src/components/leva/PenColorMultiselect.tsx`
   - Update import in `tartan-01.ts`

2. **Build `SketchControls` component**
   - Render each schema key as a labeled control row
   - Implement number → Slider+Input, boolean → Switch, string+options → Select, string → Input, pen-multiselect → PenColorMultiselect
   - Port paperSize→width/height auto-calculation logic from P5Wrapper

3. **Refactor `P5Wrapper`**
   - Remove Leva imports and the `Controls` inner component
   - Accept `controlValues`, `onSchemaReady`, `onExternalUpdate` as props
   - Soften toolbar borders

4. **Update `SketchPage`**
   - Add `controlSchema` and `controlValues` state
   - Wire `onSchemaReady` and `onExternalUpdate` from P5Wrapper
   - Wrap in two-column grid
   - Remove fake 300ms skeleton

5. **Remove Leva from package.json**
   - `npm uninstall leva`
   - Verify no remaining Leva imports

6. **Smoke test** each sketch with controls: verify sliders, toggles, selects, and pen multiselect all work; verify SVG upload config restore still works.
