import { p5SVG } from "p5.js-svg";
import roundPolygon, { getSegments } from "round-polygon";

export interface Point {
  x: number;
  y: number;
}

/**
 * Create a rounded path from a series of points using the round-polygon library
 * This library provides mathematically correct rounding with automatic overlap prevention
 * @param points - Array of points to round
 * @param radius - Corner radius
 * @param bezierSteps - Number of segments per arc (controls smoothness)
 * @returns Array of points representing the smoothly rounded path
 */
export const createBezierRoundedPath = (
  points: Point[],
  radius: number,
  bezierSteps: number = 10
): Point[] => {
  if (points.length < 3) return points;

  // Use round-polygon library for proper corner rounding
  // It automatically handles overlap prevention and edge cases
  const roundedPolygon = roundPolygon(points, radius);

  // Convert the rounded polygon to segments
  // Use bezierSteps to control segment density
  const segments = getSegments(roundedPolygon, "AMOUNT", bezierSteps);

  return segments;
};

/**
 * Calculate cumulative distances along a path
 * Used for evenly distributing elements along a path or finding positions at specific distances
 * @param path - Array of points representing the path
 * @returns Array of cumulative distances, where index i contains the total distance from start to point i
 */
export const calculatePathDistances = (path: Point[]): number[] => {
  const dists = [0];
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    dists[i] = dists[i - 1] + dist;
  }
  return dists;
};

/**
 * Binary search to find the segment index for a given distance along the path
 * More efficient than linear search for long paths
 * @param dists - Array of cumulative distances (from calculatePathDistances)
 * @param target - Target distance along the path
 * @returns Index of the path segment containing the target distance
 */
export const binarySearchIndex = (dists: number[], target: number): number => {
  let lo = 0,
    hi = dists.length - 2;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (dists[mid] <= target && target < dists[mid + 1]) return mid;
    if (dists[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return Math.max(0, Math.min(dists.length - 2, lo));
};

/**
 * Alias for clarity in different contexts
 */
export const findPathSegmentIndex = binarySearchIndex;

/**
 * Get a point at a specific distance along a path
 */
export const getPointAtDistance = (
  p: p5SVG,
  path: Point[],
  dists: number[],
  targetDistance: number
): { point: Point; direction: Point } => {
  const idx = binarySearchIndex(dists, targetDistance);
  const p0 = path[idx];
  const p1 = path[Math.min(idx + 1, path.length - 1)];
  const segLen = dists[idx + 1] - dists[idx] || 1;
  const localT = (targetDistance - dists[idx]) / segLen;

  const point = {
    x: p.lerp(p0.x, p1.x, localT),
    y: p.lerp(p0.y, p1.y, localT),
  };

  // Calculate direction from path segments, with smoothing for better results
  let dx = p1.x - p0.x;
  let dy = p1.y - p0.y;

  // If the segment is too short, look for a longer span
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    const span = Math.min(5, Math.floor(path.length / 10));
    const backIdx = Math.max(0, idx - span);
    const forwardIdx = Math.min(path.length - 1, idx + span);
    dx = path[forwardIdx].x - path[backIdx].x;
    dy = path[forwardIdx].y - path[backIdx].y;
  }

  // Final fallback
  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
    dx = 1;
    dy = 0;
  }

  return {
    point,
    direction: { x: dx, y: dy },
  };
};

/**
 * Draw a path safely, filtering out NaN values
 */
export const drawPath = (
  p: p5SVG,
  pathPoints: Point[],
  closed: boolean = false
) => {
  p.beginShape();
  for (const pt of pathPoints) {
    if (!isNaN(pt.x) && !isNaN(pt.y) && isFinite(pt.x) && isFinite(pt.y)) {
      p.vertex(pt.x, pt.y);
    }
  }
  if (closed) {
    p.endShape(p.CLOSE);
  } else {
    p.endShape();
  }
};
