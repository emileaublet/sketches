import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  seedCount: number;
  cellSize: number;
  lineSpacingMin: number;
  lineSpacingMax: number;
  lineThickness: number;
  noiseScale: number;
  angleJitter: number;
  perpJitter: number;
  offsetJitter: number;
  blobRoughness: number;
  blobNoiseScale: number;
  clusterBias: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "voronoi-01",
  title: "Voronoi 01",
  description: "Voronoi cells filled with directional hatching",
  thumbnail: "/voronoi-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  seedCount: 60,
  cellSize: 6,
  lineSpacingMin: 1.5,
  lineSpacingMax: 3.5,
  lineThickness: 0.4,
  noiseScale: 0.005,
  angleJitter: 0.15,
  perpJitter: 0.3,
  offsetJitter: 1.0,
  blobRoughness: 0.3,
  blobNoiseScale: 1.5,
  clusterBias: 0.6,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  seedCount: { min: 10, max: 200, step: 5 },
  cellSize: { min: 3, max: 20, step: 1 },
  lineSpacingMin: { min: 0.5, max: 6, step: 0.25 },
  lineSpacingMax: { min: 1, max: 8, step: 0.25 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  noiseScale: { min: 0.001, max: 0.02, step: 0.001 },
  angleJitter: { min: 0, max: 0.5, step: 0.01 },
  perpJitter: { min: 0, max: 2, step: 0.05 },
  offsetJitter: { min: 0, max: 4, step: 0.1 },
  blobRoughness: { min: 0, max: 0.6, step: 0.05 },
  blobNoiseScale: { min: 0.5, max: 4, step: 0.1 },
  clusterBias: { min: 0, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const voronoi01 =
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

      if (seed !== null) p.noiseSeed(seed);

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      const seedCount = Math.round(vars.seedCount ?? constants.seedCount);
      const cellSize = vars.cellSize ?? constants.cellSize;
      const lineSpacingMin = vars.lineSpacingMin ?? constants.lineSpacingMin;
      const lineSpacingMax = vars.lineSpacingMax ?? constants.lineSpacingMax;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const angleJitter = vars.angleJitter ?? constants.angleJitter;
      const perpJitter = vars.perpJitter ?? constants.perpJitter;
      const offsetJitter = vars.offsetJitter ?? constants.offsetJitter;
      const blobRoughness = vars.blobRoughness ?? constants.blobRoughness;
      const blobNoiseScale = vars.blobNoiseScale ?? constants.blobNoiseScale;
      const clusterBias = vars.clusterBias ?? constants.clusterBias;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");
      const debug = vars.debug ?? constants.debug;

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      p.strokeWeight(lineThickness);
      p.strokeCap(p.ROUND);

      // ── 0. Outer boundary (deformed polygon, not too round) ────
      const clipCx = marginX + drawW / 2;
      const clipCy = marginY + drawH / 2;
      const clipHalfW = drawW / 2;
      const clipHalfH = drawH / 2;
      const noiseOffClip = p.random(1000);
      const clipPts = 80;

      // Superellipse (exponent ~3 = rounded rectangle) with noise deformation
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= clipPts; i++) {
        const a = (i / clipPts) * Math.PI * 2;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const exp = 3;
        const superR = Math.pow(
          Math.pow(Math.abs(cosA), exp) + Math.pow(Math.abs(sinA), exp),
          -1 / exp,
        );
        const noiseFactor =
          1 +
          (p.noise(noiseOffClip + Math.cos(a) * blobNoiseScale, noiseOffClip + Math.sin(a) * blobNoiseScale) - 0.5) *
            2 *
            blobRoughness;
        const px = clipCx + cosA * clipHalfW * superR * noiseFactor;
        const py = clipCy + sinA * clipHalfH * superR * noiseFactor;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      // ── 1. Scatter seed points (clustered for variable patch sizes) ──
      const seeds: { x: number; y: number }[] = [];
      // Place cluster centers first
      const numClusters = Math.max(3, Math.floor(seedCount / 8));
      const clusterCenters: { x: number; y: number }[] = [];
      for (let i = 0; i < numClusters; i++) {
        clusterCenters.push({
          x: marginX + p.random(drawW),
          y: marginY + p.random(drawH),
        });
      }
      for (let i = 0; i < seedCount; i++) {
        if (p.random() < clusterBias && clusterCenters.length > 0) {
          // Place near a random cluster center
          const cc = clusterCenters[Math.floor(p.random(clusterCenters.length))];
          const spread = p.random(20, 80);
          const a = p.random(Math.PI * 2);
          seeds.push({
            x: Math.max(marginX, Math.min(marginX + drawW, cc.x + Math.cos(a) * spread)),
            y: Math.max(marginY, Math.min(marginY + drawH, cc.y + Math.sin(a) * spread)),
          });
        } else {
          seeds.push({
            x: marginX + p.random(drawW),
            y: marginY + p.random(drawH),
          });
        }
      }

      // ── 2. Assign each seed a color and hatch angle via noise ──
      const noiseOffAngle = p.random(10000);
      const noiseOffColor = p.random(10000);

      const seedAngles: number[] = seeds.map(
        (s) =>
          p.noise(noiseOffAngle + s.x * noiseScale, noiseOffAngle + s.y * noiseScale) *
          Math.PI
      );
      const seedColorIdx: number[] = seeds.map((s) =>
        Math.floor(
          p.noise(noiseOffColor + s.x * noiseScale * 2, noiseOffColor + s.y * noiseScale * 2) *
            colors.length
        ) % colors.length
      );

      // ── 3. Build grid and assign each cell to nearest seed ──────
      const cols = Math.ceil(drawW / cellSize);
      const rows = Math.ceil(drawH / cellSize);

      const cellOwner: number[] = new Array(cols * rows);

      for (let row = 0; row < rows; row++) {
        const cy = marginY + (row + 0.5) * cellSize;
        for (let col = 0; col < cols; col++) {
          const cx = marginX + (col + 0.5) * cellSize;
          let minDist = Infinity;
          let nearest = 0;
          for (let si = 0; si < seeds.length; si++) {
            const dx = cx - seeds[si].x;
            const dy = cy - seeds[si].y;
            const d = dx * dx + dy * dy;
            if (d < minDist) {
              minDist = d;
              nearest = si;
            }
          }
          cellOwner[row * cols + col] = nearest;
        }
      }

      // ── 4. Group grid cells by seed index ──────────────────────
      const regionCells: Map<number, { col: number; row: number }[]> = new Map();
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const owner = cellOwner[row * cols + col];
          if (!regionCells.has(owner)) regionCells.set(owner, []);
          regionCells.get(owner)!.push({ col, row });
        }
      }

      // ── 5. Draw hatching per region (region-level clipping) ─────
      for (const [seedIdx, cells] of regionCells) {
        const regionSpacing = p.random(lineSpacingMin, lineSpacingMax);
        const regionAngleJitter = p.random(-angleJitter, angleJitter);
        const angle = seedAngles[seedIdx] + regionAngleJitter;
        const color = colors[seedColorIdx[seedIdx]];
        setStroke(color, p);

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const perpX = -sinA;
        const perpY = cosA;

        // Compute region bounding box for hatching extent
        let rMinX = Infinity, rMinY = Infinity, rMaxX = -Infinity, rMaxY = -Infinity;
        for (const { col, row } of cells) {
          const x0 = marginX + col * cellSize;
          const y0 = marginY + row * cellSize;
          if (x0 < rMinX) rMinX = x0;
          if (y0 < rMinY) rMinY = y0;
          if (x0 + cellSize > rMaxX) rMaxX = x0 + cellSize;
          if (y0 + cellSize > rMaxY) rMaxY = y0 + cellSize;
        }

        // Clip to region shape (union of cells)
        ctx.save();
        ctx.beginPath();
        for (const { col, row } of cells) {
          const x0 = marginX + col * cellSize;
          const y0 = marginY + row * cellSize;
          const cw = Math.min(cellSize, marginX + drawW - x0);
          const ch = Math.min(cellSize, marginY + drawH - y0);
          if (cw > 0 && ch > 0) ctx.rect(x0, y0, cw, ch);
        }
        ctx.clip();

        // Half-diagonal of region bounding box for line extent
        const regionW = rMaxX - rMinX;
        const regionH = rMaxY - rMinY;
        const halfDiag = Math.sqrt(regionW * regionW + regionH * regionH) / 2;
        const regionCx = (rMinX + rMaxX) / 2;
        const regionCy = (rMinY + rMaxY) / 2;

        const numLines = Math.ceil((halfDiag * 2) / regionSpacing);

        for (let i = -numLines; i <= numLines; i++) {
          const offset = i * regionSpacing + p.random(-offsetJitter, offsetJitter);
          const lx = regionCx + perpX * offset;
          const ly = regionCy + perpY * offset;
          const jx1 = p.random(-perpJitter, perpJitter);
          const jy1 = p.random(-perpJitter, perpJitter);
          const jx2 = p.random(-perpJitter, perpJitter);
          const jy2 = p.random(-perpJitter, perpJitter);
          p.line(
            lx - cosA * halfDiag + jx1,
            ly - sinA * halfDiag + jy1,
            lx + cosA * halfDiag + jx2,
            ly + sinA * halfDiag + jy2
          );
        }

        ctx.restore();
      }

      // Restore outer blob clip
      ctx.restore();

      // ── 6. Debug: draw cell boundaries ──────────────────────────
      if (debug) {
        p.strokeWeight(0.2);
        p.stroke(200);
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const owner = cellOwner[row * cols + col];
            if (col < cols - 1 && cellOwner[row * cols + col + 1] !== owner) {
              const x = marginX + (col + 1) * cellSize;
              const y1 = marginY + row * cellSize;
              const y2 = y1 + cellSize;
              p.line(x, y1, x, y2);
            }
            if (row < rows - 1 && cellOwner[(row + 1) * cols + col] !== owner) {
              const y = marginY + (row + 1) * cellSize;
              const x1 = marginX + col * cellSize;
              const x2 = x1 + cellSize;
              p.line(x1, y, x2, y);
            }
          }
        }
      }
    };
  };

export default voronoi01;
