import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  numCurves: number;
  noiseScale: number;
  curveAmplitude: number;
  hatchSpacing: number;
  borderWidth: number;
  borderHatchSpacing: number;
  lineThickness: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "layered-landscape-01",
  title: "Layered Landscape 01",
  description:
    "Organic layered curves rasterized as vertical hatching strokes within a stadium clip mask",
  thumbnail: "/layered-landscape-01.png",
};

export const constants: Constants = {
  width: 700,
  height: 500,
  marginX: 30,
  marginY: 30,
  debug: false,
  numCurves: 6,
  noiseScale: 0.006,
  curveAmplitude: 0.15,
  hatchSpacing: 2.5,
  borderWidth: 20,
  borderHatchSpacing: 1.2,
  lineThickness: 0.35,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  numCurves: { min: 2, max: 12, step: 1 },
  noiseScale: { min: 0.001, max: 0.02, step: 0.001 },
  curveAmplitude: { min: 0.02, max: 0.4, step: 0.01 },
  hatchSpacing: { min: 1, max: 10, step: 0.5 },
  borderWidth: { min: 0, max: 60, step: 2 },
  borderHatchSpacing: { min: 0.5, max: 5, step: 0.25 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const layeredLandscape01 =
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

      const numCurves = Math.round(vars.numCurves ?? constants.numCurves);
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const curveAmplitude = vars.curveAmplitude ?? constants.curveAmplitude;
      const hatchSpacing = vars.hatchSpacing ?? constants.hatchSpacing;
      const borderWidth = vars.borderWidth ?? constants.borderWidth;
      const borderHatchSpacing = vars.borderHatchSpacing ?? constants.borderHatchSpacing;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("staedtlerPens");

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      // Stadium geometry
      const outerX = marginX, outerY = marginY;
      const outerW = drawW, outerH = drawH;
      const outerR = Math.min(outerW, outerH) / 2;

      const innerX = outerX + borderWidth;
      const innerY = outerY + borderWidth;
      const innerW = outerW - 2 * borderWidth;
      const innerH = outerH - 2 * borderWidth;
      const innerR = Math.max(0, outerR - borderWidth);

      p.strokeWeight(lineThickness);
      p.strokeCap(p.ROUND);

      // ── Border hatching (annular region between outer and inner stadium) ──
      if (borderWidth > 0 && innerW > 0 && innerH > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(outerX, outerY, outerW, outerH, outerR);
        ctx.roundRect(innerX, innerY, innerW, innerH, innerR);
        ctx.clip("evenodd");

        const borderColor = p.random(colors) as DotPen;
        setStroke(borderColor, p);

        for (let x = outerX; x <= outerX + outerW; x += borderHatchSpacing) {
          p.line(x, outerY, x, outerY + outerH);
        }
        ctx.restore();
      }

      // ── Interior landscape hatching ──────────────────────────────
      if (innerW <= 0 || innerH <= 0) return;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(innerX, innerY, innerW, innerH, innerR);
      ctx.clip();

      // Per-curve noise offsets and baselines (15 % to 85 % of inner height)
      const noiseOffsets = Array.from({ length: numCurves }, () => p.random(10000));
      const baselines = Array.from({ length: numCurves }, (_, i) =>
        innerY + innerH * (0.15 + (i / Math.max(numCurves - 1, 1)) * 0.7)
      );

      // numCurves+1 regions: index 0 = sky/background, 1..N = hills front to back
      // Assign colors by cycling through the pool
      const regionColors: DotPen[] = Array.from(
        { length: numCurves + 1 },
        (_, i) => colors[i % colors.length]
      );

      const getCurveY = (i: number, x: number): number =>
        baselines[i] +
        curveAmplitude * innerH * (p.noise(noiseOffsets[i] + x * noiseScale) - 0.5) * 2;

      const left = innerX;
      const right = innerX + innerW;
      const top = innerY;
      const bottom = innerY + innerH;

      // Vertical hatching — painter's algorithm per scanline
      for (let x = left; x <= right; x += hatchSpacing) {
        // Sort curve boundaries by y at this x
        const boundaries = Array.from({ length: numCurves }, (_, i) => ({
          y: getCurveY(i, x),
          idx: i,
        })).sort((a, b) => a.y - b.y);

        // Pre-activate curves that start above the clip top
        let activeRegion = -1; // -1 = background (region 0 in color array)
        for (const { y, idx } of boundaries) {
          if (y <= top) activeRegion = Math.max(activeRegion, idx);
        }

        let prevY = top;

        for (const { y, idx } of boundaries) {
          if (y <= top) continue;
          const clampedY = Math.min(y, bottom);
          if (clampedY > prevY) {
            setStroke(regionColors[activeRegion + 1], p);
            p.line(x, prevY, x, clampedY);
          }
          activeRegion = Math.max(activeRegion, idx);
          prevY = clampedY;
          if (prevY >= bottom) break;
        }

        // Final segment to clip bottom
        if (prevY < bottom) {
          setStroke(regionColors[activeRegion + 1], p);
          p.line(x, prevY, x, bottom);
        }
      }

      ctx.restore();
    };
  };

export default layeredLandscape01;
