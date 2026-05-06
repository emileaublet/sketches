import { p5SVG } from "p5.js-svg";
import { BibitteColors } from "./palette";
import { resolveBibitteBodyPlan } from "./bodyPlans";
import { createBezierRoundedPath, type Point } from "../../utils/pathUtils";
import {
  paintElytraPattern,
  paintPronotumPattern,
  paintHeadPattern,
  pickMixedPattern,
  type ElytraPattern,
  type PronotumPattern,
  type HeadPattern,
  type MixedPatternChoice,
} from "./patterns";

export interface BibitteRenderParams {
  bodyShape: string;
  thoraxShape: string;
  bodyLength: number;
  bodyWidth: number;
  bodyTaper: number;
  headSize: number;
  headShape: string;
  antennaeLength: number;
  antennaeCurvature: number;
  legPairs: number;
  legLengthMin: number;
  legLengthMax: number;
  /** Single stroke weight used for every line drawn (body hatching, elytra patterns,
   *  legs, antennae, pronotum, head). Plotter-friendly: one pen, one width. */
  lineWidth: number;
  /** Filled poster look vs thin clipped line-fill look. */
  renderStyle: "fill" | "line";
  /** Antenna silhouette: one mirrored path per side, with no thickness variation. */
  antennaStyle: string;
  /** 0 = sharp polygon corners, 1 = default softened corners, higher = rounder. */
  roundness: number;
  /** Per-section line density (0 = sparse, 1 = very dense). */
  bodyDensity: number;
  wingDensity: number;
  pronotumDensity: number;
  headDensity: number;
  /** Bundle length range (perpendicular distance covered by a single bundle). */
  bundleLengthMin: number;
  bundleLengthMax: number;
  /** Gap range between bundles (perpendicular distance). */
  gapMin: number;
  gapMax: number;
  /** 0 = perfect color gradient along the perpendicular axis, 1 = uniform random mix. */
  colorRandomness: number;
  /** Wing rows: each elytron is sliced into rows of random height that each run the bundle logic. */
  wingRowHeightMin: number;
  wingRowHeightMax: number;
  /** Pronotum columns: filled with vertical strips of random width, each its own skew. */
  pronotumColumnWidthMin: number;
  pronotumColumnWidthMax: number;
  /** Appendage (legs + antennae) gradient hatch — dense edge / sparse edge spacing. */
  appendageHatchDense: number;
  appendageHatchSparse: number;
  /** Hand-drawn jitter — perturb polygon vertices (legs/antennae) and wobble drawn lines. */
  shapeJitter: number;
  lineJitter: number;
  /** Elytra surface pattern. `stripedRows` keeps the existing bundled hatching; all other
   *  options replace it with a filled motif (dots, V's, jaguar, bands, etc). */
  elytraPattern: ElytraPattern;
  /** Pronotum surface pattern. `stripedColumns` is the existing column hatching. */
  pronotumPattern: PronotumPattern;
  /** Head surface pattern. `fan` is the existing radial-line behavior. */
  headPattern: HeadPattern;
  marginX: number;
  marginY: number;
  width: number;
  height: number;
}

// --- Body shape paths (ctx only: fill or stroke) ---

let activeRoundness = 1;

function cornerRadius(radius: number): number {
  return Math.max(0, radius * activeRoundness);
}

type MinimalPath = { moveTo(x: number, y: number): void; lineTo(x: number, y: number): void; closePath(): void };

interface PathSink extends MinimalPath {
  ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean,
  ): void;
  roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void;
}

class PolygonCapture implements PathSink {
  points: Point[] = [];

  moveTo(x: number, y: number): void {
    this.points.push({ x, y });
  }

  lineTo(x: number, y: number): void {
    this.points.push({ x, y });
  }

  closePath(): void {}

  ellipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
  ): void {
    const steps = 96;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const da = (endAngle - startAngle) / steps;
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + da * i;
      const lx = Math.cos(a) * rx;
      const ly = Math.sin(a) * ry;
      this.points.push({
        x: cx + cosR * lx - sinR * ly,
        y: cy + sinR * lx + cosR * ly,
      });
    }
  }

  roundRect(x: number, y: number, w: number, h: number, radii: number | number[] = 0): void {
    const rRaw = Array.isArray(radii) ? radii[0] ?? 0 : radii;
    const r = Math.max(0, Math.min(rRaw, Math.min(w, h) / 2));
    if (r <= 0) {
      this.points.push({ x, y });
      this.points.push({ x: x + w, y });
      this.points.push({ x: x + w, y: y + h });
      this.points.push({ x, y: y + h });
      return;
    }
    const arcSteps = 12;
    const corners: Array<{ cx: number; cy: number; start: number; end: number }> = [
      { cx: x + w - r, cy: y + r, start: -Math.PI / 2, end: 0 },
      { cx: x + w - r, cy: y + h - r, start: 0, end: Math.PI / 2 },
      { cx: x + r, cy: y + h - r, start: Math.PI / 2, end: Math.PI },
      { cx: x + r, cy: y + r, start: Math.PI, end: Math.PI * 1.5 },
    ];
    for (const corner of corners) {
      const da = (corner.end - corner.start) / arcSteps;
      for (let i = 0; i <= arcSteps; i++) {
        const a = corner.start + da * i;
        this.points.push({
          x: corner.cx + Math.cos(a) * r,
          y: corner.cy + Math.sin(a) * r,
        });
      }
    }
  }
}

function capturePolygon(traceFn: (sink: PathSink) => void): Point[] {
  const capture = new PolygonCapture();
  traceFn(capture);
  return cleanPolygon(capture.points);
}

function traceRoundedPolygon(ctx: MinimalPath, points: Point[], radius: number): void {
  const path = createBezierRoundedPath(points, cornerRadius(radius), 4);
  const first = path[0];
  if (!first) return;
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < path.length; i++) {
    const pt = path[i]!;
    ctx.lineTo(pt.x, pt.y);
  }
}

function pt(x: number, y: number): Point {
  return { x, y };
}

function sortedRange(min: number, max: number): [number, number] {
  const a = Math.max(0.1, min);
  const b = Math.max(0.1, max);
  return a <= b ? [a, b] : [b, a];
}

function makeBundledLineField(
  p: p5SVG,
  palette: string[],
  baseAngle: number,
  bundleSpacingMin: number,
  bundleSpacingMax: number,
  bundleLengthMin: number,
  bundleLengthMax: number,
  gapMin: number,
  gapMax: number,
  strokeWidth: number,
  jitterMin: number,
  jitterMax: number,
  colorRandomness: number,
  angleSpread = 0.26,
): LineFieldOptions {
  const colors = palette.length > 0 ? palette : ["#000000"];
  const angleOffset = angleSpread <= 0 ? 0 : p.random(-angleSpread, angleSpread);
  return {
    angle: baseAngle + angleOffset,
    bundleSpacingMin,
    bundleSpacingMax,
    bundleLengthMin,
    bundleLengthMax,
    gapMin,
    gapMax,
    // Single-pen aesthetic: keep stroke weight uniform across bundles.
    strokeWidth: Math.max(0.3, strokeWidth),
    palette: colors,
    jitter: p.random(jitterMin, jitterMax),
    phase: p.random(0, bundleSpacingMax),
    colorRandomness,
  };
}

type SurfaceStyle = "fill" | "line";

/** Override the per-line color selection. Receives the line's center point and
 *  the strip index within paintStripedField. When set on LineFieldOptions it
 *  replaces the position-weighted gradient picker entirely. */
export type ColorPicker = (x: number, y: number, stripIndex: number) => string;

interface LineFieldOptions {
  angle: number;
  bundleSpacingMin: number;
  bundleSpacingMax: number;
  bundleLengthMin: number;
  bundleLengthMax: number;
  gapMin: number;
  gapMax: number;
  strokeWidth: number;
  palette: string[];
  jitter: number;
  phase?: number;
  /** 0 = perfect color gradient, 1 = uniform random color mix. */
  colorRandomness: number;
  /** When set, polygon is split at this X and right half uses reversed palette. */
  mirrorAtCenterX?: number;
  /** When set, overrides the gradient color picker for every line. */
  colorPicker?: ColorPicker;
  /** Current strip index, set by paintStripedField and forwarded to colorPicker. */
  stripIndex?: number;
}

type LineFieldInput = LineFieldOptions;

/** Paint a polygon as a stack of skewed strips, each with its own random tilt and
 *  its own line angle (perpendicular to the strip's average direction).
 *  - axis="rows": horizontal-ish strips that stack vertically.
 *  - axis="columns": vertical-ish strips that stack horizontally.
 *  Boundary tilt is auto-clamped so consecutive boundaries can't cross within the polygon. */
type StripAxis = "rows" | "columns";

function paintStripedField(
  p: p5SVG,
  polygon: Point[],
  axis: StripAxis,
  pivotX: number,
  pivotY: number,
  stripMinH: number,
  stripMaxH: number,
  sideSign: 1 | -1,
  baseField: LineFieldOptions,
  subtractPolygons: Point[][],
  /** When set, overrides the per-strip line angle (radians). stripIndex is the
   *  loop counter across boundary pairs. Replaces baseField.angle + avgTilt. */
  angleOverride?: (stripIndex: number) => number,
): void {
  if (polygon.length < 3) return;
  const baseBoundaryAngle = axis === "rows" ? 0 : Math.PI / 2;
  let stripMin = Infinity;
  let stripMax = -Infinity;
  let perpHalfSpan = 0;
  for (const pt of polygon) {
    const stripCoord = axis === "rows" ? pt.y : pt.x;
    const perpDelta = axis === "rows" ? Math.abs(pt.x - pivotX) : Math.abs(pt.y - pivotY);
    if (stripCoord < stripMin) stripMin = stripCoord;
    if (stripCoord > stripMax) stripMax = stripCoord;
    if (perpDelta > perpHalfSpan) perpHalfSpan = perpDelta;
  }
  const minH = Math.max(1, Math.min(stripMinH, stripMaxH));
  const maxH = Math.max(minH + 0.1, stripMaxH);
  const maxTilt = perpHalfSpan > 0
    ? Math.min(0.18, (minH / (2 * perpHalfSpan)) * 0.85)
    : 0.18;

  type Boundary = { stripPos: number; tilt: number };
  const boundaries: Boundary[] = [];
  const sentinelGap = (stripMax - stripMin) + 100;
  boundaries.push({ stripPos: stripMin - sentinelGap, tilt: 0 });
  let accum = stripMin;
  while (accum < stripMax) {
    const h = p.random(minH, maxH);
    accum = Math.min(stripMax, accum + h);
    if (accum >= stripMax - 0.5) break;
    boundaries.push({ stripPos: accum, tilt: sideSign * p.random(-maxTilt, maxTilt) });
  }
  boundaries.push({ stripPos: stripMax + sentinelGap, tilt: 0 });

  // Half-plane keep flags: depend on which side of each boundary the strip lies on.
  // Normal of clip line at α = (sin α, −cos α). For rows (α≈0) this points up (smaller y),
  // for columns (α≈π/2) it points right (larger x).
  const keepFirst = axis === "rows" ? false : true;   // strip is below row top / right of column left
  const keepSecond = axis === "rows" ? true : false;  // strip is above row bottom / left of column right

  for (let i = 0; i < boundaries.length - 1; i++) {
    const bA = boundaries[i]!;
    const bB = boundaries[i + 1]!;
    const aPx = axis === "rows" ? pivotX : bA.stripPos;
    const aPy = axis === "rows" ? bA.stripPos : pivotY;
    const bPx = axis === "rows" ? pivotX : bB.stripPos;
    const bPy = axis === "rows" ? bB.stripPos : pivotY;
    const aAlpha = baseBoundaryAngle + bA.tilt;
    const bAlpha = baseBoundaryAngle + bB.tilt;

    let stripPoly = clipPolygonByLine(polygon, aPx, aPy, aAlpha, keepFirst);
    stripPoly = clipPolygonByLine(stripPoly, bPx, bPy, bAlpha, keepSecond);
    if (stripPoly.length < 3) continue;
    const avgTilt = (bA.tilt + bB.tilt) / 2;
    const angle = angleOverride ? angleOverride(i) : baseField.angle + avgTilt;
    const stripField: LineFieldOptions = { ...baseField, angle, stripIndex: i };
    renderClippedLines(p, stripPoly, stripField, subtractPolygons);
  }
}

function defaultLineField(
  angle: number,
  spacing: number,
  strokeWidth: number,
  color: string,
): LineFieldOptions {
  return {
    angle,
    bundleSpacingMin: spacing,
    bundleSpacingMax: spacing,
    bundleLengthMin: Number.MAX_SAFE_INTEGER,
    bundleLengthMax: Number.MAX_SAFE_INTEGER,
    gapMin: 0,
    gapMax: 0,
    strokeWidth,
    palette: [color],
    jitter: 0,
    colorRandomness: 0,
  };
}

/** Sutherland–Hodgman half-plane clip by a line through (px, py) at angle alpha.
 *  Normal = (sin α, −cos α), which points "up" (smaller y) on screen.
 *  keepPositive=true keeps the half above the line on screen (smaller y side). */
function clipPolygonByLine(
  polygon: Point[],
  px: number,
  py: number,
  alpha: number,
  keepPositive: boolean,
): Point[] {
  if (polygon.length < 3) return [];
  const sa = Math.sin(alpha);
  const ca = Math.cos(alpha);
  const sdf = (pt: Point) => (pt.x - px) * sa - (pt.y - py) * ca;
  const inside = (pt: Point) => keepPositive ? sdf(pt) >= 0 : sdf(pt) <= 0;
  const out: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const cur = polygon[i]!;
    const prev = polygon[(i - 1 + polygon.length) % polygon.length]!;
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) {
        const dCur = sdf(cur);
        const dPrev = sdf(prev);
        const denom = dPrev - dCur;
        if (Math.abs(denom) > 1e-9) {
          const t = dPrev / denom;
          out.push({ x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) });
        }
      }
      out.push(cur);
    } else if (prevIn) {
      const dCur = sdf(cur);
      const dPrev = sdf(prev);
      const denom = dPrev - dCur;
      if (Math.abs(denom) > 1e-9) {
        const t = dPrev / denom;
        out.push({ x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) });
      }
    }
  }
  return out;
}

