import { p5SVG } from "p5.js-svg";

export interface NoiseRectOptions {
  x1: number; // Top-left x
  y1: number; // Top-left y
  x2: number; // Bottom-right x
  y2: number; // Bottom-right y
  density: number; // 0-100, percentage of how filled the area should be
  pointSize: number; // Size of each dot
  color: any; // Color for the dots (p5 color type)
}

/**
 * Fill a rectangular area with randomly distributed dots at a specified density
 * Uses spatial grid optimization for O(n) performance instead of O(n²)
 *
 * @param p - p5 instance
 * @param options - Configuration for the noise rectangle
 * @returns Array of placed points (useful for debugging or further processing)
 */
export const drawNoiseRect = (
  p: p5SVG,
  options: NoiseRectOptions
): { x: number; y: number }[] => {
  const { x1, y1, x2, y2, density, pointSize, color } = options;

  // Calculate area dimensions
  const width = x2 - x1;
  const height = y2 - y1;
  const totalArea = width * height;

  // Calculate number of points based on density (0-100)
  // At 100% density, points are very close but not touching
  const pointSpacing = pointSize * 2; // Minimum distance between points
  const maxPoints = totalArea / (pointSpacing * pointSpacing);
  const numPoints = Math.floor((density / 100) * maxPoints);

  // Early exit for zero density
  if (numPoints === 0) return [];

  // Spatial grid for O(1) neighbor lookup
  const cellSize = pointSpacing; // Each cell is one spacing unit
  const grid: Map<string, { x: number; y: number }[]> = new Map();

  // Helper to get grid cell key
  const getCellKey = (x: number, y: number): string => {
    const col = Math.floor((x - x1) / cellSize);
    const row = Math.floor((y - y1) / cellSize);
    return `${col},${row}`;
  };

  // Helper to check if point is too close to existing points
  const isTooClose = (x: number, y: number): boolean => {
    const col = Math.floor((x - x1) / cellSize);
    const row = Math.floor((y - y1) / cellSize);

    // Only check neighboring cells (9 cells: current + 8 neighbors)
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const key = `${col + i},${row + j}`;
        const cellPoints = grid.get(key);
        if (cellPoints) {
          for (const existing of cellPoints) {
            const dx = x - existing.x;
            const dy = y - existing.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < pointSpacing * pointSpacing) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  // Store placed points
  const placedPoints: { x: number; y: number }[] = [];

  // Set up drawing style
  p.stroke(color);
  p.strokeWeight(pointSize);

  // Limit attempts to prevent infinite loops at high density
  let attempts = 0;
  const maxAttempts = numPoints * 50; // Reduced multiplier since grid is faster

  while (placedPoints.length < numPoints && attempts < maxAttempts) {
    attempts++;

    // Random position within the rectangle
    const x = x1 + p.random(width);
    const y = y1 + p.random(height);

    if (!isTooClose(x, y)) {
      // Add to grid
      const key = getCellKey(x, y);
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push({ x, y });

      // Add to results and draw
      placedPoints.push({ x, y });
      p.line(x, y, x + 0.01, y + 0.01); // Draw a point as a very short line
    }
  }

  return placedPoints;
};
