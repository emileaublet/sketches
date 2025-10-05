import type { p5SVG } from "p5.js-svg";
import { Point } from "./pathUtils";

/**
 * Configuration for generating a random pivot path
 */
export interface PivotPathConfig {
  steps: number;
  minLength: number;
  maxLength: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  innerJitterFrac: number; // Fraction of radius for initial jitter from center (0-1)
  pivotAngleMin: number; // Minimum pivot angle in degrees
  pivotAngleMax: number; // Maximum pivot angle in degrees
  startFromCenter?: boolean; // If true, starts from bounding box center; if false, uses random start
}

/**
 * Generate a random pivot path that stays within a bounding box
 * The path pivots at each step by a random angle and moves a random distance
 * Commonly used for creating organic, constrained path patterns
 *
 * @param p - p5 instance
 * @param config - Configuration for path generation
 * @returns Array of points forming the path
 */
export function generatePivotPath(p: p5SVG, config: PivotPathConfig): Point[] {
  const {
    boundingBox: bbox,
    steps,
    minLength,
    maxLength,
    innerJitterFrac,
  } = config;
  const pivotAngleMin = config.pivotAngleMin;
  const pivotAngleMax = config.pivotAngleMax;

  const cx0 = bbox.x + bbox.width / 2;
  const cy0 = bbox.y + bbox.height / 2;
  const maxR = Math.min(bbox.width, bbox.height) / 2;

  // Small "inner" jump off center
  const jR = p.random(-innerJitterFrac, innerJitterFrac) * maxR;
  const jA = p.random(p.TWO_PI);
  const cx1 = cx0 + Math.cos(jA) * jR;
  const cy1 = cy0 + Math.sin(jA) * jR;

  let heading = Math.atan2(cy1 - cy0, cx1 - cx0);

  // Collect points
  const pts: Point[] = [];

  if (config.startFromCenter !== false) {
    pts.push({ x: cx0, y: cy0 });
  }
  pts.push({ x: cx1, y: cy1 });

  let x = cx1;
  let y = cy1;

  for (let k = 0; k < steps; k++) {
    let nx: number, ny: number;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      heading += p.radians(p.random(pivotAngleMin, pivotAngleMax));
      const len = p.random(minLength, maxLength);
      nx = x + Math.cos(heading) * len;
      ny = y + Math.sin(heading) * len;
      attempts++;

      // Break if we can't find a valid point after many attempts
      if (attempts > maxAttempts) {
        // Use the last valid point
        nx = x;
        ny = y;
        break;
      }
    } while (
      nx < bbox.x ||
      nx > bbox.x + bbox.width ||
      ny < bbox.y ||
      ny > bbox.y + bbox.height
    );

    pts.push({ x: nx, y: ny });
    x = nx;
    y = ny;
  }

  return pts;
}

/**
 * Generate a smooth curved pivot path using the same logic as generatePivotPath
 * but then applies curve interpolation for smoother results
 *
 * @param p - p5 instance
 * @param config - Configuration for path generation
 * @returns Array of points forming a smooth curved path
 */
export function generateCurvedPivotPath(
  p: p5SVG,
  config: PivotPathConfig
): Point[] {
  const rawPath = generatePivotPath(p, config);

  // Generate smooth curve points
  const smoothPath: Point[] = [];

  // Need at least 3 points to create curves
  if (rawPath.length < 3) {
    return rawPath;
  }

  // Use catmull-rom style curve vertices
  // First point
  smoothPath.push(rawPath[0]);

  // Generate intermediate curve points
  for (let i = 0; i < rawPath.length; i++) {
    const prevIdx = Math.max(0, i - 1);
    const nextIdx = Math.min(rawPath.length - 1, i + 1);
    const nextNextIdx = Math.min(rawPath.length - 1, i + 2);

    const p0 = rawPath[prevIdx];
    const p1 = rawPath[i];
    const p2 = rawPath[nextIdx];
    const p3 = rawPath[nextNextIdx];

    // Generate points along the curve segment
    const steps = 10;
    for (let t = 0; t <= steps; t++) {
      const u = t / steps;
      const u2 = u * u;
      const u3 = u2 * u;

      // Catmull-Rom curve calculation
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);

      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);

      smoothPath.push({ x, y });
    }
  }

  return smoothPath;
}
