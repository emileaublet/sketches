import { p5SVG } from "p5.js-svg";

export interface GridConfig {
  width: number;
  height: number;
  marginX: number;
  marginY: number;
  cols?: number;
  rows?: number;
  cellSize?: number;
}

export interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  col: number;
  row: number;
}

/**
 * Calculate grid dimensions and cell positions
 */
export const createGrid = (
  config: GridConfig
): {
  cells: GridCell[];
  cellWidth: number;
  cellHeight: number;
  drawWidth: number;
  drawHeight: number;
} => {
  const drawWidth = config.width - 2 * config.marginX;
  const drawHeight = config.height - 2 * config.marginY;

  let cellWidth: number;
  let cellHeight: number;
  let cols: number;
  let rows: number;

  if (config.cellSize) {
    cellWidth = config.cellSize;
    cellHeight = config.cellSize;
    cols = Math.floor(drawWidth / cellWidth);
    rows = Math.floor(drawHeight / cellHeight);
  } else if (config.cols && config.rows) {
    cols = config.cols;
    rows = config.rows;
    cellWidth = drawWidth / cols;
    cellHeight = drawHeight / rows;
  } else if (config.cols) {
    cols = config.cols;
    cellWidth = drawWidth / cols;
    cellHeight = cellWidth; // Square cells
    rows = Math.floor(drawHeight / cellHeight);
  } else if (config.rows) {
    rows = config.rows;
    cellHeight = drawHeight / rows;
    cellWidth = cellHeight; // Square cells
    cols = Math.floor(drawWidth / cellWidth);
  } else {
    throw new Error(
      "Must specify either cellSize, cols, rows, or both cols and rows"
    );
  }

  const cells: GridCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = config.marginX + col * cellWidth;
      const y = config.marginY + row * cellHeight;

      cells.push({
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        centerX: x + cellWidth / 2,
        centerY: y + cellHeight / 2,
        col,
        row,
      });
    }
  }

  return {
    cells,
    cellWidth,
    cellHeight,
    drawWidth,
    drawHeight,
  };
};

/**
 * Sort points to create a smooth path without U-turns using nearest neighbor
 * @param points - Array of points to sort
 * @param smoothness - Controls how much to penalize direction changes (0-100)
 *                     0 = only distance matters, 100 = heavily penalize U-turns
 */
const sortPointsForSmoothPath = (
  points: { x: number; y: number }[],
  smoothness: number = 80
): { x: number; y: number }[] => {
  if (points.length === 0) return points;

  const sorted: { x: number; y: number }[] = [];
  const remaining = [...points];

  // Start with the top-left point
  let current = remaining.reduce((closest, point) =>
    point.x + point.y < closest.x + closest.y ? point : closest
  );

  sorted.push(current);
  remaining.splice(remaining.indexOf(current), 1);

  // Greedy nearest neighbor with look-ahead to avoid U-turns
  while (remaining.length > 0) {
    let bestNext = remaining[0];
    let bestScore = Infinity;

    for (const candidate of remaining) {
      // Distance to candidate
      const dist = Math.sqrt(
        Math.pow(candidate.x - current.x, 2) +
          Math.pow(candidate.y - current.y, 2)
      );

      // Check angle if we have previous points (avoid sharp reversals)
      let angleScore = 0;
      if (sorted.length >= 2) {
        const prev = sorted[sorted.length - 2];

        // Vector from prev to current
        const v1x = current.x - prev.x;
        const v1y = current.y - prev.y;

        // Vector from current to candidate
        const v2x = candidate.x - current.x;
        const v2y = candidate.y - current.y;

        // Dot product to measure alignment (-1 = opposite direction, 1 = same direction)
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

        if (mag1 > 0 && mag2 > 0) {
          const cosAngle = dot / (mag1 * mag2);
          // Penalize backward movement more aggressively
          // cosAngle: 1 = same direction, 0 = perpendicular, -1 = opposite
          // Using exponential penalty for sharper curves
          const anglePenalty = Math.pow(1 - cosAngle, 2); // 0 to 4
          angleScore = anglePenalty * 5 * smoothness; // Up to 2000 with smoothness=100
        }
      }

      // Also consider looking ahead further to avoid creating tight loops
      let lookaheadPenalty = 0;
      if (sorted.length >= 3 && smoothness > 50) {
        // Check if candidate would create a path that curves back
        const lookback = sorted[sorted.length - 3];
        const distToLookback = Math.sqrt(
          Math.pow(candidate.x - lookback.x, 2) +
            Math.pow(candidate.y - lookback.y, 2)
        );

        // Penalize if getting closer to older points (creating loops)
        const distFromCurrent = Math.sqrt(
          Math.pow(current.x - lookback.x, 2) +
            Math.pow(current.y - lookback.y, 2)
        );

        if (distToLookback < distFromCurrent) {
          lookaheadPenalty =
            (distFromCurrent - distToLookback) * 2 * smoothness;
        }
      }

      const score = dist + angleScore + lookaheadPenalty;

      if (score < bestScore) {
        bestScore = score;
        bestNext = candidate;
      }
    }

    sorted.push(bestNext);
    remaining.splice(remaining.indexOf(bestNext), 1);
    current = bestNext;
  }

  return sorted;
};

