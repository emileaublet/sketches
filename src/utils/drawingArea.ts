import type { p5SVG } from "p5.js-svg";

/**
 * Calculate the drawing area dimensions after accounting for margins
 * @param p - p5 instance
 * @param marginX - horizontal margin on each side
 * @param marginY - vertical margin on each side
 * @returns Object with drawW and drawH (width and height of drawable area)
 */
export function calculateDrawArea(
  p: p5SVG,
  marginX: number,
  marginY: number
): { drawW: number; drawH: number; startX: number; startY: number } {
  const drawW = p.width - 2 * marginX;
  const drawH = p.height - 2 * marginY;
  const startX = marginX;
  const startY = marginY;

  return { drawW, drawH, startX, startY };
}

/**
 * Calculate the centered drawing area with specified dimensions
 * Useful for when you want to center content within margins
 * @param p - p5 instance
 * @param drawW - desired drawing width
 * @param drawH - desired drawing height
 * @returns Object with startX and startY for centered content
 */
export function calculateCenteredArea(
  p: p5SVG,
  drawW: number,
  drawH: number
): { startX: number; startY: number } {
  const startX = (p.width - drawW) / 2;
  const startY = (p.height - drawH) / 2;

  return { startX, startY };
}
