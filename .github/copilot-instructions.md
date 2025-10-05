# Copilot Instructions for Generative Art Sketches

## Project Overview

This is a **p5.js generative art gallery** built with React + Vite. Each sketch is a self-contained TypeScript file that exports a p5.js drawing function, metadata, and configurable constants for Leva controls.

## Sketch Architecture

### File Structure Pattern

Every sketch in `src/sketches/` follows this mandatory pattern:

```typescript
import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";

// 1. Export metadata for the gallery
export const meta: Meta = {
  id: "sketch-name",
  title: "Display Title",
  description: "Brief description",
  thumbnail: "/sketch-name.png",
};

// 2. Define typed constants (extends BaseConstants)
type Constants = BaseConstants & {
  // Add sketch-specific properties
  bezierSteps: number;
  numPoints: number;
};

export const constants: Constants = {
  width: 500,
  height: 500,
  marginX: 50,
  marginY: 50,
  debug: false,
  // ... custom properties
};

// 3. Export sketch factory function
const sketchFactory =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        debug: vars.debug ?? constants.debug,
        // ... other setup options
      });

      // Drawing code here
    };
  };

export default sketchFactory;
```

**Critical Points:**

- Sketches with `.draft` or `.archive` extensions are ignored by the loader
- The `slug` is auto-generated from filename (e.g., `stairs-01.ts` → `stairs-01`)
- All sketches use `p5SVG` from `p5.js-svg` for SVG export capability
- Constants must use `vars` param values with fallback to default `constants`

## Color System (Pens)

Colors are referenced by **dot notation strings** typed as `DotPen`:

```typescript
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";

const color: DotPen = "staedtlerPens.blue"; // family.penName
setStroke(color, p); // Sets stroke color + width + opacity
```

**Pen families** are defined in `src/pens/pens.json` with properties:

- `lineWidth`: Physical pen width (e.g., 0.3mm)
- `opaque`: Whether pen is opaque or transparent
- `pens`: Object mapping pen names to RGBA arrays

Use `all("staedtlerPens")` to get all pens from a family.

## Essential Utilities (see UTILITIES.md for full reference)

### Canvas Setup

```typescript
import { setupCanvas } from "@/utils/canvasSetup";

setupCanvas(p, {
  width: 500,
  height: 500,
  seed: 42, // null for random
  marginX: 50,
  marginY: 50,
  noFill: true, // Default: true
  noLoop: true, // For static sketches
  strokeWeight: 0.3,
  debug: false, // Shows margin guides
  colorMode: "RGB", // or "HSB"
  angleMode: "DEGREES", // or "RADIANS"
});
```

### Path Utilities

```typescript
import {
  createBezierRoundedPath, // Smooth corners with bezier curves
  getPointAtDistance, // Get point along path at specific distance
  calculatePathDistances, // For evenly spacing elements
  drawPath, // Safe path drawing (filters NaN)
} from "@/utils/pathUtils";

// Common pattern: distribute elements evenly along a curve
const dists = calculatePathDistances(path);
const totalLength = dists[dists.length - 1];
for (let i = 0; i < count; i++) {
  const targetDist = (i / count) * totalLength;
  const point = getPointAtDistance(p, path, dists, targetDist);
}
```

### Grid Generation

```typescript
import { createGrid, generateGridPoints } from "@/utils/gridUtils";

// Generate cell boundaries
const grid = createGrid(p, {
  cols: 10,
  rows: 10,
  drawW,
  drawH,
  startX,
  startY,
  padding: 5,
});

// Or just get center points
const points = generateGridPoints(p, {
  cols,
  rows,
  drawW,
  drawH,
  startX,
  startY,
});
```

### Pattern Generation

```typescript
import { generatePatterns } from "@/utils/linePatterns";

// For draw/skip patterns in line art
const patterns = generatePatterns(p, {
  maxGapInPattern: 8,
  insideRangeProbability: 0.8,
  outsideRangeProbability: 0.2,
  minDraw: 2,
  maxDraw: 8,
  minSkip: 1,
  maxSkip: 5,
});
```

## Constants System & Leva Controls

Use typed constant interfaces from `src/utils/constants.ts`:

- `BaseConstants` - Required: width, height, marginX, marginY, debug, rotate
- `GridConstants` - cols, rows, padding, gridCellSize
- `LineConstants` - lineThickness, lineLengthMin/Max, linesPerSegment
- `PathConstants` - bezierSteps, cornerRadius, pathSmoothing
- `NodeConstants` - numNodes, nodeSize, nodeSpacing

The `constants` export automatically generates Leva UI controls. Values are passed through the `vars` parameter in the sketch factory.

## Drawing Area Calculations

Standard pattern for margins:

```typescript
const marginX = vars.marginX ?? constants.marginX;
const marginY = vars.marginY ?? constants.marginY;
const drawW = p.width - 2 * marginX;
const drawH = p.height - 2 * marginY;
```

## Development Workflows

**Run dev server:** `npm run dev` (Vite dev server on http://localhost:5173)
**Build:** `npm run build` (outputs to `dist/`)
**Lint:** `npm run lint`

**Creating new sketches:**

1. Copy `src/sketches/new-sketch-01.ts` as template
2. Update `meta.id`, `meta.title`, and `meta.description`
3. Define custom `Constants` type extending `BaseConstants`
4. Implement drawing logic in `p.setup` (or `p.draw` for animations)
5. Add thumbnail image to `public/` matching the sketch ID

**Testing sketches:**

- Use `debug: true` in constants to see margin guides
- Leva controls automatically appear in UI for tweaking
- Use `.draft` extension to hide from gallery while developing

## Key Conventions

- **Import alias:** `@/` maps to `src/`
- **SVG export:** All sketches use `p5SVG` and call `setupCanvas()` with `p.SVG` canvas type
- **Randomness:** Always use `p.random()` and `p.randomSeed()` for reproducibility
- **Type safety:** Use `DotPen` for colors, define typed `Constants` interfaces
- **Null handling:** Seed can be `null` for true random, or number for reproducible output
- **Responsive:** P5Wrapper handles zoom/pan controls automatically

## Common Patterns

**Random selection from pen family:**

```typescript
const colors = all("staedtlerPens");
const randomColor = p.random(colors);
setStroke(randomColor, p);
```

**Fallback pattern for optional properties:**

```typescript
const value = vars.customProp ?? constants.customProp;
```

**Safe path drawing (filters NaN/undefined):**

```typescript
import { drawPath } from "@/utils/pathUtils";
drawPath(p, pathPoints, (closed = false));
```