/**
 * Generate random points within grid cells (one per cell)
 */
export const generateGridPoints = (
  p: p5SVG,
  config: GridConfig & {
    numPoints: number;
    centerPoints?: boolean;
    pathSmoothness?: number; // 0-100, controls how aggressively to avoid U-turns
  }
): { x: number; y: number }[] => {
  const gridSize = Math.ceil(Math.sqrt(config.numPoints));
  const cellWidth = (config.width - 2 * config.marginX) / gridSize;
  const cellHeight = (config.height - 2 * config.marginY) / gridSize;
  const occupiedCells = new Set<string>();
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < config.numPoints; i++) {
    let attempts = 0;
    let placed = false;

    while (!placed && attempts < 100) {
      const cellX = Math.floor(p.random(0, gridSize));
      const cellY = Math.floor(p.random(0, gridSize));
      const cellKey = `${cellX},${cellY}`;

      if (!occupiedCells.has(cellKey)) {
        let x: number, y: number;

        if (config.centerPoints) {
          // Place point in center of cell
          x = config.marginX + cellX * cellWidth + cellWidth / 2;
          y = config.marginY + cellY * cellHeight + cellHeight / 2;
        } else {
          // Place point randomly within cell
          x = config.marginX + cellX * cellWidth + p.random(0, cellWidth);
          y = config.marginY + cellY * cellHeight + p.random(0, cellHeight);
        }

        points.push({ x, y });
        occupiedCells.add(cellKey);
        placed = true;
      }
      attempts++;
    }
  }

  // Sort points to avoid U-turns
  const smoothness =
    config.pathSmoothness !== undefined ? config.pathSmoothness : 80;
  return sortPointsForSmoothPath(points, smoothness);
};

/**
 * Draw debug grid lines
 */
export const drawDebugGrid = (
  p: p5SVG,
  config: GridConfig,
  gridSize?: number
) => {
  const actualGridSize = gridSize || Math.ceil(Math.sqrt(10)); // default grid
  const cellWidth = (config.width - 2 * config.marginX) / actualGridSize;
  const cellHeight = (config.height - 2 * config.marginY) / actualGridSize;

  p.stroke(255, 0, 0, 20);

  // Vertical lines
  for (let i = 0; i <= actualGridSize; i++) {
    const x = config.marginX + i * cellWidth;
    p.line(x, config.marginY, x, config.height - config.marginY);
  }

  // Horizontal lines
  for (let i = 0; i <= actualGridSize; i++) {
    const y = config.marginY + i * cellHeight;
    p.line(config.marginX, y, config.width - config.marginX, y);
  }
};