function clipPolygonHalfPlaneY(polygon: Point[], splitY: number, keepAbove: boolean): Point[] {
  if (polygon.length < 3) return [];
  const inside = (pt: Point) => keepAbove ? pt.y <= splitY : pt.y >= splitY;
  const out: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const cur = polygon[i]!;
    const prev = polygon[(i - 1 + polygon.length) % polygon.length]!;
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) {
        const dy = cur.y - prev.y;
        if (Math.abs(dy) > 1e-9) {
          const t = (splitY - prev.y) / dy;
          out.push({ x: prev.x + t * (cur.x - prev.x), y: splitY });
        }
      }
      out.push(cur);
    } else if (prevIn) {
      const dy = cur.y - prev.y;
      if (Math.abs(dy) > 1e-9) {
        const t = (splitY - prev.y) / dy;
        out.push({ x: prev.x + t * (cur.x - prev.x), y: splitY });
      }
    }
  }
  return out;
}

function clipPolygonHalfPlaneX(polygon: Point[], splitX: number, keepLeft: boolean): Point[] {
  if (polygon.length < 3) return [];
  const inside = (pt: Point) => keepLeft ? pt.x <= splitX : pt.x >= splitX;
  const out: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const cur = polygon[i]!;
    const prev = polygon[(i - 1 + polygon.length) % polygon.length]!;
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) {
        const dx = cur.x - prev.x;
        if (Math.abs(dx) > 1e-9) {
          const t = (splitX - prev.x) / dx;
          out.push({ x: splitX, y: prev.y + t * (cur.y - prev.y) });
        }
      }
      out.push(cur);
    } else if (prevIn) {
      const dx = cur.x - prev.x;
      if (Math.abs(dx) > 1e-9) {
        const t = (splitX - prev.x) / dx;
        out.push({ x: splitX, y: prev.y + t * (cur.y - prev.y) });
      }
    }
  }
  return out;
}

function roundedPath(points: Point[], radius: number): Point[] {
  const rounded = createBezierRoundedPath(points, cornerRadius(radius), 4);
  if (!Array.isArray(rounded) || rounded.length < 3) return points;
  const normalized: Point[] = [];
  for (const item of rounded as any[]) {
    const x = typeof item?.x === "number" ? item.x : undefined;
    const y = typeof item?.y === "number" ? item.y : undefined;
    if (x === undefined || y === undefined || !Number.isFinite(x) || !Number.isFinite(y)) continue;
    normalized.push({ x, y });
  }
  return normalized.length >= 3 ? normalized : points;
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number, steps = 96): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push(pt(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry));
  }
  return pts;
}

function scalePath(points: Point[], cx: number, cy: number, sx: number, sy: number): Point[] {
  return points.map((point) => ({
    x: cx + (point.x - cx) * sx,
    y: cy + (point.y - cy) * sy,
  }));
}

function boundsForPath(points: Point[]): { x: number; y: number; w: number; h: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  };
}

function pointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;
    if ((pi.y > y) !== (pj.y > y)) {
      const xIntersect = ((pj.x - pi.x) * (y - pi.y)) / (pj.y - pi.y) + pi.x;
      if (x < xIntersect) inside = !inside;
    }
  }
  return inside;
}

function cleanPolygon(points: Point[] | null | undefined): Point[] {
  if (!Array.isArray(points) || points.length === 0) return [];
  const cleaned: Point[] = [];
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    const prev = cleaned[cleaned.length - 1];
    if (prev && Math.hypot(point.x - prev.x, point.y - prev.y) < 1e-6) continue;
    cleaned.push(point);
  }
  if (cleaned.length > 2) {
    const first = cleaned[0]!;
    const last = cleaned[cleaned.length - 1]!;
    if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-6) cleaned.pop();
  }
  return cleaned;
}

function segmentEdgeIntersectionT(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): number | null {
  const rX = bx - ax;
  const rY = by - ay;
  const sX = dx - cx;
  const sY = dy - cy;
  const denom = rX * sY - rY * sX;
  if (Math.abs(denom) < 1e-9) return null;

  const qpx = cx - ax;
  const qpy = cy - ay;
  const t = (qpx * sY - qpy * sX) / denom;
  const u = (qpx * rY - qpy * rX) / denom;
  if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null;
  return Math.max(0, Math.min(1, t));
}

function clipSegmentToPolygon(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  polygon: Point[],
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const vx = bx - ax;
  const vy = by - ay;
  if (Math.hypot(vx, vy) < 1e-9 || polygon.length < 3) return [];

  const pointAt = (t: number) => ({ x: ax + vx * t, y: ay + vy * t });
  const ts = new Set<number>([0, 1]);
  for (let i = 0; i < polygon.length; i++) {
    const p0 = polygon[i]!;
    const p1 = polygon[(i + 1) % polygon.length]!;
    const t = segmentEdgeIntersectionT(ax, ay, bx, by, p0.x, p0.y, p1.x, p1.y);
    if (t !== null) ts.add(t);
  }

  const sorted = Array.from(ts).sort((a, b) => a - b);
  const dedup: number[] = [];
  for (const t of sorted) {
    if (dedup.length === 0 || Math.abs(t - dedup[dedup.length - 1]!) > 1e-7) {
      dedup.push(t);
    }
  }
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 0; i < dedup.length - 1; i++) {
    const t0 = dedup[i]!;
    const t1 = dedup[i + 1]!;
    if (t1 - t0 < 1e-7) continue;
    const tm = (t0 + t1) / 2;
    const mid = pointAt(tm);
    if (!pointInPolygon(mid.x, mid.y, polygon)) continue;
    const start = pointAt(t0);
    const end = pointAt(t1);
    segments.push({ x1: start.x, y1: start.y, x2: end.x, y2: end.y });
  }
  return segments;
}

function subtractPolygonFromSegments(
  segments: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  polygon: Point[],
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  if (polygon.length < 3) return segments;
  const out: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (const seg of segments) {
    const ax = seg.x1, ay = seg.y1, bx = seg.x2, by = seg.y2;
    const vx = bx - ax;
    const vy = by - ay;
    if (Math.hypot(vx, vy) < 1e-9) continue;
    const pointAt = (t: number) => ({ x: ax + vx * t, y: ay + vy * t });
    const ts = new Set<number>([0, 1]);
    for (let i = 0; i < polygon.length; i++) {
      const p0 = polygon[i]!;
      const p1 = polygon[(i + 1) % polygon.length]!;
      const t = segmentEdgeIntersectionT(ax, ay, bx, by, p0.x, p0.y, p1.x, p1.y);
      if (t !== null) ts.add(t);
    }
    const sorted = Array.from(ts).sort((a, b) => a - b);
    const dedup: number[] = [];
    for (const t of sorted) {
      if (dedup.length === 0 || Math.abs(t - dedup[dedup.length - 1]!) > 1e-7) {
        dedup.push(t);
      }
    }
    for (let i = 0; i < dedup.length - 1; i++) {
      const t0 = dedup[i]!;
      const t1 = dedup[i + 1]!;
      if (t1 - t0 < 1e-7) continue;
      const mid = pointAt((t0 + t1) / 2);
      if (pointInPolygon(mid.x, mid.y, polygon)) continue;
      const start = pointAt(t0);
      const end = pointAt(t1);
      out.push({ x1: start.x, y1: start.y, x2: end.x, y2: end.y });
    }
  }
  return out;
}

function drawClippedLineField(
  p: p5SVG,
  polygon: Point[],
  bounds: { x: number; y: number; w: number; h: number },
  options: LineFieldOptions,
  subtractPolygons: Point[][] = [],
): void {
  const {
    angle,
    bundleSpacingMin,
    bundleSpacingMax,
    bundleLengthMin,
    bundleLengthMax,
    gapMin,
    gapMax,
    strokeWidth,
    palette,
    jitter,
    phase = 0,
    colorRandomness,
    colorPicker,
    stripIndex = 0,
  } = options;
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const radius = Math.hypot(bounds.w, bounds.h) * 0.75;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  const totalExtent = radius * 2;
  const colors = palette.length > 0 ? palette : ["#000000"];

  // Single bundle/gap walk. Every bundle always draws — its lines independently
  // sample their color from a position-dependent density distribution, so transitions
  // appear as interleaved colored lines (smooth gradient) and gap=0 truly means no holes.
  const N = colors.length;
  const falloffDist = N <= 1 ? 0.5 : 1 / (N - 1);
  const r = Math.max(0, Math.min(1, colorRandomness));
  const weights = new Array<number>(N);

  let pos = -radius + (phase % Math.max(0.5, bundleSpacingMax));
  while (pos < radius) {
    const bundleLen = Math.max(0.5, p.random(bundleLengthMin, bundleLengthMax));
    const bundleSpacing = Math.max(0.3, p.random(bundleSpacingMin, bundleSpacingMax));
    const bundleEnd = Math.min(radius, pos + bundleLen);
    const bundleMid = (pos + bundleEnd) / 2;
    const t = Math.max(0, Math.min(1, (bundleMid + radius) / totalExtent));

    let totalW = 0;
    for (let ci = 0; ci < N; ci++) {
      const zc = N === 1 ? 0.5 : ci / (N - 1);
      const density = Math.max(0, 1 - Math.abs(t - zc) / falloffDist);
      // r=0 → weight = density (gradient). r=1 → weight = 1 (uniform).
      const w = density + r * (1 - density);
      weights[ci] = w;
      totalW += w;
    }
    if (totalW <= 1e-6) {
      for (let ci = 0; ci < N; ci++) weights[ci] = 1;
      totalW = N;
    }

    p.push();
    p.noFill();
    p.strokeWeight(Math.max(0.3, strokeWidth));
    p.strokeCap(p.ROUND);

    let lineOffset = pos;
    while (lineOffset <= bundleEnd) {
      const jx = jitter > 0 ? p.random(-jitter, jitter) : 0;
      const jy = jitter > 0 ? p.random(-jitter, jitter) : 0;
      const lpx = cx + nx * lineOffset + jx;
      const lpy = cy + ny * lineOffset + jy;

      let lineColor: string;
      if (colorPicker) {
        lineColor = colorPicker(lpx, lpy, stripIndex);
      } else {
        let pick = p.random(totalW);
        let colorIdx = 0;
        for (let ci = 0; ci < N; ci++) {
          pick -= weights[ci]!;
          if (pick <= 0) { colorIdx = ci; break; }
        }
        lineColor = colors[colorIdx]!;
      }
      p.stroke(lineColor);
      const ax = lpx - dx * radius;
      const ay = lpy - dy * radius;
      const bx = lpx + dx * radius;
      const by = lpy + dy * radius;
      let segments = clipSegmentToPolygon(ax, ay, bx, by, polygon);
      for (const sub of subtractPolygons) {
        if (segments.length === 0) break;
        segments = subtractPolygonFromSegments(segments, sub);
      }
      for (const seg of segments) {
        drawWobblyLine(p, seg.x1, seg.y1, seg.x2, seg.y2);
      }
      lineOffset += bundleSpacing;
    }
    p.pop();

    pos = bundleEnd + Math.max(0, p.random(gapMin, gapMax));
  }
}

function renderClippedLines(
  p: p5SVG,
  polygon: Point[],
  options: LineFieldInput,
  subtractPolygons: Point[][] = [],
): void {
  if (polygon.length < 3) return;
  if (options.mirrorAtCenterX != null && options.palette.length > 1) {
    const splitX = options.mirrorAtCenterX;
    const left = clipPolygonHalfPlaneX(polygon, splitX, true);
    const right = clipPolygonHalfPlaneX(polygon, splitX, false);
    if (left.length >= 3) {
      drawClippedLineField(p, left, boundsForPath(left), options, subtractPolygons);
    }
    if (right.length >= 3) {
      const mirrored: LineFieldOptions = {
        ...options,
        palette: [...options.palette].reverse(),
      };
      drawClippedLineField(p, right, boundsForPath(right), mirrored, subtractPolygons);
    }
    return;
  }
  drawClippedLineField(p, polygon, boundsForPath(polygon), options, subtractPolygons);
}

