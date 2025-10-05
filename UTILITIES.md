# Utility Functions Reference

This document describes all the utility functions extracted from common patterns in the sketches.

## Drawing Area Utils (`drawingArea.ts`)

### `calculateDrawArea(p, marginX, marginY)`
Calculate the drawable area after accounting for margins.

**Returns:** `{ drawW, drawH, startX, startY }`

**Example:**
```typescript
const { drawW, drawH, startX, startY } = calculateDrawArea(p, marginX, marginY);
```

### `calculateCenteredArea(p, drawW, drawH)`
Calculate the starting position to center content within the canvas.

**Returns:** `{ startX, startY }`

---

## Path Utils (`pathUtils.ts`)

### `calculatePathDistances(path)`
Calculate cumulative distances along a path. Essential for evenly distributing elements along curves.

**Returns:** `number[]` - Array of cumulative distances

**Example:**
```typescript
const dists = calculatePathDistances(path);
const totalLength = dists[dists.length - 1];
```

### `findPathSegmentIndex(dists, target)` / `binarySearchIndex(dists, target)`
Find the path segment containing a specific distance. Uses binary search for efficiency.

**Returns:** `number` - Index of the segment

**Example:**
```typescript
const idx = findPathSegmentIndex(dists, targetDistance);
```

### Existing Functions
- `createBezierRoundedPath(points, radius, bezierSteps)` - Create smooth rounded corners
- `getPointAtDistance(p, path, dists, targetDistance)` - Get point and direction at distance
- `drawPath(p, pathPoints, closed)` - Safely draw a path, filtering NaN values

---

## Line Patterns (`linePatterns.ts`)

### `drawZigzagLine(p, config)`
Draw a wavy/zigzag line with random perturbations.

**Config:**
```typescript
{
  startX: number;
  startY: number;
  segmentLen: number;
  segments: number;
  maxYOffset: number;
  color?: DotPen;
  useTranslate?: boolean; // default: true
}
```

**Example:**
```typescript
drawZigzagLine(p, {
  startX: marginX,
  startY: marginY + row * cellH,
  segmentLen: drawW / 200,
  segments: 200,
  maxYOffset: 5,
  color: "staedtlerPens.blue"
});
```

### Existing Functions
- `generatePatterns()` - Generate draw/skip patterns for line art
- `drawPerpendicularLines()` - Draw lines perpendicular to a path

---

## Path Generation (`pathGeneration.ts`)

### `generatePivotPath(p, config)`
Generate a random path that pivots at each step, staying within bounds.

**Config:**
```typescript
{
  steps: number;
  minLength: number;
  maxLength: number;
  boundingBox: { x, y, width, height };
  innerJitterFrac: number; // 0-1
  pivotAngleMin: number; // degrees
  pivotAngleMax: number; // degrees
  startFromCenter?: boolean;
}
```

**Example:**
```typescript
const path = generatePivotPath(p, {
  steps: 30,
  minLength: 20,
  maxLength: 50,
  boundingBox: { x: cellX, y: cellY, width: cellW, height: cellH },
  innerJitterFrac: 0.2,
  pivotAngleMin: 200,
  pivotAngleMax: 210
});
```

### `generateCurvedPivotPath(p, config)`
Same as `generatePivotPath` but applies Catmull-Rom curve smoothing.

---

## Array Utils (`arrayUtils.ts`)

### `shuffleArray(arr, p)`
Shuffle array in place using Fisher-Yates algorithm with p5's random.

**Returns:** The same array (modified)

**Example:**
```typescript
const colors = ["red", "blue", "green"];
shuffleArray(colors, p);
```

### `getShuffledArray(arr, p)`
Get a shuffled copy without modifying the original.

### `pickRandom(arr, count, p)`
Pick N random elements without replacement.

### `weightedRandom(arr, weights, p)`
Select one element based on weights.

**Example:**
```typescript
const item = weightedRandom(
  ["rare", "common", "uncommon"],
  [0.1, 0.7, 0.2],
  p
);
```

### `chunkArray(arr, chunkSize)`
Split array into chunks of specified size.

