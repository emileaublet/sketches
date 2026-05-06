import { p5SVG } from "p5.js-svg";
import type { Point } from "../../utils/pathUtils";

/** Patterns that ride on top of (or replace) the base painted color. */
export type ElytraPattern =
  | "stripedRows"        // existing — bundled hatched stripes (kept as default)
  | "solid"              // flat color1
  | "longitudinalStripes"// vertical color2 stripes
  | "transverseBands"    // horizontal color2 bands
  | "vChevrons"          // V-shapes pointing forward; alternating thick/thin
  | "dotsRandom"         // irregular dots (non-overlapping)
  | "dotsGrid"           // regular polka grid
  | "dotsClustered"      // dots concentrated near top/center (non-overlapping)
  | "jaguar"             // concentric ring "targets"
  | "patches"            // a few large irregular patches
  | "marginBand"         // single colored band along the outer edge
  | "centralStripe"      // trapezoidal stripe along the suture
  | "tearDrops"          // vertical teardrop marks
  | "mixed";             // 2 patterns layered (decided once across both wings)

export const ELYTRA_PATTERN_OPTIONS: ElytraPattern[] = [
  "stripedRows",
  "solid",
  "longitudinalStripes",
  "transverseBands",
  "vChevrons",
  "dotsRandom",
  "dotsGrid",
  "dotsClustered",
  "jaguar",
  "patches",
  "marginBand",
  "centralStripe",
  "tearDrops",
  "mixed",
];

/** Subset that fits the smaller pronotum surface. */
export type PronotumPattern =
  | "stripedColumns"     // existing — column hatching (default)
  | "solid"
  | "longitudinalStripes"
  | "transverseBands"
  | "dotsGrid"
  | "dotsRandom"
  | "marginBand"
  | "centralStripe";

export const PRONOTUM_PATTERN_OPTIONS: PronotumPattern[] = [
  "stripedColumns",
  "solid",
  "longitudinalStripes",
  "transverseBands",
  "dotsGrid",
  "dotsRandom",
  "marginBand",
  "centralStripe",
];

export type HeadPattern =
  | "fan"                // existing — radial line fan (default for line mode)
  | "solid"
  | "dots"
  | "stripes";

export const HEAD_PATTERN_OPTIONS: HeadPattern[] = [
  "fan",
  "solid",
  "dots",
  "stripes",
];

// --- helpers -----------------------------------------------------------------

export function polygonBounds(polygon: Point[]): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of polygon) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

export function pointInPolygon(x: number, y: number, polygon: Point[]): boolean {
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

function tracePolygon(ctx: CanvasRenderingContext2D, polygon: Point[]): void {
  if (polygon.length === 0) return;
  ctx.moveTo(polygon[0]!.x, polygon[0]!.y);
  for (let i = 1; i < polygon.length; i++) {
    const pt = polygon[i]!;
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.closePath();
}

/** Fill `polygon` while excluding `subtractPolygons`.
 *
 *  Naïve evenodd-with-multiple-subpaths is XOR, not subtraction — areas OUTSIDE
 *  the main polygon but INSIDE a subtract polygon would still get filled (odd
 *  subpath count). To get true `main \ subs` we first clip strictly to the main
 *  polygon, then within that clipped region do an evenodd fill of `main + subs`
 *  so the sub regions cancel out. */
function fillPolygonWithExclusions(
  ctx: CanvasRenderingContext2D,
  polygon: Point[],
  subtractPolygons: Point[][],
  color: string,
): void {
  if (polygon.length < 3) return;
  ctx.save();
  ctx.beginPath();
  tracePolygon(ctx, polygon);
  ctx.clip();
  ctx.beginPath();
  tracePolygon(ctx, polygon);
  for (const sub of subtractPolygons) {
    if (sub.length >= 3) tracePolygon(ctx, sub);
  }
  ctx.fillStyle = color;
  ctx.fill("evenodd");
  ctx.restore();
}

/** Push ctx state so primitives are clipped to the polygon silhouette MINUS the
 *  subtractPolygons. Caller must `ctx.restore()`. Same trick as
 *  fillPolygonWithExclusions: clip-to-main, then evenodd-clip with subs. */
function clipToPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: Point[],
  subtractPolygons: Point[][] = [],
): void {
  ctx.beginPath();
  tracePolygon(ctx, polygon);
  ctx.clip();
  if (subtractPolygons.some((s) => s.length >= 3)) {
    ctx.beginPath();
    tracePolygon(ctx, polygon);
    for (const sub of subtractPolygons) {
      if (sub.length >= 3) tracePolygon(ctx, sub);
    }
    ctx.clip("evenodd");
  }
}

/** Inset polygon vertices toward its centroid by `inset` pixels. */
export function insetPolygon(polygon: Point[], inset: number): Point[] {
  if (polygon.length < 3) return polygon;
  let cx = 0, cy = 0;
  for (const pt of polygon) { cx += pt.x; cy += pt.y; }
  cx /= polygon.length;
  cy /= polygon.length;
  return polygon.map((pt) => {
    const dx = cx - pt.x;
    const dy = cy - pt.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: pt.x + (dx / d) * inset, y: pt.y + (dy / d) * inset };
  });
}

