# Generative Sketches — Project Conventions

This is a p5.js generative art project for pen plotter output. Sketches are TypeScript files in `src/sketches/`, auto-discovered via `import.meta.glob`.

## Sketch File Structure

Every sketch exports exactly these three things + a default export:

```typescript
import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

// 1. Type definition extending BaseConstants
type Constants = BaseConstants & {
  myParam: number;
  penColors: DotPen[];
};

// 2. Metadata
export const meta: Meta = {
  id: "sketch-id",          // must match filename (e.g. "flow-01" for "flow-01.ts")
  title: "Sketch Title",
  description: "...",
  thumbnail: "/sketch-id.png",
};

// 3. Default constants
export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  myParam: 10,
  penColors: all("staedtlerPens"),
};

// 4. Control props for UI sliders/pickers
export const constantsProps = {
  myParam: { min: 1, max: 100, step: 1 },
  myBool: {},  // boolean toggle
  myOption: { options: ["a", "b", "c"] },  // dropdown
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

// 5. Sketch factory
const mySketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,               // typical for line art
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      if (seed !== null) p.noiseSeed(seed);  // add when using p.noise()

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      // Always read vars with fallback:
      const myParam = vars.myParam ?? constants.myParam;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("staedtlerPens");

      // Drawing code goes here — everything in p.setup(), no p.draw()
    };
  };

export default mySketch;
```

## Key Rules

- **No `p.draw()`** — everything in `p.setup()`. Sketches are static.
- **Always fallback**: `vars.x ?? constants.x` for every constant read.
- **`meta.id` must match filename** (minus `.ts`): `flow-01.ts` → `id: "flow-01"`.
- **Sketches are auto-registered** — no index file to update. Just create the file.
- **`useSVG: true`** by default for pen plotter output. Set to `false` for canvas-only.

## Pens API

```typescript
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";

// Get all pens in a family
const colors = all("staedtlerPens");   // DotPen[]
const colors = all("zebraSarasa");
const colors = all("lePenPens");

// Set stroke to a pen color
setStroke("staedtlerPens.red", p);
setStroke(p.random(colors) as DotPen, p);

// Use with index
const colorIdx = Math.floor(p.noise(x, y) * colors.length) % colors.length;
setStroke(colors[colorIdx], p);
```

## Canvas 2D Context Clipping (SVG-compatible)

Use for clipping lines to cells/shapes:

```typescript
const ctx = p.drawingContext as CanvasRenderingContext2D;
ctx.save();
ctx.beginPath();
ctx.rect(x, y, width, height);
ctx.clip();
// draw — output clipped to rect
ctx.restore();
```

Works in both canvas and SVG mode.

## Perlin Noise Pattern

```typescript
if (seed !== null) p.noiseSeed(seed);
const noiseOffX = p.random(1000);
const noiseOffY = p.random(1000);

// Sample
const val = p.noise(noiseOffX + x * noiseScale, noiseOffY + y * noiseScale);
const angle = val * Math.PI * 2;
```

Use different large offsets for independent noise fields (angle vs color vs position).

## Common Sketch Patterns

### Flow field
Grid of points → noise angle → dash or curve at each point.

### Hatching in cells
Grid of cells → ctx.clip() to cell → parallel lines at angle.

### Noise-bounded blob
`p.noise(cos(a) * scale, sin(a) * scale)` around a circle angle → perturbed radius.

### Circle stripe clipping (no ctx needed)
```typescript
// For stripe at perpendicular distance d from circle center:
const halfChord = Math.sqrt(r * r - d * d);
// chord runs from (cx - cos(a)*halfChord) to (cx + cos(a)*halfChord)
```

## BaseConstants fields

`width`, `height`, `marginX`, `marginY`, `debug`, `useSVG` (optional).

## Pen Families Available

| Family | Style |
|--------|-------|
| `staedtlerPens` | Fineliner, many colors |
| `zebraSarasa` | Gel, saturated |
| `lePenPens` | Felt tip, vibrant |
