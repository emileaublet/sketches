import { p5SVG } from "p5.js-svg";

export interface Point {
  x: number;
  y: number;
}

/**
 * Create a bezier rounded path from a series of points
 */
export const createBezierRoundedPath = (
  points: Point[],
  radius: number,
  bezierSteps: number = 10
): Point[] => {
  if (points.length < 3) return points;

  let roundedPath: Point[] = [];

  // Add the first point as-is (no rounding at start)
  roundedPath.push(points[0]);

  // Process middle points (with rounding)
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[i + 1];

    // Create vectors (ba and bc)
    const baX = a.x - b.x;
    const baY = a.y - b.y;
    const bcX = c.x - b.x;
    const bcY = c.y - b.y;

    // Normalize vectors
    const baLen = Math.sqrt(baX * baX + baY * baY);
    const bcLen = Math.sqrt(bcX * bcX + bcY * bcY);

    if (baLen < 0.1 || bcLen < 0.1) {
      roundedPath.push(b);
      continue;
    }

    const baNormX = baX / baLen;
    const baNormY = baY / baLen;
    const bcNormX = bcX / bcLen;
    const bcNormY = bcY / bcLen;

    // Calculate angle between vectors
    const dot = baNormX * bcNormX + baNormY * bcNormY;
    const theta = Math.acos(Math.max(-1, Math.min(1, dot)));

    // Skip if it's nearly a straight line or if angle is too small
    if (theta < 0.1 || Math.abs(Math.sin(theta / 2)) < 0.001) {
      roundedPath.push(b);
      continue;
    }

    // Calculate maximum radius and clamp
    const distAB = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    const distBC = Math.sqrt((c.x - b.x) ** 2 + (c.y - b.y) ** 2);
    const maxR = (Math.min(distAB, distBC) / 2) * Math.abs(Math.sin(theta / 2));
    const cornerR = Math.min(radius, maxR);

    // Calculate distance from corner - add safety check
    const sinHalfTheta = Math.sin(theta / 2);
    if (Math.abs(sinHalfTheta) < 0.001) {
      roundedPath.push(b);
      continue;
    }
    const distance = Math.abs(cornerR / sinHalfTheta);

    // Calculate control points for bezier
    const c1X = b.x + baNormX * distance;
    const c1Y = b.y + baNormY * distance;
    const c2X = b.x + bcNormX * distance;
    const c2Y = b.y + bcNormY * distance;

    // Bezier control point distance (magic number for circular approximation)
    const bezierDist = 0.5523;
    const p1X = c1X - baNormX * 2 * cornerR * bezierDist;
    const p1Y = c1Y - baNormY * 2 * cornerR * bezierDist;
    const p2X = c2X - bcNormX * 2 * cornerR * bezierDist;
    const p2Y = c2Y - bcNormY * 2 * cornerR * bezierDist;

    // Add start point
    roundedPath.push({ x: c1X, y: c1Y });

    // Generate bezier curve points
    for (let t = 1; t <= bezierSteps; t++) {
      const u = t / bezierSteps;
      const u2 = u * u;
      const u3 = u2 * u;
      const oneMinusU = 1 - u;
      const oneMinusU2 = oneMinusU * oneMinusU;
      const oneMinusU3 = oneMinusU2 * oneMinusU;

      const x =
        oneMinusU3 * c1X +
        3 * oneMinusU2 * u * p1X +
        3 * oneMinusU * u2 * p2X +
        u3 * c2X;
      const y =
        oneMinusU3 * c1Y +
        3 * oneMinusU2 * u * p1Y +
        3 * oneMinusU * u2 * p2Y +
        u3 * c2Y;

      roundedPath.push({ x, y });
    }
  }

  // Add the last point as-is (no rounding at end)
  roundedPath.push(points[points.length - 1]);

  return roundedPath;
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
