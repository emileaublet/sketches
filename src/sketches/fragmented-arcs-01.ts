import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  cellSize: number;
  lineSpacingMin: number;
  lineSpacingMax: number;
  lineThickness: number;
  fillProbability: number;
  hatchProbability: number;
  arcLayersMin: number;
  arcLayersMax: number;
  colorPasses: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "fragmented-arcs-01",
  title: "Fragmented Arcs 01",
  description: "Grid of arc segments with hatching, forming implied curves",
  thumbnail: "/fragmented-arcs-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  cellSize: 40,
  lineSpacingMin: 2,
  lineSpacingMax: 3.5,
  lineThickness: 0.4,
  fillProbability: 0.85,
  hatchProbability: 0.4,
  arcLayersMin: 2,
  arcLayersMax: 4,
  colorPasses: 3,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  cellSize: { min: 15, max: 100, step: 5 },
  lineSpacingMin: { min: 0.5, max: 8, step: 0.25 },
  lineSpacingMax: { min: 0.5, max: 8, step: 0.25 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  fillProbability: { min: 0, max: 1, step: 0.05 },
  hatchProbability: { min: 0, max: 1, step: 0.05 },
  arcLayersMin: { min: 2, max: 6, step: 2 },
  arcLayersMax: { min: 2, max: 6, step: 2 },
  colorPasses: { min: 1, max: 5, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

// Corner definitions: [cornerIndex] => { cx offset, cy offset, startAngle, endAngle }
// Arc center sits at the corner; arc sweeps into the cell interior
const CORNER_CONFIG = [
  { dx: 0, dy: 0, start: 0, end: Math.PI / 2 }, // TL corner -> arc sweeps toward BR
  { dx: 1, dy: 0, start: Math.PI / 2, end: Math.PI }, // TR corner -> arc sweeps toward BL
  { dx: 1, dy: 1, start: Math.PI, end: (3 * Math.PI) / 2 }, // BR corner -> arc sweeps toward TL
  { dx: 0, dy: 1, start: (3 * Math.PI) / 2, end: 2 * Math.PI }, // BL corner -> arc sweeps toward TR
];

/** Normalize atan2 to [0, 2π) */
function atan2_0_2pi(dy: number, dx: number): number {
  let a = Math.atan2(dy, dx);
  if (a < 0) a += 2 * Math.PI;
  return a;
}

/** Point in annular sector: r0 <= r <= r1, angle in [a0, a1] (r0 may be 0 for pie slice) */
function pointInAnnularSector(
  x: number,
  y: number,
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number
): boolean {
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.hypot(dx, dy);
  if (r > r1 + 1e-6) return false;
  if (r0 > 1e-6) {
    if (r < r0 - 1e-6) return false;
  } else if (r < 1e-9) {
    return true;
  }
  const ang = atan2_0_2pi(dy, dx);
  const eps = 1e-6;
  if (a1 >= 2 * Math.PI - eps) {
    return ang >= a0 - eps || ang <= eps;
  }
  return ang >= a0 - eps && ang <= a1 + eps;
}

/** Intersection parameters t in [0,1] where segment A→B meets circle |P-C|=r */
function segmentCircleTs(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  r: number
): number[] {
  const vx = bx - ax;
  const vy = by - ay;
  const ux = ax - cx;
  const uy = ay - cy;
  const a = vx * vx + vy * vy;
  if (a < 1e-18) return [];
  const b = 2 * (ux * vx + uy * vy);
  const c = ux * ux + uy * uy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < -1e-9) return [];
  const s = Math.sqrt(Math.max(0, disc));
  const out: number[] = [];
  for (const t of [(-b - s) / (2 * a), (-b + s) / (2 * a)]) {
    if (t >= -1e-9 && t <= 1 + 1e-9) {
      out.push(Math.max(0, Math.min(1, t)));
    }
  }
  return out;
}

/** t in [0,1] where segment A→B meets ray from C at angle (if on ray with s>=0) */
function segmentRayT(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  ang: number
): number | null {
  const vx = bx - ax;
  const vy = by - ay;
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const crossVU = vx * uy - vy * ux;
  if (Math.abs(crossVU) < 1e-12) return null;
  const wx = cx - ax;
  const wy = cy - ay;
  const crossWU = wx * uy - wy * ux;
  const t = crossWU / crossVU;
  const s = (wx * vy - wy * vx) / crossVU;
  if (t < -1e-9 || t > 1 + 1e-9 || s < -1e-9) return null;
  return Math.max(0, Math.min(1, t));
}

/** Return subsegments of A→B that lie inside the annular sector (no masking). */
function clipHatchSegmentToAnnularSector(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const vx = bx - ax;
  const vy = by - ay;
  if (Math.hypot(vx, vy) < 1e-12) return [];

  const ts = new Set<number>([0, 1]);
  for (const r of r0 > 1e-6 ? [r0, r1] : [r1]) {
    for (const t of segmentCircleTs(ax, ay, bx, by, cx, cy, r)) {
      ts.add(t);
    }
  }
  for (const ang of [a0, a1]) {
    const t = segmentRayT(ax, ay, bx, by, cx, cy, ang);
    if (t !== null) ts.add(t);
  }

  const sorted = Array.from(ts).sort((a, b) => a - b);
  const dedup: number[] = [];
  for (const t of sorted) {
    if (
      dedup.length === 0 ||
      Math.abs(t - dedup[dedup.length - 1]) > 1e-7
    ) {
      dedup.push(t);
    }
  }

  const out: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 0; i < dedup.length - 1; i++) {
    const t0 = dedup[i];
    const t1 = dedup[i + 1];
    const tm = (t0 + t1) / 2;
    const mx = ax + tm * vx;
    const my = ay + tm * vy;
    if (pointInAnnularSector(mx, my, cx, cy, r0, r1, a0, a1)) {
      out.push({
        x1: ax + t0 * vx,
        y1: ay + t0 * vy,
        x2: ax + t1 * vx,
        y2: ay + t1 * vy,
      });
    }
  }
  return out;
}