/** True if a circle of radius `r` at (x,y) overlaps any (cx,cy,cr) in `placed`. */
export function overlapsAny(
  x: number, y: number, r: number,
  placed: Array<{ x: number; y: number; r: number }>,
  pad: number,
): boolean {
  for (const c of placed) {
    const dx = x - c.x;
    const dy = y - c.y;
    if (Math.hypot(dx, dy) < r + c.r + pad) return true;
  }
  return false;
}

// --- pattern primitives ------------------------------------------------------

interface BasePaintArgs {
  p: p5SVG;
  ctx: CanvasRenderingContext2D;
  polygon: Point[];
  baseColor: string;
  accentColor: string;
  /** Single global stroke weight — every stroked pattern primitive uses this. */
  lineWidth: number;
  /** Higher-Z shapes whose overlap should be cut from this paint. */
  subtractPolygons?: Point[][];
}

interface ElytraPaintArgs extends BasePaintArgs {
  /** suture x — patterns mirror across this line. */
  sutureX: number;
  /** which side this elytron is on. */
  side: 1 | -1;
  /** pattern density (0..1). */
  density: number;
}

function fillBase(args: BasePaintArgs): void {
  fillPolygonWithExclusions(args.ctx, args.polygon, args.subtractPolygons ?? [], args.baseColor);
}

function drawSolid(args: BasePaintArgs): void {
  fillBase(args);
}

