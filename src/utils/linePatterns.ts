import { p5SVG } from "p5.js-svg";
import { DotPen } from "@/pens";
import { setStroke } from "./setStroke";
import { Point, calculatePathDistances, getPointAtDistance } from "./pathUtils";

export interface LinePatternConfig {
  linesPerSegment: number;
  lineThickness: number;
  lineLengthMin: number;
  lineLengthMax: number;
  drawPatternLengthMin: number;
  drawPatternLengthMax: number;
  skipPatternLengthMin: number;
  skipPatternLengthMax: number;
  maxGapInPattern: number;
  insideRangeProbability: number;
  outsideRangeProbability: number;
  linesStartOnPath?: boolean; // true = lines start on path, false = centered on path
}

export interface PatternSegment {
  type: "draw" | "skip";
  length: number;
  gap: number;
}

/**
 * Generate pattern segments for drawing/skipping lines
 */
export const generatePatterns = (
  p: p5SVG,
  items: number,
  offsetMin: number,
  offsetMax: number,
  config: Pick<
    LinePatternConfig,
    | "drawPatternLengthMin"
    | "drawPatternLengthMax"
    | "skipPatternLengthMin"
    | "skipPatternLengthMax"
    | "maxGapInPattern"
    | "insideRangeProbability"
    | "outsideRangeProbability"
  >
): number[] => {
  const patterns: PatternSegment[] = [];
  let itemsLeft = items;
  let lastIsDraw = false;

  const probabilityFactors = {
    insideRange: config.insideRangeProbability,
    outsideRange: config.outsideRangeProbability,
  };

  while (itemsLeft > 10) {
    let drawing = false;
    if (lastIsDraw) {
      drawing = false;
    } else {
      const distToOffset =
        Math.min(
          Math.abs(patterns.reduce((a, b) => a + b.length, 0) - offsetMin),
          Math.abs(patterns.reduce((a, b) => a + b.length, 0) - offsetMax)
        ) + 1;
      const probDraw = p.map(
        distToOffset,
        0,
        items / 2,
        probabilityFactors.insideRange,
        probabilityFactors.outsideRange
      );
      drawing = p.random() < probDraw;
    }

    const length = Math.floor(
      Math.min(
        p.random(
          drawing ? config.drawPatternLengthMin : config.skipPatternLengthMin,
          drawing ? config.drawPatternLengthMax : config.skipPatternLengthMax
        ),
        itemsLeft
      )
    );

    patterns.push({
      type: drawing ? "draw" : "skip",
      length,
      gap: !drawing ? 0 : Math.floor(p.random(0, config.maxGapInPattern + 1)),
    });

    itemsLeft -= length;
    lastIsDraw = drawing;
  }

  return patterns.flatMap((pattern) => {
    if (pattern.type === "draw") {
      if (pattern.gap === 0) {
        return Array(pattern.length).fill(1);
      } else {
        const result = [];
        for (let i = 0; i < pattern.length; i++) {
          result.push(i % (pattern.gap + 1) === 0 ? 1 : 0);
        }
        return result;
      }
    } else {
      return Array(pattern.length).fill(0);
    }
  });
};

/**
 * Draw perpendicular lines along a path with patterns
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
  const total = dists[dists.length - 1];

  const lineLen = p.random(config.lineLengthMin, config.lineLengthMax);
  const items = Math.floor(
    dists.length *
      p.random(config.linesPerSegment * 0.75, config.linesPerSegment * 1.25)
  );

  let offsetMin = 0;
  let offsetMax = items;

  if (index > 0) {
    offsetMin = Math.floor((index / totalColors) * items);
    offsetMax = Math.floor(((index + 1) / totalColors) * items);
  }

  if (index === 0) {
    offsetMin = 0;
    offsetMax = Math.floor(((index + 1) / totalColors) * items);
  }

  const patterns = generatePatterns(p, items, offsetMin, offsetMax, config);

  for (let k = 0; k < items; k++) {
    if (patterns[k] === 0) continue;

    const u = (k + 0.5) / items;
    const target = u * total;

    const { point, direction } = getPointAtDistance(p, path, dists, target);

    // Calculate simple perpendicular vector (rotate 90° clockwise)
    let perpX = direction.y;
    let perpY = -direction.x;

    // Normalize the perpendicular vector
    const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
    if (perpLen > 0) {
      perpX /= perpLen;
      perpY /= perpLen;
    }

    setStroke(color, p);
    p.strokeWeight(config.lineThickness);

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

    p.line(x1, y1, x2, y2);
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