const fragmentedArcs01 =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      if (seed !== null) {
        p.randomSeed(seed);
        p.noiseSeed(seed);
      }

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const cellSize = vars.cellSize ?? constants.cellSize;
      const lineSpacingMin = vars.lineSpacingMin ?? constants.lineSpacingMin;
      const lineSpacingMax = vars.lineSpacingMax ?? constants.lineSpacingMax;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const fillProbability = vars.fillProbability ?? constants.fillProbability;
      const hatchProbability = vars.hatchProbability ?? constants.hatchProbability;
      const arcLayersMin = vars.arcLayersMin ?? constants.arcLayersMin;
      const arcLayersMax = vars.arcLayersMax ?? constants.arcLayersMax;
      const colorPasses = Math.round(vars.colorPasses ?? constants.colorPasses);

      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("staedtlerPens");

      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const cols = Math.floor(drawW / cellSize);
      const rows = Math.floor(drawH / cellSize);

      // Center the grid within the margins
      const offsetX = marginX + (drawW - cols * cellSize) / 2;
      const offsetY = marginY + (drawH - rows * cellSize) / 2;

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      // Clip to margin area
      ctx.save();
      ctx.beginPath();
      ctx.rect(marginX, marginY, drawW, drawH);
      ctx.clip();

      p.blendMode(p.MULTIPLY);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (p.random() > fillProbability) continue;

          const cellX = offsetX + col * cellSize;
          const cellY = offsetY + row * cellSize;
          const cornerIdx = Math.floor(p.random(4));
          const corner = CORNER_CONFIG[cornerIdx];
          const arcCX = cellX + corner.dx * cellSize;
          const arcCY = cellY + corner.dy * cellSize;
          for (let cp = 0; cp < colorPasses; cp++) {
            const cellColor = colors[Math.floor(p.random(colors.length))];
            const passLineSpacing = p.random(lineSpacingMin, lineSpacingMax);

            let cellArcLayers = Math.floor(p.random(arcLayersMin, arcLayersMax + 1));
            if (cellArcLayers % 2 !== 0) {
              cellArcLayers = cellArcLayers === arcLayersMax ? cellArcLayers - 1 : cellArcLayers + 1;
            }

            for (let layer = 0; layer < cellArcLayers; layer++) {
              const radius = (cellSize * (layer + 1)) / cellArcLayers;

              p.strokeWeight(lineThickness);
              setStroke(cellColor, p);

              if (p.random() < hatchProbability) {
                const hatchAngle = p.random(Math.PI);
                const cosA = Math.cos(hatchAngle);
                const sinA = Math.sin(hatchAngle);
                const extent = radius + lineSpacingMax;

                let d = -extent;
                while (d < extent) {
                  const lx = arcCX + d * cosA;
                  const ly = arcCY + d * sinA;
                  const segs = clipHatchSegmentToAnnularSector(
                    lx - sinA * extent, ly + cosA * extent,
                    lx + sinA * extent, ly - cosA * extent,
                    arcCX, arcCY,
                    0, radius,
                    corner.start, corner.end
                  );
                  for (const seg of segs) {
                    p.line(seg.x1, seg.y1, seg.x2, seg.y2);
                  }
                  d += passLineSpacing;
                }
              }
            }
          }
        }
      }

      // Restore the margin clip
      ctx.restore();
    };
  };

export default fragmentedArcs01;
