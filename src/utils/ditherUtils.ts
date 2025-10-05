/**
 * Dithering utilities for creating halftone and texture effects
 */

/**
 * Standard 8x8 Bayer dithering matrix
 * Values range from 0-63, representing threshold levels
 */
const BAYER_MATRIX_8x8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
];

/**
 * 4x4 Bayer matrix for faster, coarser dithering
 */
const BAYER_MATRIX_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * 2x2 Bayer matrix for very coarse dithering
 */
const BAYER_MATRIX_2x2 = [
  [0, 2],
  [3, 1],
];

/**
 * Get the Bayer threshold value for a given position
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param matrixSize - Size of matrix (2, 4, or 8)
 * @returns Threshold value (0-3 for 2x2, 0-15 for 4x4, 0-63 for 8x8)
 */
export function getBayerThreshold(
  x: number,
  y: number,
  matrixSize: 2 | 4 | 8 = 8
): number {
  switch (matrixSize) {
    case 2:
      return BAYER_MATRIX_2x2[y % 2][x % 2];
    case 4:
      return BAYER_MATRIX_4x4[y % 4][x % 4];
    case 8:
      return BAYER_MATRIX_8x8[y % 8][x % 8];
    default:
      return BAYER_MATRIX_8x8[y % 8][x % 8];
  }
}

/**
 * Apply Bayer dithering to a grayscale value
 *
 * @param value - Grayscale value (0-255)
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param matrixSize - Size of matrix (2, 4, or 8)
 * @returns Binary result (0 or 255)
 */
export function applyBayerDither(
  value: number,
  x: number,
  y: number,
  matrixSize: 2 | 4 | 8 = 8
): number {
  const threshold = getBayerThreshold(x, y, matrixSize);
  const maxThreshold = matrixSize === 2 ? 3 : matrixSize === 4 ? 15 : 63;
  const ditherThreshold = (threshold / maxThreshold) * 255;
  return value > ditherThreshold ? 255 : 0;
}

/**
 * Floyd-Steinberg dithering for more natural-looking results
 * This modifies the input array in place
 *
 * @param values - 2D array of grayscale values (0-255)
 * @returns 2D array of binary values (0 or 255)
 */
export function applyFloydSteinbergDither(values: number[][]): number[][] {
  const height = values.length;
  const width = values[0]?.length || 0;

  // Create a copy to work with
  const working = values.map((row) => [...row]);
  const result: number[][] = [];

  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const oldValue = working[y][x];
      const newValue = oldValue > 127 ? 255 : 0;
      result[y][x] = newValue;

      const error = oldValue - newValue;

      // Distribute error to neighboring pixels
      if (x + 1 < width) {
        working[y][x + 1] += (error * 7) / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          working[y + 1][x - 1] += (error * 3) / 16;
        }
        working[y + 1][x] += (error * 5) / 16;
        if (x + 1 < width) {
          working[y + 1][x + 1] += (error * 1) / 16;
        }
      }
    }
  }

  return result;
}

/**
 * Create a dithered gradient between two colors
 * Useful for creating smooth transitions with limited colors
 *
 * @param width - Width of gradient
 * @param height - Height of gradient
 * @param horizontal - If true, gradient goes left-to-right, otherwise top-to-bottom
 * @returns 2D array of binary values
 */
export function createDitheredGradient(
  width: number,
  height: number,
  horizontal: boolean = true
): number[][] {
  const result: number[][] = [];

  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const t = horizontal ? x / (width - 1) : y / (height - 1);
      const value = t * 255;
      result[y][x] = applyBayerDither(value, x, y);
    }
  }

  return result;
}

/**
 * Calculate dither level for a given intensity
 * Returns a value from 0-1 representing how "filled" a cell should be
 *
 * @param intensity - Input intensity (0-1)
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param matrixSize - Size of Bayer matrix
 * @returns Dither level (0-1)
 */
export function getDitherLevel(
  intensity: number,
  x: number,
  y: number,
  matrixSize: 2 | 4 | 8 = 8
): number {
  const threshold = getBayerThreshold(x, y, matrixSize);
  const maxThreshold = matrixSize === 2 ? 3 : matrixSize === 4 ? 15 : 63;
  const normalizedThreshold = threshold / maxThreshold;

  return intensity > normalizedThreshold ? 1 : 0;
}