### `range(start, end, step)`
Create an array of numbers (like Python's range).

---

## Dither Utils (`ditherUtils.ts`)

### `getBayerThreshold(x, y, matrixSize)`
Get the Bayer threshold value for dithering.

**Matrix sizes:** `2`, `4`, or `8`

**Returns:** Threshold value (0-3, 0-15, or 0-63)

### `applyBayerDither(value, x, y, matrixSize)`
Apply Bayer dithering to a grayscale value.

**Returns:** Binary result (0 or 255)

**Example:**
```typescript
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    const gray = calculateGrayValue(x, y);
    const dithered = applyBayerDither(gray, x, y, 8);
    if (dithered > 0) {
      // Draw something
    }
  }
}
```

### `applyFloydSteinbergDither(values)`
Apply Floyd-Steinberg dithering to a 2D array.

### `createDitheredGradient(width, height, horizontal)`
Create a dithered gradient pattern.

### `getDitherLevel(intensity, x, y, matrixSize)`
Get normalized dither level (0-1) for a given intensity.

---

## Shape Patterns (`shapePatterns.ts`)

All shape pattern functions follow a similar config-based pattern.

### `drawSpiral(p, config)`
Draw a spiral within a bounding box.

**Config:** `{ x, y, size, color, turns?, points? }`

### `drawConcentricCircles(p, config)`
Draw concentric circles.

**Config:** `{ x, y, size, color, rings?, minRadius?, maxRadius? }`

### `drawConcentricSquares(p, config)`
Draw concentric squares.

**Config:** `{ x, y, size, color, layers? }`

### `drawConcentricDiamonds(p, config)`
Draw concentric diamonds (rotated squares).

**Config:** `{ x, y, size, color, layers? }`

### `drawRadialLines(p, config)`
Draw rays from center point.

**Config:** `{ x, y, size, color, rays? }`

### `drawPolygonWeb(p, config)`
Draw concentric polygons.

**Config:** `{ x, y, size, color, sides?, layers? }`

### `drawWavyLines(p, config)`
Draw horizontal wavy lines.

**Config:** `{ x, y, size, color, lines?, amplitude?, frequency? }`

### `drawBullseye(p, config)`
Draw alternating filled/unfilled rings.

**Config:** `{ x, y, size, color, rings? }`

### `drawCheckerboard(p, config)`
Draw a checkerboard pattern.

**Config:** `{ x, y, size, color, divisions? }`

**Example Usage:**
```typescript
import { drawSpiral, drawConcentricSquares } from "@/utils/shapePatterns";

// In your sketch:
drawSpiral(p, {
  x: cellX,
  y: cellY,
  size: cellSize,
  color: "gellyRollPens.50",
  turns: 5
});

drawConcentricSquares(p, {
  x: cellX,
  y: cellY,
  size: cellSize,
  color: "staedtlerPens.blue",
  layers: 4
});
```

---

## Migration Examples

### Before: Calculate draw area
```typescript
const drawW = p.width - 2 * marginX;
const drawH = p.height - 2 * marginY;
```

### After:
```typescript
import { calculateDrawArea } from "@/utils/drawingArea";

const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);
```

---

### Before: Path distances
```typescript
let dists = [0];
for (let i = 1; i < path.length; i++) {
  const dx = path[i].x - path[i - 1].x;
  const dy = path[i].y - path[i - 1].y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  dists[i] = dists[i - 1] + dist;
}
```

### After:
```typescript
import { calculatePathDistances } from "@/utils/pathUtils";

const dists = calculatePathDistances(path);
```

---

### Before: Shuffle colors
```typescript
for (let i = colors.length - 1; i > 0; i--) {
  const j = Math.floor(p.random() * (i + 1));
  [colors[i], colors[j]] = [colors[j], colors[i]];
}
```

### After:
```typescript
import { shuffleArray } from "@/utils/arrayUtils";

shuffleArray(colors, p);
```

---

## Benefits

1. **DRY Principle**: No more duplicate code across sketches
2. **Type Safety**: All functions are fully typed with clear interfaces
3. **Consistency**: Same behavior across all sketches
4. **Maintainability**: Fix bugs or improve algorithms in one place
5. **Discoverability**: Easy to find and reuse existing patterns
6. **Documentation**: Clear examples and parameter descriptions

---

## Next Steps

To use these utilities in existing sketches:

1. Import the needed functions
2. Replace inline code with utility calls
3. Test to ensure behavior is unchanged
4. Remove old commented code

Example refactoring:
```typescript
// Add imports at top of file
import { calculateDrawArea } from "@/utils/drawingArea";
import { calculatePathDistances, findPathSegmentIndex } from "@/utils/pathUtils";
import { drawZigzagLine } from "@/utils/linePatterns";

// Then use throughout your sketch...
```
