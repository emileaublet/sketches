import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  cellSizeMin: number;
  cellSizeMax: number;
  lineSpacing: number;
  strokeWeight: number;
  noiseScale: number;
  emptyChance: number;
  colorPasses: number;
  passAngleOffset: number;
  flowStrength: number;
  flowScale: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "cell-hatching-01",
  title: "Cell Hatching 01",
  description: "Grid of cells, each filled with hatching lines at a noise-driven angle",
  thumbnail: "/cell-hatching-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  cellSizeMin: 16,
  cellSizeMax: 48,
  lineSpacing: 3,
  strokeWeight: 0.4,
  noiseScale: 0.003,
  emptyChance: 0.15,
  colorPasses: 2,
  passAngleOffset: 60,
  flowStrength: 8,
  flowScale: 0.012,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  cellSizeMin: { min: 8, max: 60, step: 2 },
  cellSizeMax: { min: 16, max: 120, step: 2 },
  lineSpacing: { min: 1, max: 12, step: 0.5 },
  strokeWeight: { min: 0.1, max: 1.5, step: 0.1 },
  noiseScale: { min: 0.001, max: 0.015, step: 0.001 },
  emptyChance: { min: 0, max: 0.5, step: 0.05 },
  colorPasses: { min: 1, max: 3, step: 1 },
  passAngleOffset: { min: 0, max: 90, step: 1 },
  flowStrength: { min: 0, max: 30, step: 1 },
  flowScale: { min: 0.002, max: 0.04, step: 0.001 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const cellHatching01Sketch =
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

      const cellSizeMin = vars.cellSizeMin ?? constants.cellSizeMin;
      const cellSizeMax = vars.cellSizeMax ?? constants.cellSizeMax;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const emptyChance = vars.emptyChance ?? constants.emptyChance;
      const colorPasses = vars.colorPasses ?? constants.colorPasses;
      const passAngleOffset = vars.passAngleOffset ?? constants.passAngleOffset;

      const palette = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = palette.length > 0 ? palette : all("staedtlerPens");

      const flowStrength = vars.flowStrength ?? constants.flowStrength;
      const flowScale = vars.flowScale ?? constants.flowScale;
      const flowOffX = p.random(1000);
      const flowOffY = p.random(1000);

      const noiseOffX = p.random(1000);
      const noiseOffY = p.random(1000);
      const colorNoiseOffX = p.random(10000);
      const colorNoiseOffY = p.random(10000);

      p.strokeWeight(strokeWeight);
      p.strokeCap(p.ROUND);

      const startX = marginX;
      const startY = marginY;

      let y = startY;
      while (y < startY + drawH) {
        const rowH = p.random(cellSizeMin, cellSizeMax);
        const actualRowH = Math.min(rowH, startY + drawH - y);
        if (actualRowH <= 0) break;

        let x = startX;
        while (x < startX + drawW) {
          const cellW = p.random(cellSizeMin, cellSizeMax);
          const actualCellW = Math.min(cellW, startX + drawW - x);
          if (actualCellW <= 0) break;

          if (p.random() < emptyChance) {
            x += cellW;
            continue;
          }

          const cx = x + actualCellW / 2;
          const cy = y + actualRowH / 2;

          const noiseVal = p.noise(
            noiseOffX + cx * noiseScale,
            noiseOffY + cy * noiseScale
          );
          const baseAngle = noiseVal * Math.PI;

          const colorNoise = p.noise(
            colorNoiseOffX + cx * noiseScale * 0.7,
            colorNoiseOffY + cy * noiseScale * 0.7
          );
          const colorIdx = Math.floor(colorNoise * colors.length) % colors.length;

          for (let pass = 0; pass < colorPasses; pass++) {
            const passColorIdx = (colorIdx + pass) % colors.length;
            setStroke(colors[passColorIdx], p);
            const angle = baseAngle + p.radians(pass * passAngleOffset);

            const ctx = p.drawingContext as CanvasRenderingContext2D;
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, actualCellW, actualRowH);
            ctx.clip();

            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            const perpX = -dy;
            const perpY = dx;
            const diag = Math.sqrt(actualCellW * actualCellW + actualRowH * actualRowH);
            const steps = Math.ceil(diag / lineSpacing) + 2;

            for (let s = -steps; s <= steps; s++) {
              const ox = cx + perpX * s * lineSpacing;
              const oy = cy + perpY * s * lineSpacing;
              const x0 = ox - dx * diag;
              const y0 = oy - dy * diag;
              const x1 = ox + dx * diag;
              const y1 = oy + dy * diag;
              const segCount = Math.max(3, Math.ceil(diag * 2 / 8));
              p.beginShape();
              for (let sv = 0; sv <= segCount; sv++) {
                const t = sv / segCount;
                const lx = x0 + (x1 - x0) * t;
                const ly = y0 + (y1 - y0) * t;
                const warp =
                  (p.noise(flowOffX + lx * flowScale, flowOffY + ly * flowScale) - 0.5) *
                  2 * flowStrength;
                p.curveVertex(lx + perpX * warp, ly + perpY * warp);
              }
              p.endShape();
            }

            ctx.restore();
          }

          x += cellW;
        }
        y += rowH;
      }
    };
  };

export default cellHatching01Sketch;