function traceBodyPath(
  ctx: PathSink,
  shape: string,
  cx: number, cy: number,
  w: number, h: number,
  taper: number,
): void {
  switch (shape) {
    case "oval":
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case "round":
      ctx.ellipse(cx, cy, w / 2, Math.min(w, h) / 2, 0, 0, Math.PI * 2);
      break;
    case "longOval":
      ctx.ellipse(cx, cy, w * 0.42, h / 2, 0, 0, Math.PI * 2);
      break;
    case "roundedRect": {
      const r = cornerRadius(Math.min(w, h) * 0.2);
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
      break;
    }
    case "boxy": {
      const r = cornerRadius(Math.min(w, h) * 0.08);
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
      break;
    }
    case "pear": {
      traceRoundedPolygon(ctx, [
        pt(cx, cy - h / 2),
        pt(cx + w * 0.28, cy - h * 0.34),
        pt(cx + w * 0.5, cy + h * 0.04),
        pt(cx + w * 0.42, cy + h * 0.38),
        pt(cx, cy + h / 2),
        pt(cx - w * 0.42, cy + h * 0.38),
        pt(cx - w * 0.5, cy + h * 0.04),
        pt(cx - w * 0.28, cy - h * 0.34),
      ], Math.min(w, h) * 0.045);
      break;
    }
    case "waisted": {
      traceRoundedPolygon(ctx, [
        pt(cx, cy - h / 2),
        pt(cx + w * 0.45, cy - h * 0.34),
        pt(cx + w * 0.26, cy - h * 0.03),
        pt(cx + w * 0.48, cy + h * 0.34),
        pt(cx, cy + h / 2),
        pt(cx - w * 0.48, cy + h * 0.34),
        pt(cx - w * 0.26, cy - h * 0.03),
        pt(cx - w * 0.45, cy - h * 0.34),
      ], Math.min(w, h) * 0.035);
      break;
    }
    case "kite": {
      const wideY = cy - h / 2 + h * (0.28 + taper * 0.38);
      traceRoundedPolygon(ctx, [
        pt(cx, cy - h / 2),
        pt(cx + w * 0.42, wideY - h * 0.04),
        pt(cx + w * 0.5, wideY + h * 0.08),
        pt(cx + w * 0.24, cy + h * 0.42),
        pt(cx, cy + h / 2),
        pt(cx - w * 0.24, cy + h * 0.42),
        pt(cx - w * 0.5, wideY + h * 0.08),
        pt(cx - w * 0.42, wideY - h * 0.04),
      ], Math.min(w, h) * 0.035);
      break;
    }
    case "teardrop": {
      const tdWide = cy + h * 0.12;
      traceRoundedPolygon(ctx, [
        pt(cx, cy - h / 2),
        pt(cx + w * 0.26, cy - h * 0.22),
        pt(cx + w * 0.5, tdWide),
        pt(cx + w * 0.34, cy + h * 0.36),
        pt(cx, cy + h / 2),
        pt(cx - w * 0.34, cy + h * 0.36),
        pt(cx - w * 0.5, tdWide),
        pt(cx - w * 0.26, cy - h * 0.22),
      ], Math.min(w, h) * 0.04);
      break;
    }
    case "abdomenPoint": {
      const shoulderY = cy - h * 0.38;
      const wideY = cy - h * 0.02;
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.22, cy - h / 2),
        pt(cx + w * 0.22, cy - h / 2),
        pt(cx + w * 0.42, shoulderY),
        pt(cx + w * 0.5, wideY),
        pt(cx + w * 0.28, cy + h * 0.34),
        pt(cx, cy + h / 2),
        pt(cx - w * 0.28, cy + h * 0.34),
        pt(cx - w * 0.5, wideY),
        pt(cx - w * 0.42, shoulderY),
      ], Math.min(w, h) * 0.035);
      break;
    }
    case "abdomenTaper": {
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.42, cy - h / 2),
        pt(cx + w * 0.42, cy - h / 2),
        pt(cx + w * 0.5, cy - h * 0.12),
        pt(cx + w * 0.26, cy + h * 0.46),
        pt(cx - w * 0.26, cy + h * 0.46),
        pt(cx - w * 0.5, cy - h * 0.12),
      ], Math.min(w, h) * 0.035);
      break;
    }
    case "column": {
      const rr = cornerRadius(Math.min(w, h) * 0.07);
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, rr);
      break;
    }
    case "capsule": {
      const rr = cornerRadius(Math.min(w / 2, h / 2));
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, rr);
      break;
    }
    case "wedge": {
      const tipW = w * (0.18 + (1 - taper) * 0.42);
      traceRoundedPolygon(ctx, [
        pt(cx, cy - h / 2),
        pt(cx + tipW / 2, cy + h / 2),
        pt(cx - tipW / 2, cy + h / 2),
      ], Math.min(w, h) * 0.04);
      break;
    }
    case "tapered": {
      const topW = w * (0.72 + taper * 0.18);
      const bottomW = w * (0.32 + (1 - taper) * 0.24);
      traceRoundedPolygon(ctx, [
        pt(cx - topW / 2, cy - h / 2),
        pt(cx + topW / 2, cy - h / 2),
        pt(cx + w * 0.44, cy - h * 0.12),
        pt(cx + bottomW / 2, cy + h / 2),
        pt(cx - bottomW / 2, cy + h / 2),
        pt(cx - w * 0.44, cy - h * 0.12),
      ], Math.min(w, h) * 0.035);
      break;
    }
    case "globular": {
      // Almost spherical (dung beetles, *Synapsis*, *Trox*).
      ctx.ellipse(cx, cy, w * 0.5, h * 0.48, 0, 0, Math.PI * 2);
      break;
    }
    case "elongated": {
      // Long, narrow, parallel sides (click beetles, *Coraebus fasciatus*).
      const rr = cornerRadius(w * 0.32);
      ctx.roundRect(cx - w * 0.32, cy - h / 2, w * 0.64, h, rr);
      break;
    }
    case "flatOval": {
      // Wide and short (some leaf beetles, *Diaperis boleti*).
      ctx.ellipse(cx, cy, w * 0.55, h * 0.42, 0, 0, Math.PI * 2);
      break;
    }
    case "parallelSided": {
      // Rectangular sides with rounded ends (*Megalodacne*).
      const rr = cornerRadius(Math.min(w, h) * 0.2);
      ctx.roundRect(cx - w * 0.42, cy - h / 2, w * 0.84, h, rr);
      break;
    }
    case "humpback": {
      // Domed/swollen top, taper toward bottom (*Goliathus*, *Eupholus*).
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.42, cy - h * 0.34),
        pt(cx - w * 0.18, cy - h / 2),
        pt(cx + w * 0.18, cy - h / 2),
        pt(cx + w * 0.42, cy - h * 0.34),
        pt(cx + w * 0.5, cy + h * 0.04),
        pt(cx + w * 0.32, cy + h * 0.42),
        pt(cx, cy + h / 2),
        pt(cx - w * 0.32, cy + h * 0.42),
        pt(cx - w * 0.5, cy + h * 0.04),
      ], Math.min(w, h) * 0.045);
      break;
    }
    case "scarab": {
      // Broad shoulders, slight taper (*Lucanus*, *Zographus*).
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.5, cy - h * 0.42),
        pt(cx - w * 0.28, cy - h / 2),
        pt(cx + w * 0.28, cy - h / 2),
        pt(cx + w * 0.5, cy - h * 0.42),
        pt(cx + w * 0.46, cy + h * 0.18),
        pt(cx + w * 0.34, cy + h * 0.46),
        pt(cx, cy + h / 2),
        pt(cx - w * 0.34, cy + h * 0.46),
        pt(cx - w * 0.46, cy + h * 0.18),
      ], Math.min(w, h) * 0.04);
      break;
    }
    case "shield":
    default:
      traceRoundedPolygon(ctx, [
        pt(cx - w / 2, cy - h / 2),
        pt(cx + w / 2, cy - h / 2),
        pt(cx + w * 0.5, cy - h * 0.08),
        pt(cx + w * 0.32, cy + h * 0.34),
        pt(cx, cy + h / 2),
        pt(cx - w * 0.32, cy + h * 0.34),
        pt(cx - w * 0.5, cy - h * 0.08),
      ], Math.min(w, h) * 0.035);
      break;
  }
}

function paintBody(
  p: p5SVG,
  ctx: CanvasRenderingContext2D,
  shape: string,
  cx: number, cy: number,
  w: number, h: number,
  taper: number,
  style: SurfaceStyle,
  color: string,
  strokeW: number,
  lineField?: LineFieldInput,
  subtractPolygons: Point[][] = [],
): void {
  if (style === "fill") {
    ctx.beginPath();
    traceBodyPath(ctx, shape, cx, cy, w, h, taper);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    const polygon = jitterPolygon(p, capturePolygon((sink) =>
      traceBodyPath(sink, shape, cx, cy, w, h, taper),
    ));
    renderClippedLines(
      p,
      polygon,
      lineField ?? defaultLineField(Math.PI / 2, 4, strokeW, color),
      subtractPolygons,
    );
  }
}

function traceHeadPath(
  ctx: MinimalPath,
  shape: string,
  cx: number, cy: number,
  r: number,
): void {
  switch (shape) {
    case "compact":
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.82, cy - r * 0.38),
        pt(cx - r * 0.38, cy - r * 0.82),
        pt(cx + r * 0.38, cy - r * 0.82),
        pt(cx + r * 0.82, cy - r * 0.38),
        pt(cx + r * 0.66, cy + r * 0.54),
        pt(cx + r * 0.24, cy + r * 0.86),
        pt(cx - r * 0.24, cy + r * 0.86),
        pt(cx - r * 0.66, cy + r * 0.54),
      ], r * 0.08);
      break;
    case "circle":
    case "oval":
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.86, cy - r * 0.4),
        pt(cx - r * 0.42, cy - r * 0.78),
        pt(cx + r * 0.42, cy - r * 0.78),
        pt(cx + r * 0.86, cy - r * 0.4),
        pt(cx + r * 0.72, cy + r * 0.44),
        pt(cx + r * 0.28, cy + r * 0.78),
        pt(cx - r * 0.28, cy + r * 0.78),
        pt(cx - r * 0.72, cy + r * 0.44),
      ], r * 0.08);
      break;
    case "triangle":
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.9, cy + r * 0.6);
      ctx.lineTo(cx - r * 0.9, cy + r * 0.6);
      break;
    case "rect": {
      const rw = r * 1.9;
      const rh = r * 1.28;
      traceRoundedPolygon(ctx, [
        pt(cx - rw / 2, cy - rh / 2),
        pt(cx + rw / 2, cy - rh / 2),
        pt(cx + rw * 0.44, cy + rh / 2),
        pt(cx - rw * 0.44, cy + rh / 2),
      ], r * 0.07);
      break;
    }
    case "wide": {
      traceRoundedPolygon(ctx, [
        pt(cx - r * 1.25, cy - r * 0.35),
        pt(cx + r * 1.25, cy - r * 0.35),
        pt(cx + r * 0.86, cy + r * 0.58),
        pt(cx + r * 0.22, cy + r * 0.88),
        pt(cx - r * 0.22, cy + r * 0.88),
        pt(cx - r * 0.86, cy + r * 0.58),
      ], r * 0.08);
      break;
    }
    case "clypeus": {
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.92, cy - r * 0.36),
        pt(cx - r * 0.34, cy - r * 0.78),
        pt(cx + r * 0.34, cy - r * 0.78),
        pt(cx + r * 0.92, cy - r * 0.36),
        pt(cx + r * 0.78, cy + r * 0.38),
        pt(cx + r * 0.34, cy + r * 0.72),
        pt(cx + r * 0.16, cy + r * 0.5),
        pt(cx - r * 0.16, cy + r * 0.5),
        pt(cx - r * 0.34, cy + r * 0.72),
        pt(cx - r * 0.78, cy + r * 0.38),
      ], r * 0.065);
      break;
    }
    case "notched": {
      traceRoundedPolygon(ctx, [
        pt(cx - r, cy - r * 0.48),
        pt(cx - r * 0.24, cy - r * 0.66),
        pt(cx, cy - r * 0.38),
        pt(cx + r * 0.24, cy - r * 0.66),
        pt(cx + r, cy - r * 0.48),
        pt(cx + r * 0.75, cy + r * 0.56),
        pt(cx, cy + r),
        pt(cx - r * 0.75, cy + r * 0.56),
      ], r * 0.06);
      break;
    }
    case "cowl": {
      traceRoundedPolygon(ctx, [
        pt(cx - r * 1.05, cy - r * 0.18),
        pt(cx - r * 0.62, cy - r * 0.8),
        pt(cx + r * 0.62, cy - r * 0.8),
        pt(cx + r * 1.05, cy - r * 0.18),
        pt(cx + r * 0.52, cy + r * 0.82),
        pt(cx - r * 0.52, cy + r * 0.82),
      ], r * 0.075);
      break;
    }
    case "rostrum": {
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.64, cy - r * 0.36),
        pt(cx - r * 0.34, cy - r * 0.78),
        pt(cx + r * 0.34, cy - r * 0.78),
        pt(cx + r * 0.64, cy - r * 0.36),
        pt(cx + r * 0.28, cy + r * 0.24),
        pt(cx + r * 0.16, cy + r * 1.18),
        pt(cx - r * 0.16, cy + r * 1.18),
        pt(cx - r * 0.28, cy + r * 0.24),
      ], r * 0.055);
      break;
    }
    case "forked": {
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.98, cy - r * 0.34),
        pt(cx - r * 0.48, cy - r * 0.72),
        pt(cx - r * 0.14, cy - r * 0.46),
        pt(cx, cy - r * 0.82),
        pt(cx + r * 0.14, cy - r * 0.46),
        pt(cx + r * 0.48, cy - r * 0.72),
        pt(cx + r * 0.98, cy - r * 0.34),
        pt(cx + r * 0.62, cy + r * 0.68),
        pt(cx, cy + r * 0.92),
        pt(cx - r * 0.62, cy + r * 0.68),
      ], r * 0.055);
      break;
    }
    case "trapezoid": {
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.62, cy - r * 0.78),
        pt(cx + r * 0.62, cy - r * 0.78),
        pt(cx + r * 0.98, cy + r * 0.52),
        pt(cx + r * 0.32, cy + r * 0.88),
        pt(cx - r * 0.32, cy + r * 0.88),
        pt(cx - r * 0.98, cy + r * 0.52),
      ], r * 0.07);
      break;
    }
    case "hexagon":
    case "pentagon":
    case "shield":
      traceRoundedPolygon(ctx, [
        pt(cx - r, cy - r * 0.5),
        pt(cx + r, cy - r * 0.5),
        pt(cx + r * 0.78, cy + r * 0.42),
        pt(cx, cy + r),
        pt(cx - r * 0.78, cy + r * 0.42),
      ], r * 0.075);
      break;
    case "shieldReverse":
      traceRoundedPolygon(ctx, [
        pt(cx - r, cy + r * 0.5),
        pt(cx + r, cy + r * 0.5),
        pt(cx + r * 0.78, cy - r * 0.42),
        pt(cx, cy - r),
        pt(cx - r * 0.78, cy - r * 0.42),
      ], r * 0.075);
      break;
    case "mandibled": {
      // Curved mandibles project forward (stag beetles like *Lucanus*).
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.78, cy - r * 0.34),
        pt(cx - r * 0.34, cy - r * 0.74),
        pt(cx + r * 0.34, cy - r * 0.74),
        pt(cx + r * 0.78, cy - r * 0.34),
        pt(cx + r * 0.62, cy + r * 0.36),
        pt(cx + r * 1.05, cy + r * 0.7),
        pt(cx + r * 0.46, cy + r * 0.78),
        pt(cx + r * 0.18, cy + r * 0.6),
        pt(cx - r * 0.18, cy + r * 0.6),
        pt(cx - r * 0.46, cy + r * 0.78),
        pt(cx - r * 1.05, cy + r * 0.7),
        pt(cx - r * 0.62, cy + r * 0.36),
      ], r * 0.05);
      break;
    }
    case "horned": {
      // Single forward-projecting horn (rhinoceros beetles).
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.78, cy - r * 0.32),
        pt(cx - r * 0.36, cy - r * 0.62),
        pt(cx - r * 0.16, cy - r * 0.42),
        pt(cx, cy - r * 1.1),
        pt(cx + r * 0.16, cy - r * 0.42),
        pt(cx + r * 0.36, cy - r * 0.62),
        pt(cx + r * 0.78, cy - r * 0.32),
        pt(cx + r * 0.62, cy + r * 0.5),
        pt(cx, cy + r * 0.86),
        pt(cx - r * 0.62, cy + r * 0.5),
      ], r * 0.06);
      break;
    }
    case "bulbous": {
      // Plain bulging round head — polygonal so it works through MinimalPath sinks
      // (capturePolygon / PointCapture don't implement ctx.ellipse).
      const N = 32;
      const rx = r * 1.04;
      const ry = r * 0.96;
      const pts: Point[] = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        pts.push(pt(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry));
      }
      traceRoundedPolygon(ctx, pts, r * 0.02);
      break;
    }
    case "tiny": {
      // Reduced, recessed head.
      const N = 28;
      const rx = r * 0.62;
      const ry = r * 0.55;
      const offCY = cy + r * 0.12;
      const pts: Point[] = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        pts.push(pt(cx + Math.cos(a) * rx, offCY + Math.sin(a) * ry));
      }
      traceRoundedPolygon(ctx, pts, r * 0.02);
      break;
    }
    case "snout": {
      // Elongated weevil rostrum, longer than `rostrum`.
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.55, cy - r * 0.32),
        pt(cx - r * 0.28, cy - r * 0.66),
        pt(cx + r * 0.28, cy - r * 0.66),
        pt(cx + r * 0.55, cy - r * 0.32),
        pt(cx + r * 0.22, cy + r * 0.12),
        pt(cx + r * 0.12, cy + r * 1.6),
        pt(cx - r * 0.12, cy + r * 1.6),
        pt(cx - r * 0.22, cy + r * 0.12),
      ], r * 0.04);
      break;
    }
    case "eyed": {
      // Wide head with prominent lateral eye bumps (some longhorns, *Acrocinus*).
      traceRoundedPolygon(ctx, [
        pt(cx - r * 1.18, cy - r * 0.18),
        pt(cx - r * 0.94, cy - r * 0.52),
        pt(cx - r * 0.32, cy - r * 0.78),
        pt(cx + r * 0.32, cy - r * 0.78),
        pt(cx + r * 0.94, cy - r * 0.52),
        pt(cx + r * 1.18, cy - r * 0.18),
        pt(cx + r * 0.78, cy + r * 0.6),
        pt(cx + r * 0.22, cy + r * 0.86),
        pt(cx - r * 0.22, cy + r * 0.86),
        pt(cx - r * 0.78, cy + r * 0.6),
      ], r * 0.08);
      break;
    }
    case "chinned": {
      // Strong jaw — wider at bottom (some predatory ground beetles).
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.62, cy - r * 0.74),
        pt(cx + r * 0.62, cy - r * 0.74),
        pt(cx + r * 0.78, cy - r * 0.18),
        pt(cx + r * 1.0, cy + r * 0.4),
        pt(cx + r * 0.6, cy + r * 0.94),
        pt(cx - r * 0.6, cy + r * 0.94),
        pt(cx - r * 1.0, cy + r * 0.4),
        pt(cx - r * 0.78, cy - r * 0.18),
      ], r * 0.06);
      break;
    }
    default:
      traceRoundedPolygon(ctx, [
        pt(cx - r * 0.82, cy - r * 0.38),
        pt(cx - r * 0.38, cy - r * 0.82),
        pt(cx + r * 0.38, cy - r * 0.82),
        pt(cx + r * 0.82, cy - r * 0.38),
        pt(cx + r * 0.66, cy + r * 0.54),
        pt(cx + r * 0.24, cy + r * 0.86),
        pt(cx - r * 0.24, cy + r * 0.86),
        pt(cx - r * 0.66, cy + r * 0.54),
      ], r * 0.08);
  }
}