function drawLongitudinalStripes(args: ElytraPaintArgs): void {
  const { ctx, polygon, accentColor, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const count = Math.max(2, Math.round(2 + density * 4));
  const stripeW = (b.w / (count * 2)) * 0.92;
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  for (let i = 0; i < count; i++) {
    const x = b.x + (b.w / count) * (i + 0.5) - stripeW / 2;
    ctx.fillRect(x, b.y - 2, stripeW, b.h + 4);
  }
  ctx.restore();
}

function drawTransverseBands(args: ElytraPaintArgs): void {
  const { ctx, polygon, accentColor, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const count = Math.max(2, Math.round(2 + density * 4));
  const bandH = (b.h / (count * 2 + 1)) * 1.2;
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  for (let i = 0; i < count; i++) {
    const y = b.y + (b.h / count) * (i + 0.5) - bandH / 2;
    ctx.fillRect(b.x - 2, y, b.w + 4, bandH);
  }
  ctx.restore();
}

function drawVChevrons(args: ElytraPaintArgs): void {
  const { p, ctx, polygon, baseColor, accentColor, density, subtractPolygons = [] } = args;
  // Don't fillBase — the chevrons themselves form the alternating bands.
  const b = polygonBounds(polygon);
  const rows = Math.max(2, Math.round(3 + density * 4));
  const rowH = b.h / rows;
  // Both V's are thick and equal — bandW fills the row so adjacent V's touch
  // and the pattern reads as alternating thick bands of base/accent.
  const bandW = rowH * 1.05;
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;
  ctx.lineWidth = bandW;
  // Extra rows above/below so the clipped polygon is fully covered at edges.
  for (let i = -2; i < rows + 2; i++) {
    const y = b.y + i * rowH + p.random(-rowH * 0.04, rowH * 0.04);
    const tipDrop = rowH * (0.5 + p.random(-0.08, 0.08));
    ctx.strokeStyle = i % 2 === 0 ? accentColor : baseColor;
    ctx.beginPath();
    ctx.moveTo(b.x - 4, y);
    ctx.lineTo(b.x + b.w / 2, y + tipDrop);
    ctx.lineTo(b.x + b.w + 4, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDotsRandom(args: ElytraPaintArgs): void {
  const { p, ctx, polygon, accentColor, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const target = Math.round(6 + density * 34);
  const baseR = Math.min(b.w, b.h) * (0.045 + density * 0.02);
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  const placed: Array<{ x: number; y: number; r: number }> = [];
  let safety = 0;
  while (placed.length < target && safety < target * 30) {
    safety++;
    const r = baseR * p.random(0.7, 1.3);
    const x = b.x + p.random(b.w);
    const y = b.y + p.random(b.h);
    if (!pointInPolygon(x, y, polygon)) continue;
    if (overlapsAny(x, y, r, placed, baseR * 0.25)) continue;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    placed.push({ x, y, r });
  }
  ctx.restore();
}

function drawDotsGrid(args: ElytraPaintArgs): void {
  const { p, ctx, polygon, accentColor, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const cols = Math.max(2, Math.round(2 + density * 5));
  const colSpacing = b.w / cols;
  const rowSpacing = colSpacing * 1.05;
  const rows = Math.max(2, Math.round(b.h / rowSpacing));
  // Cap dot radius so neighboring dots can never touch (max half spacing).
  const dotR = Math.min(colSpacing, rowSpacing) * 0.32;
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  for (let r = -1; r < rows + 1; r++) {
    for (let c = -1; c < cols + 1; c++) {
      const offset = r % 2 === 0 ? 0 : colSpacing * 0.5;
      const x = b.x + c * colSpacing + offset + colSpacing * 0.5;
      const y = b.y + r * rowSpacing + rowSpacing * 0.5;
      ctx.beginPath();
      // Tight jitter (~6%) keeps the grid feel without producing overlap.
      ctx.arc(x, y, dotR * p.random(0.94, 1.06), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawDotsClustered(args: ElytraPaintArgs): void {
  const { p, ctx, polygon, accentColor, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const target = Math.round(20 + density * 60);
  const baseR = Math.min(b.w, b.h) * (0.025 + density * 0.018);
  // Cluster center near top-inner area (suture side).
  const ccx = args.side > 0 ? b.x + b.w * 0.32 : b.x + b.w * 0.68;
  const ccy = b.y + b.h * 0.32;
  const clusterR = Math.min(b.w, b.h) * 0.7;
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  const placed: Array<{ x: number; y: number; r: number }> = [];
  let safety = 0;
  while (placed.length < target && safety < target * 40) {
    safety++;
    const r = baseR * p.random(0.6, 1.4);
    const a = p.random(Math.PI * 2);
    const dist = clusterR * Math.sqrt(p.random()) * p.random(0.4, 1.0);
    const x = ccx + Math.cos(a) * dist;
    const y = ccy + Math.sin(a) * dist;
    if (!pointInPolygon(x, y, polygon)) continue;
    if (overlapsAny(x, y, r, placed, baseR * 0.2)) continue;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    placed.push({ x, y, r });
  }
  ctx.restore();
}

function drawJaguar(args: ElytraPaintArgs): void {
  // Big irregular patches, each surrounded by ONE matching ring offset outward —
  // like jaguar/leopard rosettes. Patches are blobby polygons (not circles) and
  // never overlap each other.
  const { p, ctx, polygon, accentColor, density, lineWidth, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const target = Math.max(2, Math.round(3 + density * 4));
  const baseR = Math.min(b.w, b.h) * (0.18 + density * 0.08);
  const ringGap = baseR * 0.18;
  const ringW = Math.max(1.2, lineWidth * 3);
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  const placed: Array<{ x: number; y: number; r: number }> = [];
  let safety = 0;
  while (placed.length < target && safety < target * 50) {
    safety++;
    // Random size — patches vary a lot.
    const r = baseR * p.random(0.7, 1.5);
    const x = b.x + p.random(r, b.w - r);
    const y = b.y + p.random(r, b.h - r);
    if (!pointInPolygon(x, y, polygon)) continue;
    // Reserve enough space for the ring too.
    if (overlapsAny(x, y, r + ringGap + ringW * 0.5, placed, baseR * 0.15)) continue;
    placed.push({ x, y, r: r + ringGap + ringW * 0.5 });

    // Build an irregular blob polygon (random radii per vertex).
    const sides = Math.round(p.random(8, 13));
    const baseAng = p.random(Math.PI * 2);
    const radii: number[] = [];
    const vertX: number[] = [];
    const vertY: number[] = [];
    for (let i = 0; i < sides; i++) {
      const rr = r * p.random(0.7, 1.25);
      radii.push(rr);
      const a = baseAng + (i / sides) * Math.PI * 2 + p.random(-0.18, 0.18);
      vertX.push(x + Math.cos(a) * rr);
      vertY.push(y + Math.sin(a) * rr);
    }

    // Solid filled patch.
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      if (i === 0) ctx.moveTo(vertX[i]!, vertY[i]!);
      else ctx.lineTo(vertX[i]!, vertY[i]!);
    }
    ctx.closePath();
    ctx.fill();

    // Single ring offset outward — same blob shape scaled up by `(r + gap) / r`.
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = ringW;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const rr = radii[i]!;
      const scale = (rr + ringGap + ringW * 0.5) / rr;
      const px = x + (vertX[i]! - x) * scale;
      const py = y + (vertY[i]! - y) * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawPatches(args: ElytraPaintArgs): void {
  // Big irregular patches — fewer in count, much larger, more random in shape.
  const { p, ctx, polygon, accentColor, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const target = Math.max(2, Math.round(2 + density * 2));
  const baseR = Math.min(b.w, b.h) * (0.32 + density * 0.18);
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  const placed: Array<{ x: number; y: number; r: number }> = [];
  let safety = 0;
  while (placed.length < target && safety < target * 40) {
    safety++;
    const r = baseR * p.random(0.65, 1.4);
    const x = b.x + p.random(b.w * 0.18, b.w * 0.82);
    const y = b.y + p.random(b.h * 0.15, b.h * 0.85);
    if (!pointInPolygon(x, y, polygon)) continue;
    if (overlapsAny(x, y, r * 0.55, placed, baseR * 0.05)) continue;
    placed.push({ x, y, r });
    // Irregular blob: random radii per vertex, random vertex count, random base rotation.
    const sides = Math.round(p.random(7, 13));
    const baseAng = p.random(Math.PI * 2);
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = baseAng + (i / sides) * Math.PI * 2 + p.random(-0.18, 0.18);
      const rr = r * p.random(0.55, 1.4);
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMarginBand(args: ElytraPaintArgs): void {
  const { ctx, polygon, baseColor, accentColor, density, subtractPolygons = [] } = args;
  // Outer ring is accent — fills the polygon minus higher-Z shapes.
  fillPolygonWithExclusions(ctx, polygon, subtractPolygons, accentColor);
  const inset = Math.min(polygonBounds(polygon).w, polygonBounds(polygon).h) * (0.12 + density * 0.18);
  const inner = insetPolygon(polygon, inset);
  fillPolygonWithExclusions(ctx, inner, subtractPolygons, baseColor);
}

function drawCentralStripe(args: ElytraPaintArgs): void {
  // Trapezoidal stripe along the suture — top and bottom widths differ so it
  // tapers (or fans) toward one end.
  const { p, ctx, polygon, accentColor, sutureX, side, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const baseW = b.w * (0.18 + density * 0.18);
  // Random taper ratio in [0.45, 1.55] picks a clear narrowing or widening.
  const taper = p.random([p.random(0.45, 0.7), p.random(1.4, 1.8)]);
  const topW = baseW;
  const botW = baseW * taper;
  // Stripe sits along the suture (inner edge of the elytron).
  const innerEdge = sutureX;          // inner (suture) edge
  const dir = side > 0 ? 1 : -1;
  const topX0 = innerEdge;
  const topX1 = innerEdge + dir * topW;
  const botX0 = innerEdge;
  const botX1 = innerEdge + dir * botW;
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(topX0, b.y - 2);
  ctx.lineTo(topX1, b.y - 2);
  ctx.lineTo(botX1, b.y + b.h + 2);
  ctx.lineTo(botX0, b.y + b.h + 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTearDrops(args: ElytraPaintArgs): void {
  const { p, ctx, polygon, accentColor, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const cols = Math.max(2, Math.round(1 + density * 3));
  const rows = Math.max(2, Math.round(2 + density * 3));
  const colSpacing = b.w / cols;
  const rowSpacing = b.h / rows;
  const dropH = rowSpacing * 0.6;
  const dropW = Math.min(colSpacing * 0.45, dropH * 0.55);
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = b.x + colSpacing * (c + 0.5) + p.random(-colSpacing * 0.08, colSpacing * 0.08);
      const y = b.y + rowSpacing * (r + 0.3) + p.random(-rowSpacing * 0.04, rowSpacing * 0.04);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + dropW, y + dropH * 0.3, x + dropW, y + dropH * 0.85, x, y + dropH);
      ctx.bezierCurveTo(x - dropW, y + dropH * 0.85, x - dropW, y + dropH * 0.3, x, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

const ELYTRA_PAINTERS: Record<Exclude<ElytraPattern, "stripedRows" | "mixed">, (args: ElytraPaintArgs) => void> = {
  solid: drawSolid,
  longitudinalStripes: drawLongitudinalStripes,
  transverseBands: drawTransverseBands,
  vChevrons: drawVChevrons,
  dotsRandom: drawDotsRandom,
  dotsGrid: drawDotsGrid,
  dotsClustered: drawDotsClustered,
  jaguar: drawJaguar,
  patches: drawPatches,
  marginBand: drawMarginBand,
  centralStripe: drawCentralStripe,
  tearDrops: drawTearDrops,
};

/** Patterns suitable as the "second layer" over an existing fill in `mixed`.
 *  All draw transparent over the existing base, never re-fill. */
const OVERLAY_PATTERNS: Array<Exclude<ElytraPattern, "stripedRows" | "mixed" | "solid">> = [
  "dotsRandom", "dotsGrid", "vChevrons", "tearDrops", "centralStripe", "jaguar",
];

const MIXABLE_BASE_PATTERNS: Array<Exclude<ElytraPattern, "stripedRows" | "mixed" | "solid">> = [
  "longitudinalStripes",
  "transverseBands",
  "vChevrons",
  "dotsRandom",
  "dotsGrid",
  "dotsClustered",
  "marginBand",
  "centralStripe",
  "tearDrops",
  "patches",
];

export interface MixedPatternChoice {
  base: Exclude<ElytraPattern, "stripedRows" | "mixed" | "solid">;
  overlay: Exclude<ElytraPattern, "stripedRows" | "mixed" | "solid">;
}

/** Decide ONCE which two patterns make up a `mixed` elytra. The same choice is
 *  then applied to both wings so left and right match. */
export function pickMixedPattern(p: p5SVG): MixedPatternChoice {
  const baseIdx = Math.floor(p.random(MIXABLE_BASE_PATTERNS.length));
  let overlayIdx = Math.floor(p.random(OVERLAY_PATTERNS.length));
  // Avoid base==overlay degenerate case.
  if (OVERLAY_PATTERNS[overlayIdx] === MIXABLE_BASE_PATTERNS[baseIdx]) {
    overlayIdx = (overlayIdx + 1) % OVERLAY_PATTERNS.length;
  }
  return {
    base: MIXABLE_BASE_PATTERNS[baseIdx]!,
    overlay: OVERLAY_PATTERNS[overlayIdx]!,
  };
}

/** Dispatch for elytra patterns. Returns true if it handled it; false means the
 *  caller should fall back to the legacy striped-rows render path. */
export function paintElytraPattern(
  pattern: ElytraPattern,
  args: ElytraPaintArgs,
  /** When `pattern === "mixed"`, the caller passes the two layers it pre-chose
   *  (so left/right wings stay in sync). */
  mixedChoice?: MixedPatternChoice,
): boolean {
  if (pattern === "stripedRows") return false;
  if (pattern === "mixed") {
    const choice = mixedChoice ?? pickMixedPattern(args.p);
    ELYTRA_PAINTERS[choice.base]({ ...args, density: args.density * 0.85 });
    paintOverlayOnly(choice.overlay, { ...args, density: args.density * 0.7 });
    return true;
  }
  const fn = ELYTRA_PAINTERS[pattern];
  if (!fn) return false;
  fn(args);
  return true;
}

/** Same as the named painters but skips the initial baseColor fill — used for
 *  layering a second pattern over a first. */
function paintOverlayOnly(
  pattern: Exclude<ElytraPattern, "stripedRows" | "mixed" | "solid">,
  args: ElytraPaintArgs,
): void {
  const { p, ctx, polygon, accentColor, density, subtractPolygons = [], lineWidth } = args;
  const b = polygonBounds(polygon);
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  ctx.strokeStyle = accentColor;
  switch (pattern) {
    case "dotsRandom": {
      const target = Math.round(6 + density * 34);
      const baseR = Math.min(b.w, b.h) * (0.045 + density * 0.02);
      const placed: Array<{ x: number; y: number; r: number }> = [];
      let safety = 0;
      while (placed.length < target && safety < target * 30) {
        safety++;
        const r = baseR * p.random(0.7, 1.3);
        const x = b.x + p.random(b.w);
        const y = b.y + p.random(b.h);
        if (!pointInPolygon(x, y, polygon)) continue;
        if (overlapsAny(x, y, r, placed, baseR * 0.25)) continue;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        placed.push({ x, y, r });
      }
      break;
    }
    case "dotsGrid": {
      const cols = Math.max(2, Math.round(2 + density * 5));
      const colSpacing = b.w / cols;
      const rowSpacing = colSpacing * 1.05;
      const rows = Math.max(2, Math.round(b.h / rowSpacing));
      const dotR = Math.min(colSpacing, rowSpacing) * 0.32;
      for (let r = -1; r < rows + 1; r++) {
        for (let c = -1; c < cols + 1; c++) {
          const offset = r % 2 === 0 ? 0 : colSpacing * 0.5;
          const x = b.x + c * colSpacing + offset + colSpacing * 0.5;
          const y = b.y + r * rowSpacing + rowSpacing * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "dotsClustered": {
      const target = Math.round(20 + density * 60);
      const baseR = Math.min(b.w, b.h) * (0.025 + density * 0.018);
      const ccx = args.side > 0 ? b.x + b.w * 0.32 : b.x + b.w * 0.68;
      const ccy = b.y + b.h * 0.32;
      const clusterR = Math.min(b.w, b.h) * 0.7;
      const placed: Array<{ x: number; y: number; r: number }> = [];
      let safety = 0;
      while (placed.length < target && safety < target * 40) {
        safety++;
        const r = baseR * p.random(0.6, 1.4);
        const a = p.random(Math.PI * 2);
        const dist = clusterR * Math.sqrt(p.random()) * p.random(0.4, 1.0);
        const x = ccx + Math.cos(a) * dist;
        const y = ccy + Math.sin(a) * dist;
        if (!pointInPolygon(x, y, polygon)) continue;
        if (overlapsAny(x, y, r, placed, baseR * 0.2)) continue;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        placed.push({ x, y, r });
      }
      break;
    }
    case "vChevrons": {
      const rows = Math.max(2, Math.round(3 + density * 4));
      const rowH = b.h / rows;
      const lw = Math.max(0.4, lineWidth);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = -1; i < rows + 1; i++) {
        const y = b.y + i * rowH;
        ctx.lineWidth = i % 2 === 0 ? lw * 5.5 : lw * 2.2;
        ctx.beginPath();
        ctx.moveTo(b.x - 2, y);
        ctx.lineTo(b.x + b.w / 2, y + rowH * 0.5);
        ctx.lineTo(b.x + b.w + 2, y);
        ctx.stroke();
      }
      break;
    }
    case "tearDrops": {
      const cols = Math.max(2, Math.round(1 + density * 3));
      const rows = Math.max(2, Math.round(2 + density * 3));
      const colSpacing = b.w / cols;
      const rowSpacing = b.h / rows;
      const dropH = rowSpacing * 0.6;
      const dropW = Math.min(colSpacing * 0.45, dropH * 0.55);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = b.x + colSpacing * (c + 0.5);
          const y = b.y + rowSpacing * (r + 0.3);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + dropW, y + dropH * 0.3, x + dropW, y + dropH * 0.85, x, y + dropH);
          ctx.bezierCurveTo(x - dropW, y + dropH * 0.85, x - dropW, y + dropH * 0.3, x, y);
          ctx.closePath();
          ctx.fill();
        }
      }
      break;
    }
    case "centralStripe": {
      const baseW = b.w * (0.18 + density * 0.18);
      const taper = p.random([p.random(0.45, 0.7), p.random(1.4, 1.8)]);
      const topW = baseW;
      const botW = baseW * taper;
      const innerEdge = args.sutureX;
      const dir = args.side > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(innerEdge, b.y - 2);
      ctx.lineTo(innerEdge + dir * topW, b.y - 2);
      ctx.lineTo(innerEdge + dir * botW, b.y + b.h + 2);
      ctx.lineTo(innerEdge, b.y + b.h + 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "jaguar": {
      const target = Math.max(2, Math.round(3 + density * 4));
      const baseR = Math.min(b.w, b.h) * (0.18 + density * 0.08);
      const ringGap = baseR * 0.18;
      const ringW = Math.max(1.2, lineWidth * 3);
      const placed: Array<{ x: number; y: number; r: number }> = [];
      let safety = 0;
      while (placed.length < target && safety < target * 50) {
        safety++;
        const r = baseR * p.random(0.7, 1.5);
        const x = b.x + p.random(r, b.w - r);
        const y = b.y + p.random(r, b.h - r);
        if (!pointInPolygon(x, y, polygon)) continue;
        if (overlapsAny(x, y, r + ringGap + ringW * 0.5, placed, baseR * 0.15)) continue;
        placed.push({ x, y, r: r + ringGap + ringW * 0.5 });
        const sides = Math.round(p.random(8, 13));
        const baseAng = p.random(Math.PI * 2);
        const radii: number[] = [];
        const vertX: number[] = [];
        const vertY: number[] = [];
        for (let i = 0; i < sides; i++) {
          const rr = r * p.random(0.7, 1.25);
          radii.push(rr);
          const a = baseAng + (i / sides) * Math.PI * 2 + p.random(-0.18, 0.18);
          vertX.push(x + Math.cos(a) * rr);
          vertY.push(y + Math.sin(a) * rr);
        }
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          if (i === 0) ctx.moveTo(vertX[i]!, vertY[i]!);
          else ctx.lineTo(vertX[i]!, vertY[i]!);
        }
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = ringW;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const rr = radii[i]!;
          const scale = (rr + ringGap + ringW * 0.5) / rr;
          const px = x + (vertX[i]! - x) * scale;
          const py = y + (vertY[i]! - y) * scale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// --- pronotum -----------------------------------------------------------------

interface PronotumPaintArgs extends BasePaintArgs {
  density: number;
}

export function paintPronotumPattern(
  pattern: PronotumPattern,
  args: PronotumPaintArgs,
): boolean {
  if (pattern === "stripedColumns") return false;
  // For the pronotum, central stripe should be CENTERED on the pronotum bounding
  // box (no left/right elytra — it's a single shape).
  const b = polygonBounds(args.polygon);
  const elytraArgs: ElytraPaintArgs = {
    ...args,
    sutureX: b.x + b.w / 2,
    side: 1,
  };
  switch (pattern) {
    case "solid": drawSolid(args); return true;
    case "longitudinalStripes": drawLongitudinalStripes(elytraArgs); return true;
    case "transverseBands": drawTransverseBands(elytraArgs); return true;
    case "dotsGrid": drawDotsGrid(elytraArgs); return true;
    case "dotsRandom": drawDotsRandom(elytraArgs); return true;
    case "marginBand": drawMarginBand(elytraArgs); return true;
    case "centralStripe":
      // Pronotum-specific: centered trapezoid along the vertical centerline.
      drawPronotumCentralStripe(elytraArgs);
      return true;
  }
  return false;
}

function drawPronotumCentralStripe(args: ElytraPaintArgs): void {
  const { p, ctx, polygon, accentColor, density, subtractPolygons = [] } = args;
  fillBase(args);
  const b = polygonBounds(polygon);
  const cx = b.x + b.w / 2;
  const baseW = b.w * (0.22 + density * 0.22);
  const taper = p.random([p.random(0.45, 0.7), p.random(1.4, 1.8)]);
  const topW = baseW;
  const botW = baseW * taper;
  ctx.save();
  clipToPolygon(ctx, polygon, subtractPolygons);
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, b.y - 2);
  ctx.lineTo(cx + topW / 2, b.y - 2);
  ctx.lineTo(cx + botW / 2, b.y + b.h + 2);
  ctx.lineTo(cx - botW / 2, b.y + b.h + 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// --- head --------------------------------------------------------------------

interface HeadPaintArgs extends BasePaintArgs {
  density: number;
}

export function paintHeadPattern(
  pattern: HeadPattern,
  args: HeadPaintArgs,
): boolean {
  if (pattern === "fan") return false;
  const b = polygonBounds(args.polygon);
  const elytraArgs: ElytraPaintArgs = {
    ...args,
    sutureX: b.x + b.w / 2,
    side: 1,
  };
  switch (pattern) {
    case "solid": drawSolid(args); return true;
    case "dots": drawDotsGrid(elytraArgs); return true;
    case "stripes": drawLongitudinalStripes(elytraArgs); return true;
  }
  return false;
}
