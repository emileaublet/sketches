import { p5SVG } from "p5.js-svg";

/**
 * Draw a horizontal wavy line with random y-offsets
 * @param p - p5 instance
 * @param startX - Starting x position
 * @param startY - Starting y position
 * @param segmentLen - Length of each segment
 * @param segments - Number of segments
 * @param maxYOffset - Maximum random y offset for each vertex
 */
export const drawHorizontalWavyLine = (
  p: p5SVG,
  startX: number,
  startY: number,
  segmentLen: number,
  segments: number,
  maxYOffset: number
) => {
  p.push();
  p.translate(startX, startY);
  p.beginShape();
  for (let i = 0; i <= segments; i++) {
    const x = i * segmentLen;
    const y = p.random(-maxYOffset, maxYOffset);
    p.vertex(x, y);
  }
  p.endShape();
  p.pop();
};

/**
 * Draw a vertical wavy line with random x-offsets
 * @param p - p5 instance
 * @param startX - Starting x position
 * @param startY - Starting y position
 * @param segmentLen - Length of each segment
 * @param segments - Number of segments
 * @param maxXOffset - Maximum random x offset for each vertex
 */
export const drawVerticalWavyLine = (
  p: p5SVG,
  startX: number,
  startY: number,
  segmentLen: number,
  segments: number,
  maxXOffset: number
) => {
  p.push();
  p.translate(startX, startY);
  p.beginShape();
  for (let i = 0; i <= segments; i++) {
    const x = p.random(-maxXOffset, maxXOffset);
    const y = i * segmentLen;
    p.vertex(x, y);
  }
  p.endShape();
  p.pop();
};

/**
 * Recursively split a rectangular space into smaller rectangles
 * Useful for creating grid-like subdivisions with variation
 * @param p - p5 instance
 * @param x - Starting x position
 * @param y - Starting y position
 * @param w - Width of the space
 * @param h - Height of the space
 * @param count - Number of subdivisions to create
 * @param cellSize - Grid size to snap to (ensures alignment)
 * @returns Array of rectangles with x, y, w, h properties
 */
export const splitSpace = (
  p: p5SVG,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
  cellSize: number
): { x: number; y: number; w: number; h: number }[] => {
  // Enforce snapping to cellSize
  x = snapToGrid(p, x, cellSize);
  y = snapToGrid(p, y, cellSize);
  w = snapToGrid(p, w, cellSize);
  h = snapToGrid(p, h, cellSize);

  if (count <= 1) {
    return [{ x, y, w, h }];
  }

  let splitVertically = p.random() < 0.5;

  // Force split direction to avoid skinny slices
  if (w > h * 1.5) splitVertically = true;
  if (h > w * 1.5) splitVertically = false;

  if (splitVertically && w >= 2 * cellSize) {
    const split = snapToGrid(p, randomBetween(p, w * 0.3, w * 0.7), cellSize);
    const countA = Math.floor(randomBetween(p, 1, count));
    const countB = count - countA;

    return [
      ...splitSpace(p, x, y, split, h, countA, cellSize),
      ...splitSpace(p, x + split, y, w - split, h, countB, cellSize),
    ];
  } else if (!splitVertically && h >= 2 * cellSize) {
    const split = snapToGrid(p, randomBetween(p, h * 0.3, h * 0.7), cellSize);
    const countA = Math.floor(randomBetween(p, 1, count));
    const countB = count - countA;

    return [
      ...splitSpace(p, x, y, w, split, countA, cellSize),
      ...splitSpace(p, x, y + split, w, h - split, countB, cellSize),
    ];
  }

  // If unable to split further (e.g., too small), return as is
  return [{ x, y, w, h }];
};

/**
 * Generate a random number between min and max
 * @param p - p5 instance (for consistent random seed)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number between min and max
 */
export const randomBetween = (p: p5SVG, min: number, max: number): number => {
  return p.random() * (max - min) + min;
};

/**
 * Snap a value to the nearest grid cell
 * @param p - p5 instance (for rounding function)
 * @param value - Value to snap
 * @param cellSize - Grid cell size
 * @returns Value snapped to nearest grid cell
 */
export const snapToGrid = (
  p: p5SVG,
  value: number,
  cellSize: number
): number => {
  return p.round(value / cellSize) * cellSize;
};