/** Fan of straight lines emanating from below the head, clipped to the head polygon.
 *  Density controls how many spokes the fan has. */
function paintHeadFan(
  p: p5SVG,
  shape: string,
  cx: number, cy: number,
  r: number,
  color: string,
  strokeW: number,
  density: number,
  scaleX: number,
  scaleY: number,
  subtractPolygons: Point[][] = [],
): void {
  const raw = capturePolygon((sink) => traceHeadPath(sink, shape, cx, cy, r));
  const polygon = jitterPolygon(p, raw.map((pt) => ({
    x: cx + (pt.x - cx) * scaleX,
    y: cy + (pt.y - cy) * scaleY,
  })));
  if (polygon.length < 3) return;

  // Origin: below the head, outside its silhouette, on the centerline.
  const origin = { x: cx, y: cy + r * scaleY * 1.6 };
  // Sweep ~150° centered straight up.
  const halfFan = Math.PI * 0.42;
  // Density 0 → ~24 spokes, density 1 → ~220 spokes.
  const d = Math.max(0, Math.min(1, density));
  const numLines = Math.max(8, Math.round(24 + d * 196));
  const reach = r * 4 * Math.max(scaleX, scaleY);

  p.push();
  p.noFill();
  p.stroke(color);
  p.strokeWeight(Math.max(0.25, strokeW * 0.6));
  p.strokeCap(p.ROUND);
  for (let i = 0; i < numLines; i++) {
    const t = numLines === 1 ? 0.5 : i / (numLines - 1);
    const angle = -Math.PI / 2 + (t - 0.5) * 2 * halfFan;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const ax = origin.x;
    const ay = origin.y;
    const bx = origin.x + dx * reach;
    const by = origin.y + dy * reach;
    let segments = clipSegmentToPolygon(ax, ay, bx, by, polygon);
    for (const sub of subtractPolygons) {
      if (segments.length === 0) break;
      segments = subtractPolygonFromSegments(segments, sub);
    }
    for (const seg of segments) {
      drawWobblyLine(p, seg.x1, seg.y1, seg.x2, seg.y2);
    }
  }
  p.pop();
}

function paintHead(
  p: p5SVG,
  ctx: CanvasRenderingContext2D,
  shape: string,
  cx: number, cy: number,
  r: number,
  style: SurfaceStyle,
  color: string,
  strokeW: number,
  scaleX = 1,
  scaleY = 1,
  lineField?: LineFieldInput,
  subtractPolygons: Point[][] = [],
): void {
  if (style === "fill") {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    traceHeadPath(ctx, shape, cx, cy, r);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  } else {
    const rawPolygon = capturePolygon((sink) => traceHeadPath(sink, shape, cx, cy, r));
    const polygon = jitterPolygon(p, rawPolygon.map((pt) => ({
      x: cx + (pt.x - cx) * scaleX,
      y: cy + (pt.y - cy) * scaleY,
    })));
    renderClippedLines(
      p,
      polygon,
      lineField ?? defaultLineField(0, 4, strokeW, color),
      subtractPolygons,
    );
  }
}

function tracePronotumPath(
  ctx: PathSink,
  shape: string,
  cx: number, cy: number,
  w: number, h: number,
): void {
  switch (shape) {
    case "collar":
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.42, cy - h * 0.48),
        pt(cx + w * 0.42, cy - h * 0.48),
        pt(cx + w * 0.5, cy - h * 0.1),
        pt(cx + w * 0.36, cy + h * 0.5),
        pt(cx - w * 0.36, cy + h * 0.5),
        pt(cx - w * 0.5, cy - h * 0.1),
      ], Math.min(w, h) * 0.055);
      break;
    case "flared":
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.22, cy - h * 0.5),
        pt(cx + w * 0.22, cy - h * 0.5),
        pt(cx + w * 0.54, cy - h * 0.12),
        pt(cx + w * 0.42, cy + h * 0.46),
        pt(cx, cy + h * 0.5),
        pt(cx - w * 0.42, cy + h * 0.46),
        pt(cx - w * 0.54, cy - h * 0.12),
      ], Math.min(w, h) * 0.05);
      break;
    case "notchedPlate":
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.5, cy - h * 0.24),
        pt(cx - w * 0.18, cy - h * 0.5),
        pt(cx, cy - h * 0.22),
        pt(cx + w * 0.18, cy - h * 0.5),
        pt(cx + w * 0.5, cy - h * 0.24),
        pt(cx + w * 0.42, cy + h * 0.42),
        pt(cx + w * 0.12, cy + h * 0.5),
        pt(cx - w * 0.12, cy + h * 0.5),
        pt(cx - w * 0.42, cy + h * 0.42),
      ], Math.min(w, h) * 0.045);
      break;
    case "saddle":
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.48, cy - h * 0.18),
        pt(cx - w * 0.24, cy - h * 0.48),
        pt(cx + w * 0.24, cy - h * 0.48),
        pt(cx + w * 0.48, cy - h * 0.18),
        pt(cx + w * 0.32, cy + h * 0.48),
        pt(cx, cy + h * 0.28),
        pt(cx - w * 0.32, cy + h * 0.48),
      ], Math.min(w, h) * 0.05);
      break;
    case "trapezoid":
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.34, cy - h * 0.5),
        pt(cx + w * 0.34, cy - h * 0.5),
        pt(cx + w * 0.52, cy + h * 0.44),
        pt(cx - w * 0.52, cy + h * 0.44),
      ], Math.min(w, h) * 0.055);
      break;
    case "narrowNeck":
      // Tiny, narrow plate (weevils such as *Notaris*, *Hylobius*).
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.18, cy - h * 0.5),
        pt(cx + w * 0.18, cy - h * 0.5),
        pt(cx + w * 0.26, cy + h * 0.42),
        pt(cx - w * 0.26, cy + h * 0.42),
      ], Math.min(w, h) * 0.06);
      break;
    case "pinched":
      // Waisted in the middle (long-horned beetles, *Acrocinus*).
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.42, cy - h * 0.5),
        pt(cx + w * 0.42, cy - h * 0.5),
        pt(cx + w * 0.5, cy - h * 0.18),
        pt(cx + w * 0.22, cy + h * 0.04),
        pt(cx + w * 0.5, cy + h * 0.42),
        pt(cx - w * 0.5, cy + h * 0.42),
        pt(cx - w * 0.22, cy + h * 0.04),
        pt(cx - w * 0.5, cy - h * 0.18),
      ], Math.min(w, h) * 0.04);
      break;
    case "wideShield":
      // Extra-wide shield (jewel beetles).
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.6, cy - h * 0.34),
        pt(cx - w * 0.4, cy - h * 0.5),
        pt(cx + w * 0.4, cy - h * 0.5),
        pt(cx + w * 0.6, cy - h * 0.34),
        pt(cx + w * 0.42, cy + h * 0.42),
        pt(cx, cy + h * 0.5),
        pt(cx - w * 0.42, cy + h * 0.42),
      ], Math.min(w, h) * 0.05);
      break;
    case "domed":
      // Round, convex disc (ladybug pronotum).
      ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
      break;
    case "spined":
      // Lateral spines pointing outward (some longhorn beetles).
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.34, cy - h * 0.42),
        pt(cx - w * 0.18, cy - h * 0.5),
        pt(cx + w * 0.18, cy - h * 0.5),
        pt(cx + w * 0.34, cy - h * 0.42),
        pt(cx + w * 0.62, cy - h * 0.06),
        pt(cx + w * 0.36, cy + h * 0.18),
        pt(cx + w * 0.34, cy + h * 0.5),
        pt(cx - w * 0.34, cy + h * 0.5),
        pt(cx - w * 0.36, cy + h * 0.18),
        pt(cx - w * 0.62, cy - h * 0.06),
      ], Math.min(w, h) * 0.025);
      break;
    case "crown":
      // Toothed top edge (stag beetle / dung beetle).
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.48, cy - h * 0.36),
        pt(cx - w * 0.36, cy - h * 0.5),
        pt(cx - w * 0.24, cy - h * 0.32),
        pt(cx - w * 0.12, cy - h * 0.5),
        pt(cx, cy - h * 0.32),
        pt(cx + w * 0.12, cy - h * 0.5),
        pt(cx + w * 0.24, cy - h * 0.32),
        pt(cx + w * 0.36, cy - h * 0.5),
        pt(cx + w * 0.48, cy - h * 0.36),
        pt(cx + w * 0.42, cy + h * 0.46),
        pt(cx, cy + h * 0.5),
        pt(cx - w * 0.42, cy + h * 0.46),
      ], Math.min(w, h) * 0.025);
      break;
    case "cordate":
      // Heart-shaped — wide top, narrow base (*Pygora*, some *Catascopus*).
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.5, cy - h * 0.36),
        pt(cx - w * 0.4, cy - h * 0.5),
        pt(cx - w * 0.12, cy - h * 0.34),
        pt(cx, cy - h * 0.46),
        pt(cx + w * 0.12, cy - h * 0.34),
        pt(cx + w * 0.4, cy - h * 0.5),
        pt(cx + w * 0.5, cy - h * 0.36),
        pt(cx + w * 0.32, cy + h * 0.32),
        pt(cx, cy + h * 0.5),
        pt(cx - w * 0.32, cy + h * 0.32),
      ], Math.min(w, h) * 0.04);
      break;
    case "bulging":
      // Strongly convex — pushes outward beyond the nominal bounds so the
      // pronotum reads as a swollen dome rather than a flat plate.
      ctx.ellipse(cx, cy, w * 0.62, h * 0.62, 0, 0, Math.PI * 2);
      break;
    case "shield":
    default:
      traceRoundedPolygon(ctx, [
        pt(cx - w * 0.48, cy - h * 0.34),
        pt(cx - w * 0.3, cy - h * 0.5),
        pt(cx + w * 0.3, cy - h * 0.5),
        pt(cx + w * 0.48, cy - h * 0.34),
        pt(cx + w * 0.38, cy + h * 0.35),
        pt(cx, cy + h * 0.5),
        pt(cx - w * 0.38, cy + h * 0.35),
      ], Math.min(w, h) * 0.05);
      break;
  }
}

