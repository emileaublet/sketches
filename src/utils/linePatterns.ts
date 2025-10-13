import { p5SVG } from "p5.js-svg";
import { DotPen } from "@/pens";
import { setStroke } from "./setStroke";
import { Point, calculatePathDistances, getPointAtDistance } from "./pathUtils";

export interface LinePatternConfig {
  // Segment size
  segmentLengthMin: number; // Minimum length of a draw segment (in pixels)
  segmentLengthMax: number; // Maximum length of a draw segment (in pixels)

  // Gap between segments
  segmentGapMin: number; // Minimum gap between segments (in pixels)
  segmentGapMax: number; // Maximum gap between segments (in pixels)

  // Line density within segments
  lineDensityMin: number; // Minimum number of lines per 100 pixels of segment
  lineDensityMax: number; // Maximum number of lines per 100 pixels of segment

  // Line appearance
  lineThickness: number;
  lineLengthMin: number;
  lineLengthMax: number;

  // Color zoning
  drawInZone: number; // Probability (0-100) of drawing when inside this color's zone
  drawOutsideZone: number; // Probability (0-100) of drawing when outside this color's zone

  // Options
  linesStartOnPath?: boolean; // true = lines start on path, false = centered on path
  avoidIntersections?: boolean; // If true, lines won't be drawn where they would intersect existing lines
} // Global line tracking for intersection detection
interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

let drawnLines: LineSegment[] = [];

/**
 * Reset the drawn lines tracker. Call this before drawing a new set of paths.
 */
export const resetDrawnLines = () => {
  drawnLines = [];
};

/**
 * Calculate the intersection point of two line segments
 * Returns the parameter t (0-1) along line1 where intersection occurs, or null if no intersection
 */
const getIntersectionParameter = (
  line1: LineSegment,
  line2: LineSegment,
  tolerance: number = 0.5
): number | null => {
  const { x1: x1, y1: y1, x2: x2, y2: y2 } = line1;
  const { x1: x3, y1: y3, x2: x4, y2: y4 } = line2;

  // Calculate the denominator
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel if denominator is 0
  if (Math.abs(denom) < 0.0001) {
    return null;
  }

  // Calculate intersection parameters
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  // Check if intersection occurs within both line segments
  if (
    ua >= -tolerance &&
    ua <= 1 + tolerance &&
    ub >= -tolerance &&
    ub <= 1 + tolerance
  ) {
    return ua; // Return the parameter along line1
  }

  return null;
};

/**
 * Generate segments with draw/skip pattern along the path
 * Returns array of segments: { start: position (0-1), length: distance, shouldDraw: boolean }
 */
interface PathSegment {
  start: number; // Position along path (0-1)
  length: number; // Length in pixels
  shouldDraw: boolean; // true = draw lines, false = skip
}

const generateSegments = (
  p: p5SVG,
  totalPathLength: number,
  config: LinePatternConfig,
  colorIndex: number,
  totalColors: number
): PathSegment[] => {
  const segments: PathSegment[] = [];
  let currentDist = 0;

  // Determine the range for this color
  const rangeStart = (colorIndex / totalColors) * totalPathLength;
  const rangeEnd = ((colorIndex + 1) / totalColors) * totalPathLength;

  while (currentDist < totalPathLength) {
    // Determine if we're inside this color's zone
    const isInColorRange = currentDist >= rangeStart && currentDist < rangeEnd;

    // Use probability to determine if we should draw (convert 0-100 to 0-1)
    const drawProbability = isInColorRange
      ? config.drawInZone / 100
      : config.drawOutsideZone / 100;
    const shouldDraw = p.random() < drawProbability;

    if (shouldDraw) {
      // Draw segment
      const segmentLength = p.random(
        config.segmentLengthMin,
        config.segmentLengthMax
      );
      segments.push({
        start: currentDist / totalPathLength,
        length: segmentLength,
        shouldDraw: true,
      });
      currentDist += segmentLength;

      // Gap after draw segment
      const gapLength = p.random(config.segmentGapMin, config.segmentGapMax);
      segments.push({
        start: currentDist / totalPathLength,
        length: gapLength,
        shouldDraw: false,
      });
      currentDist += gapLength;
    } else {
      // Skip segment (no draw)
      const skipLength = p.random(
        config.segmentLengthMin,
        config.segmentLengthMax
      );
      segments.push({
        start: currentDist / totalPathLength,
        length: skipLength,
        shouldDraw: false,
      });
      currentDist += skipLength;
    }
  }

  return segments;
};

