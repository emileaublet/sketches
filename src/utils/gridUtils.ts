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
 * Generate random points within grid cells (one per cell)
 */
export const generateGridPoints = (
  p: p5SVG,
  config: GridConfig & { numPoints: number; centerPoints?: boolean }
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

  return points;
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

  p.stroke(200);

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