function paintPronotum(
  p: p5SVG,
  ctx: CanvasRenderingContext2D,
  shape: string,
  cx: number, cy: number,
  w: number, h: number,
  style: SurfaceStyle,
  color: string,
  strokeW: number,
  columnWidthMin: number,
  columnWidthMax: number,
  pattern: PronotumPattern,
  baseColor: string,
  accentColor: string,
  patternDensity: number,
  lineField?: LineFieldInput,
  subtractPolygons: Point[][] = [],
): void {
  if (pattern !== "stripedColumns") {
    const polygon = jitterPolygon(p, capturePolygon((sink) =>
      tracePronotumPath(sink, shape, cx, cy, w, h),
    ));
    if (polygon.length >= 3) {
      const handled = paintPronotumPattern(pattern, {
        p, ctx, polygon, baseColor, accentColor, density: patternDensity,
        lineWidth: strokeW,
        // Cut head out of the pronotum's painted area when they overlap.
        subtractPolygons,
      });
      if (handled) return;
    }
  }
  if (style === "fill") {
    ctx.beginPath();
    tracePronotumPath(ctx, shape, cx, cy, w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    const polygon = jitterPolygon(p, capturePolygon((sink) =>
      tracePronotumPath(sink, shape, cx, cy, w, h),
    ));
    const fallback = defaultLineField(0, 4, strokeW, color);
    const baseField = lineField ?? fallback;
    // Pronotum fills the entire shape with columns (no centerline mirror).
    const stripField: LineFieldOptions = { ...baseField, mirrorAtCenterX: undefined };
    paintStripedField(
      p, polygon, "columns",
      cx, cy,
      columnWidthMin, columnWidthMax,
      1, stripField, subtractPolygons,
    );
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function widthFactorAt(points: Array<[number, number]>, y01: number): number {
  const y = Math.min(1, Math.max(0, y01));
  for (let i = 1; i < points.length; i++) {
    const [py, pw] = points[i]!;
    const [prevY, prevW] = points[i - 1]!;
    if (y <= py) {
      const localT = (y - prevY) / Math.max(0.001, py - prevY);
      return lerp(prevW, pw, localT);
    }
  }
  return points[points.length - 1]![1];
}

function pronotumHalfWidthAt(shape: string, y01: number, w: number): number {
  const pointsByShape: Record<string, Array<[number, number]>> = {
    collar: [[0, 0.42], [0.4, 0.5], [1, 0.36]],
    flared: [[0, 0.22], [0.38, 0.54], [0.96, 0.42], [1, 0]],
    notchedPlate: [[0, 0.18], [0.28, 0.5], [0.92, 0.42], [1, 0.12]],
    saddle: [[0, 0.24], [0.32, 0.48], [0.98, 0.32], [1, 0]],
    trapezoid: [[0, 0.34], [1, 0.52]],
    shield: [[0, 0.3], [0.16, 0.48], [0.85, 0.38], [1, 0]],
    narrowNeck: [[0, 0.18], [1, 0.26]],
    pinched: [[0, 0.42], [0.32, 0.5], [0.5, 0.22], [0.7, 0.36], [1, 0.5]],
    wideShield: [[0, 0.4], [0.16, 0.6], [0.85, 0.42], [1, 0]],
    domed: [[0, 0.18], [0.5, 0.5], [1, 0.18]],
    spined: [[0, 0.34], [0.18, 0.62], [0.5, 0.36], [1, 0.34]],
    crown: [[0, 0.48], [0.92, 0.42], [1, 0]],
    cordate: [[0, 0.5], [0.36, 0.4], [1, 0]],
    bulging: [[0, 0.22], [0.5, 0.62], [1, 0.22]],
  };
  return w * widthFactorAt(pointsByShape[shape] ?? pointsByShape.shield, y01);
}

interface ElytraPreset {
  shoulder: number;
  outerTop: number;
  outerMid: number;
  outerLow: number;
  innerBottom: number;
  topDip: number;
  midY: number;
}

function normalizedElytraShape(shape: string): string {
  if (shape === "roundedRect" || shape === "capsule" || shape === "column") return "longOval";
  if (shape === "parallelSided") return "parallelSided";
  return shape;
}

const ELYTRA_PRESETS: Record<string, ElytraPreset> = {
  round: { shoulder: 0.62, outerTop: 0.92, outerMid: 1.02, outerLow: 0.82, innerBottom: 0.36, topDip: 0.02, midY: 0.46 },
  oval: { shoulder: 0.58, outerTop: 0.9, outerMid: 1.0, outerLow: 0.74, innerBottom: 0.28, topDip: 0.03, midY: 0.48 },
  longOval: { shoulder: 0.5, outerTop: 0.78, outerMid: 0.86, outerLow: 0.62, innerBottom: 0.22, topDip: 0.02, midY: 0.52 },
  pear: { shoulder: 0.42, outerTop: 0.74, outerMid: 1.04, outerLow: 0.86, innerBottom: 0.32, topDip: 0.04, midY: 0.58 },
  shield: { shoulder: 0.68, outerTop: 1.0, outerMid: 0.94, outerLow: 0.58, innerBottom: 0.18, topDip: 0.01, midY: 0.43 },
  tapered: { shoulder: 0.68, outerTop: 0.94, outerMid: 0.76, outerLow: 0.42, innerBottom: 0.12, topDip: 0.0, midY: 0.5 },
  wedge: { shoulder: 0.72, outerTop: 0.96, outerMid: 0.68, outerLow: 0.3, innerBottom: 0.1, topDip: 0.0, midY: 0.54 },
  kite: { shoulder: 0.4, outerTop: 0.96, outerMid: 0.74, outerLow: 0.4, innerBottom: 0.12, topDip: 0.05, midY: 0.38 },
  waisted: { shoulder: 0.72, outerTop: 0.98, outerMid: 0.72, outerLow: 0.92, innerBottom: 0.2, topDip: 0.02, midY: 0.42 },
  boxy: { shoulder: 0.78, outerTop: 0.98, outerMid: 0.98, outerLow: 0.8, innerBottom: 0.36, topDip: 0.0, midY: 0.5 },
  globular: { shoulder: 0.7, outerTop: 0.96, outerMid: 1.0, outerLow: 0.8, innerBottom: 0.34, topDip: 0.02, midY: 0.46 },
  elongated: { shoulder: 0.46, outerTop: 0.6, outerMid: 0.66, outerLow: 0.5, innerBottom: 0.18, topDip: 0.0, midY: 0.5 },
  flatOval: { shoulder: 0.6, outerTop: 0.92, outerMid: 1.05, outerLow: 0.86, innerBottom: 0.36, topDip: 0.04, midY: 0.46 },
  parallelSided: { shoulder: 0.7, outerTop: 0.84, outerMid: 0.86, outerLow: 0.84, innerBottom: 0.42, topDip: 0.0, midY: 0.5 },
  humpback: { shoulder: 0.66, outerTop: 0.96, outerMid: 1.0, outerLow: 0.62, innerBottom: 0.22, topDip: 0.02, midY: 0.42 },
  scarab: { shoulder: 0.7, outerTop: 1.0, outerMid: 0.92, outerLow: 0.66, innerBottom: 0.28, topDip: 0.0, midY: 0.45 },
};

function getElytraPreset(shape: string): ElytraPreset {
  return ELYTRA_PRESETS[normalizedElytraShape(shape)] ?? ELYTRA_PRESETS.shield;
}

function elytraHalfWidthAt(shape: string, y01: number, halfW: number): number {
  const preset = getElytraPreset(shape);
  return halfW * widthFactorAt([
    [0, preset.shoulder],
    [0.1, preset.outerTop],
    [preset.midY, preset.outerMid],
    [0.92, preset.outerLow],
    [1, preset.innerBottom],
  ], y01);
}

function traceElytronPath(
  ctx: PathSink,
  side: 1 | -1,
  shape: string,
  cx: number,
  topY: number,
  bottomY: number,
  halfW: number,
  topGap: number,
  bottomGap: number,
): void {
  const h = bottomY - topY;
  const preset = getElytraPreset(shape);
  const innerTopX = cx + side * topGap;
  const shoulderX = cx + side * halfW * preset.shoulder;
  const outerTopX = cx + side * halfW * preset.outerTop;
  const outerMidX = cx + side * halfW * preset.outerMid;
  const outerLowX = cx + side * halfW * preset.outerLow;
  const innerBottomX = cx + side * Math.max(bottomGap * preset.innerBottom * 2.2, bottomGap * 0.35);

  traceRoundedPolygon(ctx, [
    pt(innerTopX, topY),
    pt(shoulderX, topY - h * preset.topDip),
    pt(outerTopX, topY + h * 0.1),
    pt(outerMidX, topY + h * preset.midY),
    pt(outerLowX, bottomY - h * 0.08),
    pt(innerBottomX, bottomY),
  ], Math.min(halfW, h) * 0.035);
}

function drawBeetleElytra(
  p: p5SVG,
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  bottomY: number,
  w: number,
  shape: string,
  style: SurfaceStyle,
  color: string,
  strokeColor: string,
  strokeW: number,
  opening: number,
  rowHeightMin: number,
  rowHeightMax: number,
  pattern: ElytraPattern,
  baseColor: string,
  accentColor: string,
  patternDensity: number,
  lineField?: LineFieldInput,
  subtractPolygons: Point[][] = [],
): void {
  const halfW = w * 0.5;
  const topGap = Math.max(0.5, w * (0.002 + opening * 0.004));
  const bottomGap = Math.max(1.5, w * (0.004 + opening * 0.09));

  // For `mixed`, pre-pick the layered patterns ONCE so both wings show the
  // same motif combo (otherwise each side would roll independently).
  const mixedChoice: MixedPatternChoice | undefined =
    pattern === "mixed" ? pickMixedPattern(p) : undefined;

  for (const side of [1, -1] as const) {
    const polygon = jitterPolygon(p, capturePolygon((sink) =>
      traceElytronPath(sink, side, shape, cx, topY, bottomY, halfW, topGap, bottomGap),
    ));
    if (polygon.length < 3) continue;

    // Non-default patterns are filled motifs that work for both fill/line modes
    // (the rest of the body still respects renderStyle).
    if (pattern !== "stripedRows") {
      const handled = paintElytraPattern(pattern, {
        p, ctx, polygon,
        baseColor, accentColor,
        sutureX: cx, side, density: patternDensity,
        lineWidth: strokeW,
        // Carve out higher-Z shapes (pronotum, head) so they don't get painted
        // over by elytra fills — restores the old "pathfinder"-style overlap
        // removal that the line-mode subtractPolygons used to provide.
        subtractPolygons,
      }, mixedChoice);
      if (handled) continue;
    }

    if (style === "fill") {
      ctx.beginPath();
      traceElytronPath(ctx, side, shape, cx, topY, bottomY, halfW, topGap, bottomGap);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      const fallback = defaultLineField(side > 0 ? Math.PI * 0.18 : Math.PI * 0.82, 4, strokeW, strokeColor);
      const baseField = lineField ?? fallback;
      const sideField: LineFieldOptions = {
        ...baseField,
        mirrorAtCenterX: undefined,
        palette: side < 0 ? [...baseField.palette].reverse() : baseField.palette,
      };
      paintStripedField(
        p, polygon, "rows",
        cx, (topY + bottomY) / 2,
        rowHeightMin, rowHeightMax,
        side, sideField, subtractPolygons,
      );
    }
  }
}

// --- 3-segment mirrored legs ---
// Geometry is defined for the right side (+x = outward) and mirrored via `side`.
// t = 0 (front pair) → 1 (back pair)

type LegFootKind = "point" | "hook" | "paddle" | "claw" | "comb" | "pad";

interface LegProfile {
  attachXOffset: number;
  attachYOffset: number;
  lengthScale: number;
  s1: number;
  s2: number;
  s3: number;
  primaryOffset: number;
  kneeBend: number;
  ankleBend: number;
  femurW: number;
  tibiaW: number;
  tarsusW: number;
  jointScale: number;
  foot: LegFootKind;
  /** Adds a single perpendicular spike at the femur-tibia joint. */
  hasTibialSpur: boolean;
  /** Adds 2-3 short bumps along the femur outline. */
  hasFemurSpines: boolean;
}

function sampleLegProfile(p: p5SVG, t: number): LegProfile {
  const frontBias = 1 - t;
  const rearBias = t;
  return {
    attachXOffset: p.random(-0.05, 0.08),
    attachYOffset: p.random(-0.06, 0.08),
    lengthScale: p.random(0.96, 1.28) + frontBias * p.random(0.08, 0.2) + rearBias * p.random(0.22, 0.44) + (t === 0.5 ? p.random(0.02, 0.18) : 0),
    s1: p.random(0.34, 0.48) + frontBias * p.random(0.1, 0.2),
    s2: p.random(0.24, 0.38),
    s3: p.random(0.24, 0.38) + frontBias * p.random(0.06, 0.14) + rearBias * p.random(0.02, 0.08),
    primaryOffset: p.random(-0.34, 0.34) + frontBias * p.random(0.24, 0.48) + rearBias * p.random(0.06, 0.22),
    kneeBend: p.random(0.42, 1.16) - frontBias * p.random(0.08, 0.22),
    ankleBend: p.random(-0.08, 0.58),
    femurW: p.random(1.7, 3.4),
    tibiaW: p.random(1.1, 2.2),
    tarsusW: p.random(0.65, 1.5),
    jointScale: p.random(1.2, 2.1),
    foot: p.random(["point", "hook", "paddle", "claw", "comb", "pad"] as const) as LegFootKind,
    // Spurs/spines appear on a minority of legs to keep variety from getting noisy.
    hasTibialSpur: p.random() < 0.35,
    hasFemurSpines: p.random() < 0.22,
  };
}

// Set per-render from BibitteRenderParams.
let activeHatchDense = 0.15;
let activeHatchSparse = 1.4;
let activeShapeJitter = 0;
let activeLineJitter = 0;
// Default 0.3; overridden each render to the global lineWidth so legs/antennae
// hatch at the same stroke weight as everything else.
let activeLegHatchStroke = 0.3;

function jitterPolygon(p: p5SVG, polygon: Point[]): Point[] {
  const j = activeShapeJitter;
  if (j <= 0) return polygon;
  return polygon.map((pt) => ({
    x: pt.x + p.random(-j, j),
    y: pt.y + p.random(-j, j),
  }));
}

function drawWobblyLine(
  p: p5SVG, x1: number, y1: number, x2: number, y2: number,
): void {
  const j = activeLineJitter;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (j <= 0 || len < 1.5) {
    p.line(x1, y1, x2, y2);
    return;
  }
  const nx = -dy / len;
  const ny = dx / len;
  const segments = Math.max(2, Math.min(8, Math.round(len / 9)));
  let prevX = x1;
  let prevY = y1;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    let mx = x1 + dx * t;
    let my = y1 + dy * t;
    if (i < segments) {
      const off = p.random(-j, j);
      mx += nx * off;
      my += ny * off;
    }
    p.line(prevX, prevY, mx, my);
    prevX = mx;
    prevY = my;
  }
}

function sampleCubicBezier(
  p0: Point, p1: Point, p2: Point, p3: Point, steps: number,
): Point[] {
  const pts: Point[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return pts;
}

/** Hatch a polygon with parallel lines whose spacing varies smoothly across the
 *  perpendicular axis — dense on one edge, sparse on the other (illustrator blend). */
function hatchPolygonGradient(
  p: p5SVG,
  polygon: Point[],
  angle: number,
  spacingDense: number,
  spacingSparse: number,
  strokeW: number,
  color: string,
): void {
  if (polygon.length < 3) return;
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  for (const pt of polygon) {
    if (pt.x < xMin) xMin = pt.x;
    if (pt.x > xMax) xMax = pt.x;
    if (pt.y < yMin) yMin = pt.y;
    if (pt.y > yMax) yMax = pt.y;
  }
  const cx = (xMin + xMax) / 2;
  const cy = (yMin + yMax) / 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  // Project polygon vertices onto the perpendicular axis to get the *actual* perp extent.
  let perpMin = Infinity;
  let perpMax = -Infinity;
  for (const pt of polygon) {
    const proj = (pt.x - cx) * nx + (pt.y - cy) * ny;
    if (proj < perpMin) perpMin = proj;
    if (proj > perpMax) perpMax = proj;
  }
  const perpExtent = perpMax - perpMin;
  // Line radius along its direction: bbox diagonal is enough to cross the polygon.
  const lineRadius = Math.hypot(xMax - xMin, yMax - yMin) + 4;
  p.push();
  p.noFill();
  p.stroke(color);
  p.strokeWeight(Math.max(0.2, strokeW));
  p.strokeCap(p.ROUND);
  let pos = perpMin;
  let safety = 0;
  while (pos <= perpMax && safety < 8000) {
    safety++;
    const t = perpExtent > 1e-6 ? Math.max(0, Math.min(1, (pos - perpMin) / perpExtent)) : 0;
    const eased = Math.pow(t, 1.6);
    const spacing = Math.max(0.05, spacingDense + (spacingSparse - spacingDense) * eased);
    const px = cx + nx * pos;
    const py = cy + ny * pos;
    const ax = px - dx * lineRadius;
    const ay = py - dy * lineRadius;
    const bx = px + dx * lineRadius;
    const by = py + dy * lineRadius;
    const segs = clipSegmentToPolygon(ax, ay, bx, by, polygon);
    for (const seg of segs) {
      drawWobblyLine(p, seg.x1, seg.y1, seg.x2, seg.y2);
    }
    pos += spacing;
  }
  p.pop();
}

function drawLegSegmentShape(
  p: p5SVG,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w1: number,
  w2: number,
  color: string,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const polygon: Point[] = [
    { x: x1 + nx * w1, y: y1 + ny * w1 },
    { x: x2 + nx * w2, y: y2 + ny * w2 },
    { x: x2 - nx * w2, y: y2 - ny * w2 },
    { x: x1 - nx * w1, y: y1 - ny * w1 },
  ];
  const angle = Math.atan2(dy, dx);
  hatchPolygonGradient(p, jitterPolygon(p, polygon), angle, activeHatchDense, activeHatchSparse, activeLegHatchStroke, color);
}

function drawLegJoint(p: p5SVG, x: number, y: number, r: number, color: string): void {
  const rx = r;
  const ry = r * 0.775;
  const N = 24;
  const polygon: Point[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    polygon.push({ x: x + Math.cos(a) * rx, y: y + Math.sin(a) * ry });
  }
  hatchPolygonGradient(p, jitterPolygon(p, polygon), 0, activeHatchDense, activeHatchSparse, activeLegHatchStroke, color);
}

function drawLegFoot(
  p: p5SVG,
  x: number,
  y: number,
  angle: number,
  side: 1 | -1,
  size: number,
  color: string,
  foot: LegProfile["foot"],
): void {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  let polygon: Point[];
  if (foot === "paddle") {
    polygon = [
      { x: x + dx * size * 1.15, y: y + dy * size * 1.15 },
      { x: x + nx * size * 0.65, y: y + ny * size * 0.65 },
      { x: x - dx * size * 0.45, y: y - dy * size * 0.45 },
      { x: x - nx * size * 0.65, y: y - ny * size * 0.65 },
    ];
  } else if (foot === "hook") {
    const hookA = angle + side * 0.85;
    polygon = [
      { x, y },
      { x: x + dx * size * 0.9 + nx * size * 0.22, y: y + dy * size * 0.9 + ny * size * 0.22 },
      { x: x + Math.cos(hookA) * size * 1.1, y: y + Math.sin(hookA) * size * 1.1 },
      { x: x + dx * size * 0.45 - nx * size * 0.2, y: y + dy * size * 0.45 - ny * size * 0.2 },
    ];
  } else if (foot === "claw") {
    // Sharp narrow curved hook — sharper than `hook`.
    const clawA = angle + side * 0.45;
    polygon = [
      { x, y },
      { x: x + Math.cos(angle) * size * 0.4 + nx * size * 0.1, y: y + Math.sin(angle) * size * 0.4 + ny * size * 0.1 },
      { x: x + Math.cos(clawA) * size * 1.5, y: y + Math.sin(clawA) * size * 1.5 },
      { x: x + Math.cos(angle - side * 0.25) * size * 0.55, y: y + Math.sin(angle - side * 0.25) * size * 0.55 },
    ];
  } else if (foot === "comb") {
    // Saw-toothed pad — alternating prongs along the front edge.
    polygon = [
      { x: x - nx * size * 0.5, y: y - ny * size * 0.5 },
      { x: x + dx * size * 0.7 - nx * size * 0.55, y: y + dy * size * 0.7 - ny * size * 0.55 },
      { x: x + dx * size * 0.95 - nx * size * 0.22, y: y + dy * size * 0.95 - ny * size * 0.22 },
      { x: x + dx * size * 0.7, y: y + dy * size * 0.7 },
      { x: x + dx * size * 1.1 + nx * size * 0.18, y: y + dy * size * 1.1 + ny * size * 0.18 },
      { x: x + dx * size * 0.7 + nx * size * 0.4, y: y + dy * size * 0.7 + ny * size * 0.4 },
      { x: x + nx * size * 0.5, y: y + ny * size * 0.5 },
    ];
  } else if (foot === "pad") {
    // Soft rounded pad.
    polygon = [
      { x: x + dx * size * 1.0 + nx * size * 0.55, y: y + dy * size * 1.0 + ny * size * 0.55 },
      { x: x + dx * size * 1.25, y: y + dy * size * 1.25 },
      { x: x + dx * size * 1.0 - nx * size * 0.55, y: y + dy * size * 1.0 - ny * size * 0.55 },
      { x: x - dx * size * 0.2 - nx * size * 0.45, y: y - dy * size * 0.2 - ny * size * 0.45 },
      { x: x - dx * size * 0.4, y: y - dy * size * 0.4 },
      { x: x - dx * size * 0.2 + nx * size * 0.45, y: y - dy * size * 0.2 + ny * size * 0.45 },
    ];
  } else {
    polygon = [
      { x: x + dx * size * 1.2, y: y + dy * size * 1.2 },
      { x: x - dx * size * 0.25 + nx * size * 0.36, y: y - dy * size * 0.25 + ny * size * 0.36 },
      { x: x - dx * size * 0.25 - nx * size * 0.36, y: y - dy * size * 0.25 - ny * size * 0.36 },
    ];
  }
  hatchPolygonGradient(p, jitterPolygon(p, polygon), angle, activeHatchDense, activeHatchSparse, activeLegHatchStroke, color);
}

/** Short perpendicular spike at the knee — common on jumping/digging legs. */
function drawTibialSpur(
  p: p5SVG,
  jx: number, jy: number,
  legAngle: number,
  side: 1 | -1,
  size: number,
  color: string,
): void {
  const spurAngle = legAngle + side * (Math.PI * 0.5 - 0.15);
  const dx = Math.cos(spurAngle);
  const dy = Math.sin(spurAngle);
  const nx = -dy;
  const ny = dx;
  const len = size * 1.6;
  const w = size * 0.42;
  const polygon: Point[] = [
    { x: jx + dx * len, y: jy + dy * len },
    { x: jx + nx * w * 0.85, y: jy + ny * w * 0.85 },
    { x: jx - nx * w * 0.85, y: jy - ny * w * 0.85 },
  ];
  hatchPolygonGradient(p, jitterPolygon(p, polygon), spurAngle, activeHatchDense, activeHatchSparse, activeLegHatchStroke, color);
}

/** Two small bumps along the inner femur edge — predatory beetles often have these. */
function drawFemurSpines(
  p: p5SVG,
  ax: number, ay: number,
  jx: number, jy: number,
  legAngle: number,
  side: 1 | -1,
  thickness: number,
  color: string,
): void {
  const dx = jx - ax;
  const dy = jy - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  // 2-3 spines along the inward face of the femur.
  const count = 2;
  for (let i = 0; i < count; i++) {
    const t = 0.42 + i * 0.28;
    const bx = ax + ux * len * t;
    const by = ay + uy * len * t;
    const spineLen = thickness * 1.25;
    const spineW = thickness * 0.3;
    const tipX = bx - side * nx * spineLen;
    const tipY = by - side * ny * spineLen;
    const polygon: Point[] = [
      { x: tipX, y: tipY },
      { x: bx + ux * spineW, y: by + uy * spineW },
      { x: bx - ux * spineW, y: by - uy * spineW },
    ];
    hatchPolygonGradient(p, jitterPolygon(p, polygon), legAngle, activeHatchDense, activeHatchSparse, activeLegHatchStroke, color);
  }
}

function drawLeg(
  p: p5SVG,
  ax: number, ay: number,
  totalLength: number,
  t: number,
  side: 1 | -1,
  thickness: number,
  color: string,
  profile: LegProfile,
): void {
  const ratioTotal = profile.s1 + profile.s2 + profile.s3;
  const s1 = totalLength * (profile.s1 / ratioTotal);
  const s2 = totalLength * (profile.s2 / ratioTotal);
  const s3 = totalLength * (profile.s3 / ratioTotal);

  // Mirror for left side: angle A → π - A (negates x-component, keeps y-component)
  const ang = (a: number) => side > 0 ? a : Math.PI - a;
  const isFrontLeg = t < 0.34;
  const isRearLeg = t > 0.66;
  const primR = (t - 0.5) * Math.PI * 0.72 + profile.primaryOffset;

  // Hard-code rear/front Z-shapes pointing toward head/tail so each leg pair has a
  // distinct posture. Rear: femur down-out, tibia steep down (slight back), tarsus
  // out-down — keeps the foot OUTSIDE the body silhouette.
  // Mid: enforce a strong knee bend so the leg doesn't read as a straight line.
  const a1R = isFrontLeg
    ? 0.08 - profile.primaryOffset * 0.16
    : isRearLeg
      ? 0.85 + profile.primaryOffset * 0.18
      : primR;
  const a2R = isFrontLeg
    ? -2.08 - profile.kneeBend * 0.12
    : isRearLeg
      ? 1.65 + profile.kneeBend * 0.18
      : primR + Math.max(0.75, profile.kneeBend);
  const a3R = isFrontLeg
    ? -0.16 - profile.ankleBend * 0.14
    : isRearLeg
      ? 0.55 + profile.ankleBend * 0.2
      : primR + profile.ankleBend;

  const a1 = ang(a1R);
  const j1x = ax + Math.cos(a1) * s1;
  const j1y = ay + Math.sin(a1) * s1;

  const a2 = ang(a2R);
  const j2x = j1x + Math.cos(a2) * s2;
  const j2y = j1y + Math.sin(a2) * s2;

  const a3 = ang(a3R);
  const ex = j2x + Math.cos(a3) * s3;
  const ey = j2y + Math.sin(a3) * s3;

  const femurW = thickness * profile.femurW;
  const tibiaW = thickness * profile.tibiaW;
  const tarsusW = thickness * profile.tarsusW;

  drawLegSegmentShape(p, ax, ay, j1x, j1y, femurW * 0.75, femurW, color);
  if (profile.hasFemurSpines) {
    drawFemurSpines(p, ax, ay, j1x, j1y, a1, side, thickness, color);
  }
  drawLegSegmentShape(p, j1x, j1y, j2x, j2y, tibiaW * 1.05, tibiaW * 0.72, color);
  drawLegSegmentShape(p, j2x, j2y, ex, ey, tarsusW * 0.9, tarsusW * 0.45, color);
  drawLegJoint(p, j1x, j1y, thickness * profile.jointScale, color);
  drawLegJoint(p, j2x, j2y, thickness * profile.jointScale * 0.8, color);
  if (profile.hasTibialSpur) {
    drawTibialSpur(p, j2x, j2y, a2, side, thickness * 1.2, color);
  }
  drawLegFoot(p, ex, ey, a3, side, Math.max(thickness * 2.4, totalLength * 0.035), color, profile.foot);
}

// --- Antennae: one mirrored path per side (geometry for +x, reflect via ang) ---

interface AntennaJitter {
  /** radians, small style-preserving angle variation */
  outward: number;
  /** fraction of total length for first segment (two-segment mode) */
  split: number;
  /** radians added to knee bend */
  knee: number;
  /** scales reach */
  lenScale: number;
  /** head-R units: shared ± offset on attachment x from center */
  attachXFrac: number;
  /** head-R units: vertical nudge of attachment */
  attachYFrac: number;
  /** uneven segment interval proportions for segmented antennae */
  segmentFractions: number[];
}

function normalizeAntennaStyle(style: string, bendAmount: number): string {
  if (style === "auto") {
    if (bendAmount < 0.16) return "setaceous";
    if (bendAmount < 0.28) return "moniliform";
    if (bendAmount < 0.4) return "geniculate";
    if (bendAmount < 0.5) return "serrate";
    if (bendAmount < 0.62) return "pectinate";
    if (bendAmount < 0.74) return "capitate";
    if (bendAmount < 0.84) return "clavate";
    if (bendAmount < 0.92) return "flabellate";
    return "lamellate";
  }
  const aliases: Record<string, string> = {
    short: "setaceous",
    straight: "setaceous",
    filiform: "setaceous",
    elbow: "geniculate",
    curve: "setaceous",
    wideCurve: "serrate",
    longCurve: "clavate",
    mustache: "geniculate",
    bipectinate: "bipectinate",
  };
  return aliases[style] ?? style;
}

function drawAntennaMirrored(
  p: p5SVG,
  ax: number,
  ay: number,
  totalLength: number,
  side: 1 | -1,
  bendAmount: number,
  antennaStyle: string,
  color: string,
  weight: number,
  jitter: AntennaJitter,
): void {
  if (antennaStyle === "none") return;

  const ang = (a: number) => (side > 0 ? a : Math.PI - a);
  const style = normalizeAntennaStyle(antennaStyle, bendAmount);
  const baseAngles: Record<string, number> = {
    setaceous: -0.78,
    serrate: -0.68,
    geniculate: -0.36,
    lamellate: -0.62,
    clavate: -0.72,
    pectinate: -0.7,
    bipectinate: -0.78,
    flabellate: -0.66,
    moniliform: -0.78,
    capitate: -0.78,
  };
  const primR = (baseAngles[style] ?? -0.72) + jitter.outward;
  let L = totalLength * jitter.lenScale;

  if (style === "lamellate") {
    L *= 0.72;
  } else if (style === "clavate") {
    L *= 0.9;
  } else if (style === "flabellate") {
    L *= 0.78;
  } else if (style === "capitate") {
    L *= 1.05;
  }

  const drawTeardropSegment = (
    cx: number,
    cy: number,
    angle: number,
    len: number,
    width: number,
    shape: "teardrop" | "flat" | "triangle",
  ) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const nx = -dy;
    const ny = dx;
    const tipX = cx + dx * len * 0.55;
    const tipY = cy + dy * len * 0.55;
    const baseX = cx - dx * len * 0.45;
    const baseY = cy - dy * len * 0.45;
    const bellyX = cx - dx * len * 0.04;
    const bellyY = cy - dy * len * 0.04;

    const polygon: Point[] = [];
    if (shape === "triangle") {
      polygon.push({ x: tipX, y: tipY });
      polygon.push({ x: baseX + nx * width * 0.82, y: baseY + ny * width * 0.82 });
      polygon.push({ x: baseX - nx * width * 0.82, y: baseY - ny * width * 0.82 });
    } else if (shape === "flat") {
      polygon.push({ x: tipX, y: tipY });
      const curve = sampleCubicBezier(
        { x: tipX, y: tipY },
        { x: cx + nx * width * 0.34, y: cy + ny * width * 0.34 },
        { x: bellyX + nx * width, y: bellyY + ny * width },
        { x: baseX + nx * width * 0.68, y: baseY + ny * width * 0.68 },
        8,
      );
      for (const pt of curve) polygon.push(pt);
      polygon.push({ x: baseX - nx * width * 0.28, y: baseY - ny * width * 0.28 });
    } else {
      polygon.push({ x: tipX, y: tipY });
      const c1 = sampleCubicBezier(
        { x: tipX, y: tipY },
        { x: cx + nx * width * 0.28, y: cy + ny * width * 0.28 },
        { x: bellyX + nx * width, y: bellyY + ny * width },
        { x: baseX, y: baseY },
        8,
      );
      for (const pt of c1) polygon.push(pt);
      const c2 = sampleCubicBezier(
        { x: baseX, y: baseY },
        { x: bellyX - nx * width, y: bellyY - ny * width },
        { x: cx - nx * width * 0.28, y: cy - ny * width * 0.28 },
        { x: tipX, y: tipY },
        8,
      );
      // Skip duplicate end-of-c2 (== tipX,tipY which is already the polygon's first vertex).
      for (let i = 0; i < c2.length - 1; i++) polygon.push(c2[i]!);
    }
    hatchPolygonGradient(p, polygon, angle, activeHatchDense, activeHatchSparse, activeLegHatchStroke, color);
  };

  const drawSegmentedAntennaLine = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    segmentCount: number,
    shapeFor: (i: number) => "teardrop" | "flat" | "triangle",
    widthFor: (i: number) => number,
    shapeOffset = 0,
    curveAmp = 0,
  ) => {
    const fractions = jitter.segmentFractions.slice(0, segmentCount);
    const total = fractions.reduce((sum, n) => sum + n, 0) || 1;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const baseLen = Math.hypot(dx, dy) || 1;
    // Perpendicular unit vector (relative to chain direction).
    const nx = -dy / baseLen;
    const ny = dx / baseLen;
    // Random per-call harmonic phases so every antenna meanders differently.
    const phase1 = p.random(0, Math.PI * 2);
    const phase2 = p.random(0, Math.PI * 2);
    const phase3 = p.random(0, Math.PI * 2);
    const harmonic2 = side * (0.55 + p.random(-0.18, 0.18));
    const harmonic3 = side * (0.28 + p.random(-0.12, 0.12));
    const pointAt = (t: number) => {
      const bx = x0 + dx * t;
      const by = y0 + dy * t;
      if (curveAmp <= 0) return { x: bx, y: by };
      // Multi-harmonic sine produces several joint-like bends along the chain
      // (instead of a single smooth arc), so segments take varied angles.
      const off =
        Math.sin(t * Math.PI + phase1) * curveAmp +
        Math.sin(t * Math.PI * 2.6 + phase2) * curveAmp * harmonic2 +
        Math.sin(t * Math.PI * 4.3 + phase3) * curveAmp * harmonic3;
      return { x: bx + nx * off, y: by + ny * off };
    };
    let cursor = 0;
    for (let i = 0; i < segmentCount; i++) {
      const next = i === segmentCount - 1 ? 1 : cursor + (fractions[i] ?? 1) / total;
      const a = pointAt(cursor);
      const b = pointAt(next);
      const sdx = b.x - a.x;
      const sdy = b.y - a.y;
      const dist = Math.hypot(sdx, sdy);
      drawTeardropSegment(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        Math.atan2(sdy, sdx),
        dist * 1.24,
        widthFor(i),
        shapeFor(i + shapeOffset),
      );
      cursor = next;
    }
  };

  const drawLamella = (cx: number, cy: number, angle: number, len: number, width: number) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const nx = -dy;
    const ny = dx;
    const baseX = cx - dx * len * 0.24;
    const baseY = cy - dy * len * 0.24;
    const tipX = cx + dx * len * 0.58;
    const tipY = cy + dy * len * 0.58;
    const polygon: Point[] = [
      { x: baseX + nx * width * 0.26, y: baseY + ny * width * 0.26 },
      { x: tipX + nx * width * 0.62, y: tipY + ny * width * 0.62 },
      { x: tipX - nx * width * 0.62, y: tipY - ny * width * 0.62 },
      { x: baseX - nx * width * 0.26, y: baseY - ny * width * 0.26 },
    ];
    hatchPolygonGradient(p, polygon, angle, activeHatchDense, activeHatchSparse, activeLegHatchStroke, color);
  };

  if (style === "setaceous") {
    const a1 = ang(primR);
    drawSegmentedAntennaLine(
      ax,
      ay,
      ax + Math.cos(a1) * L,
      ay + Math.sin(a1) * L,
      11,
      () => "teardrop",
      (i) => Math.max(weight * 1.05, L * (0.016 - i * 0.00085)),
    );
    return;
  }

  if (style === "serrate") {
    const a1 = ang(primR + bendAmount * 0.18);
    drawSegmentedAntennaLine(
      ax,
      ay,
      ax + Math.cos(a1) * L * 0.88,
      ay + Math.sin(a1) * L * 0.88,
      13,
      () => "triangle",
      (i) => Math.max(weight * 1.4, L * (0.018 - i * 0.00065)),
    );
    return;
  }

  if (style === "clavate") {
    const a1 = ang(primR + bendAmount * 0.1);
    drawSegmentedAntennaLine(
      ax,
      ay,
      ax + Math.cos(a1) * L,
      ay + Math.sin(a1) * L,
      11,
      (i) => (i >= 7 ? "teardrop" : "flat"),
      (i) => Math.max(weight * 1.2, L * (i >= 7 ? 0.026 + (i - 7) * 0.004 : 0.013)),
    );
    return;
  }

  if (style === "lamellate") {
    const a1 = ang(primR);
    const stemEndX = ax + Math.cos(a1) * L * 0.58;
    const stemEndY = ay + Math.sin(a1) * L * 0.58;
    drawSegmentedAntennaLine(
      ax,
      ay,
      stemEndX,
      stemEndY,
      6,
      () => "flat",
      (i) => Math.max(weight * 1.1, L * (0.012 + i * 0.0006)),
    );
    for (let i = 0; i < 4; i++) {
      const fan = (i - 1.5) * 0.2;
      drawLamella(
        stemEndX + Math.cos(a1) * L * 0.05 * i,
        stemEndY + Math.sin(a1) * L * 0.05 * i,
        a1 + side * fan,
        L * (0.18 + i * 0.018),
        Math.max(weight * 1.6, L * 0.018),
      );
    }
    return;
  }

  if (style === "flabellate") {
    // Long fan blades on the inward side (more dramatic than lamellate).
    const a1 = ang(primR);
    const stemEndX = ax + Math.cos(a1) * L * 0.42;
    const stemEndY = ay + Math.sin(a1) * L * 0.42;
    drawSegmentedAntennaLine(
      ax, ay, stemEndX, stemEndY,
      4, () => "flat",
      (i) => Math.max(weight * 1.0, L * (0.011 + i * 0.0007)),
    );
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const bladeAngle = a1 + side * (Math.PI * 0.42) * (1 - t * 0.55);
      drawLamella(
        stemEndX + Math.cos(a1) * L * 0.05 * i,
        stemEndY + Math.sin(a1) * L * 0.05 * i,
        bladeAngle,
        L * (0.36 + i * 0.04),
        Math.max(weight * 1.7, L * 0.024),
      );
    }
    return;
  }

  if (style === "moniliform") {
    // String of beads — fixed-width segments along a soft curve.
    const a1 = ang(primR);
    drawSegmentedAntennaLine(
      ax, ay, ax + Math.cos(a1) * L, ay + Math.sin(a1) * L,
      11, () => "teardrop",
      () => Math.max(weight * 1.5, L * 0.02),
    );
    return;
  }

  if (style === "capitate") {
    // Thin stem ending in an abrupt triangular tip (triangles read crisper than
    // circles in line art).
    const a1 = ang(primR);
    const stemEndX = ax + Math.cos(a1) * L * 0.82;
    const stemEndY = ay + Math.sin(a1) * L * 0.82;
    drawSegmentedAntennaLine(
      ax, ay, stemEndX, stemEndY,
      9, () => "flat",
      () => Math.max(weight * 0.9, L * 0.0095),
    );
    const tipLen = L * 0.22;
    const tipW = Math.max(weight * 2.2, L * 0.042);
    const tipCX = stemEndX + Math.cos(a1) * tipLen * 0.5;
    const tipCY = stemEndY + Math.sin(a1) * tipLen * 0.5;
    drawTeardropSegment(tipCX, tipCY, a1, tipLen, tipW, "triangle");
    return;
  }

  if (style === "pectinate" || style === "bipectinate") {
    // Stem + comb teeth. Bipectinate has teeth on both sides.
    const a1 = ang(primR);
    const stemEndX = ax + Math.cos(a1) * L;
    const stemEndY = ay + Math.sin(a1) * L;
    drawSegmentedAntennaLine(
      ax, ay, stemEndX, stemEndY,
      8, () => "flat",
      (i) => Math.max(weight * 1.0, L * (0.011 - i * 0.00045)),
    );
    const numTeeth = 7;
    const stepX = (stemEndX - ax) / (numTeeth + 1);
    const stepY = (stemEndY - ay) / (numTeeth + 1);
    const teethSides: number[] = style === "bipectinate" ? [side, -side] : [side];
    for (let i = 1; i <= numTeeth; i++) {
      const tx = ax + stepX * i;
      const ty = ay + stepY * i;
      const toothLen = L * 0.16 * (0.55 + (i / numTeeth) * 0.65);
      const toothW = Math.max(weight * 1.1, L * 0.011);
      for (const tSide of teethSides) {
        const toothAngle = a1 + tSide * (Math.PI * 0.5 - 0.18);
        drawTeardropSegment(
          tx + Math.cos(toothAngle) * toothLen * 0.5,
          ty + Math.sin(toothAngle) * toothLen * 0.5,
          toothAngle, toothLen, toothW, "triangle",
        );
      }
    }
    return;
  }

  const effBend = Math.max(bendAmount, 0.22);
  const s1 = L * (0.52 + effBend * 0.1 + jitter.split);
  const s2 = L - s1;
  const kneeDelta = 0.72 + effBend * 0.4 + jitter.knee;

  const a1 = ang(primR);
  const j1x = ax + Math.cos(a1) * s1;
  const j1y = ay + Math.sin(a1) * s1;

  const a2 = ang(primR + kneeDelta);
  const ex = j1x + Math.cos(a2) * s2;
  const ey = j1y + Math.sin(a2) * s2;

  drawSegmentedAntennaLine(
    ax,
    ay,
    j1x,
    j1y,
    5,
    () => "flat",
    (i) => Math.max(weight * 1.2, L * (0.016 - i * 0.0011)),
  );
  drawSegmentedAntennaLine(
    j1x,
    j1y,
    ex,
    ey,
    6,
    () => "teardrop",
    (i) => Math.max(weight * 1.35, L * (0.018 - i * 0.0009)),
    5,
  );
}

