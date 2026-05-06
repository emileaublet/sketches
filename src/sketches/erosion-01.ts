import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  bandHeightMin: number;
  bandHeightMax: number;
  noiseScale: number;
  noiseAmplitudeMin: number;
  noiseAmplitudeMax: number;
  lineSpacingMin: number;
  lineSpacingMax: number;
  lineThickness: number;
  columnWidthMin: number;
  columnWidthMax: number;
  columnGapMin: number;
  columnGapMax: number;
  erosionChance: number;
  endpointJitter: number;
  colorPasses: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "erosion-01",
  title: "Erosion 01",
  description:
    "Geological strata crossed by vertical columns — some sections eroded away",
  thumbnail: "/erosion-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  bandHeightMin: 15,
  bandHeightMax: 55,
  noiseScale: 0.008,
  noiseAmplitudeMin: 10,
  noiseAmplitudeMax: 28,
  lineSpacingMin: 1.2,
  lineSpacingMax: 4.0,
  lineThickness: 0.4,
  columnWidthMin: 12,
  columnWidthMax: 50,
  columnGapMin: 2,
  columnGapMax: 10,
  erosionChance: 0.25,
  endpointJitter: 1.0,
  colorPasses: 3,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  bandHeightMin: { min: 5, max: 100, step: 1 },
  bandHeightMax: { min: 10, max: 150, step: 1 },
  noiseScale: { min: 0.001, max: 0.03, step: 0.001 },
  noiseAmplitudeMin: { min: 0, max: 60, step: 1 },
  noiseAmplitudeMax: { min: 0, max: 80, step: 1 },
  lineSpacingMin: { min: 0.5, max: 8, step: 0.25 },
  lineSpacingMax: { min: 1, max: 12, step: 0.25 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  columnWidthMin: { min: 4, max: 80, step: 2 },
  columnWidthMax: { min: 8, max: 120, step: 2 },
  columnGapMin: { min: 0, max: 20, step: 1 },
  columnGapMax: { min: 0, max: 30, step: 1 },
  erosionChance: { min: 0, max: 0.8, step: 0.05 },
  endpointJitter: { min: 0, max: 5, step: 0.25 },
  colorPasses: { min: 1, max: 6, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const erosion01Sketch =
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

      const bandHeightMin = vars.bandHeightMin ?? constants.bandHeightMin;
      const bandHeightMax = vars.bandHeightMax ?? constants.bandHeightMax;
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const noiseAmplitudeMin = vars.noiseAmplitudeMin ?? constants.noiseAmplitudeMin;
      const noiseAmplitudeMax = vars.noiseAmplitudeMax ?? constants.noiseAmplitudeMax;
      const lineSpacingMin = vars.lineSpacingMin ?? constants.lineSpacingMin;
      const lineSpacingMax = vars.lineSpacingMax ?? constants.lineSpacingMax;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const columnWidthMin = vars.columnWidthMin ?? constants.columnWidthMin;
      const columnWidthMax = vars.columnWidthMax ?? constants.columnWidthMax;
      const columnGapMin = vars.columnGapMin ?? constants.columnGapMin;
      const columnGapMax = vars.columnGapMax ?? constants.columnGapMax;
      const erosionChance = vars.erosionChance ?? constants.erosionChance;
      const endpointJitter = vars.endpointJitter ?? constants.endpointJitter;
      const colorPasses = Math.round(vars.colorPasses ?? constants.colorPasses);
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");

      p.blendMode(p.MULTIPLY);
      p.strokeWeight(lineThickness);

      // ── 1. Build horizontal strata ──────────────────────────────
      interface Band {
        baseTop: number;
        baseBottom: number;
        noiseOffX: number;
        noiseOffY: number;
        noiseAmplitude: number;
        lineSpacing: number;
        bandColors: DotPen[];
      }

      const bands: Band[] = [];
      let cursor = marginY;

      while (cursor < marginY + drawH) {
        const bandHeight = p.random(bandHeightMin, bandHeightMax);
        const baseTop = cursor;
        const baseBottom = Math.min(cursor + bandHeight, marginY + drawH);

        const bandColors: DotPen[] = [];
        for (let cp = 0; cp < colorPasses; cp++) {
          bandColors.push(p.random(colors) as DotPen);
        }

        bands.push({
          baseTop,
          baseBottom,
          noiseOffX: p.random(1000),
          noiseOffY: p.random(1000),
          noiseAmplitude: p.random(noiseAmplitudeMin, noiseAmplitudeMax),
          lineSpacing: p.random(lineSpacingMin, lineSpacingMax),
          bandColors,
        });

        cursor = baseBottom;
      }

      // Noise-warped boundary y at a given x
      function boundaryY(
        baseY: number,
        noiseOffX: number,
        noiseOffY: number,
        x: number,
        amplitude: number,
      ): number {
        return (
          baseY +
          (p.noise(noiseOffX + x * noiseScale, noiseOffY) - 0.5) * 2 * amplitude
        );
      }

      // ── 2. Build vertical columns ───────────────────────────────
      const columns: { x0: number; x1: number }[] = [];
      let cx = marginX;
      while (cx < marginX + drawW) {
        const w = Math.min(p.random(columnWidthMin, columnWidthMax), marginX + drawW - cx);
        if (w > 2) columns.push({ x0: cx, x1: cx + w });
        const gap = p.random(columnGapMin, columnGapMax);
        cx += w + gap;
      }

      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const step = 2;

      // ── 3. Outer clip: deformed polygon (rounded rectangle) ─────
      const clipCx = marginX + drawW / 2;
      const clipCy = marginY + drawH / 2;
      const clipHalfW = drawW / 2;
      const clipHalfH = drawH / 2;
      const noiseOffClip = p.random(1000);
      const clipPts = 80;

      ctx.save();
      ctx.beginPath();
      for (let ci = 0; ci <= clipPts; ci++) {
        const a = (ci / clipPts) * Math.PI * 2;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const exp = 3;
        const superR = Math.pow(
          Math.pow(Math.abs(cosA), exp) + Math.pow(Math.abs(sinA), exp),
          -1 / exp,
        );
        const noiseFactor =
          1 +
          (p.noise(noiseOffClip + Math.cos(a) * 1.5, noiseOffClip + Math.sin(a) * 1.5) - 0.5) *
            2 * 0.06;
        const px = clipCx + cosA * clipHalfW * superR * noiseFactor;
        const py = clipCy + sinA * clipHalfH * superR * noiseFactor;
        if (ci === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      // ── 4. Draw: for each band, for each column ─────────────────
      for (let bi = 0; bi < bands.length; bi++) {
        const band = bands[bi];

        const topNoiseOffX = bi > 0 ? bands[bi - 1].noiseOffX : band.noiseOffX;
        const topNoiseOffY = bi > 0 ? bands[bi - 1].noiseOffY : band.noiseOffY;
        const topAmplitude = bi > 0 ? bands[bi - 1].noiseAmplitude : band.noiseAmplitude;

        // Clip to this band's noise-warped region
        ctx.save();
        ctx.beginPath();

        // Top boundary left → right
        for (let x = marginX; x <= marginX + drawW; x += step) {
          const y = bi === 0 ? marginY : boundaryY(band.baseTop, topNoiseOffX, topNoiseOffY, x, topAmplitude);
          if (x === marginX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        // Right edge down
        const rightX = marginX + drawW;
        const bottomRight = bi === bands.length - 1
          ? marginY + drawH
          : boundaryY(band.baseBottom, band.noiseOffX, band.noiseOffY, rightX, band.noiseAmplitude);
        ctx.lineTo(rightX, bottomRight);

        // Bottom boundary right → left
        for (let x = marginX + drawW; x >= marginX; x -= step) {
          const y = bi === bands.length - 1
            ? marginY + drawH
            : boundaryY(band.baseBottom, band.noiseOffX, band.noiseOffY, x, band.noiseAmplitude);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();

        // Bounding y range with amplitude padding
        const yTop = band.baseTop - noiseAmplitudeMax - 2;
        const yBottom = band.baseBottom + noiseAmplitudeMax + 2;

        for (const col of columns) {
          // Randomly skip this section (erosion)
          if (p.random() < erosionChance) continue;

          // Multiple color passes
          for (let cp = 0; cp < band.bandColors.length; cp++) {
            setStroke(band.bandColors[cp], p);

            // Per-pass spacing and y offset variation so passes don't align
            const passSpacing = band.lineSpacing * p.random(0.88, 1.15);
            const passYOffset = p.random(-passSpacing * 0.5, passSpacing * 0.5);

            let y = yTop + passYOffset;
            while (y < yBottom) {
              const jy1 = p.random(-endpointJitter, endpointJitter);
              const jy2 = p.random(-endpointJitter, endpointJitter);
              const jx1 = p.random(-endpointJitter * 0.3, endpointJitter * 0.3);
              const jx2 = p.random(-endpointJitter * 0.3, endpointJitter * 0.3);
              p.line(
                col.x0 + jx1, y + jy1,
                col.x1 + jx2, y + jy2,
              );
              y += passSpacing;
            }
          }
        }

        ctx.restore();
      }

      ctx.restore(); // outer clip
    };
  };

export default erosion01Sketch;