/**
 * Draw perpendicular lines along a path with segments and gaps
 */
export const drawPerpendicularLines = (
  p: p5SVG,
  path: Point[],
  color: DotPen,
  config: LinePatternConfig,
  index: number = 0,
  totalColors: number = 1
) => {
  if (path.length === 0) return;

  const dists = calculatePathDistances(path);
  const totalPathLength = dists[dists.length - 1];

  // Generate segments for this path
  const segments = generateSegments(
    p,
    totalPathLength,
    config,
    index,
    totalColors
  );

  // Process each segment
  for (const segment of segments) {
    if (!segment.shouldDraw) continue;

    // Calculate how many lines to draw in this segment based on density
    const density = p.random(config.lineDensityMin, config.lineDensityMax);
    const numLines = Math.max(1, Math.floor((segment.length / 100) * density));

    // Generate positions within this segment
    for (let i = 0; i < numLines; i++) {
      // Position within the segment (evenly distributed with slight randomness)
      const segmentProgress = i / Math.max(1, numLines - 1);
      const randomOffset = p.random(-0.05, 0.05);
      const positionInSegment = Math.max(
        0,
        Math.min(1, segmentProgress + randomOffset)
      );

      // Convert to absolute position along the path
      const absolutePos =
        segment.start + (positionInSegment * segment.length) / totalPathLength;
      if (absolutePos >= 1) continue;

      const target = absolutePos * totalPathLength;

      const { point, direction } = getPointAtDistance(p, path, dists, target);

      // Each line gets its own random length
      const lineLen = p.random(config.lineLengthMin, config.lineLengthMax);

      // Calculate simple perpendicular vector (rotate 90° clockwise)
      let perpX = direction.y;
      let perpY = -direction.x;

      // Normalize the perpendicular vector
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
      if (perpLen > 0) {
        perpX /= perpLen;
        perpY /= perpLen;
      }

      // Compute endpoints of the line segment using perpendicular vector
      let x1: number, y1: number, x2: number, y2: number;

      if (config.linesStartOnPath) {
        // Lines start on the path and extend outward
        x1 = point.x;
        y1 = point.y;
        x2 = point.x + perpX * lineLen;
        y2 = point.y + perpY * lineLen;
      } else {
        // Lines are centered on the path (default behavior)
        x1 = point.x - (perpX * lineLen) / 2;
        y1 = point.y - (perpY * lineLen) / 2;
        x2 = point.x + (perpX * lineLen) / 2;
        y2 = point.y + (perpY * lineLen) / 2;
      }

      const newLine: LineSegment = { x1, y1, x2, y2 };

      // Check for intersections if the feature is enabled
      if (config.avoidIntersections) {
        // Check if this line would intersect any existing lines
        let hasIntersection = false;
        for (const existingLine of drawnLines) {
          if (getIntersectionParameter(newLine, existingLine, 0.1) !== null) {
            hasIntersection = true;
            break;
          }
        }

        if (hasIntersection) {
          // Skip drawing this line entirely
          continue;
        }
      }

      // Draw the line
      setStroke(color, p);
      p.strokeWeight(config.lineThickness);
      p.line(x1, y1, x2, y2);

      // Track this line for future intersection checks
      if (config.avoidIntersections) {
        drawnLines.push(newLine);
      }
    }
  }
};

/**
 * Draw a zigzag/wavy line with random perturbations
 * Used for creating distortion effects
 */
export interface ZigzagConfig {
  startX: number;
  startY: number;
  segmentLen: number;
  segments: number;
  maxYOffset: number;
  color?: DotPen;
  useTranslate?: boolean; // If true, uses translate/push/pop. If false, draws at absolute coords
}

export const drawZigzagLine = (p: p5SVG, config: ZigzagConfig): void => {
  if (config.color) {
    setStroke(config.color, p);
  }

  if (config.useTranslate !== false) {
    p.push();
    p.translate(config.startX, config.startY);
    p.beginShape();
    for (let i = 0; i <= config.segments; i++) {
      const x = i * config.segmentLen;
      const y = p.random(-config.maxYOffset, config.maxYOffset);
      p.vertex(x, y);
    }
    p.endShape();
    p.pop();
  } else {
    // Draw at absolute coordinates without translation
    p.beginShape();
    for (let i = 0; i <= config.segments; i++) {
      const x = config.startX + i * config.segmentLen;
      const y = config.startY + p.random(-config.maxYOffset, config.maxYOffset);
      p.vertex(x, y);
    }
    p.endShape();
  }
};