function sampleAntennaJitter(p: p5SVG): AntennaJitter {
  const fractions: number[] = [];
  for (let i = 0; i < 16; i++) {
    fractions.push(p.random(0.62, 1.55));
  }
  return {
    outward: p.random(-0.062, 0.062),
    split: p.random(-0.055, 0.055),
    knee: p.random(-0.12, 0.12),
    lenScale: p.random(0.94, 1.06),
    attachXFrac: p.random(-0.045, 0.045),
    attachYFrac: p.random(-0.05, 0.05),
    segmentFractions: fractions,
  };
}

// Captures moveTo/lineTo calls so we can replay them with a transform applied.
class PointCapture implements MinimalPath {
  points: Point[] = [];
  moveTo(x: number, y: number) { this.points.push({ x, y }); }
  lineTo(x: number, y: number) { this.points.push({ x, y }); }
  closePath() {}
}

// --- Main render ---

export function renderBibitte(p: p5SVG, params: BibitteRenderParams, colors: BibitteColors): void {
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  activeRoundness = Math.max(0, Math.min(10, params.roundness ?? 1));
  const drawW = params.width - 2 * params.marginX;
  const drawH = params.height - 2 * params.marginY;

  const bL = params.bodyLength;
  const bW = params.bodyWidth;
  const cx = params.marginX + drawW / 2;
  const cy = params.marginY + drawH / 2;

  const plan = resolveBibitteBodyPlan({
    bodyShape: params.bodyShape,
    thoraxShape: params.thoraxShape,
    headShape: params.headShape,
    bodyLength: bL,
    bodyWidth: bW,
    bodyTaper: params.bodyTaper,
    headSize: params.headSize,
    cx,
    cy,
  });

  // Stash appendage hatch + jitter params for the leg/antenna helpers.
  activeHatchDense = Math.max(0.05, Math.min(params.appendageHatchDense, params.appendageHatchSparse));
  activeHatchSparse = Math.max(activeHatchDense + 0.01, params.appendageHatchSparse);
  activeShapeJitter = Math.max(0, params.shapeJitter);
  activeLineJitter = Math.max(0, params.lineJitter);
  const isLine = params.renderStyle === "line";
  const bodyPaint: SurfaceStyle = isLine ? "line" : "fill";
  // Single-pen plotter aesthetic: every drawn line uses the same stroke weight.
  const lineW = Math.max(0.3, params.lineWidth);
  const hatchStroke = lineW;
  // Make the leg/antenna hatching also draw at the global lineWidth.
  activeLegHatchStroke = lineW;
  const spacingFromDensity = (density: number): [number, number] => {
    const d = Math.max(0, Math.min(1, density));
    // Linear from 12 (sparse) at d=0 to 0.1 (very dense) at d=1; 15% jitter band.
    const center = 12 * (1 - d) + 0.1 * d;
    return [Math.max(0.08, center * 0.85), Math.max(0.1, center * 1.15)];
  };
  const [bodySMin, bodySMax] = spacingFromDensity(params.bodyDensity);
  const [wingSMin, wingSMax] = spacingFromDensity(params.wingDensity);
  const [pronotumSMin, pronotumSMax] = spacingFromDensity(params.pronotumDensity);
  const [headSMin, headSMax] = spacingFromDensity(params.headDensity);
  const [bundleLenMin, bundleLenMax] = sortedRange(params.bundleLengthMin, params.bundleLengthMax);
  const [gapLo, gapHi] = sortedRange(params.gapMin, params.gapMax);
  const randomness = params.colorRandomness;
  // Body is rendered as one column — no centerline mirror. Vertical lines.
  const bodyLineField: LineFieldOptions = makeBundledLineField(
    p, colors.body, Math.PI / 2, bodySMin, bodySMax,
    bundleLenMin, bundleLenMax, gapLo, gapHi, hatchStroke, 0.1, 0.55,
    randomness, 0,
  );
  // Wing field: vertical lines, mirrored via per-side palette flip in drawBeetleElytra.
  const wingLineField: LineFieldOptions = makeBundledLineField(
    p, colors.wing, Math.PI / 2, wingSMin, wingSMax,
    bundleLenMin, bundleLenMax, gapLo, gapHi, hatchStroke, 0.15, 0.7,
    randomness, 0,
  );
  // Pronotum: horizontal lines, painted as vertical columns inside paintPronotum (no mirror).
  const pronotumLineField: LineFieldOptions = makeBundledLineField(
    p, colors.pronotum, 0,
    pronotumSMin, pronotumSMax, bundleLenMin, bundleLenMax, gapLo, gapHi,
    hatchStroke, 0.08, 0.45, randomness, 0,
  );
  // Head: vertical lines, mirrored across centerline.
  const headLineField: LineFieldOptions = {
    ...makeBundledLineField(p, colors.head, Math.PI / 2,
      headSMin, headSMax, bundleLenMin, bundleLenMax, gapLo, gapHi,
      hatchStroke, 0.06, 0.4, randomness, 0),
    mirrorAtCenterX: cx,
  };
  const elytraWidthScale = p.random(0.86, 1.18);
  const elytraLengthScale = p.random(0.86, 1.16);
  const pronotumWidthScale = p.random(0.82, 1.24);
  const pronotumHeightScale = p.random(0.78, 1.18);
  const headWidthScale = p.random(0.82, 1.22);
  const headHeightScale = p.random(0.82, 1.18);
  const pronotumW = (plan.thorax?.w ?? bW * 0.82) * pronotumWidthScale;
  const pronotumH = (plan.thorax?.h ?? bL * 0.16) * pronotumHeightScale;
  let pronotumCY = plan.thorax?.cy ?? cy - bL * 0.34;
  let headCY = Math.max(
    plan.headCY,
    pronotumCY - pronotumH * 0.56 - plan.headR * headHeightScale * 0.18,
  );
  let elytraTop = pronotumCY + pronotumH * 0.24;
  const baseElytraBottom = plan.abdomen.cy + plan.abdomen.h * 0.46;
  let elytraBottom = elytraTop + (baseElytraBottom - elytraTop) * elytraLengthScale;
  const elytraOpening = p.random(0.0, 1.0);
  const underLength = p.random(0.48, 0.96);
  let underTop = elytraTop + plan.abdomen.h * 0.04;
  let underBottom = plan.abdomen.cy + plan.abdomen.h * (0.32 + underLength * 0.2);
  const underShape = p.random(["capsule", "abdomenTaper", "abdomenPoint"] as const);
  const underW = plan.abdomen.w * (0.54 + underLength * 0.18 + (underShape === "abdomenPoint" ? p.random(-0.08, 0.02) : 0));
  const bodyTop = Math.min(headCY - plan.headR * headHeightScale, pronotumCY - pronotumH * 0.5, elytraTop);
  const bodyBottom = Math.max(headCY + plan.headR * headHeightScale, pronotumCY + pronotumH * 0.5, elytraBottom, underBottom);
  const bodyOffsetY = cy - (bodyTop + bodyBottom) / 2;
  pronotumCY += bodyOffsetY;
  headCY += bodyOffsetY;
  elytraTop += bodyOffsetY;
  elytraBottom += bodyOffsetY;
  underTop += bodyOffsetY;
  underBottom += bodyOffsetY;

  // Elytra gap parameters (mirror those inside drawBeetleElytra)
  const elytraW = plan.abdomen.w * elytraWidthScale;
  const elytraTopGap = Math.max(0.5, elytraW * (0.002 + elytraOpening * 0.004));
  const elytraBottomGap = Math.max(1.5, elytraW * (0.004 + elytraOpening * 0.09));

  // Clip ctx to everything OUTSIDE the body masks (pronotum + elytra).
  // Even-odd: outer rect (1 crossing) + each shape sub-path (1 crossing) = 2 → excluded.
  function clipOutsideBody(): void {
    ctx.beginPath();
    ctx.rect(-1, -1, params.width + 2, params.height + 2);
    if (plan.thorax) {
      tracePronotumPath(ctx, plan.thorax.shape, plan.thorax.cx, pronotumCY, pronotumW, pronotumH);
      ctx.closePath();
      for (const side of [1, -1] as const) {
        traceElytronPath(ctx, side, plan.abdomen.shape, cx, elytraTop, elytraBottom,
          plan.abdomen.w * elytraWidthScale * 0.5, elytraTopGap, elytraBottomGap);
        ctx.closePath();
      }
    } else {
      traceBodyPath(ctx, plan.abdomen.shape, plan.abdomen.cx, plan.abdomen.cy,
        plan.abdomen.w, plan.abdomen.h, plan.abdomen.taper);
      ctx.closePath();
    }
    ctx.clip("evenodd");
  }

  // Clip ctx to everything OUTSIDE the head.
  // Captures the traced head polygon, applies headWidthScale/headHeightScale, then re-traces.
  function clipOutsideHead(): void {
    const capture = new PointCapture();
    traceHeadPath(capture, plan.headShape, cx, headCY, plan.headR);
    ctx.beginPath();
    ctx.rect(-1, -1, params.width + 2, params.height + 2);
    for (let i = 0; i < capture.points.length; i++) {
      const pt = capture.points[i]!;
      const sx = cx + (pt.x - cx) * headWidthScale;
      const sy = headCY + (pt.y - headCY) * headHeightScale;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.clip("evenodd");
  }

  // Pre-compute polygons so later-drawn shapes can erase overlap regions
  // from earlier hatch (only relevant in line mode; fill mode overpaints).
  const elytraHalfW = plan.abdomen.w * elytraWidthScale * 0.5;
  const elytraPolygons: Point[][] = plan.thorax && plan.name === "beetle"
    ? [1, -1].map((side) =>
        capturePolygon((sink) =>
          traceElytronPath(sink, side as 1 | -1, plan.abdomen.shape, plan.abdomen.cx,
            elytraTop, elytraBottom, elytraHalfW, elytraTopGap, elytraBottomGap),
        ),
      )
    : [];
  const pronotumPolygon: Point[] = plan.thorax
    ? capturePolygon((sink) =>
        tracePronotumPath(sink, plan.thorax!.shape, plan.thorax!.cx, pronotumCY,
          pronotumW, pronotumH),
      )
    : [];
  const headPolygon: Point[] = (() => {
    const raw = capturePolygon((sink) => traceHeadPath(sink, plan.headShape, cx, headCY, plan.headR));
    return raw.map((pt) => ({
      x: cx + (pt.x - cx) * headWidthScale,
      y: headCY + (pt.y - headCY) * headHeightScale,
    }));
  })();

  // Z-order (back-to-front): body → pronotum → head → ELYTRA (on top) →
  // antennae → legs. Elytra is painted last so it always covers any pronotum/
  // head silhouette it overlaps. Each lower layer also subtracts every higher
  // layer from its own paint so sparse stripe modes don't leave the deeper
  // colors visible through the gaps.

  // 1. Body (under-abdomen)
  if (plan.thorax) {
    if (plan.name === "beetle") {
      const underH = Math.max(plan.abdomen.h * 0.28, underBottom - underTop);
      const underCY = underTop + underH / 2;
      paintBody(p, ctx, underShape, plan.abdomen.cx, underCY,
        underW, underH, 0.5, bodyPaint,
        colors.body[0]!, lineW, bodyLineField,
        [...elytraPolygons, pronotumPolygon, headPolygon]);
    } else {
      paintBody(p, ctx, plan.abdomen.shape, plan.abdomen.cx, plan.abdomen.cy, plan.abdomen.w, plan.abdomen.h,
        plan.abdomen.taper, bodyPaint,
        colors.body[0]!, lineW, bodyLineField,
        [...elytraPolygons, pronotumPolygon, headPolygon]);
    }
    // 2. Pronotum (subtract head AND elytra so the elytra silhouette never
    //    has pronotum stripe colors bleeding into it through its sparse paint).
    paintPronotum(p, ctx, plan.thorax.shape, plan.thorax.cx, pronotumCY,
      pronotumW, pronotumH,
      bodyPaint, colors.pronotum[0]!, lineW,
      params.pronotumColumnWidthMin, params.pronotumColumnWidthMax,
      params.pronotumPattern,
      colors.pronotum[0]!,
      colors.pronotum[1] ?? colors.pronotum[0]!,
      params.pronotumDensity,
      pronotumLineField, [headPolygon, ...elytraPolygons]);
  } else {
    paintBody(p, ctx, plan.abdomen.shape, plan.abdomen.cx, plan.abdomen.cy, plan.abdomen.w, plan.abdomen.h,
      plan.abdomen.taper, bodyPaint,
      colors.body[0]!, lineW, bodyLineField,
      [headPolygon]);
  }

  // 3. Head — pattern dispatch. `fan` (line mode) and the implicit fill default
  //    match historical behavior; other choices fill with a primitive motif.
  //    Subtract elytra so the head's pattern paint never bleeds into elytra.
  const headBase = colors.head[0]!;
  const headAccent = colors.head[1] ?? colors.head[0]!;
  const headHandled = params.headPattern !== "fan"
    && headPolygon.length >= 3
    && paintHeadPattern(params.headPattern, {
      p, ctx, polygon: headPolygon,
      baseColor: headBase, accentColor: headAccent,
      density: params.headDensity,
      lineWidth: lineW,
      subtractPolygons: elytraPolygons,
    });
  if (!headHandled) {
    if (bodyPaint === "line") {
      paintHeadFan(p, plan.headShape, cx, headCY, plan.headR,
        headBase, hatchStroke, params.headDensity,
        headWidthScale, headHeightScale,
        elytraPolygons);
    } else {
      paintHead(p, ctx, plan.headShape, cx, headCY, plan.headR, bodyPaint,
        headBase, lineW, headWidthScale, headHeightScale, headLineField,
        elytraPolygons);
    }
  }

  // 4. Elytra (TOPMOST surface) — painted last with NO subtraction so it
  //    always covers any pronotum/head silhouette where they overlap.
  if (plan.thorax && plan.name === "beetle") {
    drawBeetleElytra(p, ctx, plan.abdomen.cx, elytraTop, elytraBottom, plan.abdomen.w * elytraWidthScale, plan.abdomen.shape,
      bodyPaint, colors.wing[0]!, colors.wing[0]!, lineW, elytraOpening,
      params.wingRowHeightMin, params.wingRowHeightMax,
      params.elytraPattern,
      colors.wing[0]!,
      colors.wing[1] ?? colors.wing[0]!,
      params.wingDensity,
      wingLineField, []);
  }

  // 3. Antennae — clipped to outside head so roots don't show inside the head fill.
  // Antenna segment width is geometric (not stroke), derived from the body scale.
  const antLen = bL * params.antennaeLength * 0.5;
  const antWeight = Math.max(0.7, bL * 0.0042);
  const antJitter = sampleAntennaJitter(p);
  const attachRX = plan.headR * headWidthScale * (0.45 + antJitter.attachXFrac);
  const attachRY = plan.headR * headHeightScale * (0.6 + antJitter.attachYFrac);
  ctx.save();
  clipOutsideHead();
  for (const side of [1, -1] as const) {
    const startX = cx + side * attachRX;
    const startY = headCY - attachRY;
    drawAntennaMirrored(p, startX, startY, antLen, side, params.antennaeCurvature,
      params.antennaStyle, colors.appendage[0]!, antWeight, antJitter);
  }
  ctx.restore();

  // 4. Legs: draw last, clipped to outside the body so the fat femur root doesn't
  // bleed into the pronotum / elytra fill.
  const legPairs = Math.round(params.legPairs);
  ctx.save();
  clipOutsideBody();
  for (let pair = 0; pair < legPairs; pair++) {
    const t = legPairs === 1 ? 0.5 : pair / (legPairs - 1);
    const legProfile = sampleLegProfile(p, t);
    const isFrontLeg = t < 0.34;
    const isRearLeg = t > 0.66;
    const elytraSpan = elytraBottom - elytraTop;
    const y01ForWidth = (y: number) => (y - elytraTop) / Math.max(1, elytraSpan);
    // Front sits on pronotum; middle on upper elytra; rear well down on the elytra
    // — rear/middle Y bands are non-overlapping so the legs cannot touch each other.
    const baseAttachY = isFrontLeg
      ? pronotumCY + pronotumH * p.random(-0.04, 0.32)
      : isRearLeg
        ? elytraTop + elytraSpan * p.random(0.62, 0.85)
        : elytraTop + elytraSpan * p.random(0.10, 0.30);
    /** Rear: less Y jitter so we do not slide onto the lower elytra where the outline tapers inward and reads as under the body. */
    const attachYJitter = isRearLeg
      ? bL * legProfile.attachYOffset * 0.12
      : bL * legProfile.attachYOffset * 0.24;
    const attachY = baseAttachY + attachYJitter;
    const baseLegLen = params.legLengthMin + (params.legLengthMax - params.legLengthMin) * Math.pow(t, 0.72);
    const legLen = baseLegLen * legProfile.lengthScale * (isRearLeg ? p.random(0.9, 1.0) : p.random(1.06, 1.2));
    const rawAttachX = isFrontLeg
      ? pronotumHalfWidthAt(plan.thorax?.shape ?? "shield", (attachY - (pronotumCY - pronotumH / 2)) / pronotumH, pronotumW)
      : elytraHalfWidthAt(plan.abdomen.shape, y01ForWidth(attachY), plan.abdomen.w * elytraWidthScale * 0.5);
    /** Rear: anchor on the lateral outline (same half-width as drawing), then pad outward so the filled femur clears the elytra. */
    // Leg polygon bulk is decoupled from `lineWidth` (which controls stroke only)
    // and scales with the body so legs read as anatomy, not strokes.
    const legBulk = Math.max(1.4, bW * 0.011);
    const attachX = isRearLeg
      ? rawAttachX * 1.012 +
        Math.max(legBulk * 0.85, lineW * 0.65, rawAttachX * 0.018)
      : rawAttachX;

    for (const side of [1, -1] as const) {
      drawLeg(p, cx + side * attachX, attachY, legLen, t, side, legBulk, colors.appendage[0]!, legProfile);
    }
  }
  ctx.restore();
}
